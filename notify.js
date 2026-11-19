const admin=require('firebase-admin');
if(!admin.apps.length)admin.initializeApp({credential:admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))});
const db=admin.firestore();
exports.handler=async e=>{try{
 const {type,id,t}=JSON.parse(e.body||'{}');const u=await admin.auth().verifyIdToken(t);
 const od=await db.collection('orders').doc(id).get();if(!od.exists)return{statusCode:404,body:'no order'};
 const o=od.data();let tokens=[],title,body;
 if(type==='new'&&o.rid===u.uid){
  const s=await db.collection('drivers').where('avail','==',true).get();
  tokens=s.docs.map(d=>d.data()).filter(d=>(d.dests||[]).includes(o.dest)).map(d=>d.fcm).filter(Boolean);
  title='طلب جديد';body='إلى '+o.dest+' - '+(o.when||'الآن');
 }else if(type==='accepted'&&o.driverId===u.uid){
  const r=await db.collection('riders').doc(o.rid).get();tokens=[r.exists&&r.data().fcm].filter(Boolean);
  title='قبل سائق طلبك';body=(o.driverName||'')+' - '+(o.price||'')+' د.ع';
 }else return{statusCode:403,body:'forbidden'};
 if(!tokens.length)return{statusCode:200,body:'0'};
 const res=await admin.messaging().sendEachForMulticast({tokens,notification:{title,body},webpush:{fcmOptions:{link:'https://karaj-shatra.netlify.app/'}}});
 return{statusCode:200,body:String(res.successCount)};
}catch(err){return{statusCode:500,body:String(err.message)}}};
