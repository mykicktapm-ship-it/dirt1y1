# 0006 — Trenches Market on Pump.fun custom pairs

Date: 2026-10-28. Status: **adopted** by the owner. Replaces ADR 0004 (LaunchLab) and the
0005 draft; both are in `../research/decisions/`.

## Decision

1. **USDC (United States Dirty Coin)** launches on Pump.fun via `create_v2` → Token-2022,
   paired with SOL. It must **not** use mayhem mode: a mayhem coin cannot be a quote asset.
2. **Each of the 7 items launches on Pump.fun as its own coin quoted in USDC** (custom pair,
   `create_v2` with a pump-coin quote). Items are bought and sold only for USDC: on the
   Pump.fun curve, then on PumpSwap after graduation. Items are not mayhem coins either.
3. **Trading happens on Pump.fun.** This site never signs or builds trades; it reads public
   on-chain state (curve accounts, later PumpSwap pools) and links to each item's Pump.fun page.
4. **Trading activity in the 7 item coins counts toward an NFT airdrop.** No seasons: one
   ongoing grind, computed per wallet from public trade data in a snapshot run by the owner.
   No backend.
5. Owner revenue: `creator_fee_bps` set per item at launch (Pump.fun custom pairs support it).


## Facts this rests on

From Pump.fun public docs and IDL (`pump-public-docs`, commit 2026-10-13):
- `create_v2` accepts another pump coin as quote if that coin is paired with SOL/USDC (or a
  listed quote) and is not a mayhem coin; graduation of the quote coin is not required.
- `BondingCurve` (seeds `["bonding-curve", mint]`, program
  `6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P`) stores `virtual_token_reserves`,
  `virtual_quote_reserves`, `real_*`, `complete`, `quote_mint`, `creator_fee_bps`.
  Curve invariant: `virtual_quote_reserves × virtual_token_reserves = k`.
- After graduation the price comes from the PumpSwap pool:
  `effective_quote_reserves = quote_vault.amount + virtual_quote_reserves` (signed `i128`).
- Pump.fun FAQ: custom pairs are launched from the website or app by choosing the pair.

## Open

- Whether the website's pair selector lists an arbitrary pump coin (USDC) or only listed
  pairs. If not, the owner launches items through Pump.fun's official SDK (`createV2`),
  signing with their own wallet.
- `creator_fee_bps` per item; launch order.
- Airdrop formula (which trades count, weights), snapshot date, NFT design.

## Sources

- [CREATE_WITH_PUMP_COIN_QUOTE](https://github.com/pump-fun/pump-public-docs/blob/main/docs/instructions/CREATE_WITH_PUMP_COIN_QUOTE.md)
- [Trades v3 and account layout](https://github.com/pump-fun/pump-public-docs/blob/main/docs/instructions/TRADE_V3.md)
- [Pump IDL](https://github.com/pump-fun/pump-public-docs/blob/main/idl/pump.json)
- [The Defiant: custom pairs, 2026-09-09](https://thedefiant.io/news/defi/pump-fun-lets-creators-launch-coins-priced-in-tokenized-stocks)
