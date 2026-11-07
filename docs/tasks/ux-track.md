# UX track — скорость, тактильность, единый визуальный язык

Цель: всё приложение выглядит и ощущается как Home S1–S2 (главный референс) и каталог
`/market`. Страница предмета `/market/[itemId]` сейчас выпадает: другой масштаб, плотность,
цвета вне токенов, график вместо предмета в центре.

Направление владельца: **лаконично и аккуратно**. Крафтовый, не шаблонный вид при
enterprise-уровне исполнения. Меньше элементов, точнее каждый; ничего декоративного без
функции.

Правило запуска: **один промпт за раз**, общий префикс + текст задания. Результат каждого
задания — отчёт или файл, указанный в задании. Сводит всё только X1.
Тексты заданий на английском намеренно: это дешевле по токенам.

## Общий префикс

```text
Project: /home/liazrdsc/Downloads/Telegram Desktop/404-handoff-2026-10-25/project.
Read AGENTS.md and docs/CURRENT.md first, then only the files named in the task.
Edit files only if the task says so. Cite file:line for every finding. Label each finding
as FACT (proven by code), HYPOTHESIS, or QUESTION (needs a measurement or an owner decision).
Never invent performance numbers or visible copy.
```

## Порядок

| Шаг | Задания | Зависит от |
|---|---|---|
| 1 | U0, P1, P2, P3, U2 — независимы, в любом порядке | — |
| 2 | U1 | U0 |
| 3 | B1 (по одному маршруту), B2 | — |
| 4 | X1 — очередь работ | готовые отчёты |
| 5 | Билд по очереди X1, затем D9 | X1 |

## U0 — визуальный язык из Home S1–S2 (главный референс)

```text
Extract the design language that Home S1–S2 and the /market catalogue card already use.
Read: src/components/ui/home-stage.tsx (inline CSS and the S1 hero block),
src/components/ui/home-item-showcase.tsx + .module.scss, src/components/ui/glass-card.tsx +
.module.scss, src/components/ui/dirtycoin-parallax-card.tsx,
../research/prototypes/src/components/ui/registration-stepper.module.scss, src/dc-ui/tokens/tokens.css,
src/dc-ui/typography/DCCurrencyMark.tsx.
Write docs/specs/design-language.md with these sections, each rule citing file:line:
1. Scale system: container-relative unit (--unit, cqw/cqh) vs rem; when each applies.
2. Type: families, sizes, weights, case, letter-spacing, numeric figures.
3. Color: which tokens are used where; list every raw color value that bypasses tokens.
4. Surfaces: the glass card recipe (fill, frame, edge highlight, radius, shadow).
5. Spacing rhythm and layout grid.
6. Motion: reveal effects (clip/rise/fade), durations, easing, reduced-motion behavior.
7. Interaction states: hover, press, selected, focus, disabled.
8. Media: covers, 3D viewer, posters, loading masks.
Describe only what exists. Do not invent new aesthetics. Owner direction: laconic and
tidy; flag elements that add noise without function. End with a list of
inconsistencies between S1, S2 and the catalogue card.
```

## U1 — страница предмета в языке каталога

```text
Compare /market/[itemId] (src/app/market/[itemId]/page.tsx,
../research/prototypes/src/components/ItemMarketDashboard.client.tsx, ../research/prototypes/src/components/item-market-dashboard.module.scss,
src/dc-ui/charts/DCInteractiveChart.tsx) with docs/specs/design-language.md.
1. Table: element -> current implementation -> violated rule -> fix.
2. The page's data changes: the item-share simulation is retired; data now comes from
   src/dc-chain/item-markets.ts with statuses not-launched, missing, wrong-quote, curve,
   graduated. Trades happen on Pump.fun; the page links out and never signs.
3. Write the section "Item page" in docs/specs/market.md: anatomy (the item as hero:
   cover/3D first, then price, chart, trade link), every state above plus loading and RPC
   error, mobile and desktop layout, acceptance criteria. Owner direction: laconic and
   tidy; fewer elements than today, each one earning its place. Mark every new visible string as
   OWNER COPY with its slot and length budget; do not write the copy.
Do not edit source code.
```

## U2 — тактильность и touch

