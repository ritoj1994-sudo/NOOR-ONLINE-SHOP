import React, { useMemo, useState } from "react";
import {
  SafeAreaView, View, Text, TextInput, ScrollView, TouchableOpacity,
  StyleSheet, Alert, Linking
} from "react-native";
import { StatusBar } from "expo-status-bar";

const WHATSAPP = "01838345812";
const PRODUCTS = [
  { id: "1", name: "Wireless Earbuds", category: "ইলেকট্রনিক্স", price: 1250, emoji: "🎧", desc: "দৈনন্দিন ব্যবহারের জন্য" },
  { id: "2", name: "Bluetooth Speaker", category: "ইলেকট্রনিক্স", price: 1850, emoji: "🔊", desc: "পোর্টেবল স্পিকার" },
  { id: "3", name: "Smart Watch", category: "ইলেকট্রনিক্স", price: 2200, emoji: "⌚", desc: "স্মার্ট ও স্টাইলিশ" },
  { id: "4", name: "Men's T-Shirt", category: "পোশাক", price: 550, emoji: "👕", desc: "আরামদায়ক কটন টি-শার্ট" },
  { id: "5", name: "Ladies Bag", category: "ফ্যাশন", price: 1450, emoji: "👜", desc: "আকর্ষণীয় ডিজাইন" },
  { id: "6", name: "Sports Shoes", category: "জুতা", price: 1950, emoji: "👟", desc: "হালকা ও আরামদায়ক" },
  { id: "7", name: "LED Desk Lamp", category: "ঘর ও জীবন", price: 900, emoji: "💡", desc: "পড়ার টেবিলের জন্য" },
  { id: "8", name: "Backpack", category: "ব্যাগ", price: 1100, emoji: "🎒", desc: "স্কুল ও ভ্রমণের জন্য" }
];
const CATEGORIES = ["সব", "ইলেকট্রনিক্স", "পোশাক", "ফ্যাশন", "জুতা", "ঘর ও জীবন", "ব্যাগ"];
const money = n => "৳" + Number(n).toLocaleString("en-BD");

