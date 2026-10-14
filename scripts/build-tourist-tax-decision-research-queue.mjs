import {mkdir,readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {canCalculateTouristTaxPlace,getTouristTaxPlace,touristTaxCommunities} from '../versions/v1/tourist-tax-data.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const inputPath=path.join(root,'versions/v1/tourist-tax-workbook-data.json');
const outputPath=path.join(root,'seo-workspace/tourist-tax/exports/decision-research-queue.csv');
export const taxOfficeRegionSlugs={
  'Вінницька':'vinnitska-oblast','Волинська':'volinska-oblast','Дніпропетровська':'dnipropetrovska-oblast',
  'Донецька':'donetska-oblast','Житомирська':'jitomirska-oblast','Закарпатська':'zakarpatska-oblast',
  'Запорізька':'zaporizka-oblast','Івано-Франківська':'ivano-frankivska-oblast','Київська':'kiivska-oblast',
  'Кіровоградська':'kirovogradska-oblast','Луганська':'luganska-oblast','Львівська':'lvivska-oblast','Миколаївська':'mikolaivska-oblast',
  'Одеська':'odeska-oblast','Полтавська':'poltavska-oblast','Рівненська':'rivnenska-oblast',
  'Сумська':'sumska-oblast','Тернопільська':'ternopilska-oblast','Харківська':'harkivska-oblast',
  'Херсонська':'khersonska-oblast','Хмельницька':'hmelnitska-oblast','Черкаська':'cherkaska-oblast',
  'Чернівецька':'chernivetska-oblast','Чернігівська':'chernigivska-oblast','м. Київ':'m-kiiv',
};
if(Object.keys(taxOfficeRegionSlugs).length!==25)throw new Error(`Expected 24 oblast indexes plus Kyiv city, got ${Object.keys(taxOfficeRegionSlugs).length}`);
const data=JSON.parse(await readFile(inputPath,'utf8'));
const byCommunity=new Map();
for(const place of data.places){
  const key=place.community;
  if(!byCommunity.has(key))byCommunity.set(key,{name:key,region:place.region,placeSlugs:[],placeNames:[],sourceCommunities:new Set()});
  const group=byCommunity.get(key);
  group.placeSlugs.push(place.slug);
  group.placeNames.push(place.name);
  group.sourceCommunities.add(place.community);
}
const candidateCommunities=touristTaxCommunities;
const communityByKey=new Map(candidateCommunities.map(item=>[`${item.region}|${item.name}`,item]));
// The official signed Tax Service form confirms the Lviv rates. The price
// bands now work in the calculator; exact overlapping thresholds and the
// original council act remain under legal review.
const reviewedRateSchedules=new Map([
  ['UA46060250000025047',{
    status:'RATE_VERIFIED_REVIEW_PENDING',
    decisionNumber:'6373',decisionDate:'2025-06-12',effectiveFrom:'2026-01-01',effectiveTo:'',
    sourceUrl:'https://tax.gov.ua/data/material/000/801/934883/01bb5e61_0220_47aa_ba69_8f53584d7e19.pdf',
    rateSchedule:{bands:[{maxPriceUahPerPersonPerDay:750,domesticRatePercent:0.3,inboundRatePercent:1.0},{minPriceUahPerPersonPerDay:750,maxPriceUahPerPersonPerDay:1200,domesticRatePercent:0.4,inboundRatePercent:1.0},{minPriceUahPerPersonPerDay:1200,domesticRatePercent:0.5,inboundRatePercent:1.0}],ambiguousBoundariesUahPerPersonPerDay:[750,1200],priceBasis:'вартість тимчасового розміщення для однієї особи за одну добу'},
    checkedAt:'2026-10-14',
    notes:'Підписана форма ДПС підтверджує рішення №6373, ставки й застосування з 01.01.2026. Калькулятор підтримує три цінові діапазони та відхиляє точні межі 750 і 1200 грн. До перевірки первинного тексту рішення, точних меж і територіальної придатності сторінку не публікувати.',
  }],
]);
// Primary-source evidence with unresolved applicability for the calculation year.
const pendingYearReviewEvidence=new Map([
  ['UA80000000000093317',{
    decisionNumber:'159/10626',decisionDate:'2025-10-23',
    sourceUrl:'https://old.kmr.gov.ua/uk/content/rishennya-kyyivskoyi-miskoyi-rady-12190',
    notes:'Офіційний архів Київради підтверджує пізніше рішення №159/10626 від 23.10.2025, оприлюднене 06.11.2025; картка визначає предмет як зміни до таблиці туристичного збору в рішенні №242/5629. Попередня картка №108/10575 від 09.10.2025 також є частиною ланцюга змін. PDF №108/10575 повертає 403, PDF №159/10626 повертає 404, а офіційний скан-сервіс не завантажився. Повний текст обох актів, таблицю ставок і дати застосування не прочитано. Перевірити всі зміни; кандидатні ставки Excel не активувати.'
  }],
  ['UA46020070000056149',{
    decisionNumber:'1787',decisionDate:'2024-07-12',effectiveFrom:'2025-01-01',
    taxOfficeCommunityFileUrl:'https://tax.gov.ua/data/material/000/801/934883/44619f11_1523_4a37_9d81_397ab91b05c4.pdf',
    notes:'Підписана форма ДПС у файлі Львівської області для 2026 року містить базове рішення №1787 від 12.07.2024, застосування з 01.01.2025, точний код громади UA46020070000056149 і код Східниці UA46020070010062211. У туристичному розділі є 0,00 для загального рядка та видів проживання, але далі одночасно наведено критерії вартості понад 3500 грн зі ставкою 0,20% та до 3500 грн зі ставками 0,00% і 0,40%; примітка форми забороняє таке одночасне дублювання. Не визначати ставку/межу без оригіналу рішення та звірки актуального подання ДПС. Excel-кандидат 0,50% / 1,50% не підтверджено. Офіційний проєкт нового рішення, позначений як проєкт, пропонує набрання чинності з 01.01.2027 і не змінює сам собою правило 2026 року.'
  }],
  ['UA26120130000088448',{
    decisionNumber:'1228-66-2026',decisionDate:'2026-06-26',
    sourceUrl:'https://www.polsr.gov.ua/pro-vstanovlennya-misczevyh-podatkiv-ta-zboriv-na-terytoriyi-polyanyczkoyi-silskoyi-rady-4/',
    notes:'Поляницька сільська рада опублікувала рішення №1228-66-2026 від 26.06.2026. Повний додаток зі ставками, пільгами та датою застосування ще не перевірено. Буковель не є підтвердженим окремим населеним пунктом у КАТОТТГ; окремо встановити територіальну адресу курортної локації та її зв’язок із населеним пунктом Поляниця. Кандидат Excel 0,40% / 1,00% не активувати.'
  }],
  ['UA46020090000057315',{
    decisionNumber:'4913',decisionDate:'2026-03-10',
    sourceUrl:'https://tmr.golos.net.ua/?id=7365&p=khronolohiya_zasidan&sp=single_textend',
    taxOfficeCommunityFileUrl:'https://tax.gov.ua/data/material/000/801/934883/lbc_1358400000_edrpou_02314719_version_1.pdf',
    notes:'Рішення Трускавецької міської ради №4913 від 10.03.2026 затверджує нове Положення і набирає чинності з моменту прийняття. Підписана форма ДПС, сформована до цього рішення, показує попереднє рішення №927 та 0,20% / 0,20% з 01.01.2022; вона не доводить, що ставка лишилася такою після 10.03.2026. Додаток 1 до №4913 і код міста треба звірити. Excel 0,20% / 1,00% лишається кандидатом і не активується у калькуляторі.'
  }],
]);
// Signed 2026 Tax Service forms provide applicable rates, but remain pending
// primary-act review. Uzhhorod's form also contains contradictory zero-rate
// rows despite its own rule that section 1.1 must be empty when 1.0.0 is used.
const rateVerifiedReviewEvidence=new Map([
  ['UA21100230000083101',{
    decisionNumber:'2333',decisionDate:'2025-07-08',effectiveFrom:'2026-01-01',
    rates:{domestic:0.5,inbound:1.0},
    taxOfficeCommunityFileUrl:'https://www.tax.gov.ua/data/material/000/801/934858/4e161262_60b5_4550_bc1a_1d123200f403.pdf',
    notes:'Підписана форма ДПС на 2026 рік для коду громади UA21100230000083101 та міста UA21100230010016545 вказує 0,50% внутрішній / 1,00% в’їзний туризм з 01.01.2026, рішення №2333 від 08.07.2025. Форма також містить нульові рядки за видами проживання, хоча примітка забороняє заповнювати розділ 1.1 разом із 1.0.0. Перевірити оригінал рішення й трактування рядків до публікації; ставки не активувати в калькуляторі.'
  }],
]);
const rows=[];
for(const group of byCommunity.values()){
  const matchedPlaceCommunity=group.placeSlugs.map(getTouristTaxPlace).map(place=>place?.communitySlug).filter(Boolean).map(slug=>candidateCommunities.find(item=>item.slug===slug)).find(Boolean);
  const appCommunity=(group.region==='Волинська'&&group.name==='Луцька міська ТГ'
    ?candidateCommunities.find(item=>item.slug==='lutsk-community'):null)
    ??matchedPlaceCommunity
    ??communityByKey.get(`${group.region}|${group.name}`)
    ??candidateCommunities.find(item=>item.name===group.name&&item.region===group.region)
    ??candidateCommunities.find(item=>item.name===group.name);
  const regionKey=group.region==='Київська'?'Київська':group.region;
  const sourceRegionSlug=taxOfficeRegionSlugs[regionKey];
  if(!sourceRegionSlug)throw new Error(`No official DПС region source configured for ${group.region}`);
  const rateVariants=appCommunity?.review?.rateVariants??[];
  const proposedRates=appCommunity?.review?.proposedRates??{};
  const rule=appCommunity?.taxRule;
  const reviewedSchedule=appCommunity?.katottgCode?reviewedRateSchedules.get(appCommunity.katottgCode):null;
  const pendingYearEvidence=appCommunity?.katottgCode?pendingYearReviewEvidence.get(appCommunity.katottgCode):null;
  const reviewedRates=appCommunity?.katottgCode?rateVerifiedReviewEvidence.get(appCommunity.katottgCode):null;
  const allPlacesVerified=group.placeSlugs.every(slug=>{
    const place=getTouristTaxPlace(slug);
    return Boolean(place&&canCalculateTouristTaxPlace(place));
  });
  const ruleVerified=rule?.status==='VERIFIED';
  rows.push({
    queue_status:allPlacesVerified?'VERIFIED_EXISTING':reviewedSchedule?.status??(ruleVerified||reviewedRates?'RATE_VERIFIED_REVIEW_PENDING':(rule?.status==='COUNCIL_ACT_FOUND'||pendingYearEvidence)?'COUNCIL_ACT_FOUND_REVIEW_PENDING':'PENDING_PRIMARY_RESEARCH'),
    region:group.region,
    community:group.name,
    official_community_name:appCommunity?.officialName??appCommunity?.name??'',
    community_katottg:appCommunity?.katottgCode??'',
    matched_locality_count:group.placeSlugs.length,
    locality_slugs:group.placeSlugs.join('|'),
    locality_names:group.placeNames.join('|'),
    workbook_review_status:appCommunity?.review?.status??(rule?.status==='VERIFIED'?'VERIFIED_PRIMARY_RULE':'MISSING_APP_RECORD'),
    workbook_candidate_domestic_rate:rateVariants.length===1?proposedRates.domestic??'':'',
    workbook_candidate_inbound_rate:rateVariants.length===1?proposedRates.inbound??'':'',
    conflicting_workbook_rate_variants:rateVariants.length>1?rateVariants.map(rate=>`${rate.domestic}/${rate.inbound}`).join('|'):'',
    tax_office_2026_index_url:`https://tax.gov.ua/zakonodavstvo/podatki-ta-zbori/stavki-mistsevih-podatkiv-ta-zboriv/${sourceRegionSlug}/zvedena-informatsiya-2026/`,
    tax_office_data_as_of:'2026-01-30',
    tax_office_community_file_url:rule?.taxOfficeCommunityFileUrl??reviewedRates?.taxOfficeCommunityFileUrl??pendingYearEvidence?.taxOfficeCommunityFileUrl??'',
    council_decision_url:reviewedSchedule?.sourceUrl??rule?.sourceUrl??pendingYearEvidence?.sourceUrl??'',
    council_decision_number:reviewedSchedule?.decisionNumber??reviewedRates?.decisionNumber??rule?.decisionNumber??pendingYearEvidence?.decisionNumber??'',
    council_decision_date:reviewedSchedule?.decisionDate??reviewedRates?.decisionDate??rule?.decisionDate??pendingYearEvidence?.decisionDate??'',
    effective_from:reviewedSchedule?.effectiveFrom??reviewedRates?.effectiveFrom??rule?.effectiveFrom??pendingYearEvidence?.effectiveFrom??'',
    effective_to:reviewedSchedule?.effectiveTo??rule?.effectiveTo??'',
    domestic_rate_percent:reviewedSchedule?'':reviewedRates?.rates?.domestic??rule?.rates?.domestic??'',
    inbound_rate_percent:reviewedSchedule?'':reviewedRates?.rates?.inbound??rule?.rates?.inbound??'',
    verified_rate_schedule:rule?.rateSchedule?JSON.stringify(rule.rateSchedule):reviewedSchedule?JSON.stringify(reviewedSchedule.rateSchedule):'',
    rate_model_status:(rule?.rateSchedule||reviewedSchedule)?'BANDED_INPUT_REQUIRED':'FLAT_RATE',
    rate_schedule_checked_at:reviewedSchedule?.checkedAt??'',
    official_reported_domestic_rate_percent:rule?.reportedRates?.domestic??'',
    official_reported_inbound_rate_percent:rule?.reportedRates?.inbound??'',
    official_report_confirmed_as_of:rule?.reportedRates?.confirmedAsOf??'',
    official_rate_report_url:rule?.reportedRates?rule.ratePublicationUrl:'',
    article_268_territory_rule:'LOCAL_DECISION_AND_PLACE_MATCH_REQUIRED',
    primary_source_checked_at:rule?.checkedAt??'',
    source_review_notes:reviewedSchedule?.notes??reviewedRates?.notes??pendingYearEvidence?.notes??rule?.verificationBasis??'',
  });
}
rows.sort((a,b)=>a.region.localeCompare(b.region,'uk')||a.community.localeCompare(b.community,'uk'));
const headers=Object.keys(rows[0]??{});
const csvCell=value=>{const text=String(value??'');return /[",\r\n]/.test(text)?`"${text.replaceAll('"','""')}"`:text;};
const csv=[headers.join(','),...rows.map(row=>headers.map(header=>csvCell(row[header])).join(','))].join('\r\n')+'\r\n';
await mkdir(path.dirname(outputPath),{recursive:true});
await writeFile(outputPath,csv,'utf8');
const placeCoverage=rows.reduce((total,row)=>total+row.matched_locality_count,0);
const summary={communities:rows.length,placeCoverage,uniqueLocalitySlugs:new Set(rows.flatMap(row=>row.locality_slugs.split('|'))).size,communitiesWithRegionSource:rows.filter(row=>row.tax_office_2026_index_url).length,primaryDecisionsPending:rows.filter(row=>row.queue_status==='PENDING_PRIMARY_RESEARCH').length,councilActFoundReviewPending:rows.filter(row=>row.queue_status==='COUNCIL_ACT_FOUND_REVIEW_PENDING').length,rateVerifiedReviewPending:rows.filter(row=>row.queue_status==='RATE_VERIFIED_REVIEW_PENDING').length,rateScheduleModelPending:rows.filter(row=>row.queue_status==='VERIFIED_RATE_SCHEDULE_MODEL_PENDING').length,fullyReadyCommunities:rows.filter(row=>row.queue_status==='VERIFIED_EXISTING').length,rateVerifiedCommunities:rows.filter(row=>['VERIFIED_EXISTING','RATE_VERIFIED_REVIEW_PENDING','VERIFIED_RATE_SCHEDULE_MODEL_PENDING'].includes(row.queue_status)).length,officialRateReports:rows.filter(row=>row.official_rate_report_url).length,output:path.relative(root,outputPath).replaceAll('\\','/')};
if(summary.communities!==280||summary.placeCoverage!==377||summary.uniqueLocalitySlugs!==377||summary.communitiesWithRegionSource!==280||summary.primaryDecisionsPending!==261||summary.councilActFoundReviewPending!==5||summary.rateVerifiedReviewPending!==3||summary.rateScheduleModelPending!==0||summary.fullyReadyCommunities!==11||summary.rateVerifiedCommunities!==14||summary.officialRateReports!==1)throw new Error(`Research queue coverage mismatch: ${JSON.stringify(summary)}`);
console.log(JSON.stringify(summary,null,2));
