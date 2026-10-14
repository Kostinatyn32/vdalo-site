import test from 'node:test';
import assert from 'node:assert/strict';
import {calculateTouristTax,calculateExactTouristTaxCents,exportTouristTaxReviewCsv,exportTouristTaxReviewXlsx,renderTouristTaxCity,renderTouristTaxHub} from '../versions/v1/tourist-tax.mjs';
import {getPublicSitemapRoutes} from '../versions/v1/sitemap.mjs';
import {touristTaxCommunities,touristTaxPlaces,validateTouristTaxPlaces} from '../versions/v1/tourist-tax-data.mjs';

test('exact rational calculation rounds once after guest-days are multiplied',()=>{
  assert.equal(calculateExactTouristTaxCents({minimumWage:8647,ratePercent:0.5,guests:2,nights:3}).toString(),'25941');
  assert.equal(calculateExactTouristTaxCents({minimumWage:8647,ratePercent:1.5,guests:1,nights:1}).toString(),'12971');
});

test('exact calculation rejects floating-point rates outside supported precision',()=>{
  assert.throws(()=>calculateExactTouristTaxCents({minimumWage:8647,ratePercent:0.333,guests:1,nights:1}),TypeError);
  assert.throws(()=>calculateExactTouristTaxCents({minimumWage:8647,ratePercent:0.5,guests:0,nights:1}),TypeError);
});

test('Lutsk calculator returns an amount from the published 2026 rate',()=>{
  const result=calculateTouristTax({placeSlug:'lutsk',start:'2026-10-10',days:3,guestGroups:[{category:'domestic',guests:2}]});
  assert.equal(result.state,'VERIFIED_RESULT');
  assert.equal(result.totalCents,'25941');
  assert.equal(result.exemptionReviewRequired,false);
});

test('calculator validates dates, guest counts and category',()=>{
  assert.equal(calculateTouristTax({placeSlug:'lutsk',start:'2026-10-13',end:'2026-10-10',nights:3,guests:2,category:'domestic'}).state,'INVALID_INPUT');
  assert.equal(calculateTouristTax({placeSlug:'lutsk',start:'2026-10-10',end:'2026-10-13',nights:3,guests:0,category:'domestic'}).state,'INVALID_INPUT');
  assert.equal(calculateTouristTax({placeSlug:'unknown',start:'2026-10-10',end:'2026-10-13',nights:3,guests:2,category:'domestic'}).state,'AMBIGUOUS_PLACE');
});

test('verified calculation supports mixed guest categories, possible exemptions and rejects tax-year crossings',()=>{
  const place={...touristTaxPlaces[0],geoStatus:'ELIGIBLE',katottgSettlementCode:'UA00000000000000000',readiness:{placeVerified:true,safetyEligible:true,calculatorQaPassed:true}};
  const community={...touristTaxCommunities[0],katottgCode:'UA00000000000000000',taxRule:{...touristTaxCommunities[0].taxRule,status:'VERIFIED',verificationBasis:'QA fixture'}};
  const result=calculateTouristTax({placeSlug:'lutsk',start:'2026-10-10',days:1,guestGroups:[{category:'domestic',guests:2},{category:'inbound',guests:1}]},[place],[community]);
  assert.equal(result.state,'VERIFIED_RESULT');
  assert.equal(result.totalCents,'21618');
  assert.equal(result.guestGroups.length,2);
  const exemption=calculateTouristTax({placeSlug:'lutsk',start:'2026-10-10',days:1,guestGroups:[{category:'domestic',guests:1}],exemption:'claimed'},[place],[community]);
  assert.equal(exemption.state,'VERIFIED_RESULT');
  assert.equal(exemption.exemptionReviewRequired,true);
  assert.equal(calculateTouristTax({placeSlug:'lutsk',start:'2026-12-31',days:2,guestGroups:[{category:'domestic',guests:1}]},[place],[community]).state,'RATE_OUT_OF_PERIOD');
  assert.equal(calculateTouristTax({placeSlug:'lutsk',start:'2026-10-10',days:1,guestGroups:[{category:'domestic',guests:0}]},[place],[community]).state,'INVALID_INPUT');
});

test('directory and Lutsk city page are indexable, useful, and included in the sitemap',()=>{
  const hub=renderTouristTaxHub();
  const city=renderTouristTaxCity('lutsk');
  assert.match(hub,/<meta name="robots" content="index,follow">/);
  assert.match(hub,/<link rel="canonical" href="https:\/\/www\.vdalo\.tech\/tourist-tax\/">/);
  assert.equal([...hub.matchAll(/\bid="tt-calc-place"/g)].length,1);
  assert.match(hub,/Луцьк/);
  assert.match(city,/<meta name="robots" content="index,follow">/);
  assert.match(city,/Розрахуйте туристичний збір/);
  assert.match(city,/0,5\s*%|0,5%/);
  assert.match(city,/1,5\s*%|1,5%/);
  assert.doesNotMatch(`${hub}${city}`,/пілот|на перевірці|ще перевіряємо/i);
  const routes=getPublicSitemapRoutes({seoRoutes:[],caseSlugs:[],pmsArticle:{slug:'/blog/a'},pmsChoiceArticle:{slug:'/blog/b'},editorialArticles:[],secondPassArticles:[],touristTaxRoutes:['/tourist-tax/',...touristTaxPlaces.map(place=>place.route)]});
  assert.ok(routes.includes('/tourist-tax/'));
  assert.ok(routes.includes('/tourist-tax/lutsk/'));
});

test('editorial CSV is valid UTF-8 CSV and quotes fields',()=>{
  const csv=exportTouristTaxReviewCsv();
  assert.ok(csv.startsWith('\uFEFF"settlement_slug","settlement"'));
  assert.match(csv,/"77\/72"/);
  assert.match(csv,/"ELIGIBLE"/);
  assert.match(csv,/"VERIFIED"/);
});

test('editorial XLSX is a ZIP-based OOXML workbook with worksheet entries',()=>{
  const workbook=exportTouristTaxReviewXlsx();
  assert.equal(workbook.readUInt32LE(0),0x04034b50);
  assert.equal(workbook.readUInt32LE(workbook.length-22),0x06054b50);
  const directoryOffset=workbook.readUInt32LE(workbook.length-6);
  const directorySize=workbook.readUInt32LE(workbook.length-10);
  const directory=workbook.subarray(directoryOffset,directoryOffset+directorySize).toString('utf8');
  assert.match(directory,/\[Content_Types\]\.xml/);
  assert.match(directory,/xl\/workbook\.xml/);
  assert.match(directory,/xl\/worksheets\/sheet1\.xml/);
});

test('city data, sources and publication state reconcile',()=>{
  const report=validateTouristTaxPlaces();
  assert.equal(report.ok,true);
  assert.deepEqual(report.counts,{all:1,eligible:1,excluded:0,reviewRequired:0});
  assert.equal(report.warnings.length,0);
  const unsafe={...touristTaxPlaces[0],readiness:{...touristTaxPlaces[0].readiness,seoQaPassed:false}};
  assert.ok(validateTouristTaxPlaces([unsafe]).errors.some(error=>error.includes('incomplete readiness gates')));
});
