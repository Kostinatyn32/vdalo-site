import {randomUUID} from 'node:crypto';

const clean=(v,n=180)=>typeof v==='string'?v.trim().slice(0,n):'';
const funnels=new Set(['staff','nights','overbook','commission','blackout']);
const sources=new Set(['sms','sms2','email','direct','website','']);
const buckets=new Set(['1-10','11-30','31+','apart']);
const limiters=new Map();
function rateExceeded(req){const key=req.socket?.remoteAddress||'unknown',now=Date.now();for(const [k,v] of limiters)if(v.until<now)limiters.delete(k);if(limiters.size>5000&&!limiters.has(key))return true;const b=limiters.get(key)||{count:0,until:now+60000};b.count++;limiters.set(key,b);return b.count>12;}
const reply=(res,status,data)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(data));};
export async function handleTop5Lead(req,res,{sendRequest=fetch,env=process.env}={}){
 if(req.method!=='POST')return reply(res,405,{ok:false,message:'Метод недоступний.'});
 if(!req.headers['content-type']?.startsWith('application/json'))return reply(res,415,{ok:false,message:'Непідтримуваний формат запиту.'});
 const origin=req.headers.origin,host=req.headers.host;
 if(origin&&host&&!new Set([`https://${host}`,`http://${host}`,'https://vdalo.tech','https://www.vdalo.tech']).has(origin))return reply(res,403,{ok:false,message:'Надсилання з іншого сайту недоступне.'});
 if(rateExceeded(req))return reply(res,429,{ok:false,message:'Забагато спроб. Спробуйте пізніше.'});
 let size=0,chunks=[];
 try{
  for await(const part of req){const b=Buffer.from(part);size+=b.length;if(size>16384)return reply(res,413,{ok:false,message:'Запит завеликий.'});chunks.push(b);}
  const raw=JSON.parse(Buffer.concat(chunks).toString('utf8'));
  if(!raw||typeof raw!=='object'||Array.isArray(raw))return reply(res,400,{ok:false,message:'Перевірте дані форми.'});
  if(raw.website)return reply(res,400,{ok:false,message:'Не вдалося перевірити запит.'});
  const email=clean(raw.email,180).toLowerCase(),phone=clean(raw.phone,40),hotel=clean(raw.hotel,150),rooms=clean(raw.rooms,20),funnel=clean(raw.funnel,30),source=clean(raw.source,30),code=clean(raw.code,10),video=clean(raw.video,50),watched=Number(raw.watched)||0;
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return reply(res,422,{ok:false,message:'Вкажіть коректний e-mail.'});
  if(!/^[+()\d\s.-]+$/.test(phone)||phone.replace(/\D/g,'').length<9||phone.replace(/\D/g,'').length>15)return reply(res,422,{ok:false,message:'Вкажіть коректний телефон.'});
  if(!buckets.has(rooms))return reply(res,422,{ok:false,message:'Оберіть розмір готелю.'});
  if(!funnels.has(funnel)||!sources.has(source))return reply(res,422,{ok:false,message:'Не вдалося визначити джерело запиту.'});
  if(raw.consent!==true)return reply(res,422,{ok:false,message:'Потрібна згода на обробку даних.'});
  const endpoint=env.VDALO_TRIAL_WEBHOOK_URL||env.VDALO_LEAD_WEBHOOK_URL;
  if(!endpoint)return reply(res,503,{ok:false,message:'Приймання запитів на тест ще не підключене. Запит не надіслано.'});
  const calc=typeof raw.calc==='string'?raw.calc.slice(0,4000):'';
  const payload={lead_id:randomUUID(),kind:'trial_request',status:'pending_contact',trial_days:14,requires_card:false,submitted_at:new Date().toISOString(),contact:{email,phone,hotel_name:hotel||null,room_range:rooms},attribution:{source,code,funnel,video,watched_percent:[0,25,50,75,100].reduce((best,value)=>Math.abs(value-watched)<Math.abs(best-watched)?value:best,0),calculator:calc||null,utm:Object.fromEntries(['utm_source','utm_medium','utm_campaign','utm_content','utm_term'].map(k=>[k,clean(raw[k],150)]).filter(([,v])=>v))},permissions:{respond_to_request:true,consent:true},source_system:'vdalo-top5-funnels'};
  const response=await sendRequest(endpoint,{method:'POST',headers:{'Content-Type':'application/json','Idempotency-Key':payload.lead_id,...(env.VDALO_WEBHOOK_BEARER_TOKEN?{Authorization:`Bearer ${env.VDALO_WEBHOOK_BEARER_TOKEN}`}:{})},body:JSON.stringify(payload),signal:AbortSignal.timeout(10000),redirect:'error'});await response.body?.cancel();
  if(!response.ok)return reply(res,502,{ok:false,message:'Не вдалося підтвердити отримання запиту. Спробуйте пізніше.'});
  return reply(res,200,{ok:true,leadId:payload.lead_id});
 }catch(error){return reply(res,error instanceof SyntaxError?400:502,{ok:false,message:error instanceof SyntaxError?'Не вдалося прочитати запит.':'Не вдалося підтвердити отримання запиту. Спробуйте пізніше.'});}
}
