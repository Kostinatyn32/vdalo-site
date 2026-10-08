const formatUAH = value => `${Math.round(value).toLocaleString('uk-UA')} грн`;
const pricingRoot = document.querySelector('#pricing');
if (pricingRoot) {
 let period = 'month';
 const periodConfig = {
  month: { months: 1, factor: 1, label: 'на місяць', suffix: 'на місяць' },
  six: { months: 6, factor: 0.95, label: 'за 6 місяців', suffix: 'за 6 місяців' },
  year: { months: 11, factor: 1, label: 'за 12 місяців', suffix: 'за 12 місяців, платіж за 11' }
 };
 const total = monthly => period === 'six' ? monthly * 6 * .95 : period === 'year' ? monthly * 11 : monthly;
 const amountSuffix = () => periodConfig[period].suffix;
 document.querySelectorAll('[data-billing-period]').forEach(button => button.addEventListener('click', () => {
  period = button.dataset.billingPeriod;
  document.querySelectorAll('[data-billing-period]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
  document.querySelectorAll('[data-plan-card]').forEach(card => {
   const price = Number(card.dataset.basePrice);
   const priceEl = card.querySelector('[data-plan-price]');
   const periodEl = card.querySelector('[data-plan-period]');
   priceEl.textContent = formatUAH(total(price));
   periodEl.textContent = amountSuffix();
  });
  updateEstimates();
 }));
 document.querySelectorAll('[data-pricing-view]').forEach(button => button.addEventListener('click', () => {
  document.querySelectorAll('[data-pricing-view]').forEach(item => { item.setAttribute('aria-selected', String(item === button)); item.tabIndex = item === button ? 0 : -1; });
  document.querySelectorAll('.pricing-panel').forEach(panel => { panel.hidden = panel.id !== button.getAttribute('aria-controls'); });
 }));
 const viewTabs = [...document.querySelectorAll('[data-pricing-view]')];
 viewTabs.forEach((button,index) => button.addEventListener('keydown', event => {
  let next=index;
  if(event.key==='ArrowRight') next=(index+1)%viewTabs.length;
  else if(event.key==='ArrowLeft') next=(index+viewTabs.length-1)%viewTabs.length;
  else if(event.key==='Home') next=0;
  else if(event.key==='End') next=viewTabs.length-1;
  else return;
  event.preventDefault();viewTabs[next].click();viewTabs[next].focus();
 }));
 function hotelPrice(rooms) {
  if (rooms <= 8) return ['Start',390];
  if (rooms <= 12) return ['Mini',990];
  if (rooms <= 40) return ['Hotel',1490 + Math.max(0, rooms - 20) * 50];
  if (rooms <= 80) return ['Hotel+',2990 + (rooms - 40) * 45];
  if (rooms <= 150) return ['Complex',5900 + (rooms - 80) * 30];
  return ['Enterprise / Network',null];
 }
 function updateEstimates() {
  const roomInput = document.querySelector('#hotel-room-count');
  if (roomInput) {
   const rooms = Math.max(1, Number(roomInput.value) || 1);
   const [plan, monthly] = hotelPrice(rooms);
   document.querySelector('[data-estimate-plan]').textContent = `Тариф ${plan} · ${rooms} ${rooms === 1 ? 'номер' : 'номерів'}`;
   document.querySelector('[data-estimate-price]').textContent = monthly === null ? 'Індивідуальний розрахунок' : `${formatUAH(total(monthly))} ${amountSuffix()}`;
   document.querySelector('[data-estimate-note]').textContent = monthly === null ? 'Для понад 150 номерів вартість і склад визначаються індивідуально.' : period === 'year' ? 'Річний період: сплата за 11 місяців.' : period === 'six' ? 'За 6 місяців діє знижка 5% від помісячної суми.' : 'Базовий тариф з урахуванням додаткових номерів. Модулі рахуються окремо.';
  }
  const unitInput = document.querySelector('#apart-unit-count');
  if (unitInput) {
   const units = Math.max(1, Number(unitInput.value) || 1);
   const monthly = 399 + Math.max(0, units - 3) * 79;
   document.querySelector('[data-apart-plan]').textContent = `${units} ${units === 1 ? 'юніт' : 'юнітів'}`;
   document.querySelector('[data-apart-price]').textContent = `${formatUAH(total(monthly))} ${amountSuffix()}`;
   document.querySelector('[data-apart-note]').textContent = period === 'year' ? 'Річний період: сплата за 11 місяців. Підключення без оплати.' : period === 'six' ? 'Знижка 5% при оплаті за 6 місяців. Підключення без оплати.' : 'Підключення без оплати.';
  }
 }
 document.querySelector('#hotel-room-count')?.addEventListener('input', updateEstimates);
 document.querySelector('#apart-unit-count')?.addEventListener('input', updateEstimates);
 updateEstimates();
}
