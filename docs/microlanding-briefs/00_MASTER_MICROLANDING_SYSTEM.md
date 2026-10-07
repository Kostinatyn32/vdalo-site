---
project: VDALO
market: Ukraine
artifact: microlanding_brief
version: 1.0
date: 2026-10-07
brand_rule: "VDALO = Ukraine"
punctuation_rule: "Do not use U+2014"
---


# VDALO | MASTER MICROLANDING SYSTEM

## 1. Мета системи

Побудувати набір окремих мікролендінгів для різних станів і мотивацій потенційного клієнта.

Ключовий принцип:

`одна аудиторія -> один primary offer -> одна primary CTA -> один наступний крок`

Не показувати холодному ліду всі пропозиції одночасно.

Головний сайт VDALO може залишатися продуктовим центром. Мікролендінги виконують функцію conversion pages для конкретних outbound-кампаній, сегментів і рекламних повідомлень.

## 2. Канали трафіку

Основні джерела:

1. SMS через TurboSMS.
2. Email outreach.
3. Telegram.
4. Viber.
5. Дзвінок після першого контакту.
6. Профільні спільноти готельєрів.
7. Partner / referral traffic.
8. Ретаргетинг і повторний nurture після першої взаємодії.

Для кожного каналу формувати окремий UTM.

Приклад:

`utm_source=turbosms`
`utm_medium=outbound`
`utm_campaign=vdalo_audit_01`
`utm_content=hook_manual_work`

## 3. Бібліотека мікролендінгів

| ID | Landing | Audience state | Primary offer | Status |
|---|---|---|---|---|
| ML-01 | Audit | cold / problem-aware | Безкоштовний аудит процесів | CURRENT ROUTE, exact scope to approve |
| ML-02 | Research Partner | готовий дати feedback | Інтерв'ю + 30 днів VDALO | EXPERIMENT |
| ML-03 | Trial | high intent / actively evaluating PMS | 14 днів VDALO | EXPERIMENT |
| ML-04 | Switch | already uses another PMS | Перехід + перший місяць без абонплати | EXPERIMENT |
| ML-05 | One Process | cold / pain-aware | Розбір одного процесу | EXPERIMENT |
| ML-06 | PMS Health Check | existing PMS user | Перевірка поточної PMS | EXPERIMENT |
| ML-07 | Founding Hotels | high fit / design partner | Спецпрограма перших готелів | EXPERIMENT |
| ML-08 | Industry Research | low intent / community / nurture | Опитування + галузевий звіт | EXPERIMENT |

## 4. Рекомендовані URL

- `/audit`
- `/research`
- `/trial`
- `/switch`
- `/one-process`
- `/pms-check`
- `/founding-hotels`
- `/hotel-research`

URL є рекомендованою IA. Перед публікацією перевірити фактичний роутинг сайту.

## 5. Routing logic

### Нічого не знаємо про ліда

Початкові офери:

- Audit
- One Process
- Industry Research

### Лід готовий поговорити про роботу готелю

Маршрут:

`Audit / One Process -> Discovery -> Qualified next step`

### Лід активно шукає PMS

Маршрут:

`Trial -> Onboarding -> Activation -> Usage review -> Commercial`

### Лід уже використовує іншу PMS

Маршрут:

`PMS Health Check -> Stay / Gap / Switch`

Якщо migration реально виправдана:

`Switch -> Migration assessment -> Trial / Pilot -> Commercial`

### Лід готовий допомогти продукту

Маршрут:

`Research Partner -> Interview -> Product access if approved -> Second interview -> Pilot / Paid`

### Сильний design-partner fit

Маршрут:

`Founding Hotels -> Qualification -> Agreement on feedback -> Onboarding / Pilot -> Case eligibility`

### Не зараз

Маршрут:

`Nurture -> useful content / research report / product update -> reactivation`

### Явна відмова

Маршрут:

`Do not contact / suppression`

## 6. Спільна message hierarchy

### Brand

`VDALO`

### Brand tagline

`Керуйте готелем вдало.`

### Category direction

`PMS та автоматизація щоденної роботи готелю.`

### Benefit direction

`Менше ручної роботи. Більше контролю над готелем.`

На мікролендінгах не потрібно повторювати всі бренд-фрази. Кожна сторінка має починатися з конкретного оферу.

