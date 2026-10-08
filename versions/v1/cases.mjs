import {renderPage, escape} from './render.mjs';

const e = escape;
const origin = 'https://vdalo.tech';
const slug = '/cases/hotel-ai-reception';

const caseStudy = {
 title: 'Вечірній ресепшен без окремого адміністратора',
 lead: 'Готель у Німеччині тримав окрему людину на вечірню зміну, щоб видавати ключі та відповідати на однакові запитання. Тепер цю роботу виконує vdalo.tech, а окрема вечірня ставка більше не потрібна.',
 cardLead: 'Готель у Німеччині передав vdalo.tech вечірнє заселення та відповіді на типові запитання. Окрема вечірня ставка більше не потрібна.',
 metrics: [
  ['20 000 грн → 1 500 грн', 'Витрати на місяць'],
  ['У 13 разів', 'Дешевше за окремого адміністратора'],
  ['222 000 грн', 'Розрахункова економія на рік'],
  ['4 → 3', 'Адміністратори в штаті, з планом скоротити до 2']
 ],
 situation: [
  'Щовечора приблизно з 16:00 до 19:00 на рецепції мала бути людина. Для цього власник тримав окремого працівника. Інколи на вечір доводилося залишатися й штатним адміністраторам.',
  'Робота була рутинною і повторювалася щодня.'
 ],
 situationTasks: [
  'Зустріти гостя, назвати номер, видати ключ або код від кодової скриньки.',
  'Пояснити, де парковка і як пройти до номера.',
  'Відповісти на ті самі запитання, які ставить майже кожен гість.'
 ],
 implemented: [
  ['Онлайн-реєстрація', 'Гість заздалегідь заповнює дані та передає документи без паперу й черги.'],
  ['Доступ без людини', 'Гість автоматично отримує номер кімнати й код доступу.'],
  ['Адміністратор на основі ШІ', 'Відповідає на типові запитання про парковку, Wi-Fi, розташування номера та правила проживання.'],
  ['Пам’ять про гостя', 'Система зберігає зазначені вподобання, наприклад тихий номер або певний вид, щоб наступного разу запропонувати відповідний варіант.']
 ],
 results: [
  'Окрема вечірня ставка на рецепції більше не потрібна.',
  'У штаті 3 адміністратори замість 4. У планах скоротити штат до 2.',
  'Адміністратори працюють у першу зміну приблизно до 15:00 і більше не залишаються на вечір.',
  'Документи гостей збираються в системі, а не вручну, тож стало менше ручної роботи й помилок.'
 ],
 guestChanges: [
  'Гість може заселитися у зручний для себе час і не чекати адміністратора.',
  'Відповіді на прості запитання доступні одразу.',
  'Адміністратори, які залишилися в команді, мають більше часу на живе спілкування з гостями замість видавання ключів.'
 ]
};

