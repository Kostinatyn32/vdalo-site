import http from 'node:http';
import {offers} from './microlandings/content.mjs';
import {renderMicrolanding,renderDirectory,renderFunnelPrivacy} from './microlandings/render.mjs';
import {handleFunnelLead} from './microlandings/leads.mjs';
import {readFile} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {renderPage as firstPage} from './versions/v1/render.mjs';
import {server as leadServer,privacyPage} from './versions/v1/server.mjs';
import {renderCaseList,renderHotelReceptionCase} from './versions/v1/cases.mjs';

const root=path.dirname(fileURLToPath(import.meta.url));
if(!process.env.VERCEL && existsSync(path.join(root,'.env')) && process.loadEnvFile)process.loadEnvFile(path.join(root,'.env'));
const types={'.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.jpg':'image/jpeg','.jpeg':'image/jpeg'};
function send(res,status,text,type='text/html; charset=utf-8'){
 res.writeHead(status,{'Content-Type':type,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin','X-Frame-Options':'DENY'});res.end(text);
}
function prefix(html,version){return html.replace(/\b(src|href|action)="\/(?!\/|cases(?:\/|")|v[123]\/)/g,`$1="/${version}/`);}
const server=http.createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,'http://localhost');
  const pathname=decodeURIComponent(url.pathname);
  if(pathname==='/api/funnel/leads')return await handleFunnelLead(req,res);
  if(req.method==='POST' && /^\/api\/leads\/(trial|audit)$/.test(pathname))return leadServer.emit('request',req,res);
  if(!['GET','HEAD'].includes(req.method))return send(res,405,'Метод недоступний.','text/plain; charset=utf-8');
  if(pathname==='/cases/' || pathname==='/cases/hotel-ai-reception/') {res.writeHead(308,{Location:pathname.slice(0,-1)+url.search,'Cache-Control':'public, max-age=300'});return res.end();}
  if(pathname==='/cases')return send(res,200,prefix(renderCaseList(),'v1'));
  if(pathname==='/cases/hotel-ai-reception')return send(res,200,prefix(renderHotelReceptionCase(),'v1'));
  if(pathname==='/privacy')return send(res,200,prefix(privacyPage(),'v1'));
  if(pathname==='/')return send(res,200,prefix(firstPage({origin:'https://vdalo.tech',full:true}),'v1'));
  if(pathname==='/robots.txt')return send(res,200,'User-agent: *\nAllow: /\nSitemap: https://vdalo.tech/sitemap.xml\n','text/plain; charset=utf-8');
  if(pathname==='/sitemap.xml')return send(res,200,'<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://vdalo.tech/cases</loc></url><url><loc>https://vdalo.tech/cases/hotel-ai-reception</loc></url></urlset>','application/xml; charset=utf-8');
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
  if(version==='v1' && relative==='/')return send(res,200,prefix(firstPage({origin:'',full:true}),'v1'));
  if(version==='v1' && relative==='/privacy')return send(res,200,prefix(privacyPage(),'v1'));
  if(!/^\/(assets\/[a-zA-Z0-9_.-]+|integration-channels\.css|pricing\.(?:css|js)|pricing-core\.js|site-config\.js|styles\.css|design-system-2\.css|dark-edition\.css|polish\.css|refinement\.css|cases\.css|editorial\.css|experience\.css|experience\.js|app\.js)$/.test(relative))return send(res,404,'Сторінку не знайдено.','text/plain; charset=utf-8');
  const file=path.join(root,'versions',version,'public',relative.slice(1));
  const data=await readFile(file);
  res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'public, max-age=300','X-Content-Type-Options':'nosniff'});res.end(req.method==='HEAD'?undefined:data);
 }catch{return send(res,404,'Сторінку не знайдено.','text/plain; charset=utf-8');}
});
// Vercel captures this standard Node.js HTTP server entrypoint.
if(!process.env.VERCEL)server.listen(Number(process.env.PORT||4185),process.env.HOST||'127.0.0.1',()=>console.log('VDALO comparison server started'));


export default server;

