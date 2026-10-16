# SEO review, one page at a time

## Goal

Review every public VDALO page individually. Give special attention to the useful, page-specific text near the bottom of each page. Improve metadata, headings, internal links, visible structured data, image metadata, and crawl/index signals only where the page needs it.

## Working rules

- Work on one canonical URL at a time and record its status before moving on.
- Review the rendered page and its source data, not only the copy file.
- Separate pages intended for search from campaign, funnel, utility, and legal pages. Preserve intentional `noindex` settings.
- Identify the searcher's intent before editing. Use natural language and specific answers instead of adding copy to hit an arbitrary word count.
- Verify changing legal, tax, price, and product claims against current primary sources or approved product information.
- Structured data must describe visible, accurate page content. Do not add `FAQPage`, reviews, ratings, prices, or product promises just to seek a rich result.
- Check title, description, one H1, heading order, canonical, robots, links, image alt text, and JSON-LD after each edit.
- Do not publish changes until separately requested.

## Sequence

1. Tourist-tax hub: `/tourist-tax/`.
2. Published city pages, one URL per review: `/tourist-tax/lutsk/`, `/tourist-tax/berehove/`, `/tourist-tax/cherkasy/`, `/tourist-tax/chernihiv/`, `/tourist-tax/chernivtsi/`, `/tourist-tax/ivano-frankivsk/`, `/tourist-tax/kolomyya/`, `/tourist-tax/lviv/`, `/tourist-tax/pivdenne/`, `/tourist-tax/rivne/`, `/tourist-tax/slavsko/`, `/tourist-tax/sumy/`, `/tourist-tax/ternopil/`, `/tourist-tax/uzhhorod/`, `/tourist-tax/vinnytsya/`, `/tourist-tax/zaporizhzhya/`.
3. Main product pages and solutions.
4. Tools and calculators.
5. Blog, articles, cases, and author pages.
6. Legal and utility routes, checking indexability and accuracy rather than forcing SEO copy.
7. Final site-wide pass for duplicate intent, titles, descriptions, internal links, sitemap, canonicals, robots, and schema consistency.

The route audit currently renders 63 content pages; the public sitemap contains 61. Reconcile this difference during the route inventory so intentionally non-indexable routes are documented and no indexable page is missed.

## Completed audit, 16 October 2026

The page-by-page review is complete for the current indexable site. Changes and validation remain local. No production deployment or Search Console submission was performed.

### Indexation inventory

The public sitemap contains 61 canonical indexable URLs: home (1), product and brand pages (11), author directory and Oleh profile (2), legal pages (3), case index and cases (7), blog index and articles (16), tools (4), tourist-tax hub and released city pages (17). Two rendered routes are intentionally `noindex,follow` and absent from the sitemap: `/authors/kostiantyn-tripailo` because he has no attributed articles yet, and `/tourist-tax/start` because it is a campaign funnel. Campaign routes are checked separately and remain outside the public sitemap. `audit-content-seo.mjs` renders 63 pages because it includes intentional non-indexable routes.

### Tourist-tax pages, reviewed individually

Each released city page was checked for rate evidence, decision and effective period, settlement and community codes, calculation model, source conflicts, calculator examples and edge cases, bottom SEO copy, title, description, H1, canonical, robots, social metadata, internal links, image metadata and JSON-LD. All 16 pages have a verified rule and calculator QA. Conflicting imported rates are disclosed in public copy without mentioning internal workbooks. Calculators fail closed at ambiguous rate-band boundaries.