export default function App() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("সব");
  const [cart, setCart] = useState({});
  const [page, setPage] = useState("shop");
  const [customer, setCustomer] = useState({ name: "", phone: "", address: "" });

  const filtered = useMemo(() => PRODUCTS.filter(p =>
    (category === "সব" || p.category === category) &&
    (p.name.toLowerCase().includes(query.toLowerCase()) || p.category.includes(query))
  ), [query, category]);

  const count = Object.values(cart).reduce((a, b) => a + b, 0);
  const total = PRODUCTS.reduce((sum, p) => sum + p.price * (cart[p.id] || 0), 0);
  const add = id => setCart(old => ({ ...old, [id]: (old[id] || 0) + 1 }));
  const remove = id => setCart(old => {
    const next = { ...old };
    if ((next[id] || 0) <= 1) delete next[id]; else next[id] -= 1;
    return next;
  });

  const sendOrder = async () => {
    if (!count) return Alert.alert("কার্ট খালি", "অর্ডার করার আগে পণ্য যোগ করুন।");
    if (!customer.name.trim() || !customer.phone.trim() || !customer.address.trim()) {
      return Alert.alert("তথ্য প্রয়োজন", "নাম, ফোন নম্বর ও ঠিকানা লিখুন।");
    }
    const lines = PRODUCTS.filter(p => cart[p.id]).map(p =>
      `${p.name} x ${cart[p.id]} = ${money(p.price * cart[p.id])}`
    ).join("\n");
    const message = `NOOR ONLINE SHOP অর্ডার\nনাম: ${customer.name}\nফোন: ${customer.phone}\nঠিকানা: ${customer.address}\n\n${lines}\n\nমোট: ${money(total)}`;
    const url = `https://wa.me/88${WHATSAPP}?text=${encodeURIComponent(message)}`;
    try { await Linking.openURL(url); }
    catch { Alert.alert("সমস্যা", "WhatsApp খুলতে পারছি না। পরে আবার চেষ্টা করুন।"); }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <View>
          <Text style={styles.brand}>NOOR ONLINE SHOP</Text>
          <Text style={styles.tagline}>বাংলাদেশের অনলাইন শপ</Text>
        </View>
        <TouchableOpacity style={styles.cartBadge} onPress={() => setPage("cart")}>
          <Text style={styles.cartText}>🛒 {count}</Text>
        </TouchableOpacity>
      </View>

      {page === "shop" && <>
        <View style={styles.searchWrap}>
          <TextInput value={query} onChangeText={setQuery} placeholder="পণ্য খুঁজুন..." style={styles.search} />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categories}>
          {CATEGORIES.map(c => <TouchableOpacity key={c} onPress={() => setCategory(c)}
            style={[styles.chip, category === c && styles.chipActive]}>
            <Text style={[styles.chipText, category === c && styles.chipTextActive]}>{c}</Text>
          </TouchableOpacity>)}
        </ScrollView>
        <ScrollView contentContainerStyle={styles.productList}>
          <Text style={styles.sectionTitle}>জনপ্রিয় পণ্য</Text>
          <View style={styles.grid}>
            {filtered.map(p => <View key={p.id} style={styles.product}>
              <Text style={styles.emoji}>{p.emoji}</Text>
              <Text style={styles.productName}>{p.name}</Text>
              <Text style={styles.desc}>{p.desc}</Text>
              <Text style={styles.price}>{money(p.price)}</Text>
              <TouchableOpacity style={styles.addButton} onPress={() => add(p.id)}>
                <Text style={styles.addText}>কার্টে যোগ করুন</Text>
              </TouchableOpacity>
            </View>)}
          </View>
          {!filtered.length && <Text style={styles.empty}>কোনো পণ্য পাওয়া যায়নি।</Text>}
          <Text style={styles.note}>দ্রষ্টব্য: এখানে নমুনা পণ্য ও দাম দেওয়া আছে। বিক্রির আগে নিজের পণ্যের তথ্য বসাতে হবে।</Text>
        </ScrollView>
      </>}

      {page === "cart" && <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>আপনার কার্ট</Text>
        {PRODUCTS.filter(p => cart[p.id]).map(p => <View key={p.id} style={styles.cartRow}>
          <Text style={styles.cartItem}>{p.emoji} {p.name}{"\n"}{money(p.price)} × {cart[p.id]}</Text>
          <View style={styles.qty}>
            <TouchableOpacity onPress={() => remove(p.id)} style={styles.qtyBtn}><Text>−</Text></TouchableOpacity>
            <Text>{cart[p.id]}</Text>
            <TouchableOpacity onPress={() => add(p.id)} style={styles.qtyBtn}><Text>+</Text></TouchableOpacity>
          </View>
        </View>)}
        {!count && <Text style={styles.empty}>আপনার কার্ট খালি।</Text>}
        <Text style={styles.total}>সর্বমোট: {money(total)}</Text>
        {!!count && <>
          <Text style={styles.sectionTitle}>ডেলিভারির তথ্য</Text>
          <TextInput style={styles.field} placeholder="আপনার নাম" value={customer.name} onChangeText={v => setCustomer({...customer, name:v})} />
          <TextInput style={styles.field} placeholder="মোবাইল নম্বর" keyboardType="phone-pad" value={customer.phone} onChangeText={v => setCustomer({...customer, phone:v})} />
          <TextInput style={[styles.field, styles.address]} placeholder="সম্পূর্ণ ঠিকানা" multiline value={customer.address} onChangeText={v => setCustomer({...customer, address:v})} />
          <TouchableOpacity style={styles.orderButton} onPress={sendOrder}>
            <Text style={styles.orderText}>WhatsApp-এ অর্ডার পাঠান</Text>
          </TouchableOpacity>
        </>}
        <TouchableOpacity onPress={() => setPage("shop")} style={styles.backButton}><Text style={styles.backText}>← কেনাকাটা চালিয়ে যান</Text></TouchableOpacity>
      </ScrollView>}

      <View style={styles.footer}>
        <TouchableOpacity onPress={() => setPage("shop")}><Text style={styles.footerText}>🏠 হোম</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => setPage("cart")}><Text style={styles.footerText}>🛒 কার্ট ({count})</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => Linking.openURL(`https://wa.me/88${WHATSAPP}`)}><Text style={styles.footerText}>☎ যোগাযোগ</Text></TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:{flex:1,backgroundColor:"#f7f8fa"},
  header:{paddingHorizontal:18,paddingVertical:15,backgroundColor:"#fff",flexDirection:"row",justifyContent:"space-between",alignItems:"center",borderBottomWidth:1,borderColor:"#eee"},
  brand:{fontSize:20,fontWeight:"900",color:"#0b6b45"},tagline:{fontSize:12,color:"#777",marginTop:3},
  cartBadge:{backgroundColor:"#e9f5ee",padding:10,borderRadius:12},cartText:{fontWeight:"800",color:"#075c3a"},
  searchWrap:{paddingHorizontal:15,paddingTop:13},search:{backgroundColor:"#fff",borderWidth:1,borderColor:"#e5e7eb",borderRadius:12,paddingHorizontal:14,paddingVertical:11,fontSize:15},
  categories:{maxHeight:54,paddingLeft:12,marginTop:8},chip:{paddingHorizontal:14,paddingVertical:9,backgroundColor:"#fff",borderRadius:20,marginHorizontal:4,borderWidth:1,borderColor:"#e5e7eb"},
  chipActive:{backgroundColor:"#0b6b45",borderColor:"#0b6b45"},chipText:{color:"#444"},chipTextActive:{color:"#fff",fontWeight:"700"},
  productList:{padding:14,paddingBottom:28},sectionTitle:{fontSize:19,fontWeight:"800",color:"#20252b",marginBottom:12},grid:{flexDirection:"row",flexWrap:"wrap",justifyContent:"space-between"},
  product:{width:"48.3%",backgroundColor:"#fff",borderRadius:15,padding:12,marginBottom:12,borderWidth:1,borderColor:"#edf0f2"},
  emoji:{fontSize:42,textAlign:"center",paddingVertical:10},productName:{fontSize:15,fontWeight:"800",color:"#20252b"},desc:{fontSize:11,color:"#777",marginTop:4,minHeight:17},
  price:{fontSize:17,fontWeight:"900",color:"#0b6b45",marginTop:9},addButton:{backgroundColor:"#0b6b45",paddingVertical:10,borderRadius:9,marginTop:10,alignItems:"center"},
  addText:{color:"#fff",fontSize:12,fontWeight:"800"},empty:{textAlign:"center",color:"#777",padding:25},note:{fontSize:11,color:"#888",lineHeight:18,marginTop:8},
  content:{padding:16,paddingBottom:35},cartRow:{backgroundColor:"#fff",borderRadius:12,padding:12,marginBottom:9,flexDirection:"row",justifyContent:"space-between",alignItems:"center"},
  cartItem:{fontWeight:"700",lineHeight:23,color:"#333",flex:1},qty:{flexDirection:"row",alignItems:"center",gap:12},qtyBtn:{backgroundColor:"#edf5ef",paddingHorizontal:12,paddingVertical:7,borderRadius:8},
  total:{fontSize:20,fontWeight:"900",textAlign:"right",color:"#0b6b45",marginVertical:18},field:{backgroundColor:"#fff",borderWidth:1,borderColor:"#e3e6e8",borderRadius:10,padding:13,marginBottom:10,fontSize:14},
  address:{height:85,textAlignVertical:"top"},orderButton:{backgroundColor:"#16834f",padding:15,borderRadius:11,alignItems:"center",marginTop:4},orderText:{color:"#fff",fontWeight:"900",fontSize:15},
  backButton:{padding:14,alignItems:"center"},backText:{color:"#0b6b45",fontWeight:"700"},footer:{height:58,backgroundColor:"#fff",borderTopWidth:1,borderColor:"#eee",flexDirection:"row",justifyContent:"space-around",alignItems:"center"},
  footerText:{fontSize:13,fontWeight:"700",color:"#285b45"}
});
