# Sitewide JSON-LD implementation report

Date: 2026-10-13

## Implemented

Added one centralized JSON-LD graph to every canonical, indexable page in the public sitemap. The same route builder now feeds both `sitemap.xml` and the schema allowlist, so public sitemap URLs and schema coverage cannot silently drift apart.

The graph links VDALO's Organization and WebSite to each page. Page nodes use the matching type for home, about, contact, author, topic hubs, and tools. Feature pages also identify the visible VDALO capability as a Service. Blog posts and case studies link their visible author, canonical page, publisher, image, dates where shown, and visible breadcrumb trail.

Removed SoftwareApplication from the homepage template because the current page does not expose the verified offer and customer review/rating data required for Google's Software app rich result. FAQPage was not added because Google removed FAQ rich-result documentation in June 2026. Case pages keep the visible author and update date but no longer mark up an unshown publication date. No pricing, reviews, customer ratings, legal details, or multilingual pages were invented.

## Files

- `versions/v1/schema.mjs` — graph builder and schema normalization.
- `versions/v1/sitemap.mjs` — shared public route list for sitemap generation and validation.
- `server.mjs` — response-boundary injection on approved HTML routes.
- `versions/v1/render.mjs` and `versions/v1/server.mjs` — removed the SoftwareApplication branch.
- `scripts/validate-schema.mjs` — route-by-route local verification.
- `seo-workspace/schema/SCHEMA_PAGE_MATRIX.csv` — all public URLs and the graph features applied.
- `seo-workspace/schema/SCHEMA_ARCHITECTURE.md` — architecture and Google policy decisions.

## Verification

`npm run validate:schema` rendered and checked all 38 public sitemap routes: 38 passed, 0 errors. Checks include valid JSON, one graph block per page, canonical URL and page-type matching, unique IDs, internal entity references, article metadata, visible date consistency, visible breadcrumbs, and exclusion of unsupported or unsubstantiated types. JavaScript syntax checks passed. `git diff --check` reported only the repository's existing LF/CRLF conversion notices, with no whitespace errors.

## Not yet verified on production

The changes remain local and have not been deployed. Google's Rich Results Test and Schema.org Validator need public URLs for final production checks, so those checks remain queued until a separately authorized deployment. Google notes that valid structured data does not guarantee a rich result or ranking change. After deployment, confirm the generated HTML, run the external validators, then review Search Console after recrawl.

Official references: [Google structured data policies](https://developers.google.com/search/docs/appearance/structured-data/sd-policies), [Software app markup](https://developers.google.com/search/docs/appearance/structured-data/software-app), [Organization markup](https://developers.google.com/search/docs/appearance/structured-data/organization), [Article markup](https://developers.google.com/search/docs/appearance/structured-data/article), [Breadcrumb markup](https://developers.google.com/search/docs/appearance/structured-data/breadcrumb), and [Google documentation updates](https://developers.google.com/search/updates).
