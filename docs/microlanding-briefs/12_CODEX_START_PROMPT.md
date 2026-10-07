---
project: VDALO
artifact: codex_start_prompt
version: 2.0
date: 2026-10-07
---

# START PROMPT FOR CODEX

Працюй з поточним сайтом VDALO і вже створеними мікролендінгами.

Твоя задача: не створювати новий сайт з нуля, а перепрацювати існуючі funnel landing pages відповідно до MD-файлів у цій папці та нового copywriting direction.

## Перед реалізацією

1. Проаналізуй поточний repository.
2. Знайди всі існуючі funnel routes.
3. Зістав їх з MD-файлами.
4. Покажи коротко:
   - які сторінки вже існують;
   - які треба оновити;
   - яких немає;
   - які business variables залишаються незатвердженими.

Після цього не зупиняйся на аналізі. Внеси зміни в код.

## Routes

Онови або створи в межах існуючої архітектури:

- `/audit`
- `/research`
- `/trial`
- `/switch`
- `/one-process`
- `/pms-check`
- `/founding-hotels`
- `/hotel-research`

Окремо перевір `/funnel`.

Якщо `/funnel` є публічною сторінкою, не показуй там усі внутрішні marketing offers як каталог. Використай customer-facing router з 3-4 зрозумілими сценаріями.

## Для кожного мікролендінга

Має бути:

1. Один primary audience.
2. Один primary offer.
3. Одна dominant CTA.
4. Hero через проблему або результат клієнта.
5. Problem recognition.
6. What you get.
7. How it works.
8. Objection / trust block.
9. Коротка форма.
10. FAQ лише якщо потрібен.
11. Final CTA з тією самою дією.

Не дублюй головний сайт VDALO.

## Copy direction

### Audit

`Дізнайтеся, що у вашому готелі варто автоматизувати першим`

### Research

`Розкажіть, як працює ваш готель. Отримайте місяць VDALO без оплати.`

Використовувати бонус лише після підтвердження business config.

### Trial

`Перевірте VDALO на реальній роботі вашого готелю`

### Switch

Safe version:

`Думаєте про зміну PMS? Спочатку перевіримо, чи є в цьому сенс.`

Stronger version only after approval:

`Перейдіть на VDALO без подвійної абонплати`

### One Process

`Назвіть один процес у готелі, який забирає найбільше часу`

### PMS Check

`PMS у вас уже є. А скільки роботи залишилося поза нею?`

### Founding Hotels

`Станьте одним із перших готелів, які тестують VDALO разом із продуктовою командою`

### Industry Research

`Що українські готелі досі роблять вручну у 2026 році?`

## Business experiment variables

Не хардкодити як факт, поки вони не затверджені:

- trial duration;
- research incentive duration;
- switch free month;
- founding hotels cohort size;
- special pricing;
- audit exact duration;
- audit exact deliverable;
- migration scope;
- onboarding SLA;
- support hours.

Винести у config / feature flags / content configuration.

## Brand and style rules

- Україна = VDALO.
- Не переносити автоматично ALISIO Night Operations.
- Зберегти існуючий visual direction VDALO.
- Не використовувати U+2014.
- Не переписувати дизайн-систему без потреби.
- Покращувати hierarchy, copy, CTA clarity, forms, mobile і analytics.

## Product truth rules

Не вигадувати:

- ціни;
- integration availability;
- production readiness;
- customer logos;
- customer cases;
- reviews;
- ROI;
- automation percentages;
- SLA;
- 24/7 support;
- universal compatibility;
- guaranteed migration;
- "повну автоматизацію готелю".

## Forms

Кожна форма повинна мати:

- validation;
- loading;
- disabled submit while sending;
- backend success;
- backend error.

Не показувати success, якщо backend реально не підтвердив отримання.

Не збирати:

- guest passport data;
- payment card data;
- passwords;
- API secrets;
- active lock codes.

## Analytics

Мінімум:

- page_view
- primary_cta_click
- form_open
- form_start
- form_success
- form_error
- qualified_lead
- meeting_booked
- audit_held
- research_interview_held
- trial_started
- trial_activated
- pilot_started
- commercial_sent
- paid_started

Передавати offer_id і landing route.

## Mobile / UX

- Hero має бути зрозумілим без скролу.
- CTA має бути помітна.
- Не ставити 4 рівноцінні CTA.
- Форма коротка.
- Важливий текст не ховати в hover.
- Підтримати keyboard/focus.
- Respect reduced motion.
- Не використовувати важкі ефекти, які погіршують conversion.

## Acceptance criteria

Для кожного route у фінальному QA дай:

- route;
- audience;
- primary offer;
- H1;
- primary CTA;
- form fields;
- post-submit behavior;
- analytics events;
- unsupported claims found and removed;
- mobile status;
- TODO через незатверджені business decisions.

Не зупиняйся після QA. Якщо implementation possible, внеси зміни й покажи результат.
