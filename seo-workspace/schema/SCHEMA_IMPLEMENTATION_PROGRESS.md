# JSON-LD implementation progress

Updated: 2026-10-13

## Completed locally

- [x] Reviewed existing schema markup and page-rendering paths.
- [x] Confirmed the active public sitemap is the canonical route inventory and connected its route builder to schema eligibility.
- [x] Added a single server-side JSON-LD graph for sitemap-backed, indexable HTML pages.
- [x] Standardized Organization, WebSite, WebPage subtypes, Service, Article/BlogPosting, Person, and visible BreadcrumbList relationships.
- [x] Removed SoftwareApplication rich-result markup unsupported by the visible offer/review data.
- [x] Dropped FAQPage markup and case-study publication dates that were not visibly shown; preserved visible author and modified date.
- [x] Added a repeatable validator and generated the page matrix.
- [x] Rendered and validated 38 of 38 sitemap URLs with zero local errors.
- [x] Ran JavaScript syntax checks and whitespace validation.

## Pending after a separately authorized deployment

- [ ] Confirm production HTML for representative home, service, article, case, author, legal, and tool pages contains the same graph.
- [ ] Run Google's Rich Results Test for supported Article and BreadcrumbList examples.
- [ ] Run Schema.org Validator against representative production URLs.
- [ ] Check Google Search Console enhancements and URL Inspection after Google recrawls the pages.

No deployment was made as part of this implementation.
