# Public data and snapshots

## Behavior

- The top-wallet snapshot (shown in the DirtyBot promo) comes from a schema-validated hourly
  Birdeye snapshot published outside this repo (`NEXT_PUBLIC_LEADERBOARD_SNAPSHOT_URL`). Label it as provider-reported all-time
  PNL with provider, window and freshness. Never call it verified, net or bot-attributed;
  never ship fabricated fallback rows. The Birdeye key never enters the repo or browser.
- Use the public Pump username and avatar when present; otherwise the deterministic rank,
  wallet and avatar fallback.
- Market snapshot (`NEXT_PUBLIC_MARKET_SNAPSHOT_URL`): only mint, generation time, USD price
  and market-cap estimate as decimal strings. Invalid, wrong-mint or stale data is hidden and
  never changes balances or Battle Pass levels.
- `public/data/leaderboard.json` and `public/data/market.json` are release fallbacks, not an
  hourly channel. Cross-origin snapshot endpoints must allow read-only CORS from the site.
- Never claim guaranteed trading profit. Any independent ranking must be reproducible,
  separate realized/unrealized PNL, include costs, disclose window/freshness and label
  affiliated wallets.

## Entry points

`src/dc-chain/market.ts`, `src/dc-chain/leaderboard.ts`, `src/hooks/useMarketSnapshot.ts`,
`src/hooks/useLeaderboard.ts`.

## Checks

`npm run check:dc-chain`, `npm run test:contracts`.
