(()=>{
 const video=document.getElementById('sms-video'),next=document.getElementById('after-video'),link=document.getElementById('trial-link');
 if(!video||!next||!link)return;
 const params=new URLSearchParams(location.search);
 const utm=Object.fromEntries(['utm_source','utm_medium','utm_campaign','utm_content','utm_term','message_variant'].flatMap(key=>params.has(key)?[[key,params.get(key).slice(0,150)]]:[]));
 function track(event){window.dataLayer=window.dataLayer||[];window.dataLayer.push({event,brand:'VDALO',offer_id:'sms-trial',landing_route:'/go',preview:true,...utm});}
 track('page_view');
 let started=false;
 video.addEventListener('play',()=>{if(!started){started=true;track('video_start');}});
 video.addEventListener('ended',()=>{next.hidden=false;track('video_complete');});
 link.addEventListener('click',()=>track('video_to_trial_click'));
})();