function list(items) { return `<ul>${items.map(item => `<li>${e(item)}</li>`).join('')}</ul>`; }
function meta(html, title, description, canonical, type) {
 const structured = JSON.stringify({
  '@context': 'https://schema.org',
  '@type': type,
  name: title,
  headline: title,
  description,
  url: canonical,
  inLanguage: 'uk',
  publisher: {'@type':'Organization', name:'vdalo.tech'}
 }).replace(/</g, '\\u003c');
 html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${e(title)}</title>`)
  .replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${e(description)}">`)
  .replace(/<meta name="robots" content="[^"]*">/, '<meta name="robots" content="index,follow">')
  .replace(/<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${e(title)}">`)
  .replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${e(description)}">`)
  .replace(/<meta property="og:url" content="[^"]*">/, `<meta property="og:url" content="${canonical}">`)
  .replace(/<link rel="canonical" href="[^"]*">/, `<link rel="canonical" href="${canonical}">`)
  .replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, `<script type="application/ld+json">${structured}</script>`);
 return html;
}
function pageShell(content, {title, description, canonical, type}) {
 let html = renderPage({origin, full:true});
 html = html.replace(/<main id="main">[\s\S]*?<\/main>/, `<main id="main">${content}</main>`);
 html = html.replace(/<link rel="stylesheet" href="\/design-system-2\.css[^>]*>/, match => `${match}<link rel="stylesheet" href="/cases.css">`);
 html = html.replace(/<nav id="navigation"[\s\S]*?<\/nav>/, nav => nav.replace(/href="#([^\"]+)"/g, 'href="/v1/#$1"'));
 html = html.replace(/<footer[\s\S]*?<\/footer>/, footer => footer.replace(/href="#([^\"]+)"/g, 'href="/v1/#$1"'));
 return meta(html, title, description, canonical, type || 'WebPage');
}

export function renderCaseList() {
 const title = 'Кейси vdalo.tech | Досвід готелів';
 const description = 'Практичні приклади, як готелі використовують vdalo.tech для роботи з гостями та щоденними процесами.';
 const content = `<section class="case-index-hero"><div class="wrap"><p class="eyebrow">ВДАЛІ РІШЕННЯ / КЕЙСИ</p><h1>Як готелі прибирають рутину</h1><p class="case-index-lead">Практичні приклади роботи з vdalo.tech та зміни у щоденних процесах готелю.</p></div></section><section class="section case-index-list"><div class="wrap"><article class="case-card"><div class="case-card-copy"><p class="eyebrow">ГОТЕЛЬ У НІМЕЧЧИНІ</p><h2>${e(caseStudy.title)}</h2><p class="case-card-metric">у 13 разів дешевше</p><p>${e(caseStudy.cardLead)}</p><a class="button dark" href="${slug}">Читати кейс <span aria-hidden="true">→</span></a></div><div class="case-card-side" aria-hidden="true"><span>20 000 грн</span><i>↓</i><strong>1 500 грн</strong><small>витрати на місяць</small></div></article></div></section>`;
 return pageShell(content, {title, description, canonical:`${origin}/cases`, type:'CollectionPage'});
}

export function renderHotelReceptionCase() {
 const title = `${caseStudy.title} | Кейси vdalo.tech`;
 const description = 'Як готель у Німеччині перевів вечірнє заселення та типові запитання гостей в автоматичний режим.';
 const metrics = caseStudy.metrics.map(([value,label]) => `<article class="case-metric"><strong>${e(value)}</strong><span>${e(label)}</span></article>`).join('');
 const implemented = caseStudy.implemented.map(([heading,copy]) => `<li><strong>${e(heading)}.</strong> ${e(copy)}</li>`).join('');
 const content = `<article class="hotel-case">
  <header class="hotel-case-hero"><div class="wrap"><a class="case-back" href="/cases">← Усі кейси</a><p class="eyebrow">КЕЙС / ГОТЕЛЬ У НІМЕЧЧИНІ</p><h1>${e(caseStudy.title)}</h1><p class="case-lead">${e(caseStudy.lead)}</p></div></header>
  <section class="case-metrics-section"><div class="wrap"><div class="case-metrics">${metrics}</div><p class="case-footnote">Розрахунок для готелю в Україні: зарплата адміністратора 20 000 грн на місяць, vdalo.tech 1 500 грн на місяць. Порівняння не враховує податки та інші витрати на персонал.</p></div></section>
  <div class="wrap case-article-body">
   <section class="case-section" id="situation"><p class="eyebrow">01 / ДО ВПРОВАДЖЕННЯ</p><h2>Ситуація</h2><div class="case-prose"><p>${e(caseStudy.situation[0])}</p><p>${e(caseStudy.situation[1])}</p>${list(caseStudy.situationTasks)}<p>Цю повторювану роботу можна було передати системі.</p></div></section>
   <section class="case-section" id="implementation"><p class="eyebrow">02 / НАЛАШТУВАННЯ</p><h2>Що ми зробили</h2><div class="case-prose"><p>Підключили vdalo.tech і перевели вечірню роботу рецепції в автоматичний режим:</p><ul>${implemented}</ul></div></section>
   <section class="case-section" id="results"><p class="eyebrow">03 / ЗМІНИ В РОБОТІ</p><h2>Результат</h2><div class="case-prose">${list(caseStudy.results)}</div></section>
   <section class="case-section" id="guest-experience"><p class="eyebrow">04 / ДОСВІД ГОСТЯ</p><h2>Що змінилося для гостей</h2><div class="case-prose"><p>Гості отримали більше свободи під час заселення, а команда може приділити більше уваги особистому спілкуванню.</p>${list(caseStudy.guestChanges)}</div></section>
   <section class="case-section case-economics" id="ukraine-calculation"><p class="eyebrow">05 / ПРИКЛАД РОЗРАХУНКУ</p><h2>Скільки це для готелю в Україні</h2><div class="case-prose"><div class="case-table-wrap"><table><thead><tr><th scope="col"></th><th scope="col">Адміністратор</th><th scope="col">vdalo.tech</th></tr></thead><tbody><tr><th scope="row">На місяць</th><td>20 000 грн</td><td>1 500 грн</td></tr><tr><th scope="row">На рік</th><td>240 000 грн</td><td>18 000 грн</td></tr></tbody></table></div><p>За умови, що одна ставка більше не потрібна, різниця між наведеними сумами становить 18 500 грн на місяць або 222 000 грн на рік.</p><p>Якщо система дозволяє прибрати дві ставки, різниця становить 38 500 грн на місяць або 462 000 грн на рік.</p><p class="case-footnote">Це арифметичний приклад на основі вказаних сум. Фактичний результат залежить від процесів і витрат конкретного готелю.</p></div></section>
   <blockquote class="case-quote"><p>«Ресепшен не зник. Зникла рутина, за яку готель платив щомісяця».</p></blockquote>
  </div>
  <section class="case-cta"><div class="wrap"><div><p class="eyebrow">ВДАЛО / НАСТУПНИЙ КРОК</p><h2>Скільки ви платите за рутину на рецепції?</h2><p>Покажемо, яку частину роботи адміністраторів можна передати vdalo.tech у вашому готелі.</p></div><a class="button dark" href="/v1/#pricing">Переглянути тарифи <span aria-hidden="true">→</span></a></div></section>
 </article>`;
 return pageShell(content, {title, description, canonical:`${origin}${slug}`, type:'Article'});
}
