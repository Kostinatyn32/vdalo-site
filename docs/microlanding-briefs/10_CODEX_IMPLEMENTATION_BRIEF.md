---
project: VDALO
market: Ukraine
artifact: microlanding_brief
version: 1.0
date: 2026-10-07
brand_rule: "VDALO = Ukraine"
punctuation_rule: "Do not use U+2014"
---


# VDALO | Codex Master Brief for Microlandings

## 1. Task

Build a reusable micro-landing system for VDALO from the briefs in this folder.

Do not implement each page as an unrelated one-off.

Create shared layout, content schema, analytics events, form states and offer-specific configuration.

## 2. Source priority

1. Latest explicit user decision.
2. Product Truth.
3. Current brand architecture.
4. Current Website / GTM rules.
5. This microlanding pack.
6. Historical research only where it does not conflict.

## 3. Brand

Market:

`Ukraine`

Brand:

`VDALO`

Tagline:

`Керуйте готелем вдало.`

Category direction:

`PMS та автоматизація щоденної роботи готелю.`

Do not automatically use ALISIO visual identity.

Do not use U+2014.

## 4. Recommended routes

- `/audit`
- `/research`
- `/trial`
- `/switch`
- `/one-process`
- `/pms-check`
- `/founding-hotels`
- `/hotel-research`

Before deployment, reconcile with the actual router and repository.

## 5. Shared architecture

Recommended reusable components:

- `MicrolandingShell`
- `OfferHero`
- `TrustStrip`
- `ProblemCards`
- `ProcessSelector`
- `HowItWorks`
- `Deliverables`
- `AudienceFit`
- `ObjectionBlock`
- `FAQ`
- `LeadForm`
- `FinalCTA`
- `LegalMicrocopy`

Content should be configuration-driven where practical.

## 6. Offer config example

```ts
type OfferConfig = {
  id: string
  route: string
  status: "current" | "experiment"
  eyebrow?: string
  headline: string
  subheadline: string
  primaryCta: string
  secondaryCta?: string
  formMode: string
  analyticsOffer: string
}
```

Do not hardcode commercial experiment variables inside components.

## 7. Experiment config

Keep configurable:

- trialDays
- researchIncentiveDays
- switchFreeMonthEnabled
- foundingHotelCohortSize
- auditDeliverables
- auditDuration
- calendarUrl
- formEndpoint
- messengerLinks

If not approved, do not publish a fake default.

## 8. Forms

Required states:

- idle
- focus
- validation error
- loading
- backend success
- backend error

Never display success unless the backend confirms receipt.

Do not collect:

- guest passport data;
- card data;
- passwords;
- API credentials;
- active lock codes.

## 9. Analytics

Emit the shared events from:

`09_SHARED_ANALYTICS_CRM_ROUTING.md`

Every form success should include:

- offer_id
- landing_route
- source / UTM if available
- selected_process if relevant
- current_PMS if supplied

## 10. SEO

These pages primarily serve outbound campaigns.

Still provide:

- unique title;
- unique description;
- one H1;
- canonical strategy;
- index/noindex decision per page.

Do not create thin duplicated copy with only the offer word changed.

## 11. Performance and responsive

- mobile-first CTA clarity;
- fast first render;
- semantic HTML;
- keyboard and focus states;
- reduced motion;
- no heavy animation blocking conversion;
- do not hide essential copy in animation.

## 12. Content truth

Do not invent:

- pricing;
- trial terms;
- migration capability;
- integration list;
- SLA;
- customer logos;
- case studies;
- ROI;
- automation percentage;
- support hours.

Experiment landing can exist in code before launch, but unapproved terms must remain disabled/config-gated.

## 13. Acceptance criteria

A page passes when:

1. The visitor understands one offer within the hero.
2. There is one dominant next action.
3. The page clearly targets the intended audience.
4. Form works against a real endpoint.
5. Analytics events fire correctly.
6. Mobile is intentional.
7. No unsupported claim appears.
8. Experiment terms are config-gated.
9. No U+2014 exists.
10. The next CRM route is known for every form type.

## 14. Build order

Recommended:

1. Shared shell + form + analytics.
2. Audit.
3. Trial.
4. Switch.
5. Research Partner.
6. One Process.
7. PMS Health Check.
8. Founding Hotels.
9. Industry Research.
10. QA all routes and event payloads.
