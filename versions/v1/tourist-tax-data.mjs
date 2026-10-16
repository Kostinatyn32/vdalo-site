import workbook from './tourist-tax-workbook-data.json' with { type: 'json' };
import katottgImport from './tourist-tax-katottg-2026-07-07.json' with { type: 'json' };
import {isTouristTaxPlacePublished,touristTaxReleasePlan,validateTouristTaxReleasePlan} from './tourist-tax-release.mjs';

// Tax readiness is deliberately independent from settlement identity and SEO state.
// VERIFIED means the current primary sources and calculation inputs have been checked.
const annualTaxBases = Object.freeze({
  2026: {minimumWageOnJanuary1: 8647, url: 'https://zakon.rada.gov.ua/laws/show/4695-IX'},
});

export const touristTaxSources = Object.freeze({
  reviewSchedule: { nextVerifiedRatesReviewAt: '2026-12-01', cadenceNote: 'Перевірити рішення громад і ставки на 2027 податковий рік; суми в гривнях оновлювати після закону про Державний бюджет.' },
  katottg: {
    url: 'https://mininfra.gov.ua/diialnist/rozvytok-mistsevoho-samovriaduvannia/kodyfikator-administratyvno-terytorialnykh-odynyts-ta-terytorii-terytorialnykh-hromad',
    releaseDate: '2026-07-07',
    orderNumber: '1321',
    imported: true,
    sha256: katottgImport.sourceSha256,
  },
  territoryList: {
    url: 'https://zakon.rada.gov.ua/laws/show/z0380-25',
    currentAsOf: '2026-08-21',
    activeAmendments: [
      {number:'987',date:'2026-05-26',registration:'z0782-26',url:'https://zakon.rada.gov.ua/laws/show/z0782-26'},
      {number:'1389',date:'2026-07-16',effectiveFrom:'2026-08-21',registration:'z1117-26',url:'https://zakon.rada.gov.ua/laws/show/z1117-26'},
    ],
    matchedToKatottg: false,
    snapshotImported: false,
  },
  taxCode: { url: 'https://tax.gov.ua/nk/rozdil-xii--mistsevi-podatki-i/' },
  localCouncilDecisions: { url: 'https://tax.gov.ua/rishennya-mistsevih-rad-/' },
  budgetClassification: { url: 'https://zakon.rada.gov.ua/rada/show/v0011201-11' },
  budget2026: annualTaxBases[2026],
  annualBases: annualTaxBases,
});

const verifiedTouristTaxCommunities = [
  {
    slug: 'lutsk-community',
    name: 'Луцька міська територіальна громада',
    katottgCode: 'UA07080170000013585',
    taxRule: {
      decisionNumber: '77/72',
      decisionDate: '2025-06-25',
      sourceUrl: 'https://www.lutskrada.gov.ua/documents/17496325233676686-pro-vstanovlennya-stavok-turistichnogo-zboru',
      ratePublicationUrl: 'https://www.lutskrada.gov.ua/publications/u-lutsku-zbilshyly-stavky-turystychnoho-zboru-dlia-v-iznoho-ta-vnutrishnoho-turyzmu',
      effectiveFrom: '2026-01-01',
      effectiveTo: null,
      rates: { domestic: 0.5, inbound: 1.5 },
      supportingSources: [
        {label:'ДПС Волині: код Луцької громади в КАТОТТГ',description:'Підтвердження коду територіальної громади для звірки місця розміщення.',url:'https://vl.tax.gov.ua/media-ark/news-ark/978756.html',linkLabel:'Перевірити код громади'},
        {label:'ДПС: обчислення сум із копійками',description:'Пояснення щодо точного обчислення та відображення сум туристичного збору.',url:'https://km.tax.gov.ua/media-ark/news-ark/print-1020882.html',linkLabel:'Переглянути роз’яснення ДПС'}
      ],
      status: 'VERIFIED',
      verificationBasis: 'Чинне рішення та роз’яснення Луцької міської ради, Податковий кодекс, офіційне підтвердження коду громади ДПС Волині, автоматизовані тести розрахунку',
      checkedAt: '2026-10-14',
      version: 'lutsk-2026-01',
    },
  },
];

