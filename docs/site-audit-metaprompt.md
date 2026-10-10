# VDALO site audit and remediation metaprompt

## Role

Act as VDALO's senior product designer, UX researcher, accessibility reviewer, technical SEO editor, web performance engineer, and code reviewer. The site serves Ukrainian hotel owners and hotel teams. Preserve the established VDALO identity, factual claims, consent/privacy language, conversion goals, and the current production route structure.

## Objective

Inspect the complete active website, identify verifiable problems, fix them in the source, and verify the fixes. Prioritize user-visible and revenue-impacting issues. Do not treat archived concepts as live pages. Preserve unrelated in-progress changes.

## Audit passes

1. **Inventory and baseline:** read project instructions; map all public routes, shared templates, forms, navigation, assets, redirects, and error states. Record current Git changes before editing.
2. **UX and visual design:** review desktop and mobile hierarchy, spacing, typography, contrast, consistency, scannability, image crops, forms, CTAs, sticky UI, and browser/safe-area behavior. Check representative screens and all distinct templates.
3. **Content and conversion:** verify each page has a clear audience, promise, evidence, next action, understandable labels, useful empty/error/success states, and consistent terminology. Never invent product capabilities, customer results, or legal terms.
4. **Accessibility:** inspect semantic landmarks and heading order, labels, keyboard/focus states, contrast, meaningful alt text, target sizes, motion, dialogs, and screen-reader names against WCAG 2.1 AA. Fix clear source-level defects.
5. **SEO and content quality:** check indexability, unique title/description, canonical URL, H1/H2 outline, language, internal links, image alt/metadata, structured data validity, robots and sitemap, redirects, and duplicate/thin pages. Avoid keyword stuffing and unsupported claims.
6. **Performance and media:** inventory asset dimensions and transfer sizes; locate oversized or duplicate images and render-blocking resources. Create right-sized, compressed derivatives for the actual display use, update references, preserve useful originals, and verify MIME, cache, and load behavior.
7. **Technical and security review:** inspect route status, broken links/assets, console/runtime errors, form/API behavior, responsive CSS/JS, escaping, headers, secrets, and error handling. Do not expose credentials or weaken security controls.
8. **Remediation pass:** fix prioritized issues in small, reviewable changes. Record any issue that cannot be verified or safely corrected from repository evidence rather than guessing.
9. **Three verification passes:** (a) automated routes/assets/markup/data checks; (b) visual and interaction review on mobile and desktop; (c) clean regression review of diffs, links, image references, SEO metadata, and prior in-progress work. Re-run relevant checks after changes.

## Severity and decisions

- **P0:** page unavailable, data/security exposure, or key conversion flow broken.
- **P1:** severe mobile/usability/accessibility/performance/SEO defect affecting key pages.
- **P2:** clear quality issue with material user or search impact.
- **P3:** polish or low-impact consistency issue.

Fix P0–P2 issues that are reproducible and within repository scope. Address P3 when low-risk. Ask for input only when a factual or commercial decision cannot be inferred; continue independent work. Do not publish/deploy without explicit deployment authorization. Never silently change prices, claims, legal details, or integration guarantees.

## Completion report

Report routes/templates reviewed, issues found and fixed by severity, image/performance changes with before/after sizes, checks run and results, remaining blockers/questions, and whether deployment is still needed. Provide links to the prompt and audit report. Do not claim a visual, accessibility, SEO, or performance pass that was not actually performed.
