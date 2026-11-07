# Wallet and DC Chain

## Behavior

- Discover Solana wallets via Wallet Standard; reconnect the last selected wallet.
- Read mainnet SOL and `$DC` balances. Filter token accounts by the configured mint and sum
  all matches. Keep lamports and token amounts as exact `bigint` until presentation.
- Fail over across configured public RPC endpoints; do not retry cancelled requests.
- Reads only: there is no transaction or signing flow. Wallet permissions are not evidence of
  one.
- Client lifecycle, RPC selection and parsing stay inside DC Chain; UI must not recreate them.

The USDC mint is set in `src/resources/launch.ts` (`usdcMint`); until launch it is the
reference coin (see CURRENT, Glossary). `readWithDCFailover` (`client.ts`) is the shared
failover for item reads.

## Item markets (Pump.fun)

`item-markets.ts` reads the bonding curve of every launched item coin in one
`getMultipleAccounts` call (`pump-curve.ts` decodes the account per the Pump IDL). Each item
is `not-launched`, `missing`, `wrong-quote` (not quoted in the project coin; never show its
price), `curve` or `graduated`. For graduated items `pump-swap.ts` reads the canonical
PumpSwap pool (index 0, creator = Pump `pool-authority` PDA, base = item, quote = USDC; mints
checked after decoding) and its vaults: price uses effective quote reserves
(`vault + virtual_quote_reserves`, signed). Two extra calls, only when something graduated.
Mints live in `src/resources/launch.ts`. Read-only: trades happen on Pump.fun.

`item-holdings.ts` reads the connected wallet's item balances: one `jsonParsed`
`getTokenAccountsByOwner` per token program (SPL Token, Token-2022), summed per item mint.
No request before any item launches.

`pump-curve.ts` also estimates trades on the curve, exact in `bigint` and before fees:
`quotePumpCurveBuy` (quote in → tokens out, capped by tokens on the curve),
`quotePumpCurveSell` (tokens in → quote out, capped by the quote reserve), and
`getPumpCurveProgressBps` (sold share of `PUMP_INITIAL_REAL_TOKEN_RESERVES`). These feed the
item page estimator only; nothing builds or signs a transaction.

## Entry points

`src/dc-chain/client.ts`, `src/dc-chain/config.ts`, `src/dc-chain/balances.ts`,
`src/dc-chain/react/DCChainProvider.tsx`, `src/hooks/useWeb3Scanner.ts`,
`src/dc-chain/pump-curve.ts`, `src/dc-chain/pump-swap.ts`, `src/dc-chain/item-markets.ts`,
`src/dc-chain/item-holdings.ts`, `src/resources/launch.ts`.

## Checks

`npm run check:dc-chain`, `npm run test:contracts`.