| URL | Result |
|---|---|
| `/tourist-tax/` | Reviewed hub calculator, statistics period, dashboard, city directory, SEO guide, internal links, legal sources, Power BI attribution, social tags and CollectionPage/ItemList schema. |
| `/tourist-tax/lutsk/` | Decision 77/72, 2026 period and KATOTTG checked. Local SEO block improved and comparison link now leads to Berehove. |
| `/tourist-tax/berehove/` | DPS Form 6 and community codes checked. Source conflict disclosed. Rule ends 2026-12-31, so recheck before 2027 use. |
| `/tourist-tax/cherkasy/` | DPS and council evidence reconciled. Example uses the precise category “внутрішній туризм”; comparison now points to a different-rate city. |
| `/tourist-tax/chernihiv/` | Decision 18/VIII-19 and current rate evidence checked. Removed a duplicate example and clarified territorial coverage. |
| `/tourist-tax/chernivtsi/` | DPS form, locality and community codes, schedule and calculator example checked. |
| `/tourist-tax/ivano-frankivsk/` | Local decision, rate, calculator and example checked. No undefined-percentage output remains. |
| `/tourist-tax/kolomyya/` | Council decision 781-16/2021 and effective period checked; page identifies the community and links the act. |
| `/tourist-tax/lviv/` | 2026 DPS Form 6 checked. Ambiguous 750 and 1,200 UAH boundaries fail closed pending a definitive reading of the full act. |
| `/tourist-tax/pivdenne/` | Current DPS form, decision 422-VIII, locality scope and calculator checked; description improved. |
| `/tourist-tax/rivne/` | Decision 783, rates, codes and calculation checked; comparison now points to a different-rate destination. |
| `/tourist-tax/slavsko/` | Signed DPS form supports universal rates. Zero rows are not presented as zero-rate exemptions; source conflict and limitation are explained. |
| `/tourist-tax/sumy/` | 2026 rule and calculation checked; comparison now points to a different-rate destination. |
| `/tourist-tax/ternopil/` | Amendment 8/52/08 sets the threshold to 320 UAH from 2026-01-01; the exact boundary is handled conservatively. |
| `/tourist-tax/uzhhorod/` | Signed DPS form, codes and decision 2333 checked. Universal rate selected and conflicting rows explained without internal workbook wording. |
| `/tourist-tax/vinnytsya/` | Decision 469 and amendment evidence checked; description improved and comparison points to a different-rate city. |
| `/tourist-tax/zaporizhzhya/` | Council act 39, price schedule, exact calculator boundaries and examples checked. |