const katottgByPlaceSlug=new Map(katottgImport.places.map(place=>[place.slug,place]));
const normalizeCommunityIdentity=value=>String(value??'').trim().toLocaleLowerCase('uk-UA').replace(/\s+/g,' ');
const communityGroups=new Map();
for(const source of workbook.places){
  if(source.slug==='lutsk')continue;
  const geography=katottgByPlaceSlug.get(source.slug);
  const groupKey=geography?.communityCode?`katottg:${geography.communityCode}`:`fallback:${normalizeCommunityIdentity(source.region)}:${normalizeCommunityIdentity(source.community)}`;
  if(!communityGroups.has(groupKey))communityGroups.set(groupKey,{name:source.community,region:source.region,katottgCode:geography?.communityCode??null,officialName:geography?.officialCommunityName??null,placeSlugs:[],ratePairs:new Map(),hasIncompleteRate:false});
  const group=communityGroups.get(groupKey);
  if(!group.katottgCode&&geography?.communityCode){group.katottgCode=geography.communityCode;group.officialName=geography.officialCommunityName;}
  group.placeSlugs.push(source.slug);
  if(Number.isFinite(source.proposedRates?.domestic)&&Number.isFinite(source.proposedRates?.inbound))group.ratePairs.set(`${source.proposedRates.domestic}|${source.proposedRates.inbound}`,source.proposedRates);
  else group.hasIncompleteRate=true;
}
const workbookCommunityRecords=[...communityGroups.values()];
const communitySlugByPlaceSlug=new Map();
const workbookCommunities=workbookCommunityRecords.map((community,index)=>{
  const slug=community.katottgCode?`katottg-community-${community.katottgCode.toLocaleLowerCase('en-US')}`:`workbook-community-${String(index+1).padStart(3,'0')}`;
  for(const placeSlug of community.placeSlugs)communitySlugByPlaceSlug.set(placeSlug,slug);
  const rateVariants=[...community.ratePairs.values()];
  const rateConflict=rateVariants.length>1;
  const status=rateConflict?'CONFLICT':(community.hasIncompleteRate||rateVariants.length===0?'UNKNOWN':'SECONDARY_SOURCE_ONLY');
  const proposedRates=rateVariants.length===1&&!community.hasIncompleteRate?rateVariants[0]:{domestic:null,inbound:null};
  return {
    slug,name:community.name,region:community.region,officialName:community.officialName,katottgCode:community.katottgCode,
    taxRule:{decisionNumber:null,decisionDate:null,sourceUrl:null,ratePublicationUrl:null,effectiveFrom:null,effectiveTo:null,rates:null,proposedRates,rateVariants,status,verificationBasis:null,checkedAt:null,version:null},
    review:{status,rateConflict,proposedRates,rateVariants,hasIncompleteRate:community.hasIncompleteRate,placeCount:community.placeSlugs.length,geographySourceVersion:katottgImport.version},
  };
});
const primaryRuleOverrides = new Map([
  ['UA21020030000019624', {
    decisionNumber: '794',
    decisionDate: '2021-07-09',
    sourceUrl: 'https://tax.gov.ua/data/material/000/801/934858/lbc_0751700000_edrpou_26031452_version_1.pdf',
    ratePublicationUrl: 'https://tax.gov.ua/zakonodavstvo/podatki-ta-zbori/stavki-mistsevih-podatkiv-ta-zboriv/zakarpatska-oblast/zvedena-informatsiya-2026/',
    taxOfficeCommunityFileUrl: 'https://tax.gov.ua/data/material/000/801/934858/lbc_0751700000_edrpou_26031452_version_1.pdf',
    effectiveFrom: '2022-01-01',
    effectiveTo: '2026-12-31',
    rates: {domestic:0.25,inbound:0.25},
    supportingSources: [
      {label:'ДПС: форма ставок туристичного збору Берегівської громади у наборі на 2026 рік',description:'Форма №6 називає Берегівську громаду та місто Берегове за кодами КАТОТТГ, рішення №794 від 09.07.2021, застосування з 01.01.2022 і ставки 0,25% для внутрішнього та в’їзного туризму. Набір ДПС на 2026 рік сформований за даними ІАС LOGICA станом на 30.01.2026.',url:'https://tax.gov.ua/data/material/000/801/934858/lbc_0751700000_edrpou_26031452_version_1.pdf',linkLabel:'Переглянути форму ДПС'},
      {label:'ДПС: набір місцевих ставок, що діють у 2026 році',description:'Сторінка пояснює, що дані відображають стан ІАС LOGICA на 30.01.2026, а відсутність громади у наборі не означає нульову ставку.',url:'https://tax.gov.ua/zakonodavstvo/podatki-ta-zbori/stavki-mistsevih-podatkiv-ta-zboriv/zakarpatska-oblast/zvedena-informatsiya-2026/',linkLabel:'Переглянути опис набору 2026 року'},
    ],
    status:'VERIFIED',
    verificationBasis:'У формі №6 Берегівської громади з офіційного набору ДПС на 2026 рік місто Берегове прямо назване з КАТОТТГ UA21020030010083215, код громади UA21020030000019624, базове рішення №794 від 09.07.2021 і дату застосування 01.01.2022. Таблиця туристичного збору показує універсальну ставку 0,25% для внутрішнього та 0,25% для в’їзного туризму; окремі рядки за видами місць розміщення також містять ці відсотки. Для локального калькулятора правило обмежено 2026 роком, оскільки джерельний знімок ДПС має дату 30.01.2026. До 2027 року ставку потрібно звірити повторно. Результат калькулятора не визначає пільги гостя автоматично.',
    checkedAt:'2026-10-14',
    version:'berehove-dps-form-6-logica-2026-10-14',
  }],
  ['UA71080490000022110', {
    decisionNumber: '2-4690',
    decisionDate: '2019-06-27',
    sourceUrl: 'https://tax.gov.ua/data/material/000/801/934849/d8b5e601_2eea_43c3_86ad_ec0e8d6023f6.pdf',
    ratePublicationUrl: 'https://tax.gov.ua/zakonodavstvo/podatki-ta-zbori/stavki-mistsevih-podatkiv-ta-zboriv/cherkaska-oblast/zvedena-informatsiya-2026/',
    taxOfficeCommunityFileUrl: 'https://tax.gov.ua/data/material/000/801/934849/d8b5e601_2eea_43c3_86ad_ec0e8d6023f6.pdf',
    effectiveFrom: '2026-01-01',
    effectiveTo: '2026-12-31',
    rates: {domestic:0.5,inbound:5.0},
    supportingSources: [
      {label:'ДПС: підписана форма ставок туристичного збору Черкаської громади',description:'Форма №6 ДПС за 2026 рік називає рішення №2-4690, код Черкаської міської громади та ставки 0,50% для внутрішнього і 5,00% для в’їзного туризму. Набір ДПС сформований за даними ІАС LOGICA станом на 30.01.2026.',url:'https://tax.gov.ua/data/material/000/801/934849/d8b5e601_2eea_43c3_86ad_ec0e8d6023f6.pdf',linkLabel:'Переглянути форму №6 ДПС'},
      {label:'Черкаська міська рада: прогноз бюджету на 2026–2028 роки',description:'Міськрада окремо наводить туристичний збір у розмірі 0,5% для внутрішнього і 5% для в’їзного туризму та посилається на рішення №2-4690.',url:'https://cherkasy-rada.gov.ua/wp-content/uploads/documents/2025/08/prognoz-2026-2028.pdf',linkLabel:'Переглянути прогноз міськради'},
      {label:'Черкаська міська рада: архів чинних рішень про місцеві податки',description:'Офіційний архів перелічує базове рішення №2-4690 і його зміни, зокрема №21-4 та №51-32.',url:'https://cherkasy-rada.gov.ua/documents/miska-vlada/departamenty/departament-finansovoyi-polityky/rishennya-pro-misczevi-podatky-ta-zbory/diyuchi-rishennya-pro-misczevi-podatky-i-zbory/pro-zatverdzhennya-polozhen-ta-stavok-misczevyh-podatkiv-i-zboriv-na-terytoriyi-mista-cherkasy/',linkLabel:'Перевірити архів рішень'},
      {label:'Черкаська міська рада: звіт про виконання бюджету за 2024 рік',description:'Підтверджує, що після тимчасової нульової ставки у 2022–2023 роках справляння збору було відновлено у 2024 році.',url:'https://cherkasy-rada.gov.ua/novyny/informacziya-departamentu-finansovoyi-polityky-cherkaskoyi-miskoyi-rady-pro-vykonannya-byudzhetu-cherkaskoyi-miskoyi-terytorialnoyi-gromady-za-2024-rik/',linkLabel:'Переглянути звіт міськради'},
    ],
    status:'VERIFIED',
    verificationBasis:'Для розрахунків за 2026 рік підписана форма №6 ДПС для Черкаської громади вказує рішення №2-4690, код громади UA71080490000022110 і ставки 0,50% / 5,00%; набір ДПС позначений як ставки, що діють у 2026 році, та сформований за ІАС LOGICA станом на 30.01.2026. Прогноз бюджету самої Черкаської міської ради на 2026–2028 роки незалежно підтверджує ті самі ставки й посилається на базове рішення. Рішення №21-4 у 2022 році запроваджувало 0% на період воєнного стану; звіт міськради за 2024 рік підтверджує відновлення справляння збору у 2024 році. Територія міста та громади звірена окремо за КАТОТТГ. У базі сторінки правило обмежено 2026 роком; калькулятор не визначає пільги гостей автоматично.',
    checkedAt:'2026-10-14',
    version:'cherkasy-2026-tax-form-and-council-budget-2026-10-14',
  }],
  ['UA26040190000081578', {
    decisionNumber: '140-43',
    decisionDate: '2024-06-20',
    sourceUrl: 'https://www.namvk.if.ua/dt/1013488/',
    ratePublicationUrl: 'https://tax.gov.ua/zakonodavstvo/podatki-ta-zbori/stavki-mistsevih-podatkiv-ta-zboriv/ivano-frankivska-oblast/zvedena-informatsiya-2026/',
    taxOfficeCommunityFileUrl: 'https://tax.gov.ua/data/material/000/801/934869/c2141f1f_5b12_4be6_a95c_fc738535012e.pdf',
    effectiveFrom: '2025-01-01',
    effectiveTo: '2026-12-31',
    rates: { domestic: 0.3, inbound: 1.0 },
    supportingSources: [
      {label:'Івано-Франківська міська рада: рішення №140-43',description:'Чинне рішення встановлює ставки 0,3% для внутрішнього та 1% для в’їзного туризму для місць тимчасового проживання на території громади, починаючи з 01.01.2025.',url:'https://www.namvk.if.ua/dt/1013488/',linkLabel:'Переглянути рішення ради'},
      {label:'ДПС: зведені ставки Івано-Франківської області на 2026 рік',description:'У формі громади для звітного набору 2026 року наведені рішення №140-43, код громади, дата застосування 01.01.2025 та ставки 0,30% / 1,00%. Дані сформовані з ІАС LOGICA станом на 30.01.2026.',url:'https://tax.gov.ua/data/material/000/801/934869/c2141f1f_5b12_4be6_a95c_fc738535012e.pdf',linkLabel:'Переглянути підписану форму ДПС'},
      {label:'ДПС: опис набору ставок на 2026 рік',description:'ДПС зазначає, що набір 2026 року сформований за даними ІАС LOGICA станом на 30.01.2026, а відсутність окремого запису не означає нульову ставку.',url:'https://tax.gov.ua/zakonodavstvo/podatki-ta-zbori/stavki-mistsevih-podatkiv-ta-zboriv/ivano-frankivska-oblast/zvedena-informatsiya-2026/',linkLabel:'Переглянути пояснення ДПС'},
    ],
    status: 'VERIFIED',
    verificationBasis: 'Рішення Івано-Франківської міської ради №140-43 від 20.06.2024 прямо встановлює 0,3% для внутрішнього та 1% для в’їзного туризму від мінімальної зарплати на 1 січня за одну особу за добу та набирає чинності з 01.01.2025. Підписана форма громади в офіційному наборі ДПС ставок на 2026 рік містить те саме рішення, код громади UA26040190000081578, дату застосування 01.01.2025 і ставки 0,30% / 1,00%. Код Івано-Франківська UA26040190010045761 звірено з офіційним КАТОТТГ. Рішення №140-43 позначене радою як чинне. Калькулятор застосовує річну мінімальну зарплату відповідного року; додаткові місцеві пільги автоматично не визначаються.',
    checkedAt: '2026-10-14',
    version: 'ivano-frankivsk-140-43-2026-10-14',
  }],
  ['UA46060250000025047', {
    decisionNumber: '6373',
    decisionDate: '2025-06-12',
    sourceUrl: 'https://tax.gov.ua/data/material/000/801/934883/01bb5e61_0220_47aa_ba69_8f53584d7e19.pdf',
    ratePublicationUrl: 'https://tax.gov.ua/data/material/000/801/934883/01bb5e61_0220_47aa_ba69_8f53584d7e19.pdf',
    effectiveFrom: '2026-01-01',
    effectiveTo: '2026-12-31',
    decisionSourceLabel: 'Підписана форма №6 ДПС, подана Львівською міською радою на 2026 рік',
    decisionSourceDescription: 'Форма пов’язує рішення №6373 від 12.06.2025 з кодом Львівської міської територіальної громади та застосуванням з 01.01.2026. Вона підтверджує ставки й цінові рівні, але не замінює повний текст рішення ради.',
    decisionSourceLinkLabel: 'Переглянути підписану форму ДПС',
    publicationBasisText: 'Підписана форма ДПС підтверджує ставки від 01.01.2026. Калькулятор не видає суму для ціни рівно 750 грн або 1 200 грн, бо формулювання діапазонів перекриваються.',
    rateSchedule: {
      priceBasis: 'Вартість тимчасового розміщення однієї особи за одну добу',
      bands: [
        {maxPriceUahPerPersonPerDay:750,domesticRatePercent:0.3,inboundRatePercent:1.0},
        {minPriceUahPerPersonPerDay:750,maxPriceUahPerPersonPerDay:1200,domesticRatePercent:0.4,inboundRatePercent:1.0},
        {minPriceUahPerPersonPerDay:1200,domesticRatePercent:0.5,inboundRatePercent:1.0},
      ],
      ambiguousBoundariesUahPerPersonPerDay: [750,1200],
    },
    supportingSources: [
      {label:'ДПС: підписана Львівською міськрадою форма ставок на 2026 рік',description:'Офіційна форма №6 вказує рішення №6373 від 12.06.2025, застосування з 01.01.2026, код Львівської громади та три цінові рівні туристичного збору.',url:'https://tax.gov.ua/data/material/000/801/934883/01bb5e61_0220_47aa_ba69_8f53584d7e19.pdf',linkLabel:'Переглянути офіційну форму ДПС'},
      {label:'ДПС Львівщини: місцеві рішення про туристичний збір',description:'Сторінка податкової служби пояснює, що ставки встановлюють рішеннями відповідних місцевих рад.',url:'https://lv.tax.gov.ua/rishennya-mistsevih-rad-/mistsevi-podatki-ta-zbori/turistichniy-zbir/',linkLabel:'Переглянути розділ ДПС Львівщини'},
    ],
    status: 'VERIFIED',
    verificationBasis: 'Офіційна форма ДПС, підписана уповноваженою представницею Львівської міської ради, пов’язує рішення №6373 з кодом Львівської міської територіальної громади та датою застосування 01.01.2026. Форма містить три внутрішні цінові діапазони і ставку 1% для в’їзного туризму. У формулюваннях є перетин на рівно 750 та 1200 грн, тому калькулятор має відмовляти у результаті на цих межах до уточнення первинного тексту рішення.',
    checkedAt: '2026-10-14',
    version: 'lviv-banded-2026-10-14',
  }],
  ['UA61040490000035010', {
    decisionNumber: '8/52/08',
    decisionDate: '2025-10-24',
    sourceUrl: 'https://ternopilcity.gov.ua/sesiya/rishennya-sesii/29955.html',
    ratePublicationUrl: 'https://ternopilcity.gov.ua/sesiya/rishennya-sesii/93883.html',
    effectiveFrom: '2026-01-01',
    effectiveTo: null,
    rateSchedule: {
      thresholdUahPerPersonPerDay: 320,
      domestic: [{operator:'lt',threshold:320,ratePercent:0.15},{operator:'gt',threshold:320,ratePercent:0.25}],
      inbound: [{operator:'lt',threshold:320,ratePercent:0.3},{operator:'gt',threshold:320,ratePercent:0.5}],
      exactThresholdStatus: 'AMBIGUOUS',
      thresholdBasis: 'вартість проживання однієї особи за одну добу',
    },
    supportingSources: [
      {label:'Тернопільська міська рада: чинний текст місцевого рішення',description:'Рішення №7/35/5 містить чинні тарифні діапазони туристичного збору для Тернопільської міської територіальної громади.',url:'https://ternopilcity.gov.ua/sesiya/rishennya-sesii/29955.html',linkLabel:'Переглянути текст місцевого рішення'},
      {label:'Тернопільська міська рада: зміна порогу до 320 грн',description:'Рішення №8/52/08 встановлює застосування зміненого порогу з 1 січня 2026 року.',url:'https://ternopilcity.gov.ua/sesiya/rishennya-sesii/93883.html',linkLabel:'Переглянути рішення №8/52/08'},
      {label:'Тернопільська міська рада: перевірка рішення №8/54/29',description:'Переглянуто пізніші зміни до цього рішення; рішення №8/54/29 стосується майнових і земельних положень, а не туристичного збору.',url:'https://ternopilcity.gov.ua/sesiya/rishennya-sesii/96026.html',linkLabel:'Переглянути рішення №8/54/29'},
      {label:'Тернопільська міська рада: перевірка пізнішої зміни',description:'Рішення №8/57/07 від 8 травня 2026 року стосується земельної плати й майнових пільг, не змінює туристичні ставки.',url:'https://ternopilcity.gov.ua/en/sesiya/rishennya-sesii/100218.html',linkLabel:'Переглянути рішення №8/57/07'},
    ],
    status: 'VERIFIED',
    verificationBasis: 'Офіційний текст базового рішення міськради №7/35/5 встановлює тарифні діапазони; рішення №8/52/08 від 24.10.2025 змінює поріг із 200 на 320 грн і набирає чинності 01.01.2026. Рішення №8/54/29 та №8/57/07 переглянуто, вони змінюють майнові/земельні положення, а не туристичний збір. Місто Тернопіль і громаду звірено за КАТОТТГ UA61040490010069060 та UA61040490000035010. Вартість рівно 320 грн навмисно не розраховується через перетин формулювань «до 320» та «320 і вище».',
    checkedAt: '2026-10-14',
    version: 'ternopil-banded-2026-10-14',
  }],
  ['UA05020030000031457', {
    decisionNumber: '469',
    decisionDate: '2021-06-25',
    sourceUrl: 'https://www.vmr.gov.ua/media/%D0%94%D0%B5%D0%BF%D0%B0%D1%80%D1%82%D0%B0%D0%BC%D0%B5%D0%BD%D1%82%D0%B8/%D0%94%D0%A4/%D0%94%D0%A4%20%D0%B4%D0%BE%D0%BA%D1%83%D0%BC%D0%B5%D0%BD%D1%82%D0%B8/%D0%9F%D0%9E%D0%94%D0%90%D0%A2%D0%9A%D0%98/%D0%A0%D1%96%D1%88%D0%B5%D0%BD%D0%BD%D1%8F%20%D0%BC%D1%96%D1%81%D1%8C%D0%BA%D0%BE%D1%97%20%D1%80%D0%B0%D0%B4%D0%B8%20%D0%B2%D1%96%D0%B4%2025.06.2021%20%E2%84%96469.pdf',
    ratePublicationUrl: 'https://vmr.gov.ua/mistsevi-podatky-ta-zbory',
    effectiveFrom: '2022-01-01',
    effectiveTo: '2026-12-31',
    rates: { domestic: 0.5, inbound: 1.5 },
    supportingSources: [
      {label:'Вінницька міська рада: місцеві податки та збори',description:'Актуалізована сторінка міськради містить перелік чинних рішень і посилається на базове рішення №469.',url:'https://vmr.gov.ua/mistsevi-podatky-ta-zbory',linkLabel:'Перевірити місцеві податки'},
      {label:'Вінницька міська рада: рішення №3535 від 19.06.2026',description:'Нова редакція порядку туристичного збору для застосування з 1 січня 2027 року зберігає ставки 0,5% і 1,5%.',url:'https://vmr.gov.ua/media/%D0%94%D0%B5%D0%BF%D0%B0%D1%80%D1%82%D0%B0%D0%BC%D0%B5%D0%BD%D1%82%D0%B8/%D0%94%D0%A4/%D0%94%D0%A4%20%D0%B4%D0%BE%D0%BA%D1%83%D0%BC%D0%B5%D0%BD%D1%82%D0%B8/%D0%9F%D0%9E%D0%94%D0%90%D0%A2%D0%9A%D0%98/%D0%A0%D1%96%D1%88%D0%B5%D0%BD%D0%BD%D1%8F%20%D0%BC%D1%96%D1%81%D1%8C%D0%BA%D0%BE%D1%97%20%D1%80%D0%B0%D0%B4%D0%B8%20%E2%84%963535%20%D0%B2%D1%96%D0%B4%2019-06-2025.pdf',linkLabel:'Переглянути нову редакцію порядку'},
    ],
    status: 'VERIFIED',
    verificationBasis: 'Ставки 2026 року звірено з додатком 4 до рішення №469 та перехідними положеннями рішення №3535 для наступного періоду з 2027 року. Офіційна сторінка Вінницької міської ради містить чинні податкові документи. Населений пункт і громаду зіставлено з КАТОТТГ; окрема сторінка міста проходить перевірки калькулятора й індексації.',
    checkedAt: '2026-10-14',
    version: 'vinnytsia-2026-10-14',
  }],
  ['UA59080270000073662', {
    decisionNumber: '1238-МР',
    decisionDate: '2021-07-14',
    sourceUrl: 'https://finance.smr.gov.ua/files/%D0%94%D0%BE%D1%85%D0%BE%D0%B4%D0%B8/%D0%9D%D0%BE%D1%80%D0%BC%D0%B0%D1%82%D0%B8%D0%B2%D0%BD%D0%B0%20%D0%B1%D0%B0%D0%B7%D0%B0/%D0%BC%D1%96%D1%81%D1%86%D0%B5%D0%B2%D1%96%20%D0%BF%D0%BE%D0%B4%D0%B0%D1%82%D0%BA%D0%B8/%D0%BD%D0%B0%202022%20%D1%80%D1%96%D0%BA/1238-mr.zip',
    ratePublicationUrl: 'https://finance.smr.gov.ua/47-opodatkuvannya-v-ukraini',
    taxOfficeCommunityFileUrl: 'https://tax.gov.ua/data/material/000/801/934864/e2ba70ad_f3b6_4097_86bd_9ecadab9d8aa.pdf',
    effectiveFrom: '2022-01-01',
    effectiveTo: null,
    rates: { domestic: 0.5, inbound: 0.5 },
    supportingSources: [
      {label:'ДПС: звіт Сумської громади зі ставками туристичного збору',description:'Офіційний звіт наводить рішення №1238-МР, дату початку дії та ставки 0,5% для внутрішнього й в’їзного туризму.',url:'https://tax.gov.ua/data/material/000/801/934864/e2ba70ad_f3b6_4097_86bd_9ecadab9d8aa.pdf',linkLabel:'Переглянути звіт ДПС'},
      {label:'Департамент фінансів Сумської міської ради: ставки на 2026 рік',description:'Офіційна сторінка громади підтверджує ставку 0,5% для обох категорій туризму та посилається на рішення №1238-МР.',url:'https://finance.smr.gov.ua/47-opodatkuvannya-v-ukraini',linkLabel:'Перевірити інформацію громади'},
    ],
    status: 'VERIFIED',
    verificationBasis: 'Рішення №1238-МР і початок застосування звірено з офіційним звітом ДПС. Ставку для 2026 року підтверджує Департамент фінансів Сумської міської ради. Населений пункт і громаду зіставлено з КАТОТТГ; сторінка й калькулятор проходять перевірки для підтвердженого періоду.',
    checkedAt: '2026-10-14',
    version: 'sumy-2026-10-14',
  }],
  ['UA51100410000059549', {
    decisionNumber: '422-VIII',
    decisionDate: '2021-06-17',
    sourceUrl: 'https://tax.gov.ua/data/material/000/801/934878/lbc_1559100000_edrpou_22491872_version_5.pdf',
    ratePublicationUrl: 'https://ymtg.gov.ua/documents/327388-pro-vstanovlennia-stavok-turisticnogo-zboru-na-teritoriyi-pivdennivskoyi-miskoyi-teritorialnoyi-gromadi-odeskogo-raionu',
    effectiveFrom: '2022-01-01',
    effectiveTo: '2026-12-31',
    rates: { domestic: 0.5, inbound: 0.5 },
    supportingSources: [
      {label:'ДПС: форма ставок туристичного збору Південної міської ради',description:'Офіційна форма ДПС пов’язує рішення №422-VIII з кодом громади UA51100410000059549 і ставками 0,5% для внутрішнього та в’їзного туризму.',url:'https://tax.gov.ua/data/material/000/801/934878/lbc_1559100000_edrpou_22491872_version_5.pdf',linkLabel:'Переглянути форму ДПС'},
      {label:'Південнівська міська рада: рішення №2626-VIII',description:'Нове рішення встановлює ставки 0,5% і 0,5% з 01.01.2027 та визначає припинення дії рішення №422-VIII з цієї дати, що підтверджує період попереднього рішення до кінця 2026 року.',url:'https://ymtg.gov.ua/documents/327388-pro-vstanovlennia-stavok-turisticnogo-zboru-na-teritoriyi-pivdennivskoyi-miskoyi-teritorialnoyi-gromadi-odeskogo-raionu',linkLabel:'Переглянути рішення ради'},
    ],
    status: 'VERIFIED',
    verificationBasis: 'Ставки 0,5% / 0,5% звірено з офіційною формою ДПС для рішення №422-VIII та кодом громади. Рішення №2626-VIII від 28.05.2026 встановлює ті самі ставки з 01.01.2027 і припиняє дію №422-VIII з цієї дати, тому період правила для 2026 року обмежено 31.12.2026. Населений пункт і громаду зіставлено з КАТОТТГ; перевірки калькулятора й індексації обмежені підтвердженим строком.',
    checkedAt: '2026-10-14',
    version: 'pivdennivska-2026-10-14',
  }],
  ['UA05060010000053179', {
    decisionNumber: '19',
    decisionDate: '2021-07-06',
    sourceUrl: 'https://bar-city.gov.ua/upload/docs/e7c2874665b63af9ebc117b4d855f41c.pdf',
    ratePublicationUrl: 'https://tax.gov.ua/zakonodavstvo/podatki-ta-zbori/stavki-mistsevih-podatkiv-ta-zboriv/vinnitska-oblast/zvedena-informatsiya-2026/',
    taxOfficeCommunityFileUrl: 'https://tax.gov.ua/data/material/000/801/934810/29055e58_7a8e_4550_8aab_ca459a1ab2da.pdf',
    effectiveFrom: '2022-01-01',
    effectiveTo: '2026-12-31',
    rates: { domestic: 0.4, inbound: 1.0 },
    supportingSources: [
      {label:'ДПС: підписана форма ставок туристичного збору Барської громади на 2026 рік',description:'Форма містить код громади UA05060010000053179, рішення №19 від 06.07.2021, застосування з 01.01.2022 і ставки 0,40% для внутрішнього та 1,00% для в’їзного туризму.',url:'https://tax.gov.ua/data/material/000/801/934810/29055e58_7a8e_4550_8aab_ca459a1ab2da.pdf',linkLabel:'Переглянути форму ДПС'},
      {label:'Барська міська рада: протокол засідання з рішенням №19',description:'Протокол підтверджує ухвалення елементів туристичного збору за додатком 4 та їх застосування з 01.01.2022.',url:'https://bar-city.gov.ua/upload/docs/e7c2874665b63af9ebc117b4d855f41c.pdf',linkLabel:'Переглянути протокол ради'},
    ],
    status: 'VERIFIED',
    verificationBasis: 'Підписана форма ДПС на 2026 рік пов’язує Барську громаду з рішенням №19 від 06.07.2021, кодом громади UA05060010000053179, застосуванням з 01.01.2022 і ставками 0,4% / 1,0%. Протокол ради підтверджує одностайне ухвалення елементів туристичного збору за додатком 4; окремий повний текст затвердженого додатка не знайдений. Ставки перевірені для 2026 року, тому розрахунок обмежено 31.12.2026; на наступний податковий рік потрібне нове підтвердження. Кандидатну Excel-ставку 0,25% відхилено. Населений пункт Бар має окремий підтверджений код КАТОТТГ UA05060010010059821 у цій громаді.',
    checkedAt: '2026-10-14',
    version: 'bar-2026-10-14',
  }],
  ['UA73060610000066784', {
    decisionNumber: '1635',
    decisionDate: '2015-06-25',
    sourceUrl: 'https://www.tax.gov.ua/data/material/000/801/934846/ba390b74_22f5_46b0_a1e3_0b55dc45343b.pdf',
    decisionSourceLabel: 'Підписана форма №6 ДПС для туристичного збору на 2026 рік',
    decisionSourceDescription: 'Офіційна форма, підписана уповноваженою представницею Чернівецької міської ради, пов’язує ставку з базовим рішенням №1635 та його переліченими змінами. У рядку міста Чернівці (КАТОТТГ UA73060610010033137) вказано застосування з 01.01.2026 та однакові ставки для всіх місць тимчасового проживання.',
    decisionSourceLinkLabel: 'Переглянути підписану форму ДПС',
    publicationBasisText: 'Ставки на 2026 рік підтверджує підписана Чернівецькою міською радою форма №6 ДПС. У ній зазначені базове рішення №1635 та зміни до нього.',
    ratePublicationUrl: 'https://tax.gov.ua/zakonodavstvo/podatki-ta-zbori/stavki-mistsevih-podatkiv-ta-zboriv/chernivetska-oblast/zvedena-informatsiya-2026/',
    ratePublicationLabel: 'ДПС: зведений набір ставок на 2026 рік, Чернівецька область',
    ratePublicationDescription: 'Сторінка містить підписану Чернівецькою міською радою форму №6 та окремі рядки для населених пунктів громади.',
    ratePublicationLinkLabel: 'Відкрити набір ДПС за 2026 рік',
    taxOfficeCommunityFileUrl: 'https://www.tax.gov.ua/data/material/000/801/934846/ba390b74_22f5_46b0_a1e3_0b55dc45343b.pdf',
    effectiveFrom: '2026-01-01',
    effectiveTo: '2026-12-31',
    rates: { domestic: 0.3, inbound: 0.3 },
    proposedRates: { domestic: 0.25, inbound: 1.0 },
    supportingSources: [
      {label:'Чернівецька міська рада: пошук прийнятих рішень',description:'Офіційний портал ради дає змогу шукати акти за номером і датою. Форма ДПС вказує базове рішення №1635 від 25.06.2015 та зміни №80, №581, №1289, №1619 і №282.',url:'https://chernivtsi.golos.net.ua/?p=pryynyati_rishennya&sp=list',linkLabel:'Відкрити офіційний пошук рішень'},
      {label:'ДПС: зведені ставки місцевих податків і зборів у Чернівецькій області на 2026 рік',description:'Сторінка обласного набору ДПС містить підписану форму зі ставками та територіальним кодом міста Чернівці.',url:'https://tax.gov.ua/zakonodavstvo/podatki-ta-zbori/stavki-mistsevih-podatkiv-ta-zboriv/chernivetska-oblast/zvedena-informatsiya-2026/',linkLabel:'Відкрити набір ДПС за 2026 рік'},
    ],
    status: 'VERIFIED',
    verificationBasis: 'Ставки та територіальну область застосування перевірено за підписаною формою №6 ДПС, наданою Чернівецькою міською радою для 2026 року: окремий рядок міста Чернівці з кодом КАТОТТГ UA73060610010033137, застосування з 01.01.2026, 0,30% / 0,30% для всіх місць тимчасового проживання. Форма називає базове рішення №1635 від 25.06.2015 та зміни №80, №581, №1289, №1619 і №282. Вона є офіційним підтвердженням поданих на 2026 рік ставок, але не замінює текст рішення ради; тому сторінка посилається на форму як доказ ставки, а на міський портал як місце для перевірки актів. Excel-кандидат 0,25% / 1,00% відхилено. Правило обмежено 2026 роком.',
    checkedAt: '2026-10-14',
    version: 'chernivtsi-2026-10-14',
  }],
  ['UA51100270000073549', {
    decisionNumber: '4314-VIII',
    decisionDate: '2026-07-14',
    sourceUrl: 'https://omr.gov.ua/ua/acts/council/222272/',
    ratePublicationUrl: 'https://od.tax.gov.ua/diialnist/zabezpechennya-nadhodjen/print-1050922.html',
    effectiveFrom: null,
    effectiveTo: null,
    rates: null,
    reportedRates: {domestic:0.5,inbound:1.0,confirmedAsOf:'2026-09-18'},
    supportingSources: [
      {label:'ДПС Одещини: звіт за 8 місяців і повідомлення про рішення №4314-VIII',description:'Публікація від 18.09.2026 повторює ставки 0,5% для громадян України та 1% для іноземців після рішення ради від 14.07.2026.',url:'https://od.tax.gov.ua/diialnist/zabezpechennya-nadhodjen/print-1050922.html',linkLabel:'Переглянути повідомлення ДПС'},
      {label:'ДПС Одещини: повідомлення за липень про рішення №4314-VIII',description:'Публікація від 24.07.2026 повідомляє про зміну ставки для іноземців із 0,5% на 1% та незмінну ставку 0,5% для громадян України.',url:'https://od.tax.gov.ua/media-ark/news-ark/print-1033334.html',linkLabel:'Переглянути повідомлення ДПС'},
    ],
    status: 'COUNCIL_ACT_FOUND',
    verificationBasis: 'ДПС Одеської області у повідомленнях від 24.07.2026 та 18.09.2026 вказує, що рішення Одеської міської ради №4314-VIII від 14.07.2026 встановило для іноземних громадян 1% замість 0,5%, а для громадян України залишило 0,5%. Пізніша публікація підтверджує актуальність повідомлених ставок на 18.09.2026, але точну дату набрання чинності та повний текст чинного положення треба звірити з актом ради; reportedRates не використовуються калькулятором.',
    checkedAt: '2026-10-14',
    version: 'odesa-rate-report-2026-09-18',
  }],
  ['UA23060070000082704', {
    decisionNumber: '39',
    decisionDate: '2019-01-30',
    sourceUrl: 'https://zp.gov.ua/documents/95368-pro-vstanovlennia-turisticnogo-zboru',
    ratePublicationUrl: 'https://tax.gov.ua/data/material/000/801/934863/f5fade5e_db5d_4526_ab5a_8d2105263251.pdf',
    ratePublicationLabel: 'Підписана форма ставок ДПС на 2026 рік',
    ratePublicationLinkLabel: 'Переглянути форму ДПС на 2026 рік',
    effectiveFrom: '2019-02-04',
    effectiveTo: null,
    rateSchedule: {
      priceBasis: 'Вартість тимчасового розміщення однієї особи за одну добу',
      bands: [
        {maxPriceUahPerPersonPerDay:300,domesticRatePercent:0.05,inboundRatePercent:0.5},
        {minPriceExclusiveUahPerPersonPerDay:300,maxPriceUahPerPersonPerDay:600,domesticRatePercent:0.25,inboundRatePercent:1.5},
        {minPriceExclusiveUahPerPersonPerDay:600,domesticRatePercent:0.5,inboundRatePercent:1.5},
      ],
      ambiguousBoundariesUahPerPersonPerDay: [],
    },
    supportingSources: [
      {label:'ДПС: підписана форма ставок туристичного збору на 2026 рік',description:'Форма №6 ідентифікує Запорізьку міську територіальну громаду та місто за КАТОТТГ, наводить рішення №39 і три тарифні умови для внутрішнього та в’їзного туризму.',url:'https://tax.gov.ua/data/material/000/801/934863/f5fade5e_db5d_4526_ab5a_8d2105263251.pdf',linkLabel:'Переглянути форму ДПС на 2026 рік'},
      {label:'Запорізька міська рада: перелік місцевих податків і зборів',description:'Чинна сторінка ради відносить рішення №39 від 30.01.2019 до туристичного збору.',url:'https://zp.gov.ua/pages/164604-miscevi-podatki-ta-zbori',linkLabel:'Перевірити перелік рішень ради'},
    ],
    status: 'VERIFIED',
    verificationBasis: 'Рішення №39 від 30.01.2019 і його додаток оприлюднені на офіційному сайті Запорізької міської ради. Підписана Запорізькою міською радою форма ДПС для 2026 року повторно підтверджує це рішення, код громади UA23060070000082704, код міста UA23060070010069526, дати чинності та ставки. Цінові межі у формі розмежовані як до 300 грн включно, понад 300 до 600 грн включно та понад 600 грн; для в’їзного туризму до 300 грн включно діє 0,5%, понад 300 грн 1,5%.',
    checkedAt: '2026-10-14',
    version: 'zaporizhzhya-banded-2026-10-14',
  }],
  ['UA56060470000086729', {
    decisionNumber: '783',
    decisionDate: '2021-06-24',
    sourceUrl: 'https://rivnerada.gov.ua/publicservicesapi/api/search-document/load-senate-document/23153/0/783/24-06-2021',
    ratePublicationUrl: 'https://tax.gov.ua/data/material/000/801/934870/db34b3dd_b4d1_4766_8186_ebc29a7a42f4.pdf',
    ratePublicationLabel: 'Підписана форма ставок ДПС на 2026 рік',
    ratePublicationLinkLabel: 'Переглянути форму ДПС на 2026 рік',
    effectiveFrom: '2022-01-01',
    effectiveTo: null,
    rates: {domestic:0.25,inbound:1.0},
    supportingSources: [
      {label:'Рівненська міська рада: рішення №783 про туристичний збір',description:'Рішення від 24.06.2021 встановлює ставки 0,25% для внутрішнього та 1% для в’їзного туризму на території громади й набирає чинності 01.01.2022.',url:'https://rivnerada.gov.ua/publicservicesapi/api/search-document/load-senate-document/23153/0/783/24-06-2021',linkLabel:'Переглянути рішення №783'},
      {label:'ДПС: підписана форма ставок туристичного збору на 2026 рік',description:'Форма №6 підтверджує для міста Рівне рішення №783, КАТОТТГ громади й міста, ставки 0,25% та 1% і застосування з 01.01.2022.',url:'https://tax.gov.ua/data/material/000/801/934870/db34b3dd_b4d1_4766_8186_ebc29a7a42f4.pdf',linkLabel:'Переглянути форму ДПС на 2026 рік'},
    ],
    status: 'VERIFIED',
    verificationBasis: 'Повний текст рішення Рівненської міської ради №783 від 24.06.2021 установлює 0,25% для внутрішнього та 1,0% для в’їзного туризму на території громади, застосування з 01.01.2022 та замінює попередні рішення №170 і зміни №5624 та №6142. Підписана радою форма №6 ДПС на 2026 рік повторно вказує №783, дату застосування 01.01.2022, КАТОТТГ Рівненської громади UA56060470000086729 і міста UA56060470010041018 та ті самі ставки.',
    checkedAt: '2026-10-14',
    version: 'rivne-decision-783-2026-10-14',
  }],
  ['UA74100390000073425', {
    decisionNumber: '18/VIII-19',
    decisionDate: '2022-06-30',
    sourceUrl: 'https://chernigiv-rada.gov.ua/storage/files/06/21/09/24/d2591043db2538471681da9ec338c0fb.pdf',
    ratePublicationUrl: 'https://chernigiv-rada.gov.ua/storage/files/15/23/07/00/f60a2b68ff122f255a01a6efbdc24ea6.pdf',
    ratePublicationLabel: 'Ставки туристичного збору Чернігівської міськради на 2026 рік',
    ratePublicationLinkLabel: 'Переглянути ставки ради на 2026 рік',
    effectiveFrom: '2023-01-01',
    effectiveTo: null,
    rates: {domestic:0.5,inbound:0.5},
    supportingSources: [
      {label:'Чернігівська міська рада: рішення №18/VIII-19',description:'Рішення від 30.06.2022 встановило місцеві податки й збори, затвердило положення про туристичний збір та набрало чинності 01.01.2023.',url:'https://chernigiv-rada.gov.ua/storage/files/06/21/09/24/d2591043db2538471681da9ec338c0fb.pdf',linkLabel:'Переглянути рішення №18/VIII-19'},
      {label:'Чернігівська міська рада: ставки туристичного збору на 2026 рік',description:'Офіційна таблиця ради для 2026 року вказує рішення №18/VIII-19, КАТОТТГ громади UA74100390000073425 та 0,5% для внутрішнього й в’їзного туризму.',url:'https://chernigiv-rada.gov.ua/storage/files/15/23/07/00/f60a2b68ff122f255a01a6efbdc24ea6.pdf',linkLabel:'Переглянути таблицю ставок 2026 року'},
      {label:'Чернігівська міська рада: сторінка туристичного збору',description:'На офіційній сторінці міськрада окремо оприлюднює положення та ставки туристичного збору, зокрема файл ставок на 2026 рік.',url:'https://chernigiv-rada.gov.ua/fin-miscevi-podatky/id-35780/',linkLabel:'Відкрити сторінку міськради'},
    ],
    status: 'VERIFIED',
    verificationBasis: 'Офіційне рішення Чернігівської міської ради №18/VIII-19 від 30.06.2022 затвердило місцеві податки та положення про туристичний збір і набрало чинності 01.01.2023. Окрема таблиця туристичного збору, оприлюднена самою міськрадою для 2026 року, посилається на це базове рішення, дату застосування 01.01.2023, КАТОТТГ громади UA74100390000073425 та ставки 0,5% для внутрішнього і 0,5% для в’їзного туризму. Міська сторінка туристичного збору пропонує файл ставок 2026 року як актуальний документ.',
    checkedAt: '2026-10-14',
    version: 'chernihiv-18-viii-19-2026-10-14',
  }],
  ['UA26080070000092582', {
    decisionNumber: '781-16/2021',
    decisionDate: '2021-06-24',
    sourceUrl: 'https://nbkolrada.gov.ua/dt/348928/',
    ratePublicationUrl: 'https://kolrada.gov.ua/p/podatki',
    effectiveFrom: '2022-01-01',
    effectiveTo: null,
    rates: {domestic:0.5,inbound:0.5},
    supportingSources: [
      {label:'Коломийська міська рада: рішення №781-16/2021 та Положення про туристичний збір',description:'Чинне положення встановлює ставку 0,5% для внутрішнього та 0,5% для в’їзного туризму від мінімальної зарплати на 1 січня звітного року за одну особу за одну добу.',url:'https://nbkolrada.gov.ua/dt/348928/',linkLabel:'Переглянути рішення та положення'},
      {label:'Коломийська міська рада: ставки місцевих податків, чинні з 2026 року',description:'Офіційна сторінка ставок, що діють з 01.01.2026, посилається на рішення №781-16/2021, яке містить Положення про туристичний збір.',url:'https://kolrada.gov.ua/p/podatki',linkLabel:'Переглянути ставки на 2026 рік'},
      {label:'ДПС: форма ставок Коломийської громади за 2025 рік',description:'Підписана форма №6 показує 0,5% для внутрішнього та в’їзного туризму в таблиці туристичного збору громади, з датою застосування 01.01.2025. Номер рішення в цій формі не використовується тут як доказ саме туристичної ставки.',url:'https://tax.gov.ua/data/material/000/801/934869/lbc_0953000000_edrpou_04054334_version_2.pdf',linkLabel:'Переглянути форму ДПС'},
      {label:'Коломийська міська рада: звіт про виконання програми за І півріччя 2026 року',description:'Офіційний звіт міськради фіксує надходження туристичного збору до бюджету громади у 2026 році.',url:'https://nbkolrada.gov.ua/dt/789086/',linkLabel:'Переглянути звіт за 2026 рік'},
      {label:'Коломийська міська рада: прогноз бюджету громади на 2027–2029 роки',description:'Офіційний прогноз, схвалений 08.09.2026, використовує рішення №781-16/2021 серед чинної нормативної бази місцевих податків і зборів.',url:'https://nbkolrada.gov.ua/dt/789139/',linkLabel:'Переглянути бюджетний прогноз'},
    ],
    status:'VERIFIED',
    verificationBasis:'Рішення Коломийської міської ради №781-16/2021 від 24.06.2021 набрало чинності 01.01.2022, поширюється на Коломийську територіальну громаду та затверджує Положення про туристичний збір. Пункт 3.1 Положення встановлює 0,5% для внутрішнього і 0,5% для в’їзного туризму від мінімальної заробітної плати на 1 січня звітного року за одну особу за одну добу. Офіційна сторінка міськради зі ставками, чинними з 01.01.2026, посилається на це рішення. Підписана форма ДПС за 2025 рік також показує ставки 0,5% / 0,5% у таблиці туристичного збору, хоча її поле номера рішення неоднозначно відображене, тому первинним доказом ставки лишається Положення №781-16/2021. Звіт міськради підтверджує надходження туристичного збору у першому півріччі 2026 року, а схвалений 08.09.2026 бюджетний прогноз на 2027–2029 роки посилається на №781-16/2021 як на нормативну основу місцевих податків і зборів. Таким чином, ставка підтверджується чинним положенням та актуальним переліком ставок міськради, а не лише даними ДПС за 2025 рік. Населений пункт Коломия UA26080070010075786 і громаду UA26080070000092582 зіставлено з офіційним КАТОТТГ.',
    checkedAt:'2026-10-14',
    version:'kolomyya-781-16-2021-2026-10-14',
  }],
  ['UA21100230000083101', {
    decisionNumber: '2333',
    decisionDate: '2025-07-08',
    sourceUrl: 'https://tax.gov.ua/data/material/000/801/934858/lbc_0755900000_edrpou_02313559_version_1.pdf',
    ratePublicationUrl: 'https://tax.gov.ua/zakonodavstvo/podatki-ta-zbori/stavki-mistsevih-podatkiv-ta-zboriv/zakarpatska-oblast/zvedena-informatsiya-2026/',
    effectiveFrom: '2026-01-01',
    effectiveTo: '2026-12-31',
    rates: {domestic:0.5,inbound:1.0},
    proposedRates: {domestic:0.4,inbound:1.0},
    supportingSources: [
      {label:'ДПС: підписана форма №6 Ужгородської громади на 2026 рік',description:'Форма називає місто Ужгород (КАТОТТГ UA21100230010016545), громаду UA21100230000083101, рішення №2333 від 08.07.2025, застосування з 01.01.2026 та універсальну ставку 0,50% / 1,00%. У тій самій формі додатково надруковані нульові рядки для типів житла, хоча примітка до форми вимагає не заповнювати деталізацію 1.1 за наявності універсальної ставки 1.0.0. Для цього розрахунку застосовується універсальний рядок; нулі трактуються як помилкова/зайва деталізація, а не як окремі тарифи.',url:'https://tax.gov.ua/data/material/000/801/934858/lbc_0755900000_edrpou_02313559_version_1.pdf',linkLabel:'Переглянути форму №6 ДПС'},
      {label:'ДПС: зведений набір місцевих ставок Закарпатської області на 2026 рік',description:'Зведення сформоване з даних ІАС LOGICA станом на 30.01.2026; відсутність громади в наборі не означає ставку 0%.',url:'https://tax.gov.ua/zakonodavstvo/podatki-ta-zbori/stavki-mistsevih-podatkiv-ta-zboriv/zakarpatska-oblast/zvedena-informatsiya-2026/',linkLabel:'Переглянути зведення ДПС'},
    ],
    status:'VERIFIED',
    verificationBasis:'Підписана форма №6 ДПС для 2026 року прямо називає Ужгород UA21100230010016545 у складі Ужгородської громади UA21100230000083101, рішення №2333 від 08.07.2025 та застосування ставок з 01.01.2026. Універсальний рядок 1.0.0 задає 0,50% для внутрішнього і 1,00% для в’їзного туризму. Форма водночас містить нулі в окремих рядках типів житла, хоча її примітка каже, що за заповненого 1.0.0 розділ 1.1 не заповнюється. Тому для інформаційного калькулятора беремо універсальну ставку 1.0.0, а не помилкову деталізацію з нулями. Наданий Excel пропонує 0,40% / 1,00%; для внутрішнього туризму це суперечить актуальній підписаній формі ДПС, тому застосовуємо 0,50%. Сторінка пояснює це розходження. Правило обмежене 2026 роком; перед 2027 роком звірити нове рішення та форму ДПС.',
    checkedAt:'2026-10-14',
    version:'uzhhorod-form6-universal-rate-2026-10-14',
  }],
  ['UA46100210000027970', {
    decisionNumber: '1805',
    decisionDate: '2022-07-07',
    sourceUrl: 'https://tax.gov.ua/data/material/000/801/934883/d5ac4701_e753_4c8a_9d0c_a0f735173f94.pdf',
    ratePublicationUrl: 'https://tax.gov.ua/zakonodavstvo/podatki-ta-zbori/stavki-mistsevih-podatkiv-ta-zboriv/lvivska-oblast/zvedena-informatsiya-2026/',
    effectiveFrom: '2026-01-01',
    effectiveTo: '2026-12-31',
    rates: {domestic:0.2,inbound:0.2},
    proposedRates: {domestic:0.5,inbound:1.0},
    supportingSources: [
      {label:'ДПС: підписана форма №6 Славської громади на 2026 рік',description:'Форма називає селище Славсько (КАТОТТГ UA46100210010024884), громаду UA46100210000027970, рішення №1805 від 07.07.2022, застосування з 01.01.2026 і універсальну ставку 0,20% / 0,20%. Зайві нульові рядки за типами житла суперечать примітці форми, за якою деталізація 1.1 не заповнюється за наявності універсального рядка 1.0.0. Для калькулятора використовуємо саме універсальні 0,20% / 0,20%.',url:'https://tax.gov.ua/data/material/000/801/934883/d5ac4701_e753_4c8a_9d0c_a0f735173f94.pdf',linkLabel:'Переглянути форму №6 ДПС'},
      {label:'ДПС: зведений набір місцевих ставок Львівської області на 2026 рік',description:'Офіційне зведення ставок, поданих громадами на 2026 рік.',url:'https://tax.gov.ua/zakonodavstvo/podatki-ta-zbori/stavki-mistsevih-podatkiv-ta-zboriv/lvivska-oblast/zvedena-informatsiya-2026/',linkLabel:'Переглянути зведення ДПС'},
    ],
    status:'VERIFIED',
    verificationBasis:'Підписана форма №6 ДПС за 2026 рік прямо включає селище Славсько UA46100210010024884 до Славської селищної громади UA46100210000027970, вказує рішення №1805 від 07.07.2022 та дату застосування 01.01.2026. Універсальний рядок 1.0.0 встановлює 0,20% для внутрішнього та 0,20% для в’їзного туризму. Нульові рядки окремих типів житла у цій же формі конфліктують з приміткою, що розділ 1.1 не заповнюється при встановленні універсальної ставки; тому їх не трактуємо як нульову ставку. Excel пропонує 0,50% / 1,00%, але це не збігається з підписаною формою ДПС. Для попереднього розрахунку беремо універсальні значення з офіційної форми, показуємо зіркове пояснення та обмежуємо правило 2026 роком. Перед 2027 роком перевірити нове рішення і форму ДПС.',
    checkedAt:'2026-10-14',
    version:'slavsko-form6-universal-rate-2026-10-14',
  }],
]);

