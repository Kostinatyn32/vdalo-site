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
 if(interest && (!form.elements.pain.value || form.elements.pain.value===form.dataset.autoInterest)) {
  const value=`Хочу перевірити сценарій: ${interest}`;
  form.elements.pain.value=value;
  form.dataset.autoInterest=value;
  const context=dialog.querySelector('.selected-interest');
  if(context) {context.hidden=false;context.textContent=`Обраний сценарій: ${interest}`;}
 }
 dialog.showModal();
 document.body.classList.add('dialog-open');
 track(`${kind}_form_open`,{location:source});
 if(source==='hero'||source==='final') track(`${source}_${kind}_click`);
 requestAnimationFrame(()=>dialog.querySelector('input:not([type=checkbox])').focus());
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
  if(submit.disabled) return;
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

const tabs=[...document.querySelectorAll('[data-step]')];
function activateStep(index,focus=false) {
 tabs.forEach((tab,i)=>{tab.setAttribute('aria-selected',String(i===index));tab.tabIndex=i===index?0:-1;document.querySelector(`#journey-panel-${i}`).hidden=i!==index;});
 if(focus) tabs[index].focus();
}
tabs.forEach((tab,index)=>{
 tab.addEventListener('click',()=>activateStep(index));
 tab.addEventListener('keydown',event=>{
  let next=index;
  if(event.key==='ArrowRight') next=(index+1)%tabs.length;
  else if(event.key==='ArrowLeft') next=(index+tabs.length-1)%tabs.length;
  else if(event.key==='Home') next=0;
  else if(event.key==='End') next=tabs.length-1;
  else return;
  event.preventDefault();activateStep(next,true);
 });
});
document.querySelectorAll('[data-faq]').forEach(item=>item.addEventListener('toggle',()=>{if(item.open) track('faq_open',{question_id:item.dataset.faq});}));
if('IntersectionObserver' in window) {
 const hero=document.querySelector('.hero-v2');
 const sticky=document.querySelector('.mobile-cta');
 if(hero&&sticky) new IntersectionObserver(entries=>sticky.classList.toggle('visible',!entries[0].isIntersecting),{threshold:0}).observe(hero);
 const features=document.querySelector('#features');
 if(features) {const observer=new IntersectionObserver(entries=>{if(entries[0].isIntersecting){track('feature_section_view');observer.disconnect();}},{threshold:.05});observer.observe(features);}
 const pricing=document.querySelector('#pricing');
 if(pricing) {const observer=new IntersectionObserver(entries=>{if(entries[0].isIntersecting){track('pricing_section_view');observer.disconnect();}},{threshold:.05});observer.observe(pricing);}
 const addons=document.querySelector('#pricing-addons');
 if(addons) {const observer=new IntersectionObserver(entries=>{if(entries[0].isIntersecting){track('pricing_addons_view');observer.disconnect();}},{threshold:.05});observer.observe(addons);}
}

// Product and role exploration only changes the explanatory page state.
function setupTabSet(selector,panelPrefix,property,orientation='horizontal') {
 const controls=[...document.querySelectorAll(selector)];
 const select=(index,focus=false)=>{
  controls.forEach((control,i)=>{
   const selected=i===index;
   control.setAttribute('aria-selected',String(selected));
   control.tabIndex=selected?0:-1;
   document.getElementById(panelPrefix+control.dataset[property]).hidden=!selected;
  });
  if(focus) {controls[index].focus();controls[index].scrollIntoView({block:'nearest',inline:'nearest'});}
  track(property==='product'?'product_module_view':'role_view',{item:controls[index].dataset[property]});
 };
 controls.forEach((control,index)=>{
  control.addEventListener('click',()=>select(index));
  control.addEventListener('keydown',event=>{
   let next=index;
   if(event.key==='ArrowRight'||(orientation==='vertical'&&event.key==='ArrowDown')) next=(index+1)%controls.length;
   else if(event.key==='ArrowLeft'||(orientation==='vertical'&&event.key==='ArrowUp')) next=(index+controls.length-1)%controls.length;
   else if(event.key==='Home') next=0;
   else if(event.key==='End') next=controls.length-1;
   else return;
   event.preventDefault();select(next,true);
  });
 });
}
setupTabSet('[data-product]','product-panel-','product','vertical');
setupTabSet('[data-role]','role-panel-','role');

