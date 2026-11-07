type NetworkConnection = {
  saveData?: boolean;
  effectiveType?: string;
  downlink?: number;
};

type ImageLoadJob = {
  start: (release: () => void) => (() => void) | undefined;
  onTimeout: () => void;
  state: "queued" | "active" | "settled";
  cleanup?: () => void;
  timer?: ReturnType<typeof setTimeout>;
};

const queuedLoads: ImageLoadJob[] = [];
const activeLoads = new Set<ImageLoadJob>();
const requestTimeout = 15_000;
let draining = false;

export function isSlowImageConnection() {
  if (typeof navigator === "undefined") return false;
  const connection = (navigator as Navigator & { connection?: NetworkConnection }).connection;
  return Boolean(
    connection?.saveData ||
      connection?.effectiveType === "slow-2g" ||
      connection?.effectiveType === "2g" ||
      connection?.effectiveType === "3g" ||
      (typeof connection?.downlink === "number" && connection.downlink <= 1),
  );
}

function releaseJob(job: ImageLoadJob) {
  if (job.state !== "active") return;
  job.state = "settled";
  clearTimeout(job.timer);
  activeLoads.delete(job);
  drainQueue();
}

function cleanupJob(job: ImageLoadJob) {
  const cleanup = job.cleanup;
  job.cleanup = undefined;
  cleanup?.();
}

function drainQueue() {
  if (draining) return;
  draining = true;
  try {
    while (queuedLoads.length && activeLoads.size < (isSlowImageConnection() ? 1 : 2)) {
      const job = queuedLoads.shift();
      if (!job) break;
      job.state = "active";
      activeLoads.add(job);
      // A stalled browser request must not hold the remaining images indefinitely.
      job.timer = setTimeout(() => {
        try {
          cleanupJob(job);
          job.onTimeout();
        } finally {
          releaseJob(job);
        }
      }, requestTimeout);
      try {
        job.cleanup = job.start(() => releaseJob(job));
      } catch {
        try {
          job.onTimeout();
        } finally {
          releaseJob(job);
        }
      }
    }
  } finally {
    draining = false;
  }
}

export function queueImageLoad(start: ImageLoadJob["start"], onTimeout: ImageLoadJob["onTimeout"]) {
  const job: ImageLoadJob = { start, onTimeout, state: "queued" };
  queuedLoads.push(job);
  drainQueue();
  return () => {
    if (job.state === "queued") {
      const index = queuedLoads.indexOf(job);
      if (index !== -1) queuedLoads.splice(index, 1);
      job.state = "settled";
      return;
    }
    try {
      cleanupJob(job);
    } finally {
      releaseJob(job);
    }
  };
}
