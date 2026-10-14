import test from 'node:test';
import assert from 'node:assert/strict';
import {calculateTouristTax,calculateExactTouristTaxCents,exportTouristTaxReviewCsv,exportTouristTaxReviewXlsx,renderTouristTaxCity,renderTouristTaxHub} from '../versions/v1/tourist-tax.mjs';
import {getPublicSitemapRoutes} from '../versions/v1/sitemap.mjs';
import {canCalculateTouristTaxPlace,canIndexTouristTaxPlace,hasPlaceSeoBlock,touristTaxCommunities,touristTaxPlaces,touristTaxCityRoutes,touristTaxSources,validateTouristTaxPlaces} from '../versions/v1/tourist-tax-data.mjs';
import {touristTaxReleasePlan} from '../versions/v1/tourist-tax-release.mjs';

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

test('Sumy 2026 rate, city page and calculator are verified',()=>{
  const place=touristTaxPlaces.find(item=>item.slug==='sumy');
  const community=touristTaxCommunities.find(item=>item.slug===place.communitySlug);
  assert.equal(community.taxRule.status,'VERIFIED');
  assert.equal(community.taxRule.decisionNumber,'1238-МР');
  assert.deepEqual(community.taxRule.rates,{domestic:0.5,inbound:0.5});
  assert.equal(place.geoStatus,'ELIGIBLE');
  assert.equal(canCalculateTouristTaxPlace(place),true);
  assert.equal(touristTaxCityRoutes().includes(place.route),true);
  const page=renderTouristTaxCity(place.slug);
  assert.match(page,/<meta name="robots" content="index,follow">/);
  assert.match(page,/0,5\s*%|0,5%/);
  assert.equal(calculateTouristTax({placeSlug:'sumy',start:'2026-10-10',days:1,guestGroups:[{category:'domestic',guests:1}]}).state,'VERIFIED_RESULT');
});

test('Vinnytsia 2026 rate, city page and calculator are verified against the effective decision',()=>{
  const place=touristTaxPlaces.find(item=>item.slug==='vinnytsya');
  const community=touristTaxCommunities.find(item=>item.slug===place.communitySlug);
  assert.equal(community.katottgCode,'UA05020030000031457');
  assert.equal(community.taxRule.status,'VERIFIED');
  assert.equal(community.taxRule.decisionNumber,'469');
  assert.deepEqual(community.taxRule.rates,{domestic:0.5,inbound:1.5});
  assert.deepEqual(community.taxRule.proposedRates,{domestic:0.3,inbound:1});
  assert.equal(community.taxRule.effectiveFrom,'2022-01-01');
  assert.equal(community.taxRule.effectiveTo,'2026-12-31');
  assert.equal(place.geoStatus,'ELIGIBLE');
  assert.equal(canCalculateTouristTaxPlace(place),true);
  assert.equal(touristTaxCityRoutes().includes(place.route),true);
  const page=renderTouristTaxCity(place.slug);
  assert.match(page,/<meta name="robots" content="index,follow">/);
  assert.match(page,/vmr\.gov\.ua/);
  assert.match(page,/1,5\s*%|1,5%/);
  assert.equal(calculateTouristTax({placeSlug:'vinnytsya',start:'2026-10-10',days:1,guestGroups:[{category:'inbound',guests:1}]}).state,'VERIFIED_RESULT');
});

test('Pivdenne 2026 rule and calculator use the current decision period',()=>{
  const place=touristTaxPlaces.find(item=>item.slug==='pivdenne');
  const community=touristTaxCommunities.find(item=>item.slug===place.communitySlug);
  assert.equal(community.katottgCode,'UA51100410000059549');
  assert.equal(community.taxRule.status,'VERIFIED');
  assert.equal(community.taxRule.decisionNumber,'422-VIII');
  assert.deepEqual(community.taxRule.rates,{domestic:0.5,inbound:0.5});
  assert.deepEqual(community.taxRule.proposedRates,{domestic:0.4,inbound:1.5});
  assert.equal(community.taxRule.effectiveFrom,'2022-01-01');
  assert.equal(community.taxRule.effectiveTo,'2026-12-31');
  assert.equal(place.geoStatus,'ELIGIBLE');
  assert.equal(canCalculateTouristTaxPlace(place),true);
  assert.equal(touristTaxCityRoutes().includes(place.route),true);
  assert.equal(calculateTouristTax({placeSlug:'pivdenne',start:'2026-10-10',days:1,guestGroups:[{category:'domestic',guests:1}]}).state,'VERIFIED_RESULT');
  assert.equal(calculateTouristTax({placeSlug:'pivdenne',start:'2027-01-01',days:1,guestGroups:[{category:'domestic',guests:1}]}).state,'RATE_OUT_OF_PERIOD');
});

