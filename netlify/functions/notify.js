const admin=require('firebase-admin');
if(!admin.apps.length)admin.initializeApp({credential:admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))});
const db=admin.firestore();
exports.handler=async e=>{try{
 const {type,id,t}=JSON.parse(e.body||'{}');const u=await admin.auth().verifyIdToken(t);
 const od=await db.collection('orders').doc(id).get();if(!od.exists)return{statusCode:404,body:'no order'};
 const o=od.data();let tokens=[],title,body;
 const tk=async(c,i)=>{const d=await db.collection(c).doc(i).get();return d.exists&&d.data().fcm?[d.data().fcm]:[]};
 if(type==='new'&&o.rid===u.uid){
  const s=await db.collection('drivers').where('avail','==',true).get();
  tokens=s.docs.filter(d=>(d.data().dests||[]).includes(o.dest)&&!(o.rej||[]).includes(d.id)).map(d=>d.data().fcm).filter(Boolean);
  title='طلب جديد';body='إلى '+o.dest+' - '+(o.when||'الآن')+' - '+(o.priv?'سيارة كاملة':(o.seats||1)+' مقعد');
 }else if(type==='offered'&&o.driverId===u.uid){
  tokens=await tk('riders',o.rid);title='عرض من سائق';body=(o.driverName||'')+' - '+(o.price||'')+' د.ع. وافق أو ارفض';
 }else if(type==='confirmed'&&o.rid===u.uid&&o.driverId){
  tokens=await tk('drivers',o.driverId);title='وافق الراكب على السعر';body=(o.name||'')+' - توجه إلى موقعه';
 }else return{statusCode:403,body:'forbidden'};
 if(!tokens.length)return{statusCode:200,body:'0'};
 const res=await admin.messaging().sendEachForMulticast({tokens,notification:{title,body},webpush:{fcmOptions:{link:'https://karaj-shatra.netlify.app/'}}});
 return{statusCode:200,body:String(res.successCount)};
}catch(err){return{statusCode:500,body:String(err.message)}}};
