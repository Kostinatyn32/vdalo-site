# VDALO first version, implementation and QA

Date: 2026-10-08

## Scope

The first design now serves at `/`. The existing `/funnel` directory and its eight planned funnel pages remain available. The case page remains at `/cases/hotel-ai-reception`.

## Main page review

| Area | Implemented and checked |
| --- | --- |
| Audience | Hotel owners and managers reviewing day to day work |
| Primary offer | Free process audit, focused on identifying the first automation priority |
| Main CTA | Get a free audit |
| Secondary CTA | Discuss VDALO implementation |
| Form | Audit and implementation modes open separately. Required name, property, contact and consent fields are present. Optional context is collapsed. |
| Analytics | Provider neutral events and CTA locations are pushed to `dataLayer`. UTM fields are included in the lead payload. No analytics provider or tag manager is configured in this repository. No contact details are sent as analytics events. |
| Integrations | Six visible logo examples: Booking.com, Airbnb, Hotels24, Expedia, Agoda and Dobovo. Copy says compatibility is checked per property. |
| Calendar | Demo dates start from the current date. Booking examples move with the selected week. |
| Pricing | Calculator, term options, tiers, add-on selection and comparison are present. Main pricing check script passes. |
| Mobile | Responsive breakpoints, stacked layouts and horizontal calendar and tariff scrolling are in the stylesheet. A 390 px browser emulation was unavailable in this QA session, so visual mobile rendering remains to verify. |

## Claims review

Removed or qualified unverified claims about trial duration, card requirement, response or setup times, universal compatibility and blanket automation. Trial terms are discussed with the hotel before access. Integration marks show examples only, and each connection is checked. No ROI or unsupported performance percentage was added. The user supplied German hotel case figures are labelled as an example calculation for Ukraine.

The site contains no em dash or en dash in the rendered copy. Price checks cover hotel tiers, billing terms, apartments, module bundles and displayed base prices.

## Forms and backend

The audit and implementation dialogs opened during browser QA. The required fields and consent controls are present. No live request was submitted. Lead delivery remains unconfigured until the team chooses the receiving service and supplies its webhook. The server returns an error when no webhook is configured, and the UI does not show success for that response.

## Remaining business inputs

- Configure the lead destination and test a real accepted request.
- Connect the approved analytics provider or tag manager to the existing `dataLayer` event hook.
- Confirm whether a trial is available and its duration, card requirement and conditions.
- Confirm supported integration methods for each named channel before describing them as connected.
- Supply verified contact details, legal operator details, and data retention policy.
- Supply an approved founder portrait and hero video if those assets should appear.
- Verify the mobile page visually at 390 px after the next browser or device QA session.
- Produce 512 px image derivatives if a build environment with a suitable image converter is available. Existing large images are lazy loaded below the first screen.

## Technical verification

- JavaScript syntax checks passed for modified server, rendering, pricing and browser files.
- `node scripts/check-prices.mjs` passed.
- Local browser review confirmed the home page, visible partner logos, both form modes, and live pricing recalculation.
- Local console reported no browser errors during the reviewed interactions.
- Internal hash links resolve. Rendered page copy has no em or en dash characters.
