import { createClient } from "https://esm.sh/@supabase/supabase-js@2.118.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json"
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceKey) {
      return new Response(JSON.stringify({ error: "Server configuration is incomplete" }), { status: 500, headers: corsHeaders });
    }

    const client = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });
    const { data, error } = await client.rpc("place_guest_order", {
      p_customer_name: payload?.customer_name,
      p_customer_phone: payload?.customer_phone,
      p_delivery_address: payload?.delivery_address,
      p_payment_method: payload?.payment_method,
      p_items: payload?.items
    });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: corsHeaders });
    }
    return new Response(JSON.stringify({ order_id: data }), { status: 200, headers: corsHeaders });
  } catch (_error) {
    return new Response(JSON.stringify({ error: "Invalid order request" }), { status: 400, headers: corsHeaders });
  }
});