import http from 'node:http';
import {offers} from './microlandings/content.mjs';
import {renderMicrolanding,renderDirectory,renderFunnelPrivacy} from './microlandings/render.mjs';
import {handleFunnelLead} from './microlandings/leads.mjs';
import {renderPage as thirdPage,renderPrivacy as thirdPrivacy} from './versions/v3/render.mjs';
import {readFile} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {renderPage as firstPage} from './versions/v1/render.mjs';
import {renderPage as secondPage} from './versions/v2/render.mjs';
import {privacyPage as secondPrivacy} from './versions/v2/server.mjs';
import {server as leadServer,privacyPage} from './versions/v1/server.mjs';

const root=path.dirname(fileURLToPath(import.meta.url));
if(!process.env.VERCEL && existsSync(path.join(root,'.env')) && process.loadEnvFile)process.loadEnvFile(path.join(root,'.env'));
const types={'.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml'};
function send(res,status,text,type='text/html; charset=utf-8'){
 res.writeHead(status,{'Content-Type':type,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin','X-Frame-Options':'DENY'});res.end(text);
}
function prefix(html,version){return html.replace(/\b(src|href|action)="\/(?!\/)/g,`$1="/${version}/`);}
const choice=`<!doctype html><html lang="uk"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>VDALO | Оберіть дизайн</title><link rel="icon" href="/v2/assets/favicon.svg"><style>body{margin:0;background:#160f19;color:#fff5f7;font-family:Arial,sans-serif}main{max-width:1100px;margin:auto;padding:70px 24px}img{width:180px}h1{font-size:clamp(36px,5vw,62px);letter-spacing:-.04em}p{color:#c7b8cd;line-height:1.6}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin-top:40px}.card{padding:28px;border:1px solid #725168;border-radius:14px;background:#281c2d;color:inherit;text-decoration:none;display:block}a.card:hover{border-color:#ff92bd}a:focus-visible{outline:3px solid #ff92bd;outline-offset:4px}.tag{color:#ff92bd;font-size:12px;letter-spacing:.12em}h2{font-size:24px;line-height:1.3}.action{display:block;margin-top:28px;color:#ff92bd}.pending{opacity:.65}@media(max-width:700px){.grid{grid-template-columns:1fr}main{padding-top:44px}}</style></head><body><main><img src="/v2/assets/vdalo-original-pink.png" alt="VDALO"><h1>Три погляди на VDALO.</h1><p>Порівняйте варіанти дизайну та оберіть напрям для основного сайту.</p><div class="grid"><a class="card" href="/v1/"><span class="tag">ВЕРСІЯ 01</span><h2>Світлі блоки.<br>Виразний бренд.</h2><p>Поєднання світлих поверхонь, кольору plum і рожевих акцентів.</p><span class="action">Переглянути →</span></a><a class="card" href="/v2/"><span class="tag">ВЕРСІЯ 02</span><h2>Темна палітра.<br>Готельна атмосфера.</h2><p>Глибокі темні тони, рожевий логотип і фотографія на першому екрані.</p><span class="action">Переглянути →</span></a><a class="card" href="/v3/"><span class="tag">ВЕРСІЯ 03</span><h2>Вдалий підпис.<br>Спокійний контроль.</h2><p>Світлий editorial дизайн, виразна serif-типографіка та новий логотип.</p><span class="action">Переглянути →</span></a></div></main></body></html>`;
const server=http.createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,'http://localhost');
  const pathname=decodeURIComponent(url.pathname);
  if(pathname==='/api/funnel/leads')return await handleFunnelLead(req,res);
  if(req.method==='POST' && /^\/api\/leads\/(trial|audit)$/.test(pathname))return leadServer.emit('request',req,res);
  if(!['GET','HEAD'].includes(req.method))return send(res,405,'Метод недоступний.','text/plain; charset=utf-8');
  if(pathname==='/')return send(res,200,choice);
  if(pathname==='/robots.txt')return send(res,200,'User-agent: *\nDisallow: /\n','text/plain; charset=utf-8');
  if(pathname==='/funnel')return send(res,200,renderDirectory());
  if(pathname==='/funnel/privacy')return send(res,200,renderFunnelPrivacy());
  const offer=offers.find(o=>o.route===pathname||o.route+'/'===pathname);
  if(offer){if(pathname.endsWith('/')){res.writeHead(307,{Location:offer.route+url.search});return res.end();}return send(res,200,renderMicrolanding(offer));}
  if(/^\/funnel-assets\/(funnel\.css|funnel\.js)$/.test(pathname)){
   const filename=path.join(root,'microlandings','public',path.basename(pathname));
   const data=await readFile(filename);res.writeHead(200,{'Content-Type':types[path.extname(filename)],'Cache-Control':'public, max-age=300','X-Content-Type-Options':'nosniff'});return res.end(req.method==='HEAD'?undefined:data);
  }
  const route=pathname.match(/^\/(v1|v2|v3)(\/.*)?$/);
  if(!route)return send(res,404,'Сторінку не знайдено.','text/plain; charset=utf-8');
  const version=route[1],relative=route[2]||'/';
  if(!route[2]){res.writeHead(307,{Location:`/${version}/`});return res.end();}
  if(relative==='/')return send(res,200,prefix((version==='v1'?firstPage:version==='v2'?secondPage:thirdPage)({origin:'',full:true}),version));
  if(relative==='/privacy')return send(res,200,prefix(version==='v1'?privacyPage():version==='v2'?secondPrivacy():thirdPrivacy(),version));
  if(!/^\/(assets\/[a-zA-Z0-9_.-]+|integration-channels\.css|styles\.css|design-system-2\.css|dark-edition\.css|polish\.css|refinement\.css|editorial\.css|experience\.css|experience\.js|app\.js)$/.test(relative))return send(res,404,'Сторінку не знайдено.','text/plain; charset=utf-8');
  const file=path.join(root,'versions',version,'public',relative.slice(1));
  const data=await readFile(file);
  res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'public, max-age=300','X-Content-Type-Options':'nosniff'});res.end(req.method==='HEAD'?undefined:data);
 }catch{return send(res,404,'Сторінку не знайдено.','text/plain; charset=utf-8');}
});
// Vercel captures this standard Node.js HTTP server entrypoint.
if(!process.env.VERCEL)server.listen(Number(process.env.PORT||4185),process.env.HOST||'127.0.0.1',()=>console.log('VDALO comparison server started'));


export default server;

