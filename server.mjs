import http from 'node:http';
import {offers} from './microlandings/content.mjs';
import {renderMicrolanding,renderDirectory,renderFunnelPrivacy} from './microlandings/render.mjs';
import {handleFunnelLead} from './microlandings/leads.mjs';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {gzipSync} from 'node:zlib';
import {existsSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {renderPage as firstPage} from './versions/v1/render.mjs';
import {server as leadServer,privacyPage} from './versions/v1/server.mjs';
import {renderCaseList,renderHotelReceptionCase} from './versions/v1/cases.mjs';
import {renderBlogPage} from './versions/v1/blog.mjs';
import {renderPmsArticle,pmsArticle} from './versions/v1/article-pms.mjs';
import {renderPmsChoiceArticle,pmsChoiceArticle} from './versions/v1/article-pms-choice.mjs';
import {renderToolsIndex,renderPmsChecklist,renderHotelProfitabilityCalculator} from './versions/v1/tools.mjs';
import {handlePmsReport} from './versions/v1/pms-report.mjs';
import {renderSeoPage,seoRoutes} from './versions/v1/seo-pages.mjs';
import {homeCssBundle,siteCssBundle} from './versions/v1/assets.mjs';
import {renderOfferPage,renderRefundPage} from './versions/v1/legal.mjs';

const root=path.dirname(fileURLToPath(import.meta.url));
if(!process.env.VERCEL && existsSync(path.join(root,'.env')) && process.loadEnvFile)process.loadEnvFile(path.join(root,'.env'));
const types={'.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.jpg':'image/jpeg','.jpeg':'image/jpeg'};
function send(res,status,text,type='text/html; charset=utf-8'){
 res.writeHead(status,{'Content-Type':type,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin','X-Frame-Options':'DENY'});res.end(text);
}
function sendCompressed(req,res,status,data,type,cache='no-store'){
 const body=Buffer.isBuffer(data)?data:Buffer.from(data);
 const compressed=body.length>=1024&&/\bgzip\b/.test(req.headers['accept-encoding']||'');
 res.writeHead(status,{'Content-Type':type,'Cache-Control':cache,'X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin','X-Frame-Options':'DENY','Vary':'Accept-Encoding',...(compressed?{'Content-Encoding':'gzip'}:{})});
 if(req.method==='HEAD')return res.end();
 res.end(compressed?gzipSync(body,{level:6}):body);
}
function prefix(html,version){return html.replace(/\b(src|href|action)="\/([^\"]*)"/g,(match,attribute,path)=>{if(path.startsWith('/')||path.startsWith('v1/')||path.startsWith('v2/')||path.startsWith('v3/'))return match;if(attribute==='href'&&(/^(?:$|#|privacy(?:\/|$)|offer(?:\/|$)|refunds?(?:\/|$)|cases(?:\/|$)|blog(?:\/|$)|tools(?:\/|$)|solutions(?:\/|$)|integrations(?:\/|$)|pricing(?:\/|$)|hotel-booking-calendar(?:\/|$)|hotel-check-in(?:\/|$)|hotel-operations(?:\/|$)|guest-communication(?:\/|$)|hotel-automation(?:\/|$)|about(?:\/|$)|contact(?:\/|$)|registration(?:\/|$))/.test(path)))return match;return `${attribute}="/${version}/${path}"`;});}
const server=http.createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,'http://localhost');
  const pathname=decodeURIComponent(url.pathname);
  if(pathname==='/api/funnel/leads')return await handleFunnelLead(req,res);
  if(pathname==='/api/tools/pms-report')return await handlePmsReport(req,res);
  if(req.method==='POST' && /^\/api\/leads\/(trial|audit)$/.test(pathname))return leadServer.emit('request',req,res);
  if(!['GET','HEAD'].includes(req.method))return send(res,405,'Метод недоступний.','text/plain; charset=utf-8');
  if(pathname==='/cases/' || pathname==='/cases/hotel-ai-reception/') {res.writeHead(308,{Location:pathname.slice(0,-1)+url.search,'Cache-Control':'public, max-age=300'});return res.end();}
  if(pathname==='/cases')return send(res,200,prefix(renderCaseList(),'v1'));
  if(pathname==='/cases/hotel-ai-reception')return send(res,200,prefix(renderHotelReceptionCase(),'v1'));
  if(pathname==='/blog')return send(res,200,prefix(renderBlogPage({origin:'https://vdalo.tech'}),'v1'));
  if(pathname==='/tools'){res.writeHead(308,{Location:'/tools/'+url.search,'Cache-Control':'public, max-age=300'});return res.end();}
  if(pathname==='/tools/')return send(res,200,prefix(renderToolsIndex(),'v1'));
  if(pathname==='/tools/pms-checklist'){res.writeHead(308,{Location:'/tools/pms-checklist/'+url.search,'Cache-Control':'public, max-age=300'});return res.end();}
  if(pathname==='/tools/pms-checklist/')return send(res,200,prefix(renderPmsChecklist(),'v1'));
  if(pathname==='/tools/hotel-profitability-calculator'){res.writeHead(308,{Location:'/tools/hotel-profitability-calculator/'+url.search,'Cache-Control':'public, max-age=300'});return res.end();}
  if(pathname==='/tools/hotel-profitability-calculator/')return send(res,200,prefix(renderHotelProfitabilityCalculator(),'v1'));
  if(pathname===pmsChoiceArticle.slug+'/'){res.writeHead(308,{Location:pmsChoiceArticle.slug+url.search,'Cache-Control':'public, max-age=300'});return res.end();}
  if(pathname===pmsChoiceArticle.slug)return send(res,200,prefix(renderPmsChoiceArticle(),'v1'));
  if(pathname==='/blog/' ){res.writeHead(308,{Location:'/blog'+url.search,'Cache-Control':'public, max-age=300'});return res.end();}
  if(pathname===pmsArticle.slug+'/'){res.writeHead(308,{Location:pmsArticle.slug+url.search,'Cache-Control':'public, max-age=300'});return res.end();}
  if(pathname===pmsArticle.slug)return send(res,200,prefix(renderPmsArticle(),'v1'));
  if(seoRoutes().includes(pathname))return send(res,200,prefix(renderSeoPage(pathname),'v1'));
  if(seoRoutes().includes(pathname.slice(0,-1))&&pathname.endsWith('/')){res.writeHead(308,{Location:pathname.slice(0,-1)+url.search,'Cache-Control':'public, max-age=300'});return res.end();}
  if(pathname==='/privacy')return send(res,200,prefix(privacyPage(),'v1'));
  if(pathname==='/offer')return send(res,200,renderOfferPage());
  if(pathname==='/refunds')return send(res,200,renderRefundPage());
  if(pathname==='/')return sendCompressed(req,res,200,prefix(firstPage({origin:'https://vdalo.tech',full:true}),'v1'),'text/html; charset=utf-8');
  if(pathname==='/robots.txt')return send(res,200,'User-agent: *\nAllow: /\nSitemap: https://vdalo.tech/sitemap.xml\n','text/plain; charset=utf-8');
  if(pathname==='/sitemap.xml'){const pages=['/','/solutions','/integrations','/pricing','/hotel-booking-calendar','/hotel-check-in','/hotel-operations','/guest-communication','/hotel-automation','/registration','/about','/contact','/privacy','/offer','/refunds','/cases','/cases/hotel-ai-reception','/blog',pmsArticle.slug,pmsChoiceArticle.slug,'/tools/','/tools/pms-checklist/','/tools/hotel-profitability-calculator/'];return send(res,200,`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${pages.map(route=>`<url><loc>https://vdalo.tech${route}</loc></url>`).join('')}</urlset>`,'application/xml; charset=utf-8');}
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
  if(version!=='v1' && !(version==='v3' && (/^\/assets\/[a-zA-Z0-9_.-]+$/.test(relative)||relative==='/editorial.css')))return send(res,404,'Сторінку не знайдено.','text/plain; charset=utf-8');
  if(version==='v1' && relative==='/')return sendCompressed(req,res,200,prefix(firstPage({origin:'',full:true}),'v1'),'text/html; charset=utf-8');
  if(version==='v1' && relative==='/privacy')return send(res,200,prefix(privacyPage(),'v1'));
  if(!/^\/(assets\/[a-zA-Z0-9_.-]+|blog\.css|tools\.(?:css|js)|seo-pages\.css|integration-channels\.css|pricing\.(?:css|js)|pricing-core\.js|site-config\.js|styles\.css|site\.css|home\.css|design-system-2\.css|dark-edition\.css|polish\.css|refinement\.css|cases\.css|editorial\.css|experience\.css|experience\.js|app\.js|living-hotel(?:-mobile|-dispatch)?\.(?:css|js))$/.test(relative))return send(res,404,'Сторінку не знайдено.','text/plain; charset=utf-8');
  const file=path.join(root,'versions',version,'public',relative.slice(1));
  const bundle=version==='v1'&&relative==='/home.css'?homeCssBundle:version==='v1'&&relative==='/site.css'?siteCssBundle:null;
  const data=bundle?Buffer.from(bundle.css):await readFile(file);
  const requestedVersion=url.searchParams.get('v')||'';
  const currentVersion=bundle?.version||createHash('sha256').update(data).digest('hex').slice(0,12);
  const cache=requestedVersion===currentVersion?'public, max-age=31536000, immutable':relative.startsWith('/assets/')?'public, max-age=86400, stale-while-revalidate=604800':'public, max-age=300';
  sendCompressed(req,res,200,data,types[path.extname(file)]||'application/octet-stream',cache);
 }catch{return send(res,404,'Сторінку не знайдено.','text/plain; charset=utf-8');}
});
// Vercel captures this standard Node.js HTTP server entrypoint.
if(!process.env.VERCEL)server.listen(Number(process.env.PORT||4185),process.env.HOST||'127.0.0.1',()=>console.log('VDALO comparison server started'));


export default server;