test('Ternopil price-tiered 2026 rule is accurately represented and fails closed at the overlapping boundary',()=>{
  const place=touristTaxPlaces.find(item=>item.slug==='ternopil');
  const community=touristTaxCommunities.find(item=>item.slug===place.communitySlug);
  assert.equal(place.katottgSettlementCode,'UA61040490010069060');
  assert.equal(community.katottgCode,'UA61040490000035010');
  assert.equal(community.taxRule.status,'VERIFIED');
  assert.equal(community.taxRule.decisionNumber,'8/52/08');
  assert.equal(community.taxRule.effectiveFrom,'2026-01-01');
  assert.equal(community.taxRule.rates,null,'tiered rates must never be flattened into one misleading pair');
  assert.deepEqual(community.taxRule.rateSchedule.domestic.map(tier=>[tier.operator,tier.ratePercent]),[['lt',0.15],['gt',0.25]]);
  assert.deepEqual(community.taxRule.rateSchedule.inbound.map(tier=>[tier.operator,tier.ratePercent]),[['lt',0.3],['gt',0.5]]);
  assert.equal(canCalculateTouristTaxPlace(place),true);
  assert.equal(touristTaxCityRoutes().includes(place.route),true);
  assert.equal(canIndexTouristTaxPlace(place),true);
  const page=renderTouristTaxCity(place.slug);
  assert.match(page,/name="accommodationPricePerPersonPerDay"[^>]*required/);
  assert.match(page,/менше 320 грн/);
  assert.match(page,/понад 320 грн/);
  assert.match(page,/рівно 320 грн/);
  assert.match(page,/ternopilcity\.gov\.ua/);
  assert.match(page,/25,94 грн/);
  const lower=calculateTouristTax({placeSlug:'ternopil',start:'2026-10-10',days:2,guestGroups:[{category:'domestic',guests:1}],accommodationPricePerPersonPerDay:'300.00'});
  assert.equal(lower.state,'VERIFIED_RESULT');
  assert.equal(lower.totalCents,'2594');
  assert.equal(lower.guestGroups[0].ratePercent,0.15);
  const inbound=calculateTouristTax({placeSlug:'ternopil',start:'2026-10-10',days:1,guestGroups:[{category:'inbound',guests:1}],accommodationPricePerPersonPerDay:'300.00'});
  assert.equal(inbound.state,'VERIFIED_RESULT');
  assert.equal(inbound.totalCents,'2594');
  assert.equal(inbound.guestGroups[0].ratePercent,0.3);
  for(const price of ['319.99','320','320.00']){
    const result=calculateTouristTax({placeSlug:'ternopil',start:'2026-10-10',days:1,guestGroups:[{category:'domestic',guests:1}],accommodationPricePerPersonPerDay:price});
    if(Number(price)===320)assert.equal(result.state,'RATE_THRESHOLD_AMBIGUOUS');
    else assert.equal(result.state,'VERIFIED_RESULT');
  }
  const upper=calculateTouristTax({placeSlug:'ternopil',start:'2026-10-10',days:1,guestGroups:[{category:'domestic',guests:1}],accommodationPricePerPersonPerDay:'320.01'});
  assert.equal(upper.state,'VERIFIED_RESULT');
  assert.equal(upper.guestGroups[0].ratePercent,0.25);
  for(const price of [undefined,'','0','-1','not-a-price','320.001'])assert.equal(calculateTouristTax({placeSlug:'ternopil',start:'2026-10-10',days:1,guestGroups:[{category:'domestic',guests:1}],accommodationPricePerPersonPerDay:price}).state,'INVALID_INPUT');
  assert.equal(calculateTouristTax({placeSlug:'ternopil',start:'2027-01-01',days:1,guestGroups:[{category:'domestic',guests:1}],accommodationPricePerPersonPerDay:'300'}).state,'RATE_OUT_OF_PERIOD');
});

