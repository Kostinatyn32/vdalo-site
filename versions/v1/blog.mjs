import {renderPage} from './render.mjs';
import {pmsArticle} from './article-pms.mjs';
import {pmsChoiceArticle} from './article-pms-choice.mjs';

const topics = [
  ['Основи системи керування готелем', 'Що таке PMS, які задачі вона покриває та як пояснити її роботу команді простою мовою.', 'pms'],
  ['Бронювання та календар номерів', 'Як звести дати, доступність і бронювання в зрозумілий робочий процес.', 'calendar'],
  ['Канали продажу', 'Що варто перевірити перед підключенням Booking.com, Airbnb та інших каналів до системи.', 'channels'],
  ['Заїзд і комунікація з гостем', 'Як підготувати інформацію до прибуття та не втратити важливі звернення гостя.', 'guest'],
  ['Робота команди готелю', 'Передавання змін, статус готовності номера та координація рецепції з housekeeping.', 'team'],
  ['Документи й локальні процеси', 'Документи, туристичний збір і чеки: що перевіряти в щоденній роботі готелю в Україні.', 'local']
];

const content = `<main id="main" class="blog-page"><section class="blog-hero"><div class="blog-wrap blog-hero-grid"><div class="blog-hero-copy"><p class="blog-eyebrow">БЛОГ VDALO</p><h1>Практичні матеріали про керування готелем</h1><p class="blog-lead">Пояснюємо готельні системи, бронювання та щоденні процеси простою мовою. Матеріали для власників, керівників і команд готелів.</p></div><figure class="blog-hero-visual"><img src="/assets/hotel-management-blog.webp" width="1536" height="1024" alt="Робочий стіл у готелі з нотатником і ключ-карткою для матеріалів про керування готелем" title="Матеріали про керування готелем і готельні системи" fetchpriority="high"></figure><a class="blog-cta" href="/registration">Обговорити процеси мого готелю <span aria-hidden="true">↗</span></a></div></section><section class="blog-topics blog-published"><div class="blog-wrap"><div class="blog-section-heading"><p class="blog-eyebrow">ПЕРША СТАТТЯ · 8 ЖОВТНЯ 2026</p><h2>Що таке PMS для готелю?</h2><p>Пояснюємо, як система керування пов'язує бронювання, номери, гостей і роботу команди, та що варто перевірити перед вибором.</p></div><a class="blog-featured" href="${pmsArticle.slug}"><img src="${pmsArticle.image}" width="1536" height="1024" alt="${pmsArticle.imageAlt}" loading="lazy"><span class="blog-featured-copy"><span class="blog-topic-number">PMS · 9 ХВ ЧИТАННЯ</span><strong>${pmsArticle.headline}</strong><span>Функції, приклад роботи готелю, відмінності від інших систем і практичний чекліст.</span><span class="blog-featured-link">Читати статтю <span aria-hidden="true">↗</span></span></span></a></div></section><section class="blog-topics"><div class="blog-wrap"><div class="blog-section-heading"><p class="blog-eyebrow">ТЕМИ БЛОГУ</p><h2>Ще про щоденну роботу готелю</h2><p>Редакційні напрями наступних матеріалів.</p></div><div class="blog-grid">${topics.slice(1).map(([title,description,number])=>`<article class="blog-topic"><span class="blog-topic-number">${number.toUpperCase()}</span><h3>${title}</h3><p>${description}</p><span class="blog-topic-status">Скоро</span></article>`).join('')}</div></div></section><section class="blog-case"><div class="blog-wrap blog-case-inner"><div><p class="blog-eyebrow">КЕЙС</p><h2>Вечірній ресепшен без окремого адміністратора</h2><p>Розбір конкретного сценарію: що змінилося в роботі рецепції та як читати наведений розрахунок для готелю в Україні.</p></div><a class="blog-cta blog-cta-light" href="/cases/hotel-ai-reception">Читати кейс <span aria-hidden="true">↗</span></a></div></section><section class="blog-editorial"><div class="blog-wrap"><h2>Як ми готуємо матеріали</h2><p>Пояснюємо терміни на прикладах готельної роботи, відокремлюємо підтверджені можливості продукту від сценаріїв, які залежать від налаштувань, а правову інформацію звіряємо з офіційними джерелами.</p></div></section></main>`;

export function renderBlogPage({origin=''}={}) {
  let html=renderPage({origin,full:false});
  html=html.replace(/<title>[\s\S]*?<\/title>/, '<title>Блог про керування готелем і бронювання | VDALO</title>');
  html=html.replace(/<meta name="description" content="[^"]*">/, '<meta name="description" content="Практичні матеріали про керування готелем, бронювання, роботу команди, заселення та документи. Блог VDALO для готельєрів.">');
  html=html.replace(/<meta name="robots" content="[^"]*">/, '<meta name="robots" content="index,follow">');
  html=html.replace(/<meta property="og:title" content="[^"]*">/, '<meta property="og:title" content="Блог про керування готелем і бронювання | VDALO">');
  html=html.replace(/<meta property="og:description" content="[^"]*">/, '<meta property="og:description" content="Практичні матеріали про готельні системи та щоденні процеси команди.">');
  html=html.replace(/<link rel="canonical" href="[^"]*">/, '<link rel="canonical" href="https://vdalo.tech/blog">');
  html=html.replace(/<meta property="og:url" content="[^"]*">/, '<meta property="og:url" content="https://vdalo.tech/blog">');
  html=html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, '<script type="application/ld+json">{"@context":"https://schema.org","@type":"CollectionPage","name":"Блог VDALO про керування готелем","url":"https://vdalo.tech/blog","inLanguage":"uk"}</script>');
  html=html.replace('</head>', '<link rel="stylesheet" href="/blog.css"></head>');
  const second=`<a class="blog-featured" href="${pmsChoiceArticle.slug}"><img src="${pmsChoiceArticle.image}" width="1536" height="1024" alt="${pmsChoiceArticle.imageAlt}" loading="lazy"><span class="blog-featured-copy"><span class="blog-topic-number">ВИБІР PMS · 15 ХВ ЧИТАННЯ</span><strong>${pmsChoiceArticle.headline}</strong><span>25 критеріїв, п'ять тестів для демонстрації та матриця порівняння перед покупкою.</span><span class="blog-featured-link">Читати статтю <span aria-hidden="true">↗</span></span></span></a>`;
  html=html.replace('</a></div></section><section class="blog-topics">',`</a>${second}</div></section><section class="blog-topics">`);
  html=html.replace(/<main id="main">[\s\S]*?<\/main>/,content);
  html=html.replace(/href="#/g,'href="/#');
  return html;
}
