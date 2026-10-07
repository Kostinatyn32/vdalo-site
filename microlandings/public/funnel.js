(() => {
 const configNode=document.getElementById('offer-config');if(!configNode)return;
 const config=JSON.parse(configNode.textContent);
 const form=document.querySelector('form[data-offer]');
 const params=new URLSearchParams(location.search),current={};
 ['utm_source','utm_medium','utm_campaign','utm_content','utm_term','message_variant'].forEach(key=>{if(params.get(key))current[key]=params.get(key).slice(0,150);});
 let attribution={first_touch:current,last_touch:current,entry_offer:config.offer_id,first_touch_at:new Date().toISOString()};
 try{
  const previous=JSON.parse(sessionStorage.getItem('vdalo-funnel-attribution')||'null');
  if(previous&&typeof previous==='object')attribution={...previous,last_touch:Object.keys(current).length?current:previous.last_touch};
  sessionStorage.setItem('vdalo-funnel-attribution',JSON.stringify(attribution));
 }catch{}
 window.dataLayer=window.dataLayer||[];
 function track(event,detail={}){
  const payload={event,brand:'VDALO',offer_id:config.offer_id,landing_route:config.landing_route,source:current.utm_source||attribution.last_touch?.utm_source||'direct',campaign:current.utm_campaign||attribution.last_touch?.utm_campaign||'',...detail};
  window.dataLayer.push(payload);if(typeof window.vdaloAnalytics==='function'){try{window.vdaloAnalytics(payload);}catch{}}
 }
 track('page_view');
 let opened=false;
 const trackFormOpen=()=>{if(!opened){track('form_open');opened=true;}};
 document.querySelectorAll('[data-primary]').forEach(link=>link.addEventListener('click',()=>{track('primary_cta_click',{location:link.dataset.location});track('CTA_click',{cta_type:'primary',location:link.dataset.location});trackFormOpen();}));
 if('IntersectionObserver' in window){const observer=new IntersectionObserver(entries=>{if(entries[0].isIntersecting){trackFormOpen();observer.disconnect();}},{threshold:.15});observer.observe(form);}
 document.querySelectorAll('[data-process]').forEach(button=>button.addEventListener('click',()=>{
  document.querySelectorAll('[data-process]').forEach(control=>control.setAttribute('aria-pressed',String(control===button)));
  const select=form.elements.selected_process;if(select)select.value=button.dataset.process;
  track('process_select',{selected_process:button.dataset.process});
 }));
 document.querySelectorAll('[data-question]').forEach(detail=>detail.addEventListener('toggle',()=>{if(detail.open)track('faq_open',{question_id:detail.dataset.question});}));
 let started=false,requestId='',lastSerialized='';
 form.addEventListener('input',()=>{if(!started&&form.dataset.ready==='true'){track('form_start');started=true;}});
 function showErrors(errors){
  form.querySelectorAll('.field-error').forEach(node=>node.textContent='');
  form.querySelectorAll('[aria-invalid]').forEach(node=>node.removeAttribute('aria-invalid'));
  for(const [key,message] of Object.entries(errors)){const field=form.elements[key],node=document.getElementById(`error-${key}`);if(node)node.textContent=message;if(field)field.setAttribute('aria-invalid','true');}
  const first=Object.keys(errors).find(key=>form.elements[key]);
  if(first){const field=form.elements[first];const optional=field.closest('details');if(optional)optional.open=true;field.focus();}
 }
 form.addEventListener('submit',async event=>{
  event.preventDefault();const submit=form.querySelector('[type=submit]');if(form.dataset.ready!=='true'||submit.disabled)return;
  const data=Object.fromEntries(new FormData(form));
  ['consent','interview_interest','sales_interest','report_interest','pilot_interest','feedback_interest'].forEach(key=>data[key]=form.elements[key]?.checked===true);
  for(const key of ['name','property','contact','rooms','current_pms'])data[key]=(data[key]||'').trim();
  const errors={};
  form.querySelectorAll('[required]').forEach(field=>{if(field.type==='checkbox'?!field.checked:!field.value.trim())errors[field.name]='Заповніть це поле.';});
  if(data.name&&!config.survey&&data.name.length<2)errors.name='Вкажіть ваше ім’я.';
  if(data.property&&!config.survey&&data.property.length<2)errors.property='Вкажіть назву об’єкта.';
  const needsContact=!config.survey||data.interview_interest||data.sales_interest||data.report_interest;
  const digits=data.contact.replace(/\D/g,'').length;
  if((needsContact||data.contact)&&!(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.contact)||(/^[+()\d\s.-]+$/.test(data.contact)&&digits>=9&&digits<=15)))errors.contact='Вкажіть коректний телефон або email.';
  if(data.rooms&&!/^[1-9]\d{0,4}$/.test(data.rooms))errors.rooms='Вкажіть кількість номерів від 1 до 99999.';
  showErrors(errors);const status=form.querySelector('.ml-form-status');status.textContent='';
  if(Object.keys(errors).length){track('form_error',{reason:'validation'});return;}
  data.offer_id=config.offer_id;data.attribution=attribution;
  const serialized=JSON.stringify(data);if(serialized!==lastSerialized||!requestId){requestId=crypto.randomUUID();lastSerialized=serialized;}data.submission_id=requestId;
  const label=submit.innerHTML;submit.disabled=true;submit.textContent='Надсилаємо…';form.setAttribute('aria-busy','true');
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000);
  try{
   const response=await fetch(config.endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data),signal:controller.signal});
   const result=await response.json();if(!response.ok||result.ok!==true){if(result.errors)showErrors(result.errors);throw new Error(result.message||'Не вдалося підтвердити отримання запиту.');}
   track('form_success',{lead_id:result.leadId,selected_process:data.selected_process||'',has_current_pms:Boolean(data.current_pms)});
   form.hidden=true;const success=form.parentElement.querySelector('.ml-success');success.hidden=false;success.focus();
  }catch(error){status.textContent=error.name==='AbortError'?'Відповідь затримується. Отримання запиту не підтверджено. Спробуйте пізніше.':error.message==='Failed to fetch'?'Немає зв’язку із сервером. Перевірте інтернет.':error.message;track('form_error',{reason:'delivery'});}
  finally{clearTimeout(timer);submit.disabled=false;submit.innerHTML=label;form.removeAttribute('aria-busy');}
 });
})();