test('Lviv official 2026 multi-band schedule is preserved and calculator refuses overlapping price boundaries',()=>{
  const sourcePlace=touristTaxPlaces.find(item=>item.slug==='lviv');
  const community=touristTaxCommunities.find(item=>item.slug===sourcePlace.communitySlug);
  assert.equal(community.taxRule.status,'VERIFIED');
  assert.equal(community.taxRule.decisionNumber,'6373');
  assert.equal(community.taxRule.effectiveFrom,'2026-01-01');
  assert.equal(community.taxRule.rates,null,'price-dependent rates must not be flattened');
  assert.deepEqual(community.taxRule.rateSchedule.ambiguousBoundariesUahPerPersonPerDay,[750,1200]);
  assert.deepEqual(community.taxRule.rateSchedule.bands.map(band=>[band.minPriceUahPerPersonPerDay??null,band.maxPriceUahPerPersonPerDay??null,band.domesticRatePercent,band.inboundRatePercent]),[
    [null,750,0.3,1],[750,1200,0.4,1],[1200,null,0.5,1],
  ]);
  assert.equal(hasPlaceSeoBlock(sourcePlace),true);
  assert.equal(sourcePlace.editorial.seoBlock.sections.length,6);
  assert.match(sourcePlace.editorial.seoBlock.sections[2].paragraphs[0],/750 або 1 200 грн/);
  assert.equal(sourcePlace.indexable,true,'the signed 2026 Tax Service form confirms the city/community rates and the calculator fails closed at unclear boundaries');
  const calculatorPlace={...sourcePlace,geoStatus:'ELIGIBLE',readiness:{...sourcePlace.readiness,placeVerified:true,safetyEligible:true,calculatorQaPassed:true}};
  const calculate=price=>calculateTouristTax({placeSlug:'lviv',start:'2026-10-10',days:1,guestGroups:[{category:'domestic',guests:1}],accommodationPricePerPersonPerDay:price},[calculatorPlace],[community]);
  const cases=[['749.99',0.3,'2594'],['750.00',null,null],['750.01',0.4,'3459'],['1199.99',0.4,'3459'],['1200.00',null,null],['1200.01',0.5,'4324']];
  for(const [price,rate,cents] of cases){
    const result=calculate(price);
    if(rate===null){assert.equal(result.state,'RATE_THRESHOLD_AMBIGUOUS',`boundary ${price}`);assert.equal(result.thresholdUah,Number(price));}
    else {assert.equal(result.state,'VERIFIED_RESULT',`price ${price}`);assert.equal(result.guestGroups[0].ratePercent,rate);assert.equal(result.totalCents,cents);}
  }
  const inbound=calculateTouristTax({placeSlug:'lviv',start:'2026-10-10',days:1,guestGroups:[{category:'inbound',guests:1}],accommodationPricePerPersonPerDay:'800'},[calculatorPlace],[community]);
  assert.equal(inbound.state,'VERIFIED_RESULT');
  assert.equal(inbound.guestGroups[0].ratePercent,1);
  assert.equal(inbound.totalCents,'8647');
  assert.equal(canIndexTouristTaxPlace(sourcePlace),true);
});

test('Zaporizhzhia 2026 price bands, exact boundaries, page and calculator are verified',()=>{
  const place=touristTaxPlaces.find(item=>item.slug==='zaporizhzhya');
  const community=touristTaxCommunities.find(item=>item.slug===place.communitySlug);
  assert.equal(place.katottgSettlementCode,'UA23060070010069526');
  assert.equal(community.katottgCode,'UA23060070000082704');
  assert.equal(community.taxRule.status,'VERIFIED');
  assert.equal(community.taxRule.decisionNumber,'39');
  assert.equal(community.taxRule.effectiveFrom,'2019-02-04');
  assert.deepEqual(community.taxRule.rateSchedule.ambiguousBoundariesUahPerPersonPerDay,[]);
  assert.deepEqual(community.taxRule.rateSchedule.bands.map(band=>[
    band.minPriceExclusiveUahPerPersonPerDay??null,
    band.maxPriceUahPerPersonPerDay??null,
    band.domesticRatePercent,
    band.inboundRatePercent,
  ]),[[null,300,0.05,0.5],[300,600,0.25,1.5],[600,null,0.5,1.5]]);
  assert.equal(place.geoStatus,'ELIGIBLE');
  assert.equal(canCalculateTouristTaxPlace(place),true);
  assert.equal(canIndexTouristTaxPlace(place),true);
  assert.equal(touristTaxCityRoutes().includes(place.route),true);
  const page=renderTouristTaxCity(place.slug);
  assert.match(page,/<meta name="robots" content="index,follow">/);
  assert.match(page,/понад 300 грн/);
  assert.match(page,/понад 600 грн/);
  assert.match(page,/tax\.gov\.ua\/data\/material/);
  assert.equal(place.editorial.seoBlock.sections.length,6);

  const domesticCases=[['300.00',0.05,'432'],['300.01',0.25,'2162'],['600.00',0.25,'2162'],['600.01',0.5,'4324']];
  for(const [price,rate,cents] of domesticCases){
    const result=calculateTouristTax({placeSlug:'zaporizhzhya',start:'2026-10-10',days:1,guestGroups:[{category:'domestic',guests:1}],accommodationPricePerPersonPerDay:price});
    assert.equal(result.state,'VERIFIED_RESULT',`domestic price ${price}`);
    assert.equal(result.guestGroups[0].ratePercent,rate,`domestic rate at ${price}`);
    assert.equal(result.totalCents,cents,`domestic amount at ${price}`);
  }
  const inboundCases=[['300.00',0.5,'4324'],['300.01',1.5,'12971'],['600.00',1.5,'12971'],['600.01',1.5,'12971']];
  for(const [price,rate,cents] of inboundCases){
    const result=calculateTouristTax({placeSlug:'zaporizhzhya',start:'2026-10-10',days:1,guestGroups:[{category:'inbound',guests:1}],accommodationPricePerPersonPerDay:price});
    assert.equal(result.state,'VERIFIED_RESULT',`inbound price ${price}`);
    assert.equal(result.guestGroups[0].ratePercent,rate,`inbound rate at ${price}`);
    assert.equal(result.totalCents,cents,`inbound amount at ${price}`);
  }
});

