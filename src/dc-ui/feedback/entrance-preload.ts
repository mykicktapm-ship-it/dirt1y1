/**
 * Uses the entrance (logo + minimum skeleton) as a download window. The plan is a pure
 * function of the network estimate and the window length, so it is testable and the same
 * inputs always give the same plan.
 */

export interface PreloadAsset {
  url: string;
  /** Transfer size in bytes, used for the budget. */
  bytes: number;
  /** 0 = needed for the first view (always fetched), 1 = next likely view, 2 = nice to have. */
  priority: 0 | 1 | 2;
}

export interface NetworkEstimate {
  downlinkMbps?: number;
  rttMs?: number;
  saveData?: boolean;
}

export interface PreloadPlan {
  now: PreloadAsset[];
  later: PreloadAsset[];
  budgetBytes: number;
}

/** Unknown networks are planned as a modest mobile link, never as fibre. */
const DEFAULT_DOWNLINK_MBPS = 10;
const DEFAULT_RTT_MS = 100;
/** Leave headroom for the page's own requests that run in the same window. */
const UTILIZATION = 0.8;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/**
 * budget = bandwidth × (window − one round trip) × utilization.
 * Priority 0 is always fetched now. Lower priorities fill the budget strictly in order: the
 * first asset that does not fit and everything after it are fetched once the page is ready,
 * so a small low-priority file never jumps ahead of a larger, more important one.
 * Save-Data fetches priority 0 only.
 */
export function planEntrancePreload(
  assets: readonly PreloadAsset[],
  windowMs: number,
  network: NetworkEstimate = {},
): PreloadPlan {
  const downlink = clamp(network.downlinkMbps ?? DEFAULT_DOWNLINK_MBPS, 0.1, 1000);
  const rtt = clamp(network.rttMs ?? DEFAULT_RTT_MS, 0, 3000);
  const bytesPerMs = (downlink * 1_000_000) / 8 / 1000;
  const budgetBytes = Math.floor(bytesPerMs * Math.max(0, windowMs - rtt) * UTILIZATION);
  const ordered = [...assets].sort((a, b) => a.priority - b.priority);
  const now: PreloadAsset[] = [];
  const later: PreloadAsset[] = [];
  let used = 0;
  let full = false;

  for (const asset of ordered) {
    if (asset.priority === 0) {
      now.push(asset);
      used += asset.bytes;
    } else if (!network.saveData) {
      if (!full && used + asset.bytes <= budgetBytes) {
        now.push(asset);
        used += asset.bytes;
      } else {
        full = true;
        later.push(asset);
      }
    }
  }

  return { now, later, budgetBytes };
}

/** Sizes from the repository's public files; update them when an asset changes. */
const UMBRELLA_ASSETS: readonly Omit<PreloadAsset, "priority">[] = [
  { url: "/home/umbrella-viewer.html", bytes: 600 },
  { url: "/home/umbrella-viewer.js", bytes: 12_000 },
  { url: "/marketplace/viewer/vendor/build/three.module.js", bytes: 662_772 },
  { url: "/marketplace/viewer/vendor/build/three.core.js", bytes: 1_458_113 },
  { url: "/marketplace/viewer/vendor/addons/environments/RoomEnvironment.js", bytes: 4_960 },
  { url: "/marketplace/viewer/vendor/addons/loaders/GLTFLoader.js", bytes: 117_570 },
  { url: "/marketplace/viewer/vendor/addons/utils/BufferGeometryUtils.js", bytes: 37_712 },
  { url: "/home/black-umbrella.glb", bytes: 2_587_708 },
];

/** Home shows the umbrella as its hero; other routes show it in the header. */
export function getEntranceAssets(pathname: string | null): PreloadAsset[] {
  const priority = pathname === "/" ? 0 : 1;
  return UMBRELLA_ASSETS.map((asset) => ({ ...asset, priority }));
}

type ConnectionInfo = { downlink?: number; rtt?: number; saveData?: boolean };

function readNetwork(): NetworkEstimate {
  const connection = (navigator as Navigator & { connection?: ConnectionInfo }).connection;
  return {
    downlinkMbps: connection?.downlink || undefined,
    rttMs: connection?.rtt || undefined,
    saveData: connection?.saveData,
  };
}

const started = new Set<string>();

function warm(asset: PreloadAsset) {
  if (started.has(asset.url)) return;
  started.add(asset.url);
  // Fills the HTTP cache; the viewer iframe then reads the same URLs from cache.
  void fetch(asset.url, {
    credentials: "same-origin",
    priority: asset.priority === 0 ? "high" : "low",
  } as RequestInit).catch(() => started.delete(asset.url));
}

/** Starts the "now" set immediately and the rest once the site reports ready. */
export function runEntrancePreload(pathname: string | null, windowMs: number): void {
  if (typeof window === "undefined" || typeof fetch !== "function") return;
  const plan = planEntrancePreload(getEntranceAssets(pathname), windowMs, readNetwork());
  for (const asset of plan.now) warm(asset);
  if (!plan.later.length) return;
  const runLater = () => {
    const idle = (window as Window & { requestIdleCallback?: (callback: () => void) => number })
      .requestIdleCallback;
    const start = () => {
      for (const asset of plan.later) warm(asset);
    };
    if (idle) idle(start);
    else window.setTimeout(start, 200);
  };
  window.addEventListener("dc:site-ready", runLater, { once: true });
}
