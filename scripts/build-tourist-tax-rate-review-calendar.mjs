import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import workbook from '../versions/v1/tourist-tax-workbook-data.json' with {type:'json'};
import {touristTaxPlaces,getTouristTaxRule,touristTaxCommunities} from '../versions/v1/tourist-tax-data.mjs';
import {touristTaxReleasePlan} from '../versions/v1/tourist-tax-release.mjs';

const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'..');
const checkedAt='2026-10-14';
const firstWave=touristTaxReleasePlan.waves.find(wave=>wave.number===1).candidateSlugs;
const plannedTransitions={
  vinnytsya:{date:'2027-01-01',decision:'3535',kind:'Відоме рішення на новий період; ставки 0,5% / 1,5% зберігаються',source:'https://www.vmr.gov.ua/media/%D0%94%D0%B5%D0%BF%D0%B0%D1%80%D1%82%D0%B0%D0%BC%D0%B5%D0%BD%D1%82%D0%B8/%D0%94%D0%A4/%D0%94%D0%A4%20%D0%B4%D0%BE%D0%BA%D1%83%D0%BC%D0%B5%D0%BD%D1%82%D0%B8/%D0%9F%D0%9E%D0%94%D0%90%D0%A2%D0%9A%D0%98/%D0%A0%D1%96%D1%88%D0%B5%D0%BD%D0%BD%D1%8F%20%D0%BC%D1%96%D1%81%D1%8C%D0%BA%D0%BE%D1%97%20%D1%80%D0%B0%D0%B4%D0%B8%20%E2%84%963535%20%D0%B2%D1%96%D0%B4%2019-06-2025.pdf'},
  pivdenne:{date:'2027-01-01',decision:'2626-VIII',kind:'Відоме рішення на новий період; застосувати після звірки повного тарифного додатка',source:'https://ymtg.gov.ua/documents/327388-pro-vstanovlennia-stavok-turisticnogo-zboru-na-teritoriyi-pivdennivskoyi-miskoyi-teritorialnoyi-gromadi-odeskogo-raionu'}
};
const watchlist={
  skhidnytsya:{date:'2027-01-01',status:'ПРОЄКТ, не чинне рішення',decision:'не присвоєно',note:'Проєкт ради пропонує 0,25% / 0,50% та втрату чинності низкою актів із 01.01.2027. Не застосовувати до калькулятора, доки не знайдено ухвалений акт.'}
};
const followupFindings={
  slavsko:{rates:'Форма №6 ДПС: 0,20% / 0,20% для всіх об’єктів; рішення №1805, ставки застосовуються з 01.01.2026. Excel: 0,5% / 1%. Перевірити текст рішення і модель перед публікацією.',source:'https://tax.gov.ua/data/material/000/801/934883/d5ac4701_e753_4c8a_9d0c_a0f735173f94.pdf'},
  yaremche:{rates:'Форма №6 ДПС: готелі 0,50% / 0,50%, інші категорії переважно 0,30% / 0,30%; рішення №169-11/2021, застосовується з 01.01.2022. Є нульовий універсальний рядок. Звірити акт і категорії до публікації.',source:'https://tax.gov.ua/data/material/000/801/934869/lbc_0956300000_edrpou_20555668_version_5.pdf'}
};
const esc=value=>String(value??'').replaceAll('"','""');
const csvCell=value=>`"${esc(value)}"`;
const officialRateLabel=rule=>{
  if(!rule||rule.status!=='VERIFIED')return '';
  if(rule.rates)return `внутрішній ${rule.rates.domestic}%; в'їзний ${rule.rates.inbound}%`;
  if(rule.rateSchedule?.bands)return `тарифні діапазони: ${rule.rateSchedule.bands.map(b=>`внутрішній ${b.domesticRatePercent}%, в'їзний ${b.inboundRatePercent}%`).join('; ')}`;
  if(rule.rateSchedule?.thresholdUahPerPersonPerDay)return `залежить від ціни за добу; поріг ${rule.rateSchedule.thresholdUahPerPersonPerDay} грн`;
  return 'ставку підтверджено, модель потребує перегляду';
};
const rows=firstWave.map((slug,index)=>{
  const place=touristTaxPlaces.find(item=>item.slug===slug);
  const community=touristTaxCommunities.find(item=>item.slug===place?.communitySlug);
  const source=workbook.places.find(item=>item.slug===slug);
  const rule=getTouristTaxRule(place);
  const transition=plannedTransitions[slug];
  const watch=watchlist[slug];
  const finding=followupFindings[slug];
  const isVerified=rule?.status==='VERIFIED';
  const discrepancy=isVerified&&rule.rates&&source?.proposedRates
    ?(rule.rates.domestic!==source.proposedRates.domestic||rule.rates.inbound!==source.proposedRates.inbound)
    :Boolean(isVerified&&rule?.rateSchedule);
  const reviewDate=isVerified?'2026-12-01':'2026-10-20';
  const nextEvent=transition
    ?`${transition.date}: ${transition.kind} (рішення №${transition.decision})`
    :watch
      ?`${watch.date}: ${watch.status}; ${watch.note}`
    :rule?.effectiveTo==='2026-12-31'
      ?'2027-01-01: початок нового податкового року; чинність ставки після 2026 року ще окремо звірити'
      :'Зміна не підтверджена; відстежувати нові рішення громади та оновлення ДПС';
  const action=transition
    ?'До дати переходу звірити текст рішення, додатки, територію та ставки; у дату набрання чинності оновити дані й повторно прогнати калькулятор.'
    :finding
      ?'Звірити першоджерело рішення ради, територіальне охоплення й категорії проживання; виправити відсотки з Excel, змоделювати ставку у калькуляторі та повторити маршрутний QA до публікації.'
    :isVerified
      ?'До 2027 року звірити чинність акта й будь-які нові рішення ради; 1 січня перерахувати гривневий еквівалент за мінімальною зарплатою нового року.'
      :'До публікації знайти чинне рішення та підтвердити ставку/період офіційним актом або підписаною формою ДПС; повторити перевірку 20 жовтня.';
  return {
    rank:index+1,slug,name:place.name,region:place.region,settlementCode:place.katottgSettlementCode||'',community:community?.name||source?.community||'',communityCode:community?.katottgCode||'',
    workbookDomestic:source?.proposedRates?.domestic??'',workbookInbound:source?.proposedRates?.inbound??'',workbookNotes:source?.localNotes||'',
    officialStatus:rule?.status||'NOT_REVIEWED',officialRates:officialRateLabel(rule)||finding?.rates||'',decision:rule?.decisionNumber||'',decisionDate:rule?.decisionDate||'',effectiveFrom:rule?.effectiveFrom||'',effectiveTo:rule?.effectiveTo||'',
    knownNextChange:transition?.date||'',watchlistDate:watch?.date||'',watchlistStatus:watch?.status||'',nextReviewDate:reviewDate,nextReviewAction:action,nextKnownEvent:nextEvent,
    followupFinding: finding?.rates||'',workbookConflict:discrepancy||finding?'YES':isVerified?'NO':'UNVERIFIED',publicationStatus:place?.indexable?'LOCALLY_OPEN':'CLOSED_PENDING_VERIFICATION',sourceUrl:rule?.sourceUrl||finding?.source||'',checkedAt:rule?.checkedAt||checkedAt
  };
});
const headers=['№','slug','Населений пункт','Область','КАТОТТГ населеного пункту','Громада','КАТОТТГ громади','Excel: внутрішній %','Excel: в’їзний %','Excel: примітка','Офіційний статус','Підтверджена ставка/модель 2026','Рішення','Дата рішення','Діє з','Діє до','Відома наступна зміна з','Можлива зміна з (проєкт)','Статус можливої зміни','Наступна дата перевірки','Що перевірити','Подія/нагадування','Додаткове офіційне спостереження, потрібна верифікація','Розбіжність Excel','Статус публікації','Офіційне джерело','Перевірено'];
const data=rows.map(r=>[r.rank,r.slug,r.name,r.region,r.settlementCode,r.community,r.communityCode,r.workbookDomestic,r.workbookInbound,r.workbookNotes,r.officialStatus,r.officialRates,r.decision,r.decisionDate,r.effectiveFrom,r.effectiveTo,r.knownNextChange,r.watchlistDate,r.watchlistStatus,r.nextReviewDate,r.nextReviewAction,r.nextKnownEvent,r.followupFinding,r.workbookConflict,r.publicationStatus,r.sourceUrl,r.checkedAt]);
const csv=[headers,...data].map(row=>row.map(csvCell).join(',')).join('\r\n')+'\r\n';
fs.writeFileSync(path.join(root,'seo-workspace/tourist-tax/exports/FIRST_WAVE_RATE_REVIEW_CALENDAR.csv'),csv,'utf8');
const md=[
  '# Календар перевірки ставок першої хвилі туристичного збору',
  '',
  `Станом на ${checkedAt}. Дані першої хвилі: 30 населених пунктів із наданого Excel; детальні поля й нагадування: \`exports/FIRST_WAVE_RATE_REVIEW_CALENDAR.csv\`.`,
  '',
  '## Як читати календар',
  '',
  '- Excel є джерелом початкового списку, громади, SEO-чернетки та запропонованих ставок. Його відсотки не вважаються підтвердженими без рішення ради або актуальної підписаної форми ДПС.',
  '- «Відома наступна зміна» містить лише зміну з установленою датою та офіційним рішенням. Порожнє поле не означає, що рада не змінить ставку.',
  '- Для підтверджених ставок наступний загальний контроль заплановано на 1 грудня 2026 року, перед новим бюджетним роком. Для закритих кандидатів повторна перевірка призначена на 20 жовтня 2026 року, але сторінка лишається закритою до джерельного й калькуляторного QA.',
  '- 1 січня кожного року потрібно перевіряти новий закон про Державний бюджет і перераховувати суму в гривнях. Сам відсоток не змінюється автоматично разом із мінімальною зарплатою: для нього потрібне окреме рішення ради.',
  '- Подія для позапланової перевірки: нове/змінене рішення ради, набрання ним чинності, оновлення форми ДПС, зміна статті 268 ПКУ або зміна мінімальної зарплати на 1 січня.',
  '',
  '## Відомі дати переходу',
  '',
  '| Локація | Дата | Що відбувається |',
  '|---|---|---|',
  '| Вінниця | 01.01.2027 | Рішення №3535 вводить новий період; чинний відсоток підтверджено як 0,5% / 1,5%. Повторно звірити акт перед переходом. |',
  '| Південне | 01.01.2027 | Рішення №2626-VIII має почати діяти замість №422-VIII. До переходу повторно звірити повний додаток зі ставками. |',
  '| Східниця | 01.01.2027 | У проєкті рішення заявлено майбутню зміну та запропоновано 0,25% / 0,50%. Це не ухвалений акт; ставка лишається невідомою і не використовується в розрахунку. |',
  '| Інші локації з дією до 31.12.2026 | 01.01.2027 | Старий період завершується. Не переносити ставку автоматично, доки не підтверджено новий акт або чинність попереднього правила. |',
  '',
  'Форми ДПС за 2026 рік можуть показувати рішення, що застосовуються з 01.01.2026. Це не доводить автоматичне продовження ставки після 2026 року: перевірити рішення громади та форму ДПС на новий бюджетний період.',
  '',
  'Для решти громад точну дату майбутньої зміни можна записати лише після знаходження рішення. Річна дата контролю є внутрішнім нагадуванням, а не передбаченням рішення ради.',
  '',
  '## Важлива звірка Excel',
  '',
  'Попередні запропоновані ставки в книзі часто не збігаються з офіційними правилами, які вже пройшли перевірку. Тому завантажені ставки збережено в календарі для порівняння, але калькулятор і сторінка використовують лише окрему перевірену модель. Непідтверджені міста залишаються закритими.',
  '',
  '### Нові звірки 14.10.2026',
  '',
  '- **Славсько:** форма №6 ДПС указує рішення №1805 від 07.07.2022, застосування з 01.01.2026 і універсальні ставки 0,20% / 0,20%. Excel містить 0,5% / 1%. Перед публікацією перевірити первинний акт і виправити SEO-дані. [Форма ДПС, сторінки 85–87](https://tax.gov.ua/data/material/000/801/934883/d5ac4701_e753_4c8a_9d0c_a0f735173f94.pdf).',
  '- **Яремче:** форма №6 ДПС указує рішення №169-11/2021 від 24.06.2021, застосування з 01.01.2022, ставки для готелів 0,50% / 0,50% і для низки інших типів 0,30% / 0,30%. Наявний нульовий універсальний рядок потребує читання первинного додатка й мапи типів. Не використовувати єдину ставку для всіх об’єктів. [Форма ДПС, сторінки 28–29](https://tax.gov.ua/data/material/000/801/934869/lbc_0956300000_edrpou_20555668_version_5.pdf).',
  '',
  '## Правова основа нагадувань',
  '',
  '- [Податковий кодекс України, стаття 268](https://tax.gov.ua/nk/rozdil-xii--mistsevi-podatki-i/): ставку встановлює відповідна рада, а гривнева база прив’язана до мінімальної зарплати на 1 січня звітного року.',
  '- [Зведена інформація ДПС про місцеві ставки за 2026 рік](https://tax.gov.ua/zakonodavstvo/podatki-ta-zbori/stavki-mistsevih-podatkiv-ta-zboriv/jitomirska-oblast/zvedena-informatsiya-2026/): опубліковані дані сформовано з ІАС LOGICA станом на 30.01.2026; відсутність громади в переліку не означає нульову ставку.',
  '- [ДПС: туристичний збір, роз’яснення ГУ ДПС у Полтавській області](https://poltava.tax.gov.ua/rishennya-mistsevih-rad-/mistsevi-podatki-ta-zbori/turistichniy-zbir/): інформація про місцеві рішення та їхню чинність до заміни новим актом, якщо рішенням не встановлено кінцевий строк.',
  '- Суми в гривнях треба оновлювати щороку після набрання чинності законом про Державний бюджет. Відсотки оновлюються за місцевим рішенням, а не календарем автоматично.',
  '',
  '## Використання',
  '',
  'Перед публікацією запускайте `node scripts/build-tourist-tax-rate-review-calendar.mjs`, перевіряйте джерела кожного рядка та повторно запускайте калькуляторні й маршрутні QA. CSV не відкриває сторінки й сам собою не є дозволом на індексацію.'
].join('\n')+'\n';
fs.writeFileSync(path.join(root,'seo-workspace/tourist-tax/RATE_REVIEW_CALENDAR.md'),md,'utf8');
console.log(`Wrote review calendar for ${rows.length} first-wave settlements; verified=${rows.filter(r=>r.officialStatus==='VERIFIED').length}; closed=${rows.filter(r=>r.publicationStatus!=='LOCALLY_OPEN').length}; Excel conflicts/unverified=${rows.filter(r=>r.workbookConflict!=='NO').length}`);