test('Rivne 2026 rates, territorial codes, decision period, page and calculator are verified',()=>{
  const place=touristTaxPlaces.find(item=>item.slug==='rivne');
  const community=touristTaxCommunities.find(item=>item.slug===place.communitySlug);
  assert.equal(place.katottgSettlementCode,'UA56060470010041018');
  assert.equal(community.katottgCode,'UA56060470000086729');
  assert.equal(community.taxRule.status,'VERIFIED');
  assert.equal(community.taxRule.decisionNumber,'783');
  assert.equal(community.taxRule.effectiveFrom,'2022-01-01');
  assert.deepEqual(community.taxRule.rates,{domestic:0.25,inbound:1});
  assert.equal(place.geoStatus,'ELIGIBLE');
  assert.equal(canCalculateTouristTaxPlace(place),true);
  assert.equal(canIndexTouristTaxPlace(place),true);
  assert.ok(place.editorial.seoBlock.sections.length>=5);
  const page=renderTouristTaxCity('rivne');
  assert.match(page,/<meta name="robots" content="index,follow">/);
  assert.match(page,/Рівненської міської територіальної громади/);
  assert.match(page,/21,62 грн/);
  assert.match(page,/86,47 грн/);
  const cases=[
    {category:'domestic',guests:1,days:1,rate:0.25,cents:'2162'},
    {category:'inbound',guests:1,days:1,rate:1,cents:'8647'},
    {category:'domestic',guests:2,days:3,rate:0.25,cents:'12971'},
  ];
  for(const example of cases){
    const result=calculateTouristTax({placeSlug:'rivne',start:'2026-10-10',days:example.days,guestGroups:[{category:example.category,guests:example.guests}]});
    assert.equal(result.state,'VERIFIED_RESULT');
    assert.equal(result.guestGroups[0].ratePercent,example.rate);
    assert.equal(result.totalCents,example.cents);
  }
});

test('Chernihiv 2026 rates, territorial code, decision period, page and calculator are verified',()=>{
  const place=touristTaxPlaces.find(item=>item.slug==='chernihiv');
  const community=touristTaxCommunities.find(item=>item.slug===place.communitySlug);
  assert.equal(community.katottgCode,'UA74100390000073425');
  assert.equal(community.taxRule.status,'VERIFIED');
  assert.equal(community.taxRule.decisionNumber,'18/VIII-19');
  assert.equal(community.taxRule.effectiveFrom,'2023-01-01');
  assert.deepEqual(community.taxRule.rates,{domestic:0.5,inbound:0.5});
  assert.equal(place.geoStatus,'ELIGIBLE');
  assert.equal(canCalculateTouristTaxPlace(place),true);
  assert.equal(canIndexTouristTaxPlace(place),true);
  const page=renderTouristTaxCity('chernihiv');
  assert.match(page,/<meta name="robots" content="index,follow">/);
  assert.match(page,/Чернігівської міської територіальної громади/);
  assert.match(page,/259,41 грн/);
  const result=calculateTouristTax({placeSlug:'chernihiv',start:'2026-10-10',days:3,guestGroups:[{category:'domestic',guests:2}]});
  assert.equal(result.state,'VERIFIED_RESULT');
  assert.equal(result.guestGroups[0].ratePercent,0.5);
  assert.equal(result.totalCents,'25941');
});

