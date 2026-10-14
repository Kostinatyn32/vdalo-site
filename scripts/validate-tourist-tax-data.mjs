import {touristTaxPlaces,touristTaxSources,validateTouristTaxPlaces} from '../versions/v1/tourist-tax-data.mjs';

const report=validateTouristTaxPlaces();
console.log(JSON.stringify({...report,officialKatottgWorkbookImported:touristTaxSources.katottg.imported,placesMissingSettlementCode:touristTaxPlaces.filter(place=>!place.katottgSettlementCode).map(place=>place.slug)},null,2));
if(!report.ok)process.exitCode=1;