const calendarNode=document.getElementById('calendar-data');
if(calendarNode) {
 const calendar=JSON.parse(calendarNode.textContent);
 const grid=document.getElementById('reservation-grid');
 const details=document.getElementById('reservation-detail');
 let week=0;
 let channel='all';
 let selectedId=null;
 const clearDetails=()=>{
  selectedId=null;
  details.replaceChildren();
  const symbol=document.createElement('span');symbol.className='detail-symbol';symbol.setAttribute('aria-hidden','true');symbol.textContent='+';
  const copy=document.createElement('div');const title=document.createElement('strong');title.textContent='Оберіть бронювання у шахматці.';
  const note=document.createElement('p');note.textContent='Побачте зв’язок дат, номера, каналу та статусу.';copy.append(title,note);details.append(symbol,copy);
 };
 const selectReservation=item=>{
  selectedId=item.id;
  grid.querySelectorAll('[data-reservation]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.reservation===item.id)));
  details.replaceChildren();
  const room=document.createElement('span');room.className='detail-symbol';room.textContent=calendar.rooms[item.room][0];room.style.fontSize='11px';
  const copy=document.createElement('div');const title=document.createElement('strong');title.textContent=`${item.label} / ${item.status}`;
  const note=document.createElement('p');note.textContent=item.note;copy.append(title,note);
  const record=document.createElement('div');record.className='detail-record';
  for(const [label,value] of [['Заїзд',item.arrival],['Виїзд',item.departure]]) {const field=document.createElement('div');field.textContent=label;const strong=document.createElement('strong');strong.textContent=value;field.append(strong);record.append(field);}
  details.append(room,copy,record);
  track('calendar_reservation_view',{sample_id:item.id});
 };
 const applyFilter=()=>{
  grid.querySelectorAll('[data-reservation]').forEach(button=>{
   const hidden=channel!=='all'&&button.dataset.channel!==channel;
   button.classList.toggle('is-filtered',hidden);
   button.setAttribute('aria-hidden',String(hidden));
   button.tabIndex=hidden?-1:0;
  });
  const selected=calendar.weeks[week].find(item=>item.id===selectedId);
  if(selected&&channel!=='all'&&selected.channel!==channel) clearDetails();
 };
 function bindReservations() {
  grid.querySelectorAll('[data-reservation]').forEach(button=>button.addEventListener('click',()=>{
   const item=calendar.weeks[week].find(entry=>entry.id===button.dataset.reservation);
   if(item) selectReservation(item);
  }));
 }
 const showWeek=()=>{
  grid.querySelectorAll('[data-reservation]').forEach(button=>button.remove());
  calendar.weeks[week].forEach(item=>{
   const button=document.createElement('button');button.type='button';button.className=`reservation ${item.channel}`;
   button.style.gridColumn=`${item.start+2} / span ${item.nights}`;button.style.gridRow=String(item.room+2);
   button.dataset.reservation=item.id;button.dataset.channel=item.channel;button.setAttribute('aria-pressed','false');
   button.setAttribute('aria-label',`${item.label}, номер ${calendar.rooms[item.room][0]}, ${item.arrival} до ${item.departure}`);
   const name=document.createElement('span');name.textContent=item.label;const state=document.createElement('small');state.textContent=item.status;button.append(name,state);grid.append(button);
  });
  document.querySelectorAll('[data-day]').forEach(day=>day.textContent=String(6+week*7+Number(day.dataset.day)));
  document.getElementById('calendar-period').textContent=week===0?'06-12 жовтня 2026':'13-19 жовтня 2026';
  document.querySelector('[data-week=previous]').disabled=week===0;
  document.querySelector('[data-week=next]').disabled=week===calendar.weeks.length-1;
  clearDetails();bindReservations();applyFilter();
 };
 document.querySelectorAll('[data-filter]').forEach(button=>button.addEventListener('click',()=>{
  channel=button.dataset.filter;
  document.querySelectorAll('[data-filter]').forEach(control=>control.setAttribute('aria-pressed',String(control===button)));
  applyFilter();track('calendar_filter',{channel});
 }));
 document.querySelectorAll('[data-week]').forEach(button=>button.addEventListener('click',()=>{
  week=Math.max(0,Math.min(calendar.weeks.length-1,week+(button.dataset.week==='next'?1:-1)));
  showWeek();track('calendar_week_change',{week});
 }));
 bindReservations();
}

if('IntersectionObserver' in window&&!matchMedia('(prefers-reduced-motion: reduce)').matches) {
 const revealObserver=new IntersectionObserver(entries=>{
  entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('reveal-enter');revealObserver.unobserve(entry.target);}});
 },{threshold:.12});
 document.querySelectorAll('[data-reveal]').forEach(node=>revealObserver.observe(node));
}

// Progressive enhancement: reading position, section entry and responsive panel feedback.
(() => {
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const header=document.querySelector('.header');
 const progress=document.createElement('div');progress.className='reading-progress';progress.setAttribute('aria-hidden','true');header?.append(progress);
 const links=[...document.querySelectorAll('#navigation a[href^="#"]')];
 let queued=false;
 const update=()=>{
  queued=false;const maximum=document.documentElement.scrollHeight-innerHeight;
  progress.style.transform=`scaleX(${maximum>0?Math.max(0,Math.min(1,scrollY/maximum)):0})`;
  let active=null;
  links.forEach(link=>{const node=document.querySelector(link.getAttribute('href'));if(node&&node.getBoundingClientRect().top<180)active=link;});
  links.forEach(link=>{if(link===active)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');});
 };
 addEventListener('scroll',()=>{if(!queued){queued=true;requestAnimationFrame(update);}},{passive:true});addEventListener('resize',update);update();
 if('IntersectionObserver' in window){
  const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('is-in-view');observer.unobserve(entry.target);}}),{threshold:.08});
  document.querySelectorAll('.calendar-shell,.integration-flow,.product-browser,.arrival-image,.migration-path,.start-routes').forEach(node=>{
   if(!reduced.matches)node.classList.add('motion-ready');observer.observe(node);
  });
 }
 document.addEventListener('click',event=>{
  const control=event.target.closest('[data-product],[data-step],[data-role]');
  if(!control||reduced.matches)return;
  const panel=document.getElementById(control.getAttribute('aria-controls'));
  if(panel&&typeof panel.animate==='function')panel.animate([{opacity:.65,transform:'translateY(8px)'},{opacity:1,transform:'translateY(0)'}],{duration:240,easing:'cubic-bezier(.22,1,.36,1)'});
 });
})();
// Keep the fixed mobile action from duplicating the final invitation.
if('IntersectionObserver' in window) {
 const endVisibility=new Map();
 const endObserver=new IntersectionObserver(entries=>{
  entries.forEach(entry=>endVisibility.set(entry.target,entry.isIntersecting));
  document.body.classList.toggle('end-in-view',[...endVisibility.values()].some(Boolean));
 },{threshold:0});
 document.querySelectorAll('.final-v2,.footer-v2').forEach(node=>endObserver.observe(node));
}