export const touristTaxCommunities = Object.freeze([
  ...verifiedTouristTaxCommunities,
  ...workbookCommunities.map(community=>{
    const verifiedRule=primaryRuleOverrides.get(community.katottgCode);
    return verifiedRule?{...community,taxRule:{...community.taxRule,...verifiedRule}}:community;
  }),
]);

const seoLocalityLabel=source=>{
  const match=String(source.name).match(/^(.*?)\s+\(([^)]+)\)$/);
  return match&&normalizeCommunityIdentity(match[2])===normalizeCommunityIdentity(source.region)?match[1]:source.name;
};

const verifiedTouristTaxPlaces = [
  {
    slug: 'lutsk',
    name: 'Луцьк',
    nameLocative: 'Луцьку',
    settlementType: 'місто',
    region: 'Волинська область',
    district: 'Луцький район',
    katottgSettlementCode: 'UA07080170010083384',
    communitySlug: 'lutsk-community',
    geoStatus: 'ELIGIBLE',
    geoStatusReason: 'Код Луцька звірено з офіційним КАТОТТГ; код громади підтверджено ДПС Волинської області у 2026 році.',
    route: '/tourist-tax/lutsk/',
    indexable: true,
    readiness: {placeVerified:true,safetyEligible:true,calculatorQaPassed:true,uniqueContentApproved:true,seoQaPassed:true},
    editorial: {
      title: 'Туристичний збір у Луцьку у 2026 році: ставки та калькулятор',
      description: 'Туристичний збір у Луцьку у 2026 році: 0,5% для внутрішнього та 1,5% для в’їзного туризму. Джерело ставок і калькулятор суми за гостями й добами.',
      uniqueContent: 'У Луцькій міській територіальній громаді з 1 січня 2026 року діють ставки туристичного збору 0,5% для внутрішнього та 1,5% для в’їзного туризму. Рішення міської ради №77/72 визначає ставку як відсоток мінімальної заробітної плати на 1 січня податкового року за одну особу за кожну добу тимчасового розміщення. Калькулятор рахує інформаційну суму за обраною датою, кількістю розрахункових діб і категоріями гостей.',
      seoBlock: {
        title: 'Туристичний збір у Луцьку у 2026 році: місцеві ставки та розрахунок',
        intro: 'Для готелю, садиби, хостелу, апартаментів або іншого місця тимчасового розміщення у Луцьку застосовується рішення Луцької міської територіальної громади. Рішення №77/72 діє з 1 січня 2026 року та встановлює окремі ставки для внутрішнього й в’їзного туризму.',
        sections: [
          {
            heading: 'Який туристичний збір діє у Луцьку у 2026 році',
            paragraphs: [
              'У Луцькій міській територіальній громаді ставка для внутрішнього туризму становить 0,5%, для в’їзного туризму 1,5% від мінімальної заробітної плати, встановленої на 1 січня податкового року. У 2026 році розрахункова база становить 8 647 грн. Це відповідає орієнтовно 43,24 грн та 129,71 грн за одну особу за одну розрахункову добу відповідно.'
            ]
          },
          {
            heading: 'Чи залежить туристичний збір у Луцьку від ціни номера',
            paragraphs: [
              'У рішенні №77/72 ставку визначено як відсоток мінімальної заробітної плати на 1 січня податкового року. Для цього правила ціна номера не є змінною формули. Попередня сума залежить від категорії туризму, кількості гостей і розрахункових діб. Одна доба становить 24 години між розрахунковими годинами об’єкта.'
            ]
          },
          {
            heading: 'На які адреси поширюються ставки Луцької громади',
            paragraphs: [
              'Сторінка стосується міста Луцьк, код КАТОТТГ населеного пункту UA07080170010083384, у складі Луцької міської територіальної громади з кодом UA07080170000013585. Якщо об’єкт розташований в іншому населеному пункті Волинської області, не застосовуйте цю ставку автоматично: спершу встановіть громаду за адресою та перевірте її рішення. ДПС окремо пояснює, як визначити код територіальної громади для об’єкта.'
            ]
          },
          {
            heading: 'Приклад: один гість в’їзного туризму на дві розрахункові доби',
            paragraphs: [
              'За бази 8 647 грн і ставки 1,5% попередній збір для одного гостя на дві розрахункові доби становить 8 647 × 1,5% × 1 × 2 = 259,41 грн. Перед нарахуванням окремо перевірте можливі законні підстави для звільнення: калькулятор не визначає право на них автоматично.'
            ]
          }
        ]
      },
    },
  },
];