test('Ivano-Frankivsk 2026 local rate is sourced, calculated and published',()=>{
  const place=touristTaxPlaces.find(item=>item.slug==='ivano-frankivsk');
  const community=touristTaxCommunities.find(item=>item.slug===place.communitySlug);
  assert.equal(place.katottgSettlementCode,'UA26040190010045761');
  assert.equal(community.katottgCode,'UA26040190000081578');
  assert.equal(community.taxRule.status,'VERIFIED');
  assert.equal(community.taxRule.decisionNumber,'140-43');
  assert.equal(community.taxRule.effectiveFrom,'2025-01-01');
  assert.deepEqual(community.taxRule.rates,{domestic:0.3,inbound:1});
  assert.equal(canCalculateTouristTaxPlace(place),true);
  assert.equal(canIndexTouristTaxPlace(place),true);
  assert.equal(place.readiness.uniqueContentApproved,true);
  assert.equal(place.readiness.seoQaPassed,true);
  assert.equal(place.editorial.seoBlock.sections.length,6);
  const page=renderTouristTaxCity(place.slug);
  assert.match(page,/<meta name="robots" content="index,follow">/);
  assert.match(page,/140-43/);
  assert.match(page,/tax\.gov\.ua\/data\/material/);
  const cases=[
    {category:'domestic',rate:0.3,cents:'2594'},
    {category:'inbound',rate:1,cents:'8647'},
  ];
  for(const example of cases){
    const result=calculateTouristTax({placeSlug:'ivano-frankivsk',start:'2026-10-10',days:1,guestGroups:[{category:example.category,guests:1}]});
    assert.equal(result.state,'VERIFIED_RESULT');
    assert.equal(result.guestGroups[0].ratePercent,example.rate);
    assert.equal(result.totalCents,example.cents);
  }
});

test('Cherkasy 2026 rates match official DPS and council data and calculator examples',()=>{
  const place=touristTaxPlaces.find(item=>item.slug==='cherkasy');
  const community=touristTaxCommunities.find(item=>item.slug===place.communitySlug);
  assert.equal(place.katottgSettlementCode,'UA71080490010015879');
  assert.equal(community.katottgCode,'UA71080490000022110');
  assert.equal(community.taxRule.status,'VERIFIED');
  assert.equal(community.taxRule.decisionNumber,'2-4690');
  assert.equal(community.taxRule.effectiveFrom,'2026-01-01');
  assert.equal(community.taxRule.effectiveTo,'2026-12-31');
  assert.deepEqual(community.taxRule.rates,{domestic:0.5,inbound:5});
  assert.equal(canCalculateTouristTaxPlace(place),true);
  assert.equal(canIndexTouristTaxPlace(place),true);
  assert.equal(place.editorial.seoBlock.sections.length,7);
  const cases=[
    {category:'domestic',rate:0.5,cents:'4324'},
    {category:'inbound',rate:5,cents:'43235'},
  ];
  for(const example of cases){
    const result=calculateTouristTax({placeSlug:'cherkasy',start:'2026-10-10',days:1,guestGroups:[{category:example.category,guests:1}]});
    assert.equal(result.state,'VERIFIED_RESULT');
    assert.equal(result.guestGroups[0].ratePercent,example.rate);
    assert.equal(result.totalCents,example.cents);
  }
});

test('published city SEO calculation examples match the exact calculator',()=>{
  const examples=[
    {slug:'berehove',rate:0.25,guests:2,days:2,category:'domestic',amount:'86.47'},
    {slug:'cherkasy',rate:0.5,guests:2,days:2,category:'domestic',amount:'172.94'},
    {slug:'chernihiv',rate:0.5,guests:2,days:3,category:'domestic',amount:'259.41'},
    {slug:'lutsk',rate:1.5,guests:1,days:2,category:'inbound',amount:'259.41'},
    {slug:'sumy',rate:0.5,guests:1,days:4,category:'domestic',amount:'172.94'},
    {slug:'vinnytsya',rate:1.5,guests:2,days:3,category:'inbound',amount:'778.23'},
    {slug:'pivdenne',rate:0.5,guests:3,days:4,category:'domestic',amount:'518.82'},
    {slug:'rivne',rate:0.25,guests:2,days:3,category:'domestic',amount:'129.71'},
  ];
  for(const example of examples){
    const place=touristTaxPlaces.find(item=>item.slug===example.slug);
    const exampleText=place.editorial.seoBlock.sections.at(-1).paragraphs.join(' ');
    assert.ok(exampleText.includes(`${example.amount.replace('.',',')} грн`),`${example.slug} SEO example should state the expected amount`);
    assert.ok(renderTouristTaxCity(example.slug).includes(`${example.amount.replace('.',',')} грн`),`${example.slug} rendered page should display its example`);
    const exactCents=calculateExactTouristTaxCents({minimumWage:8647,ratePercent:example.rate,guests:example.guests,nights:example.days});
    assert.equal(exactCents.toString(),example.amount.replace('.',''),`${example.slug} example should match exact rounding`);
    const result=calculateTouristTax({placeSlug:example.slug,start:'2026-10-01',days:example.days,guestGroups:[{category:example.category,guests:example.guests}]});
    assert.equal(result.totalCents,exactCents.toString(),`${example.slug} example should match calculator output`);
  }
});

