const assert = require("node:assert/strict");
const { createServer } = require("node:http");
const { join } = require("node:path");
const { after, before, beforeEach, test } = require("node:test");

const build = process.env.DC_CONTRACT_BUILD;
assert.ok(build, "Run via npm run test:contracts");
const owner = "11111111111111111111111111111111";
const secondWallet = "So11111111111111111111111111111111111111112";
let server;
let balances;
let market;
let leaderboard;
let tiers;
let mint;
let scenario = "healthy";
let requests = [];
let requestStarted;

before(async () => {
  server = createServer(async (req, res) => {
    let text = "";
    for await (const chunk of req) text += chunk;
    const body = JSON.parse(text);
    requests.push({ endpoint: req.url, ...body });
    if (scenario === "hold") {
      requestStarted?.();
      return;
    }
    res.setHeader("Content-Type", "application/json");
    if (scenario === "failover" && req.url === "/first") {
      res.end(
        JSON.stringify({
          jsonrpc: "2.0",
          id: body.id,
          error: { code: -32000, message: "Fixture endpoint unavailable" },
        }),
      );
      return;
    }
    let result;
    if (body.method === "getBalance") {
      result = { context: { slot: 102 }, value: 7_000_000_000 };
    } else if (body.method === "getTokenAccountsByOwner") {
      result = {
        context: { slot: 100 },
        value: ["9007199254740993", "7"].map((amount, index) => ({
          account: {
            data: {
              parsed: {
                info: {
                  tokenAmount: {
                    amount,
                    decimals: scenario === "decimals" && index === 1 ? 5 : 6,
                  },
                },
              },
            },
          },
        })),
      };
    } else {
      res.statusCode = 500;
      res.end("Unexpected RPC method");
      return;
    }
    res.end(JSON.stringify({ jsonrpc: "2.0", id: body.id, result }));
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const port = server.address().port;
  process.env.NEXT_PUBLIC_SOLANA_RPC_URLS = `http://127.0.0.1:${port}/first,http://127.0.0.1:${port}/second`;
  process.env.NEXT_PUBLIC_SOLANA_RPC_SUBSCRIPTIONS_URL = "";
  process.env.NEXT_PUBLIC_MARKET_SNAPSHOT_URL = "/data/market.json";
  process.env.NEXT_PUBLIC_LEADERBOARD_SNAPSHOT_URL = "/data/leaderboard.json";
  const nativeFetch = globalThis.fetch;
  globalThis.fetch = (input, ...args) => {
    const url = new URL(typeof input === "string" || input instanceof URL ? input : input.url);
    assert.equal(url.hostname, "127.0.0.1", "Contract tests must never call external services");
    return nativeFetch(input, ...args);
  };
  balances = require(join(build, "src/dc-chain/balances.js"));
  market = require(join(build, "src/dc-chain/market.js"));
  leaderboard = require(join(build, "src/dc-chain/leaderboard.js"));
  tiers = require(join(build, "src/utils/tierSystem.js"));
  mint = String(require(join(build, "src/dc-chain/config.js")).DC_TOKEN_MINT);
});

beforeEach(() => {
  requests = [];
  scenario = "healthy";
  requestStarted = undefined;
});
after(async () => {
  if (!server) return;
  server.closeAllConnections();
  await new Promise((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
});

test("balance reads preserve large integer sums, mint filter and conservative slot", async () => {
  const value = await balances.getDCWalletBalances(owner);
  assert.equal(value.lamports, 7_000_000_000n);
  assert.equal(value.tokenAmount, 9007199254741000n);
  assert.equal(value.tokenUiAmountString, "9007199254.741");
  assert.equal(value.slot, 100n);
  assert.ok(requests.every((request) => request.endpoint === "/first"));
  assert.deepEqual(
    requests.find((request) => request.method === "getTokenAccountsByOwner").params[1],
    { mint },
  );
});

test("a failed RPC endpoint falls through to the next configured endpoint", async () => {
  scenario = "failover";
  const value = await balances.getDCWalletBalances(owner);
  assert.equal(value.tokenAmount, 9007199254741000n);
  assert.ok(requests.some((request) => request.endpoint === "/first"));
  assert.ok(requests.some((request) => request.endpoint === "/second"));
});

test("inconsistent decimals never produce an apparently valid balance", async () => {
  scenario = "decimals";
  await assert.rejects(balances.getDCWalletBalances(owner), /disagree on decimals/);
});

test("an already cancelled balance read performs no HTTP request", async () => {
  const controller = new AbortController();
  controller.abort(new Error("Cancelled fixture"));
  await assert.rejects(balances.getDCWalletBalances(owner, controller.signal));
  assert.equal(requests.length, 0);
});

test(
  "cancelling an in-flight request does not reach the fallback endpoint",
  { timeout: 5000 },
  async () => {
    scenario = "hold";
    const controller = new AbortController();
    const started = new Promise((resolve) => {
      requestStarted = resolve;
    });
    const rejected = assert.rejects(balances.getDCWalletBalances(owner, controller.signal));
    await started;
    controller.abort(new Error("Cancelled fixture"));
    await rejected;
    assert.ok(requests.every((request) => request.endpoint === "/first"));
  },
);

const now = Date.parse("2026-10-06T12:00:00.000Z");
const marketFixture = () => ({
  schemaVersion: 1,
  source: "birdeye",
  currency: "USD",
  tokenMint: mint,
  generatedAt: "2026-10-06T11:00:00.000Z",
  refreshAfterSeconds: 3600,
  priceUsd: "0.000000000000000001",
  marketCapUsd: "9007199254740993.01",
});

test("market data preserves decimal strings and rejects invalid contracts", () => {
  const fixture = marketFixture();
  assert.equal(market.parseDCMarketSnapshot(fixture).priceUsd, fixture.priceUsd);
  for (const change of [
    { tokenMint: owner },
    { schemaVersion: 2 },
    { priceUsd: 0.1 },
    { priceUsd: "1e-9" },
    { priceUsd: "0" },
    { marketCapUsd: "-1" },
    { generatedAt: "invalid" },
  ]) {
    assert.throws(() => market.parseDCMarketSnapshot({ ...fixture, ...change }), TypeError);
  }
});

test("snapshot freshness rejects stale and implausibly future data", () => {
  const fixture = market.parseDCMarketSnapshot(marketFixture());
  assert.equal(market.isDCMarketSnapshotFresh(fixture, now), true);
  assert.equal(
    market.isDCMarketSnapshotFresh({ ...fixture, generatedAt: "2026-10-06T08:00:00.000Z" }, now),
    false,
  );
  assert.equal(
    market.isDCMarketSnapshotFresh({ ...fixture, generatedAt: "2026-10-06T12:10:00.000Z" }, now),
    false,
  );
});

const entry = (wallet, rank, total) => ({
  rank,
  wallet,
  displayName: null,
  avatarUrl: null,
  positionValueUsd: "0",
  totalPnlUsd: total,
  realizedPnlUsd: total,
  unrealizedPnlUsd: "0",
});
const leaderboardFixture = () => ({
  schemaVersion: 3,
  source: "birdeye",
  sourceWindow: "all_time",
  metric: "total_pnl",
  currency: "USD",
  tokenMint: mint,
  generatedAt: "2026-10-06T11:00:00.000Z",
  refreshAfterSeconds: 3600,
  entries: [entry(owner, 1, "9007199254740993"), entry(secondWallet, 2, "9007199254740992")],
});

test("leaderboard sorting remains exact above Number.MAX_SAFE_INTEGER", () => {
  const fixture = leaderboardFixture();
  assert.equal(
    leaderboard.parseDCLeaderboardSnapshot(fixture).entries[0].totalPnlUsd,
    "9007199254740993",
  );
  fixture.entries.reverse().forEach((row, index) => {
    row.rank = index + 1;
  });
  assert.throws(() => leaderboard.parseDCLeaderboardSnapshot(fixture), /not sorted/);
});

test("leaderboard accepts exact decimal sums and rejects inconsistent PNL", () => {
  const fixture = leaderboardFixture();
  fixture.entries = [{ ...entry(owner, 1, "0.3"), realizedPnlUsd: "0.1", unrealizedPnlUsd: "0.2" }];
  assert.equal(leaderboard.parseDCLeaderboardSnapshot(fixture).entries.length, 1);
  fixture.entries[0].totalPnlUsd = "0.30000000000000001";
  assert.throws(() => leaderboard.parseDCLeaderboardSnapshot(fixture), /inconsistent PNL/);
});

test("leaderboard rejects duplicate wallets and untrusted avatar hosts", () => {
  const fixture = leaderboardFixture();
  fixture.entries[1].wallet = owner;
  assert.throws(() => leaderboard.parseDCLeaderboardSnapshot(fixture), /repeats a wallet/);
  const avatar = leaderboardFixture();
  avatar.entries[0].avatarUrl = "https://example.com/profile.png";
  assert.throws(() => leaderboard.parseDCLeaderboardSnapshot(avatar), /HTTPS URL/);
  assert.equal(leaderboard.isDCLeaderboardSnapshotFresh(leaderboardFixture(), now), true);
  assert.equal(
    leaderboard.isDCLeaderboardSnapshotFresh(leaderboardFixture(), now + 4 * 3_600_000),
    false,
  );
});

test("Battle Pass levels change at the public SOL thresholds, not one lamport earlier", () => {
  const thresholds = [
    [100_000_000n, "Holder"],
    [7_000_000_000n, "Black Umbrella"],
    [67_000_000_000n, "Whale"],
    [200_000_000_000n, "Dirty Hand"],
  ];
  for (const [amount, name] of thresholds) {
    assert.equal(tiers.getUserTier(amount).name, name);
    assert.notEqual(tiers.getUserTier(amount - 1n).name, name);
  }
});

test("Battle Pass handles disconnected and maximum-level progress", () => {
  assert.equal(tiers.getTierProgress(null).progress, 0);
  const max = tiers.getTierProgress(9007199254740993n);
  assert.equal(max.next, null);
  assert.equal(max.progress, 1);
  assert.equal(max.remainingSol, 0);
});
