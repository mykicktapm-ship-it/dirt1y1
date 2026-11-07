# Application shell

## Behavior

- Static export keeps these routes working: `/`, `/about`, `/community`,
  `/community/[slug]`, `/market`, `/market/[itemId]`, plus metadata,
  sitemap, robots and RSS.
- Header nav: Home (`/`), Dashboard (`/about`), Market (`/market`), filtered by the routes
  enabled in `src/resources/dc.config.ts`. Labels come from `src/resources/content.tsx`.
- Shared providers mount in the root layout; feature polling stays inside its route.
- The Matrix background is shared by all routes. Stages and renderers stay transparent: no
  full-stage glow, vignette or grain overlays.
- Home composition is specified in [home](home.md).

## 3D umbrella

The local Black Umbrella GLB (core glTF material, darkened diffuse) is rendered by
`public/home/umbrella-viewer.js` inside a same-origin iframe using the vendored Three.js
files. One iframe persists in the root layout across Home and all other routes. It uses
`color-scheme: normal`, validates same-origin messages, pauses when the tab is hidden,
honors reduced motion and releases resources when closed.

## Entry points

`src/app/layout.tsx`, `src/components/Header.tsx`, `src/resources/dc.config.ts`,
`src/resources/content.tsx`, `public/home/umbrella-viewer.js`.

## Checks

`npm run check:release`.


The header navigation pill is left-aligned on every page (desktop and mobile); the right
corner stays free for page controls such as the Dashboard notifications pill.
On Home the Home entry shows the label `Dirtycoin` instead of the house icon (the umbrella is
in the scene there); elsewhere it keeps the icon slot the umbrella badge lands on.
