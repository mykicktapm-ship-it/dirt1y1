const assert = require("node:assert/strict");
const { join } = require("node:path");
const { before, test } = require("node:test");

const build = process.env.DC_CONTRACT_BUILD;
assert.ok(build, "Run via npm run test:contracts");

let view;

before(() => {
  process.env.NEXT_PUBLIC_SOLANA_RPC_URLS = "http://127.0.0.1:9/unused";
  process.env.NEXT_PUBLIC_SOLANA_RPC_SUBSCRIPTIONS_URL = "";
  view = require(join(build, "src/dc-chain/item-market-view.js"));
});

const curve = {
  virtualTokenReserves: 1_000_000_000_000_000n,
  virtualQuoteReserves: 2_000_000_000n,
  realTokenReserves: 0n,
  realQuoteReserves: 0n,
  tokenTotalSupply: 1_000_000_000_000_000n,
  complete: false,
};

test("keeps significant digits and rounds down", () => {
  assert.equal(view.toSignificant("0.000002000000", 4), "0.000002");
  assert.equal(view.toSignificant("0.000123456789", 4), "0.0001234");
  assert.equal(view.toSignificant("12.345678", 4), "12.34");
  assert.equal(view.toSignificant("12345.67", 4), "12345");
  assert.equal(view.toSignificant("0.000000000000", 4), "0");
});

test("formats quote units with separators and two decimals", () => {
  assert.equal(view.formatQuoteUnits(2_000_000_000n), "2,000.00");
  assert.equal(view.formatQuoteUnits(1_234_567_891n), "1,234.56");
  assert.equal(view.formatQuoteUnits(0n), "0.00");
});

test("a live curve shows price, market cap and a trade link", () => {
  const result = view.describeItemMarket({
    state: "ready",
    market: { itemId: "glock18", status: "curve", mint: "Mint111", curve },
  });
  assert.equal(result.price, "0.000002 DC");
  assert.equal(result.marketCap, "2,000.00 DC");
  assert.equal(result.mint, "Mint111");
});

test("states without a reliable price show none", () => {
  const cases = [
    { state: "loading" },
    { state: "error" },
    { state: "ready", market: { itemId: "glock18", status: "not-launched" } },
    { state: "ready", market: { itemId: "glock18", status: "missing", mint: "Mint111" } },
    { state: "ready", market: { itemId: "glock18", status: "wrong-quote", mint: "Mint111" } },
    {
      state: "ready",
      market: { itemId: "glock18", status: "graduated", mint: "Mint111", curve, pool: null },
    },
  ];
  for (const load of cases) {
    const result = view.describeItemMarket(load);
    assert.equal(result.price, "—");
    assert.equal(result.marketCap, "—");
  }
  const graduated = view.describeItemMarket(cases[5]);
  assert.equal(graduated.mint, "Mint111");
  const wrongQuote = view.describeItemMarket(cases[4]);
  assert.equal(wrongQuote.mint, null);
});

test("a graduated item is priced from its PumpSwap pool with effective quote reserves", () => {
  const pool = {
    baseReserves: 200_000_000_000_000n,
    quoteReserves: 400_000_000n + 100_000_000n,
    quoteVaultAmount: 400_000_000n,
  };
  const result = view.describeItemMarket({
    state: "ready",
    market: { itemId: "glock18", status: "graduated", mint: "Mint111", curve, pool },
  });
  assert.equal(result.price, "0.0000025 DC");
  assert.equal(result.marketCap, "2,500.00 DC");
  assert.equal(result.status, view.ITEM_MARKET_LABELS.graduated);
  assert.deepEqual(view.getPumpSwapPriceReserves(pool), {
    virtualTokenReserves: pool.baseReserves,
    virtualQuoteReserves: pool.quoteReserves,
    realTokenReserves: pool.baseReserves,
    realQuoteReserves: pool.quoteVaultAmount,
  });
});

test("a pool with non-positive effective quote reserves shows no price", () => {
  const pool = { baseReserves: 1_000n, quoteReserves: -5n, quoteVaultAmount: 10n };
  assert.equal(view.getPumpSwapPriceReserves(pool), null);
  const result = view.describeItemMarket({
    state: "ready",
    market: { itemId: "glock18", status: "graduated", mint: "Mint111", curve, pool },
  });
  assert.equal(result.price, "—");
});
