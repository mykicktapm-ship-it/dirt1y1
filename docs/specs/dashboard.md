# Dashboard `/about`

## Layout

Same layout as the item page, up to 40rem, centred, no card surfaces (bare `market-bento`
cards, page colours). `DashboardView` scans the wallet once for the page.

1. **Account hero** (where the item page has its price hero): the account name as the page
   `h1` with the wallet button on its right; the wallet line under it; the exact `$DC` (USDC)
   balance as the dot-matrix figure (two decimals, rounded down) with the USDC mark, SOL to
   four decimals beside it. Disconnected: a number-shaped `——.——` placeholder (never a
   zero), `— SOL`, a `Preview` chip.
2. **Inventory** as the hero's stage (where the item page shows its 3D item).
3. **Level** (Battle Pass) below.

## Account

- Name: the wallet account label, else `User`. Never invent identity.
- Wallet line: `Wallet not connected`, or the address shortened to its first and last six
  characters; the full address is in `title` and read by screen readers.
- Balance: never zero for "no data"; loading and RPC failure are announced in the figure's
  label. Read-only, no actions, no market estimates.

## Level (Battle Pass)

- Current level name and number from native SOL (`getTierProgress`), a tick bar to the next
  level, `N SOL to <next>` (or `Top level`), and the five-level ladder with thresholds; the
  current level is marked in accent. Disconnected: `—`, empty bar, `Wallet not connected`.

OWNER COPY (provisional): Level, Lv, `N SOL to <level>`, Top level, `<n>/7`.

## Inventory

- `Inventory`, a `Preview` marker and a selected count (`3/7`), then every catalogue item as a
  tile (cover and name; four columns, three below 30rem). Selected items are in colour,
  available ones in grayscale and slightly smaller; a click or keyboard press toggles an item
  (spring scale, reduced motion respected).
- Local UI state only: not an ownership query, resets on remount, no signatures.

## Notifications

- Collapsed by default: a `View all` pill with a bell and the total count, fixed in the
  top-right corner and rendered into `<body>` (inside the page it would sit under the
  full-width fixed header). It is styled like the header pill and takes the pill's measured
  top and height, so both share one centre line; if they would touch, it drops below the
  header. Bell and count only below 40rem.
- Pressing it opens the full notifications menu (tabs View all / Verified / Mentions, items,
  posts, video note) in a modal panel anchored to the top-right corner, frosted dark glass
  without a frame over a lightly dimmed page: focus moves into it,
  Escape, the close button or a backdrop click closes it and focus returns. The menu mounts on
  first open. `/about/#notifications` opens the panel directly.
- The dashboard skeleton mirrors the layout in the project skeleton style: text-shaped plates
  for name, wallet line and levels, a balance figure plate, the seven items as silhouettes from
  their cover masks, a tick-bar plate, and the pill.

## Battle Pass

A versioned static ruleset in `public/data/battle-pass.json`, rendered in the Level card:
Visitor 0, Holder 0.1 SOL, Black Umbrella 7 SOL, Whale 67 SOL, Dirty Hand 200 SOL. A client-side level
is never proof of ownership; partners must verify on-chain. Its link to items is undecided
(CURRENT, Battle Pass conflict).


## Entry points

`src/app/about/page.tsx`,
`src/components/about/DashboardView.client.tsx`, `src/components/about/NotificationsPanel.client.tsx`, `src/dc-ui/feedback/DCDashboardSkeleton.tsx`,
`src/components/Inventory.client.tsx`,
`src/components/ui/empty.tsx`, `src/utils/tierSystem.ts`, `public/data/battle-pass.json`.

## Checks

`npm run check:dashboard`, `npm run typecheck`; `npm run test:contracts` when balance or level
logic changes.
