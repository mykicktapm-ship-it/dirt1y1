const assert = require("node:assert/strict");
const { join } = require("node:path");
const { before, test } = require("node:test");

const build = process.env.DC_CONTRACT_BUILD;
assert.ok(build, "Run via npm run test:contracts");

let curveMath;

before(() => {
  curveMath = require(join(build, "src/dc-chain/pump-curve.js"));
});

const curve = {
  virtualTokenReserves: 1_000_000_000n,
  virtualQuoteReserves: 1_000_000n,
  realTokenReserves: 800_000_000n,
  realQuoteReserves: 500_000n,
  complete: false,
};

test("buy follows the constant-product invariant and rounds against the buyer", () => {
  // k = 1e15; after +1,000,000 quote: 1e15 / 2e6 = 5e8 → 5e8 tokens out.
  assert.equal(curveMath.quotePumpCurveBuy(curve, 1_000_000n), 500_000_000n);
  // ceil(1e15 / 1,000,003) = 999,997,001 → 2,999 tokens out.
  assert.equal(curveMath.quotePumpCurveBuy(curve, 3n), 2_999n);
  assert.equal(curveMath.quotePumpCurveBuy(curve, 0n), 0n);
});

test("buy is capped by tokens left on the curve", () => {
  assert.equal(curveMath.quotePumpCurveBuy(curve, 1_000_000_000_000n), 800_000_000n);
});

test("sell mirrors buy and is capped by the quote reserve", () => {
  assert.equal(curveMath.quotePumpCurveSell(curve, 1_000_000_000n), 500_000n);
  assert.equal(curveMath.quotePumpCurveSell(curve, 100_000_000n), 90_909n);
  assert.equal(
    curveMath.quotePumpCurveSell({ ...curve, realQuoteReserves: 10n }, 1_000_000_000n),
    10n,
  );
});

test("progress counts sold curve allocation in basis points", () => {
  const initial = curveMath.PUMP_INITIAL_REAL_TOKEN_RESERVES;
  assert.equal(
    curveMath.getPumpCurveProgressBps({ realTokenReserves: initial, complete: false }),
    0n,
  );
  assert.equal(
    curveMath.getPumpCurveProgressBps({ realTokenReserves: initial / 4n, complete: false }),
    7_500n,
  );
  assert.equal(
    curveMath.getPumpCurveProgressBps({ realTokenReserves: initial, complete: true }),
    10_000n,
  );
});

test("recovers the launch reserves from any later curve state", () => {
  const launchQuote = 30_000_000_000n;
  const launchTokens = curveMath.PUMP_INITIAL_VIRTUAL_TOKEN_RESERVES;
  let state = {
    virtualQuoteReserves: launchQuote,
    virtualTokenReserves: launchTokens,
    realQuoteReserves: 0n,
    realTokenReserves: curveMath.PUMP_INITIAL_REAL_TOKEN_RESERVES,
  };
  assert.equal(curveMath.getPumpCurveLaunchQuoteReserves(state), launchQuote);
  for (const quoteIn of [1_000_000n, 2_500_000_000n, 9_000_000_000n]) {
    const tokensOut = curveMath.quotePumpCurveBuy(state, quoteIn);
    state = {
      virtualQuoteReserves: state.virtualQuoteReserves + quoteIn,
      virtualTokenReserves: state.virtualTokenReserves - tokensOut,
      realQuoteReserves: state.realQuoteReserves + quoteIn,
      realTokenReserves: state.realTokenReserves - tokensOut,
    };
    // Buys round in the curve's favour, so k can only grow by rounding.
    const recovered = curveMath.getPumpCurveLaunchQuoteReserves(state);
    assert.ok(recovered >= launchQuote && recovered - launchQuote <= 1n, String(recovered));
  }
});
