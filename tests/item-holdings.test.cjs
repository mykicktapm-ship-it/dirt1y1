const assert = require("node:assert/strict");
const { join } = require("node:path");
const { before, test } = require("node:test");

const build = process.env.DC_CONTRACT_BUILD;
assert.ok(build, "Run via npm run test:contracts");

const OWNER = "11111111111111111111111111111111";
const MINT_A = "SysvarRent111111111111111111111111111111111";
const MINT_B = "SysvarC1ock11111111111111111111111111111111";
const FOREIGN = "Stake11111111111111111111111111111111111111";
const TOKEN = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
const TOKEN_2022 = "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";

let holdings;

before(() => {
  process.env.NEXT_PUBLIC_SOLANA_RPC_URLS = "http://127.0.0.1:9/unused";
  process.env.NEXT_PUBLIC_SOLANA_RPC_SUBSCRIPTIONS_URL = "";
  holdings = require(join(build, "src/dc-chain/item-holdings.js"));
});

const mints = {
  glock18: MINT_A,
  "weapon-case": MINT_B,
  briefcase: null,
  "bulletproof-umbrella": null,
  "to-the-moon-visa": null,
  bitcoin: null,
  ethereum: null,
};

function tokenAccount(mint, amount) {
  return {
    account: { data: { parsed: { info: { mint, tokenAmount: { amount, decimals: 6 } } } } },
  };
}

function fakeRpc(byProgram) {
  const calls = [];
  return {
    calls,
    getTokenAccountsByOwner(owner, filter, config) {
      calls.push({ owner, filter, config });
      return { send: async () => ({ value: byProgram[String(filter.programId)] ?? [] }) };
    },
  };
}

test("sums item balances across token programs and accounts, ignoring other coins", async () => {
  const rpc = fakeRpc({
    [TOKEN_2022]: [
      tokenAccount(MINT_A, "1500000"),
      tokenAccount(MINT_A, "500000"),
      tokenAccount(FOREIGN, "9"),
    ],
    [TOKEN]: [tokenAccount(MINT_B, "42")],
  });
  const result = await holdings.fetchDCItemHoldings(rpc, OWNER, mints);
  assert.equal(result.glock18, 2_000_000n);
  assert.equal(result["weapon-case"], 42n);
  assert.equal(result.briefcase, 0n);
  assert.equal(Object.keys(result).length, 7);
  assert.equal(rpc.calls.length, 2);
  assert.deepEqual(rpc.calls.map((call) => String(call.filter.programId)).sort(), [
    TOKEN,
    TOKEN_2022,
  ]);
  assert.ok(rpc.calls.every((call) => call.config.encoding === "jsonParsed"));
});

test("makes no request before any item is launched", async () => {
  const rpc = fakeRpc({});
  const none = Object.fromEntries(Object.keys(mints).map((id) => [id, null]));
  const result = await holdings.fetchDCItemHoldings(rpc, OWNER, none);
  assert.equal(rpc.calls.length, 0);
  assert.ok(Object.values(result).every((amount) => amount === 0n));
});
