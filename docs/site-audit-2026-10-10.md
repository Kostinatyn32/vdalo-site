# VDALO website audit — 2026-10-10

## Scope

Active route handlers in `server.mjs`, shared V1 pages/templates, cases and editorial content, static assets, and the five SMS video funnels. Excludes `design-archive/` unless an active route points into it. Existing worktree changes in the five video funnels were present at audit start and are preserved.

## Finding and completed fix

| Priority | Finding | Action | Verification |
|---|---|---|---|
| P1 | Large raster images: case section image 2.14 MB; PMS article cover 1.93 MB; PMS workflow illustration 1.77 MB; author portrait 2.03 MB. | Added same-dimension JPEG derivatives at quality 84 and switched rendered page/schema references. Kept PNG originals. | Original total 7.87 MB; derivatives total about 0.74 MB (about 91% smaller). Verified route, content type, image references, and rendered page. |
| P1 | Five transparent funnel completion illustrations weighed about 3.82 MB combined, adding avoidable transfer to SMS landing pages. | Encoded alpha-preserving WebP derivatives at quality 90, switched route allowlist and page references, and retained PNG originals. Added a repeatable conversion helper. | Combined WebP size about 0.49 MB (about 87% smaller); confirmed alpha channel on all five. Verified WebP HTTP responses. |

The standalone case cover JPEGs in the case index are approximately 0.19–0.25 MB each; no bulk conversion was needed for those images.

## Verification results

- **Pass 1 — routes and SEO:** 47 routes, 54 unique local images, five funnel WebP responses, 41 internal links, and 38 unique page titles. All routes responded; titles were unique; descriptions and canonicals existed; H1 counts and JSON-LD parsed; image alts were present. No failures or warnings.
- **Pass 2 — experience and assets:** reviewed cases index and a full case page in the browser accessibility tree; confirmed descriptive image alternatives, one H1 and a clear reading sequence. Checked an optimized case illustration and a transparent funnel WebP visually. The five funnel derivatives retain alpha. Full physical-device/screen-reader testing is not available in this repository-only pass.
- **Pass 3 — regression:** all 58 existing Node tests pass; changed JavaScript files pass `node --check`; `git diff --check` passes. New JPEG and WebP routes resolve; no stale references to replaced formats remain in active sources. Prior uncommitted funnel edits were preserved.

## Remaining scope

- No deployment was performed in this audit pass.
- The legacy PNG originals are retained in the repository as source assets; current page markup uses the optimized derivatives.
- A real-device visual/assistive-technology session and field Core Web Vitals data require browser/device and analytics evidence beyond source inspection.
