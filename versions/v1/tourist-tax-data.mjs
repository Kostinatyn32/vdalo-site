// Tax readiness is deliberately independent from settlement identity and SEO state.
// VERIFIED means the current primary sources and calculation inputs have been checked.
const annualTaxBases = Object.freeze({
  2026: {minimumWageOnJanuary1: 8647, url: 'https://zakon.rada.gov.ua/laws/show/4695-20'},
});

export const touristTaxSources = Object.freeze({
  katottg: {
    url: 'https://mininfra.gov.ua/diialnist/rozvytok-mistsevoho-samovriaduvannia/kodyfikator-administratyvno-terytorialnykh-odynyts-ta-terytorii-terytorialnykh-hromad',
    releaseDate: '2026-07-07',
    orderNumber: '1321',
    imported: false,
    sha256: null,
  },
  territoryList: {
    url: 'https://zakon.rada.gov.ua/laws/show/z0380-25',
    revisionDate: '2026-08-21',
    matchedToKatottg: false,
  },
  taxCode: { url: 'https://tax.gov.ua/nk/rozdil-xii--mistsevi-podatki-i/' },
  budget2026: annualTaxBases[2026],
  annualBases: annualTaxBases,
});

export const touristTaxCommunities = Object.freeze([
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
      status: 'VERIFIED',
      verificationBasis: 'Чинне рішення та роз’яснення Луцької міської ради, Податковий кодекс, офіційне підтвердження коду громади ДПС Волині, автоматизовані тести розрахунку',
      checkedAt: '2026-10-14',
      version: 'lutsk-2026-01',
    },
  },
]);

export const touristTaxPlaces = Object.freeze([
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
      description: 'Ставки туристичного збору в Луцьку на 2026 рік, офіційне рішення міськради та калькулятор суми за кількістю гостей і діб.',
      uniqueContent: 'У Луцькій міській територіальній громаді з 1 січня 2026 року діють ставки туристичного збору 0,5% для внутрішнього та 1,5% для в’їзного туризму. Рішення міської ради №77/72 визначає ставку як відсоток мінімальної заробітної плати на 1 січня податкового року за одну особу за кожну добу тимчасового розміщення. Калькулятор рахує інформаційну суму за обраною датою, кількістю розрахункових діб і категоріями гостей.',
    },
  },
]);

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
  return Boolean(place&&community?.katottgCode&&/^UA[A-Z0-9]{17}$/.test(community.katottgCode)&&place.geoStatus==='ELIGIBLE'&&rule?.status==='VERIFIED'&&rule?.sourceUrl&&rule?.effectiveFrom&&rule?.checkedAt&&place.readiness?.placeVerified&&place.readiness?.safetyEligible&&place.readiness?.calculatorQaPassed);
}

export function canSearchTouristTaxPlace(place, communities=touristTaxCommunities) {
  return canCalculateTouristTaxPlace(place,communities);
}

export function canIndexTouristTaxPlace(place, communities=touristTaxCommunities) {
  return Boolean(place&&place.indexable===true&&canSearchTouristTaxPlace(place,communities)&&place.readiness?.uniqueContentApproved&&place.readiness?.seoQaPassed);
}

// Backwards-compatible name for sitemap callers. Indexation has stricter gates than calculation.
export function isTouristTaxPlaceReady(place) {
  return canIndexTouristTaxPlace(place);
}

export function validateTouristTaxPlaces(places=touristTaxPlaces,communities=touristTaxCommunities){
  const errors=[],warnings=[],slugs=new Set(),settlementCodes=new Set();
  const communitySlugs=new Set(),communityCodes=new Set();
  const geoStates=new Set(['ELIGIBLE','EXCLUDED','REVIEW_REQUIRED']);
  const ruleStates=new Set(['UNKNOWN','SECONDARY_SOURCE_ONLY','COUNCIL_ACT_FOUND','LEGAL_REVIEW_REQUIRED','VERIFIED','STALE','CONFLICT']);
  for(const community of communities){
    if(!community.slug||communitySlugs.has(community.slug))errors.push(`duplicate or missing community slug: ${community.slug||'(empty)'}`);else communitySlugs.add(community.slug);
    if(!community.name)errors.push(`missing community name: ${community.slug}`);
    if(community.katottgCode){if(!/^UA[A-Z0-9]{17}$/.test(community.katottgCode))errors.push(`invalid community code format: ${community.slug}`);if(communityCodes.has(community.katottgCode))errors.push(`duplicate community code: ${community.katottgCode}`);communityCodes.add(community.katottgCode);}
    const rule=community.taxRule;
    if(!rule||!ruleStates.has(rule.status))errors.push(`missing or invalid tax rule state: ${community.slug}`);
    if(rule?.status==='VERIFIED'&&(!community.katottgCode||!rule.sourceUrl||!rule.effectiveFrom||!rule.checkedAt||!rule.verificationBasis||!rule.rates||!Number.isFinite(rule.rates.domestic)||!Number.isFinite(rule.rates.inbound)))errors.push(`verified community rule is missing code/source/dates/verification basis/rates: ${community.slug}`);
  }
  for(const place of places){
    if(!place.slug||slugs.has(place.slug))errors.push(`duplicate or missing slug: ${place.slug||'(empty)'}`);else slugs.add(place.slug);
    if(!place.name||!place.region||!place.district)errors.push(`missing settlement labels: ${place.slug}`);
    if(!geoStates.has(place.geoStatus))errors.push(`invalid geography state: ${place.slug}`);
    if(!communitySlugs.has(place.communitySlug))errors.push(`missing community reference: ${place.slug}`);
    if(place.katottgSettlementCode){if(!/^UA[A-Z0-9]{17}$/.test(place.katottgSettlementCode))errors.push(`invalid settlement code format: ${place.slug}`);if(settlementCodes.has(place.katottgSettlementCode))errors.push(`duplicate settlement code: ${place.katottgSettlementCode}`);settlementCodes.add(place.katottgSettlementCode);}
    else if(place.geoStatus==='ELIGIBLE')errors.push(`eligible place has no official KATOTTG code: ${place.slug}`);
    if(place.indexable&&!canIndexTouristTaxPlace(place,communities))errors.push(`indexable route has incomplete readiness gates: ${place.slug}`);
    const rule=getTouristTaxRule(place,communities);
    if(!rule||!ruleStates.has(rule.status)){errors.push(`missing or invalid tax rule state: ${place.slug}`);continue;}
    if(rule.status==='VERIFIED'){
      if(!communities.find(item=>item.slug===place.communitySlug)?.katottgCode||!rule.sourceUrl||!rule.effectiveFrom||!rule.checkedAt||!rule.verificationBasis)errors.push(`verified rule is missing code/source/dates/verification basis: ${place.slug}`);
      if(!rule.rates||!Number.isFinite(rule.rates.domestic)||!Number.isFinite(rule.rates.inbound))errors.push(`verified rule is missing category rates: ${place.slug}`);
    }
    if(place.geoStatus==='REVIEW_REQUIRED'||rule.status!=='VERIFIED')warnings.push(`${place.slug}: public amounts and indexing remain blocked (${place.geoStatus}; ${rule.status})`);
  }
  const counts={all:places.length,eligible:places.filter(place=>place.geoStatus==='ELIGIBLE').length,excluded:places.filter(place=>place.geoStatus==='EXCLUDED').length,reviewRequired:places.filter(place=>place.geoStatus==='REVIEW_REQUIRED').length};
  if(counts.all!==counts.eligible+counts.excluded+counts.reviewRequired)errors.push('geography state counts do not reconcile');
  return {ok:errors.length===0,errors,warnings,counts};
}
