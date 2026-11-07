# Home `/`

`src/app/page.tsx` renders `HomeStage`: a sticky, transparent scroll stage with five
scenes over the shared Matrix background and a right-side scene nav. The home stage sends
camera targets to the single persistent umbrella viewer in the root layout.

## Numbering

| Scene | Nav label | Code index (`active`, `data-sc`) | Component | Status |
| --- | --- | --- | --- | --- |
| S1 | `01 USDC` | 0 | hero block in `home-stage.tsx` | LOCKED |
| S2 | `02 Items` | 1 | `home-item-showcase.tsx` | COPY REVIEW |
| S3 | `03 How it works` | 2 | `home-game-stepper.tsx` | COPY APPROVED |
| S4 | `04 ParaPactum` | 3 | `home-sector-preview.tsx` | PREVIEW — copy provisional |
| S5 | `05 Footer` | 4 | empty | OPEN — no content |

Always refer to scenes as S1–S5. Never use the code index as a scene number.

## Shared behavior (all scenes)

- Scene order, scroll mapping, stage height, camera keys (`KEYS`, `KEYS_TALL`) and reveal
  timing are fixed unless the task changes them.
- The nav is hidden on S1 and on small screens; buttons jump to a scene and mark the active
  one with `aria-current="step"`.
- Hidden scenes are `inert` and `aria-hidden`. Reduced motion stops idle animation.
- One persistent umbrella viewer is mounted across all routes. The poster stays until the
  model is ready or if it fails; on failure the ParaPactum cover is shown.
- First Home load: the S1 skeleton (entrance and poster) is the upright umbrella seen from the
  side (the ParaPactum cover silhouette). The model enters in the same side view (elevation
  10°), holds 0.6 s after the site is revealed, then turns to the S1 top view over 1.4 s.
  Reduced motion and later visits to Home start in the top view.
- The root umbrella viewer starts loading at the first frame of the Home entrance; the
  entrance preload also requests its files. Home sends its S1–S5 camera targets in viewport
  coordinates, and a route transition continues from the last visible target.
- Frame budget (60 fps): the scene loop reads layout once per frame and before any style
  write; anchors and the sticky offset are cached and refreshed on DOM change or resize.
  The viewer renders at most once per display frame, skips identical frames, and adapts
  its pixel ratio (max 1.5 on touch devices, 2 otherwise, never below 1) to frame timing.

## S1 — Hero (LOCKED)

- Title: the `USDC` lettering (`DCCurrencyMark`) in an `h1`.
- Description (approved): `United States Dirty Coin (USDC) is a Solana-based digital asset
  project focused on privacy development`. Code currently omits the parentheses (CURRENT, conflict "S1 description").
- Typography matches the Dashboard account name and wallet line (`Empty*` primitives).
- Mobile/tablet (stage ≤1020px): text group at the bottom of the scene under the umbrella.
  Desktop: upper centre at `top: 5rem`, separate crown camera.
- Action: `HomeAccessActions` — `Connect` (opens wallet dialog) or `Continue` when connected;
  continuing jumps to S2.

## S2 — Items (COPY REVIEW)

- Gallery: all 7 catalogue items as miniature buttons (`aria-pressed`); selecting one updates
  the item card. Leaving the scene resets the selection.
- Item card: shared `GlassCard` (same as `/market`), links to `/market/{id}/`. Price and
  change are the item figures shared with `/market` and the item page (market spec).
- Right column: label `MARKET`, three lines `Earn in` / `the Trenches` / `Market` (approved);
  label `MARKET CAP`, `StatsWidget`: value `—` and caption `Not launched yet` until an item
  trades, then the summed live market cap of the items in USDC without a caption.
- Cart button: local "added" state only, plus countdown to `2026-11-13T23:59:59Z`
  (`use-cart-countdown.ts`). No wallet action.
- Risk block: heading `Spend USDC in the Trenches` (approved; code adds `Market`; CURRENT, conflict "S2 risk heading") and disclaimer `These are high-risk assets. By investing, you may lose your funds.`
  (approved). The disclaimer must stay visible next to any economic claim on every viewport.
- Mobile banner (mobile only): `DirtycoinParallaxCard` with the text `Connect and sign a
  message to buy, bid, or open your P2P dashboards. The Market is open soon!` and the
  countdown. Mobile order: gallery, banner, item block.

Acceptance for S2 changes: no yield/payout figures; the disclaimer remains readable on desktop
and mobile; the item card and `/market` show the same numbers.

## S3 — How it works (COPY APPROVED)

Explains the Trenches loop from ADR 0006 without promising a return. Owner-approved copy:

- No heading or lede (removed by the owner); the section is labelled `How it works` for
  assistive tech.
- Steps, each a number, title and one line of text:
  1. `Load up on USDC` — `Grab USDC on Pump.fun. That's United States Dirty Coin, not the bank kind.`
  2. `Pick your bag` — `Every item is its own coin, priced in USDC. Glock, ParaPactum, whichever bag you want to hold.`
  3. `Ride the curve` — `Each buy pushes the price up the bonding curve. Once the curve fills, the item graduates to PumpSwap and keeps trading there.`
  4. `Farm the drop` — `Every trade in the seven items counts toward the NFT airdrop.`
- Risk line (approved S2 disclaimer): `These are high-risk assets. By investing, you may lose your funds.`

