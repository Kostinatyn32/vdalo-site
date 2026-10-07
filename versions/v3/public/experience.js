// Motion patterns adapted from 21st.dev Scroll Reveal (cnippet-dev)
// and Animated Beam (dillionverma). Native DOM/SVG implementation.
(() => {
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const elements=[...document.querySelectorAll('[data-reveal]')];
 let observer;
 function configureMotion(){
  observer?.disconnect();
  if(reduced.matches){document.documentElement.classList.remove('motion-ready');elements.forEach(el=>el.classList.add('is-visible'));return;}
  if(!('IntersectionObserver' in window))return;
  observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('is-visible');observer.unobserve(entry.target);}}),{threshold:.12,rootMargin:'0px 0px -24px 0px'});
  elements.filter(el=>!el.classList.contains('is-visible')).forEach(el=>observer.observe(el));
  document.documentElement.classList.add('motion-ready');
 }
 document.querySelectorAll('.module-grid [data-reveal],.platform-points [data-reveal]').forEach((el,i)=>el.style.setProperty('--reveal-delay',`${(i%3)*80}ms`));
 configureMotion();reduced.addEventListener('change',configureMotion);
 const meter=document.createElement('div');meter.className='scroll-meter';meter.setAttribute('aria-hidden','true');document.body.append(meter);
 let scheduled=false;
 const links=[...document.querySelectorAll('#navigation a[href^="#"]')];
 const sections=links.map(link=>({link,node:document.querySelector(link.getAttribute('href'))}));
 const paint=()=>{
  const distance=document.documentElement.scrollHeight-innerHeight;
  meter.style.transform=`scaleX(${distance>0?Math.max(0,Math.min(1,scrollY/distance)):0})`;
  let active;
  sections.forEach(section=>{if(section.node?.getBoundingClientRect().top<180)active=section.link;});
  links.forEach(link=>{if(link===active)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');});
  scheduled=false;
 };
 addEventListener('scroll',()=>{if(!scheduled){scheduled=true;requestAnimationFrame(paint);}},{passive:true});addEventListener('resize',paint);paint();
 document.addEventListener('focusin',event=>event.target.closest('[data-reveal]')?.classList.add('is-visible'));
 const revealAll=()=>elements.forEach(el=>el.classList.add('is-visible'));
 addEventListener('beforeprint',revealAll);
 const openSolution=()=>{
  if(!/^#solution-[0-5]$/.test(location.hash))return;
  const detail=document.getElementById(location.hash.slice(1));if(detail)detail.open=true;
 };
 document.querySelectorAll('.module-link').forEach(link=>link.addEventListener('click',()=>{
  const detail=document.getElementById(link.hash.slice(1));if(detail)detail.open=true;
 }));
 addEventListener('hashchange',openSolution);openSolution();
 document.addEventListener('keydown',event=>{
  if(event.key!=='Escape')return;
  const toggle=document.querySelector('.menu-toggle');
  if(toggle?.getAttribute('aria-expanded')==='true'){
   document.getElementById('navigation').classList.remove('open');toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-label','Відкрити меню');toggle.focus();
  }
 });
})();
