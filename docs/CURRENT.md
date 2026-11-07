# Current state

Single source of current truth. Keep it under ~3k tokens. Update it when a decision is made
or a conflict is resolved; delete resolved items instead of marking them.

## Product

Dirtycoin Web: a static Next.js site (static export to IPFS/Arweave/static host) for the
project coin. No backend, no database, no secrets in the bundle. Signing stays in the
user's wallet.

Positioning: privacy, user control and intended open-source development. The product is an
application on Solana, not a chain, wallet, privacy protocol or security service.

## Glossary

| Term | Meaning |
| --- | --- |
| USDC (visible) | **United States Dirty Coin**, the project coin. Rendered through `DCCurrencyMark`. Not launched; planned on Pump.fun. Not Circle USDC. |
| DC, `$DC` | Same coin in code and docs. Launches via Pump.fun `create_v2`, so the mint is **Token-2022**. Its mint is `usdcMint` in `src/resources/launch.ts`: until launch a legacy/reference value, not the launched coin. |
| Circle USDC | The stablecoin. Always name it explicitly. |
| GameFi sector | Planned on-chain game hub (ADR 0007). |
| Trenches Market | The 7 item coins on Pump.fun, each quoted in USDC (see Economics). |
| Item | One of 7 catalogue records in `src/resources/marketplace.ts`: `glock18` (shown as Glock 19), `weapon-case`, `briefcase`, `bulletproof-umbrella` (shown as ParaPactum), `to-the-moon-visa`, `bitcoin`, `ethereum`. |
| S1–S5 | Home scenes, numbered as the on-screen nav `01–05`. Code index = number − 1. |

## What works today

- Routes: `/` Home, `/about` Dashboard, `/market`, `/market/[itemId]`, `/community`,
  `/community/[slug]`. Header nav: Home, Dashboard, Market.
- Wallet connect (Wallet Standard), exact SOL and `$DC` balance reads with RPC failover.
- Dashboard: profile, inventory preview, Battle Pass level with the USDC balance.
- Market-cap and top-wallet snapshots (DirtyBot promo) from public Birdeye-derived JSON.
- Catalogue of 7 items with covers, 3D models and media carousel.
- Home S1–S4 rendered (S4 previews the planned GameFi sector); S5 is empty.
- Branded entrance and skeleton loading.
- One item data source for the catalogue, Home S2 and item pages: labelled preview fixtures
  while an item's mint is `null`, then its Pump.fun curve or PumpSwap pool. Fixtures are
  visual only, never live data or chain inputs.
- Wallet item holdings (`My positions`) from both token programs.
- Launch = fill the addresses in `src/resources/launch.ts`; nothing else changes.

## What does not exist

No coin is launched yet, no NFT program, no game, no distribution module. A GameFi sector
is planned ([ADR 0007](decisions/0007-gamefi-sector.md)); Home S4
previews it with skeletons. Before launch every item price is a labelled preview fixture.

## Economics

Adopted: [ADR 0006](decisions/0006-trenches-on-pump.md). USDC launches on Pump.fun (`create_v2`,
Token-2022, paired with SOL, **no mayhem mode**). Each of the 7 items launches on Pump.fun as a
coin quoted in USDC (custom pair). Trading happens on Pump.fun; this site only reads public
on-chain state and links out. Item-trading activity per wallet counts toward an NFT airdrop (no seasons), from a
snapshot. Plan and status: [trenches-pump](tasks/trenches-pump.md).

Undecided (never show as facts): `creator_fee_bps` per item, launch order, airdrop formula and snapshot date.

Earlier models are not current rules: LaunchLab + Farm v6 + burn-to-mint (ADR 0004),
EV-ROUND-V1, EV-CASCADE, item shares on an own bonding curve, Base module + bridge, Neon,
the native Distribution module.

## Research

`../research/` keeps future work and paid-for research apart from the product: the GameFi
sector research (GameFi v1.1, the NFT decision of ADR 0003, the Alpha roadmap) in
`../research/gamefi/`, the decision history, evidence, research method, specs and tasks of
earlier models, code prototypes (`../research/prototypes/`, same paths as in the project) and
asset work logs (`../research/asset-logs/`).
It is not built, linted or loaded by default.

## Product invariants

- Static output only; only public config in `NEXT_PUBLIC_*`.
- No yield, payout, profit or APR promises. Price changes and rewards are never "returns".
- Privacy claims stay literal: no analytics or ad trackers, no account database, keys stay in
  the wallet. Hosting, RPC and media providers still see IP addresses.
- Open source under the MIT License (`LICENSE`).
  Third-party assets keep their own notices next to the files (models, fonts, three.js).
- Visible copy comes from the owner (see [content](specs/content.md)).
- No changes to token economics, custody, signing or deployment as a side effect of UI work.

## Known conflicts (code vs. current direction)

Ordered by visibility. Resolve with the owner; then fix code and delete the line here.

1. **Nav labels**: S4 now previews the GameFi sector but the nav still says `ParaPactum`;
   S5 is empty and labelled `Footer`.
2. **Countdown** to `2026-11-13T23:59:59Z` ("Early Adopters Event") on the S2 cart and mobile
   banner: confirm it is still a real date.
3. **S1 description** renders without parentheses around USDC; the approved string has them.
4. **S2 risk heading** renders `Spend USDC in the Trenches Market`; the approved string ends
   at `Trenches`.
5. **Battle Pass** levels (shown in the Dashboard Level card) are priced in SOL and not
   linked to items.
   Remove in a separate change with a build check.