## 7. Shared conversion rules

1. Один dominant CTA у hero.
2. Secondary CTA тільки якщо вона не конкурує з primary.
3. CTA має вести саме до обіцяної дії.
4. Не показувати fake success після форми.
5. Не збирати паролі, дані карток, паспортні дані гостей, API secrets або door codes.
6. Не вимагати довгого технічного брифу на першому кроці.
7. Краще 3-5 полів, ніж 10-15.
8. Якщо потрібна qualification, виконувати її після первинної заявки або через progressive disclosure.
9. Message-app click не дорівнює qualified lead.
10. Form submit не дорівнює проведеному аудиту, trial activation або sale.

## 8. Shared form fields

Базовий мінімум:

- Ім'я.
- Назва готелю / об'єкта.
- Телефон або email.
- Кількість номерів / юнітів, якщо потрібна qualification.

Опціонально залежно від landing:

- Поточна PMS.
- Тип об'єкта.
- Основна проблема.
- Що хочете протестувати.
- Готовність до інтерв'ю.
- Бажаний канал зв'язку.

## 9. Shared CRM stages

`NEW`
`CONTACTED`
`ENGAGED`
`DECISION_MAKER_FOUND`
`QUALIFIED`
`OFFER_ACCEPTED`
`BOOKED`
`HELD_OR_ACTIVATED`
`PILOT`
`COMMERCIAL`
`WON`
`LOST`
`LATER`
`DO_NOT_CONTACT`

На кожен touch:

- source
- channel
- campaign
- offer
- message_variant
- timestamp
- response
- objection
- current_PMS
- room_count
- next_step
- next_step_date

## 10. Shared analytics events

- `page_view`
- `primary_cta_click`
- `secondary_cta_click`
- `form_open`
- `form_start`
- `form_success`
- `form_error`
- `messenger_click`
- `calendar_open`
- `meeting_booked`
- `qualified_lead`
- `meeting_held`
- `trial_started`
- `trial_activated`
- `audit_held`
- `pilot_started`
- `commercial_sent`
- `paid_started`

Не всі події потрібні на кожній сторінці.

## 11. Claims gate

Не публікувати без окремого підтвердження:

- конкретну ціну;
- ROI;
- конкретний % економії;
- 80% автоматизації запитань;
- 100% захист від overbooking;
- 30% економії енергії;
- universal PMS / OTA / lock / PSP compatibility;
- SLA;
- 24/7 human support;
- customer count;
- fabricated logos, reviews or case studies;
- гарантію повної автоматизації готелю.

## 12. Offer status discipline

### CURRENT

Безкоштовний аудит є чинним route, але exact free scope має бути операційно затверджений.

### EXPERIMENT

Наступні умови не вважати current commercial terms, доки команда їх явно не затвердить:

- 14-денний trial.
- 30 днів VDALO за research interview.
- перший місяць без абонплати при переході.
- спеціальні умови Founding Hotels.
- кількість місць у програмі.
- migration promise.
- безкоштовний PMS Health Check.

У коді зберігати такі параметри в конфігурації, а не хардкодити в компоненти.

## 13. A/B testing rule

Не тестувати одночасно:

`3 сайти x 8 оферів x 4 канали x 4 hooks`

Перший рівень тесту:

`один landing + один offer + 2 hooks`

Другий рівень:

`winner offer + SMS-first vs Email-first`

Третій рівень:

`winner offer + hero / CTA variants`

## 14. Recommended first outbound test

Почати не з усіх 1000 контактів.

Розділити на тестові когорти.

Наприклад:

- Audit.
- Research Partner.
- Trial.
- Switch.
- One Process.

Не встановлювати conversion targets як факт до отримання власного dataset.

## 15. Файли в пакеті

1. `01_AUDIT.md`
2. `02_RESEARCH_PARTNER.md`
3. `03_TRIAL_14_DAYS.md`
4. `04_SWITCH_FROM_PMS.md`
5. `05_ONE_PROCESS.md`
6. `06_PMS_HEALTH_CHECK.md`
7. `07_FOUNDING_HOTELS.md`
8. `08_INDUSTRY_RESEARCH.md`
9. `09_SHARED_ANALYTICS_CRM_ROUTING.md`
10. `10_CODEX_IMPLEMENTATION_BRIEF.md`
