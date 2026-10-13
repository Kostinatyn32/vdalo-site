import {renderPage,escape} from './render.mjs';
import {pmsArticle} from './article-pms.mjs';
import {pmsChoiceArticle} from './article-pms-choice.mjs';
import {editorialArticles} from './article-library.mjs';
import {secondPassArticles} from './article-second-pass.mjs';

const origin='https://www.vdalo.tech';
const profilePath='/authors/oleh-stepeniev';
const profileUrl=`${origin}${profilePath}`;
const imagePath='/v1/assets/oleg-stepeniev-profile.jpg';
const e=escape;

const articles=[pmsArticle,pmsChoiceArticle,...editorialArticles,...secondPassArticles];

function profileSchema(){
 return JSON.stringify({'@context':'https://schema.org','@graph':[
  {'@type':'Person','@id':`${profileUrl}#person`,'name':'Олег Степенєв','url':profileUrl,'image':`${origin}${imagePath}`,'description':'Підприємець із досвідом понад 20 років у нерухомості, меблевому виробництві, розробці програмного забезпечення та криптографії. Останні сім років працює з модульними будинками й готельною нерухомістю; має магістерську освіту у сфері будівництва та виробництва будівельних матеріалів.','knowsAbout':['готельна нерухомість','модульні будинки','нерухомість','меблеве виробництво','розробка програмного забезпечення','криптографія'],'hasCredential':{'@type':'EducationalOccupationalCredential','name':'Магістерська освіта у сфері будівництва та виробництва будівельних матеріалів'},'sameAs':['https://www.linkedin.com/in/olegalisio/']},
  {'@type':'ProfilePage','@id':profileUrl,'url':profileUrl,'name':'Олег Степенєв — автор матеріалів VDALO','mainEntity':{'@id':`${profileUrl}#person`},'inLanguage':'uk'},
  {'@type':'BreadcrumbList','itemListElement':[{'@type':'ListItem','position':1,'name':'Головна','item':origin},{'@type':'ListItem','position':2,'name':'Блог','item':`${origin}/blog`},{'@type':'ListItem','position':3,'name':'Олег Степенєв','item':profileUrl}]}
 ]}).replace(/</g,'\\u003c');
}

function articleCard(article){
 const title=article.headline;
 const description=article.description||article.lead;
 const image=article.image.startsWith('http')?article.image:`/v1${article.image}`;
 const alt=article.alt||article.imageAlt||title;
 const minutes=article.minutes?`${article.minutes} хв читання`:'Практичний посібник';
 return `<a class="author-article-card" href="${e(article.slug)}"><img src="${e(image)}" width="480" height="300" loading="lazy" alt="${e(alt)}"><span class="author-article-topic">${e(article.tag||'ПОСІБНИК')} · ${e(minutes)}</span><strong>${e(title)}</strong><span class="author-article-description">${e(description)}</span><span class="author-article-action">Читати статтю <span aria-hidden="true">↗</span></span></a>`;
}

export function renderAuthorPage(){
 const canonical=profileUrl;
 const cards=articles.map(articleCard).join('');
 let html=renderPage({origin,full:false});
 html=html.replace(/<title>[\s\S]*?<\/title>/,`<title>Олег Степенєв — автор матеріалів VDALO про готелі</title>`)
  .replace(/<meta name="description" content="[^"]*">/,`<meta name="description" content="Олег Степенєв — підприємець із 20+ роками досвіду в нерухомості, меблевому виробництві, програмному забезпеченні та криптографії. Останні сім років працює з готельною нерухомістю.">`)
  .replace(/<meta name="robots" content="[^"]*">/,'<meta name="robots" content="index,follow">')
  .replace(/<meta property="og:type" content="[^"]*">/,'<meta property="og:type" content="profile">')
  .replace(/<meta property="og:title" content="[^"]*">/,`<meta property="og:title" content="Олег Степенєв — автор матеріалів VDALO">`)
  .replace(/<meta property="og:description" content="[^"]*">/,`<meta property="og:description" content="Підприємець із 20+ роками досвіду в нерухомості, виробництві й програмному забезпеченні. Практичні матеріали про готельні процеси.">`)
  .replace(/<meta property="og:url" content="[^"]*">/,`<meta property="og:url" content="${canonical}">`)
  .replace(/<link rel="canonical" href="[^"]*">/,`<link rel="canonical" href="${canonical}">`)
  .replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/,`<script type="application/ld+json">${profileSchema()}</script>`)
  .replace('</head>',`<meta property="og:image" content="${origin}${imagePath}"><meta property="og:image:alt" content="Олег Степенєв, автор матеріалів VDALO"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="Олег Степенєв — автор матеріалів VDALO"><meta name="twitter:description" content="Практичні матеріали VDALO про керування готелем, бронювання та роботу команди."><meta name="twitter:image" content="${origin}${imagePath}"><link rel="stylesheet" href="/author-page.css"></head>`)
  .replace(/<main id="main">[\s\S]*?<\/main>/,`<main id="main" class="author-page"><div class="author-page-wrap"><nav class="author-breadcrumbs" aria-label="Навігаційний ланцюжок"><a href="/">Головна</a><span aria-hidden="true">/</span><a href="/blog">Блог</a><span aria-hidden="true">/</span><span aria-current="page">Автор</span></nav><section class="author-profile"><div class="author-profile-copy"><p class="author-eyebrow">АВТОР МАТЕРІАЛІВ VDALO</p><h1>Олег Степенєв</h1><p class="author-profile-lead">Підприємець із досвідом понад 20 років у нерухомості, меблевому виробництві, розробці програмного забезпечення та криптографії.</p><p>Останні сім років працює з виробництвом модульних будинків і готельною нерухомістю. Під управлінням керуючої компанії — кемпінг, глемпінг і резорти в Чехії. Має магістерську освіту у сфері будівництва та виробництва будівельних матеріалів.</p><p>У матеріалах VDALO розбирає практичні сценарії роботи готелю й позначає умови та межі кожного рішення.</p><div class="author-profile-links"><a href="https://www.linkedin.com/in/olegalisio/" target="_blank" rel="noopener noreferrer">Профіль у LinkedIn ↗</a><a href="/about">Про Олега та історію VDALO ↗</a></div></div><figure class="author-profile-photo"><img src="${imagePath}" width="800" height="1000" alt="Олег Степенєв, автор матеріалів VDALO" fetchpriority="high"></figure></section><section class="author-articles"><div class="author-articles-heading"><p class="author-eyebrow">БІБЛІОТЕКА МАТЕРІАЛІВ</p><h2>Статті Олега Степенєва</h2><p>Практичні гіди для власників, керівників і команд готелів.</p></div><div class="author-articles-grid">${cards}</div></section></div></main>`)
  .replace(/<footer[\s\S]*?<\/footer>/,footer=>footer.replace(/href="#([^\"]+)"/g,'href="/#$1"'));
 return html;
}
