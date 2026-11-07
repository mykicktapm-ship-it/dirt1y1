# 0007 — GameFi sector

Date: 2026-10-28. Status: **adopted** by the owner as the planned direction. Builds on ADR 0006;
GameFi v1.1 (`../research/gamefi/`) is research material for this sector, not its adopted
design.

## Decision

1. The project will have a GameFi sector, an on-chain game hub: sections for games, poker,
   an NFT collection hub, a
   player-funded house, a shop, a leaderboard, NFT-backed borrowing and a transparency page;
   an on-chain activity feed; thousands of NFTs.
2. Names, copy and art are Dirtycoin's own: the catalogue items, their 3D models and the
   Dirtycoin visual language.
3. Nothing of the sector exists yet. Until it does, the site shows it only as a labelled
   preview (Home S4) with skeletons for missing data. No figures (supply, payouts, pool sizes,
   odds) are shown until they are decided here.

## NFT properties

Owner decision of 2026-10-24 (first recorded in ADR 0003, whose share-backed mint path is
retired; ADR 0004 kept these properties):

- The NFT is a game asset: transferable, stakeable, usable as collateral and consumed in
  games. One on-chain state per NFT: `owned → staked → consumed | returned`.
- Emission is endogenous: the market sets how many NFTs exist, not a premint or a fixed cap
  (Home S4: "Players set the emission").

## Open

- How NFTs are minted now that share-backed mint and burn-to-mint are retired, and how the
  ADR 0006 trading airdrop fits endogenous emission.
- Chain and programs (custom Solana programs vs. existing protocols), NFT supply, game list and
  names, house mechanics, legal review of game and house features.
- Section names and all visible copy (owner).

## Constraints carried over

No yield, payout or profit promises; the approved risk disclaimer stays next to any economic
content; signing stays in the user's wallet.
