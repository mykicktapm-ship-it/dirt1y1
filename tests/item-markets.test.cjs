const assert = require("node:assert/strict");
const { join } = require("node:path");
const { before, test } = require("node:test");
const { getAddressEncoder } = require("@solana/kit");

const build = process.env.DC_CONTRACT_BUILD;
assert.ok(build, "Run via npm run test:contracts");

const QUOTE = "So11111111111111111111111111111111111111112";
const OTHER_QUOTE = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const CREATOR = "11111111111111111111111111111111";
const MINT_A = "SysvarRent111111111111111111111111111111111";
const MINT_B = "SysvarC1ock11111111111111111111111111111111";
const MINT_C = "Stake11111111111111111111111111111111111111";

let curve;
let markets;
let swap;
let launch;

before(() => {
  process.env.NEXT_PUBLIC_SOLANA_RPC_URLS = "http://127.0.0.1:9/unused";
  process.env.NEXT_PUBLIC_SOLANA_RPC_SUBSCRIPTIONS_URL = "";
  curve = require(join(build, "src/dc-chain/pump-curve.js"));
  markets = require(join(build, "src/dc-chain/item-markets.js"));
  swap = require(join(build, "src/dc-chain/pump-swap.js"));
  launch = require(join(build, "src/resources/launch.js"));
});

function curveBytes({
  vtr = 1_000_000_000_000_000n,
  vqr = 2_000_000_000n,
  supply = 1_000_000_000_000_000n,
  complete = 0,
  quote = QUOTE,
  length = 166,
  discriminator = [23, 183, 248, 55, 96, 216, 172, 96],
} = {}) {
  const data = new Uint8Array(length);
  const view = new DataView(data.buffer);
  data.set(discriminator, 0);
  view.setBigUint64(8, vtr, true);
  view.setBigUint64(16, vqr, true);
  view.setBigUint64(24, 793_100_000_000_000n, true);
  view.setBigUint64(32, 0n, true);
  view.setBigUint64(40, supply, true);
  data[48] = complete;
  data.set(getAddressEncoder().encode(CREATOR), 49);
  if (length >= 123) {
    data.set(getAddressEncoder().encode(quote), 83);
    view.setBigUint64(115, 150n, true);
  }
  return data;
}

test("decodes the create_v2 layout with quote mint and creator fee", () => {
  const decoded = curve.decodePumpBondingCurve(curveBytes());
  assert.equal(decoded.virtualTokenReserves, 1_000_000_000_000_000n);
  assert.equal(decoded.virtualQuoteReserves, 2_000_000_000n);
  assert.equal(decoded.tokenTotalSupply, 1_000_000_000_000_000n);
  assert.equal(decoded.complete, false);
  assert.equal(decoded.creator, CREATOR);
  assert.equal(decoded.quoteMint, QUOTE);
  assert.equal(decoded.creatorFeeBps, 150n);
});

test("decodes a legacy SOL-paired layout without quote fields", () => {
  const decoded = curve.decodePumpBondingCurve(curveBytes({ length: 81 }));
  assert.equal(decoded.quoteMint, null);
  assert.equal(decoded.creatorFeeBps, null);
  assert.equal(decoded.isMayhemMode, false);
});

test("rejects foreign, truncated and malformed accounts", () => {
  assert.throws(() =>
    curve.decodePumpBondingCurve(curveBytes({ discriminator: [0, 0, 0, 0, 0, 0, 0, 0] })),
  );
  assert.throws(() => curve.decodePumpBondingCurve(curveBytes().subarray(0, 60)));
  assert.throws(() => curve.decodePumpBondingCurve(curveBytes({ complete: 2 })));
});

test("prices one token in quote tokens exactly and rounds down", () => {
  const decoded = curve.decodePumpBondingCurve(curveBytes());
  assert.equal(curve.formatPumpCurvePrice(decoded, 6, 6, 9), "0.000002000");
  assert.equal(
    curve.formatPumpCurvePrice({ virtualQuoteReserves: 2n, virtualTokenReserves: 3n }, 0, 0, 4),
    "0.6666",
  );
  assert.equal(curve.getPumpCurveMarketCap(decoded), 2_000_000_000n);
  assert.throws(() =>
    curve.formatPumpCurvePrice({ virtualQuoteReserves: 1n, virtualTokenReserves: 0n }, 6, 6, 2),
  );
});

