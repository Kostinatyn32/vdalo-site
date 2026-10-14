import {mkdir,readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {canCalculateTouristTaxPlace,getTouristTaxCommunity,getTouristTaxPlace,getTouristTaxRule} from '../versions/v1/tourist-tax-data.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const sourcePath=path.join(root,'versions/v1/tourist-tax-workbook-data.json');
const outPath=path.join(root,'seo-workspace/tourist-tax/exports/prepared-seo-risk-audit.csv');
const fields=['title','description','h1','intro','calculator','exemptions','agents','faq','faqJsonLd'];
const rules={
  LEGACY_2026_MINIMUM_WAGE:/8\s?000|8000/i,
  UNVERIFIED_LOCAL_RATE:/\d+(?:[,.]\d+)?\s*%/,
  UNVERIFIED_DAILY_AMOUNT:/\d+[,.]\d{2}\s*(?:грн|₴)/i,
  LEGAL_EXEMPTION_CLAIM:/звільн|не є платник|не сплачують|не є платниками/i,
  TAX_AGENT_OR_PAYMENT_DUTY:/зобов.{0,60}(?:стяг|перерах|сплач)|обов.{0,60}(?:стяг|перерах|сплач)/i,
  BUDGET_USE_OR_DESTINATION_CLAIM:/(?:кошти|збір)[^.]{0,140}(?:надход|спрям|використов).{0,100}(?:бюджет|інфраструктур|туризм|промоці)/i,
  SPECIFIC_PAYMENT_DEADLINE:/\b(?:40|10)\s*(?:календарних|робочих)?\s*дн/i,
  BUDGET_CODE_CLAIM:/\b18030000\b/,
};

const data=JSON.parse(await readFile(sourcePath,'utf8'));
const rows=data.places.map(place=>{
  const copy=fields.map(field=>String(place.preparedSeo?.[field]??'')).join('\n');
  const appPlace=getTouristTaxPlace(place.slug);
  const appCommunity=getTouristTaxCommunity(appPlace?.communitySlug);
  const ruleVerified=appCommunity?.taxRule?.status==='VERIFIED';
  const calculatorReady=Boolean(appPlace&&canCalculateTouristTaxPlace(appPlace));
  const flags=Object.entries(rules).filter(([,pattern])=>pattern.test(copy)).map(([name])=>name);
  if(!ruleVerified&&flags.includes('UNVERIFIED_LOCAL_RATE'))flags.push('UNVERIFIED_LOCAL_RATE_FOR_DRAFT');
  if(!ruleVerified&&flags.includes('UNVERIFIED_DAILY_AMOUNT'))flags.push('UNVERIFIED_AMOUNT_FOR_DRAFT');
  if(ruleVerified){
    const seoRates=[...copy.matchAll(/(\d+(?:[,.]\d+)?)\s*%/g)].map(match=>Number(match[1].replace(',','.')));
    const officialRates=Object.values(getTouristTaxRule(appPlace)?.rates??{}).filter(Number.isFinite);
    if(seoRates.some(rate=>!officialRates.some(official=>Math.abs(rate-official)<0.00001)))flags.push('SEO_RATE_DIFFERS_FROM_VERIFIED_RULE');
  }
  if(place.preparedSeo?.faqJsonLd)flags.push(ruleVerified?'FAQ_JSONLD_REQUIRES_VERIFIED_CONTENT_MATCH':'UNREVIEWED_FAQ_JSONLD');
  if(!place.sourceFiles?.length)flags.push('MISSING_SOURCE_TRACE');
  const decisionVerified=ruleVerified;
  if(!decisionVerified)flags.push('MISSING_PRIMARY_DECISION_EVIDENCE');
  return {
    slug:place.slug,locality:place.name,region:place.region,community:place.community,
    app_status:appCommunity?.taxRule?.status??place.review?.localDecision??'UNKNOWN',
    app_geo_status:appPlace?.geoStatus??'UNKNOWN',
    calculator_ready:calculatorReady,
    prepared_seo_fields_present:fields.filter(field=>String(place.preparedSeo?.[field]??'').trim()).length,
    has_legacy_base:flags.includes('LEGACY_2026_MINIMUM_WAGE'),
    has_rate_claim:flags.includes('UNVERIFIED_LOCAL_RATE'),
    rate_claim_is_unverified:!ruleVerified&&flags.includes('UNVERIFIED_LOCAL_RATE'),
    rate_claim_differs_from_verified_rule:flags.includes('SEO_RATE_DIFFERS_FROM_VERIFIED_RULE'),
    has_daily_amount_claim:flags.includes('UNVERIFIED_DAILY_AMOUNT'),
    amount_claim_is_unverified:!ruleVerified&&flags.includes('UNVERIFIED_DAILY_AMOUNT'),
    has_legal_exemption_claim:flags.includes('LEGAL_EXEMPTION_CLAIM'),
    has_tax_agent_or_payment_duty:flags.includes('TAX_AGENT_OR_PAYMENT_DUTY'),
    has_budget_use_claim:flags.includes('BUDGET_USE_OR_DESTINATION_CLAIM'),
    has_deadline_claim:flags.includes('SPECIFIC_PAYMENT_DEADLINE'),
    has_budget_code_claim:flags.includes('BUDGET_CODE_CLAIM'),
    has_unreviewed_faq_jsonld:flags.includes('UNREVIEWED_FAQ_JSONLD'),
    has_primary_decision_evidence:decisionVerified,
    flags:flags.join('|'),
  };
});

const headers=Object.keys(rows[0]??{});
const csvCell=value=>{
  const raw=String(value??'');
  return /[",\r\n]/.test(raw)?`"${raw.replaceAll('"','""')}"`:raw;
};
const csv=[headers.join(','),...rows.map(row=>headers.map(header=>csvCell(row[header])).join(','))].join('\r\n')+'\r\n';
await mkdir(path.dirname(outPath),{recursive:true});
await writeFile(outPath,csv,'utf8');
const summary={
  rows:rows.length,
  withAllPreparedSeoFields:rows.filter(row=>row.prepared_seo_fields_present===fields.length).length,
  missingPrimaryDecisionEvidence:rows.filter(row=>!row.has_primary_decision_evidence).length,
  legacyBase:rows.filter(row=>row.has_legacy_base).length,
  rateClaimPages:rows.filter(row=>row.has_rate_claim).length,
  unverifiedRateClaims:rows.filter(row=>row.rate_claim_is_unverified).length,
  mismatchedVerifiedRateClaims:rows.filter(row=>row.rate_claim_differs_from_verified_rule).length,
  unverifiedDailyAmounts:rows.filter(row=>row.amount_claim_is_unverified).length,
  legalExemptionClaims:rows.filter(row=>row.has_legal_exemption_claim).length,
  taxAgentOrPaymentDutyClaims:rows.filter(row=>row.has_tax_agent_or_payment_duty).length,
  budgetUseClaims:rows.filter(row=>row.has_budget_use_claim).length,
  deadlineClaims:rows.filter(row=>row.has_deadline_claim).length,
  budgetCodeClaims:rows.filter(row=>row.has_budget_code_claim).length,
  unreviewedFaqJsonLd:rows.filter(row=>row.has_unreviewed_faq_jsonld).length,
  output:path.relative(root,outPath).replaceAll('\\','/'),
};
console.log(JSON.stringify(summary,null,2));
