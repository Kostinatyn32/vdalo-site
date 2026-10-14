import {touristTaxPlaces,touristTaxSources,validateTouristTaxPlaces} from '../versions/v1/tourist-tax-data.mjs';

const report=validateTouristTaxPlaces();
const placesMissingSettlementCode=touristTaxPlaces.filter(place=>!place.katottgSettlementCode).map(place=>place.slug);
console.log(JSON.stringify({ok:report.ok,errors:report.errors,counts:report.counts,reviewWarnings:report.warnings.length,reviewWarningExamples:report.warnings.slice(0,8),officialKatottgWorkbookImported:touristTaxSources.katottg.imported,placesMissingSettlementCodeCount:placesMissingSettlementCode.length,placesMissingSettlementCodeExamples:placesMissingSettlementCode.slice(0,12)},null,2));
if(!report.ok)process.exitCode=1;
