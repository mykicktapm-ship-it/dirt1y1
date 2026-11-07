# Working contract

Run commands from this directory. Read [docs/CURRENT.md](docs/CURRENT.md) first: it is the
single page of current truth (product, state, open decisions, known conflicts). Then read only
the spec for the area you touch. Do not load other docs by default.

| Area | Spec |
| --- | --- |
| Home `/` (scenes S1–S5) | [home](docs/specs/home.md) |
| Routes, header, layout | [shell](docs/specs/shell.md) |
| Design system (DC UI), loading | [ui](docs/specs/ui.md) |
| Wallet, RPC, balances | [chain](docs/specs/chain.md) |
| Dashboard `/about`, Battle Pass, Inventory | [dashboard](docs/specs/dashboard.md) |
| `/market`, item pages, media | [market](docs/specs/market.md) |
| Leaderboard and market snapshots | [data](docs/specs/data.md) |
| Copy rules, Community | [content](docs/specs/content.md) |
| Build and static release | [release](docs/specs/release.md) |
| Trenches Market on Pump.fun, item coins, NFT airdrop | [ADR 0006](docs/decisions/0006-trenches-on-pump.md) |
| Planned GameFi sector | [ADR 0007](docs/decisions/0007-gamefi-sector.md) |

`npm run context -- <area>` lists the spec, source entry points and checks for an area.

## Rules

- Specs describe the present only. When you change behavior, update the owning spec in the
  same change. No dated "owner instruction" logs, no "historical" paragraphs, no banners:
  research, decision history and code prototypes live in `../research/`, junk in `../archive/`;
  load neither unless asked.
- Spec and code disagree → report it, do not guess. If the gap blocks the task, ask.
- Never invent visible copy (titles, labels, numbers, claims). Visible strings come from the
  owner. A missing string stays missing; leave the slot empty and say so.
- Never show a number (price, fee, yield, payout) that is not decided in CURRENT.md.
- "USDC" in this project is the project coin (United States Dirty Coin), not Circle's
  stablecoin. In docs and code comments write "DC (project coin)" or "Circle USDC".
- Preserve observable behavior in refactors; keep requested behavior changes separate.
- Shared UI lives in DC UI (`src/dc-ui`); wallet/RPC/parsers in DC Chain (`src/dc-chain`).
  Keep chain amounts exact (`bigint`) until presentation. Preserve static export, public
  routes, keyboard access and reduced motion.
- Complete authorized local edits and checks without asking again. Production deployment,
  transactions and custody changes require explicit authorization in the task.

## Checks

- Docs/routing: `npm run check:specs`.
- UI: the area's `check:*` script (see `npm run context`), plus a browser check of changed UI.
- Chain/data logic: `npm run test:contracts`, `npm run typecheck`.
- Cross-cutting or release: `npm run lint`, `npm run test:contracts`, `npm run build`.

Run the smallest relevant check; report what passed, what was not run, and what is unverified.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
