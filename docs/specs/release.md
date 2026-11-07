# Build and static release

## Behavior

`output: "export"` emits the production artifact to `out/` for IPFS, Arweave, or another static host.
Set `NEXT_PUBLIC_SITE_URL` to the canonical public origin during the build.

`NEXT_PUBLIC_SOLANA_RPC_URLS` accepts public browser-safe RPC endpoints in failover order.
`NEXT_PUBLIC_SOLANA_RPC_SUBSCRIPTIONS_URL` optionally sets a separate WebSocket endpoint. Every
`NEXT_PUBLIC_*` value is compiled into the browser bundle and cannot hold a secret.

`NEXT_PUBLIC_LEADERBOARD_SNAPSHOT_URL` points to the public schema-validated snapshot or mutable
content pointer and is required for production builds. The browser rejects snapshots with the wrong
mint or unsupported schema and marks invalid freshness as delayed; the provider credential never
enters this repository. An absolute snapshot URL must allow read-only CORS from the canonical site
origin. The bundled local JSON is a release snapshot, not an hourly update channel for an immutable
deployment.

`NEXT_PUBLIC_MARKET_SNAPSHOT_URL` points to the public schema-validated hourly market snapshot and is
also required for production builds. It contains only public Birdeye-derived price and market-cap
estimates; the API key stays in the external publisher. Invalid or delayed market data is hidden and
never changes wallet balances or Battle Pass levels.

For IPFS, prefer a CID subdomain gateway or the stable SNS-resolved origin. Root-absolute URLs do not
work from a generic `/ipfs/<CID>/...` path gateway without an explicit base-path build.

The canonical wallet-enabled origin must deliver at least these response headers:

```text
Content-Security-Policy: frame-ancestors 'none'
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: no-referrer
Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=()
```

Storage may remain on IPFS or Arweave, but a shared path gateway is not an accepted wallet origin.
Before release, verify direct route refresh, MIME types, cache policy, wallet extension/mobile flows,
RPC failover, and the headers above on the final SNS-resolved origin.

```bash
npm run lint
npm run build
```

Wallet extension behavior, mobile deep links, SNS resolution, and immutable-host routing require
acceptance on the intended public origin.

A successful build is not acceptance on a public origin. Missing production RPC or snapshot configuration is a deployment input, not permission to substitute a fake endpoint. Do not publish test artifacts.

## Entry points

- [next.config.mjs](../../next.config.mjs)
- [.env.example](../../.env.example)
- [src/resources/dc.config.ts](../../src/resources/dc.config.ts)
- [scripts/generate-rss.mjs](../../scripts/generate-rss.mjs)
- [src/app/sitemap.ts](../../src/app/sitemap.ts)
- [src/app/robots.ts](../../src/app/robots.ts)

## Checks

- `npm run lint`
- `npm run test:contracts`
- `npm run build`
