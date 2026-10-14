import {writeTouristTaxEditorialExports} from '../versions/v1/tourist-tax.mjs';

const outputDirectory=await writeTouristTaxEditorialExports();
console.log(`Tourist-tax review exports written to ${outputDirectory}`);
