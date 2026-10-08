export const experiments={
 trialApproved:false,
 researchIncentiveApproved:false,
 researchIncentiveMonths:null,
 switchCommercialApproved:false,
 trialDays:null,
 researchIncentiveDays:null,
 switchFreeMonthEnabled:false,
 foundingHotelCohortSize:null,
 foundingBenefits:[],
 researchReportCommitted:false,
 auditDuration:null,
 auditDeliverables:[],
};
export const processes=[
 ['guest-requests','Запити гостей'],['reservations','Бронювання'],['check-in','Заселення'],
 ['housekeeping','Прибирання та готовність номерів'],['coordination','Передача інформації'],['reporting','Регулярна звітність'],['other','Інший процес']
];
export const crmStages=['NEW','CONTACTED','ENGAGED','DECISION_MAKER_FOUND','QUALIFIED','OFFER_ACCEPTED','BOOKED','HELD_OR_ACTIVATED','PILOT','COMMERCIAL','WON','LOST','LATER','DO_NOT_CONTACT'];
export const settings={
 canonicalOrigin:'https://vdalo.tech',
 analyticsVersion:'1.0',
 submissionPath:'/api/funnel/leads',
};
export function deliveryConfig(offerId){
 const key=offerId.toUpperCase().replaceAll('-','_');
 return {
  endpoint:process.env[`VDALO_FUNNEL_${key}_WEBHOOK_URL`]||process.env.VDALO_FUNNEL_WEBHOOK_URL||'',
  token:process.env.VDALO_FUNNEL_WEBHOOK_TOKEN||'',
  legalName:process.env.VDALO_FUNNEL_LEGAL_NAME||'',
  privacyEmail:process.env.VDALO_FUNNEL_PRIVACY_EMAIL||'',
  retention:process.env.VDALO_FUNNEL_RETENTION||'',
 };
}
export function deliveryReady(offerId){
 const c=deliveryConfig(offerId);
 try{return Boolean(c.legalName&&c.privacyEmail&&c.retention&&new URL(c.endpoint).protocol==='https:');}catch{return false;}
}