const workbookTouristTaxPlaces = workbook.places.filter(source=>!verifiedTouristTaxPlaces.some(place=>place.slug===source.slug)).map(source=>({
  slug:source.slug,
  name:source.name,
  settlementType:source.category||'населений пункт',
  region:source.region,
  district:katottgByPlaceSlug.get(source.slug)?.officialDistrictName?`${katottgByPlaceSlug.get(source.slug).officialDistrictName} район`:null,
  katottgSettlementCode:katottgByPlaceSlug.get(source.slug)?.settlementCode??null,
  communitySlug:source.slug==='lutsk'?'lutsk-community':communitySlugByPlaceSlug.get(source.slug),
  geoStatus:'REVIEW_REQUIRED',
  geoStatusReason:katottgByPlaceSlug.get(source.slug)?.status==='MATCHED'?'Населений пункт і громаду зіставлено з офіційним КАТОТТГ від 7 липня 2026 року. Для розрахунку також потрібні перевірене рішення громади, період дії та перевірка калькулятора.':katottgByPlaceSlug.get(source.slug)?.status==='LOCALITY_ALIAS_DUPLICATE'?'Ця сторінка описує локацію в уже зіставленому населеному пункті. Окремий код КАТОТТГ не дублюється; потрібне ручне підтвердження адреси та громади.':'Назву населеного пункту не вдалося однозначно зіставити з КАТОТТГ; потрібна ручна перевірка перед визначенням громади та ставки.',
  route:source.route,
  indexable:false,
  readiness:{placeVerified:false,safetyEligible:false,calculatorQaPassed:false,uniqueContentApproved:false,seoQaPassed:false},
  sourceRecord:source,
  editorial:{
    title:`Туристичний збір: ${seoLocalityLabel(source)}, ${source.region} область у 2026 році | VDALO`,
    description:`Довідка про туристичний збір для локації «${seoLocalityLabel(source)}» (${source.region} область): як перевірити рішення громади та які дані потрібні для розрахунку.`,
    seoBlock:{
      title:`Туристичний збір: ${seoLocalityLabel(source)}, ${source.region} область у 2026 році`,
      intro:`Розмір туристичного збору для об’єкта розміщення у населеному пункті ${source.name} визначається рішенням відповідної місцевої ради. Щоб назвати чинну ставку, потрібно точно зіставити населений пункт із територіальною громадою та перевірити офіційне рішення і період його дії.`,
      sections:[
        {heading:`Як перевірити туристичний збір у ${source.name}`,paragraphs:[`Спершу встановіть, до якої територіальної громади належить місце розміщення у населеному пункті ${source.name}. Далі звірте чинне рішення ради, категорії туризму, дату набрання чинності та можливі зміни до документа. Дані з довідкової таблиці самі по собі не підтверджують ставку.`]},
        {heading:`Що має перевірити готель перед розрахунком`,paragraphs:[`До нарахування збору звірте адресу об’єкта, його громаду, чинне місцеве рішення та категорію гостя за Податковим кодексом. Сума в калькуляторі з’явиться після підтвердження географічних кодів, офіційного джерела ставки й періоду її дії.`]},
      ],
    },
  },
  review:source.review,
}));

