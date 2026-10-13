const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

const options={
 property:[['hotel','Готель'],['apartments','Апартаменти'],['glamping','Глемпінг або кемпінг'],['hostel','Хостел'],['multiple','Кілька об’єктів'],['other','Інше']],
 size:[['1-10','До 10 номерів або помешкань'],['11-30','11–30 номерів або помешкань'],['31-80','31–80 номерів або помешкань'],['81+','Понад 80 номерів або помешкань'],['unknown','Не знаю точно']],
 pms:[['none','Окремої системи поки немає'],['spreadsheets','Ведемо бронювання у таблицях і чатах'],['manual_gaps','Користуємося системою, але частину роботи робимо вручну'],['satisfied','Нинішня система загалом підходить'],['switching','Розглядаємо перехід на іншу систему']],
 pain:[['channels','Овербукінг і бронювання з різних каналів'],['checkin','Заїзд гостей: документи, інструкції та ручні кроки'],['night_calls','Повторні запити гостей уночі'],['power','Відключення світла та витрати на генератор'],['direct','Комісії каналів і мало прямих бронювань']],
 intent:[['solution','Побачити, як працює рішення'],['calculator','Оцінити можливий ефект у цифрах']]
};
const questions=[
 {id:'property',title:'Який у вас об’єкт?',help:'Підлаштуємо рекомендацію під формат вашої роботи.'},
 {id:'size',title:'Скільки у вас номерів або помешкань?',help:'Приблизної кількості достатньо.'},
 {id:'pms',title:'Як зараз ведете бронювання та щоденну роботу?',help:'Оберіть найближчий варіант, навіть якщо поєднуєте кілька підходів.'},
 {id:'pain',title:'Що хотіли б впорядкувати насамперед?',help:'Оберіть одну ситуацію, з якої варто почати.'},
 {id:'intent',title:'Що буде корисніше подивитися?',help:'Доберемо сторінку про вашу ситуацію або калькулятор для попередньої оцінки.'}
];

export function renderQuizPage(params=new URLSearchParams()){
 const smsCode=(params.get('c')||'').match(/^\d{1,2}$/)?.[0]||'';
 const config=JSON.stringify({smsCode,questions,options}).replaceAll('<','\\u003c');
 return `<!doctype html>
<html lang="uk">
<head>
 <meta charset="utf-8">
 <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
 <title>Підберіть рішення для вашого готелю | VDALO</title>
 <meta name="description" content="Відповідайте на п’ять коротких запитань і отримайте доречний наступний крок для вашого готелю.">
 <meta name="robots" content="noindex,nofollow">
 <link rel="canonical" href="https://www.vdalo.tech/q">
 <meta name="theme-color" content="#fbf7f4">
 <link rel="icon" href="/v3/assets/favicon.svg">
 <link rel="preconnect" href="https://fonts.googleapis.com">
 <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
 <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Inter+Tight:wght@700;800;900&display=swap" rel="stylesheet">
 <link rel="stylesheet" href="/v3/editorial.css">
 <link rel="stylesheet" href="/funnel-assets/funnel.css?v=6">
 <link rel="stylesheet" href="/quiz-assets/quiz.css?v=9">
 <script src="/quiz-assets/quiz.js?v=6" defer></script>
</head>
<body class="microlanding quiz-page">
 <a class="skip-link" href="#quiz-main">Перейти до квізу</a>
 <main id="quiz-main" class="quiz-wrap">
  <section class="quiz-intro" id="quiz-intro">
   <header class="quiz-card-header">
    <a class="quiz-brand" href="/" aria-label="VDALO, головний сайт"><img src="/v1/assets/vdalo-canonical.png" width="168" height="56" alt="VDALO®"></a>
   </header>
   <div class="quiz-intro-copy">
    <p class="eyebrow">Для власників і керівників готелів</p>
    <h1>Менше ручної роботи.<br><em>Більше контролю над готелем.</em></h1>
    <p class="quiz-lead">Бронювання доводиться звіряти, щоб уникнути овербукінгу? Документи готуєте вручну, а гості чекають на заселення?</p>
    <p class="quiz-support">Дайте відповідь на 5 коротких запитань. Підкажемо, які процеси у вашому готелі варто впорядкувати або автоматизувати насамперед.</p>
    <button class="button quiz-start" type="button" data-start>Знайти, що можна покращити <span aria-hidden="true">→</span></button>
    <p class="quiz-privacy-note">Близько 1 хвилини <span aria-hidden="true">·</span> Без реєстрації <span aria-hidden="true">·</span> Контакти для рекомендації не потрібні</p>
   </div>
   <figure class="quiz-visual">
    <img src="/quiz-assets/hotel-reception.webp?v=2" width="1536" height="1024" alt="Рецепція готелю з календарем бронювань і матеріалами для заселення" fetchpriority="high" decoding="async">
   </figure>
  </section>
  <section class="quiz-flow" id="quiz-flow" hidden aria-live="polite">
   <div class="quiz-flow-top"><a href="/" class="quiz-back-home">VDALO</a><span class="quiz-step-count" data-count>Питання 1 із 5</span></div>
   <div class="quiz-progress" role="progressbar" aria-label="Прогрес квізу" aria-valuemin="0" aria-valuemax="5" aria-valuenow="0"><span data-progress></span></div>
   <div class="quiz-question" data-question></div>
   <div class="quiz-controls"><button class="quiz-back" type="button" data-back hidden>← Назад</button><span class="quiz-selection-hint">Оберіть один варіант</span></div>
  </section>
  <section class="quiz-result" id="quiz-result" hidden aria-live="polite"></section>
 </main>
 <footer class="ml-footer quiz-footer"><div class="wrap"><a href="/" aria-label="VDALO, головна"><img src="/v1/assets/vdalo-canonical.png" width="168" height="56" alt="VDALO®"></a><p>Керуйте готелем вдало.</p><a href="/funnel/privacy">Використання даних</a></div></footer>
 <script type="application/json" id="quiz-config">${config}</script>
</body>
</html>`;
}
