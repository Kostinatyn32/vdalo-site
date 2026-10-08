document.querySelector('.menu-toggle')?.addEventListener('click', event => {
 const control = event.currentTarget;
 const expanded = control.getAttribute('aria-expanded') !== 'true';
 control.setAttribute('aria-expanded', String(expanded));
 control.setAttribute('aria-label', expanded ? 'Закрити меню' : 'Відкрити меню');
 document.querySelector('#navigation').classList.toggle('open', expanded);
});
document.querySelectorAll('#navigation a').forEach(link => link.addEventListener('click', () => {
 document.querySelector('#navigation').classList.remove('open');
 document.querySelector('.menu-toggle').setAttribute('aria-expanded', 'false');
 document.querySelector('.menu-toggle').setAttribute('aria-label', 'Відкрити меню');
}));
addEventListener('scroll', () => document.querySelector('.header').classList.toggle('scrolled', scrollY > 120), { passive:true });

// Provider-neutral events. Contact data and free text never enter this layer.
window.dataLayer = window.dataLayer || [];
const track = (event, properties={}) => {
 const payload={event,brand:'VDALO',...properties};
 window.dataLayer.push(payload);
 if(typeof window.vdaloAnalytics==='function') { try { window.vdaloAnalytics(payload); } catch {} }
};
track('page_view',{path:location.pathname});
let opener=null;
function openForm(kind,source,interest='') {
 const dialog=document.querySelector(`#${kind}-dialog`);
 if(!dialog) return;
 opener=document.activeElement;
 const form=dialog.querySelector('form');
 const context=dialog.querySelector('.selected-interest');
 if(interest) {
  if(!form.elements.pain.value || form.elements.pain.value===form.dataset.autoInterest){
   const value=`Хочу перевірити сценарій: ${interest}`;
   form.elements.pain.value=value;form.dataset.autoInterest=value;
  }
  if(context){context.hidden=false;context.textContent=`Обраний сценарій: ${interest}`;}
 } else {
  if(context)context.hidden=true;
  if(form.dataset.autoInterest && form.elements.pain.value===form.dataset.autoInterest)form.elements.pain.value='';
  delete form.dataset.autoInterest;
 }
 dialog.showModal();
 document.body.classList.add('dialog-open');
 track(`${kind}_form_open`,{location:source});
 if(source==='hero'||source==='final') track(`${source}_${kind}_click`);
 requestAnimationFrame(()=>{const input=dialog.querySelector('input:not([type=checkbox]):not(:disabled)');(input||dialog.querySelector('[data-close]')).focus();});
}
function closeForm(dialog) { dialog.close(); }
document.querySelectorAll('[data-open]').forEach(control=>control.addEventListener('click',()=>openForm(control.dataset.open,control.dataset.location,control.dataset.interest)));
document.querySelectorAll('.lead-dialog').forEach(dialog=>{
 dialog.querySelectorAll('[data-close]').forEach(control=>control.addEventListener('click',()=>closeForm(dialog)));
 dialog.addEventListener('click',event=>{
  const rect=dialog.getBoundingClientRect();
  if(event.target===dialog && (event.clientX<rect.left || event.clientX>rect.right || event.clientY<rect.top || event.clientY>rect.bottom)) closeForm(dialog);
 });
 dialog.addEventListener('close',()=>{document.body.classList.remove('dialog-open');opener?.focus();});
});

function validate(kind,data) {
 const errors={};
 if(data.name.length<2) errors.name='Вкажіть ваше ім’я.';
 if(data.property.length<2) errors.property='Вкажіть назву об’єкта.';
 const digits=data.contact.replace(/\D/g,'').length;
 if(!(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.contact) || (/^[+()\d\s.-]+$/.test(data.contact) && digits>=9 && digits<=15))) errors.contact='Вкажіть коректний телефон або email.';
 if(data.units && !/^[1-9]\d{0,4}$/.test(data.units)) errors.units='Вкажіть кількість номерів або юнітів від 1 до 99999.';
 if(!data.consent) errors.consent='Потрібна ваша згода на використання контактів для відповіді.';
 return errors;
}
function showErrors(form,errors) {
 for(const name of ['name','property','contact','units','consent']) {
  form.elements[name].setAttribute('aria-invalid',String(Boolean(errors[name])));
  document.getElementById(`${form.dataset.kind}-${name}-error`).textContent=errors[name]||'';
 }
 const first=Object.keys(errors).find(name=>form.elements[name]);
 if(first) {
  const optional=form.elements[first].closest('details');
  if(optional) optional.open=true;
  form.elements[first].focus();
 }
}
async function submitLead(kind,data) {
 const controller=new AbortController();
 const timer=setTimeout(()=>controller.abort(),15000);
 try {
  const response=await fetch(`/api/leads/${kind}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data),signal:controller.signal});
  const result=await response.json();
  if(!response.ok || result.ok!==true) { const error=new Error(result.message||'Не вдалося надіслати запит. Спробуйте ще раз.');error.fields=result.errors;throw error; }
  return result;
 } finally {clearTimeout(timer);}
}
const submitTrialLead=data=>submitLead('trial',data);
const submitAuditLead=data=>submitLead('audit',data);
document.querySelectorAll('form[data-kind]').forEach(form=>{
 let started=false;
 form.addEventListener('input',()=>{if(!started){started=true;track(`${form.dataset.kind}_form_start`);}}, {passive:true});
 form.addEventListener('submit',async event=>{
  event.preventDefault();
  const kind=form.dataset.kind;
  const submit=form.querySelector('[type=submit]');
  if(submit.disabled || form.dataset.available==='false') return;
  const raw=Object.fromEntries(new FormData(form));
  const data={...raw,name:(raw.name||'').trim(),property:(raw.property||'').trim(),contact:(raw.contact||'').trim(),units:raw.units||'',consent:raw.consent==='on',utm:{}};
  const params=new URLSearchParams(location.search);
  for(const key of ['utm_source','utm_medium','utm_campaign','utm_content','utm_term']) if(params.get(key)) data.utm[key]=params.get(key).slice(0,150);
  const errors=validate(kind,data);
  showErrors(form,errors);
  const status=form.querySelector('.form-status');
  status.textContent='';
  if(Object.keys(errors).length) {track(`${kind}_form_submit_error`,{reason:'validation'});return;}
  submit.disabled=true;submit.textContent='Надсилаємо…';form.setAttribute('aria-busy','true');
  try {
   const result=await(kind==='trial'?submitTrialLead(data):submitAuditLead(data));
   track(`${kind}_form_submit_success`,{lead_id:result.leadId});
   form.hidden=true;
   const success=form.parentElement.querySelector('.form-success');
   success.hidden=false;success.focus();
  } catch(error) {
   if(error.fields) showErrors(form,error.fields);
   status.textContent=error.name==='AbortError'?'Відповідь затримується. Не вдалося підтвердити отримання заявки. Спробуйте пізніше.':error.message==='Failed to fetch'?'Немає зв’язку із сервером. Перевірте інтернет і спробуйте ще раз.':error.message;
   track(`${kind}_form_submit_error`,{reason:error.fields?'validation':'delivery'});
  } finally {submit.disabled=false;submit.textContent=submit.dataset.label;form.removeAttribute('aria-busy');}
 });
});


document.querySelectorAll('[data-faq]').forEach(item=>item.addEventListener('toggle',()=>{if(item.open) track('faq_open',{question_id:item.dataset.faq});}));
