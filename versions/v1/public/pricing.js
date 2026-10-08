const pricingRoot = document.querySelector('#pricing');
const core = window.VDALO_PRICING;
if (pricingRoot && core) {
 const money = value => `${Math.round(value).toLocaleString('uk-UA')} грн`;
 let period = 'month';
 const roomInput = pricingRoot.querySelector('#hotel-room-count');
 const moduleInputs = [...pricingRoot.querySelectorAll('[data-module]')];
 const periodMonths = {month:1,six:6,year:12};
 const applyPlanPeriod = monthly => core.applyPeriod(monthly,period);
 const roomLabel = count => count === 1 ? 'номер' : 'номерів';
 const selectedModules = () => moduleInputs.filter(input=>input.checked).map(input=>input.dataset.module);
 const estimateData = () => {
  const rooms = Math.max(1,Math.floor(Number(roomInput?.value)||1));
  const plan = core.hotelPlan(rooms);
  const modules = core.modulesPrice(plan.id,rooms,selectedModules());
  const periodPlan = core.applyPeriod(plan.monthly,period);
  const estimateMonthly = (periodPlan.monthlyEquivalent ?? 0) + modules.sum;
  return {plan,rooms,modules,periodPlan,estimateMonthly,isFrom:modules.isFrom||plan.monthly===null};
 };
 function activateTab(id,focus=false) {
  const tabs=[...pricingRoot.querySelectorAll('[data-pricing-view]')];
  tabs.forEach(tab=>{const active=tab.dataset.pricingView===id;tab.setAttribute('aria-selected',String(active));tab.tabIndex=active?0:-1;});
  pricingRoot.querySelectorAll('.pricing-panel[role="tabpanel"]').forEach(panel=>panel.hidden=panel.id!==`pricing-panel-${id}`);
  if(focus) pricingRoot.querySelector(`[data-pricing-view="${id}"]`)?.focus();
 }
 const priceOfGroup={small:'start',medium:'hotel',large:'complex'};
 const showEstimate = () => {
  const data=estimateData();
  const {plan,rooms,modules,periodPlan,estimateMonthly,isFrom}=data;
  const group=rooms<=12?'small':rooms<=80?'medium':'large';
  activateTab(group);
  pricingRoot.querySelectorAll('[data-plan-card]').forEach(card=>{
   const active=card.dataset.planCard===plan.id;
   card.classList.toggle('is-current',active);
   card.querySelector('.price-card-current')?.remove();
   if(active){const badge=document.createElement('span');badge.className='price-card-current';badge.textContent='Ваш тариф';card.prepend(badge);}
   const cardPlan=core.plans[card.dataset.planCard];
   const shown=active&&plan.monthly!==null?periodPlan.monthlyEquivalent:cardPlan.monthly;
   const priceNode=card.querySelector('[data-plan-price]');
   if(priceNode)priceNode.textContent=shown===null?'Від 9 900 грн':money(shown);
   const periodNode=card.querySelector('[data-plan-period]');
   if(periodNode)periodNode.textContent=period==='month'?'на місяць':`на місяць у перерахунку за ${periodMonths[period]} міс.`;
  });
  pricingRoot.querySelectorAll('[data-billing-period]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.billingPeriod===period)));
  moduleInputs.forEach(input=>{const price=pricingRoot.querySelector(`[data-module-price="${input.dataset.module}"]`);if(!price)return;const module=core.modules[input.dataset.module];const detail=core.modulesPrice(plan.id,rooms,[input.dataset.module]);price.textContent=detail.notes[0]||`${module.price.toLocaleString('uk-UA')} грн / міс`;});
  const totalText=plan.monthly===null?'Індивідуальний розрахунок':`${isFrom?'Від ':''}${money(estimateMonthly)} на місяць`;
  pricingRoot.querySelector('[data-estimate-plan]').textContent=`Тариф ${plan.name} · ${rooms} ${roomLabel(rooms)}`;
  pricingRoot.querySelector('[data-estimate-price]').textContent=totalText;
  pricingRoot.querySelector('[data-estimate-period-total]').textContent=period==='month'||plan.monthly===null?'':`До сплати за ${periodMonths[period]} місяців: ${money(periodPlan.total+modules.sum*periodMonths[period])}`;
  const details=[...modules.notes];
  if(plan.monthly!==null && periodPlan.monthlyEquivalent!==plan.monthly) details.unshift(`Тариф: ${money(periodPlan.monthlyEquivalent)} на місяць`);
  pricingRoot.querySelector('[data-estimate-breakdown]').textContent=details.length?details.join(' · '):'Базовий тариф. Додаткові модулі не вибрані.';
  pricingRoot.querySelector('[data-sticky-plan]').textContent=`Ваш тариф: ${plan.name}`;
  pricingRoot.querySelector('[data-sticky-price]').textContent=totalText;
  const estimate={plan:plan.name,rooms,period,modules:selectedModules(),estimateMonthly,isFrom};
  window.VDALO_CURRENT_ESTIMATE=estimate;
  pricingRoot.querySelectorAll('[data-pricing-submit]').forEach(button=>button.dataset.interest=`Розрахунок: ${plan.name}, ${rooms} номерів, ${totalText}`);
 };
 pricingRoot.querySelectorAll('[data-pricing-view]').forEach((tab,index,all)=>{
  tab.addEventListener('click',()=>activateTab(tab.dataset.pricingView));
  tab.addEventListener('keydown',event=>{let next=index;if(event.key==='ArrowRight')next=(index+1)%all.length;else if(event.key==='ArrowLeft')next=(index+all.length-1)%all.length;else if(event.key==='Home')next=0;else if(event.key==='End')next=all.length-1;else return;event.preventDefault();activateTab(all[next].dataset.pricingView,true);});
 });
 pricingRoot.querySelectorAll('[data-billing-period]').forEach(button=>button.addEventListener('click',()=>{period=button.dataset.billingPeriod;showEstimate();}));
 roomInput?.addEventListener('input',showEstimate);
 const planRoomDefaults={start:5,mini:10,hotel:20,'hotel-plus':50,complex:90,enterprise:151};
 pricingRoot.querySelectorAll('[data-select-plan]').forEach(link=>link.addEventListener('click',event=>{event.preventDefault();roomInput.value=String(planRoomDefaults[link.dataset.selectPlan]||20);showEstimate();roomInput.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'center'});roomInput.focus({preventScroll:true});}));
 moduleInputs.forEach(input=>input.addEventListener('change',showEstimate));
 const presets={evening:['assistant','checkin','access'],accounting:['prro','finance']};
 pricingRoot.querySelectorAll('[data-module-preset]').forEach(button=>button.addEventListener('click',()=>{
  const ids=presets[button.dataset.modulePreset]||[];
  const remove=button.getAttribute('aria-pressed')==='true';
  if(button.dataset.modulePreset==='evening') for(const other of pricingRoot.querySelectorAll('[data-module-preset]')) if(other!==button)other.setAttribute('aria-pressed','false');
  for(const input of moduleInputs) if(ids.includes(input.dataset.module))input.checked=!remove;
  button.setAttribute('aria-pressed',String(!remove));showEstimate();
 }));
 pricingRoot.querySelector('#apart-unit-count')?.addEventListener('input',event=>{pricingRoot.querySelector('[data-apart-price]').textContent=`${money(core.apartPrice(event.target.value))} на місяць`;});
 if('IntersectionObserver' in window){const pricingObserver=new IntersectionObserver(entries=>{const visible=entries.some(entry=>entry.isIntersecting);pricingRoot.querySelector('[data-pricing-sticky]').classList.toggle('visible',visible);document.body.classList.toggle('pricing-visible',visible);},{threshold:.1});pricingObserver.observe(pricingRoot);}
 showEstimate();
}