test('Berehove 2026 rate, geography, calculation period and page copy use the DPS form evidence',()=>{
  const place=touristTaxPlaces.find(item=>item.slug==='berehove');
  const community=touristTaxCommunities.find(item=>item.slug===place.communitySlug);
  assert.equal(place.katottgSettlementCode,'UA21020030010083215');
  assert.equal(community.katottgCode,'UA21020030000019624');
  assert.equal(place.geoStatus,'ELIGIBLE');
  assert.equal(community.taxRule.status,'VERIFIED');
  assert.equal(community.taxRule.decisionNumber,'794');
  assert.deepEqual(community.taxRule.rates,{domestic:0.25,inbound:0.25});
  assert.equal(community.taxRule.effectiveFrom,'2022-01-01');
  assert.equal(community.taxRule.effectiveTo,'2026-12-31');
  assert.equal(canCalculateTouristTaxPlace(place),true);
  assert.equal(canIndexTouristTaxPlace(place),true);
  assert.equal(calculateTouristTax({placeSlug:'berehove',start:'2026-10-14',days:2,guestGroups:[{category:'domestic',guests:2}]}).totalCents,'8647');
  assert.equal(calculateTouristTax({placeSlug:'berehove',start:'2027-01-01',days:2,guestGroups:[{category:'domestic',guests:2}]}).state,'RATE_OUT_OF_PERIOD');
  const page=renderTouristTaxCity('berehove');
  assert.match(page,/Ставку звірено 14 жовтня 2026 року/);
  assert.match(page,/Наступна планова перевірка джерел: до 1 грудня 2026 року/);
  assert.match(page,/0,25%/);
});

test('Bar 2026 rate evidence is recorded while publication stays blocked pending full act review',()=>{
  const place=touristTaxPlaces.find(item=>item.slug==='bar');
  const community=touristTaxCommunities.find(item=>item.slug===place.communitySlug);
  assert.equal(community.katottgCode,'UA05060010000053179');
  assert.equal(community.taxRule.status,'VERIFIED');
  assert.equal(community.taxRule.decisionNumber,'19');
  assert.deepEqual(community.taxRule.rates,{domestic:0.4,inbound:1});
  assert.deepEqual(community.taxRule.proposedRates,{domestic:0.25,inbound:1});
  assert.equal(community.taxRule.effectiveFrom,'2022-01-01');
  assert.equal(community.taxRule.effectiveTo,'2026-12-31');
  assert.equal(place.katottgSettlementCode,'UA05060010010059821');
  assert.equal(place.geoStatus,'REVIEW_REQUIRED');
  assert.equal(canCalculateTouristTaxPlace(place),false);
  assert.equal(touristTaxCityRoutes().includes(place.route),false);
  assert.equal(renderTouristTaxCity(place.slug),null);
  assert.equal(calculateTouristTax({placeSlug:'bar',start:'2026-10-10',days:1,guestGroups:[{category:'domestic',guests:1}]}).state,'AMBIGUOUS_PLACE');
});