test("derives bonding curve addresses for the Pump FAQ mints (bumps 255 and 251)", async () => {
  assert.equal(
    await curve.findPumpBondingCurveAddress("Coyj3LtKn1BNSgWc9HsGK5SKoGfEoDaymig4wrN6pump"),
    "7K1Y3AiXT5Pf16mhRV9FJU4WQcCFWJ8cdjAyqaATRKQN",
  );
  assert.equal(
    await curve.findPumpBondingCurveAddress("3cLSxG6eXcCD9NSMawkhUcrvVCUC8KHKHMCxx6bhpump"),
    "42ebNfM7U59Lex5NSktxiygJmPHZvgyJorQA2CbwFBrV",
  );
});

function fakeRpc(accounts) {
  const calls = [];
  return {
    calls,
    getMultipleAccounts(addresses, config) {
      calls.push({ addresses, config });
      return {
        send: async () => ({
          context: { slot: 77n },
          value: addresses.map((_, index) => accounts[index] ?? null),
        }),
      };
    },
  };
}

function account(bytes, owner = String(curve.PUMP_PROGRAM_ADDRESS)) {
  return { owner, data: [Buffer.from(bytes).toString("base64"), "base64"] };
}

test("reads launched items in one call and classifies each market", async () => {
  const rpc = fakeRpc([account(curveBytes()), account(curveBytes({ quote: OTHER_QUOTE })), null]);
  const mints = {
    glock18: MINT_A,
    "weapon-case": MINT_B,
    briefcase: MINT_C,
    "bulletproof-umbrella": null,
    "to-the-moon-visa": null,
    bitcoin: null,
    ethereum: null,
  };
  const result = await markets.fetchDCItemMarkets(rpc, mints, QUOTE);
  assert.equal(rpc.calls.length, 1);
  assert.equal(rpc.calls[0].addresses.length, 3);
  assert.equal(rpc.calls[0].config.encoding, "base64");
  assert.equal(result.slot, 77n);
  const byId = Object.fromEntries(result.markets.map((market) => [market.itemId, market]));
  assert.equal(byId.glock18.status, "curve");
  assert.equal(byId["weapon-case"].status, "wrong-quote");
  assert.equal(byId.briefcase.status, "missing");
  assert.equal(byId.ethereum.status, "not-launched");
  assert.equal(result.markets.length, 7);
});

test("marks a completed curve as graduated and ignores foreign owners", async () => {
  const rpc = fakeRpc([account(curveBytes({ complete: 1 })), account(curveBytes(), CREATOR)]);
  const mints = {
    glock18: MINT_A,
    "weapon-case": MINT_B,
    briefcase: null,
    "bulletproof-umbrella": null,
    "to-the-moon-visa": null,
    bitcoin: null,
    ethereum: null,
  };
  const result = await markets.fetchDCItemMarkets(rpc, mints, QUOTE);
  assert.equal(result.markets[0].status, "graduated");
  assert.equal(result.markets[1].status, "missing");
});

test("makes no RPC call before any item is launched", async () => {
  const rpc = fakeRpc([]);
  const mints = Object.fromEntries(
    [
      "glock18",
      "weapon-case",
      "briefcase",
      "bulletproof-umbrella",
      "to-the-moon-visa",
      "bitcoin",
      "ethereum",
    ].map((id) => [id, null]),
  );
  const result = await markets.fetchDCItemMarkets(rpc, mints, QUOTE);
  assert.equal(rpc.calls.length, 0);
  assert.ok(result.markets.every((market) => market.status === "not-launched"));
});

const POOL_DISCRIMINATOR = [241, 154, 109, 4, 17, 177, 109, 188];
const BASE_VAULT = "SysvarS1otHashes111111111111111111111111111";
const QUOTE_VAULT = "SysvarStakeHistory1111111111111111111111111";

