import test from 'node:test';
import assert from 'node:assert/strict';
import {Readable} from 'node:stream';

process.env.VERCEL='1';
const {default:server}=await import('../server.mjs');

async function request(url,method='GET'){
  const req={url,method,headers:{},on(){},once(){},resume(){}};
  let status=0,headers={},body='';
  const res={writeHead(code,value={}){status=code;headers=value;},end(value){if(value)body=Buffer.isBuffer(value)?value.toString('utf8'):String(value);}};
  await new Promise((resolve,reject)=>{
    const timer=setTimeout(()=>reject(new Error(`No response for ${url}`)),3000);
    res.end=value=>{if(value)body=Buffer.isBuffer(value)?value.toString('utf8'):String(value);clearTimeout(timer);resolve();};
    server.emit('request',req,res);
  });
  return {status,headers,body};
}

test('hub, city, assets and sitemap resolve through the actual app router',async()=>{
  const hub=await request('/tourist-tax/');
  assert.equal(hub.status,200);
  assert.match(hub.body,/Туристичний збір в Україні/);
  const city=await request('/tourist-tax/lutsk/');
  assert.equal(city.status,200);
  assert.match(city.body,/index,follow/);
  assert.match(city.body,/Розрахуйте туристичний збір/);
  const css=await request('/tourist-tax-assets/tourist-tax.css');
  assert.equal(css.status,200);
  assert.match(css.headers['Content-Type'],/text\/css/);
  const interactions=await request('/tourist-tax-assets/tourist-tax-interactions.css');
  assert.equal(interactions.status,200);
  const js=await request('/tourist-tax-assets/tourist-tax.js');
  assert.equal(js.status,200);
  const sitemap=await request('/sitemap.xml');
  assert.equal(sitemap.status,200);
  assert.match(sitemap.body,/https:\/\/www\.vdalo\.tech\/tourist-tax\//);
  assert.match(sitemap.body,/tourist-tax\/lutsk/);
});

test('calculation API accepts same-origin minimal inputs and fails closed',async()=>{
  const body={placeSlug:'lutsk',start:'2026-10-10',end:'2026-10-13',nights:3,guests:2,category:'domestic',exemption:'none'};
  const send=async({origin='https://www.vdalo.tech',method='POST',contentType='application/json',payload=JSON.stringify(body),host='www.vdalo.tech'}={})=>{
    const req=Readable.from([payload]);req.url='/api/tourist-tax/calculate';req.method=method;req.headers={origin,host,'content-type':contentType,'content-length':String(Buffer.byteLength(payload))};
    let status,content='';const res={writeHead(code){status=code;},end(value){content=String(value??'');}};
    await new Promise((resolve,reject)=>{const timeout=setTimeout(()=>reject(new Error('API response timeout')),3000);res.end=value=>{content=String(value??'');clearTimeout(timeout);resolve();};server.emit('request',req,res);});
    return {status,body:JSON.parse(content)};
  };
  const calculation=await send();
  assert.equal(calculation.status,200);
  assert.equal(calculation.body.state,'VERIFIED_RESULT');
  assert.equal(calculation.body.totalCents,'25941');
  assert.equal((await send({origin:'https://attacker.example'})).status,403);
  assert.equal((await send({contentType:'text/plain'})).status,415);
  assert.equal((await send({method:'GET'})).status,405);
  assert.equal((await send({payload:'x'.repeat(5000)})).status,413);
});

test('hub canonical redirect and HEAD behavior are correct',async()=>{
  const canonical=await request('/tourist-tax');
  assert.equal(canonical.status,308);
  assert.equal(canonical.headers.Location,'/tourist-tax/');
  const head=await request('/tourist-tax/','HEAD');
  assert.equal(head.status,200);
  assert.equal(head.body,'');
});
