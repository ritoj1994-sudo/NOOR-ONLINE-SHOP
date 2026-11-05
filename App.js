import React, {useEffect, useMemo, useState} from "react";
import {SafeAreaView, View, Text, TextInput, TouchableOpacity, FlatList, ScrollView, Alert, Linking, StyleSheet} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const ORDER_PHONE = "01838345812";
const CATEGORIES = ["সব", "ইলেকট্রনিক্স", "পুরুষদের পোশাক", "মহিলাদের পোশাক", "জুতা ও ব্যাগ", "কসমেটিকস", "ঘর ও রান্নাঘর", "খাবার ও গ্রোসারি", "শিশু ও খেলনা", "অন্যান্য"];
const STARTER = [
 {id:"1",name:"স্মার্ট ওয়াচ",price:"1200",category:"ইলেকট্রনিক্স",description:"দৈনন্দিন ব্যবহারের স্মার্ট ওয়াচ"},
 {id:"2",name:"টি-শার্ট",price:"450",category:"পুরুষদের পোশাক",description:"আরামদায়ক কটন টি-শার্ট"},
 {id:"3",name:"লেডিস ব্যাগ",price:"850",category:"জুতা ও ব্যাগ",description:"স্টাইলিশ দৈনন্দিন ব্যাগ"},
 {id:"4",name:"কিচেন সেট",price:"650",category:"ঘর ও রান্নাঘর",description:"রান্নাঘরের প্রয়োজনীয় সামগ্রী"},
 {id:"5",name:"বেবি টয়",price:"350",category:"শিশু ও খেলনা",description:"শিশুদের খেলনা"}
];
const money = n => "৳" + Number(n || 0).toLocaleString("en-BD");

