(()=>{
 const node=document.getElementById('quiz-config');if(!node)return;
 const config=JSON.parse(node.textContent),intro=document.getElementById('quiz-intro'),flow=document.getElementById('quiz-flow'),result=document.getElementById('quiz-result'),questionNode=flow.querySelector('[data-question]'),count=flow.querySelector('[data-count]'),bar=flow.querySelector('[data-progress]'),progress=flow.querySelector('.quiz-progress'),back=flow.querySelector('[data-back]');
 const answers={};let index=0;
 const optionArt={
  'property:hotel':'<path d="M9 42V8h22v34M5 42h38M15 14h4m4 0h4m-12 7h4m4 0h4m-12 7h4m4 0h4M17 42V34h7v8M35 18h5v24"/><path d="M34 13h8v5h-8z"/>',
  'property:apartments':'<path d="M8 42V18h13v24M21 42V7h18v35M4 42h40M13 24h3m-3 6h3m12-16h4m4 0h1m-9 7h4m4 0h1m-9 7h4m4 0h1m-9 7h4m4 0h1"/>',
  'property:glamping':'<path d="m5 39 19-29 19 29H5Z"/><path d="m17 39 7-12 7 12M9 33h5m20 0h5"/>',
  'property:hostel':'<path d="M8 39V13m0 18h32v8M8 22h10a7 7 0 0 1 7 7v2m-17 0V19h4a4 4 0 0 1 4 4v8m16-9h8a4 4 0 0 1 4 4v4H25v-4a4 4 0 0 1 4-4Z"/>',
  'property:multiple':'<path d="M5 42V18h15v24M20 42V7h17v35M37 25h7v17M2 42h44M10 24h5m-5 7h5m10-17h4m4 0h1m-9 8h4m4 0h1m-9 8h4m4 0h1"/>',
  'property:other':'<path d="m24 5 3.2 12.8L40 21l-12.8 3.2L24 37l-3.2-12.8L8 21l12.8-3.2L24 5Z"/><path d="m39 31 1.7 5.3L46 38l-5.3 1.7L39 45l-1.7-5.3L32 38l5.3-1.7L39 31Z"/>',
  'size:1-10':'<path d="M7 36h34M10 35V21h28v14M14 21v-4h20v4M14 26h8m5 0h7M13 36v5m22-5v5"/>',
  'size:11-30':'<path d="M6 41V18h13v23M19 41V8h23v33M3 41h42M10 24h5m-5 7h5m9-17h5m5 0h5m-15 8h5m5 0h5m-15 8h5m5 0h5"/>',
  'size:31-80':'<path d="M8 42V7h32v35M4 42h40M14 14h5m5 0h5m5 0h3m-23 8h5m5 0h5m5 0h3m-23 8h5m5 0h5m5 0h3m-17 12V36h8v6"/>',
  'size:81+':'<path d="M5 42V16h12v26M17 42V6h16v36M33 42V20h10v22M3 42h43M9 22h4m-4 7h4m9-17h4m4 0h2m-10 9h4m4 0h2m-10 9h4m4 0h2m10-5h4m-4 7h4"/>',
  'size:unknown':'<path d="M24 5 42 15v18L24 43 6 33V15L24 5Z"/><path d="M24 25v11m0-22v5m-6 6h12"/>',
  'pms:none':'<rect x="7" y="10" width="34" height="29" rx="4"/><path d="M7 18h34M15 25h7m5 0h6m-18 7h7m6 0h7"/>',
  'pms:spreadsheets':'<rect x="6" y="8" width="36" height="32" rx="3"/><path d="M6 18h36M18 18v22m12-22v22M6 29h36"/>',
  'pms:manual_gaps':'<path d="M7 13h34M7 24h34M7 35h34"/><circle cx="17" cy="13" r="4"/><circle cx="31" cy="24" r="4"/><circle cx="21" cy="35" r="4"/>',
  'pms:satisfied':'<circle cx="24" cy="24" r="17"/><path d="m15 24 6 6 12-13"/>',
  'pms:switching':'<path d="M8 17h28l-7-7m11 21H12l7 7"/><path d="M36 17 29 10m8 21 7 7"/>',
  'pain:channels':'<rect x="5" y="11" width="14" height="12" rx="3"/><rect x="29" y="25" width="14" height="12" rx="3"/><path d="m18 17 12 12m-12 0 5-5m7 5-5 5"/>',
  'pain:checkin':'<path d="M9 42V7h24v35M5 42h38M26 24h.1"/><path d="M33 15h9v27"/>',
  'pain:night_calls':'<path d="M37 29A16 16 0 0 1 19 10a17 17 0 1 0 18 19Z"/><path d="m34 8 1.5 4.5L40 14l-4.5 1.5L34 20l-1.5-4.5L28 14l4.5-1.5L34 8Z"/>',
  'pain:power':'<path d="m27 4-19 24h14l-1 16 19-25H26l1-15Z"/>',
  'pain:direct':'<path d="M10 7v33l9-9 7 12 6-4-7-12h13L10 7Z"/>',
  'intent:solution':'<rect x="7" y="8" width="34" height="31" rx="5"/><path d="M14 17h20m-20 7h13m-13 7h17"/><path d="m36 4 1.5 4.5L42 10l-4.5 1.5L36 16l-1.5-4.5L30 10l4.5-1.5L36 4Z"/>',
  'intent:calculator':'<path d="M9 41V25h8v16m7 0V16h8v25m7 0V7h5v34M5 41h40"/><path d="m10 18 10-7 9 2 12-8"/>'
 };
 function artFor(group,value){return `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${optionArt[`${group}:${value}`]||optionArt['property:other']}</svg>`}
 const routeNames={
  channels:{path:'/55',calculator:'/k3',name:'Бронювання з різних каналів',title:'Почніть із бронювань між каналами',calculatorTitle:'Оцініть витрати на ручне перенесення бронювань',reason:'Ви хочете впорядкувати бронювання з різних каналів і знизити ризик овербукінгу.'},
  checkin:{path:'/53',calculator:'/k1',name:'Заїзд і заселення гостей',title:'Почніть із процесу заїзду',calculatorTitle:'Порахуйте час на анкети й заселення',reason:'Ви хочете впорядкувати документи, інструкції та ручні кроки до заселення.'},
  night_calls:{path:'/54',calculator:'/k2',name:'Комунікація з гостями',title:'Зменште повторні нічні звернення',calculatorTitle:'Порахуйте час на повторні відповіді гостям',reason:'Ви хочете скоротити повторні запити гостей уночі.'},
  power:{path:'/50',calculator:'/k5',name:'Робота під час відключень',title:'Розберіться, як підготувати роботу під час відключень',calculatorTitle:'Порахуйте витрати на пальне для генератора',reason:'Ви хочете оцінити, як відключення впливають на роботу готелю та скільки коштує пальне для генератора.'},
  direct:{path:'/47',calculator:'/k4',name:'Прямі бронювання',title:'Оцініть можливості прямих бронювань',calculatorTitle:'Оцініть комісії каналів і потенціал прямих бронювань',reason:'Ви хочете краще розуміти комісії каналів і збільшити частку прямих бронювань.'}
 };
 function track(event,detail={}){window.dataLayer=window.dataLayer||[];window.dataLayer.push({event,brand:'VDALO',quiz:'hotel_sms',sms_code:config.smsCode||'',step:index+1,...detail});}
 function safeStore(){
  const propertyMap={hotel:'hotel',apartments:'apartments',glamping:'resort',hostel:'hostel',multiple:'other',other:'other'};
  const context={property_format:answers.property||'',property_type:propertyMap[answers.property]||'other',room_range:answers.size||'',pms_status:answers.pms||'',main_pain:answers.pain||'',intent:answers.intent||'',recommendation_route:resolveRoute().path,sms_code:config.smsCode||''};
  try{sessionStorage.setItem('vdalo-quiz-context',JSON.stringify(context));}catch{}
 }
 function resolveRoute(){
  const recommendation=routeNames[answers.pain]||routeNames.checkin;
  const path=answers.intent==='calculator'?recommendation.calculator:recommendation.path;
  return {...recommendation,path,name:answers.intent==='calculator'?`Розрахунок · ${recommendation.name}`:recommendation.name,title:answers.intent==='calculator'?recommendation.calculatorTitle:recommendation.title,reason:answers.intent==='calculator'?'Калькулятор дасть попередню оцінку на ваших цифрах. Це орієнтир для планування, а не обіцянка результату.':recommendation.reason};
 }
 const profileLabels={property:{hotel:'готель',apartments:'апартаменти',glamping:'глемпінг або кемпінг',hostel:'хостел',multiple:'кілька об’єктів',other:'інший формат'},size:{'1-10':'до 10 номерів або помешкань','11-30':'11–30 номерів або помешкань','31-80':'31–80 номерів або помешкань','81+':'понад 80 номерів або помешкань',unknown:'кількість номерів не вказана'},pms:{none:'окремої системи поки немає',spreadsheets:'бронювання ведете у таблицях і чатах',manual_gaps:'система є, але частину кроків виконуєте вручну',satisfied:'нинішня система загалом підходить',switching:'розглядаєте перехід на іншу систему'}};
 function profileSummary(){
  const property=profileLabels.property[answers.property]||'ваш об’єкт';
  const size=profileLabels.size[answers.size]||'';
  const setup=profileLabels.pms[answers.pms]||'';
  return `Ваш контекст: ${property}${size?`, ${size}`:''}. Зараз: ${setup}.`;
 }
 function renderQuestion(){
  const item=config.questions[index];count.textContent=`Питання ${index+1} із ${config.questions.length}`;bar.style.width=`${Math.round((index+1)/config.questions.length*100)}%`;progress.setAttribute('aria-valuenow',String(index+1));back.hidden=index===0;
  questionNode.innerHTML=`<h1 tabindex="-1">${item.title}</h1><p>${item.help}</p><div class="quiz-options" role="group" aria-label="${item.title}">${config.options[item.id].map(([value,label],i)=>`<button class="quiz-option" type="button" data-value="${value}" aria-pressed="${answers[item.id]===value}"><span class="quiz-option-art" aria-hidden="true">${artFor(item.id,value)}</span><span class="quiz-option-label">${label}</span><span class="quiz-option-mark">${String(i+1).padStart(2,'0')}</span></button>`).join('')}</div>`;
  questionNode.querySelector('h1').focus({preventScroll:true});questionNode.querySelectorAll('[data-value]').forEach(button=>button.addEventListener('click',()=>{answers[item.id]=button.dataset.value;track('quiz_answer',{question_id:item.id,answer:button.dataset.value});if(index<config.questions.length-1){index++;renderQuestion();}else showResult();}));
 }
 function showResult(){
  const offer=resolveRoute();safeStore();track('quiz_complete',{target_route:offer.path,main_pain:answers.pain,intent:answers.intent});
  const qs=new URLSearchParams({utm_source:'sms',utm_medium:'sms',utm_campaign:'hotel_quiz',utm_content:config.smsCode?`SMS-${config.smsCode}`:'sms-quiz',message_variant:config.smsCode?`SMS-${config.smsCode}`:'quiz'});
  const transitionNote=answers.pms==='switching'?'<p class="quiz-result-footnote">Сторінка присвячена обраному процесу. Використайте її, щоб конкретизувати вимоги до системи, яку розглядаєте.</p>':'';
  result.innerHTML=`<p class="eyebrow">Ваш наступний крок · ${offer.name}</p><h1>${offer.title}</h1><p class="quiz-result-context">${profileSummary()}</p><p class="quiz-result-reason">${offer.reason}</p><a class="button" href="${offer.path}?${qs.toString()}">${answers.intent==='calculator'?'Відкрити розрахунок':'Побачити рішення для мого готелю'} <span aria-hidden="true">→</span></a><button class="quiz-restart" type="button" data-restart>Змінити відповіді</button>${transitionNote}<p class="quiz-result-footnote">Рекомендація веде на сторінку про процес, який ви обрали як пріоритет.</p>`;
  flow.hidden=true;result.hidden=false;result.querySelector('a').addEventListener('click',()=>track('quiz_recommendation_click',{target_route:offer.path}));result.querySelector('[data-restart]').addEventListener('click',()=>{Object.keys(answers).forEach(key=>delete answers[key]);index=0;result.hidden=true;flow.hidden=false;renderQuestion();});result.querySelector('h1').focus({preventScroll:true});
 }
 document.querySelector('[data-start]').addEventListener('click',()=>{intro.hidden=true;flow.hidden=false;document.body.classList.add('quiz-active');track('quiz_start');renderQuestion();});
 back.addEventListener('click',()=>{if(index>0){index--;renderQuestion();}});
})();
