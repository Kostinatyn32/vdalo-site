import {caseSlugs} from '../versions/v1/cases.mjs';
import {editorialArticles} from '../versions/v1/article-library.mjs';
import {secondPassArticles} from '../versions/v1/article-second-pass.mjs';
import {pmsArticle} from '../versions/v1/article-pms.mjs';
import {pmsChoiceArticle} from '../versions/v1/article-pms-choice.mjs';
import {seoRoutes} from '../versions/v1/seo-pages.mjs';

const base = process.env.AUDIT_BASE_URL || 'http://127.0.0.1:4450';
const routes = [...new Set([
  '/', '/cases', ...caseSlugs, '/blog', pmsArticle.slug, pmsChoiceArticle.slug,
  ...editorialArticles.map(article => article.slug), ...secondPassArticles.map(article => article.slug),
  ...seoRoutes(), '/authors/oleh-stepeniev', '/tools/', '/tools/pms-checklist/',
  '/tools/hotel-profitability-calculator/', '/privacy', '/offer', '/refunds',
  '/robots.txt', '/sitemap.xml', '/go', '/go/trial', '/53', '/54', '/55', '/47', '/50',
])];
const errors = [];
const warnings = [];
const titles = new Map();
const checkedImages = new Set();
const checkedLinks = new Set();

for (const route of routes) {
  const response = await fetch(new URL(route, base));
  if (!response.ok) {
    errors.push(`${route}: HTTP ${response.status}`);
    continue;
  }
  const type = response.headers.get('content-type') || '';
  const html = await response.text();
  if (route.endsWith('.txt') || route.endsWith('.xml')) continue;
  if (!type.includes('text/html')) {
    errors.push(`${route}: expected HTML, got ${type}`);
    continue;
  }
  const title = html.match(/<title>([^<]*)<\/title>/i)?.[1]?.trim();
  const description = html.match(/<meta\s+name="description"\s+content="([^"]*)"/i)?.[1];
  const canonical = html.match(/<link\s+rel="canonical"\s+href="([^"]*)"/i)?.[1];
  const h1Count = (html.match(/<h1\b/gi) || []).length;
  for (const image of html.matchAll(/<img\b[^>]*>/gi)) {
    if (!/\salt="/i.test(image[0])) errors.push(`${route}: image is missing an alt attribute`);
  }
  if (!title) errors.push(`${route}: missing title`);
  else if (!route.startsWith('/go') && !/^\/(?:[1-9]|[1-5]\d)$/.test(route)) {
    const previous = titles.get(title);
    if (previous) warnings.push(`${route}: duplicate title with ${previous}: ${title}`);
    else titles.set(title, route);
  }
  if (!description) warnings.push(`${route}: missing meta description`);
  if (route.startsWith('/go') || /^\/(?:[1-9]|[1-5]\d)$/.test(route)) {
    if (!/noindex,nofollow/.test(html)) warnings.push(`${route}: campaign landing should be noindex`);
  } else {
    if (!canonical || !canonical.startsWith('https://vdalo.tech/')) warnings.push(`${route}: canonical missing or unexpected (${canonical || 'none'})`);
    if (h1Count !== 1) warnings.push(`${route}: expected one H1, found ${h1Count}`);
  }
  for (const match of html.matchAll(/<script\s+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)) {
    try { JSON.parse(match[1]); }
    catch { errors.push(`${route}: invalid JSON-LD`); }
  }
  for (const match of html.matchAll(/<(?:img|source)\b[^>]*\s(?:src|srcset)="([^"]+)"/gi)) {
    const raw = match[1].split(',')[0].trim().split(/\s+/)[0];
    if (!raw || raw.startsWith('data:') || raw.startsWith('https://')) continue;
    const target = new URL(raw, new URL(route, base));
    if (checkedImages.has(target.pathname)) continue;
    checkedImages.add(target.pathname);
    const image = await fetch(target, {method: 'HEAD'});
    if (!image.ok) errors.push(`${route}: image ${target.pathname} returned HTTP ${image.status}`);
  }
  for (const match of html.matchAll(/<a\b[^>]*\shref="([^"]+)"/gi)) {
    const raw = match[1];
    if (!raw || raw.startsWith('#') || /^(?:mailto:|tel:|javascript:|https?:\/\/)/i.test(raw)) continue;
    const target = new URL(raw, new URL(route, base));
    if (target.origin !== new URL(base).origin || checkedLinks.has(target.pathname)) continue;
    checkedLinks.add(target.pathname);
    const linked = await fetch(target, {method: 'HEAD', redirect: 'follow'});
    if (!linked.ok) errors.push(`${route}: link ${target.pathname} returned HTTP ${linked.status}`);
  }
}

for (const name of ['staff-checkin.webp', 'night-answers.webp', 'channel-sync.webp', 'direct-bookings.webp', 'power-mobile.webp']) {
  const response = await fetch(new URL(`/sms-trial-assets/top5/art/${name}`, base));
  if (!response.ok) errors.push(`/sms-trial-assets/top5/art/${name}: HTTP ${response.status}`);
  else if (!response.headers.get('content-type')?.includes('image/webp')) errors.push(`${name}: expected image/webp response`);
  else if (Number(response.headers.get('content-length')) > 300_000) warnings.push(`${name}: optimized artwork exceeds 300 KB`);
}

console.log(`Checked ${routes.length} routes; ${checkedImages.size} unique local image assets; 5 funnel WebP assets; ${checkedLinks.size} internal links; ${titles.size} unique page titles.`);
for (const warning of warnings) console.log(`WARN ${warning}`);
for (const error of errors) console.log(`FAIL ${error}`);
if (errors.length) process.exitCode = 1;
