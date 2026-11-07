const assert = require("node:assert/strict");
const { join } = require("node:path");
const { before, test } = require("node:test");

const build = process.env.DC_CONTRACT_BUILD;
assert.ok(build, "Run via npm run test:contracts");

let preload;

before(() => {
  preload = require(join(build, "src/dc-ui/feedback/entrance-preload.js"));
});

const assets = [
  { url: "/critical", bytes: 50_000, priority: 0 },
  { url: "/next-a", bytes: 1_000_000, priority: 1 },
  { url: "/next-b", bytes: 2_000_000, priority: 1 },
  { url: "/extra", bytes: 500_000, priority: 2 },
];

test("budget is bandwidth × (window − rtt) × 0.8", () => {
  // 10 Mbps = 1250 bytes/ms; (2500 − 100) ms × 1250 × 0.8 = 2,400,000 bytes.
  const plan = preload.planEntrancePreload(assets, 2500, { downlinkMbps: 10, rttMs: 100 });
  assert.equal(plan.budgetBytes, 2_400_000);
  assert.deepEqual(
    plan.now.map((asset) => asset.url),
    ["/critical", "/next-a"],
  );
  assert.deepEqual(
    plan.later.map((asset) => asset.url),
    ["/next-b", "/extra"],
  );
});

test("a fast link fits everything inside the window", () => {
  const plan = preload.planEntrancePreload(assets, 2500, { downlinkMbps: 100, rttMs: 20 });
  assert.equal(plan.later.length, 0);
  assert.equal(plan.now.length, 4);
});

test("a slow link still fetches the critical asset and defers the rest", () => {
  const plan = preload.planEntrancePreload(assets, 2500, { downlinkMbps: 0.5, rttMs: 600 });
  assert.deepEqual(
    plan.now.map((asset) => asset.url),
    ["/critical"],
  );
  assert.equal(plan.later.length, 3);
});

test("Save-Data fetches only priority 0 and schedules nothing later", () => {
  const plan = preload.planEntrancePreload(assets, 2500, { downlinkMbps: 100, saveData: true });
  assert.deepEqual(
    plan.now.map((asset) => asset.url),
    ["/critical"],
  );
  assert.equal(plan.later.length, 0);
});

test("unknown network uses the 10 Mbps / 100 ms default", () => {
  const plan = preload.planEntrancePreload(assets, 2500);
  assert.equal(plan.budgetBytes, 2_400_000);
});

test("the umbrella is critical on Home and next-view elsewhere", () => {
  assert.ok(preload.getEntranceAssets("/").every((asset) => asset.priority === 0));
  assert.ok(preload.getEntranceAssets("/market").every((asset) => asset.priority === 1));
});
