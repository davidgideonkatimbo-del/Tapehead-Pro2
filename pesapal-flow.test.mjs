import assert from 'node:assert/strict';
process.env.SUPABASE_URL='http://sb.test'; process.env.SUPABASE_ANON_KEY='anon'; process.env.SUPABASE_SERVICE_ROLE_KEY='svc';
process.env.PESAPAL_CONSUMER_KEY='k'; process.env.PESAPAL_CONSUMER_SECRET='s'; process.env.PESAPAL_ENV='sandbox';
process.env.PUBLIC_APP_URL='https://app.test'; 


const db={tx:[],ent:[]}; const ps={orders:{},ipns:[],calls:[]}; let idn=0;
const parseFilters=q=>{const f=[];for(const [k,v] of q.entries()){ if(['select','limit','on_conflict'].includes(k))continue; const m=v.match(/^(eq|neq)\.(.*)$/); if(m)f.push([k,m[1],m[2]]);} return f;};
const match=(row,f)=>f.every(([k,op,v])=>op==='eq'?String(row[k])===v:String(row[k])!==v);
const J=(o,s=200)=>new Response(JSON.stringify(o),{status:s,headers:{'content-type':'application/json'}});
globalThis.fetch=async(url,init={})=>{
  const u=new URL(url); const method=init.method||'GET'; const body=init.body?JSON.parse(init.body):null;
  if(u.host==='sb.test'){
    if(u.pathname==='/auth/v1/user'){const t=(init.headers.Authorization||'').slice(7); if(t==='tokA')return J({id:'user-a',email:'a@x.com',user_metadata:{username:'Deon'}}); if(t==='tokB')return J({id:'user-b',email:'b@x.com'}); return J({},401);}
    const tbl=u.pathname.endsWith('pro_transactions')?db.tx:db.ent; const f=parseFilters(u.searchParams);
    if(method==='GET')return J(tbl.filter(r=>match(r,f)));
    if(method==='POST'){ if(tbl===db.ent){const i=tbl.findIndex(r=>r.user_id===body.user_id); if(i>=0){tbl[i]={...tbl[i],...body};return J([tbl[i]]);}} const r={...body}; tbl.push(r); return J([r],201);}
    if(method==='PATCH'){const hit=tbl.filter(r=>match(r,f)); hit.forEach(r=>Object.assign(r,body)); return J(hit);}
  }
  if(u.host==='cybqa.pesapal.com'){
    const p=u.pathname.replace('/pesapalv3/api','');
    ps.calls.push(p);
    if(p==='/Auth/RequestToken')return J({token:'T'+(++idn),expiryDate:new Date(Date.now()+300000).toISOString().replace('Z','1234Z'),status:'200'});
    if((init.headers||{}).Authorization?.startsWith('Bearer ')===false)return J({},401);
    if(p==='/URLSetup/GetIpnList')return J(ps.ipns);
    if(p==='/URLSetup/RegisterIPN'){const r={url:body.url,ipn_id:'ipn-1',status:'200'};ps.ipns.push(r);return J(r);}
    if(p==='/Transactions/SubmitOrderRequest'){const tid='trk-'+(++idn);ps.orders[tid]={ref:body.id,amount:body.amount,currency:body.currency,status:0,paid:body.amount,cur:body.currency};return J({order_tracking_id:tid,merchant_reference:body.id,redirect_url:'https://pay.test/'+tid,status:'200'});}
    if(p==='/Transactions/GetTransactionStatus'){const o=ps.orders[u.searchParams.get('orderTrackingId')];if(!o)return J({status:'500'},404);return J({status_code:o.status,amount:o.paid,currency:o.cur,merchant_reference:o.ref,payment_status_description:'x',status:'200'});}
  }
  throw new Error('unmocked '+url);
};
const mk=(method,body,tok,query)=>({method,body,query:query||{},headers:{authorization:tok?'Bearer '+tok:''}});
const run=async(h,req)=>{let out={};const res={status(s){out.status=s;return this},json(b){out.body=b;return this},setHeader(){}};await h.default(req,res);return out;};
const checkout=await import('../www/api/pro-checkout.js');
const verify=await import('../www/api/pro-verify.js');
const ipn=await import('../www/api/pesapal-ipn.js');
const plans=await import('../www/api/pro-plans.js');

