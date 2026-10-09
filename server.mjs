import http from 'node:http';
import {offers} from './microlandings/content.mjs';
import {renderMicrolanding,renderDirectory,renderFunnelPrivacy} from './microlandings/render.mjs';
import {renderSmsGo} from './microlandings/sms-go.mjs';
import {renderSmsTrial} from './microlandings/sms-trial.mjs';
import {handleFunnelLead} from './microlandings/leads.mjs';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {gzipSync} from 'node:zlib';
import {existsSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {renderPage as firstPage} from './versions/v1/render.mjs';
import {server as leadServer,privacyPage} from './versions/v1/server.mjs';
import {renderCaseList,renderCase,caseSlugs} from './versions/v1/cases.mjs';
import {renderBlogPage} from './versions/v1/blog.mjs';
import {renderEditorialArticle,editorialArticles} from './versions/v1/article-library.mjs';
import {renderSecondPassArticle,secondPassArticles} from './versions/v1/article-second-pass.mjs';
import {renderPmsArticle,pmsArticle} from './versions/v1/article-pms.mjs';
import {renderPmsChoiceArticle,pmsChoiceArticle} from './versions/v1/article-pms-choice.mjs';
import {renderToolsIndex,renderPmsChecklist,renderHotelProfitabilityCalculator} from './versions/v1/tools.mjs';
import {handlePmsReport} from './versions/v1/pms-report.mjs';
import {renderSeoPage,seoRoutes} from './versions/v1/seo-pages.mjs';
import {homeCssBundle,siteCssBundle} from './versions/v1/assets.mjs';
import {renderOfferPage,renderRefundPage} from './versions/v1/legal.mjs';
import {renderAuthorPage} from './versions/v1/author-page.mjs';


const root=path.dirname(fileURLToPath(import.meta.url));
if(!process.env.VERCEL && existsSync(path.join(root,'.env')) && process.loadEnvFile)process.loadEnvFile(path.join(root,'.env'));
const types={'.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.jpg':'image/jpeg','.jpeg':'image/jpeg','.mp4':'video/mp4'};
const gtmHead=`<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','GTM-PKDT7MMT');</script>`;
const gtmBody=`<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-PKDT7MMT" height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>`;
function withTagManager(html){
 const withHead=html.replace(/<head(?:\s[^>]*)?>/i,opening=>opening+gtmHead);
 return withHead.replace(/<body(?:\s[^>]*)?>/i,opening=>opening+gtmBody);
}
function send(res,status,text,type='text/html; charset=utf-8'){
 const body=type.toLowerCase().startsWith('text/html')?withTagManager(text):text;
 res.writeHead(status,{'Content-Type':type,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin','X-Frame-Options':'DENY'});res.end(body);
}
function sendCompressed(req,res,status,data,type,cache='no-store'){
 const source=type.toLowerCase().startsWith('text/html')?withTagManager(Buffer.isBuffer(data)?data.toString('utf8'):data):data;
 const body=Buffer.isBuffer(source)?source:Buffer.from(source);
 const compressed=body.length>=1024&&/\bgzip\b/.test(req.headers['accept-encoding']||'');
 res.writeHead(status,{'Content-Type':type,'Cache-Control':cache,'X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin','X-Frame-Options':'DENY','Vary':'Accept-Encoding',...(compressed?{'Content-Encoding':'gzip'}:{})});
 if(req.method==='HEAD')return res.end();
 res.end(compressed?gzipSync(body,{level:6}):body);
}
function sendVideo(req,res,data){
 const size=data.length,range=req.headers.range;
 let status=200,start=0,end=size-1;
 if(range){
  const match=/^bytes=(\d*)-(\d*)$/.exec(range);
  if(!match||(!match[1]&&!match[2])){res.writeHead(416,{'Content-Range':`bytes */${size}`,'Accept-Ranges':'bytes'});return res.end();}
  if(!match[1]){const suffix=Number(match[2]);start=Math.max(0,size-suffix);}
  else start=Number(match[1]);
  if(match[1]&&match[2])end=Math.min(Number(match[2]),size-1);
  if(start>=size||end<start){res.writeHead(416,{'Content-Range':`bytes */${size}`,'Accept-Ranges':'bytes'});return res.end();}
  status=206;
 }
 const body=status===206?data.subarray(start,end+1):data;
 res.writeHead(status,{'Content-Type':'video/mp4','Content-Length':body.length,'Cache-Control':'public, max-age=86400','X-Content-Type-Options':'nosniff','Accept-Ranges':'bytes',...(status===206?{'Content-Range':`bytes ${start}-${end}/${size}`}:{})});
 res.end(req.method==='HEAD'?undefined:body);
}
function prefix(html,version){return html.replace(/\b(src|href|action)="\/([^\"]*)"/g,(match,attribute,path)=>{if(path.startsWith('/')||path.startsWith('v1/')||path.startsWith('v2/')||path.startsWith('v3/'))return match;if(attribute==='href'&&(/^(?:$|#|privacy(?:\/|$)|offer(?:\/|$)|refunds?(?:\/|$)|cases(?:\/|$)|blog(?:\/|$)|authors(?:\/|$)|tools(?:\/|$)|solutions(?:\/|$)|integrations(?:\/|$)|pricing(?:\/|$)|hotel-booking-calendar(?:\/|$)|hotel-check-in(?:\/|$)|hotel-operations(?:\/|$)|guest-communication(?:\/|$)|hotel-automation(?:\/|$)|about(?:\/|$)|contact(?:\/|$)|registration(?:\/|$))/.test(path)))return match;return `${attribute}="/${version}/${path}"`;});}
const server=http.createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,'http://localhost');
  const pathname=decodeURIComponent(url.pathname);
  if(pathname==='/api/funnel/leads')return await handleFunnelLead(req,res);
  if(pathname==='/api/tools/pms-report')return await handlePmsReport(req,res);
  if(req.method==='POST' && /^\/api\/leads\/(trial|audit)$/.test(pathname))return leadServer.emit('request',req,res);