// These place pages have verified 2026 local rules, exact KATOTTG matches,
// and page-specific copy based only on those reviewed sources. Order 376 is
// not a tourist-tax rate or taxpayer gate in Tax Code article 268.
const publishableReviewedCityContent={
  berehove:{
    title:'Туристичний збір у Береговому у 2026 році: ставка та калькулятор',
    description:'Ставка туристичного збору у Береговому на 2026 рік: 0,25% для внутрішнього та в’їзного туризму. Форма ДПС, рішення громади й попередній розрахунок.',
    uniqueContent:'Для міста Берегове у складі Берегівської міської територіальної громади форма №6 ДПС у наборі місцевих ставок на 2026 рік наводить 0,25% для внутрішнього та 0,25% для в’їзного туризму. У формі вказано базове рішення №794 від 9 липня 2021 року та дату застосування 1 січня 2022 року. Місто й громада ідентифіковані окремими кодами КАТОТТГ. Калькулятор на цій сторінці використовує підтверджене правило лише для розрахунків 2026 року; до нового бюджетного року ставку потрібно звірити повторно.',
    seoBlock:{
      title:'Туристичний збір у Береговому у 2026 році: ставка і розрахунок',
      intro:'Для міста Берегове у Берегівській міській територіальній громаді форма №6 ДПС у наборі ставок на 2026 рік підтверджує 0,25% для внутрішнього та в’їзного туризму. Нижче можна оцінити суму за кількістю гостей і розрахункових діб. Дані звірені 14 жовтня 2026 року; перед 2027 роком ставку потрібно перевірити за новим рішенням або оновленими офіційними даними.',
      sections:[
        {heading:'Яка ставка туристичного збору діє у Береговому у 2026 році',paragraphs:['Форма №6 ДПС для Берегівської міської територіальної громади зазначає ставку 0,25% для внутрішнього і 0,25% для в’їзного туризму. У документі прямо назване місто Берегове та код громади UA21020030000019624. Ставка застосовується до визначеної Податковим кодексом бази, а не як частка повної ціни номера.']},
        {heading:'Рішення громади та період, на який перевірено дані',paragraphs:['У формі ДПС наведене базове рішення Берегівської міської ради №794 від 9 липня 2021 року. Дата застосування ставок у таблиці туристичного збору зазначена як 1 січня 2022 року. Для цього розрахункового інструмента правило обмежене 2026 роком: оприлюднений ДПС набір відображає дані ІАС LOGICA станом на 30 січня 2026 року. Це не прогноз незмінності ставки у наступному році.']},
        {heading:'Скільки це становить за одну особу за одну добу',paragraphs:['Законодавча база для 2026 року становить 8 647 грн. За ставкою 0,25% попередній збір дорівнює 21,6175 грн, або 21,62 грн після округлення до копійок за одну особу за одну розрахункову добу. Наприклад, для двох гостей і двох діб загальна орієнтовна сума становить 86,47 грн до перевірки можливих законних звільнень.']},
        {heading:'Як скористатися калькулятором туристичного збору',paragraphs:['Виберіть категорію туризму, введіть кількість гостей і розрахункових діб. Калькулятор застосує ставку Берегівської громади 0,25% та базу 2026 року. Розрахункова доба визначається правилами Податкового кодексу й розрахунковими годинами об’єкта, а не просто календарною датою заїзду чи виїзду. Порівняйте результат із фактичними даними заселення та обліку.']},
        {heading:'Які дані перевірити перед нарахуванням',paragraphs:['Сторінка стосується міста Берегове з кодом КАТОТТГ UA21020030010083215 у складі Берегівської міської територіальної громади. Якщо об’єкт розміщення знаходиться в іншому населеному пункті громади, перевірте його адресу та застосовність відповідного рядка офіційної форми. Калькулятор не встановлює автоматично право гостя на пільгу. Перевірте підтвердні документи й окремо звірте нові місцеві рішення перед використанням розрахунку за 2027 рік.']},
      ]
    }
  },
  uzhhorod:{
    title:'Туристичний збір в Ужгороді у 2026 році: ставки та калькулятор',
    description:'Туристичний збір в Ужгороді у 2026 році: 0,5% для внутрішнього та 1% для в’їзного туризму. Форма ДПС, розбіжності й калькулятор.',
    uniqueContent:'Для Ужгорода підписана форма №6 ДПС на 2026 рік наводить універсальні ставки 0,50% для внутрішнього та 1,00% для в’їзного туризму. У ній названо рішення міської ради №2333 від 8 липня 2025 року, місто з кодом КАТОТТГ UA21100230010016545 та громаду UA21100230000083101. Попередній довідковий набір містив 0,40% / 1,00%, а форма поряд із універсальним рядком містить цінові критерії та нульові значення за окремими типами житла. Примітки форми кажуть, що за заповнення універсального рядка відповідну деталізацію не заповнюють. Оригінальний акт ради не вдалося незалежно прочитати для розбору цих рядків. Сторінка позначає розбіжності зірочкою; калькулятор бере універсальний рядок 1.0.0 ДПС за 2026 рік, не трактує нульові рядки як звільнення і не моделює окремі цінові діапазони.',
    seoBlock:{
      title:'Туристичний збір в Ужгороді у 2026 році: ставки, рішення і розрахунок',
      intro:'На 2026 рік підписана форма №6 ДПС для Ужгорода вказує універсальну ставку 0,50% для внутрішнього та 1,00% для в’їзного туризму. Тут можна попередньо розрахувати збір, побачити рішення громади та розібрати розбіжність із попередніми довідковими даними.',
      sections:[
        {heading:'Які ставки туристичного збору діють в Ужгороді у 2026 році',paragraphs:['Універсальний рядок 1.0.0 у підписаній формі №6 ДПС вказує для Ужгородської міської територіальної громади 0,50% для внутрішнього та 1,00% для в’їзного туризму. Форма пов’язує ставки з рішенням міської ради №2333 від 08.07.2025 та застосуванням з 01.01.2026. Для законодавчої бази 8 647 грн це орієнтовно 43,24 грн та 86,47 грн за одну особу за одну розрахункову добу після округлення до копійок.']},
        {heading:'Зірочка до ставки: що суперечить у формі ДПС',paragraphs:['* Форма №6 наводить універсальний рядок 1.0.0 зі ставками 0,50% / 1,00%, але поруч містить цінові критерії та нульові значення за окремими типами розміщення. Примітка до форми вказує, що за універсального рядка не заповнюють деталізовані рядки. Повний текст рішення №2333 з додатками окремо прочитати не вдалося, тому ми не переносимо ці рядки як окрему шкалу ставок чи звільнення. У калькуляторі застосовуємо універсальний рядок 1.0.0, який підписана форма пов’язує з Ужгородом і датою 01.01.2026.']},
        {heading:'Чому довідкові джерела показують різні ставки',paragraphs:['Попередній довідковий набір для Ужгорода містив 0,40% для внутрішнього та 1,00% для в’їзного туризму. Підписана форма ДПС за 2026 рік вказує універсальні 0,50% / 1,00%, рішення №2333 і дату застосування 01.01.2026. Для розрахунку беремо універсальний рядок чинної форми ДПС. Розбіжність внутрішньої ставки й неузгодженість додаткових рядків пояснюємо відкрито. Перед використанням для 2027 року треба перевірити нове рішення та оновлену форму.']},
        {heading:'Як порахувати туристичний збір для проживання в Ужгороді',paragraphs:['Для попередньої оцінки введіть кількість гостей внутрішнього та в’їзного туризму окремо, а також розрахункові доби. Формула для сталої ставки: 8 647 грн × місцевий відсоток × кількість гостей відповідної категорії × кількість діб. Наприклад, для одного гостя внутрішнього туризму на дві доби виходить 86,47 грн; для одного гостя в’їзного туризму на дві доби 172,94 грн. Калькулятор підсумовує загальну суму і не встановлює право гостя на законне звільнення.']},
        {heading:'Територія дії та період перевірки',paragraphs:['Сторінка стосується міста Ужгород з кодом КАТОТТГ UA21100230010016545 у складі Ужгородської міської територіальної громади з кодом UA21100230000083101. Форма ДПС зазначає застосування ставок з 1 січня 2026 року. Це довідка для розрахунків за 2026 рік, а не підтвердження незмінності ставки надалі. Перед використанням для 2027 року звірте нове рішення міської ради та її форму в наборі ДПС.']},
      ]
    }
  },
  slavsko:{
    title:'Туристичний збір у Славську у 2026 році: ставка та калькулятор',
    description:'Туристичний збір у Славську у 2026 році: 0,2% для внутрішнього та в’їзного туризму. Форма ДПС, пояснення розбіжності й калькулятор.',
    uniqueContent:'У підписаній формі №6 ДПС на 2026 рік для селища Славсько вказана універсальна ставка 0,20% для внутрішнього та 0,20% для в’їзного туризму. Форма називає рішення №1805 від 7 липня 2022 року, дату застосування 1 січня 2026 року, код селища UA46100210010024884 і код Славської громади UA46100210000027970. Попередній довідковий набір містив 0,50% / 1,00%. У формі є нульові рядки за типами житла, але примітка каже, що деталізацію не заповнюють разом з універсальним рядком. Оригінальний акт ради не вдалося незалежно прочитати, це обмеження сторінка позначає зірочкою. Калькулятор бере універсальні 0,20% / 0,20% з форми й рахує тільки в межах 2026 року.',
    seoBlock:{
      title:'Туристичний збір у Славську у 2026 році: ставка, рішення та розрахунок',
      intro:'Для селища Славсько підписана форма №6 ДПС на 2026 рік наводить універсальну ставку туристичного збору 0,20% для внутрішнього та в’їзного туризму. Нижче можна розрахувати суму, переглянути коди КАТОТТГ і зрозуміти, чому довідкові джерела показують різні ставки.',
      sections:[
        {heading:'Яка ставка туристичного збору діє у Славську на 2026 рік',paragraphs:['Універсальний рядок 1.0.0 підписаної форми №6 ДПС для Славської селищної громади вказує 0,20% для внутрішнього і 0,20% для в’їзного туризму. Форма пов’язує дані з рішенням №1805 від 07.07.2022 та застосуванням з 01.01.2026. За мінімальної зарплати 8 647 грн це становить орієнтовно 17,29 грн за одну особу за одну розрахункову добу.']},
        {heading:'Зірочка до ставки: як читати суперечливі рядки форми',paragraphs:['* Форма №6 поруч з універсальною ставкою 0,20% / 0,20% містить нульові рядки для типів житла. Примітка форми каже, що рядок 1.0.0 застосовується для однакових ставок для всіх об’єктів і що за його заповнення розділ 1.1 не заповнюють. Тому нулі не вважаємо окремими нульовими тарифами чи звільненням. Оригінал рішення №1805 з додатком незалежно прочитати не вдалося, це обмеження зазначаємо відкрито. Для розрахунку за 2026 рік обрано універсальний рядок 1.0.0 підписаної форми ДПС.']},
        {heading:'Чому довідкові джерела показують різні ставки',paragraphs:['Попередній довідковий набір містив 0,50% для внутрішнього та 1,00% для в’їзного туризму. Ці значення суперечать універсальному рядку підписаної форми ДПС за 2026 рік. Для цього калькулятора пріоритет має офіційне подання громади з територіальною прив’язкою та датою застосування; тому показуємо 0,20% / 0,20%, а альтернативні значення пояснюємо явно. Перед наступним податковим роком потрібно звірити нове рішення та нову форму, не переносити поточні відсотки автоматично.']},
        {heading:'Приклад розрахунку для гостей у Славську',paragraphs:['Для двох гостей і двох розрахункових діб за ставкою 0,20% сума становить 8 647 × 0,20% × 2 × 2 = 69,18 грн після округлення загального результату до копійок. Для змішаної групи внесіть кількість гостей за кожною категорією окремо. Результат є попереднім: калькулятор не визначає можливі законні звільнення та не замінює дані заселення в обліку.']},
        {heading:'Яку територію охоплює сторінка і коли перевіряти дані',paragraphs:['Ця сторінка описує селище Славсько з кодом КАТОТТГ UA46100210010024884 у складі Славської селищної територіальної громади UA46100210000027970. У формі ДПС для рішення №1805 зазначена дата застосування ставки 01.01.2026. Перевірку виконано 14 жовтня 2026 року; дата наступного планового перегляду перед 2027 роком є нагадуванням, а не твердженням про гарантовану зміну. Для іншого населеного пункту громади потрібно звірити конкретну адресу та відповідний рядок офіційного документа.']},
      ]
    }
  },
  cherkasy:{
    title:'Туристичний збір у Черкасах у 2026 році: ставки та калькулятор',
    description:'Ставки туристичного збору в Черкасах на 2026 рік: 0,5% для внутрішнього та 5% для в’їзного туризму. Форма ДПС, джерела міськради й калькулятор.',
    uniqueContent:'Для Черкаської міської територіальної громади офіційна форма №6 ДПС на 2026 рік наводить 0,50% для внутрішнього та 5,00% для в’їзного туризму. Ці ставки також зазначені у прогнозі бюджету Черкаської міської ради на 2026–2028 роки. У 2022 році рада тимчасово встановила нульову ставку на період воєнного стану, а у звіті за 2024 рік повідомила про відновлення справляння збору. Сторінка стосується міста Черкаси й показує інформаційний розрахунок лише для правил 2026 року.',
    seoBlock:{
      title:'Туристичний збір у Черкасах у 2026 році: ставки, приклад і порядок розрахунку',
      intro:'Для місця тимчасового розміщення у місті Черкаси ставку туристичного збору потрібно визначати за рішеннями Черкаської міської ради та підтвердженими даними для Черкаської міської територіальної громади. Форма №6 ДПС за 2026 рік і прогноз бюджету міськради наводять 0,50% для внутрішнього та 5,00% для в’їзного туризму. Калькулятор нижче дає попередню оцінку за кількістю гостей і розрахункових діб.',
      sections:[
        {heading:'Ставки туристичного збору у Черкасах на 2026 рік',paragraphs:['У формі №6 ДПС для Черкаської міської територіальної громади на 2026 рік зазначені ставки 0,50% для внутрішнього й 5,00% для в’їзного туризму. Форма пов’язує дані з рішенням Черкаської міської ради №2-4690 від 27 червня 2019 року та кодом громади UA71080490000022110. Прогноз бюджету Черкаської міської ради на 2026–2028 роки також називає 0,5% і 5% та посилається на те саме базове рішення. Ці відсотки застосовують до законодавчої бази збору, а не безпосередньо до повної вартості проживання.']},
        {heading:'Скільки становить збір за одну розрахункову добу',paragraphs:['Базою для розрахунку у 2026 році є мінімальна заробітна плата, встановлена на 1 січня, 8 647 грн. За внутрішньої ставки 0,50% попередня сума дорівнює 43,235 грн за одну особу за одну розрахункову добу, або 43,24 грн після округлення. За в’їзної ставки 5,00% це 432,35 грн. Кількість гостей і розрахункових діб змінює загальний результат; якщо вартість розміщення або статус гостя потребує правової оцінки, її слід виконати окремо.']},
        {heading:'Як порахувати туристичний збір у Черкасах',paragraphs:['Для попередньої оцінки оберіть категорію туризму, укажіть кількість осіб та розрахункових діб. Формула для фіксованої ставки: мінімальна зарплата на 1 січня року × місцева ставка × кількість гостей × кількість розрахункових діб. Введіть дані в калькулятор, щоб отримати суму для сценарію проживання. Одна розрахункова доба визначається правилами Податкового кодексу та розрахунковими годинами об’єкта. Результат є інформаційним і не замінює облік фактичних даних гостя чи консультацію з податкових обставин.']},
        {heading:'Що відомо про зміну ставки під час воєнного стану',paragraphs:['Черкаська міська рада у березні 2022 року встановила нульову ставку туристичного збору на період воєнного стану. У звіті про виконання бюджету за 2024 рік рада повідомила, що справляння туристичного збору було відновлено у 2024 році. У матеріалах міськради для планування бюджету на 2026 рік наведені ставки 0,5% і 5%, а форма ДПС за 2026 рік відображає ці самі значення для громади. Тож калькулятор на цій сторінці застосовує правило тільки до проживання у 2026 році. Для інших років потрібно перевіряти відповідний період і нові рішення.']},
        {heading:'Перевірте адресу, громаду та документи',paragraphs:['Ця сторінка призначена для міста Черкаси, код населеного пункту КАТОТТГ UA71080490010015879. У формі ДПС ставка наведена для Черкаської міської територіальної громади з кодом UA71080490000022110. Якщо об’єкт розташований в іншому населеному пункті, не застосовуйте міський розрахунок автоматично: звірте його адресу з громадою та місцевим рядком ставок. Калькулятор не встановлює, чи має конкретний гість законну пільгу. Податковий агент має перевірити категорію особи та підтвердні документи за чинними правилами.']},
        {heading:'Офіційні джерела та межі цієї довідки',paragraphs:['Ставки звірено з підписаною формою №6 ДПС для Черкаської громади у наборі на 2026 рік і з прогнозом бюджету Черкаської міської ради на 2026–2028 роки. Архів ради перелічує рішення №2-4690 та зміни до нього, а звіт за 2024 рік фіксує відновлення збору після нульової ставки у 2022–2023 роках. ДПС зазначає, що набір ставок на 2026 рік сформований за даними ІАС LOGICA станом на 30 січня 2026 року. Це довідковий калькулятор, а не індивідуальна податкова консультація; пільги та обставини конкретного розміщення потрібно перевіряти окремо.']},
      ]
    }
  },
  chernivtsi:{
    title:'Туристичний збір у Чернівцях у 2026 році: ставка та калькулятор',
    description:'Ставки туристичного збору в Чернівцях на 2026 рік: 0,3% для внутрішнього та в’їзного туризму. Офіційне джерело ДПС і калькулятор.',
    uniqueContent:'На 2026 рік підписана форма ДПС для міста Чернівці вказує однакову ставку туристичного збору 0,3% для внутрішнього та в’їзного туризму. Дані стосуються міста з кодом КАТОТТГ UA73060610010033137, а не автоматично всіх населених пунктів Чернівецької міської громади.',
    seoBlock:{title:'Туристичний збір у Чернівцях у 2026 році: ставка, розрахунок і територія дії',intro:'Для міста Чернівці у 2026 році підписана форма ДПС зазначає ставку туристичного збору 0,30% для внутрішнього та 0,30% для в’їзного туризму. Нижче можна попередньо порахувати суму за кількістю гостей і розрахункових діб та перевірити офіційні джерела. Дані міського рядка стосуються населеного пункту з кодом КАТОТТГ UA73060610010033137.',sections:[
      {heading:'Ставки туристичного збору у Чернівцях на 2026 рік',paragraphs:['Підписана форма №6 ДПС для 2026 року вказує для міста Чернівці ставку 0,30% для внутрішнього й 0,30% для в’їзного туризму. У формі зазначене базове рішення Чернівецької міської ради №1635 від 25 червня 2015 року зі змінами №80, №581, №1289, №1619 та №282. Ставка в цьому довіднику обмежена періодом з 1 січня до 31 грудня 2026 року.']},
      {heading:'Як попередньо розрахувати туристичний збір',paragraphs:['Для довідкового прикладу база 2026 року становить 8 647 грн, а ставка 0,30% дорівнює 25,941 грн за одного гостя за одну розрахункову добу. За трьох гостей внутрішнього туризму протягом двох розрахункових діб попередня сума становить 8 647 × 0,30% × 3 × 2 = 155,646 грн, тобто 155,65 грн після округлення підсумку до копійок. В’їзний туризм має таку саму ставку.']},
      {heading:'На яку територію поширюється міська ставка',paragraphs:['Ставку на цій сторінці прив’язано до міста Чернівці з кодом КАТОТТГ UA73060610010033137. В офіційній формі ДПС інші населені пункти громади подані окремими рядками, тому міський відсоток не слід автоматично застосовувати до адрес у Коровії, Чорнівці чи інших населених пунктах. Для об’єкта за межами міста перевірте відповідний рядок громади та рішення, що стосується його адреси.']},
      {heading:'Офіційне підтвердження та межі довідки',paragraphs:['Ставки й міський код звірено з підписаною формою №6 ДПС для 2026 року, поданою Чернівецькою міською радою. Форма посилається на базове рішення №1635 та перелічує зміни до нього; портал ради надає пошук прийнятих актів за номером і датою. Сторінка показує інформаційний розрахунок, не визначає пільгу конкретного гостя й не замінює перевірку адреси, документів та актуального законодавства.']},
    ]},
  },
  'ivano-frankivsk':{
    title:'Туристичний збір в Івано-Франківську у 2026 році: ставки та калькулятор',
    description:'Ставки туристичного збору в Івано-Франківську на 2026 рік: рішення міської ради №140-43, офіційні дані ДПС та калькулятор за категорією гостей і кількістю діб.',
    uniqueContent:'У Івано-Франківській міській територіальній громаді рішення №140-43 встановлює туристичний збір у розмірі 0,3% для внутрішнього та 1% для в’їзного туризму. Ці ставки наведені також у підписаній формі ДПС у зведеному наборі ставок на 2026 рік. Калькулятор використовує мінімальну заробітну плату на 1 січня відповідного року, категорію гостя та кількість розрахункових діб. Для 2026 року розрахункова база становить 8 647 грн. Результат є інформаційним і не визначає автоматично право на звільнення.',
    seoBlock:{
      title:'Туристичний збір в Івано-Франківську у 2026 році: ставки й розрахунок',
      intro:'Для готелю, апартаментів чи іншого місця тимчасового проживання в Івано-Франківську застосовується ставка Івано-Франківської міської територіальної громади. Рішення №140-43 від 20 червня 2024 року встановлює 0,3% для внутрішнього та 1% для в’їзного туризму. Зведена форма ДПС на 2026 рік підтверджує ці ставки для громади з кодом КАТОТТГ UA26040190000081578.',
      sections:[
        {heading:'Які ставки туристичного збору діють в Івано-Франківську',paragraphs:['Рішення Івано-Франківської міської ради №140-43 встановлює ставку 0,3% для внутрішнього туризму та 1% для в’їзного туризму. Вони визначаються як відсоток мінімальної заробітної плати, встановленої на 1 січня звітного року, за одну особу за одну добу тимчасового розміщення. Форма ДПС у наборі ставок на 2026 рік показує ті самі відсотки для Івано-Франківської міської громади.']},
        {heading:'Як розрахувати суму збору за проживання',paragraphs:['Для попереднього розрахунку оберіть категорію туризму, кількість гостей і кількість розрахункових діб. У 2026 році мінімальна заробітна плата на 1 січня становить 8 647 грн, тому орієнтовна сума за одну особу за одну добу становить 25,94 грн для внутрішнього та 86,47 грн для в’їзного туризму. Калькулятор окремо підсумовує групи гостей і округлює загальну суму до копійок.']},
        {heading:'Як визначити, що місце розміщення належить до цієї громади',paragraphs:['Перевірте адресу об’єкта, а не лише поштове позначення «Івано-Франківськ». У довіднику місто має код КАТОТТГ UA26040190010045761, а Івано-Франківська міська територіальна громада має код UA26040190000081578. Якщо об’єкт розміщений в іншому населеному пункті громади, окремо звірте його адресу та громаду перед використанням розрахунку.']},
        {heading:'Що перевірити готелю перед нарахуванням',paragraphs:['Зіставте дату проживання з періодом дії місцевого рішення, визначте категорію туриста та кількість розрахункових діб за фактичними даними поселення. Стаття 268 Податкового кодексу передбачає умови справляння і випадки, коли збір не справляється; калькулятор не встановлює статус гостя та не перевіряє підтвердні документи. Для обліку, звітності й конкретного випадку використовуйте текст рішення, Податковий кодекс та актуальні роз’яснення ДПС.']},
        {heading:'Офіційне рішення та дата перевірки ставок',paragraphs:['Ставки звірено з рішенням Івано-Франківської міської ради №140-43 від 20.06.2024 та підписаною формою громади в офіційному наборі ДПС на 2026 рік. Рішення встановлює застосування ставок з 01.01.2025 і позначене міською радою як чинне. У формі ДПС зазначені код громади та ставки 0,30% і 1,00%. Джерела наведені поруч із калькулятором; довідка перевірена 14 жовтня 2026 року.']},
      ],
    },
  },
  kolomyya:{
    title:'Туристичний збір у Коломиї у 2026 році: ставки та калькулятор',
    description:'Туристичний збір у Коломиї у 2026 році: 0,5% для внутрішнього й в’їзного туризму. Рішення громади, дані ДПС і калькулятор за гостями та добами.',
    uniqueContent:'Для міста Коломия ставка туристичного збору визначається рішенням Коломийської міської ради для всієї Коломийської територіальної громади. Положення, затверджене рішенням №781-16/2021, встановлює 0,5% для внутрішнього та 0,5% для в’їзного туризму від мінімальної заробітної плати на 1 січня звітного року. У 2026 році законодавча база для прикладів становить 8 647 грн. Калькулятор оцінює суму за кількістю гостей, категорією туризму та розрахункових діб.',
    seoBlock:{
      title:'Туристичний збір у Коломиї у 2026 році: ставка громади та розрахунок',
      intro:'Для міста Коломия застосовується правило Коломийської міської територіальної громади. Чинне Положення встановлює однакову ставку 0,5% для внутрішнього та в’їзного туризму. Рішення визначає базу як мінімальну заробітну плату на 1 січня звітного року за одну особу за кожну добу тимчасового розміщення.',
      sections:[
        {heading:'Яка ставка туристичного збору діє у Коломиї',paragraphs:['Пункт 3.1 Положення про туристичний збір, затвердженого рішенням міської ради №781-16/2021 від 24 червня 2021 року, встановлює 0,5% для внутрішнього і 0,5% для в’їзного туризму. Рішення набрало чинності 1 січня 2022 року. Міська рада застосовує це Положення на території Коломийської громади.']},
        {heading:'Як рахувати суму за одну добу проживання',paragraphs:['У 2026 році мінімальна заробітна плата на 1 січня становить 8 647 грн. За ставки 0,5% сума для однієї особи за одну розрахункову добу дорівнює 43,235 грн до округлення, або 43,24 грн після округлення до копійок. Сума залежить від числа гостей і розрахункових діб. Вартість номера не є базою для множення ставки.']},
        {heading:'Що врахувати готелю та іншому місцю розміщення',paragraphs:['Перед розрахунком перевірте, що адреса об’єкта належить саме до Коломийської міської територіальної громади, і визначте категорію туризму гостя за Податковим кодексом. Положення ради містить перелік випадків, коли особа не є платником збору. Для застосування такого винятку перевіряйте його умови та необхідні документи окремо.']},
        {heading:'Приклад розрахунку для проживання у Коломиї',paragraphs:['Для одного гостя на три розрахункові доби за ставкою 0,5%: 8 647 × 0,5% × 1 × 3 = 129,705 грн, або 129,71 грн після округлення підсумкової суми до копійок. Це інформаційний розрахунок до перевірки кількості розрахункових діб, категорії гостя та можливого звільнення.']},
        {heading:'Які офіційні дані використано',paragraphs:['Ставку взято з Положення Коломийської міської ради №781-16/2021, чинного з 1 січня 2022 року. Офіційна сторінка міськради зі ставками, чинними з 1 січня 2026 року, посилається на це рішення. Форма ДПС за 2025 рік показує такі самі ставки, а бюджетний прогноз, схвалений громадою у 2026 році, називає рішення серед нормативної бази місцевих податків і зборів. Окремої форми ставок ДПС за 2026 рік для Коломиї серед перевірених джерел не знайдено. КАТОТТГ міста й громади наведено окремо, щоб не переносити ставку на інші громади області.']},
      ],
    },
  },
  chernihiv:{
    title:'Туристичний збір у Чернігові у 2026 році: ставки та калькулятор',
    description:'Ставка туристичного збору в Чернігові на 2026 рік становить 0,5% для внутрішнього та в’їзного туризму. Рішення №18/VIII-19 і розрахунок.',
    uniqueContent:'Для Чернігівської міської територіальної громади туристичний збір на 2026 рік становить 0,5% як для внутрішнього, так і для в’їзного туризму. Міськрада вказує рішення №18/VIII-19 та КАТОТТГ громади у своїй таблиці ставок. Калькулятор допомагає попередньо оцінити суму за базою Податкового кодексу, категорією гостя та кількістю розрахункових діб.',
    seoBlock:{title:'Туристичний збір у Чернігові у 2026 році: ставка громади та розрахунок',intro:'У Чернігові на 2026 рік для внутрішнього та в’їзного туризму встановлено однакову ставку 0,5%. Чинні відомості Чернігівська міська рада публікує разом із посиланням на рішення №18/VIII-19 та кодом Чернігівської міської територіальної громади. Нижче пояснюємо базовий розрахунок і дані, які варто звірити перед нарахуванням збору.',sections:[
      {heading:'Ставки туристичного збору у Чернігові на 2026 рік',paragraphs:['Офіційна таблиця Чернігівської міської ради на 2026 рік зазначає 0,5% для внутрішнього та 0,5% для в’їзного туризму. Обидві ставки наведено для Чернігівської міської територіальної громади з кодом КАТОТТГ UA74100390000073425. Рішення ради №18/VIII-19 набрало чинності 1 січня 2023 року.']},
      {heading:'Як розрахувати туристичний збір для проживання у Чернігові',paragraphs:['Для розрахунку за 2026 рік використовується база 8 647 грн, визначена мінімальною зарплатою на 1 січня. За ставки 0,5% попередня сума становить 43,24 грн за одну особу за одну розрахункову добу. Калькулятор множить базу на ставку, кількість гостей кожної категорії та число розрахункових діб, після чого округлює загальну суму до копійок.']},
      {heading:'Перевірка адреси та меж громади',paragraphs:['Сторінка стосується міста Чернігів з кодом КАТОТТГ UA74100390010054825 у складі Чернігівської міської територіальної громади UA74100390000073425. Таблиця ставок міськради на 2026 рік застосовує ставку до громади. Якщо об’єкт розташований в іншому населеному пункті громади, звірте адресу та сферу дії місцевого рішення перед нарахуванням.']},
      {heading:'Що потрібно звірити перед нарахуванням',paragraphs:['Переконайтеся, що адреса місця розміщення належить до Чернігівської міської територіальної громади, а проживання припадає на період дії відповідного рішення. Оберіть правильну категорію туризму та визначте кількість розрахункових діб за правилами статті 268 Податкового кодексу. Калькулятор не перевіряє документи гостя й автоматично не підтверджує право на звільнення від збору.']},
      {heading:'Офіційні джерела туристичного збору в Чернігові',paragraphs:['Основне місцеве рішення — акт Чернігівської міської ради №18/VIII-19 від 30 червня 2022 року. Для ставки на 2026 рік звіряйте окрему таблицю, яку рада оприлюднила на офіційній сторінці туристичного збору. У документах зазначені дата застосування 1 січня 2023 року, код громади та однакові ставки для внутрішнього й в’їзного туризму.']},
    ]},
  },
  rivne:{
    title:'Туристичний збір у Рівному у 2026 році: ставки та калькулятор',
    description:'Ставки туристичного збору в Рівному на 2026 рік: 0,25% для внутрішнього та 1% для в’їзного туризму. Рішення №783, період дії та розрахунок.',
    uniqueContent:'Для міста Рівне рішення міської ради №783 встановлює туристичний збір за кожну розрахункову добу проживання. Підписана форма ДПС на 2026 рік підтверджує ставки 0,25% для внутрішнього та 1% для в’їзного туризму, а також коди Рівненської міської громади й самого міста. Калькулятор застосовує ці ставки до бази, визначеної Податковим кодексом, та кількості гостей і розрахункових діб.',
    seoBlock:{title:'Туристичний збір у Рівному у 2026 році: ставки, база та приклад розрахунку',intro:'Туристичний збір у місті Рівне регулює рішення Рівненської міської ради №783 від 24 червня 2021 року. Для 2026 року підписана форма ДПС підтверджує 0,25% для внутрішнього та 1% для в’їзного туризму. Ця сторінка пояснює, як визначити попередню суму за кількістю гостей і розрахункових діб.',sections:[
      {heading:'Ставки туристичного збору в Рівному на 2026 рік',paragraphs:['Рішення №783 встановлює ставку 0,25% для внутрішнього туризму та 1,0% для в’їзного туризму за кожну добу тимчасового розміщення. Форма ДПС на 2026 рік повторює ці ставки для Рівненської міської територіальної громади та міста Рівне. Відсотки застосовують до бази туристичного збору, визначеної статтею 268 Податкового кодексу, а не до повної ціни номера.']},
      {heading:'Як працює калькулятор туристичного збору',paragraphs:['Для попередньої оцінки оберіть категорію туризму, введіть кількість гостей та розрахункових діб. Калькулятор множить базу 8 647 грн, установлену для розрахунку у 2026 році, на ставку громади, кількість гостей і діб. За однієї особи на одну добу це орієнтовно 21,62 грн для внутрішнього туризму та 86,47 грн для в’їзного. Сума за кілька гостей округлюється до копійок після підсумкового розрахунку.']},
      {heading:'Приклад розрахунку для проживання у Рівному',paragraphs:['Якщо один гість внутрішнього туризму проживає дві розрахункові доби, приклад суми такий: 8 647 × 0,25% × 1 гість × 2 доби = 43,235 грн, тобто 43,24 грн після округлення до копійок. Для двох гостей в’їзного туризму на такий самий період: 8 647 × 1% × 2 × 2 = 345,88 грн. Це інформаційна оцінка до перевірки категорії гостя й можливих законних звільнень.']},
      {heading:'Період дії рішення та межі розрахунку',paragraphs:['Рішення №783 набрало чинності 1 січня 2022 року. У формі ДПС на 2026 рік зазначено ту саму дату застосування ставок, а для Рівненської громади повторено базове рішення №783. Адресу об’єкта потрібно зіставити саме з територією Рівненської міської громади. Калькулятор не визначає право на звільнення від збору й не замінює перевірку первинних документів податковим агентом.']},
      {heading:'Офіційні джерела туристичного збору в Рівному',paragraphs:['Першоджерело ставок — рішення Рівненської міської ради №783 від 24 червня 2021 року. Його положення встановлює ставки та дату набрання чинності, а підписана форма №6 ДПС на 2026 рік підтверджує ставки й територіальні коди Рівненської громади та міста. Посилання на обидва документи наведено на цій сторінці.']},
    ]},
  },
  zaporizhzhya:{
    title:'Туристичний збір у Запоріжжі у 2026 році: ставки за ціною проживання',
    description:'Ставки туристичного збору в Запоріжжі на 2026 рік залежать від ціни проживання на одну особу за добу. Рішення №39, офіційні джерела та калькулятор.',
    uniqueContent:'У Запоріжжі туристичний збір розраховується за рішенням міської ради №39 і залежить від вартості проживання однієї особи за добу. Форма ДПС, підписана міською радою для 2026 року, підтверджує окремі рівні для внутрішнього та в’їзного туризму. Калькулятор застосовує обрану ціну, категорію гостя, кількість гостей та розрахункових діб.',
    seoBlock:{title:'Туристичний збір у Запоріжжі у 2026 році: ставки та розрахунок',intro:'У місті Запоріжжя місцева ставка туристичного збору залежить від ціни тимчасового розміщення однієї особи за одну добу. Для розрахунку оберіть категорію туризму, вкажіть ціну за особу й добу, кількість гостей та розрахункових діб. Ставки підтверджені рішенням Запорізької міської ради №39 та її підписаною формою ДПС на 2026 рік.',sections:[
      {heading:'Які ставки туристичного збору встановлено у Запоріжжі',paragraphs:['Для внутрішнього туризму ставка становить 0,05% за вартістю до 300 грн включно, 0,25% за вартістю понад 300 грн і до 600 грн включно та 0,5% за вартістю понад 600 грн за особу за добу. Для в’їзного туризму діє 0,5% за вартості до 300 грн включно та 1,5% понад 300 грн. Це відсотки від бази, визначеної Податковим кодексом, а не від ціни номера.']},
      {heading:'Як розрахувати туристичний збір за проживання',paragraphs:['Спершу визначте ціну проживання однієї особи за одну добу та виберіть відповідний тарифний рівень. Потім у калькуляторі вкажіть кількість гостей внутрішнього й в’їзного туризму та число розрахункових діб. Для 2026 року законодавча база становить 8 647 грн. Наприклад, один гість внутрішнього туризму за ціни 450 грн за добу протягом двох розрахункових діб: 8 647 × 0,25% × 2 = 43,24 грн.']},
      {heading:'Що відбувається на межі 300 і 600 гривень',paragraphs:['У формі ДПС для Запорізької громади перший внутрішній діапазон включає рівно 300 грн, наступний починається понад 300 грн і включає 600 грн, а останній починається понад 600 грн. Тому для ціни рівно 300 грн застосовується перший діапазон, а рівно 600 грн належить до другого. Для в’їзного туризму рівно 300 грн також входить до діапазону 0,5%; ставка 1,5% починається лише для ціни понад 300 грн.']},
      {heading:'Що перевірити перед нарахуванням збору',paragraphs:['Звірте адресу місця розміщення з територією Запорізької міської громади, ціну саме на одну особу за добу та категорію туризму гостя. Розрахункова доба визначається за правилами статті 268 Податкового кодексу як 24 години між розрахунковими годинами об’єкта. Калькулятор дає попередню оцінку та не перевіряє документи для можливого звільнення.']},
      {heading:'Офіційні документи щодо ставок у Запоріжжі',paragraphs:['Запорізька міська рада оприлюднила рішення №39 від 30 січня 2019 року та положення про туристичний збір. У формі ДПС на 2026 рік рада повторно вказала це базове рішення, територіальну громаду, місто та цінові діапазони. У переліку місцевих податків ради рішення №39 зазначене як документ щодо туристичного збору. Джерела перевірено 14 жовтня 2026 року.']},
    ]},
  },
  ternopil:{
    title:'Туристичний збір у Тернополі у 2026 році: ставки та калькулятор',
    description:'Ставки туристичного збору в Тернополі на 2026 рік залежать від вартості проживання на особу за добу. Пояснення рішення ради й калькулятор.',
    uniqueContent:'У Тернопільській міській територіальній громаді туристичний збір залежить від ціни проживання однієї особи за добу. Для внутрішнього туризму застосовуються 0,15% або 0,25% мінімальної зарплати, для в’їзного 0,3% або 0,5%. Поріг 320 грн діє з 1 січня 2026 року. Значення рівно 320 грн має перетин у тексті рішення, тому калькулятор просить окремо перевірити цей випадок.',
    seoBlock:{title:'Туристичний збір у Тернополі у 2026 році: поріг 320 грн і розрахунок',intro:'Для міста Тернопіль ставка туристичного збору залежить від вартості проживання однієї особи за одну добу. Для правильного розрахунку потрібно вказати категорію туризму, ціну проживання на особу й кількість розрахункових діб.',sections:[
      {heading:'Ставки туристичного збору в Тернополі у 2026 році',paragraphs:['Рішення Тернопільської міської ради №7/35/5, зі змінами за рішенням №8/52/08, встановлює тарифні діапазони. Якщо проживання коштує менше 320 грн на особу за добу, ставка становить 0,15% для внутрішнього та 0,3% для в’їзного туризму. Якщо вартість перевищує 320 грн, ставки становлять 0,25% та 0,5% відповідно. Поріг 320 грн застосовується з 1 січня 2026 року.']},
      {heading:'Як працює калькулятор туристичного збору у Тернополі',paragraphs:['Вкажіть дату заїзду, розрахункові доби, кількість гостей кожної категорії та вартість проживання на одну особу за добу. Калькулятор застосує відповідний тарифний діапазон до мінімальної зарплати на 1 січня 2026 року, 8 647 грн. Значення рівно 320 грн система не оцінює автоматично, оскільки формулювання рішення «до 320 грн» і «320 грн і вище» перетинаються на цій межі.']},
      {heading:'Що перевірити готелю перед нарахуванням збору',paragraphs:['Переконайтеся, що місце розміщення належить до Тернопільської міської територіальної громади, а для порівняння з порогом використана вартість на одну особу за одну добу. Окремо звірте категорію туризму та можливі законні підстави для звільнення. Калькулятор дає попередній інформаційний результат і не встановлює право на пільгу.']},
    ]},
  },
  sumy:{
    title:'Туристичний збір у Сумах у 2026 році: ставки та калькулятор',
    description:'Туристичний збір у Сумах у 2026 році: ставки громади, рішення №1238-МР і калькулятор попередньої суми за гостями та добами.',
    uniqueContent:'У Сумській міській територіальній громаді ставка туристичного збору на 2026 рік становить 0,5% для внутрішнього та 0,5% для в’їзного туризму. Ставки підтверджені рішенням №1238-МР, офіційною сторінкою Департаменту фінансів міської ради та формою ДПС. Калькулятор використовує ці ставки разом із кількістю гостей і розрахункових діб.',
    seoBlock:{title:'Туристичний збір у Сумах у 2026 році: рішення громади та розрахунок',intro:'У цій довідці про туристичний збір для міста Суми наведено місцеве рішення Сумської міської територіальної громади. На 2026 рік офіційні джерела підтверджують ставку 0,5% для внутрішнього та в’їзного туризму; сторінка показує рішення, період і калькулятор попередньої суми.',sections:[{heading:'Ставки туристичного збору в Сумах на 2026 рік',paragraphs:['Рішення Сумської міської ради №1238-МР від 14 липня 2021 року застосовується з 1 січня 2022 року. Офіційна сторінка фінансового департаменту громади й форма ДПС підтверджують для 2026 року ставки 0,5% для внутрішнього та 0,5% для в’їзного туризму. Розмір у гривнях залежить від мінімальної заробітної плати на 1 січня року та кількості розрахункових діб.']},{heading:'Як скористатися калькулятором для проживання у Сумах',paragraphs:['Вкажіть дати проживання, кількість розрахункових діб та окремо гостей внутрішнього й в’їзного туризму. Калькулятор застосує ставку Сумської громади й покаже інформаційну суму до врахування можливого звільнення. Стаття 268 Податкового кодексу визначає розрахункову добу як 24 години між розрахунковими годинами об’єкта.']},{heading:'Що перевірити перед нарахуванням',paragraphs:['Переконайтеся, що адреса об’єкта розміщення належить до Сумської міської територіальної громади й дата проживання входить до періоду дії місцевого рішення. Окремо перевірте категорію гостя та документи, якщо може застосовуватися передбачене законом звільнення. Для обліку використовуйте фактичні дані проживання та першоджерела громади.']} ]}
  },
  vinnytsya:{
    title:'Туристичний збір у Вінниці у 2026 році: ставки та калькулятор',
    description:'Туристичний збір у Вінниці у 2026 році: 0,5% для внутрішнього та 1,5% для в’їзного туризму. Рішення громади, період дії та калькулятор.',
    uniqueContent:'У Вінницькій міській територіальній громаді на 2026 рік підтверджено ставки туристичного збору 0,5% для внутрішнього та 1,5% для в’їзного туризму. Рішення міської ради №469 і оприлюднені громадою ставки підтверджують застосування правил у 2026 році. Рішення №3535 встановлює ставки для наступного періоду з 2027 року.',
    seoBlock:{title:'Туристичний збір у Вінниці у 2026 році: місцеві ставки й розрахунок',intro:'У цій довідці про туристичний збір для міста Вінниця наведено рішення Вінницької міської територіальної громади. У 2026 році ставки становлять 0,5% для внутрішнього та 1,5% для в’їзного туризму; калькулятор рахує попередню суму за гостями й розрахунковими добами.',sections:[{heading:'Ставки туристичного збору у Вінниці на 2026 рік',paragraphs:['Рішення Вінницької міської ради №469 від 25 червня 2021 року та актуальна сторінка місцевих податків підтверджують на 2026 рік ставку 0,5% для внутрішнього туризму та 1,5% для в’їзного. Рішення №3535 передбачає ті самі відсотки для періоду, що починається 1 січня 2027 року. Не переносіть місцеві ставки на інші громади Вінницької області.']},{heading:'Розрахунок туристичного збору для гостей у Вінниці',paragraphs:['Для попередньої оцінки оберіть дати проживання, кількість гостей за кожною категорією туризму й розрахункові доби. Калькулятор застосовує вінницькі ставки до бази, визначеної статтею 268 Податкового кодексу, і показує суму до перевірки можливих законних звільнень. Розрахункова доба дорівнює 24 годинам між установленими об’єктом розрахунковими годинами.']},{heading:'Перевірка громади та строку дії рішення',paragraphs:['Перед нарахуванням звірте адресу об’єкта з Вінницькою міською територіальною громадою та перевірте період проживання: для цієї сторінки правило застосовується протягом 2026 року. Рішення №3535 описує наступний період з 2027 року. Для звітності спирайтеся на фактичні дані, текст рішень та актуальні вимоги законодавства.']} ]}
  },
  pivdenne:{
    title:'Туристичний збір у Південному у 2026 році: ставки та калькулятор',
    description:'Туристичний збір у Південному у 2026 році: 0,5% для внутрішнього й в’їзного туризму. Форма ДПС, період рішення та калькулятор.',
    uniqueContent:'У Південнівській міській територіальній громаді туристичний збір на 2026 рік становить 0,5% для внутрішнього та 0,5% для в’їзного туризму. Ставки та період дії рішення №422-VIII підтверджені офіційною формою ДПС і місцевим рішенням №2626-VIII, яке встановлює новий період з 2027 року.',
    seoBlock:{title:'Туристичний збір у Південному у 2026 році: ставки громади й розрахунок',intro:'У цій довідці про туристичний збір для міста Південне наведено рішення Південнівської міської територіальної громади. На 2026 рік підтверджено ставку 0,5% для внутрішнього й в’їзного туризму; калькулятор оцінює суму за введеними гостями та розрахунковими добами.',sections:[{heading:'Ставки туристичного збору у Південному на 2026 рік',paragraphs:['Рішення №422-VIII від 17 червня 2021 року встановило ставки, що застосовуються з 1 січня 2022 року. Офіційна форма ДПС підтверджує для Південнівської міської територіальної громади 0,5% для внутрішнього та 0,5% для в’їзного туризму у 2026 році. Рішення ради №2626-VIII встановлює ті самі ставки з 1 січня 2027 року й припиняє дію попереднього рішення з цієї дати.']},{heading:'Як порахувати збір за проживання у Південному',paragraphs:['Введіть період проживання, кількість розрахункових діб і число гостей внутрішнього та в’їзного туризму. Калькулятор використовує підтверджену ставку Південнівської громади й показує попередню суму за правилами статті 268 Податкового кодексу. Розрахункова доба становить 24 години між розрахунковими годинами закладу.']},{heading:'Що звірити з місцевими документами',paragraphs:['Перевірте, що адреса об’єкта належить до Південнівської міської територіальної громади, а дата проживання припадає на 2026 рік. З 1 січня 2027 року застосовується нове рішення №2626-VIII. Можливі звільнення перевіряйте окремо за статтею 268 та підтвердними документами; калькулятор їх автоматично не визначає.']} ]}
  },
};

