# DC UI

## Behavior

DC UI (`src/dc-ui`) owns shared tokens, layout, typography, theme, motion, feedback and SEO
primitives. It is the only shared design system: do not add another component library.
Feature media and business rules stay in their feature. Inspect consumers before changing a
shared export; keep token names.

- Theme defaults to dark. An explicitly saved dark/light choice is honored; the OS preference
  never switches it.
- Visible `USDC` labels render through `DCCurrencyMark` (Manufacturing Consent lettering,
  `1.55em`, `line-height: .78`). `aria-label`, `title`, `alt` and metadata use plain `USDC`.

## Loading

- Full page entrance: static Dirtycoin logo with a silver shimmer on black for 1,500 ms, then
  the page skeleton for a random minimum of 1,000–2,500 ms (cache does not skip it).
- Internal route change: the persistent umbrella moves from its current pose to a centred,
  enlarged top view over a dim page, then flies to the next route’s pose. The page is revealed
  after its media and fonts are ready. The internal skeleton minimum is 180 ms and the logo
  phase is 200 ms; navigation and wallet stay mounted.
- Reveal happens after the minimum and after visible loading markers and fonts settle. A
  12 s safety bound prevents a stuck dependency from blocking the page.
- Reduced motion keeps logo and timing, drops shimmer and pulse.
- The entrance is a download window. At its start `entrance-preload.ts` plans what to fetch:
  budget = downlink × (window − RTT) × 0.8, window = logo + minimum skeleton (2500 ms on a
  full load), unknown network = 10 Mbps / 100 ms. Priority 0 is always fetched, lower
  priorities fill the budget strictly in order, the rest is fetched after `dc:site-ready`
  when the browser is idle; Save-Data fetches priority 0 only. Today's manifest is the
  umbrella (viewer, Three.js modules, GLB): priority 0 on Home, 1 elsewhere. Asset sizes in
  the manifest must be updated when the files change.
- Images lazy-load by viewport; at most 2 image preloads run at once (1 on constrained
  connections or data saver). No Network Information API → 2.
- Primary navigation disables speculative prefetch.
- `GlassCard` takes `active`: when false it skips poster skeleton, preview queue and the 45 s
  preview hold. Home passes scene activity; `/market` uses the default `true`.

## Persistent umbrella

`DCUmbrellaStage` (mounted once in the root layout) keeps one umbrella alive on every route.
It loads immediately on Home and after `dc:site-ready` elsewhere from the warmed cache.
Home sends its S1–S5 camera targets to the stage instead of mounting an iframe.

- Route change: from the last visible pose, the umbrella flies to the centre, grows to 92%
  of the short viewport side, turns to a top view and spins faster. A plain dim layer covers
  the page. After `dc:page-ready` and at least 850 ms from navigation, it flies to the new
  Home pose or the 28 px header badge. The viewer and spin angle persist throughout.
- Flights to the cover and to the target take 850 ms each on a smootherstep curve (zero speed
  and acceleration at both ends); the cover spin is 2.2 rad/s. Home follows the scroll with a
  softer exponential smoothing (rate 6/s).
- Motion uses the same renderer and viewport camera for Home, cover and badge. The visible
  badge turns slowly at 30 fps; reduced motion skips the flight and idle spin. The stage
  never blocks input (`pointer-events: none`). Save-Data or viewer failure leaves the static
  poster on Home and the Home icon in the header.
- `DC_UMBRELLA_STAGE_ENABLED = false` turns the feature off.

Acceptance: on a mid-range phone the cover and flight hold 60 fps with no dropped frames
visible in a Performance recording; the badge never covers another control; tab hidden →
no rendering.

## Entry points

`src/dc-ui/index.ts`, `src/dc-ui/tokens/tokens.css`, `src/dc-ui/providers/DCThemeProvider.tsx`,
`src/dc-ui/feedback/DCSiteEntrance.tsx`, `src/dc-ui/feedback/DCLoadingContext.tsx`,
`src/dc-ui/feedback/image-load-queue.ts`, `src/dc-ui/feedback/entrance-preload.ts`,
`src/dc-ui/motion/DCUmbrellaStage.tsx`.

## Checks

`npm run check:dc-ui`.

## Performance

- Inert regions (hidden Home scenes and similar) pause all CSS animations
  (`[inert] * { animation-play-state: paused }` in `tokens.css`).
- Decorative repeats use one animation per group, not one per element (e.g. the S4 NFT wall
  is a single light sweep).
- Videos pause while their scene is inert, the tab is hidden or they are off screen.
- No hover lifts, scale-ups or glows; hover may only tint background or border.
