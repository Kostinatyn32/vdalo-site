# VDALO city tax pages: implementation master prompt

## Role and goal

Act as the implementation owner for the VDALO tourist-tax directory. Read the two owner-supplied Excel workbooks, the existing tourist-tax implementation plan, the Lutsk reference page, tests, and the current source tree. Build scalable pages and data handling for every supplied locality. Work in small batches, keep a checkpoint, run verification, and fix issues before marking a step complete.

## Non-negotiable rules

1. Do not deploy, publish, or change production unless the owner explicitly asks in a separate message.
2. Treat both workbooks as user-provided secondary inputs, not official legal evidence.
3. Never show a proposed rate or a derived amount in a public calculator until the community, KATOTTG codes, current local council decision, exact rate category, effective dates, and calculation are verified against primary sources.
4. Never reuse a rate from a neighboring settlement or another community.
5. A conflicting rate within one community blocks calculation for that community until the applicable local differentiation is understood and sourced.
6. Keep every unreleased city route unavailable: return 404 without rendering an HTML page, `noindex` document, internal link, search suggestion, or sitemap entry. Preserve its source data internally.
7. Do not repeat legal claims from supplied draft copy unless checked against the current Tax Code and official local decision. This specifically includes exemptions, proof documents, payment/reporting deadlines, budget allocation, and who must act as tax agent.
8. Use the 2026 base of 8,647 UAH, not legacy workbook examples based on 8,000 UAH. Do not silently substitute the new base into unverified local-rate calculations.
9. Keep place identity, community rate, source evidence, editorial copy, and SEO/indexation readiness as separate fields.
10. Preserve existing verified pages and unrelated user changes. Do not use the em dash character in user-facing copy.

## Ordered execution

### Step 1: Inventory and reconciliation

- Read every sheet and row from both workbooks.
- Match rows by normalized URL slug and fail on missing, extra, or duplicate slugs.
- Report counts for places, unique communities, missing fields, duplicate place names, rate conflicts within a community, invalid/missing percentages, stale 8,000 UAH amounts, and malformed FAQ JSON-LD.
- Preserve source-file names and SHA-256 hashes.

### Step 2: Import as review data

- Convert rows to versioned machine-readable data with all 377 settlement records and community groupings.
- Import proposed rates into explicitly unverified fields only.
- Mark missing codes, council act IDs/URLs, effective periods, and evidence as review requirements.
- Keep the reviewed Lutsk record authoritative when the workbooks contain the same slug.

### Step 3: Route and page architecture

- Keep imported city data and release state separate from the public route list.
- For an unreleased city, return 404 without HTML and lock its calculator API without displaying a proposed rate or amount.
- Add the route, internal links and sitemap entry only after every publication gate passes. Do not use `noindex` as the hiding mechanism.
- Keep the public hub list compact and searchable, show rate-verification state in suggestions, and never imply that an unverified result is a confirmed rate.
- Keep verified place search and calculation behavior unchanged.

### Step 4: Per-community evidence and conflict queue

For each unique community, collect and record the official decision URL and ID, date, rates by applicable category, effective-from/to dates, amendments, source verification date, KATOTTG community code, KATOTTG settlement codes, and any safety/territory eligibility source. For conflicting data, record each proposed variant and what local classification or source must resolve it. Do not mark work complete merely because 377 pages render.

### Step 5: Editorial and SEO QA

- Create a useful, non-duplicative page only from verified locality and legal facts.
- Validate title, description, H1, calculator formula, local decision/source links, FAQ consistency, structured data, internal links, Ukrainian grammar, mobile content order, and no unsupported claims.
- Ensure rendered copy has no leftover 8,000 UAH examples, draft-only figures, or hidden legal misinformation.

### Step 6: Self-check and checkpoint

- Run the existing relevant test suite and data validator, lint/syntax checks available in the project, and route checks for a verified city, an unverified city, and a missing slug.
- Check sitemap membership, robots directives, canonical URLs, search states, and API response for an unverified place.
- Fix all implementation defects found. Clearly separate complete software work from remaining source/legal review.
- Update `IMPLEMENTATION_PLAN.md`, `QA_CHECKPOINT.md`, and `CITY_IMPORT_CHECKPOINT.md` with counts, hashes, checks, known blockers, exact next work, and explicit non-deployment status.

## Definition of done

All workbook rows reconcile to an internal record; unreleased rows remain unavailable and out of internal links and sitemap; no unverified amount is used by the calculator; the Lutsk page stays verified and unchanged in public behavior; the review export exposes proposed values and review gaps; route/data checks pass; all remaining primary-source gaps are listed instead of guessed; production remains untouched.
