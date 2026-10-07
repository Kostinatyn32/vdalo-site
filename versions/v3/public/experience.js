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
  elements.forEach(el=>observer.observe(el));
  document.documentElement.classList.add('motion-ready');
 }
 document.querySelectorAll('.module-grid [data-reveal],.platform-points [data-reveal]').forEach((el,i)=>el.style.setProperty('--reveal-delay',`${(i%3)*80}ms`));
 configureMotion();reduced.addEventListener('change',configureMotion);
 const meter=document.createElement('div');meter.className='scroll-meter';meter.setAttribute('aria-hidden','true');document.body.append(meter);
 let scheduled=false;
 const paint=()=>{const distance=document.documentElement.scrollHeight-innerHeight;meter.style.transform=`scaleX(${distance>0?Math.min(1,scrollY/distance):0})`;scheduled=false;};
 addEventListener('scroll',()=>{if(!scheduled){scheduled=true;requestAnimationFrame(paint);}},{passive:true});addEventListener('resize',paint);paint();
})();