// plans
let r=await run(plans,mk('GET')); assert.equal(r.body.currency,'USD'); assert.equal(r.body.plans.month.amount,4.99); assert.equal(r.body.plans.lifetime.amount,49);
// checkout
r=await run(checkout,mk('POST',{plan:'month'},'tokA')); assert.equal(r.status,200,JSON.stringify(r.body));
const ref=r.body.tx_ref; assert.ok(ref.length<=50&&/^[A-Za-z0-9\-_.:]+$/.test(ref),'ref format '+ref);
const trk=db.tx[0].provider_transaction_id; assert.ok(trk.startsWith('trk-')); assert.equal(db.tx[0].currency,'USD'); assert.equal(db.tx[0].amount,4.99);
assert.equal(ps.ipns.length,1); assert.equal(ps.ipns[0].url,'https://app.test/api/pesapal-ipn');
r=await run(checkout,mk('POST',{plan:'year'},'tokA')); assert.equal(ps.ipns.length,1,'ipn registered once'); // cached
db.tx.pop(); // drop 2nd for simplicity
r=await run(checkout,mk('POST',{plan:'bogus'},'tokA')); assert.equal(r.status,503);
r=await run(checkout,mk('POST',{plan:'month'},null)); assert.equal(r.status,401);
// not paid yet -> 202
r=await run(verify,mk('POST',{tx_ref:ref,order_tracking_id:trk},'tokA')); assert.equal(r.status,202);
// other user cannot verify
r=await run(verify,mk('POST',{tx_ref:ref,order_tracking_id:trk},'tokB')); assert.equal(r.status,404);
// wrong tracking id
ps.orders[trk].status=1;
r=await run(verify,mk('POST',{tx_ref:ref,order_tracking_id:'trk-other'},'tokA')); assert.equal(r.status,400);
// underpaid
ps.orders[trk].paid=1;
r=await run(verify,mk('POST',{tx_ref:ref,order_tracking_id:trk},'tokA')); assert.equal(r.status,400); assert.equal(db.ent.length,0);
// wrong currency
ps.orders[trk].paid=4.99; ps.orders[trk].cur='KES';
r=await run(verify,mk('POST',{tx_ref:ref,order_tracking_id:trk},'tokA')); assert.equal(r.status,400); assert.equal(db.ent.length,0);
// success, with IPN + browser racing
ps.orders[trk].cur='USD';
const [a,b,c]=await Promise.all([
  run(verify,mk('POST',{tx_ref:ref,order_tracking_id:trk},'tokA')),
  run(ipn,mk('GET',null,null,{OrderTrackingId:trk,OrderMerchantReference:ref,OrderNotificationType:'IPNCHANGE'})),
  run(ipn,mk('POST',{OrderTrackingId:trk,OrderMerchantReference:ref,OrderNotificationType:'IPNCHANGE'}))
]);
assert.equal(a.status,200); assert.equal(b.body.status,200); assert.equal(c.body.status,200);
assert.equal(db.ent.length,1); assert.equal(db.ent[0].plan,'month'); assert.equal(db.ent[0].provider,'pesapal');
const exp1=new Date(db.ent[0].expires_at).getTime(); assert.ok(Math.abs(exp1-(Date.now()+30*864e5))<60000,'30 days once');
// duplicate calls don't extend again
await run(ipn,mk('GET',null,null,{OrderTrackingId:trk,OrderMerchantReference:ref}));
await run(verify,mk('POST',{tx_ref:ref,order_tracking_id:trk},'tokA'));
assert.equal(new Date(db.ent[0].expires_at).getTime(),exp1,'no double grant');
assert.equal(db.tx[0].status,'successful');
// IPN garbage / unknown
r=await run(ipn,mk('GET',null,null,{})); assert.equal(r.body.status,500);
r=await run(ipn,mk('GET',null,null,{OrderTrackingId:'x',OrderMerchantReference:'nope'})); assert.equal(r.body.status,200);
// reversal revokes
ps.orders[trk].status=3;
r=await run(ipn,mk('GET',null,null,{OrderTrackingId:trk,OrderMerchantReference:ref}));
assert.equal(db.ent[0].status,'revoked'); assert.equal(db.tx[0].status,'failed');
// token cached: only 1 auth call for many requests? (tokens minted count)
const auths=ps.calls.filter(c=>c==='/Auth/RequestToken').length; assert.ok(auths<=2,'token cached, auths='+auths);
console.log('ALL PESAPAL FLOW TESTS PASSED; auth calls:',auths);
