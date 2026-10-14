import {canCalculateTouristTaxPlace, canIndexTouristTaxPlace, canSearchTouristTaxPlace, getTouristTaxPlace, getTouristTaxRule, touristTaxCommunities, touristTaxPlaces, touristTaxSources} from './tourist-tax-data.mjs';
import {writeFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const ORIGIN = 'https://www.vdalo.tech';
const h = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const dateLabel = value => new Intl.DateTimeFormat('uk-UA',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(`${value}T00:00:00Z`)).replace(/\sр\.$/,' року');
const decimalLabel = value => new Intl.NumberFormat('uk-UA',{minimumFractionDigits:2,maximumFractionDigits:2}).format(value);

function shell({title,description,canonical,robots='index,follow',content,config={}}) {
  return `<!doctype html><html lang="uk"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"><title>${h(title)}</title><meta name="description" content="${h(description)}"><meta name="robots" content="${robots}"><link rel="canonical" href="${h(ORIGIN+canonical)}"><meta name="theme-color" content="#321d35"><link rel="stylesheet" href="/tourist-tax-assets/tourist-tax.css"><link rel="stylesheet" href="/tourist-tax-assets/tourist-tax-interactions.css"><script type="application/json" id="tourist-tax-config">${JSON.stringify(config).replace(/</g,'\\u003c')}</script></head><body><header class="tt-header"><a class="tt-brand" href="/" aria-label="VDALO, на головну">VDALO<span>·</span></a><span class="tt-header-note">Довідник для готелів і гостей</span></header>${content}<footer class="tt-footer"><a href="/blog/turystychnyi-zbir-gotel-ukraina">Як працює туристичний збір</a><span>Інформаційний сервіс VDALO. Для податкового обліку звіряйте дані з першоджерелами.</span></footer><script src="/tourist-tax-assets/tourist-tax.js" defer></script></body></html>`;
}

function sourcesPanel() {
  return `<section class="tt-sources" aria-labelledby="tt-sources-title"><h2 id="tt-sources-title">Офіційні джерела</h2><ul><li><a href="${h(touristTaxSources.taxCode.url)}" rel="noopener">Податковий кодекс України, стаття 268</a></li><li><a href="${h(touristTaxSources.budget2026.url)}" rel="noopener">Закон про Державний бюджет України на 2026 рік</a></li><li><a href="${h(touristTaxSources.katottg.url)}" rel="noopener">Кодифікатор адміністративно-територіальних одиниць</a></li><li><a href="${h(touristTaxSources.territoryList.url)}" rel="noopener">Перелік територій, наказ №376</a></li></ul><p>Місцеву ставку визначає рішення відповідної ради. Для розрахунку Луцька нижче наведено пряме посилання на рішення міськради №77/72.</p></section>`;
}

function calculator(place = null) {
  const name = place?.name ?? '';
  const placeRule=place?getTouristTaxRule(place):null;
  if (place && !canCalculateTouristTaxPlace(place)) return `<section class="tt-calc-card tt-calc-card-locked" aria-labelledby="tt-calc-title"><div class="tt-calc-heading"><p class="tt-eyebrow">КАЛЬКУЛЯТОР ДЛЯ ${h(place.name.toLocaleUpperCase('uk-UA'))}</p><h2 id="tt-calc-title">Для цього населеного пункту розрахунок недоступний</h2><p>У довіднику поки немає повного набору підтверджених місцевих даних для точного розрахунку.</p></div><div class="tt-locked-state" role="status"><strong>Суму буде показано після перевірки ставки й періоду її дії.</strong><span>Калькулятор не підставляє приблизні значення. Скористайтеся посиланням на першоджерело, щоб звірити правило.</span>${placeRule?.sourceUrl?`<a href="${h(placeRule.sourceUrl)}" rel="noopener">Відкрити рішення місцевої ради ↗</a>`:''}</div></section>`;
  const placeField = place ? `<input type="hidden" name="place" value="${h(name)}"><div class="tt-field"><label for="tt-place-visible">Населений пункт</label><input id="tt-place-visible" value="${h(name)}" readonly></div>` : `<div class="tt-field tt-search-wrap"><label for="tt-calc-place">Населений пункт</label><input id="tt-calc-place" name="place" type="search" placeholder="Наприклад, Луцьк" autocomplete="off" role="combobox" aria-expanded="false" aria-controls="tt-calc-place-results" aria-autocomplete="list" aria-describedby="tt-calc-place-help tt-calc-place-status"><span id="tt-calc-place-help" class="tt-hint">Оберіть населений пункт із підтвердженою ставкою. Однойменні місця можуть мати різні правила.</span><div id="tt-calc-place-results" class="tt-results" role="listbox" aria-label="Перевірені населені пункти"></div><p id="tt-calc-place-status" class="tt-hint" aria-live="polite"></p></div>`;
  const locked = place ? ' data-place-slug="'+h(place.slug)+'"' : '';
  return `<section class="tt-calc-card" aria-labelledby="tt-calc-title"><div class="tt-calc-heading"><p class="tt-eyebrow">КАЛЬКУЛЯТОР</p><h2 id="tt-calc-title">Розрахуйте туристичний збір</h2><p>Вкажіть населений пункт, дату початку проживання, кількість розрахункових діб і гостей. Результат з’явиться одразу.</p></div><form class="tt-calc" id="tourist-tax-calculator"${locked} novalidate>${placeField}<div class="tt-field"><label for="tt-start">Дата початку проживання</label><input id="tt-start" name="start" type="date" required></div><div class="tt-field"><label for="tt-days">Розрахункові доби</label><input id="tt-days" name="days" type="number" min="1" max="366" step="1" value="1" inputmode="numeric" required><span class="tt-hint">Одна доба дорівнює 24 годинам між розрахунковими годинами вашого об’єкта. Для точного обліку орієнтуйтеся на фактичний час заїзду та виїзду.</span></div><fieldset class="tt-field tt-guest-groups"><legend>Кількість гостей</legend><div><label for="tt-domestic-guests">Внутрішній туризм</label><input id="tt-domestic-guests" name="domesticGuests" type="number" min="0" max="1000" step="1" value="1" inputmode="numeric"></div><div><label for="tt-inbound-guests">В’їзний туризм</label><input id="tt-inbound-guests" name="inboundGuests" type="number" min="0" max="1000" step="1" value="0" inputmode="numeric"></div><span class="tt-hint">Категорію визначайте за пп. 268.3.1 Податкового кодексу: внутрішній туризм стосується громадян України, які подорожують у межах країни; в’їзний туризм стосується осіб, які прибули в Україну з-за кордону. У складних випадках уточніть її у податкового агента.</span></fieldset><div class="tt-field tt-exemption"><label for="tt-exemption">Чи є підстава для звільнення?</label><select id="tt-exemption" name="exemption"><option value="none">Не знаю або не застосовується</option><option value="claimed">Так, потрібно перевірити</option></select><span class="tt-hint">Результат покаже суму до врахування можливої пільги. Право на звільнення та документи перевірте з податковим агентом.</span></div><button class="tt-button" type="submit">Розрахувати збір</button><div class="tt-result" id="tt-result" role="status" aria-live="polite">${place ? 'Заповніть параметри проживання, щоб побачити орієнтовну суму.' : 'Оберіть населений пункт, щоб почати розрахунок.'}</div></form></section>`;
}

export function renderTouristTaxHub() {
  const availablePlaces=touristTaxPlaces.filter(place=>canSearchTouristTaxPlace(place));
  const placeList=availablePlaces.map(place=>`<li class="tt-place-row"><span><strong>${h(place.name)}</strong><small>${h(place.region)} · ставки, рішення та калькулятор</small></span><a href="${h(place.route)}">Переглянути ставки й розрахувати</a></li>`).join('');
  const minimumWage=touristTaxSources.budget2026.minimumWageOnJanuary1;
  const maxDomestic=decimalLabel(minimumWage*0.5/100);
  const maxInbound=decimalLabel(minimumWage*5/100);
  const infographic=`<section class="tt-infographic" aria-labelledby="tt-infographic-title"><div class="tt-infographic-heading"><div><p class="tt-eyebrow">ТУРИСТИЧНИЙ ЗБІР · 2026</p><h2 id="tt-infographic-title">Ключові цифри для розрахунку</h2></div><span class="tt-infographic-stamp">Дані на 1 січня 2026</span></div><p class="tt-infographic-lead">Ці показники задають законодавчу базу. Фактичну ставку для гостей визначає рішення місцевої ради.</p><div class="tt-infographic-grid"><article class="tt-stat-card tt-stat-wage"><span class="tt-stat-icon" aria-hidden="true">₴</span><span class="tt-stat-label">Мінімальна зарплата на 1 січня</span><strong>${new Intl.NumberFormat('uk-UA').format(minimumWage)} ₴</strong><small>Розрахункова база туристичного збору у 2026 році</small></article><article class="tt-stat-card"><span class="tt-stat-index">01</span><span class="tt-stat-label">Внутрішній туризм</span><strong>до 0,5%</strong><small>Максимум за одну особу за одну добу: ${maxDomestic} ₴</small><div class="tt-cap-track" aria-hidden="true"><span class="tt-cap-fill tt-cap-domestic" style="width:10%"></span></div></article><article class="tt-stat-card"><span class="tt-stat-index">02</span><span class="tt-stat-label">В’їзний туризм</span><strong>до 5%</strong><small>Максимум за одну особу за одну добу: ${maxInbound} ₴</small><div class="tt-cap-track" aria-hidden="true"><span class="tt-cap-fill tt-cap-inbound" style="width:100%"></span></div></article></div><div class="tt-infographic-foot"><div><span class="tt-foot-icon" aria-hidden="true">×</span><p><strong>База нарахування</strong>Кількість розрахункових діб, гостей і місцева ставка</p></div><div><span class="tt-foot-icon" aria-hidden="true">↗</span><p><strong>Звітний період</strong>Календарний квартал згідно з правилами звітності</p></div></div><p class="tt-infographic-note">Граничні 0,5% та 5% не є автоматичною ставкою кожної громади. Суму вище показано для орієнтиру за мінімальною зарплатою 2026 року. Місцеві ставки, винятки та конкретний розрахунок перевіряйте окремо.</p></section>`;
  const seoBlock=`<section class="tt-seo-content" aria-labelledby="tt-seo-title"><p class="tt-eyebrow">ПРАКТИЧНИЙ ДОВІДНИК</p><h2 id="tt-seo-title">Туристичний збір в Україні: як перевірити ставку й розрахувати суму</h2><p>Туристичний збір у готелі залежить від місцевого рішення, категорії туризму, кількості гостей і тривалості проживання. Єдиної ставки для всіх міст України немає: її встановлює рада відповідної громади в межах Податкового кодексу. Тому перед нарахуванням важливо перевірити населений пункт, чинний період і текст рішення, а не переносити ставку з іншого міста.</p><h3>Від чого залежить розмір збору</h3><p>Для розрахунку у 2026 році застосовується мінімальна заробітна плата на 1 січня, що становить 8 647 гривень. Податковий кодекс визначає граничний розмір ставки до 0,5% для внутрішнього туризму та до 5% для в’їзного туризму. Це законодавчі максимуми, а не стандартна ставка: фактичні відсотки потрібно звірити з рішенням місцевої ради. Збір нараховується за одну особу за одну добу тимчасового розміщення.</p><h3>Як користуватися калькулятором туристичного збору</h3><p>Оберіть населений пункт із перевіреною місцевою ставкою, дату початку проживання, розрахункові доби та кількість гостей за категоріями. Калькулятор покаже орієнтовну суму за введеними параметрами й посилання на джерело ставки. Можливі пільги він не підтверджує, тому їхню підставу та документи має перевірити податковий агент. Для обліку і декларації використовуйте первинні дані проживання та актуальні вимоги ДПС.</p><p>Потрібен приклад місцевої ставки? Перейдіть до сторінки <a href="/tourist-tax/lutsk/">туристичного збору в Луцьку</a>, де опубліковано чинне рішення громади, період його дії та окремий калькулятор. Загальні правила можна звірити в <a href="${h(touristTaxSources.taxCode.url)}" rel="noopener">статті 268 Податкового кодексу України</a> і <a href="${h(touristTaxSources.budget2026.url)}" rel="noopener">Законі про Державний бюджет України на 2026 рік</a>.</p><p class="tt-seo-updated">Сторінку оновлено 14 жовтня 2026 року. Перевіряйте дату дії місцевого рішення перед застосуванням ставки.</p></section>`;
  const content = `<main class="tt-main"><section class="tt-hero"><p class="tt-eyebrow">ДОВІДНИК ДЛЯ УКРАЇНИ</p><h1>Туристичний збір в Україні: ставки за містами та калькулятор</h1><p class="tt-lead">Перевірте місцеву ставку, зрозумійте принцип розрахунку та порахуйте орієнтовну суму для гостей вашого об’єкта.</p><a class="tt-button tt-hero-link" href="#tt-calculator">Перейти до калькулятора</a></section><section class="tt-section tt-directory" aria-labelledby="tt-directory-title"><div class="tt-section-heading"><div><p class="tt-eyebrow">ДОВІДНИК МІСТ</p><h2 id="tt-directory-title">Ставки туристичного збору за містами</h2></div></div>${placeList?`<ul class="tt-place-list">${placeList}</ul>`:'<p>Довідник оновлюється з офіційних рішень місцевих рад.</p>'}<p class="tt-hint">У довіднику публікуємо населені пункти, для яких перевірено місцеві дані. Ставки й періоди дії відрізняються між громадами, тому перед застосуванням звірте першоджерело.</p></section>${infographic}<div id="tt-calculator">${calculator()}</div><section class="tt-method"><h2>Як працює туристичний збір</h2><p>Ставку встановлює місцева рада. За статтею 268 Податкового кодексу України її визначають за одну особу за одну добу тимчасового розміщення. Доба становить 24 години між розрахунковими годинами об’єкта.</p><p>Сума залежить від місцевого рішення, категорії туризму, кількості гостей і фактичної кількості діб. Калькулятор показує інформаційний розрахунок на основі вказаних параметрів і чинних даних для обраного міста.</p><p>Можливі звільнення від сплати до результату не застосовуються. Підставу та документи перевіряє податковий агент. Не вводьте в калькулятор імена, паспортні дані або іншу персональну інформацію.</p></section>${sourcesPanel()}<p class="tt-article-link"><a href="/blog/turystychnyi-zbir-gotel-ukraina">Читайте пояснення туристичного збору для готелів →</a></p>${seoBlock}</main>`;
  const publicPlaces=touristTaxPlaces.filter(place=>canSearchTouristTaxPlace(place)).map(({slug,name,region,district})=>({slug,name,region,district}));
  return shell({title:'Туристичний збір в Україні: ставки за містами та калькулятор | VDALO',description:'Туристичний збір в Україні у 2026 році: перевірте місцеві ставки та розрахуйте суму за кількістю гостей і діб проживання.',canonical:'/tourist-tax/',content,config:{publicPlaces}});
}

export function renderTouristTaxCity(slug) {
  const place = getTouristTaxPlace(slug);
  if (!place) return null;
  const rule=getTouristTaxRule(place);
  const placeInLocative=place.nameLocative||place.name;
  const dailyDomestic=decimalLabel(touristTaxSources.budget2026.minimumWageOnJanuary1*rule.rates.domestic/100);
  const dailyInbound=decimalLabel(touristTaxSources.budget2026.minimumWageOnJanuary1*rule.rates.inbound/100);
  const domesticRate=decimalLabel(rule.rates.domestic).replace(/,00$/,'');
  const inboundRate=decimalLabel(rule.rates.inbound).replace(/,00$/,'');
  const content = `<main class="tt-main"><nav class="tt-breadcrumb" aria-label="Навігаційний ланцюжок"><a href="/tourist-tax/">Туристичний збір в Україні</a><span aria-current="page">${h(place.name)}</span></nav><section class="tt-city-hero"><p class="tt-eyebrow">${h(place.region)} · ${h(place.district)}</p><h1>Туристичний збір у ${h(placeInLocative)} у 2026 році</h1><p class="tt-lead">Ставки діють з 1 січня 2026 року. Розрахуйте орієнтовну суму за кількістю гостей і діб проживання.</p><div class="tt-rate-grid"><article><span>Внутрішній туризм</span><strong>${h(domesticRate)}%</strong><small>приблизно ${h(dailyDomestic)} грн за одну особу за добу</small></article><article><span>В’їзний туризм</span><strong>${h(inboundRate)}%</strong><small>приблизно ${h(dailyInbound)} грн за одну особу за добу</small></article></div><p class="tt-updated">Ставки встановлено рішенням Луцької міської ради №${h(rule.decisionNumber)} від ${dateLabel(rule.decisionDate)}. Вони діють з ${dateLabel(rule.effectiveFrom)}.</p></section>${calculator(place)}<section class="tt-section"><h2>Як розрахувати суму</h2><p>Розрахунок залежить від мінімальної заробітної плати на 1 січня відповідного податкового року, місцевої ставки, кількості гостей та розрахункових діб. У 2026 році мінімальна зарплата для цієї формули становить 8 647 грн.</p><div class="tt-formula"><strong>Мінімальна зарплата × ставка громади × кількість гостей × розрахункові доби</strong><span>Розрахункову добу визначають за правилами об’єкта, з інтервалом 24 години між двома розрахунковими годинами.</span></div><p>Для прикладу, одна особа внутрішнього туризму за одну розрахункову добу: 8 647 грн × 0,5% = орієнтовно ${h(dailyDomestic)} грн. Податкове зобов’язання рахують за фактичною ставкою за кожну добу. До декларації суму вносять у гривнях із копійками, накопичену за квартал. Округлення загальної суми готівкового чека не змінює суму збору до обліку.</p></section><section class="tt-section"><h2>Кому нараховують збір і коли перевіряти пільгу</h2><p>Стаття 268 Податкового кодексу визначає платників збору, правила справляння та випадки, коли особа не є платником. Серед передбачених законом категорій є, зокрема, діти до 18 років, окремі особи у відрядженні під час проживання у визначених законом об’єктах, а також інші категорії зі статті 268.2.2.</p><p>Калькулятор не встановлює право на пільгу й не збирає підтвердні документи. Якщо є можлива підстава для звільнення, її слід перевірити з податковим агентом та за актуальним текстом закону.</p></section><section class="tt-section"><h2>Джерела ставок для Луцька</h2><ul class="tt-evidence-list"><li><strong>Рішення Луцької міської ради №${h(rule.decisionNumber)}</strong><p>Рішення від ${dateLabel(rule.decisionDate)} встановлює ставки туристичного збору в Луцькій міській територіальній громаді.</p><a href="${h(rule.sourceUrl)}" rel="noopener">Відкрити рішення міськради ↗</a></li><li><strong>Офіційне повідомлення міськради</strong><p>Публікація пояснює ставки для внутрішнього та в’їзного туризму і дату набрання чинності.</p><a href="${h(rule.ratePublicationUrl)}" rel="noopener">Переглянути пояснення міськради ↗</a></li><li><strong>ДПС Волині: КАТОТТГ і округлення збору</strong><p>Податкова підтверджує код громади та пояснює, як обліковувати суму з копійками кумулятивно за квартал.</p><a href="https://vl.tax.gov.ua/media-ark/news-ark/978756.html" rel="noopener">Код Луцької громади в КАТОТТГ ↗</a> · <a href="https://km.tax.gov.ua/media-ark/news-ark/print-1020882.html" rel="noopener">Правила обчислення сум із копійками ↗</a></li></ul><p class="tt-updated">Джерела звірено ${dateLabel(rule.checkedAt)}. Сторінку оновлюємо, коли змінюються місцеве рішення або законодавча база.</p></section><section class="tt-method"><h2>Поширені запитання</h2><details><summary>Які ставки туристичного збору діють у Луцьку?</summary><p>0,5% для внутрішнього та 1,5% для в’їзного туризму від мінімальної зарплати на 1 січня податкового року за кожну особу й розрахункову добу. Ставки діють з 1 січня 2026 року.</p></details><details><summary>Як рахуються доби проживання?</summary><p>Податковий кодекс визначає добу як 24 години між двома послідовними розрахунковими годинами. Звірте період проживання з годинами, встановленими вашим об’єктом.</p></details><details><summary>Чи враховує калькулятор пільги?</summary><p>Ні. Він показує орієнтовну суму до врахування можливого звільнення. Підставу й документи перевірте з податковим агентом.</p></details><details><summary>Чи можна використовувати результат для звітності?</summary><p>Використовуйте його для попередньої оцінки. Для обліку та декларації застосовуйте фактичні дані проживання, чинні першоджерела, документи та вимоги податкового законодавства.</p></details></section>${sourcesPanel()}<p class="tt-article-link"><a href="/tourist-tax/">Повернутися до довідника туристичного збору →</a></p></main>`;
  const ready=canIndexTouristTaxPlace(place);
  return shell({title:place.editorial.title+' | VDALO',description:place.editorial.description,canonical:place.route,robots:ready?'index,follow':'noindex,follow',content,config:{placeSlug:place.slug,calculationState:canCalculateTouristTaxPlace(place)?'READY':'RATE_UNVERIFIED'}});
}

export function calculateTouristTax({placeSlug, start, end, days, nights, guests, category, guestGroups, exemption='none'}, places=touristTaxPlaces, communities=touristTaxCommunities) {
  const stayDays=days??nights;
  const groups=Array.isArray(guestGroups)?guestGroups:(Number.isSafeInteger(guests)&&['domestic','inbound'].includes(category)?[{category,guests}]:[]);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(start ?? '') || !Number.isSafeInteger(stayDays) || stayDays < 1 || stayDays > 366 || !groups.length || groups.some(group=>!['domestic','inbound'].includes(group.category)||!Number.isSafeInteger(group.guests)||group.guests<0||group.guests>1000) || groups.every(group=>group.guests===0) || !['none','claimed'].includes(exemption)) return {state:'INVALID_INPUT'};
  const first = new Date(`${start}T00:00:00Z`);
  if (Number.isNaN(+first) || first.toISOString().slice(0,10)!==start) return {state:'INVALID_INPUT'};
  if (end!==undefined&&end!==null&&end!=='') {
    const lastInput=new Date(`${end}T00:00:00Z`);
    if(!/^\d{4}-\d{2}-\d{2}$/.test(end)||Number.isNaN(+lastInput)||lastInput.toISOString().slice(0,10)!==end||lastInput<=first)return {state:'INVALID_INPUT'};
  }
  const place = places.find(candidate=>candidate.slug===placeSlug) ?? null;
  if (!place) return {state:'AMBIGUOUS_PLACE'};
  const rule=getTouristTaxRule(place,communities);
  if(!rule)return {state:'RATE_UNVERIFIED'};
  const last=new Date(+first+(stayDays-1)*86400000);
  if (place.geoStatus==='EXCLUDED') return {state:'EXCLUDED_LOCATION'};
  if (place.geoStatus!=='ELIGIBLE'||!place.readiness?.safetyEligible||!place.readiness?.placeVerified||!communities.find(community=>community.slug===place.communitySlug)?.katottgCode) return {state:'AMBIGUOUS_PLACE', reason:place.geoStatusReason};
  if (!place.readiness?.calculatorQaPassed) return {state:'RATE_UNVERIFIED', reason:'Калькулятор для цього правила ще не пройшов перевірку.'};
  if (rule.status==='CONFLICT') return {state:'SOURCE_CONFLICT'};
  if (rule.status!=='VERIFIED') return {state:'RATE_UNVERIFIED', reason:'Місцеве правило ще не має статусу VERIFIED.'};
  const endDate=last.toISOString().slice(0,10);
  if (start<rule.effectiveFrom || (rule.effectiveTo && endDate>rule.effectiveTo)) return {state:'RATE_OUT_OF_PERIOD'};
  if (start.slice(0,4)!==endDate.slice(0,4)) return {state:'RATE_OUT_OF_PERIOD', reason:'Період перетинає податкові роки і потребує окремих підтверджених річних правил.'};
  const exemptionReviewRequired=exemption==='claimed'||Boolean(rule.exemptionReviewRequired);
  const annualBase=touristTaxSources.annualBases[start.slice(0,4)];
  if(!annualBase||!Number.isSafeInteger(annualBase.minimumWageOnJanuary1))return {state:'RATE_OUT_OF_PERIOD',reason:'Для цього року ще немає підтвердженої законодавчої бази.'};
  let totalNumerator=0n;
  const breakdown=[];
  for(const group of groups){
    if(!group.guests)continue;
    const ratePercent=rule.rates[group.category];
    if(!Number.isFinite(ratePercent)||ratePercent<=0)return {state:'RATE_UNVERIFIED'};
    const rateHundredths=BigInt(Math.round(ratePercent*100));
    totalNumerator+=BigInt(annualBase.minimumWageOnJanuary1)*rateHundredths*BigInt(group.guests)*BigInt(stayDays);
    breakdown.push({category:group.category,guests:group.guests,ratePercent});
  }
  const totalCents=((totalNumerator+50n)/100n).toString();
  return {state:'VERIFIED_RESULT',totalCents,days:stayDays,guestGroups:breakdown,minimumWage:annualBase.minimumWageOnJanuary1,ruleVersion:rule.version,sourceUrl:rule.sourceUrl,checkedAt:rule.checkedAt,exemptionReviewRequired};
}

