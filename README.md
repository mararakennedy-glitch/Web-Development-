# Traverze Travel — Luxury Website

The digital flagship for **Traverze Travel** (*Travel Like A Pro*) — a prestige African travel house serving Zimbabwe & Zambia since 2003. Designed as "African Golden Hour Luxury": deep midnight emerald and charcoal, champagne gold, editorial serif typography and cinematic 3D.

## Highlights

- **Interactive 3D globe hero** (Three.js) — drag-to-spin Earth with inertia, champagne-gold atmosphere rim, pulsing destination markers with glass price tooltips, and golden flight arcs launching from Harare to Cape Town, Durban, Doha, Dubai, Zanzibar and Beijing, over a drifting starfield.
- **Scroll-driven gold aircraft** (GSAP ScrollTrigger + MotionPath) banking along a bezier contrail that draws itself between the hero and services.
- **3D tilt package cards** — real packages with real pricing, layered parallax depths, gold light sweep on hover, filterable by destination and travel style.
- **Full luxury system** — glassmorphism panels with gold hairlines, film-grain overlay, magnetic buttons, gold-ring cursor (desktop), count-up numbers, horizontal drag gallery of five destinations, auto-rotating Google-review carousel.

## Design principles (UI/UX Pro Max)

- **Palette** — emerald `#0B2B26` / charcoal `#121212` base, champagne gold `#C9A227`, brass `#B08D3F`, ivory `#F7F3EA` text, burnt amber `#D97B29` CTAs
- **Typography** — Fraunces (high-contrast display serif) paired with Montserrat (letter-spaced uppercase labels)
- **Accessible** — semantic landmarks, ARIA labels, visible focus states, full `prefers-reduced-motion` support (3D and motion disabled, beauty kept)
- **Responsive** — mobile-first breakpoints at 480 / 768 / 1024 / 1440 px; WebGL defers until after first paint and degrades to a static scene on small screens or without WebGL
- **SEO** — schema.org `TravelAgency` markup with both office addresses, full meta/OG tags

## Structure

```
index.html            # single-page site — hero, trust bar, services, packages,
                      # destinations, why, testimonials, highlights, journal, contact
css/style.css         # design system + layout
js/globe.js           # Three.js hero globe (ES module)
js/scroll.js          # GSAP scroll choreography
js/main.js            # nav, cursor, magnetics, tilt, filters, carousel, form
js/vendor/            # three.module.min.js, gsap + ScrollTrigger + MotionPathPlugin (vendored)
assets/               # logo, favicon, earth texture
```

## Run

Serve locally (ES modules require http, not `file://`):

```sh
python3 -m http.server 8000
```

Destination photography is hot-linked from Unsplash and degrades gracefully to tinted gradient panels if an image is unavailable.
