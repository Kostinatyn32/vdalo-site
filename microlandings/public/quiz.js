(()=>{
 const node=document.getElementById('quiz-config');if(!node)return;
 const config=JSON.parse(node.textContent),intro=document.getElementById('quiz-intro'),flow=document.getElementById('quiz-flow'),result=document.getElementById('quiz-result'),questionNode=flow.querySelector('[data-question]'),count=flow.querySelector('[data-count]'),bar=flow.querySelector('[data-progress]'),progress=flow.querySelector('.quiz-progress'),back=flow.querySelector('[data-back]');
 const answers={};let index=0;
 const routeNames={
  channels:{path:'/55',calculator:'/k3',name:'Бронювання з різних каналів',title:'Почніть із синхронізації каналів',reason:'Ви позначили розбіжності між каналами та ризик овербукінгу.'},
  checkin:{path:'/53',calculator:'/k1',name:'Самостійне заселення',title:'Зосередьмося на заселенні',reason:'Ви вказали ручне заселення й навантаження на команду.'},
  night_calls:{path:'/54',calculator:'/k2',name:'Комунікація з гостями',title:'Зменште повторні нічні звернення',reason:'Ви хочете скоротити повторні запити гостей уночі.'},
  power:{path:'/50',calculator:'/k5',name:'Робота під час відключень',title:'Оцініть готовність до відключень',reason:'Ви назвали перебої електропостачання важливим робочим викликом.'},
  direct:{path:'/47',calculator:'/k4',name:'Прямі бронювання',title:'Посильте прямі бронювання',reason:'Ви хочете зменшити залежність від комісій каналів.'}
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
  return {...recommendation,path,name:answers.intent==='calculator'?`Калькулятор · ${recommendation.name}`:recommendation.name,title:answers.intent==='calculator'?`Оцініть у цифрах: ${recommendation.name.toLowerCase()}`:recommendation.title,reason:answers.intent==='calculator'?`Ви обрали орієнтовно оцінити ефект для ситуації: ${recommendation.name.toLowerCase()}.`:recommendation.reason};
 }
 function renderQuestion(){
  const item=config.questions[index];count.textContent=`Питання ${index+1} із ${config.questions.length}`;bar.style.width=`${Math.round(index/config.questions.length*100)}%`;progress.setAttribute('aria-valuenow',String(index));back.hidden=index===0;
  questionNode.innerHTML=`<h1 tabindex="-1">${item.title}</h1><p>${item.help}</p><div class="quiz-options" role="group" aria-label="${item.title}">${config.options[item.id].map(([value,label],i)=>`<button class="quiz-option" type="button" data-value="${value}" aria-pressed="${answers[item.id]===value}"><span class="quiz-option-mark">${String(i+1).padStart(2,'0')}</span><span>${label}</span></button>`).join('')}</div>`;
  questionNode.querySelector('h1').focus({preventScroll:true});questionNode.querySelectorAll('[data-value]').forEach(button=>button.addEventListener('click',()=>{answers[item.id]=button.dataset.value;track('quiz_answer',{question_id:item.id,answer:button.dataset.value});if(index<config.questions.length-1){index++;renderQuestion();}else showResult();}));
 }
 function showResult(){
  const offer=resolveRoute();safeStore();track('quiz_complete',{target_route:offer.path,main_pain:answers.pain,intent:answers.intent});
  const qs=new URLSearchParams({utm_source:'sms',utm_medium:'sms',utm_campaign:'hotel_quiz',utm_content:config.smsCode?`SMS-${config.smsCode}`:'sms-quiz',message_variant:config.smsCode?`SMS-${config.smsCode}`:'quiz'});
  result.innerHTML=`<p class="eyebrow">Ваш наступний крок · ${offer.name}</p><h1>${offer.title}</h1><p>Дякуємо, тепер маємо контекст вашого готелю. Перейдіть до сторінки за вашими відповідями.</p><p class="quiz-result-reason">${offer.reason}</p><a class="button" href="${offer.path}?${qs.toString()}">${answers.intent==='calculator'?'Відкрити калькулятор':'Переглянути рішення'} <span aria-hidden="true">→</span></a><button class="quiz-restart" type="button" data-restart>Змінити відповіді</button><p class="quiz-result-footnote">Рекомендація ґрунтується на ваших відповідях і веде на сторінку VDALO про відповідну ситуацію.</p>`;
  flow.hidden=true;result.hidden=false;result.querySelector('a').addEventListener('click',()=>track('quiz_recommendation_click',{target_route:offer.path}));result.querySelector('[data-restart]').addEventListener('click',()=>{Object.keys(answers).forEach(key=>delete answers[key]);index=0;result.hidden=true;flow.hidden=false;renderQuestion();});result.querySelector('h1').focus({preventScroll:true});
 }
 document.querySelector('[data-start]').addEventListener('click',()=>{intro.hidden=true;flow.hidden=false;track('quiz_start');renderQuestion();});
 back.addEventListener('click',()=>{if(index>0){index--;renderQuestion();}});
})();
