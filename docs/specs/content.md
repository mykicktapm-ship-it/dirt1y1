# Copy rules and Community

## Copy process

Visible copy is owned by the owner. The agent may draft options when asked, but a string
ships only after the owner selects or supplies it exactly. While wiring data into an approved
component, do not add titles, badges, numbers or promotional text.

Section status (recorded in each spec next to the section):

- `LOCKED`: change nothing in the section.
- `COPY REVIEW`: only the named strings may change; structure and styling stay.
- `OPEN`: content is undecided; build nothing until the owner gives a brief.

A copy change touches only its section, then gets a visual check on desktop and mobile.
Shared `HomeStage` props affect several scenes; change them only with all affected places
listed.

Forbidden in any copy: yield, APR, payout or profit promises; anonymity, encryption or security guarantees; launch-status claims that are not
true.

## Community

Slugs under `src/app/community/projects/` are public URLs and must not change.

**Identity block (LOCKED).** Official Telegram `https://t.me/fuckingdirtycoin` from the public
social config; Twitter and Discord are not added until approved. Approved description:
`equal title, proper share, fairly in turn, for the good of all`.

**Feed `/community` (COPY REVIEW).** Built on the `notifications-menu` component, kept
whole (title `Your notifications`, icons, tabs `View all` / `Verified` / `Mentions`,
counters, file row, actions, separators, empty state) in a transparent, borderless,
padding-free card as wide as the content column. Approved DirtyHand demo entries stay; MDX
publications are appended to `View all` as compact messages (Pump avatar, date, Pin, bounded
description ending in `… Read full`, Matrix background). One video-note `Changelog Deploy`
uses local `cover2.mp4` in the circular Matrix treatment, with no date, route or body.

**Article header `/community/[slug]` (LOCKED).** Publication card in compact detail mode:
framed cover 30%, title/Pin/description/date 70%; circular-arrow `Community` return control;
no repeated identity elements above the body.

**Pinned `$DC` promo `/community/ai-trading-bot-front-runs-pump-fun-hunters` (LOCKED).**
Static `$DC Alpha` metadata is the fallback. The visible title updates from a schema-valid
positive Rank 1 hourly leaderboard entry: Rank 1 wallet name in green and a value-only
`+$…` badge placed inline right after `#1 trading $DC` (never in the Pin column, never
labelled earned/net/verified). Source window and snapshot time stay available to assistive
technology. Reuses the `$1M` target labelled `Chapter 1 Season 1 Milestone` (a community
target, not a prediction). Excerpt is derived from the article body. No CTA buttons, no
visible provider footer. Missing or invalid data removes the metric; delayed valid data stays
with its timestamp. One route-local leaderboard read is shared by preview and detail.

## Entry points

`src/app/community/page.tsx`, `src/app/community/[slug]/page.tsx`,
`src/components/ui/notifications-menu.tsx`, `src/components/ProjectCard.tsx`,
`src/components/community/CommunityProjects.tsx`,
`src/components/community/DirtyBotPromo.client.tsx`,
`src/app/community/projects/ai-trading-bot-front-runs-pump-fun-hunters.mdx`.

## Checks

`npm run check:release`.
