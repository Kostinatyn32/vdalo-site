# VDALO third design: visual upgrade

## Design decisions
- Replaced the small generic hero diagram with editorial hospitality photography and a clearer product promise.
- Added a full-width reservation calendar concept and three explanatory product points.
- Added a hotel team photograph and content for reception, team and management roles.
- Extended VDALO 2.1 Paper/Plum/Blush/Pink tokens with restrained shadows and larger photographic surfaces.
- Preserved six solution groups, configuration-specific integration language and the existing enquiry dialogs.

## Motion provenance
Retrieved from 21st.dev and adapted to this site's native DOM/SVG architecture:
- Scroll Reveal by cnippet-dev: https://21st.dev/@cnippet-dev/components/scroll-reveal
  Adaptation: IntersectionObserver, 650ms eased reveal, one-time appearance, 80ms card stagger.
- Animated Beam by dillionverma: https://21st.dev/@dillionverma/components/animated-beam
  Adaptation: SVG connection paths with travelling pink/plum strokes, two finite passes on entering view.

Additional motion: hero entrance, sparkle entrance, card hover elevation, scroll progress.
Reduced motion shows every block immediately and disables animated strokes.
No React dependencies or remote animation runtime were added.

## Generated assets
Built-in ChatGPT image generation was used, with prompts scoped to the supplied VDALO palette.
Original PNGs are in docs/generated-v3. Website WebP assets total approximately 342 KB.

1. pms-calendar-v3: premium Ukrainian hotel PMS concept, 8 room rows, 7 daily columns, plum sidebar, paper content, pink reservation bars, sage housekeeping states. Near-front-on desktop application on pale blush background, detailed realistic interface, no hardware, no claims. Main label: Бронювання. A visible HTML caption identifies the concept and illustrative data.
2. hospitality-v3: candid receptionist welcoming a happy adult couple at a European boutique hotel, oak counter, ivory walls, plum blouse, subtle blush flowers, soft morning light, natural anatomy and expressions, editorial 50mm photography, no text/logo/watermark.
3. team-v3: female hotel manager and male colleague reviewing a tablet in a boutique hotel lounge, plum tailoring, paper/ivory interior, blush upholstery, natural daylight, candid relaxed expressions, no text/logo/watermark.

The generated people are illustrative; they are not presented as VDALO customers or testimonials.

## Remaining operational setup
Enquiry delivery requires the user's destination webhook/contact and final privacy operator details.

## Design critique and refinement

| Area | Previous issue | Implemented change |
|---|---|---|
| First impression | Small conceptual diagram did not convey hotel atmosphere | Large hospitality image and stronger hero hierarchy |
| Product explanation | Minimal three-row calendar | Detailed full-width calendar concept plus explanatory copy |
| Visual rhythm | Repeated neutral cards and mostly text | Photography, dark feature card, blush surfaces and distinct section compositions |
| People | No human context | Team photograph and role-specific product story |
| Motion | Only hero entrance | Scroll reveals, integration beams, card hover and progress cue |
| Mobile | Oversized hero line breaks | Three-line heading at 390px, complete calendar and detail link |

Browser review: mobile at 390px and the desktop layout, local images loaded, no horizontal page overflow at 390px. Animation styles are active and the integration diagram renders correctly.