// Exact rational arithmetic in kopecks. ratePercent is represented at 2 decimal places.
// Round once after multiplying people and stay days, not per person/day.
export function calculateExactTouristTaxCents({minimumWage, ratePercent, guests, nights}) {
  if (!Number.isSafeInteger(minimumWage) || minimumWage<0 || !Number.isFinite(ratePercent) || ratePercent<0 || Math.round(ratePercent*100)!==ratePercent*100 || !Number.isSafeInteger(guests) || guests<1 || !Number.isSafeInteger(nights) || nights<1) throw new TypeError('Invalid exact tourist-tax calculation inputs');
  const rateHundredths=BigInt(Math.round(ratePercent*100));
  const numerator=BigInt(minimumWage)*rateHundredths*BigInt(guests)*BigInt(nights);
  const denominator=100n;
  return (numerator+denominator/2n)/denominator;
}

export function exportTouristTaxReviewCsv() {
  const rows=[['settlement_slug','settlement','type','region','district','settlement_katottg','community_katottg','geo_status','tax_decision','decision_date','effective_from','domestic_rate_percent','inbound_rate_percent','tax_status','tax_source','geo_reason','verification_basis']];
  for(const place of touristTaxPlaces){const rule=getTouristTaxRule(place),community=touristTaxCommunities.find(item=>item.slug===place.communitySlug);rows.push([place.slug,place.name,place.settlementType,place.region,place.district,place.katottgSettlementCode??'',community?.katottgCode??'',place.geoStatus,rule?.decisionNumber,rule?.decisionDate,rule?.effectiveFrom,rule?.rates?.domestic,rule?.rates?.inbound,rule?.status,rule?.sourceUrl,place.geoStatusReason,rule?.verificationBasis??'']);}
  return '\uFEFF'+rows.map(row=>row.map(value=>`"${String(value).replace(/"/g,'""')}"`).join(',')).join('\r\n');
}