const reviewedCityCalculationExamples={
  berehove:{heading:'Приклад: двоє гостей у Береговому на дві розрахункові доби',paragraphs:['За бази 8 647 грн і ставки 0,25% для кожного виду туризму: 8 647 × 0,25% × 2 гості × 2 доби = 86,47 грн. Це інформаційний приклад до перевірки фактичних даних проживання та можливого звільнення гостя.']},
  uzhhorod:{heading:'Приклад: проживання двох гостей в Ужгороді протягом двох діб',paragraphs:['За бази 8 647 грн і універсальної ставки 0,50% для внутрішнього туризму сума становить 8 647 × 0,50% × 2 гості × 2 доби = 172,94 грн. Для двох гостей в’їзного туризму за ставкою 1,00% приклад становить 345,88 грн. Розрахунок використовує універсальний рядок підписаної форми ДПС; розбіжність з Excel і нульовими деталізованими рядками пояснена вище.']},
  slavsko:{heading:'Приклад: двоє гостей у Славську на дві розрахункові доби',paragraphs:['За бази 8 647 грн і ставки 0,20% для внутрішнього та в’їзного туризму: 8 647 × 0,20% × 2 гості × 2 доби = 69,18 грн. Сума розрахована за універсальним рядком форми №6 ДПС. Перевірте фактичні дати проживання та можливі законні звільнення окремо.']},
  cherkasy:{heading:'Приклад: двоє гостей внутрішнього туризму на дві доби',paragraphs:['За бази 8 647 грн, ставки 0,50%, двох гостей і двох розрахункових діб: 8 647 × 0,50% × 2 × 2 = 172,94 грн. Такий самий сценарій для двох гостей в’їзного туризму за ставкою 5,00% становить 1 729,40 грн. Обидва приклади наведені до перевірки можливого звільнення від сплати за конкретними документами.']},
  lviv:{heading:'Приклад попереднього розрахунку для Львова',paragraphs:['За ціни проживання 700 грн на одну особу за добу підписана форма ДПС указує внутрішню ставку 0,30%. Для двох гостей на дві розрахункові доби: 8 647 × 0,30% × 2 × 2 = 103,764 грн, або 103,76 грн після округлення. На межах 750 грн і 1 200 грн калькулятор не підбирає ставку автоматично.']},
  chernivtsi:{heading:'Приклад розрахунку для трьох гостей у Чернівцях',paragraphs:['За бази 8 647 грн і ставки 0,30% для трьох гостей на дві розрахункові доби: 8 647 × 0,30% × 3 × 2 = 155,646 грн, або 155,65 грн після округлення загальної суми до копійок. Такий самий відсоток у формі ДПС вказано для внутрішнього та в’їзного туризму.']},
  'ivano-frankivsk':{heading:'Приклад: один гість внутрішнього туризму на три доби',paragraphs:['За бази 8 647 грн і ставки 0,3% приклад для одного гостя внутрішнього туризму на три розрахункові доби: 8 647 × 0,3% × 1 × 3 = 77,823 грн, або 77,82 грн після округлення підсумку до копійок. Калькулятор відтворює цей результат. Можливе звільнення перевірте окремо за правилами й документами.']},
  kolomyya:{heading:'Приклад: один гість у Коломиї протягом трьох діб',paragraphs:['За ставкою 0,5% для одного гостя внутрішнього або в’їзного туризму на три розрахункові доби: 8 647 × 0,5% × 1 × 3 = 129,705 грн, або 129,71 грн після округлення підсумку до копійок. Перевірте категорію гостя, кількість розрахункових діб і можливі законні звільнення окремо.']},
  chernihiv:{heading:'Приклад: два гості внутрішнього туризму на три доби',paragraphs:['За ставкою Чернігівської громади 0,5% розрахунок для двох гостей на три розрахункові доби: 8 647 × 0,5% × 2 × 3 = 259,41 грн. Ставка така сама для внутрішнього та в’їзного туризму. Можливі законні звільнення потрібно перевірити окремо.']},
  rivne:{heading:'Приклад: двоє гостей внутрішнього туризму на три доби',paragraphs:['За ставки Рівненської громади 0,25% розрахунок для двох гостей на три розрахункові доби такий: 8 647 × 0,25% × 2 × 3 = 129,705 грн, або 129,71 грн після округлення до копійок. Це інформаційний приклад за базою 2026 року; можливі законні звільнення перевіряють окремо.']},
  zaporizhzhya:{heading:'Приклад: одна особа за ціни 450 грн на дві доби',paragraphs:['За ціни розміщення 450 грн на одну особу за добу застосовується внутрішня ставка 0,25%. Для одного гостя на дві розрахункові доби: 8 647 × 0,25% × 1 × 2 = 43,235 грн, тобто 43,24 грн після округлення до копійок.']},
  ternopil:{heading:'Приклад розрахунку нижче порогу 320 грн',paragraphs:['Якщо проживання однієї особи коштує 300 грн за добу, для внутрішнього туризму ставка становить 0,15%. За бази 8 647 грн збір за одну особу на дві розрахункові доби становить 8 647 × 0,15% × 2 = 25,941 грн, або 25,94 грн після округлення до копійок. Значення 320 грн потребує окремої звірки з радою через перетин формулювань рішення.']},
  sumy:{heading:'Приклад розрахунку для чотирьох діб у Сумах',paragraphs:['Для одного гостя внутрішнього туризму на чотири розрахункові доби: 8 647 × 0,5% × 1 × 4 = 172,94 грн. Тут використано базу 2026 року й ставку Сумської громади. Якщо є підстава для звільнення, її слід перевірити окремо за документами гостя та чинними правилами.']},
  vinnytsya:{heading:'Приклад: двоє гостей в’їзного туризму на три доби',paragraphs:['За ставки Вінницької громади 1,5% розрахунок для двох гостей на три розрахункові доби такий: 8 647 × 1,5% × 2 × 3 = 778,23 грн. Це інформаційний приклад за базою 2026 року, до перевірки можливих законних звільнень.']},
  pivdenne:{heading:'Приклад для групи гостей у Південному',paragraphs:['Для трьох гостей внутрішнього туризму на чотири розрахункові доби: 8 647 × 0,5% × 3 × 4 = 518,82 грн. Приклад використовує ставку громади, чинну до 31 грудня 2026 року. Для проживання з 1 січня 2027 року перевірте нове рішення №2626-VIII.']},
};