test('Chernivtsi 2026 official schedule, city boundary and calculator are verified',()=>{
  const place=touristTaxPlaces.find(item=>item.slug==='chernivtsi');
  const community=touristTaxCommunities.find(item=>item.slug===place.communitySlug);
  assert.equal(place.katottgSettlementCode,'UA73060610010033137');
  assert.equal(community.katottgCode,'UA73060610000066784');
  assert.equal(community.taxRule.status,'VERIFIED');
  assert.equal(community.taxRule.decisionNumber,'1635');
  assert.deepEqual(community.taxRule.rates,{domestic:0.3,inbound:0.3});
  assert.equal(community.taxRule.effectiveFrom,'2026-01-01');
  assert.equal(community.taxRule.effectiveTo,'2026-12-31');
  assert.equal(place.geoStatus,'ELIGIBLE');
  assert.equal(canCalculateTouristTaxPlace(place),true);
  assert.equal(canIndexTouristTaxPlace(place),true);
  assert.equal(touristTaxCityRoutes().includes(place.route),true);
  const page=renderTouristTaxCity(place.slug);
  assert.match(page,/<meta name="robots" content="index,follow">/);
  assert.match(page,/0,3\s*%|0,3%/);
  assert.match(page,/підписана форма №6 ДПС/i);
  assert.match(page,/UA73060610010033137/);
  assert.equal(calculateTouristTax({placeSlug:'chernivtsi',start:'2026-10-10',days:2,guestGroups:[{category:'domestic',guests:3}]}).totalCents,'15565');
  assert.equal(calculateTouristTax({placeSlug:'chernivtsi',start:'2026-10-10',days:1,guestGroups:[{category:'inbound',guests:1}]}).totalCents,'2594');
  assert.equal(calculateTouristTax({placeSlug:'chernivtsi',start:'2027-01-01',days:1,guestGroups:[{category:'domestic',guests:1}]}).state,'RATE_OUT_OF_PERIOD');
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

test('directory and all reviewed city pages are indexable and included in the sitemap',()=>{
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
  assert.equal(touristTaxSources.territoryList.currentAsOf,'2026-08-21');
  assert.equal(touristTaxSources.territoryList.matchedToKatottg,false);
  assert.match(city,/Податковий кодекс України, стаття 268/);
  assert.doesNotMatch(`${hub}${city}`,/наказ №376|z0782-26|z1117-26/i);
  assert.doesNotMatch(`${hub}${city}`,/пілот|на перевірці|ще перевіряємо/i);
  const routes=getPublicSitemapRoutes({seoRoutes:[],caseSlugs:[],pmsArticle:{slug:'/blog/a'},pmsChoiceArticle:{slug:'/blog/b'},editorialArticles:[],secondPassArticles:[],touristTaxRoutes:['/tourist-tax/',...touristTaxCityRoutes()]});
  assert.ok(routes.includes('/tourist-tax/'));
  assert.ok(routes.includes('/tourist-tax/lutsk/'));
  for(const route of ['/tourist-tax/sumy/','/tourist-tax/vinnytsya/','/tourist-tax/pivdenne/'])assert.ok(routes.includes(route));
  assert.equal(routes.filter(route=>route.startsWith('/tourist-tax/')&&route!=='/tourist-tax/').length,16);
  assert.ok(routes.includes('/tourist-tax/ternopil/'));
  assert.ok(routes.includes('/tourist-tax/zaporizhzhya/'));
});

test('Uzhhorod and Slavsko use the signed 2026 universal Form 6 rates and disclose conflicts',()=>{
  const uzhhorod=calculateTouristTax({placeSlug:'uzhhorod',start:'2026-10-10',days:2,guestGroups:[{category:'domestic',guests:2}]});
  const slavsko=calculateTouristTax({placeSlug:'slavsko',start:'2026-10-10',days:2,guestGroups:[{category:'domestic',guests:2}]});
  assert.equal(uzhhorod.state,'VERIFIED_RESULT');
  assert.equal(uzhhorod.totalCents,'17294');
  assert.equal(slavsko.state,'VERIFIED_RESULT');
  assert.equal(slavsko.totalCents,'6918');
  for(const slug of ['uzhhorod','slavsko']){
    const place=touristTaxPlaces.find(item=>item.slug===slug);
    const rule=touristTaxCommunities.find(item=>item.slug===place.communitySlug).taxRule;
    assert.ok(rule.supportingSources.some(source=>source.url.includes('tax.gov.ua/data/material/')));
    const html=renderTouristTaxCity(slug);
    assert.match(html,/Зірочка до ставки/);
    assert.match(html,/Excel/);
  }
});

test('every published city with an Excel rate mismatch marks the public rate and explains the source choice',()=>{
  const conflictingPlaces=touristTaxReleasePlan.waves[0].publishedSlugs
    .map(slug=>touristTaxPlaces.find(place=>place.slug===slug))
    .filter(place=>{
      const candidate=place?.sourceRecord?.proposedRates;
      const rule=place&&touristTaxCommunities.find(community=>community.slug===place.communitySlug)?.taxRule;
      return Number.isFinite(candidate?.domestic)&&Number.isFinite(candidate?.inbound)&&(
        Boolean(rule?.rateSchedule)||candidate.domestic!==rule?.rates?.domestic||candidate.inbound!==rule?.rates?.inbound
      );
    });
  assert.equal(conflictingPlaces.length,14);
  for(const place of conflictingPlaces){
    const html=renderTouristTaxCity(place.slug);
    assert.ok(html,`published city page should render: ${place.slug}`);
    assert.match(html,/<strong>[^<]*%\*<\/strong>/,`verified rate should carry an asterisk: ${place.slug}`);
    assert.match(html,/Excel/,`page should explain the workbook discrepancy: ${place.slug}`);
    if(place.slug!=='uzhhorod'&&place.slug!=='slavsko')assert.match(html,/офіційного джерела|офіційне джерело|тарифні діапазони/i,`page should explain the selected official value/model: ${place.slug}`);
  }
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
  assert.deepEqual(report.counts,{all:377,eligible:16,excluded:0,reviewRequired:361});
  assert.equal(touristTaxCommunities.length,280);
  assert.equal(touristTaxSources.katottg.imported,true);
  assert.equal(touristTaxPlaces.filter(place=>place.katottgSettlementCode).length,364);
  assert.equal(touristTaxPlaces.filter(place=>place.district).length,363);
  assert.equal(touristTaxPlaces.find(place=>place.slug==='bar')?.katottgSettlementCode,'UA05060010010059821');
  assert.equal(touristTaxPlaces.find(place=>place.slug==='pivdenne')?.katottgSettlementCode,'UA51100410010044384');
  assert.equal(touristTaxPlaces.find(place=>place.slug==='yuzhnoukrayinsk')?.katottgSettlementCode,'UA48040250010045068');
  assert.equal(touristTaxPlaces.find(place=>place.slug==='kolomyya')?.katottgSettlementCode,'UA26080070010075786');
  assert.equal(touristTaxCommunities.find(community=>community.slug===touristTaxPlaces.find(place=>place.slug==='kolomyya')?.communitySlug)?.katottgCode,'UA26080070000092582');
  const expectedQualifiedMatches={
    'buky-cherkaska':'UA71060050010072245',
    'buky-kyyivska':'UA32020150040057367',
    'karpaty-selyshche':'UA21040250080037844',
    'melnyky-kholodnyy-yar':'UA71080230060050532',
    'oleksandriya-rivnenska':'UA56060430010051905',
    'shepit-chernivetska':'UA73020150100021548',
    'shepit-kosivskyy':'UA26100010130039840',
    'trostyanets-chernihivska':'UA74080110210090525',
    'yavoriv-kosivskyy':'UA26100010150096657',
  };
  for(const [slug,code] of Object.entries(expectedQualifiedMatches))assert.equal(touristTaxPlaces.find(place=>place.slug===slug)?.katottgSettlementCode,code,`${slug} should resolve via the exact locality, oblast, and community after dropping only its editorial parenthetical`);
  for(const slug of ['kolochava-muzeyi','opishnya-muzey','skhidnytsya-selyshche'])assert.equal(touristTaxPlaces.find(place=>place.slug===slug)?.katottgSettlementCode,null,`${slug} must not duplicate an existing settlement code`);
  assert.ok(touristTaxPlaces.find(place=>place.slug==='kyyiv')?.katottgSettlementCode,'Kyiv must retain its special-city code');
  assert.ok(touristTaxPlaces.filter(place=>place.district).every(place=>place.district.endsWith(' район')),'district labels should come from official KATOTTG names');
  assert.equal(touristTaxCommunities.filter(community=>community.katottgCode).length,279);
  const ivanoFrankivskSolotvyn= touristTaxPlaces.find(place=>place.slug==='huta');
  const zakarpattiaSolotvyn= touristTaxPlaces.find(place=>place.slug==='solotvyno');
  assert.notEqual(ivanoFrankivskSolotvyn.communitySlug,zakarpattiaSolotvyn.communitySlug,'same-name communities in different oblasts must remain separate');
  assert.notEqual(touristTaxCommunities.find(item=>item.slug===ivanoFrankivskSolotvyn.communitySlug).katottgCode,touristTaxCommunities.find(item=>item.slug===zakarpattiaSolotvyn.communitySlug).katottgCode);
  assert.equal(new Set(touristTaxCommunities.map(community=>community.katottgCode).filter(Boolean)).size,touristTaxCommunities.filter(community=>community.katottgCode).length,'mapped community codes must be unique');
  assert.equal(new Set(touristTaxPlaces.map(place=>place.editorial.title)).size,377,'every city route must have a unique title');
  assert.equal(new Set(touristTaxPlaces.map(place=>place.editorial.seoBlock.title)).size,377,'every city route must have a unique H1');
  assert.equal(report.warnings.length,361);
  assert.equal(touristTaxCityRoutes().length,16);
  const unsafe={...touristTaxPlaces[0],readiness:{...touristTaxPlaces[0].readiness,seoQaPassed:false}};
  assert.ok(validateTouristTaxPlaces([unsafe]).errors.some(error=>error.includes('incomplete readiness gates')));
});

test('imported city drafts stay unavailable until explicitly released and verified',()=>{
  const page=renderTouristTaxCity('aktove');
  assert.equal(page,null);
  assert.equal(renderTouristTaxCity('not-a-place'),null);
  const result=calculateTouristTax({placeSlug:'aktove',start:'2026-10-10',days:1,guestGroups:[{category:'domestic',guests:1}]});
  assert.equal(result.state,'RATE_UNVERIFIED');
});

test('review export keeps proposed rates separate from verified rates',()=>{
  const csv=exportTouristTaxReviewCsv();
  assert.match(csv,/proposed_domestic_rate_unverified/);
  assert.match(csv,/"rate_model","rate_schedule","domestic_rate_percent","inbound_rate_percent"/);
  const ternopilRow=csv.split(/\r?\n/).find(line=>line.startsWith('"ternopil"'));
  assert.match(ternopilRow,/"BANDED","\{""thresholdUahPerPersonPerDay"":320/);
  assert.match(ternopilRow,/"","","VERIFIED"/);
  assert.match(csv,/SECONDARY_SOURCE_ONLY/);
  assert.match(csv,/CONFLICT/);
  assert.match(csv,/Актове/);
});