export default function App() {
 const [products,setProducts] = useState(STARTER);
 const [cart,setCart] = useState({});
 const [category,setCategory] = useState("সব");
 const [search,setSearch] = useState("");
 const [page,setPage] = useState("shop");
 const [name,setName] = useState("");
 const [phone,setPhone] = useState("");
 const [address,setAddress] = useState("");
 const [payment,setPayment] = useState("ক্যাশ অন ডেলিভারি");
 const [pName,setPName] = useState("");
 const [pPrice,setPPrice] = useState("");
 const [pCategory,setPCategory] = useState("অন্যান্য");
 const [pDescription,setPDescription] = useState("");

 useEffect(()=>{(async()=>{
   try {
    const saved = await AsyncStorage.getItem("noor_products");
    const savedCart = await AsyncStorage.getItem("noor_cart");
    if(saved) setProducts(JSON.parse(saved));
    if(savedCart) setCart(JSON.parse(savedCart));
   } catch(e) {}
 })();},[]);
 useEffect(()=>{AsyncStorage.setItem("noor_products",JSON.stringify(products)).catch(()=>{});},[products]);
 useEffect(()=>{AsyncStorage.setItem("noor_cart",JSON.stringify(cart)).catch(()=>{});},[cart]);

 const visible = useMemo(()=>products.filter(p=>(category==="সব"||p.category===category) && (p.name+" "+p.category).toLowerCase().includes(search.toLowerCase())),[products,category,search]);
 const cartItems = products.filter(p=>cart[p.id]).map(p=>({...p,qty:cart[p.id]}));
 const total = cartItems.reduce((s,p)=>s+Number(p.price)*p.qty,0);
 const add = id=>setCart(c=>({...c,[id]:(c[id]||0)+1}));
 const change = (id,d)=>setCart(c=>{const n={...c}; n[id]=(n[id]||0)+d; if(n[id]<=0) delete n[id]; return n;});
 const order = async()=>{
   if(!name.trim()||!phone.trim()||!address.trim()){Alert.alert("তথ্য প্রয়োজন","নাম, ফোন নম্বর ও ঠিকানা লিখুন।");return;}
   if(!cartItems.length){Alert.alert("কার্ট খালি","আগে পণ্য যোগ করুন।");return;}
   const lines=cartItems.map(p=>`${p.name} x ${p.qty} = ${money(Number(p.price)*p.qty)}`).join("\n");
   const msg=`NOOR ONLINE SHOP অর্ডার\nনাম: ${name}\nফোন: ${phone}\nঠিকানা: ${address}\nপেমেন্ট: ${payment}\n\n${lines}\nমোট: ${money(total)}\n\nদয়া করে অর্ডার নিশ্চিত করুন।`;
   const url=`https://wa.me/88${ORDER_PHONE}?text=${encodeURIComponent(msg)}`;
   try { await Linking.openURL(url); } catch(e) { Alert.alert("সমস্যা","WhatsApp খুলতে পারেনি।"); }
 };
 const addProduct=()=>{
   if(!pName.trim()||!pPrice.trim()||isNaN(Number(pPrice))){Alert.alert("সঠিক তথ্য দিন","পণ্যের নাম ও সঠিক দাম লিখুন।");return;}
   setProducts(ps=>[{id:Date.now().toString(),name:pName.trim(),price:pPrice.trim(),category:pCategory,description:pDescription.trim()},...ps]);
   setPName("");setPPrice("");setPDescription("");Alert.alert("যোগ হয়েছে","পণ্যটি এই ফোনে সংরক্ষিত হয়েছে।");
 };
 const removeProduct=id=>Alert.alert("পণ্য মুছবেন?","এই পণ্যটি তালিকা থেকে মুছে যাবে।",[{text:"না"},{text:"মুছুন",style:"destructive",onPress:()=>setProducts(ps=>ps.filter(p=>p.id!==id))}]);

 const btn=(label,onPress,active=false)=> <TouchableOpacity onPress={onPress} style={[styles.btn,active&&styles.active]}><Text style={[styles.btnText,active&&{color:"#fff"}]}>{label}</Text></TouchableOpacity>;
 return <SafeAreaView style={styles.safe}>
  <View style={styles.header}><Text style={styles.logo}>NOOR ONLINE SHOP</Text><Text style={styles.sub}>বাংলাদেশের অনলাইন মার্কেটপ্লেস</Text></View>
  <View style={styles.nav}>{btn("শপ",()=>setPage("shop"),page==="shop")}{btn(`কার্ট (${Object.values(cart).reduce((a,b)=>a+b,0)})`,()=>setPage("cart"),page==="cart")}{btn("অ্যাডমিন",()=>setPage("admin"),page==="admin")}</View>
  {page==="shop"&&<><TextInput style={styles.input} placeholder="পণ্য খুঁজুন..." value={search} onChangeText={setSearch}/><ScrollView horizontal showsHorizontalScrollIndicator={false} style={{maxHeight:48}}>{CATEGORIES.map(c=><View key={c} style={{marginRight:6}}>{btn(c,()=>setCategory(c),category===c)}</View>)}</ScrollView>
   <FlatList data={visible} keyExtractor={p=>p.id} contentContainerStyle={{padding:12}} ListEmptyComponent={<Text style={styles.muted}>কোনো পণ্য পাওয়া যায়নি।</Text>} renderItem={({item})=><View style={styles.product}><View style={{flex:1}}><Text style={styles.productName}>{item.name}</Text><Text style={styles.muted}>{item.category}</Text><Text>{item.description}</Text><Text style={styles.price}>{money(item.price)}</Text></View>{btn("কার্টে যোগ",()=>add(item.id))}</View>}/>
  </>}
  {page==="cart"&&<ScrollView contentContainerStyle={{padding:14}}><Text style={styles.heading}>আপনার কার্ট</Text>{cartItems.map(p=><View key={p.id} style={styles.cartRow}><View style={{flex:1}}><Text style={styles.productName}>{p.name}</Text><Text>{money(p.price)} × {p.qty}</Text></View>{btn("−",()=>change(p.id,-1))}{btn("+",()=>change(p.id,1))}</View>)}<Text style={styles.total}>মোট: {money(total)}</Text>
   <Text style={styles.heading}>ডেলিভারির তথ্য</Text><TextInput style={styles.input} placeholder="আপনার নাম" value={name} onChangeText={setName}/><TextInput style={styles.input} placeholder="মোবাইল নম্বর" keyboardType="phone-pad" value={phone} onChangeText={setPhone}/><TextInput style={[styles.input,{height:78}]} placeholder="সম্পূর্ণ ঠিকানা ও জেলা" multiline value={address} onChangeText={setAddress}/>
   <Text style={styles.heading}>পেমেন্ট পদ্ধতি</Text>{["ক্যাশ অন ডেলিভারি","বিকাশ","নগদ"].map(x=><View key={x}>{btn(x,()=>setPayment(x),payment===x)}</View>)}<Text style={styles.muted}>বিকাশ/নগদের নম্বর দোকান কর্তৃপক্ষ যুক্ত করার পর পেমেন্ট করুন।</Text>{btn("WhatsApp-এ অর্ডার পাঠান",order,true)}
  </ScrollView>}
  {page==="admin"&&<ScrollView contentContainerStyle={{padding:14}}><Text style={styles.heading}>অ্যাডমিন — পণ্য ব্যবস্থাপনা</Text><Text style={styles.muted}>এটি বর্তমানে এই ডিভাইসের স্থানীয় অ্যাডমিন স্ক্রিন; অনলাইন লগইন নয়।</Text><TextInput style={styles.input} placeholder="পণ্যের নাম" value={pName} onChangeText={setPName}/><TextInput style={styles.input} placeholder="দাম (টাকা)" keyboardType="numeric" value={pPrice} onChangeText={setPPrice}/><TextInput style={styles.input} placeholder="বর্ণনা" value={pDescription} onChangeText={setPDescription}/><ScrollView horizontal>{CATEGORIES.filter(c=>c!=="সব").map(c=><View key={c} style={{marginRight:5}}>{btn(c,()=>setPCategory(c),pCategory===c)}</View>)}</ScrollView>{btn("নতুন পণ্য যোগ করুন",addProduct,true)}<Text style={styles.heading}>বর্তমান পণ্য ({products.length})</Text>{products.map(p=><View key={p.id} style={styles.cartRow}><View style={{flex:1}}><Text style={styles.productName}>{p.name}</Text><Text>{money(p.price)} · {p.category}</Text></View>{btn("মুছুন",()=>removeProduct(p.id))}</View>)}</ScrollView>}
  <Text style={styles.footer}>সারা বাংলাদেশে কুরিয়ার ডেলিভারি • অর্ডার: {ORDER_PHONE}</Text>
 </SafeAreaView>;
}
const styles=StyleSheet.create({
 safe:{flex:1,backgroundColor:"#f6f7f8"},header:{backgroundColor:"#123b2b",padding:18,alignItems:"center"},logo:{fontSize:22,fontWeight:"bold",color:"#fff"},sub:{color:"#dce9e0",marginTop:4},nav:{flexDirection:"row",justifyContent:"space-around",padding:8,backgroundColor:"#e7eee9"},btn:{backgroundColor:"#fff",borderWidth:1,borderColor:"#cbd5ce",borderRadius:8,paddingVertical:9,paddingHorizontal:12,marginVertical:4,alignItems:"center"},active:{backgroundColor:"#17633f",borderColor:"#17633f"},btnText:{fontWeight:"600",color:"#183b2b"},input:{backgroundColor:"#fff",borderWidth:1,borderColor:"#d7ded9",borderRadius:8,padding:12,margin:8},product:{backgroundColor:"#fff",padding:14,borderRadius:10,marginBottom:10,flexDirection:"row",alignItems:"center",gap:10},productName:{fontSize:16,fontWeight:"bold",color:"#182a20"},muted:{color:"#64746a",fontSize:12,marginVertical:3},price:{fontSize:17,fontWeight:"bold",color:"#17633f",marginTop:5},heading:{fontSize:19,fontWeight:"bold",marginVertical:12,color:"#123b2b"},cartRow:{backgroundColor:"#fff",padding:12,borderRadius:8,marginVertical:5,flexDirection:"row",alignItems:"center",gap:6},total:{fontSize:20,fontWeight:"bold",textAlign:"right",marginVertical:12},footer:{textAlign:"center",fontSize:11,color:"#65736a",padding:8}
});
