import React, {useEffect,useMemo,useState} from "react";
import {SafeAreaView,View,Text,TextInput,TouchableOpacity,FlatList,ScrollView,Alert,ActivityIndicator,StyleSheet,KeyboardAvoidingView,Platform,Image} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {supabase} from "./lib/supabase";
import * as ImagePicker from "expo-image-picker";

const ADMIN_EMAIL="Ritoj1994@gmail.com";
const money=n=>"৳"+Number(n||0).toLocaleString("en-BD");
const err=e=>e?.message||"আবার চেষ্টা করুন।";

export default function App(){
 const [products,setProducts]=useState([]),[categories,setCategories]=useState([]),[cart,setCart]=useState({});
 const [category,setCategory]=useState("সব"),[search,setSearch]=useState(""),[page,setPage]=useState("shop");
 const [loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[notice,setNotice]=useState("");
 const [name,setName]=useState(""),[phone,setPhone]=useState(""),[address,setAddress]=useState(""),[payment,setPayment]=useState("cod"),[paymentReference,setPaymentReference]=useState("");
 const [pName,setPName]=useState(""),[pPrice,setPPrice]=useState(""),[pStock,setPStock]=useState("10"),[pCategory,setPCategory]=useState(""),[pDesc,setPDesc]=useState(""),[pImage,setPImage]=useState(""),[pImageAsset,setPImageAsset]=useState(null);
 const [email,setEmail]=useState(ADMIN_EMAIL),[password,setPassword]=useState(""),[session,setSession]=useState(null),[authMode,setAuthMode]=useState("signup"),[orders,setOrders]=useState([]);
 const [editProductId,setEditProductId]=useState(""),[editProductName,setEditProductName]=useState(""),[editProductPrice,setEditProductPrice]=useState(""),[editProductStock,setEditProductStock]=useState(""),[editProductDesc,setEditProductDesc]=useState("");
 const [trackId,setTrackId]=useState(""),[trackPhone,setTrackPhone]=useState(""),[trackedOrder,setTrackedOrder]=useState(null),[trackBusy,setTrackBusy]=useState(false);

 const loadShop=async()=>{
  setLoading(true);
  const [p,c]=await Promise.all([
   supabase.from("products").select("id,name,description,price,category_id,image_url,stock_quantity,is_active").eq("is_active",true).order("created_at",{ascending:false}),
   supabase.from("categories").select("id,name,slug").eq("is_active",true).order("sort_order")
  ]);
  if(p.error)setNotice("পণ্য লোড হয়নি: "+err(p.error));else setProducts(p.data||[]);
  if(!c.error){setCategories(c.data||[]);setPCategory(old=>old||c.data?.[0]?.id||"");}
  setLoading(false);
 };
 useEffect(()=>{
  loadShop();
  AsyncStorage.getItem("noor_cart").then(v=>{if(v)setCart(JSON.parse(v));}).catch(()=>{});
  supabase.auth.getSession().then(({data})=>setSession(data.session));
  const {data:{subscription}}=supabase.auth.onAuthStateChange((_e,s)=>setSession(s));
  return ()=>subscription.unsubscribe();
 },[]);
 useEffect(()=>{AsyncStorage.setItem("noor_cart",JSON.stringify(cart)).catch(()=>{});},[cart]);

 const visible=useMemo(()=>products.filter(p=>{
  const cn=categories.find(c=>c.id===p.category_id)?.name||"";
  return (category==="সব"||cn===category)&&(p.name+" "+cn+" "+(p.description||"")).toLowerCase().includes(search.toLowerCase());
 }),[products,categories,category,search]);
 const items=products.filter(p=>cart[p.id]).map(p=>({...p,qty:cart[p.id]}));
 const total=items.reduce((s,p)=>s+Number(p.price)*p.qty,0),count=Object.values(cart).reduce((a,b)=>a+b,0);
 const add=p=>{if(p.stock_quantity<=(cart[p.id]||0)){Alert.alert("স্টক শেষ","এই পণ্যের আর স্টক নেই।");return;}setCart(c=>({...c,[p.id]:(c[p.id]||0)+1}));};
 const change=(id,d)=>setCart(c=>{const n={...c},v=(n[id]||0)+d;if(v<=0)delete n[id];else n[id]=v;return n;});

 const placeOrder=async()=>{
  if(!name.trim()||!phone.trim()||!address.trim()){Alert.alert("তথ্য প্রয়োজন","নাম, ফোন ও সম্পূর্ণ ঠিকানা লিখুন।");return;}
  if(!items.length){Alert.alert("কার্ট খালি","আগে পণ্য যোগ করুন।");return;}
  if(payment!=="cod"&&!paymentReference.trim()){Alert.alert("Transaction ID প্রয়োজন","বিকাশ/নগদ পেমেন্টের Transaction ID লিখুন।");return;}
  setBusy(true);
  const {data,error}=await supabase.functions.invoke("place-order",{body:{customer_name:name.trim(),customer_phone:phone.trim(),delivery_address:address.trim(),payment_method:payment,payment_reference:paymentReference.trim(),items:items.map(p=>({product_id:p.id,quantity:p.qty}))}});
  setBusy(false);
  if(error||data?.error){Alert.alert("অর্ডার হয়নি",data?.error||err(error));return;}
  const orderId=data?.order_id;
  setCart({});setName("");setPhone("");setAddress("");setPaymentReference("");setPage("shop");
  setNotice("অর্ডার সফল! অর্ডার নম্বর: "+orderId);
  Alert.alert("অর্ডার সফল","আপনার অর্ডার নম্বর:\n"+orderId+"\nদোকান কর্তৃপক্ষ যোগাযোগ করবে।");
  loadShop();
 };
 const resendConfirmation=async()=>{
  if(busy)return;
  setBusy(true);
  setNotice("ভেরিফিকেশন ইমেইল পাঠানো হচ্ছে...");
  try{
   const {data,error}=await supabase.auth.resend({type:"signup",email:ADMIN_EMAIL,options:{emailRedirectTo:"https://ritoj1994-sudo.github.io/NOOR-ONLINE-SHOP/"}});
   if(error)throw error;
   setNotice("ইমেইল পাঠানোর অনুরোধ সফল হয়েছে। Gmail Inbox, Spam ও Promotions দেখুন।");
  }catch(e){
   setNotice("ইমেইল পাঠানো যায়নি: "+err(e));
  }finally{
   setBusy(false);
  }
 };
 const adminAuth=async()=>{
  if(email.trim().toLowerCase()!==ADMIN_EMAIL.toLowerCase()){setNotice("অনুমতি নেই: নির্ধারিত অ্যাডমিন ইমেইল ব্যবহার করুন।");return;}
  if(password.length<6){setNotice("পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।");return;}
  setBusy(true);
  const r=authMode==="signup"?await supabase.auth.signUp({email:ADMIN_EMAIL,password,options:{emailRedirectTo:"https://ritoj1994-sudo.github.io/NOOR-ONLINE-SHOP/"}}):await supabase.auth.signInWithPassword({email:ADMIN_EMAIL,password});
  setBusy(false);
  if(r.error){setNotice("অ্যাকাউন্ট তৈরি/লগইন হয়নি: "+err(r.error));return;}
  if(authMode==="signup"&&!r.data.session)setNotice("অ্যাকাউন্ট তৈরির অনুরোধ পাঠানো হয়েছে। ইমেইলে verification link এলে সেটি খুলুন, তারপর লগইন করুন।");
  else {setSession(r.data.session);setNotice("অ্যাডমিন লগইন সফল হয়েছে।");}
 };
 const chooseProductImage=async()=>{
  const result=await ImagePicker.launchImageLibraryAsync({mediaTypes:["images"],allowsEditing:true,aspect:[1,1],quality:0.8});
  if(!result.canceled&&result.assets?.[0])setPImageAsset(result.assets[0]);
 };
 const uploadProductImage=async(productId,asset)=>{
  const response=await fetch(asset.uri);
  const fileData=await response.arrayBuffer();
  const mime=asset.mimeType||"image/jpeg";
  const ext=(mime.split("/")[1]||"jpg").replace("jpeg","jpg");
  const path=productId+"/"+Date.now()+"."+ext;
  const {error:uploadError}=await supabase.storage.from("product-images").upload(path,fileData,{contentType:mime,upsert:true});
  if(uploadError)throw uploadError;
  const {data}=supabase.storage.from("product-images").getPublicUrl(path);
  const {error:updateError}=await supabase.from("products").update({image_url:data.publicUrl}).eq("id",productId);
  if(updateError)throw updateError;
 };
 const addPhotoToExistingProduct=async productId=>{
  const result=await ImagePicker.launchImageLibraryAsync({mediaTypes:["images"],allowsEditing:true,aspect:[1,1],quality:0.8});
  if(result.canceled||!result.assets?.[0])return;
  setBusy(true);
  try{await uploadProductImage(productId,result.assets[0]);Alert.alert("সফল","পণ্যের ছবি আপলোড হয়েছে।");await loadShop();}
  catch(e){Alert.alert("ছবি আপলোড হয়নি",err(e));}
  finally{setBusy(false);}
 };
 const addProduct=async()=>{
  const price=Number(pPrice),stock=Number(pStock);
  if(!pName.trim()||!Number.isFinite(price)||price<=0||!Number.isInteger(stock)||stock<0||!pCategory){Alert.alert("সঠিক তথ্য দিন","পণ্যের নাম, দাম, স্টক ও ক্যাটাগরি দিন।");return;}
  setBusy(true);
  const {data:created,error}=await supabase.from("products").insert({name:pName.trim(),description:pDesc.trim(),price,stock_quantity:stock,category_id:pCategory,image_url:pImage.trim()||null,is_active:true}).select("id").single();
  if(error){setBusy(false);Alert.alert("পণ্য যোগ হয়নি",err(error));return;}
  let photoMessage="";
  if(pImageAsset){try{await uploadProductImage(created.id,pImageAsset);}catch(e){photoMessage=" পণ্য যোগ হয়েছে, তবে ছবি আপলোড হয়নি: "+err(e);}}
  setBusy(false);
  setPName("");setPPrice("");setPStock("10");setPDesc("");setPImage("");setPImageAsset(null);Alert.alert("সফল","পণ্য অনলাইন শপে যুক্ত হয়েছে।"+photoMessage);loadShop();
 };
 const startEditProduct=p=>{setEditProductId(p.id);setEditProductName(p.name||"");setEditProductPrice(String(p.price??""));setEditProductStock(String(p.stock_quantity??""));setEditProductDesc(p.description||"");};
 const saveProductEdits=async()=>{
  const price=Number(editProductPrice),stock=Number(editProductStock);
  if(!editProductName.trim()||!Number.isFinite(price)||price<=0||!Number.isInteger(stock)||stock<0){Alert.alert("সঠিক তথ্য দিন","নাম, সঠিক দাম ও ০ বা তার বেশি পূর্ণসংখ্যার স্টক লিখুন।");return;}
  setBusy(true);
  const {error}=await supabase.from("products").update({name:editProductName.trim(),price,stock_quantity:stock,description:editProductDesc.trim()}).eq("id",editProductId);
  setBusy(false);
  if(error){Alert.alert("আপডেট হয়নি",err(error));return;}
  setEditProductId("");Alert.alert("সফল","পণ্যের তথ্য আপডেট হয়েছে।");await loadShop();
 };
 const hideProduct=async id=>{const {error}=await supabase.from("products").update({is_active:false}).eq("id",id);if(error)Alert.alert("সমস্যা",err(error));else loadShop();};
 const loadOrders=async()=>{
  setBusy(true);
  const {data,error}=await supabase.from("orders").select("id,customer_name,customer_phone,delivery_address,payment_method,payment_reference,payment_status,order_status,total,created_at,order_items(product_name,quantity)").order("created_at",{ascending:false}).limit(100);
  setBusy(false);if(error)Alert.alert("অর্ডার লোড হয়নি",err(error));else setOrders(data||[]);
 };
 const updatePaymentStatus=async(id,status)=>{
  const {error}=await supabase.from("orders").update({payment_status:status}).eq("id",id);
  if(error)Alert.alert("পেমেন্ট স্ট্যাটাস আপডেট হয়নি",err(error));else setOrders(a=>a.map(o=>o.id===id?{...o,payment_status:status}:o));
 };
 const updateStatus=async(id,status)=>{
  const {error}=await supabase.from("orders").update({order_status:status}).eq("id",id);
  if(error)Alert.alert("আপডেট হয়নি",err(error));else setOrders(a=>a.map(o=>o.id===id?{...o,order_status:status}:o));
 };
 const lookupOrder=async()=>{
  if(!trackId.trim()||!trackPhone.trim()){Alert.alert("তথ্য প্রয়োজন","অর্ডার নম্বর ও অর্ডারের সময় দেওয়া ফোন নম্বর লিখুন।");return;}
  setTrackBusy(true);setTrackedOrder(null);
  const {data,error}=await supabase.functions.invoke("lookup-order",{body:{order_id:trackId.trim(),customer_phone:trackPhone.trim()}});
  setTrackBusy(false);
  if(error||data?.error){let message=data?.error||err(error);try{const body=await error?.context?.json?.();if(body?.error)message=body.error;}catch{}Alert.alert("অর্ডার পাওয়া যায়নি",message);return;}
  setTrackedOrder(data?.order||null);
 };
 const btn=(label,fn,active=false,disabled=false)=><TouchableOpacity onPress={fn} disabled={disabled} style={[s.btn,active&&s.active,disabled&&{opacity:.45}]}><Text style={[s.btnText,active&&{color:"#fff"}]}>{label}</Text></TouchableOpacity>;
 const field=(v,fn,ph,extra={})=><TextInput style={s.input} value={v} onChangeText={fn} placeholder={ph} placeholderTextColor="#7b887f" {...extra}/>;
 const statusLabel=v=>({pending:"নতুন",confirmed:"নিশ্চিত",processing:"প্রস্তুত হচ্ছে",shipped:"পাঠানো হয়েছে",delivered:"সম্পন্ন",cancelled:"বাতিল"}[v]||v);

 return <SafeAreaView style={s.safe}>
  <View style={s.header}><View style={s.brandRow}><Image source={{uri:"https://ritoj1994-sudo.github.io/NOOR-ONLINE-SHOP/noor-icon.svg"}} style={s.brandIcon} resizeMode="contain"/><View><Text style={s.logo}>NOOR ONLINE SHOP</Text><Text style={s.sub}>বাংলাদেশের অনলাইন মার্কেটপ্লেস</Text></View></View></View>
  <View style={s.nav}>{btn("শপ",()=>setPage("shop"),page==="shop")}{btn("কার্ট ("+count+")",()=>setPage("cart"),page==="cart")}{btn("অর্ডার ট্র্যাক",()=>setPage("track"),page==="track")}{btn("অ্যাডমিন",()=>setPage("admin"),page==="admin")}</View>
  {!!notice&&<TouchableOpacity style={s.notice} onPress={()=>setNotice("")}><Text style={s.noticeText}>{notice} ×</Text></TouchableOpacity>}

  {page==="shop"&&<View style={{flex:1}}>
   {field(search,setSearch,"পণ্য খুঁজুন...")}
   <ScrollView horizontal style={{maxHeight:48,paddingHorizontal:8}}>{["সব",...categories.map(c=>c.name)].map(c=><View key={c} style={{marginRight:5}}>{btn(c,()=>setCategory(c),category===c)}</View>)}</ScrollView>
   {loading?<ActivityIndicator size="large" color="#17633f" style={{marginTop:40}}/>:
   <FlatList data={visible} keyExtractor={p=>p.id} contentContainerStyle={{padding:12}} onRefresh={loadShop} refreshing={loading}
    ListEmptyComponent={<View style={s.empty}><Text style={s.heading}>এখনো কোনো পণ্য নেই</Text><Text style={s.muted}>অ্যাডমিন লগইন করে পণ্য যোগ করুন।</Text></View>}
    renderItem={({item})=><View style={s.product}>{!!item.image_url&&<Image source={{uri:item.image_url}} style={s.productImage}/>}<View style={{flex:1}}><Text style={s.productName}>{item.name}</Text><Text style={s.muted}>{categories.find(c=>c.id===item.category_id)?.name||"অন্যান্য"}</Text><Text>{item.description}</Text><Text style={s.price}>{money(item.price)}</Text><Text style={s.muted}>স্টক: {item.stock_quantity}</Text></View>{btn("কার্টে যোগ",()=>add(item),false,item.stock_quantity<1)}</View>}/>}
  </View>}

  {page==="cart"&&<ScrollView contentContainerStyle={{padding:14}}>
   <Text style={s.heading}>আপনার কার্ট</Text>
   {!items.length?<Text style={s.muted}>কার্টে কোনো পণ্য নেই।</Text>:items.map(p=><View key={p.id} style={s.cartRow}><View style={{flex:1}}><Text style={s.productName}>{p.name}</Text><Text>{money(p.price)} × {p.qty}</Text></View>{btn("−",()=>change(p.id,-1))}{btn("+",()=>add(p))}</View>)}
   <Text style={s.total}>মোট: {money(total)}</Text><Text style={s.heading}>ডেলিভারির তথ্য</Text>
   {field(name,setName,"আপনার নাম")}{field(phone,setPhone,"মোবাইল নম্বর",{keyboardType:"phone-pad"})}{field(address,setAddress,"সম্পূর্ণ ঠিকানা ও জেলা",{multiline:true})}
   <Text style={s.heading}>পেমেন্ট পদ্ধতি</Text>
   {[["cod","ক্যাশ অন ডেলিভারি"],["bkash","বিকাশ"],["nagad","নগদ"]].map(([v,l])=><View key={v}>{btn(l,()=>setPayment(v),payment===v)}</View>)}
   {payment!=="cod"&&<View style={{backgroundColor:"#e8f4ec",padding:12,borderRadius:8,marginVertical:8}}><Text style={s.productName}>{payment==="bkash"?"বিকাশ পেমেন্ট":"নগদ পেমেন্ট"}</Text><Text style={{fontSize:18,fontWeight:"bold",color:"#17633f",marginVertical:5}}>01838345812</Text><Text style={s.muted}>এই নম্বরে {payment==="bkash"?"বিকাশ":"নগদ"} দিয়ে পেমেন্ট করুন। অর্ডার দেওয়ার পর অর্ডার নম্বর ও পেমেন্টের Transaction ID সংরক্ষণ করে রাখুন। দোকান কর্তৃপক্ষ পেমেন্ট যাচাই করে যোগাযোগ করবে।</Text><Text style={s.muted}>এটি ম্যানুয়াল পেমেন্ট; সরাসরি অনলাইন পেমেন্ট গেটওয়ে এখনো যুক্ত হয়নি।</Text>{field(paymentReference,setPaymentReference,"Transaction ID লিখুন",{autoCapitalize:"characters"})}</View> }
   {btn(busy?"অর্ডার পাঠানো হচ্ছে...":"অর্ডার নিশ্চিত করুন",placeOrder,true,busy||!items.length)}
  </ScrollView>}

  {page==="track"&&<ScrollView contentContainerStyle={{padding:16}}>
   <Text style={s.heading}>আপনার অর্ডার খুঁজুন</Text>
   <Text style={s.muted}>অর্ডার করার পর পাওয়া সম্পূর্ণ অর্ডার নম্বর এবং অর্ডারের সময় দেওয়া ফোন নম্বর লিখুন।</Text>
   {field(trackId,setTrackId,"অর্ডার নম্বর (সম্পূর্ণ)",{autoCapitalize:"none"})}
   {field(trackPhone,setTrackPhone,"অর্ডারের ফোন নম্বর",{keyboardType:"phone-pad"})}
   {btn(trackBusy?"খোঁজা হচ্ছে...":"অর্ডারের অবস্থা দেখুন",lookupOrder,true,trackBusy)}
   {!!trackedOrder&&<View style={s.orderCard}>
    <Text style={s.heading}>অর্ডারের তথ্য</Text>
    <Text style={s.productName}>অর্ডার: {trackedOrder.id}</Text>
    <Text>গ্রাহক: {trackedOrder.customer_name}</Text>
    <Text>অর্ডার অবস্থা: {({pending:"নতুন অর্ডার",confirmed:"নিশ্চিত",processing:"প্রস্তুত হচ্ছে",shipped:"পাঠানো হয়েছে",delivered:"ডেলিভারি সম্পন্ন",cancelled:"বাতিল"}[trackedOrder.order_status]||trackedOrder.order_status)}</Text>
    <Text>পেমেন্ট: {({cod:"ক্যাশ অন ডেলিভারি",bkash:"বিকাশ",nagad:"নগদ"}[trackedOrder.payment_method]||trackedOrder.payment_method)} · {({pending:"অপেক্ষমাণ",paid:"পরিশোধিত",failed:"ব্যর্থ",refunded:"ফেরত"}[trackedOrder.payment_status]||trackedOrder.payment_status)}</Text>
    {!!trackedOrder.payment_reference&&<Text>Transaction ID: {trackedOrder.payment_reference}</Text>}
    <Text style={s.heading}>পণ্যের তালিকা</Text>
    {(trackedOrder.order_items||[]).map((it,i)=><Text key={i} style={s.muted}>{it.product_name} × {it.quantity} — {money(it.line_total)}</Text>)}
    <Text style={s.total}>মোট: {money(trackedOrder.total)}</Text>
    <Text style={s.muted}>অর্ডারের তারিখ: {new Date(trackedOrder.created_at).toLocaleString("bn-BD")}</Text>
   </View>}
  </ScrollView>}
  {page==="admin"&&<KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS==="ios"?"padding":undefined}>
   {(!session||session.user.email?.toLowerCase()!==ADMIN_EMAIL.toLowerCase())?<ScrollView contentContainerStyle={{padding:16}}>
    <Text style={s.heading}>{authMode==="signup"?"প্রথমবার অ্যাডমিন অ্যাকাউন্ট তৈরি করুন":"অ্যাডমিন লগইন"}</Text><Text style={s.muted}>নির্ধারিত ইমেইল: {ADMIN_EMAIL}</Text><Text style={{color:"#17633f",fontWeight:"bold",marginVertical:8}}>{authMode==="signup"?"নতুন অ্যাকাউন্ট তৈরি করার মোড চালু আছে।":"আগের অ্যাকাউন্ট দিয়ে লগইন করুন।"}</Text>
    {field(email,setEmail,"অ্যাডমিন ইমেইল",{keyboardType:"email-address",autoCapitalize:"none"})}
    {field(password,setPassword,"পাসওয়ার্ড",{secureTextEntry:true})}
    {btn(busy?"অপেক্ষা করুন...":authMode==="login"?"লগইন করুন":"অ্যাডমিন অ্যাকাউন্ট তৈরি করুন",adminAuth,true,busy)}
    {btn(authMode==="login"?"প্রথমবার? অ্যাকাউন্ট তৈরি করুন":"আগে অ্যাকাউন্ট আছে? লগইন",()=>{setNotice("");setAuthMode(v=>v==="login"?"signup":"login");})}
    {authMode==="signup"&&btn("ভেরিফিকেশন ইমেইল আবার পাঠান",resendConfirmation,false,busy)}
    <Text style={s.muted}>প্রথমবার অ্যাকাউন্ট তৈরি করে ইমেইল যাচাই করুন।</Text>
   </ScrollView>:<ScrollView contentContainerStyle={{padding:14}}>
    <Text style={s.heading}>অ্যাডমিন প্যানেল</Text><Text style={s.muted}>লগইন: {session.user.email}</Text>
    <View style={s.row}>{btn("অর্ডার দেখুন",loadOrders)}{btn("লগআউট",async()=>{await supabase.auth.signOut();setSession(null);setOrders([]);})}</View>
    <Text style={s.heading}>নতুন পণ্য যোগ করুন</Text>
    {field(pName,setPName,"পণ্যের নাম")}{field(pPrice,setPPrice,"দাম (টাকা)",{keyboardType:"decimal-pad"})}{field(pStock,setPStock,"স্টক সংখ্যা",{keyboardType:"number-pad"})}{field(pDesc,setPDesc,"পণ্যের বিবরণ",{multiline:true})}{btn(pImageAsset?"ছবি নির্বাচিত: "+pImageAsset.fileName:"মোবাইল থেকে পণ্যের ছবি নির্বাচন করুন",chooseProductImage)}{pImageAsset&&btn("ছবি বাদ দিন",()=>setPImageAsset(null))}{field(pImage,setPImage,"অথবা ছবির URL দিন (ঐচ্ছিক)",{keyboardType:"url",autoCapitalize:"none"})}
    <Text style={s.muted}>ক্যাটাগরি নির্বাচন করুন</Text><ScrollView horizontal>{categories.map(c=><View key={c.id} style={{marginRight:5}}>{btn(c.name,()=>setPCategory(c.id),pCategory===c.id)}</View>)}</ScrollView>
    {btn(busy?"সংরক্ষণ হচ্ছে...":"অনলাইনে পণ্য যোগ করুন",addProduct,true,busy)}
    <Text style={s.heading}>পণ্য তালিকা ({products.length})</Text>
    {products.map(p=><View key={p.id} style={s.cartRow}>{p.image_url&&<Image source={{uri:p.image_url}} style={s.productImage}/>}<View style={{flex:1}}><Text style={s.productName}>{p.name}</Text><Text>{money(p.price)} · স্টক {p.stock_quantity}</Text></View>{btn("এডিট",()=>startEditProduct(p))}{btn("ছবি যোগ",()=>addPhotoToExistingProduct(p.id),false,busy)}{btn("লুকান",()=>hideProduct(p.id))}</View>)}
    {!!editProductId&&<View style={s.orderCard}><Text style={s.heading}>পণ্যের তথ্য পরিবর্তন</Text>{field(editProductName,setEditProductName,"পণ্যের নাম")}{field(editProductPrice,setEditProductPrice,"দাম (টাকা)",{keyboardType:"decimal-pad"})}{field(editProductStock,setEditProductStock,"স্টক সংখ্যা",{keyboardType:"number-pad"})}{field(editProductDesc,setEditProductDesc,"বিবরণ",{multiline:true})}{btn(busy?"সংরক্ষণ হচ্ছে...":"পরিবর্তন সংরক্ষণ করুন",saveProductEdits,true,busy)}{btn("বাতিল",()=>setEditProductId(""))}</View>}
    <Text style={s.heading}>অর্ডার তালিকা ({orders.length})</Text>
    {orders.map(o=><View key={o.id} style={s.orderCard}><Text style={s.productName}>অর্ডার: {o.id.slice(0,8)}</Text><Text>{o.customer_name} · {o.customer_phone}</Text><Text>{o.delivery_address}</Text><Text>মোট: {money(o.total)} · অর্ডার: {statusLabel(o.order_status)}</Text><Text>পেমেন্ট: {({cod:"ক্যাশ অন ডেলিভারি",bkash:"বিকাশ",nagad:"নগদ"}[o.payment_method]||o.payment_method)} · Transaction ID: {o.payment_reference||"নেই"} · পেমেন্ট অবস্থা: {({pending:"অপেক্ষমাণ",paid:"পরিশোধিত",failed:"ব্যর্থ",refunded:"ফেরত"}[o.payment_status]||o.payment_status)}</Text><ScrollView horizontal>{[["pending","অপেক্ষমাণ"],["paid","টাকা পেয়েছি"],["failed","ব্যর্থ"],["refunded","ফেরত"]].map(([v,l])=><View key={v} style={{marginRight:4}}>{btn(l,()=>updatePaymentStatus(o.id,v),o.payment_status===v)}</View>)}</ScrollView>
     {(o.order_items||[]).map((it,i)=><Text key={i} style={s.muted}>• {it.product_name} × {it.quantity}</Text>)}
     <ScrollView horizontal>{[["pending","নতুন"],["confirmed","নিশ্চিত"],["processing","প্রস্তুত"],["shipped","পাঠানো"],["delivered","সম্পন্ন"],["cancelled","বাতিল"]].map(([v,l])=><View key={v} style={{marginRight:4}}>{btn(l,()=>updateStatus(o.id,v),o.order_status===v)}</View>)}</ScrollView>
    </View>)}
   </ScrollView>}
  </KeyboardAvoidingView>}
  <Text style={s.footer}>NOOR ONLINE SHOP • অনলাইন অর্ডার</Text>
 </SafeAreaView>;
}
const s=StyleSheet.create({
 safe:{flex:1,backgroundColor:"#f6f7f8"},header:{backgroundColor:"#123b2b",padding:14,alignItems:"center"},brandRow:{flexDirection:"row",alignItems:"center",gap:12},brandIcon:{width:58,height:58,borderRadius:13,backgroundColor:"#fff"},logo:{fontSize:22,fontWeight:"bold",color:"#fff"},sub:{color:"#dce9e0",marginTop:4},nav:{flexDirection:"row",justifyContent:"space-around",padding:8,backgroundColor:"#e7eee9"},btn:{backgroundColor:"#fff",borderWidth:1,borderColor:"#cbd5ce",borderRadius:8,paddingVertical:9,paddingHorizontal:12,marginVertical:4,alignItems:"center"},active:{backgroundColor:"#17633f",borderColor:"#17633f"},btnText:{fontWeight:"600",color:"#183b2b"},input:{backgroundColor:"#fff",borderWidth:1,borderColor:"#d7ded9",borderRadius:8,padding:12,margin:8,color:"#182a20"},product:{backgroundColor:"#fff",padding:14,borderRadius:10,marginBottom:10,flexDirection:"row",alignItems:"center",gap:10},productImage:{width:82,height:82,borderRadius:8,backgroundColor:"#eef2ee"},productName:{fontSize:16,fontWeight:"bold",color:"#182a20"},muted:{color:"#64746a",fontSize:12,marginVertical:3},price:{fontSize:17,fontWeight:"bold",color:"#17633f",marginTop:5},heading:{fontSize:19,fontWeight:"bold",marginVertical:12,color:"#123b2b"},cartRow:{backgroundColor:"#fff",padding:12,borderRadius:8,marginVertical:5,flexDirection:"row",alignItems:"center",gap:6},total:{fontSize:20,fontWeight:"bold",textAlign:"right",marginVertical:12},footer:{textAlign:"center",fontSize:11,color:"#65736a",padding:8},notice:{backgroundColor:"#e2f2e8",padding:8,margin:6,borderRadius:7},noticeText:{color:"#174a31"},empty:{alignItems:"center",padding:24},row:{flexDirection:"row",justifyContent:"space-between",flexWrap:"wrap"},orderCard:{backgroundColor:"#fff",padding:12,borderRadius:9,marginVertical:7,gap:4}
});
