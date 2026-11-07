import { createClient } from "https://esm.sh/@supabase/supabase-js@2.118.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json"
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: corsHeaders });

async function sha256(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const payload = await req.json();
    const orderId = String(payload?.order_id ?? "").trim();
    const phone = String(payload?.customer_phone ?? "").trim();
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(orderId) ||
        phone.length < 6 || phone.length > 30) {
      return json({ error: "অর্ডার নম্বর ও ফোন নম্বর সঠিকভাবে লিখুন।" }, 400);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceKey) return json({ error: "Server configuration is incomplete" }, 500);

    const client = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    const clientIp = req.headers.get("cf-connecting-ip") || req.headers.get("x-real-ip") || forwarded || "unknown";
    const ipHash = await sha256(clientIp + ":" + serviceKey.slice(0, 12));
    const since = new Date(Date.now() - 60_000).toISOString();

    const { count, error: rateError } = await client
      .from("order_lookup_attempts")
      .select("id", { count: "exact", head: true })
      .eq("ip_hash", ipHash)
      .gte("created_at", since);
    if (rateError) return json({ error: "অনুরোধ যাচাই করা যাচ্ছে না। পরে চেষ্টা করুন।" }, 503);
    if ((count ?? 0) >= 10) return json({ error: "অনেকবার চেষ্টা হয়েছে। এক মিনিট পর আবার চেষ্টা করুন।" }, 429);

    const { error: logError } = await client.from("order_lookup_attempts").insert({ ip_hash: ipHash });
    if (logError) return json({ error: "অনুরোধ সংরক্ষণ করা যায়নি। পরে চেষ্টা করুন।" }, 503);

    await client.from("order_lookup_attempts").delete().lt("created_at", new Date(Date.now() - 86_400_000).toISOString());

    const { data, error } = await client
      .from("orders")
      .select("id,customer_name,customer_phone,payment_method,payment_status,order_status,total,created_at,order_items(product_name,quantity,unit_price,line_total)")
      .eq("id", orderId)
      .eq("customer_phone", phone)
      .maybeSingle();

    if (error) return json({ error: "অর্ডারের তথ্য পাওয়া যাচ্ছে না। পরে চেষ্টা করুন।" }, 503);
    if (!data) return json({ error: "এই অর্ডার নম্বর ও ফোন নম্বর মেলেনি। আবার যাচাই করুন।" }, 404);

    return json({ order: data });
  } catch (_error) {
    return json({ error: "তথ্য সঠিকভাবে পাঠানো হয়নি। আবার চেষ্টা করুন।" }, 400);
  }
});