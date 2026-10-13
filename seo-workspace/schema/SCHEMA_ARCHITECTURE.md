# Sitewide JSON-LD architecture

Updated: 2026-10-13

## Purpose

Provide one server-side JSON-LD graph for each canonical, indexable VDALO page. Keep the common site entities consistent, connect each page to the right entity, and avoid adding claims that are absent from the visible page or confirmed business facts.

## Implementation

- `versions/v1/schema.mjs` is the single graph builder and legacy-schema normalizer.
- `server.mjs` supplies the explicit sitemap-backed route allowlist and applies the builder at the HTML response boundary. No JSON-LD is injected into assets, APIs, redirects, 404 pages, funnels, or other non-indexable routes.
- Legacy template graphs are reduced to appropriate article, person, and visible breadcrumb nodes, then rewritten into one graph. Generic page, website, and organization nodes are built centrally.
- `scripts/validate-schema.mjs` renders every public sitemap route from the same templates, applies the production transform, checks graph shape and references, and writes the route matrix and local validation report.

## Entity model

| Entity | Stable identifier | Applied to |
|---|---|---|
| Organization | `https://www.vdalo.tech/#organization` | All indexable pages |
| WebSite | `https://www.vdalo.tech/#website` | All indexable pages |
| WebPage / AboutPage / ContactPage / ProfilePage / CollectionPage | `{canonical}#webpage` | Every indexable route, with type selected from the visible page purpose |
| Service | `{canonical}#service` | Five feature pages whose visible content describes a VDALO service capability |
| BlogPosting / Article | `{canonical}#article` | Blog articles and case studies |
| Person | `https://www.vdalo.tech/authors/oleh-stepeniev#person` | Author profile and articles that visibly name Oleg Stepeniev |
| BreadcrumbList | Existing visible navigation path | Pages that render a matching visible breadcrumb |

The organization logo uses the square 512-by-512 VDALO app icon SVG. The site language is Ukrainian (`uk`) because that is the public language currently represented by the routes and visible copy.

## Content and policy constraints

- No `SoftwareApplication` rich-result entity: no confirmed real customer review/rating data or page-level subscription offer is represented by the current visible home page.
- No `FAQPage`: FAQ rich-result support was retired by Google in 2026.
- No fabricated offer, price, aggregate rating, review, hotel/business address, location, contact point, `sameAs`, or multilingual alternate page.
- Case pages keep the visibly rendered author and update date; omit their hidden publication date.
- Article dates are retained only from the existing article source and checked against visible article bylines during audit.
- No schema is emitted for `/go`, `/funnel`, campaign/microsite routes, APIs, or assets.
- Structured data describes visible content and does not guarantee a search rich result or ranking change.

## Validation and release

Run `npm run validate:schema`. This is local template validation. After an authorized deployment, validate representative public URLs with Google's Rich Results Test where the type is supported and with Schema.org Validator for vocabulary/graph issues, then inspect production HTML and Search Console URL status. A validator passing does not guarantee display in Google Search.

## Google references checked

- [General structured data guidelines](https://developers.google.com/search/docs/appearance/structured-data/sd-policies): markup must represent visible, relevant page content; JSON-LD is the recommended format; correct markup does not guarantee display.
- [Organization structured data](https://developers.google.com/search/docs/appearance/structured-data/organization): the Organization logo image should be crawlable/indexable, supported by Google Images, and at least 112 by 112 pixels. The selected app mark uses a square 512-unit SVG viewBox.
- [Google Search documentation updates](https://developers.google.com/search/updates): FAQ rich-result documentation was removed June 15, 2026 because FAQ rich results are no longer shown in Search.
- [Article structured data](https://developers.google.com/search/docs/appearance/structured-data/article) and [Breadcrumb structured data](https://developers.google.com/search/docs/appearance/structured-data/breadcrumb): used only where matching article and breadcrumb content is visible.