Layout: a glass chat (`glass-message.tsx`, glass in SCSS, at a
smaller scale: 12.5px type, tighter bubble, 26px avatars) filling the space above the steps; four steps below in a row (2×2 when the stage is
≤720px) without divider lines; risk line at the bottom, always visible.

- History above, from the crowd (right, tinted bubbles), oldest first, running off the top of
  the scene under the header with a fade: `REVOLUTION RN 💀🏰⚔️`,
  `bought Bitcoin with USDC with SOL. three layers deep rn` (owner-picked). The chat is
  bottom-aligned and extends to the stage's top edge.
- Chat message 1, from `$Dirtycoin` (left), the answer: `ser, don't trust us. DYOR with your own AI: drop
  our llms.txt in and let it read the Pump.fun contracts and the curve. No custom contract,
  nothing to rig.` plus an `llms.txt` button that copies the text of `/llms.txt` to the
  clipboard and shows `copied ✓` (accent) or `copy failed` for ~2 s, announced politely.
- Message 2, on the right: the pinned round video note, `min(13rem, 26% of the stage
  height)` (`VideoNoteCircle`, the same component and data as in Dashboard notifications,
  `src/resources/video-note.ts`), then a typing indicator.
- The crowd history is static. The rest plays out while the visitor stays on S3 (tab visible,
  scene not inert), each preceded by the typing indicator: after 3 s the llms.txt message
  (umbrella avatar), 4.5 s later the video note (right), 5 s later from `$Dirtycoin` (D logo
  avatar) `more three-layers-deep people in our chats. you'll fit in.` followed by the
  Telegram, X and Discord logos as plain icons (no link: the chats are listed in the footer and
  token metadata; an in-page jump would skip S4). Each item grows in over 1.1 s (instant under
  reduced motion). Provisional owner copy.
- The umbrella is the chat's avatar: `data-umbrella-step-anchor` sits in message 1's avatar
  slot and the scene camera flies the umbrella there.
- A step is highlighted on hover (mouse) or click; there is no auto-advance.

`/llms.txt` (`public/llms.txt`) is a draft brief for language models; the owner will write it
separately. Do not edit it as part of S3 work.

Rules: no price, fee, quote or computed figure; no wallet or transaction actions; visible text
only from the owner. `USDC` renders through `DCCurrencyText`.

## S4 — GameFi sector preview (PREVIEW)

Previews the planned GameFi sector ([ADR 0007](../decisions/0007-gamefi-sector.md)): Ape
Church's structure in Dirtycoin packaging. Mounted lazily once the scroll passes S2.

- Heading (display face) and lede in a narrow left column (≤46% of the stage, 48% on
  stages ≤720px), then the app window filling the rest of the scene down to its bottom edge.
  The approved risk line `These are high-risk assets. By investing, you may lose your funds.`
  sits over the bottom of the shot on a dark fade, always readable.
- The window is a promo shot tilted in 3D (`rotateX(28deg) rotateZ(-11deg)`). Its design width
  equals the box width within 420–860px (so narrow stages are not shrunk to nothing). Below
  560px the window is "narrow": three arcade tiles, section cards in two columns (dense
  packing, HQ a full row); 560–640px four tiles; above, five tiles and three columns and its height follows the box's proportions
  (480–1500px). The scale is read back
  from the tilted shot's real bounds so it covers the box and runs just past the left, right
  and bottom edges (6% wider, 5% taller than the box); the scene clips it. It has no
  background or frame of its own; the cards inside keep the dark glass. Tall designs show six
  feed rows instead of three. Contents: section rail, search,
  category chips, `Arcade` row of item covers, five `The sector` cards (HQ spans two columns),
  `Onchain feed` with tabs.
- Art comes from the catalogue covers; the HQ card shows a wall of NFT card silhouettes.
  Names of games, card descriptions and feed rows are skeleton bars (shimmer; static under
  reduced motion). Every card is `Soon`. Nothing is interactive.
- Camera: the original wide S4 key; on portrait stages the tall key is about 6% of the stage higher
  (size 0.86, ox 0.5, oy 0.58) and the text column is drawn 3.5% lower with a transform, so the
  window keeps its position. The umbrella may still cover part of the text and window.

OWNER COPY (provisional, replace or confirm): `Next in the Trenches`; `GameFi with a
player-backed house and thousands of NFTs. Players set the emission and fund the prize pools.
Every bet settles onchain.`; rail labels Dashboard,
GameFi, HQ, House, Shop, Leaderboard, Pawnshop, Receipts; `Search GameFi`; chips Hot, Slots,
Table games, Plinko & Keno, Strategy; `Arcade`, `The sector`, card titles House, HQ, Pawnshop,
Shop, Leaderboard; `Onchain feed`, tabs All bets, Biggest wins 30d, Biggest wins
all time; badges Soon, Live. No figures (supply, pool, payouts, odds) until ADR 0007 decides them.

## S5 (OPEN)

Empty scene. It keeps its scroll slot and nav entry; its camera centres the umbrella on the
stage (oy 0 on wide and tall stages). Do not add content without an
owner brief.

## Entry points

`src/app/page.tsx`, `src/components/ui/home-stage.tsx`,
`src/components/ui/home-item-showcase.tsx`, `src/components/ui/home-game-stepper.tsx`,
`src/components/ui/home-sector-preview.tsx`,
`src/components/ui/home-access-actions.tsx`,
`public/home/umbrella-viewer.js`.

## Checks

`npm run check:release`, `npm run typecheck`, browser check of the changed scene on desktop
and at 393×852.