const researchedCityDrafts={
  lviv:{
    title:'Туристичний збір у Львові у 2026 році: ставки за ціною проживання',
    description:'Офіційна форма ДПС для Львівської громади на 2026 рік: ставки 0,3%, 0,4%, 0,5% та 1%, пороги ціни, розрахунок і неоднозначні межі.',
    uniqueContent:'Підписана Львівською міською радою форма №6 ДПС для 2026 року пов’язує рішення №6373 з кодом громади та застосуванням ставок від 1 січня. Внутрішня ставка залежить від ціни проживання однієї особи за добу: у формі наведено рівні 0,30%, 0,40% і 0,50%; для в’їзного туризму вказано 1,00%. На межах 750 грн і 1 200 грн формулювання перетинаються, тому калькулятор не вгадує ставку й просить уточнення. Міський рядок стосується Львова з окремим кодом КАТОТТГ, а не автоматично кожного населеного пункту громади.',
    seoBlock:{title:'Туристичний збір у Львові у 2026 році: тарифні рівні та розрахунок',intro:'Для Львівської міської територіальної громади офіційна форма ставок туристичного збору на 2026 рік пов’язує розмір внутрішньої ставки з вартістю проживання однієї особи за добу. Форма вказує рішення №6373 від 12 червня 2025 року та застосування з 1 січня 2026 року. Для в’їзного туризму в усіх трьох цінових рівнях зазначено ставку 1%.',sections:[
      {heading:'Ставки туристичного збору у Львові за ціновими рівнями',paragraphs:['Підписана офіційна форма ДПС зазначає для внутрішнього туризму 0,30% для вартості до 750 грн включно, 0,40% для діапазону від 750 до 1 200 грн включно та 0,50% для вартості від 1 200 грн. Для в’їзного туризму в кожному рядку наведено 1,00%. Це відсотки від законодавчої бази туристичного збору, а не від повної ціни номера. Діапазони не слід переносити на інші громади Львівської області.']},
      {heading:'Як ціна проживання змінює попередній розрахунок',paragraphs:['Для 2026 року розрахункова база дорівнює мінімальній заробітній платі на 1 січня, 8 647 грн. За внутрішньої ставки 0,30% один гість за одну добу дає 25,94 грн після округлення; за ставки 0,40% це 34,59 грн, а за 0,50% це 43,24 грн. Для в’їзного туризму ставка 1,00% відповідає 86,47 грн за одну особу за одну розрахункову добу. Загальну суму обчислюють з урахуванням категорій гостей і кількості розрахункових діб.']},
      {heading:'Що означають межі 750 і 1 200 гривень',paragraphs:['В офіційній формі перший рівень включає ціну до 750 грн, а наступний починається від 750 грн; подібний перетин є і на 1 200 грн. Тому ставка для ціни рівно 750 або 1 200 грн не визначається однозначно лише за формою. Калькулятор має зупиняти розрахунок на цих двох точках, доки оригінальний текст рішення не підтвердить точну межу. Для ціни на копійку нижче або вище використовують відповідний неперекривний діапазон.']},
      {heading:'Які дані перевірити готелю перед нарахуванням',paragraphs:['Спершу звірте адресу об’єкта з Львівською міською територіальною громадою та визначте категорію туризму гостя за статтею 268 Податкового кодексу. Для цінової ставки потрібна вартість тимчасового розміщення однієї особи за одну добу, тож збережіть первинні дані бронювання й тарифу. Період дії правила за формою починається 1 січня 2026 року. Можливі пільги калькулятор не підтверджує автоматично, їх перевіряє податковий агент за документами.']},
      {heading:'Джерело ставок і межі розрахунку',paragraphs:['Підписана форма №6 ДПС, подана Львівською міською радою, пов’язує рішення №6373 з громадою та ставками, що застосовуються з 1 січня 2026 року. Повний текст рішення не вдалося отримати для перевірки меж включення. Тому калькулятор рахує за підтвердженими рівнями, але зупиняється на ціні рівно 750 грн і 1 200 грн та пояснює, чому потрібна додаткова перевірка.']},
    ]},
  },
};

