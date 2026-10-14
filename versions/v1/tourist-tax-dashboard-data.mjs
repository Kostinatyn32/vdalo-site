// Snapshot transcribed from the official DPS Power BI dashboard on 2026-10-14.
// Amounts are reported for I–II quarters of 2026 and remain a dated snapshot.
export const touristTaxDashboard2026 = Object.freeze({
  period: 'I–II квартали 2026 року',
  checkedAt: '2026-10-14',
  sourcePublishedAt: '2026-09-22',
  powerBiUrl: 'https://app.powerbi.com/view?language=uk-UA&pageName=9e35193637c9663169e4&r=eyJrIjoiM2Y3MjIxNjktN2I0ZC00MjU5LTlhMTktYWUwZWFmY2U3NDg0IiwidCI6ImZjYjFmYmY4LThlMjItNGU3Ny1iZGU0LTcwNDdhMjI5YjVkOCIsImMiOjl9',
  kpis: Object.freeze({
    reportingAgents: 7065,
    payingAgents: 5460,
    accommodationObjects: 8490,
    declaredThousandUah: 186564.77,
    paidThousandUah: 174851.78,
    accommodationDaysThousand: 4824.78
  }),
  declaredByPayer: Object.freeze([
    Object.freeze({ label: 'ФОП', amountUah: 83584235.67, sharePercent: 44.8 }),
    Object.freeze({ label: 'Юридичні особи', amountUah: 102980533.62, sharePercent: 55.2 })
  ]),
  paidByPayer: Object.freeze([
    Object.freeze({ label: 'ФОП', amountUah: 76991850.19, sharePercent: 44.03 }),
    Object.freeze({ label: 'Юридичні особи', amountUah: 97859926.52, sharePercent: 55.97 })
  ]),
  accommodationDaysByTourism: Object.freeze([
    Object.freeze({ label: 'Внутрішній туризм', amount: 4487828, sharePercent: 93.02 }),
    Object.freeze({ label: 'В’їзний туризм', amount: 336951, sharePercent: 6.98 })
  ]),
  quarterly: Object.freeze([
    Object.freeze({ quarter: 'I квартал 2026', declaredFopUah: 37645434.91, declaredLegalUah: 50126410.71, paidFopUah: 37248169.29, paidLegalUah: 44915210.08, daysFop: 1038721, daysLegal: 1223434 }),
    Object.freeze({ quarter: 'II квартал 2026', declaredFopUah: 45938800.76, declaredLegalUah: 52854122.91, paidFopUah: 39743680.90, paidLegalUah: 52944716.44, daysFop: 1280280, daysLegal: 1282344 })
  ]),
  // Regional table copied from the dashboard's "Таблиця" page with default filters.
  // Monetary values are shown by DPS in thousand UAH. Rate cells preserve the report's display.
  byRegion: Object.freeze([
    Object.freeze({ name: 'Вінницька', agents: 256, domesticDays: 87008, domesticRate: '0', inboundDays: 1193, inboundRate: '0', declaredThousandUah: 3554.51, paidThousandUah: 3067.28 }),
    Object.freeze({ name: 'Волинська', agents: 241, domesticDays: 67335, domesticRate: '0', inboundDays: 2111, inboundRate: '0', declaredThousandUah: 2828.65, paidThousandUah: 2225.48 }),
    Object.freeze({ name: 'Дніпропетровська', agents: 368, domesticDays: 204445, domesticRate: '0', inboundDays: 14844, inboundRate: '0', declaredThousandUah: 9779.70, paidThousandUah: 8499.23 }),
    Object.freeze({ name: 'Донецька', agents: 19, domesticDays: 143, domesticRate: '0', inboundDays: 0, inboundRate: '0', declaredThousandUah: 4.60, paidThousandUah: 18.68 }),
    Object.freeze({ name: 'Житомирська', agents: 136, domesticDays: 60272, domesticRate: '0', inboundDays: 2502, inboundRate: '0', declaredThousandUah: 2345.63, paidThousandUah: 2164.45 }),
    Object.freeze({ name: 'Закарпатська', agents: 720, domesticDays: 474443, domesticRate: '0', inboundDays: 6954, inboundRate: '0', declaredThousandUah: 18073.43, paidThousandUah: 16758.36 }),
    Object.freeze({ name: 'Запорізька', agents: 70, domesticDays: 27935, domesticRate: '0', inboundDays: 960, inboundRate: '0', declaredThousandUah: 1105.10, paidThousandUah: 983.11 }),
    Object.freeze({ name: 'Івано-Франківська', agents: 1159, domesticDays: 789301, domesticRate: '0', inboundDays: 18889, inboundRate: '0', declaredThousandUah: 26246.51, paidThousandUah: 28654.45 }),
    Object.freeze({ name: 'Київська', agents: 383, domesticDays: 286318, domesticRate: '0.05–0.5', inboundDays: 2248, inboundRate: '0', declaredThousandUah: 12492.68, paidThousandUah: 9878.15 }),
    Object.freeze({ name: 'Кіровоградська', agents: 95, domesticDays: 31211, domesticRate: '0.1', inboundDays: 305, inboundRate: '0', declaredThousandUah: 1043.21, paidThousandUah: 1060.00 }),
    Object.freeze({ name: 'Луганська', agents: 1, domesticDays: 0, domesticRate: '0', inboundDays: 0, inboundRate: '0', declaredThousandUah: 0, paidThousandUah: null }),
    Object.freeze({ name: 'Львівська', agents: 1062, domesticDays: 1049435, domesticRate: '0', inboundDays: 50562, inboundRate: '0', declaredThousandUah: 35822.10, paidThousandUah: 33959.57 }),
    Object.freeze({ name: 'Миколаївська', agents: 139, domesticDays: 24455, domesticRate: '0', inboundDays: 5353, inboundRate: '0', declaredThousandUah: 1069.65, paidThousandUah: 1106.26 }),
    Object.freeze({ name: 'Одеська', agents: 669, domesticDays: 209024, domesticRate: '0', inboundDays: 5234, inboundRate: '0', declaredThousandUah: 8471.56, paidThousandUah: 5559.50 }),
    Object.freeze({ name: 'Полтавська', agents: 216, domesticDays: 117507, domesticRate: '0', inboundDays: 1101, inboundRate: '0', declaredThousandUah: 4590.23, paidThousandUah: 4216.54 }),
    Object.freeze({ name: 'Рівненська', agents: 140, domesticDays: 66693, domesticRate: '0', inboundDays: 15260, inboundRate: '0', declaredThousandUah: 3085.64, paidThousandUah: 3142.99 }),
    Object.freeze({ name: 'Сумська', agents: 66, domesticDays: 21572, domesticRate: '0', inboundDays: 697, inboundRate: '0', declaredThousandUah: 836.28, paidThousandUah: 806.67 }),
    Object.freeze({ name: 'Тернопільська', agents: 130, domesticDays: 44492, domesticRate: '0', inboundDays: 2381, inboundRate: '0', declaredThousandUah: 1298.37, paidThousandUah: 1280.64 }),
    Object.freeze({ name: 'Харківська', agents: 128, domesticDays: 43133, domesticRate: '0', inboundDays: 4532, inboundRate: '0', declaredThousandUah: 2689.13, paidThousandUah: 2458.04 }),
    Object.freeze({ name: 'Херсонська', agents: 25, domesticDays: 0, domesticRate: '0', inboundDays: 0, inboundRate: '0', declaredThousandUah: 0, paidThousandUah: 5.50 }),
    Object.freeze({ name: 'Хмельницька', agents: 247, domesticDays: 121757, domesticRate: '0', inboundDays: 7491, inboundRate: '0', declaredThousandUah: 5333.23, paidThousandUah: 4333.60 }),
    Object.freeze({ name: 'Черкаська', agents: 166, domesticDays: 92692, domesticRate: '0', inboundDays: 3013, inboundRate: '0', declaredThousandUah: 4542.07, paidThousandUah: 4181.41 }),
    Object.freeze({ name: 'Чернівецька', agents: 173, domesticDays: 75774, domesticRate: '0', inboundDays: 2375, inboundRate: '0', declaredThousandUah: 2240.74, paidThousandUah: 2401.46 }),
    Object.freeze({ name: 'Чернігівська', agents: 74, domesticDays: 26486, domesticRate: '0', inboundDays: 1903, inboundRate: '0', declaredThousandUah: 959.11, paidThousandUah: 810.01 }),
    Object.freeze({ name: 'Київ', agents: 382, domesticDays: 566397, domesticRate: '0.004–4', inboundDays: 187043, inboundRate: '0.1–5', declaredThousandUah: 38152.65, paidThousandUah: 34946.02 })
  ])
});
