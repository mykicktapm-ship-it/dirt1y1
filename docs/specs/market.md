# Market and media

## Catalogue

`src/resources/marketplace.ts` holds 7 items (id → title): `glock18` → Glock 19,
`weapon-case` → Weapon Case, `briefcase` → Briefcase, `bulletproof-umbrella` → ParaPactum,
`to-the-moon-visa` → To The Moon Visa, `bitcoin` → Bitcoin, `ethereum` → Ethereum. IDs are
stable asset keys; titles and descriptions are owner copy.

## `/market`

- No `My positions` button in the profile (the catalogue tab covers it). The
  `Hover to preview` guide sits in the profile block, under the market cap; the skeleton
  mirrors it.
- Spacing on one 16px step: guide → trade cards → divider → tabs → grid.
- Profile block: `Market cap` of USDC (the project coin) from the public market snapshot
  (`useMarketSnapshot`, USD, compact; `—` while loading, stale or unavailable; the Birdeye
  disclosure is the block's label and tooltip), without a chart; then the label
  `Trade history` and a
  horizontal row (no visible scrollbar) of
  trade-history cards (`AssetCard`, ~80% scale, no hover scale, no
  leverage, no badge), 4.25rem tall and as wide as its content (~10rem): left panel with the
  change since launch and price on the brand market colours (emerald #34d399 up, rose #fb7185 down), right
  panel filled by the item image (no name; it is the link's accessible label). The whole card
  links to the item page.
  Price and change come from the item figures (below); an item without a price has no card.
  The market skeleton mirrors the row.
- Catalogue cards and the Home S2 card show the same item figures as the item page: preview
  fixtures until the item's mint is set, then the live curve or pool. Every change on the site
  is `since launch`: preview from the first fixture close; live from the curve's launch price,
  recovered on-chain as `k / PUMP_INITIAL_VIRTUAL_TOKEN_RESERVES` (`getPumpCurveLaunchQuoteReserves`;
  verify the Global value before calling it exact).
- `My positions`: items the connected wallet holds (`useItemHoldings`, both token programs),
  with amount and the sale value now before fees (`Your positions`, `Before fees`). Empty:
  `No items yet`, `Buy an item on Pump.fun. It will show up here.`, `Explore items`.

- Grid of `GlassCard`s, two proportionally scaled cards per row, fill grey at 10% opacity.
- Hover starts a 360° turntable of the item model (no tilt or movement); leaving returns to
  the cover. Touch and keyboard toggle the 3D preview with a button. Reduced motion stops
  continuous rotation. 3D keeps a transparent background in both themes. One active viewer.
- Clicking a cover opens `DCMediaCarousel` in a native modal: item title and description
  below the media; manual arrows, swipe, keyboard, dots; no auto-advance; video pause/sound
  controls; Escape/backdrop close; focus returns; backdrop blurs without tint. Capsule at most
  288px wide / 80% of dialog width; media height fits 80% of the viewport after measuring the
  caption; very short viewports scroll the caption. Media loads only while open.
- Media per item: Glock — second MP4, then JPG; To The Moon Visa — passport image; Bitcoin and
  Ethereum — cover images; others — three demo videos (temporary).

## `/market/[itemId]` — item scene

Statically generated per catalogue item. `ItemMarketPage` reads all item curves once
(`useItemMarkets`, refresh 30 s while visible and something trades) and never signs or builds
a trade. Layout: back link; then **price hero** (left) and **copy** (right); then
**Trenches Market**. Mobile stacks them in that order.

1. **Price hero** (`ItemPriceHero`, `bare`: no background or
   frame): the item title as the page `h1`, legend Sold / On curve
   / Reserved, dot-matrix price in USDC, change since launch and its amount, `Preview` chip. Under the price
   sits the item: catalogue cover, then the 3D model (loads only
   while visible, honours Save-Data and reduced motion, paused off-screen, cover as fallback).
   The period is always since launch and the quote USDC; the page has no period or quote controls.
2. **Copy**: status line, then the **trade estimator**
   (`TradeEstimator`): Buy/Sell, amount, "You get about" and price impact from
   `quotePumpCurveBuy` / `quotePumpCurveSell` (`bigint`, before fees), and a
   `Buy/Sell on Pump.fun` action — a link when a mint exists, disabled otherwise. Before launch
   it runs on labelled preview reserves.
3. **Trenches Market** (`TrenchesMarketCard`, `bare`): no background or frame, page theme
   colours; total market cap, share bar, the three largest other items as links.

Not on the item page by owner decision: the bento header (Market, period, quote, avatar),
Bonding curve, Price change, Curve reserve, Fees, Reputation, Buys and sells, Volume. Those
cards stay exported from `ItemMarketBento.client.tsx` for other routes:

| Shows | Card | Source today |
| --- | --- | --- |
| Curve allocation | `CurveGaugeCard`: % sold, Sold / On curve / Reserved | live from `realTokenReserves` |
| Price change | `ChangeCard` | preview only |
| Curve reserve | `ReserveCard`: `realQuoteReserves`, ticks to graduation | live |
| Fees | `FeesCard`: Pump.fun `—`, Creator (`creator_fee_bps`), Pair | creator fee live |
| Reputation | `SeasonCard`: reputation trades, volume | preview only |
| Buys and sells | `FlowCard`: buys and sells | preview only |
| Volume | `VolumeCard`: Mon–Fri | preview only |

Cards are dark islands in both themes (except `bare`): graphite depth instead of saturated
gradients, the catalogue frame (hairline, brighter left/bottom), the price card tinted with
`--dc-color-accent`, the change tile solid accent. Series tones: Sold/Buys white,
On curve/Sells accent, Reserved muted. Cards rise in sequence, charts grow, numbers count;
reduced motion shows the final state. Tooltips are pointer-only; each chart has a text
equivalent or a labelled figure.

| State | Status | Values |
| --- | --- | --- |
| loading, RPC error, `missing`, `wrong-quote` | Loading / Unavailable | `—` everywhere, structure kept |
| `not-launched` | Not launched yet | labelled preview fixtures (`item-market-design-preview.ts`) |
| `curve` | On the bonding curve | live price, cap, estimator, change since launch |
| `graduated` | On PumpSwap | price, cap and estimator from the canonical pool (effective quote reserves); `—` if the pool cannot be read |

Preview fixtures never reach RPC, wallet or trade code. `PUMP_INITIAL_REAL_TOKEN_RESERVES`
(793.1M) is Pump.fun's published Global value; verify it on-chain before calling progress exact.

OWNER COPY (placeholders, replace or confirm) on the item page: Sold, On curve,
Reserved, "since launch", Trenches Market, N items, Market cap, You pay, You sell, You get about,
Price impact, "Curve estimate before fees. Trades happen on Pump.fun.", Buy/Sell on Pump.fun,
Preview.

## Launch

All addresses live in `src/resources/launch.ts`: `usdcMint` and one mint per item (`null`
until launch). Setting an item's mint switches that item from preview to live data on every
screen; nothing else changes.

## Entry points

`src/app/market/page.tsx`, `src/components/MarketplaceCards.client.tsx`,
`src/components/ui/glass-card.tsx`, `src/dc-ui/media/DCMediaCarousel.tsx`,
`src/app/market/[itemId]/page.tsx`, `src/components/ItemMarketPage.client.tsx`,
`src/hooks/useItemMarket.ts`, `src/hooks/useItemHoldings.ts`, `src/dc-chain/item-market-view.ts`,
`src/components/market-bento/`, `src/components/item-market-design-preview.ts`,
`src/components/MarketProfile.client.tsx`, `src/resources/launch.ts`,
`public/marketplace/viewer/index.html`.
Model credits: `ATTRIBUTION.txt` next to each model in `public/marketplace/`.

## Checks

`npm run check:market`; manual: carousel keyboard/pointer open-close, no auto-advance, focus
return, media pause on close, one active 3D viewer.