```text
Audit every interactive element on /, /market and /market/[itemId] (routes, their direct
components, their .scss). For each element report: hit area in CSS px (target >= 44x44,
hard minimum 24x24 per WCAG 2.5.8), visible pressed feedback and its delay, hover-only
affordances that touch users cannot reach, touch-action and gesture conflicts with the
Home scroll scenes, focus visibility, and reduced-motion behavior. Vibration feedback:
navigator.vibrate is not available in iOS Safari; treat it only as an optional extra.
Return a table "element -> problem -> fix -> how to verify on a phone".
```

## P1 — скорость первой загрузки

```text
Analyse the critical path to first useful paint for /, /market and /about. Read
package.json, next.config.mjs, src/app/layout.tsx, the imports of these routes,
src/dc-ui/feedback/DCSiteEntrance.tsx, fonts and directly loaded assets. Find what blocks
content, what loads before it is needed, where code splitting or deferred loading applies.
Quantify the forced entrance delays from code (logo phase + minimum skeleton) as a
QUESTION for the owner: they are a design decision, not a bug. Check the two copies of the
umbrella GLB. Do not treat the size of public/ as page weight. Targets for the later
measurement: LCP <= 2.5 s, INP <= 200 ms, CLS <= 0.1 on a mid-range phone.
Return a ranked list of changes, behavior risk of each, and a measurement plan.
```

## P2 — CPU, GPU и память после загрузки

```text
Check the lifecycle of requestAnimationFrame, WebGL, iframes, canvas textures, observers and
timers. Read only home-stage.tsx, holo-card.tsx, home-game-stepper.tsx,
glass-card.tsx, use-cart-countdown.ts and the two viewers in public/ (home/umbrella-viewer.js,
marketplace/viewer/index.html). Cover start, stop when the tab is hidden or the element
leaves the screen, reduced motion, and context release. Check whether the GlassCard queue
limits active WebGL contexts or only concurrent loads. Return a table
"resource -> created -> released -> likely wasted work -> minimal fix".
```

## P3 — запросы и RPC

```text
Read only src/hooks/useWeb3Scanner.ts, useLeaderboard.ts, useMarketSnapshot.ts,
src/dc-chain/item-markets.ts and the dc-chain functions they call. Map requests on mount,
on timers, on tab return, on wallet change, on error and on failover. Find duplicates,
unnecessary cancellations and repeats; check that no-store matches the data refresh rate.
Return the request count each scenario produces according to the code, and the minimal
ways to reduce it. Make no network calls.
```

## B1 — функциональные баги, один маршрут за запуск

```text
Check only route <ROUTE> and its direct components. Run separately for /, /market,
/market/[itemId], /market/activity, /about, /leaderboard, /community, /community/[slug].
Look for broken actions, unreachable states, loading/empty/error gaps, navigation,
keyboard, mobile layout and wallet switching. For each finding give the execution path,
expected vs actual behavior, severity, and the minimal way to verify it.
A mismatch with a spec is not a bug here; list it separately.
```

## B2 — кошелёк и расчёты

```text
Check only src/dc-chain/, the wallet hooks and their offline tests. Look for BigInt
precision, units and decimals errors, "no data" shown as zero, stale results after a wallet
change, AbortController and failover errors. The item-share code (item-share*.ts) is a
retired preview scheduled for removal: report only where it leaks into real balances or
looks like live data. Return only defects reproducible from code and the tests that would
distinguish the bug from correct behavior.
```

## X1 — очередь работ

```text
Combine the finished reports (U0, U1, U2, P1-P3, B1, B2). Remove duplicates. Split into:
fixable bug, safe optimization without behavior change, design-language fix, owner
decision, future feature. Build a short queue with dependencies and acceptance criteria.
Do not fill missing decisions with guesses.
```

## D9 — приёмка релиза (после билда)

```text
After the queued changes are built: verify static export, public URLs, no secrets in the
bundle, accessibility, reduced motion, preview labelling, and a source for every visible
financial claim. Measure LCP, INP and CLS on a phone for /, /market and one item page.
```

## Что убрано из исходного набора и почему

S1, S2, D1–D5, D8 — про LaunchLab, Farm v6, burn-to-mint и старые спеки: заменены аудитом и
ADR 0006. D6/D7 — статусы секций теперь в `docs/specs/home.md` и `content.md`; проверка
текста встроена в U1 (OWNER COPY).