const reviewedPlaces=workbookTouristTaxPlaces.map(place=>{
  const content=publishableReviewedCityContent[place.slug]??(place.slug==='lviv'?researchedCityDrafts.lviv:null);
  if(!content){
    const researchedDraft=researchedCityDrafts[place.slug];
    return researchedDraft?{...place,editorial:{...place.editorial,...researchedDraft}}:place;
  }
  return {
    ...place,
    ...(place.slug==='ivano-frankivsk'?{nameLocative:'Івано-Франківську'}:{}),
    ...(place.slug==='bar'?{nameLocative:'Барі'}:{}),
    ...(place.slug==='zaporizhzhya'?{nameLocative:'Запоріжжі'}:{}),
    ...(place.slug==='rivne'?{nameLocative:'Рівному'}:{}),
    ...(place.slug==='chernihiv'?{nameLocative:'Чернігові'}:{}),
    ...(place.slug==='kolomyya'?{nameLocative:'Коломиї'}:{}),
    ...(place.slug==='chernivtsi'?{nameLocative:'Чернівцях'}:{}),
    ...(place.slug==='lviv'?{nameLocative:'Львові'}:{}),
    ...(place.slug==='cherkasy'?{nameLocative:'Черкасах'}:{}),
    ...(place.slug==='berehove'?{nameLocative:'Береговому'}:{}),
    ...(place.slug==='uzhhorod'?{nameLocative:'Ужгороді'}:{}),
    ...(place.slug==='slavsko'?{nameLocative:'Славську'}:{}),
    geoStatus:'ELIGIBLE',
    geoStatusReason:place.slug==='lviv'?'Місто Львів зіставлено з кодом КАТОТТГ міста й кодом Львівської міської громади у підписаній формі №6 ДПС на 2026 рік; дані КАТОТТГ імпортовані окремо.':place.slug==='cherkasy'?'Черкаси й Черкаську міську громаду зіставлено за офіційним КАТОТТГ; форма №6 ДПС окремо називає код громади, а місцева ставка на 2026 рік підтверджена формою ДПС і бюджетним прогнозом міськради.':'Місце зіставлено з офіційним КАТОТТГ, громаду й чинне місцеве рішення туристичного збору підтверджено офіційними джерелами. Стаття 268 ПКУ не встановлює перевірку наказу №376 як умову туристичного збору.',
    indexable:true,
    readiness:{placeVerified:true,safetyEligible:true,calculatorQaPassed:true,uniqueContentApproved:true,seoQaPassed:true},
    editorial:{...place.editorial,...content,seoBlock:{...content.seoBlock,sections:[...content.seoBlock.sections,reviewedCityCalculationExamples[place.slug]]}},
  };
});

export const touristTaxPlaces = Object.freeze([...verifiedTouristTaxPlaces,...reviewedPlaces]);

export function findTouristTaxPlace(query) {
  const normalized = String(query ?? '').trim().toLocaleLowerCase('uk-UA');
  if (!normalized) return [];
  return touristTaxPlaces.filter(place => place.name.toLocaleLowerCase('uk-UA').includes(normalized));
}

export function getTouristTaxPlace(slug) {
  return touristTaxPlaces.find(place => place.slug === slug) ?? null;
}

export function getTouristTaxCommunity(slug) {
  return touristTaxCommunities.find(community => community.slug === slug) ?? null;
}

export function getTouristTaxRule(place, communities=touristTaxCommunities) {
  return communities.find(community=>community.slug===place?.communitySlug)?.taxRule ?? null;
}

export function touristTaxCityRoutes() {
  return touristTaxPlaces.filter(place=>canIndexTouristTaxPlace(place)).map(place=>place.route);
}

export function canCalculateTouristTaxPlace(place, communities=touristTaxCommunities) {
  const rule=getTouristTaxRule(place,communities);
  const community=communities.find(item=>item.slug===place?.communitySlug);
  return Boolean(place&&isTouristTaxPlacePublished(place.slug)&&community?.katottgCode&&/^UA[A-Z0-9]{17}$/.test(community.katottgCode)&&place.geoStatus==='ELIGIBLE'&&rule?.status==='VERIFIED'&&rule?.sourceUrl&&rule?.effectiveFrom&&rule?.checkedAt&&place.readiness?.placeVerified&&place.readiness?.safetyEligible&&place.readiness?.calculatorQaPassed);
}

export function canSearchTouristTaxPlace(place, communities=touristTaxCommunities) {
  return Boolean(place&&place.slug&&place.name&&place.region&&place.geoStatus!=='EXCLUDED'&&communities.some(item=>item.slug===place.communitySlug));
}

export function hasPlaceSeoBlock(place) {
  const block=place?.editorial?.seoBlock;
  if(!block||typeof block.title!=='string'||!block.title.trim()||typeof block.intro!=='string'||!block.intro.includes(place.name)||block.intro.trim().length<100||!Array.isArray(block.sections)||block.sections.length<2)return false;
  return block.sections.every(section=>typeof section.heading==='string'&&section.heading.trim().length>=12&&Array.isArray(section.paragraphs)&&section.paragraphs.length>0&&section.paragraphs.every(paragraph=>typeof paragraph==='string'&&paragraph.trim().length>=100));
}

export function canIndexTouristTaxPlace(place, communities=touristTaxCommunities) {
  return Boolean(place&&place.indexable===true&&isTouristTaxPlacePublished(place.slug)&&canSearchTouristTaxPlace(place,communities)&&canCalculateTouristTaxPlace(place,communities)&&hasPlaceSeoBlock(place)&&place.readiness?.uniqueContentApproved&&place.readiness?.seoQaPassed);
}

// Backwards-compatible name for sitemap callers. Indexation has stricter gates than calculation.
export function isTouristTaxPlaceReady(place) {
  return canIndexTouristTaxPlace(place);
}

export function validateTouristTaxPlaces(places=touristTaxPlaces,communities=touristTaxCommunities){
  const errors=[],warnings=[],slugs=new Set(),settlementCodes=new Set();
  const communitySlugs=new Set(),communityCodes=new Set();
  const release=validateTouristTaxReleasePlan(new Set(places.map(place=>place.slug)));
  errors.push(...release.errors);
  const geoStates=new Set(['ELIGIBLE','EXCLUDED','REVIEW_REQUIRED']);
  const ruleStates=new Set(['UNKNOWN','SECONDARY_SOURCE_ONLY','COUNCIL_ACT_FOUND','LEGAL_REVIEW_REQUIRED','VERIFIED','STALE','CONFLICT']);
  for(const community of communities){
    if(!community.slug||communitySlugs.has(community.slug))errors.push(`duplicate or missing community slug: ${community.slug||'(empty)'}`);else communitySlugs.add(community.slug);
    if(!community.name)errors.push(`missing community name: ${community.slug}`);
    if(community.katottgCode){if(!/^UA[A-Z0-9]{17}$/.test(community.katottgCode))errors.push(`invalid community code format: ${community.slug}`);if(communityCodes.has(community.katottgCode))errors.push(`duplicate community code: ${community.katottgCode}`);communityCodes.add(community.katottgCode);}
    const rule=community.taxRule;
    if(!rule||!ruleStates.has(rule.status))errors.push(`missing or invalid tax rule state: ${community.slug}`);
    if(rule?.status==='VERIFIED'){
      const flatRates=rule.rates&&Number.isFinite(rule.rates.domestic)&&Number.isFinite(rule.rates.inbound);
      const thresholdSchedule=rule.rateSchedule&&Number.isFinite(rule.rateSchedule.thresholdUahPerPersonPerDay)&&['domestic','inbound'].every(category=>Array.isArray(rule.rateSchedule[category])&&rule.rateSchedule[category].some(tier=>['lt','gt'].includes(tier.operator)&&Number.isFinite(tier.ratePercent)&&tier.ratePercent>0));
      const bandSchedule=Array.isArray(rule.rateSchedule?.bands)&&rule.rateSchedule.bands.length>=2&&rule.rateSchedule.bands.every(band=>Number.isFinite(band.domesticRatePercent)&&band.domesticRatePercent>0&&Number.isFinite(band.inboundRatePercent)&&band.inboundRatePercent>0&&(['minPriceUahPerPersonPerDay','minPriceExclusiveUahPerPersonPerDay','maxPriceUahPerPersonPerDay'].some(key=>Number.isFinite(band[key]))));
      const schedule=thresholdSchedule||bandSchedule;
      if(!community.katottgCode||!rule.sourceUrl||!rule.effectiveFrom||!rule.checkedAt||!rule.verificationBasis||(!flatRates&&!schedule))errors.push(`verified community rule is missing code/source/dates/verification basis/flat rates or supported schedule: ${community.slug}`);
    }
  }
  for(const place of places){
    if(!place.slug||slugs.has(place.slug))errors.push(`duplicate or missing slug: ${place.slug||'(empty)'}`);else slugs.add(place.slug);
    if(!place.name||!place.region||(place.geoStatus==='ELIGIBLE'&&!place.district))errors.push(`missing settlement labels: ${place.slug}`);
    if(!geoStates.has(place.geoStatus))errors.push(`invalid geography state: ${place.slug}`);
    if(!communitySlugs.has(place.communitySlug))errors.push(`missing community reference: ${place.slug}`);
    if(place.katottgSettlementCode){if(!/^UA[A-Z0-9]{17}$/.test(place.katottgSettlementCode))errors.push(`invalid settlement code format: ${place.slug}`);if(settlementCodes.has(place.katottgSettlementCode))errors.push(`duplicate settlement code: ${place.katottgSettlementCode}`);settlementCodes.add(place.katottgSettlementCode);}
    else if(place.geoStatus==='ELIGIBLE')errors.push(`eligible place has no official KATOTTG code: ${place.slug}`);
    if(place.indexable&&!hasPlaceSeoBlock(place))errors.push(`indexable route is missing a substantive place-specific SEO block: ${place.slug}`);
    if(place.indexable&&!canIndexTouristTaxPlace(place,communities))errors.push(`indexable route has incomplete readiness gates: ${place.slug}`);
    const rule=getTouristTaxRule(place,communities);
    if(!rule||!ruleStates.has(rule.status)){errors.push(`missing or invalid tax rule state: ${place.slug}`);continue;}
    if(rule.status==='VERIFIED'){
      if(!communities.find(item=>item.slug===place.communitySlug)?.katottgCode||!rule.sourceUrl||!rule.effectiveFrom||!rule.checkedAt||!rule.verificationBasis)errors.push(`verified rule is missing code/source/dates/verification basis: ${place.slug}`);
      if(!(rule.rates&&Number.isFinite(rule.rates.domestic)&&Number.isFinite(rule.rates.inbound))&&!rule.rateSchedule)errors.push(`verified rule is missing category rates or supported rate schedule: ${place.slug}`);
    }
    if(place.geoStatus==='REVIEW_REQUIRED'||rule.status!=='VERIFIED')warnings.push(`${place.slug}: public amounts and indexing remain blocked (${place.geoStatus}; ${rule.status})`);
  }
  const counts={all:places.length,eligible:places.filter(place=>place.geoStatus==='ELIGIBLE').length,excluded:places.filter(place=>place.geoStatus==='EXCLUDED').length,reviewRequired:places.filter(place=>place.geoStatus==='REVIEW_REQUIRED').length};
  if(counts.all!==counts.eligible+counts.excluded+counts.reviewRequired)errors.push('geography state counts do not reconcile');
  return {ok:errors.length===0,errors,warnings,counts};
}