function xml(value){return String(value??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;');}
function columnName(index){let name='';for(index++;index;index=Math.floor((index-1)/26))name=String.fromCharCode(65+(index-1)%26)+name;return name;}
function crc32(buffer){let crc=0xffffffff;for(const byte of buffer){crc^=byte;for(let bit=0;bit<8;bit++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}return (crc^0xffffffff)>>>0;}
function zipStored(files){
  const local=[],central=[];let offset=0;
  for(const [name,content] of files){
    const filename=Buffer.from(name,'utf8'),data=Buffer.from(content,'utf8'),crc=crc32(data);
    const header=Buffer.alloc(30);header.writeUInt32LE(0x04034b50,0);header.writeUInt16LE(20,4);header.writeUInt16LE(0x0800,6);header.writeUInt16LE(0,8);header.writeUInt32LE(crc,14);header.writeUInt32LE(data.length,18);header.writeUInt32LE(data.length,22);header.writeUInt16LE(filename.length,26);
    local.push(header,filename,data);
    const directory=Buffer.alloc(46);directory.writeUInt32LE(0x02014b50,0);directory.writeUInt16LE(20,4);directory.writeUInt16LE(20,6);directory.writeUInt16LE(0x0800,8);directory.writeUInt16LE(0,10);directory.writeUInt32LE(crc,16);directory.writeUInt32LE(data.length,20);directory.writeUInt32LE(data.length,24);directory.writeUInt16LE(filename.length,28);directory.writeUInt32LE(offset,42);
    central.push(directory,filename);offset+=header.length+filename.length+data.length;
  }
  const centralData=Buffer.concat(central),end=Buffer.alloc(22);end.writeUInt32LE(0x06054b50,0);end.writeUInt16LE(files.length,8);end.writeUInt16LE(files.length,10);end.writeUInt32LE(centralData.length,12);end.writeUInt32LE(offset,16);
  return Buffer.concat([...local,centralData,end]);
}

export function exportTouristTaxReviewXlsx(){
  const rows=[['settlement_slug','settlement','type','region','district','settlement_katottg','community_katottg','geo_status','tax_decision','decision_date','effective_from','domestic_rate_percent','inbound_rate_percent','tax_status','tax_source','geo_reason','verification_basis']];
  for(const place of touristTaxPlaces){const rule=getTouristTaxRule(place),community=touristTaxCommunities.find(item=>item.slug===place.communitySlug);rows.push([place.slug,place.name,place.settlementType,place.region,place.district,place.katottgSettlementCode??'',community?.katottgCode??'',place.geoStatus,rule?.decisionNumber,rule?.decisionDate,rule?.effectiveFrom,rule?.rates?.domestic,rule?.rates?.inbound,rule?.status,rule?.sourceUrl,place.geoStatusReason,rule?.verificationBasis??'']);}
  const sheet=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${rows.map((row,r)=>`<row r="${r+1}">${row.map((value,c)=>{const ref=`${columnName(c)}${r+1}`;return typeof value==='number'?`<c r="${ref}"><v>${value}</v></c>`:`<c r="${ref}" t="inlineStr"><is><t xml:space="preserve">${xml(value)}</t></is></c>`}).join('')}</row>`).join('')}</sheetData></worksheet>`;
  return zipStored([
    ['[Content_Types].xml','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>'],
    ['_rels/.rels','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'],
    ['xl/workbook.xml','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Tourist tax review" sheetId="1" r:id="rId1"/></sheets></workbook>'],
    ['xl/_rels/workbook.xml.rels','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>'],
    ['xl/worksheets/sheet1.xml',sheet],
  ]);
}

export async function writeTouristTaxEditorialExports(outputDirectory){
  const moduleRoot=path.dirname(fileURLToPath(import.meta.url));
  const destination=outputDirectory??path.resolve(moduleRoot,'../../seo-workspace/tourist-tax/exports');
  await mkdir(destination,{recursive:true});
  await Promise.all([
    writeFile(path.join(destination,'tourist-tax-review.csv'),exportTouristTaxReviewCsv()),
    writeFile(path.join(destination,'tourist-tax-review.xlsx'),exportTouristTaxReviewXlsx()),
  ]);
  return destination;
}

export async function handleTouristTaxCalculation(req,res){
  const respond=(status,payload)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Vary':'Origin'});res.end(JSON.stringify(payload));};
  if(req.method!=='POST')return respond(405,{error:'Method not allowed'});
  const origin=req.headers.origin,host=req.headers.host;
  try{if(!origin||!host||new URL(origin).host.toLowerCase()!==host.toLowerCase())return respond(403,{error:'Origin not allowed'});}catch{return respond(403,{error:'Origin not allowed'});}
  if(!/^application\/json(?:\s*;|$)/i.test(req.headers['content-type']||''))return respond(415,{error:'Content-Type must be application/json'});
  const declaredLength=Number(req.headers['content-length']||0);
  if(declaredLength>4096)return respond(413,{error:'Request too large'});
  const chunks=[];let size=0;
  try{for await(const chunk of req){size+=chunk.length;if(size>4096)return respond(413,{error:'Request too large'});chunks.push(Buffer.from(chunk));}}catch{return respond(400,{error:'Invalid request'});}
  let body;
  try{body=JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{return respond(400,{error:'Invalid JSON'});}
  const result=calculateTouristTax({placeSlug:body.placeSlug,start:body.start,days:body.days,nights:body.nights,guests:body.guests,category:body.category,guestGroups:body.guestGroups,exemption:body.exemption});
  return respond(200,result);
}
