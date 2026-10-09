import {renderPage,escape} from './render.mjs';
import {pmsArticle} from './article-pms.mjs';
import {pmsChoiceArticle} from './article-pms-choice.mjs';
import {editorialArticles} from './article-library.mjs';
import {secondPassArticles} from './article-second-pass.mjs';

const origin='https://vdalo.tech';
const profilePath='/authors/oleh-stepeniev';
const profileUrl=`${origin}${profilePath}`;
const imagePath='/v1/assets/oleg-stepeniev-profile.jpg';
const e=escape;

const articles=[pmsArticle,pmsChoiceArticle,...editorialArticles,...secondPassArticles];

function profileSchema(){
 return JSON.stringify({'@context':'https://schema.org','@graph':[
  {'@type':'Person','@id':`${profileUrl}#person`,'name':'Олег Степенєв','url':profileUrl,'image':`${origin}${imagePath}`,'description':'Автор практичних матеріалів VDALO про керування готелем, бронювання та робочі процеси команди.','sameAs':['https://www.linkedin.com/in/olegalisio/']},
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
  .replace(/<meta name="description" content="[^"]*">/,`<meta name="description" content="Олег Степенєв — автор практичних матеріалів VDALO про PMS, бронювання, автоматизацію та щоденну роботу готелів.">`)
  .replace(/<meta name="robots" content="[^"]*">/,'<meta name="robots" content="index,follow">')
  .replace(/<meta property="og:type" content="[^"]*">/,'<meta property="og:type" content="profile">')
  .replace(/<meta property="og:title" content="[^"]*">/,`<meta property="og:title" content="Олег Степенєв — автор матеріалів VDALO">`)
  .replace(/<meta property="og:description" content="[^"]*">/,`<meta property="og:description" content="Матеріали про системи керування готелем, бронювання та щоденні процеси команди.">`)
  .replace(/<meta property="og:url" content="[^"]*">/,`<meta property="og:url" content="${canonical}">`)
  .replace(/<link rel="canonical" href="[^"]*">/,`<link rel="canonical" href="${canonical}">`)
  .replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/,`<script type="application/ld+json">${profileSchema()}</script>`)
  .replace('</head>',`<meta property="og:image" content="${origin}${imagePath}"><meta property="og:image:alt" content="Олег Степенєв, автор матеріалів VDALO"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="Олег Степенєв — автор матеріалів VDALO"><meta name="twitter:description" content="Практичні матеріали VDALO про керування готелем, бронювання та роботу команди."><meta name="twitter:image" content="${origin}${imagePath}"><link rel="stylesheet" href="/author-page.css"></head>`)
  .replace(/<main id="main">[\s\S]*?<\/main>/,`<main id="main" class="author-page"><div class="author-page-wrap"><nav class="author-breadcrumbs" aria-label="Навігаційний ланцюжок"><a href="/">Головна</a><span aria-hidden="true">/</span><a href="/blog">Блог</a><span aria-hidden="true">/</span><span aria-current="page">Автор</span></nav><section class="author-profile"><div class="author-profile-copy"><p class="author-eyebrow">АВТОР МАТЕРІАЛІВ VDALO</p><h1>Олег Степенєв</h1><p class="author-profile-lead">Пише про системи керування готелем, бронювання, цифрові інструменти та щоденні процеси команди.</p><p>У матеріалах розбирає практичні сценарії роботи готелю, пояснює, що перевірити перед запуском змін, і позначає умови та обмеження кожного рішення.</p><div class="author-profile-links"><a href="https://www.linkedin.com/in/olegalisio/" target="_blank" rel="noopener noreferrer">Профіль у LinkedIn ↗</a><a href="/about">Про Олега та історію VDALO ↗</a></div></div><figure class="author-profile-photo"><img src="${imagePath}" width="800" height="1000" alt="Олег Степенєв, автор матеріалів VDALO" fetchpriority="high"></figure></section><section class="author-articles"><div class="author-articles-heading"><p class="author-eyebrow">БІБЛІОТЕКА МАТЕРІАЛІВ</p><h2>Статті Олега Степенєва</h2><p>Практичні гіди для власників, керівників і команд готелів.</p></div><div class="author-articles-grid">${cards}</div></section></div></main>`)
  .replace(/<footer[\s\S]*?<\/footer>/,footer=>footer.replace(/href="#([^\"]+)"/g,'href="/#$1"'));
 return html;
}
