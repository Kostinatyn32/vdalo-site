import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {offers} from '../microlandings/content.mjs';
const source=readFileSync(new URL('../microlandings/public/funnel.js',import.meta.url),'utf8');
function client(offer){
 const handlers={},status={dataset:{},textContent:''},submit={disabled:false,innerHTML:offer.cta},fieldset={disabled:false},success={hidden:true,focus(){}};
 const raw={name:'QA Тест',property:'QA Готель',contact:'qa@example.invalid',rooms:'12',current_pms:'QA PMS',role:'owner',selected_process:'guest-requests',property_type:'hotel',pms_usage:'pms'};
 const elements=Object.fromEntries(Object.entries(raw).map(([key,value])=>[key,{value,removeAttribute(){}}]));elements.consent={checked:true};
 const form={dataset:{ready:'true'},elements,hidden:false,parentElement:{querySelector:()=>success},addEventListener:(name,fn)=>handlers[name]=fn,querySelectorAll:()=>[],querySelector:selector=>selector==='[type=submit]'?submit:selector==='.ml-form-status'?status:fieldset,setAttribute(){},removeAttribute(){}};
 let resolve;
 const window={dataLayer:[]};
 const context={document:{getElementById:()=>({textContent:JSON.stringify({offer_id:offer.id,landing_route:offer.route,copy_version:'direction-v2',survey:offer.extra==='survey',extra:offer.extra,endpoint:'/api/funnel/leads'})}),querySelector:()=>form,querySelectorAll:()=>[]},window,location:{search:'?utm_source=qa&utm_medium=test&message_variant=v2'},URLSearchParams,sessionStorage:{getItem:()=>null,setItem(){}},FormData:class{constructor(){return Object.entries(raw);}},crypto:{randomUUID:()=> 'test-id'},AbortController,setTimeout,clearTimeout,fetch:()=>new Promise(r=>resolve=r)};
 vm.runInNewContext(source,context);
 return {form,status,submit,success,window,submitForm:()=>handlers.submit({preventDefault(){}}),respond:result=>resolve(result)};
}
for(const offer of offers){
 test(`${offer.id}: client loading then acknowledged success`,async()=>{
  const c=client(offer),pending=c.submitForm();assert.equal(c.form.dataset.state,'loading');assert.equal(c.submit.disabled,true);assert.equal(c.success.hidden,true);
  c.respond({ok:true,json:async()=>({ok:true,leadId:'accepted-test'})});await pending;
  assert.equal(c.form.dataset.state,'success');assert.equal(c.success.hidden,false);assert.equal(c.submit.disabled,false);
  const event=c.window.dataLayer.find(e=>e.event==='form_success');assert.equal(event.offer_id,offer.id);assert.equal(event.utm_medium,'test');assert.equal(event.message_variant,'v2');assert.equal(event.copy_version,'direction-v2');assert.equal(event.contact,undefined);assert.equal(event.property,undefined);
 });
 test(`${offer.id}: client backend error preserves form without success`,async()=>{
  const c=client(offer),pending=c.submitForm();c.respond({ok:false,json:async()=>({ok:false,message:'Тестова помилка приймання'})});await pending;
  assert.equal(c.form.dataset.state,'error');assert.equal(c.form.hidden,false);assert.equal(c.success.hidden,true);assert.equal(c.submit.disabled,false);assert.ok(c.status.textContent.includes('помилка'));assert.ok(!c.window.dataLayer.some(e=>e.event==='form_success'));
 });
}