Official primary evidence includes [Ternopil Council decision 8/52/08](https://ternopilcity.gov.ua/sesiya/rishennya-sesii/93883.html), [Lutsk Council decision](https://www.lutskrada.gov.ua/documents/17496325233676686-pro-vstanovlennya-stavok-turistichnogo-zboru), [Kolomyya Council decision 781-16/2021](https://nbkolrada.gov.ua/dt/348928/), [Vinnytsia Council local taxes register](https://www.vmr.gov.ua/mistsevi-podatky-ta-zbory), and signed DPS Form 6 records linked on the respective city pages.

### Remaining sitemap pages, reviewed individually

The local renderer and route audit reviewed all routes listed below. Each page was checked for unique title and description, one H1, Ukrainian document language, self-canonical, image alt attributes, valid JSON-LD, working internal destinations and at least one internal link. Bottom sections were checked against the intent of their page type. No generic SEO paragraph, unsupported FAQ schema, or keyword padding was added.

| Family | Routes |
|---|---|
| Home | `/` |
| Product and brand | `/solutions`, `/integrations`, `/pricing`, `/hotel-booking-calendar`, `/hotel-check-in`, `/hotel-operations`, `/guest-communication`, `/hotel-automation`, `/registration`, `/about`, `/contact` |
| Authors | `/authors`, `/authors/oleh-stepeniev` |
| Legal | `/privacy`, `/offer`, `/refunds` |
| Cases | `/cases`, `/cases/guest-services-glamping`, `/cases/direct-bookings-calendar`, `/cases/hotel-booking-reconciliation`, `/cases/night-self-checkin-germany`, `/cases/hotel-data-migration`, `/cases/booking-widget-study-2118` |
| Blog and articles | `/blog`, `/blog/shcho-take-pms-dlya-gotelyu`, `/blog/yak-obraty-pms-dlya-gotelyu`, `/blog/yak-gotelyu-prodavaty-dodatkovi-poslugy`, `/blog/pryami-bronyuvannya-ta-vidzhet-gotelyu`, `/blog/perehid-na-pms-bez-vtraty-danyh`, `/blog/shakhmatka-bronyuvan-gotelyu`, `/blog/channel-manager-ical-gotelyu`, `/blog/pidhotovka-zaselennya-gostya`, `/blog/shcho-avtomatyzuvaty-v-goteli-pershym`, `/blog/status-gotovnosti-nomera-housekeeping`, `/blog/turystychnyi-zbir-gotel-ukraina`, `/blog/rozrakhunok-turystychnoho-zboru-2026`, `/blog/qr-kody-dlya-goteliv`, `/blog/qr-wifi-dlya-gotelyu`, `/blog/qr-kartka-v-nomer-gotelyu` |
| Tools | `/tools/`, `/tools/qr-studio/`, `/tools/pms-checklist/`, `/tools/hotel-profitability-calculator/` |

The homepage H1 uses a deliberate line break between “готелем” and “вдало”, not a missing-space bug. The PMS selection guide contains 3,828 words in its Markdown source and is intentionally a detailed guide, not duplicated template text. Articles retain visible author links, publication and modification dates, and matching BlogPosting data. Every case retains a method/limits note and a practical application step.

### Changes made in this review cycle

- Replaced three same-rate city comparisons with more useful different-rate comparisons.
- Removed internal workbook wording from Uzhhorod and Slavsko public copy while preserving rate conflicts and source limitations.
- Removed a repeated Chernihiv calculation example and clarified territorial scope.
- Corrected tourism-category wording in Cherkasy and Uzhhorod examples.
- Improved meta descriptions for Kolomyya, Pivdenne and Vinnytsia.
- Removed Hotels24, Expedia, Agoda and Dobovo logos from the integrations page because their presence could imply supported integrations. The section now shows Booking.com and Airbnb only as examples of connection requests and explicitly says the logos do not confirm an active integration.
- Shortened several long page titles and author/about descriptions while retaining their search intent.
- Added grammatical source-conflict wording and fixed the undefined percentage rendering on Ivano-Frankivsk.

### Validation results

- `node --test`: 90 passed, 0 failed.
- `node scripts/validate-schema.mjs`: 61/61 sitemap routes, 0 errors.
- `node scripts/audit-content-seo.mjs`: 63 rendered pages, 63 unique titles and descriptions, 54 referenced local images, 1,102 internal route edges, 0 orphan pages.
- `$env:AUDIT_IN_PROCESS='1'; node scripts/audit-active-site.mjs`: 137 routes, 47 canonical redirects, 72 unique local media assets, 77 internal link destinations checked, 63 unique page titles, no warnings or errors.
- `node scripts/check-tourist-tax-city-batch.mjs`: 377 city records, 16 released and indexable, 361 unreleased and unavailable.
- `node scripts/audit-tourist-tax-release.mjs`: the report dated 2026-10-14 records 16 ready and 14 blocked out of 30 planned. This is release readiness, not proof that all 30 are published.

### Remaining limits and follow-up

- Published municipal rates were last checked 2026-10-14. Recheck before the next tax year and whenever a council publishes an amendment. Some public pages explicitly disclose source conflicts or limited access to a complete source act.
- Do not relax the Lviv, Ternopil or Zaporizhzhia boundary guards without definitive official interpretation.
- The prepared SEO export for the 377 unpublished records is not ready for publication. Its risk audit flags the old 8,000 UAH wage base in all 377 drafts, 352 records without primary decision evidence, and 25 rate mismatches against verified rules. Keep these routes unavailable until each record passes source, copy, calculator and QA gates.
- No production deployment, Search Console submission, or live visual browser review was performed in this turn.

## Additional content and design pass, 16 October 2026

After the owner clarified that the goal is to add a useful bottom SEO section where a page is thin, the indexable routes were rechecked for main-content depth, existing final sections, page intent, link context, and fit with the VDALO design system. Existing substantial and page-specific sections were retained. New copy was added only where a directory page lacked enough orientation for visitors and search engines.

| URL | Assessment | Change |
|---|---|---|
| `/authors` | The page was previously a brief author directory. | Added an editorial overview of both authors, topics, publication status, and how authorship, update dates, evidence and case limits are presented. Added styled author-specific cards and links that remain clear on mobile. |
| `/tools/` | The catalog cards named tools but offered little help choosing between them. | Added a task-based guide to the revenue calculator, PMS checklist and QR Studio. Clarified that the calculator is an estimate, the PMS checklist is not an independent supplier rating, and a QR link alone does not send bookings into a PMS. |
| `/cases` | Case cards were present, but the index lacked a guide to interpreting case metrics. | Added a page-specific block on context, data sources and limits, with links to a modelled service-revenue case and the direct-booking/iCal case. Styled it to follow the case-page visual system and stack cleanly on mobile. |
| Product pages, individual cases, articles, author profile, tools, tax hub and city pages | Already contain substantial, relevant content, methodology, FAQs, related links or source notes suited to their page intent. | Retained the existing sections. No extra block was added solely to increase word count. |
| Contact, registration and legal pages | Transactional or policy intent; search copy would distract from the task or legal content. | No generic SEO block added. Contact and registration retain task-specific guidance; legal pages retain their policy structure. |
| `/authors/kostiantyn-tripailo` | Intentionally noindex and has no published authored articles yet. | Preserved its profile status and noindex behavior. |

Validation after this pass: 90 tests passed; schema validation remained 61/61; all 63 rendered pages retained unique titles/descriptions and zero orphan routes; the in-process route audit checked 137 routes with no warnings or errors. No production deployment or live-browser visual review was performed.
