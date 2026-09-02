# Traverze Travel — Website

A modern, elegant, refined single-page website for **Traverze Travel** (*Travel Like A Pro*), Zimbabwe's leading travel management company since 2003.

## Design

Built following the [UI/UX Pro Max skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) principles:

- **Palette** — ivory ground, deep ink, muted gold accent (4.5:1+ text contrast throughout)
- **Typography** — Fraunces (display serif) paired with Inter (body sans), mood-matched for a premium travel brand
- **Icons** — inline SVG (Lucide-style strokes), no emoji icons
- **Layout** — generous whitespace, bold headlines, deliberately uncrowded content
- **Responsive** — tested breakpoints at 375 / 768 / 1024 / 1440 px
- **Accessible** — visible focus states, `prefers-reduced-motion` respected, semantic landmarks

A companion hero banner was also generated with Canva for use in social/marketing:
[view the Canva design](https://www.canva.com/d/vjKLgp7iRMDX9Mb) · [edit it](https://www.canva.com/d/4YBEPjlM4-Rqz1R)

## Structure

```
index.html        # single-page site: hero, stats, destinations, services, story, lounge, contact
css/style.css     # design system + layout
js/main.js        # nav, scroll-reveal, count-up stats
assets/           # favicon
```

## Run

Open `index.html` in a browser, or serve locally:

```sh
python3 -m http.server 8000
```

Destination photography is hot-linked from Unsplash and degrades gracefully to tinted gradient panels if an image is unavailable.