function poolBytes({ base = MINT_A, quote = QUOTE, virtualQuote = 0n, length = 301 } = {}) {
  const data = new Uint8Array(length);
  const view = new DataView(data.buffer);
  const encoder = getAddressEncoder();
  data.set(POOL_DISCRIMINATOR, 0);
  data.set(encoder.encode(base), 43);
  data.set(encoder.encode(quote), 75);
  data.set(encoder.encode(BASE_VAULT), 139);
  data.set(encoder.encode(QUOTE_VAULT), 171);
  if (length >= 261) {
    view.setBigUint64(245, BigInt.asUintN(64, virtualQuote), true);
    view.setBigInt64(253, virtualQuote >> 64n, true);
  }
  return data;
}

function tokenAccountBytes(amount) {
  const data = new Uint8Array(165);
  new DataView(data.buffer).setBigUint64(64, amount, true);
  return data;
}

/** Answers each `getMultipleAccounts` call with the next batch of accounts. */
function sequenceRpc(batches) {
  const calls = [];
  return {
    calls,
    getMultipleAccounts(addresses, config) {
      const batch = batches[calls.length] ?? [];
      calls.push({ addresses, config });
      return {
        send: async () => ({
          context: { slot: 77n },
          value: addresses.map((_, index) => batch[index] ?? null),
        }),
      };
    },
  };
}

const onlyGlock = {
  glock18: MINT_A,
  "weapon-case": null,
  briefcase: null,
  "bulletproof-umbrella": null,
  "to-the-moon-visa": null,
  bitcoin: null,
  ethereum: null,
};

test("filling one mint in the launch config turns that item live", async () => {
  const before = await markets.fetchDCItemMarkets(sequenceRpc([]), launch.itemMarketMints, QUOTE);
  assert.ok(before.markets.every((market) => market.status === "not-launched"));
  const after = await markets.fetchDCItemMarkets(
    sequenceRpc([[account(curveBytes())]]),
    { ...launch.itemMarketMints, glock18: MINT_A },
    QUOTE,
  );
  assert.equal(after.markets.find((market) => market.itemId === "glock18").status, "curve");
  assert.equal(after.markets.filter((market) => market.status === "not-launched").length, 6);
});

test("a graduated item reads its canonical pool and vaults, with signed virtual reserves", async () => {
  const swapProgram = String(swap.PUMP_SWAP_PROGRAM_ADDRESS);
  const rpc = sequenceRpc([
    [account(curveBytes({ complete: 1 }))],
    [account(poolBytes({ virtualQuote: -100_000_000n }), swapProgram)],
    [account(tokenAccountBytes(200_000_000_000_000n)), account(tokenAccountBytes(600_000_000n))],
  ]);
  const result = await markets.fetchDCItemMarkets(rpc, onlyGlock, QUOTE);
  assert.equal(rpc.calls.length, 3);
  assert.equal(
    rpc.calls[1].addresses[0],
    await swap.findCanonicalPumpSwapPoolAddress(MINT_A, QUOTE),
  );
  assert.deepEqual(rpc.calls[2].addresses, [BASE_VAULT, QUOTE_VAULT]);
  const glock = result.markets[0];
  assert.equal(glock.status, "graduated");
  assert.deepEqual(glock.pool, {
    baseReserves: 200_000_000_000_000n,
    quoteReserves: 500_000_000n,
    quoteVaultAmount: 600_000_000n,
  });
});

test("a pool for another mint, quote or program leaves the item without a price", async () => {
  const swapProgram = String(swap.PUMP_SWAP_PROGRAM_ADDRESS);
  for (const pool of [
    account(poolBytes({ base: MINT_B }), swapProgram),
    account(poolBytes({ quote: OTHER_QUOTE }), swapProgram),
    account(poolBytes()),
    null,
  ]) {
    const rpc = sequenceRpc([[account(curveBytes({ complete: 1 }))], [pool]]);
    const result = await markets.fetchDCItemMarkets(rpc, onlyGlock, QUOTE);
    assert.equal(result.markets[0].status, "graduated");
    assert.equal(result.markets[0].pool, null);
    assert.equal(rpc.calls.length, 2);
  }
});

test("decodes older pools without virtual quote reserves as zero", () => {
  const pool = swap.decodePumpSwapPool(poolBytes({ length: 211 }));
  assert.equal(pool.virtualQuoteReserves, 0n);
  assert.equal(pool.poolQuoteTokenAccount, QUOTE_VAULT);
  assert.throws(() => swap.decodePumpSwapPool(poolBytes().subarray(0, 100)));
});
