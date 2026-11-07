"use client";

import { DCCurrencyMark } from "@/dc-ui/typography/DCCurrencyMark";
import { marketplaceSkeletonMasks } from "@/resources/marketplace-skeletons";
import * as React from "react";
import { EmptyDescription, EmptyHeader, EmptyTitle } from "./empty";
import { HomeAccessActions } from "./home-access-actions";
import HomeItemShowcase from "./home-item-showcase";
import { SkeletonImage } from "./skeleton-image";
import { CircleSkeleton } from "./skeleton-shapes";

const HomeGameStepper = React.lazy(() => import("./home-game-stepper"));
const HomeSectorPreview = React.lazy(() => import("./home-sector-preview"));

/** Home: the five-scene scroll stage that steers the umbrella camera. */

export type HomeStageProps = {
  /** Display face; the first family is the one `fontHref` loads. */
  fontFamily?: string;
  /** Stylesheet for the display face. `null` loads nothing. */
  fontHref?: string | null;
  /** Text colour. */
  textColor?: string;
  /** Accent colour. */
  accentColor?: string;
  /** Height of the sticky stage. Must be a definite length. */
  height?: string;
  /** Stage-heights of scroll per scene. */
  sceneScroll?: number;
  /** Slow idle turn and pointer tilt. Reduced motion stops them. */
  alive?: boolean;
  className?: string;
};

// #region scroll
const clamp01 = (x: number) => (x <= 0 ? 0 : x > 1 ? 1 : x);
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

/** 0 while the root's top sits at the stage's top, 1 when its bottom does. */
const progressFrom = (top: number, height: number, viewport: number) => {
  const travel = height - viewport;
  if (travel <= 0) return 0;
  return clamp01(-top / travel);
};

/**
 * Scroll progress → a continuous frame coordinate in 0..n-1. Integers are the
 * frames; each one holds for `hold` of its slot so the layout can be read
 * before the next morph starts.
 */
const sceneCoord = (p: number, n: number, hold: number) => {
  if (n <= 1) return 0;
  const t = clamp01(p) * (n - 1);
  const i = Math.min(Math.floor(t), n - 2);
  const h = hold / 2;
  return i + easeInOut(clamp01((t - i - h) / (1 - 2 * h)));
};

/**
 * How present one element of frame `scene` is at `coord`. `delay` 0..1 staggers
 * it: late on the way in, and — mirrored — late on the way out.
 */
const reveal = (coord: number, scene: number, delay: number) => {
  const d = coord - scene;
  const lag = d < 0 ? delay : 1 - delay;
  return clamp01((0.6 - Math.abs(d) - lag * 0.2) / 0.25);
};
// #endregion

// ---- camera frames -------------------------------------------------------

type Key = {
  /** turn of the umbrella about its shaft, radians */
  spin: number;
  /** camera elevation, degrees; +90 looks straight down */
  el: number;
  /** umbrella radius as a fraction of the stage's short side */
  size: number;
  /** where the umbrella's centre lands, in clip space (-1..1, +y up) */
  ox: number;
  oy: number;
};

const KEYS: Key[] = [
  { spin: 1.4, el: 88, size: 0.58, ox: 0, oy: 0 },
  { spin: 2.3, el: 12, size: 0.1, ox: 0.6, oy: -0.6 },
  { spin: 3.1, el: -30, size: 0.23, ox: 0, oy: 0.58 },
  { spin: 4.1, el: 16, size: 1.02, ox: 0.66, oy: 0.2 },
  // S5: centred on the screen.
  { spin: 5.0, el: -74, size: 0.86, ox: 0, oy: 0 },
];
// Portrait stages move the umbrella rather than squeezing the type.
const KEYS_TALL: Partial<Key>[] = [
  { size: 0.56 },
  {},
  { size: 0.3, oy: 0.6 },
  // S4: higher than the default so the heading below it reads.
  { size: 0.86, ox: 0.5, oy: 0.58 },
  { size: 0.96, oy: 0 },
];
const SCENES = KEYS.length;
const HOLD = 0.34;
const NAV = ["USDC", "Items", "How it works", "ParaPactum", "Footer"];
/** S1 skeleton: the upright umbrella seen from the side, the pose the model enters in. */
const umbrellaSideMask = marketplaceSkeletonMasks["bulletproof-umbrella"];
/** Side silhouette geometry (278 × 192 units): canopy width and the model's centre height. */
const SIDE_MASK = { width: 278, canopy: 248, aspect: 556 / 384, centerY: 91.5 / 192 };

const keyAt = (
  coord: number,
  tall: boolean,
  width: number,
  height: number,
  guideTarget?: Pick<Key, "size" | "ox" | "oy">,
  galleryTarget?: Pick<Key, "size" | "ox" | "oy">,
  heroTarget?: Pick<Key, "size" | "ox" | "oy">,
): Key => {
  const i = Math.max(0, Math.min(SCENES - 1, Math.floor(coord)));
  const j = Math.min(SCENES - 1, i + 1);
  const f = coord - i;
  const galleryWidth = Math.min(width * 0.84, height * (height <= 420 ? 0.4 : 0.48));
  const gap = Math.min(16, Math.max(4, width * 0.01));
  const thumbnail = Math.max(1, (galleryWidth - 3 * gap) / 4);
  const galleryUmbrella = {
    size: (thumbnail * 1.15) / Math.min(width, height),
    ox: ((width - galleryWidth) / 2 + 3.5 * thumbnail + 3 * gap) * (2 / width) - 1,
    oy: -1 + ((height * 0.01 + 1.5 * thumbnail + gap) * 2) / height,
  };
  const a = {
    ...KEYS[i],
    ...(tall ? KEYS_TALL[i] : {}),
    ...(i === 0 && heroTarget ? heroTarget : {}),
    ...(i === 1 ? (galleryTarget ?? galleryUmbrella) : {}),
    ...(i === 2 && guideTarget ? guideTarget : {}),
  };
  const b = {
    ...KEYS[j],
    ...(tall ? KEYS_TALL[j] : {}),
    ...(j === 0 && heroTarget ? heroTarget : {}),
    ...(j === 1 ? (galleryTarget ?? galleryUmbrella) : {}),
    ...(j === 2 && guideTarget ? guideTarget : {}),
  };
  const l = (x: number, y: number) => x + (y - x) * f;
  return {
    spin: l(a.spin, b.spin),
    el: l(a.el, b.el),
    size: l(a.size, b.size),
    ox: l(a.ox, b.ox),
    oy: l(a.oy, b.oy),
  };
};

const DISPLAY =
  '"Federant", "Uncial Antiqua", "Cinzel Decorative", "Iowan Old Style", "Palatino Linotype", Georgia, serif';
const SANS = '"Helvetica Neue", Helvetica, Arial, ui-sans-serif, system-ui, sans-serif';
const FONT_HREF = "https://fonts.googleapis.com/css2?family=Federant&display=swap";

// Scoped by the hs- prefix and injected once as a style element: no CSS imports, no bare
// element resets.
const CSS =
  ".hs-stage{container-type:size;container-name:hs}" +
  ".hs-hero-layout{display:flex;align-items:center;justify-content:center;padding:24px 16px}" +
  ".hs-hero-stack{display:flex;flex-direction:column;align-items:center;gap:25px;width:100%;max-height:100%;min-height:0}" +
  ".hs-hero-artwork{--hs-hero-size:min(42.87cqw,42.87cqh);width:var(--hs-hero-size);height:calc(var(--hs-hero-size)*1.1);min-height:48px;flex-shrink:1}" +
  ".hs-hero-copy{width:100%;max-width:20rem;flex-shrink:0;font-family:var(--dc-font-body);color:var(--dc-color-text)}" +
  ".hs-hero-copy [data-slot=empty-description]{max-width:19rem;margin-inline:auto}" +
  ".hs-hero-actions{pointer-events:auto;margin-top:24px}" +
  ".hs-char{display:inline-block;animation:hs-in 1.3s cubic-bezier(.2,.8,.2,1) both}" +
  "@keyframes hs-in{from{opacity:0;transform:translateY(0.35em) rotate(4deg);filter:blur(10px)}to{opacity:1;transform:none;filter:blur(0)}}" +
  ".hs-g{display:inline-block;transition:color .25s,transform .25s cubic-bezier(.2,.8,.2,1);cursor:default}" +
  ".hs-g:hover{color:var(--hs-accent);transform:translateY(-0.08em) scale(1.35)}" +
  ".hs-nav button{display:flex;align-items:center;gap:10px;justify-content:flex-end;background:none;border:0;padding:5px 0;cursor:pointer;color:inherit;font:inherit}" +
  ".hs-nav .hs-tick{display:block;height:1px;width:14px;background:currentColor;opacity:.45;transition:width .4s cubic-bezier(.2,.8,.2,1),opacity .3s,background-color .3s}" +
  ".hs-nav .hs-lab{opacity:0;transform:translateX(6px);transition:opacity .3s,transform .3s}" +
  ".hs-nav button:hover .hs-lab,.hs-nav button:focus-visible .hs-lab{opacity:1;transform:none}" +
  ".hs-nav button[aria-current=step] .hs-tick{width:34px;opacity:1;background:var(--hs-accent)}" +
  ".hs-wide{display:block}.hs-tall{display:none}" +
  "@container hs (orientation: portrait){.hs-wide{display:none}.hs-tall{display:block}" +
  ".hs-hero-artwork{--hs-hero-size:min(41.39cqw,41.39cqh)}" +
  ".hs-bloom{left:7cqw!important;top:auto!important;bottom:13cqh}" +
  ".hs-spec{grid-template-columns:1fr 1fr!important}.hs-spec-mid{display:none!important}}" +
  "@container hs (max-width: 720px){.hs-hide-sm{display:none!important}}" +
  "@container hs (max-width: 1020px){.hs-hide-md{display:none!important}}" +
  "@container hs (max-height: 420px){.hs-hero-layout{padding-block:12px}.hs-hero-copy [data-slot=empty-description]{font-size:12px;line-height:1.5}.hs-hero-actions{margin-top:16px}}" +
  "@media (prefers-reduced-motion: reduce){.hs-char{animation:none}.hs-g{transition:none}}";

type Fx = "rise" | "clip" | "line" | "fade" | "draw";

/** Everything that belongs to one frame registers itself through this. */
const sc = (scene: number, fx: Fx = "rise", delay = 0) => ({
  "data-sc": scene,
  "data-fx": fx,
  "data-d": delay,
});

export default function HomeStage({
  fontFamily = DISPLAY,
  fontHref = FONT_HREF,
  textColor = "#ffffff",
  accentColor = "var(--dc-color-accent-strong)",
  height = "calc(100svh - 5rem)",
  sceneScroll = 1.2,
  alive = true,
  className = "",
}: HomeStageProps) {
  const rootRef = React.useRef<HTMLElement | null>(null);
  const stageRef = React.useRef<HTMLDivElement | null>(null);
  const heroArtworkRef = React.useRef<HTMLDivElement | null>(null);
  const placeholderRef = React.useRef<HTMLDivElement | null>(null);
  const [modelStatus, setModelStatus] = React.useState("loading");
  const [reduced, setReduced] = React.useState(false);
  const [active, setActive] = React.useState(0);
  const [guidePrepared, setGuidePrepared] = React.useState(false);
  const [sectorPrepared, setSectorPrepared] = React.useState(false);
  const jumpCancelRef = React.useRef<(() => void) | null>(null);

  React.useEffect(
    () => () => {
      jumpCancelRef.current?.();
    },
    [],
  );

  React.useEffect(() => {
    document.documentElement.dataset.homeSlide = String(active);
    window.dispatchEvent(new CustomEvent("dc:home-slide-change", { detail: { index: active } }));
  }, [active]);

  React.useEffect(
    () => () => {
      delete document.documentElement.dataset.homeSlide;
    },
    [],
  );

  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  // The display face. A <link>, once per document, never a CSS import.
  React.useEffect(() => {
    if (!fontHref) return;
    const exists = Array.from(document.querySelectorAll("link[rel=stylesheet]")).some(
      (l) => (l as HTMLLinkElement).href === fontHref,
    );
    if (exists) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = fontHref;
    link.setAttribute("data-home-font", "");
    document.head.appendChild(link);
  }, [fontHref]);

  const look = React.useRef({ accentColor, alive, reduced, modelStatus });
  look.current = { accentColor, alive, reduced, modelStatus };

  React.useEffect(() => {
    const root = rootRef.current;
    const stage = stageRef.current;
    if (!root || !stage) return;

    const syncModelStatus = () => {
      const status = document.documentElement.dataset.umbrellaStage;
      if (status === "ready" || status === "error") setModelStatus(status);
    };
    window.addEventListener("dc:umbrella-status", syncModelStatus);
    syncModelStatus();
    // ---- measuring ---------------------------------------------------------
    let W = 1;
    let H = 1;
    // Read once per resize, not per frame: getComputedStyle in the loop forces style work.
    let stickyTop = 0;
    const measure = () => {
      stickyTop = Number.parseFloat(getComputedStyle(stage).top) || 0;
      const sr = stage.getBoundingClientRect();
      W = Math.max(1, sr.width);
      H = Math.max(1, sr.height);
    };
    const ro = new ResizeObserver(measure);
    ro.observe(stage);
    measure();
    const fonts = (document as Document & { fonts?: FontFaceSet }).fonts;
    const onFonts = () => measure();
    fonts?.addEventListener?.("loadingdone", onFonts);
    fonts?.ready.then(onFonts);

    // ---- frame elements -----------------------------------------------------
    const readItems = () =>
      Array.from(stage.querySelectorAll<HTMLElement>("[data-sc]")).map((el) => ({
        el,
        scene: Number(el.dataset.sc),
        fx: el.dataset.fx as Fx,
        delay: Number(el.dataset.d) || 0,
        last: -1,
      }));
    let items = readItems();
    const childrenObserver = new MutationObserver(() => {
      items = readItems();
    });
    childrenObserver.observe(stage, { childList: true, subtree: true });
    // Camera anchors are looked up when the DOM changes, not on every frame.
    let galleryAnchor: HTMLElement | null = null;
    let guideAnchor: HTMLElement | null = null;
    const readAnchors = () => {
      galleryAnchor = stage.querySelector<HTMLElement>("[data-umbrella-gallery-anchor]");
      guideAnchor = stage.querySelector<HTMLElement>("[data-umbrella-step-anchor]");
    };
    readAnchors();
    const anchorObserver = new MutationObserver(readAnchors);
    anchorObserver.observe(stage, {
      attributeFilter: ["data-umbrella-gallery-anchor", "data-umbrella-step-anchor"],
      childList: true,
      subtree: true,
    });

    // ---- input ----------------------------------------------------------------
    const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
    let spin = 0;
    let spinVel = 0;
    let drag: { id: number; x: number } | null = null;
    const onMove = (e: PointerEvent) => {
      const r = stage.getBoundingClientRect();
      pointer.tx = ((e.clientX - r.left) / r.width) * 2 - 1;
      pointer.ty = ((e.clientY - r.top) / r.height) * 2 - 1;
      if (drag && drag.id === e.pointerId) {
        spinVel += (e.clientX - drag.x) * 0.0022;
        drag.x = e.clientX;
      }
    };
    const onDown = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      const t = e.target as HTMLElement;
      if (t.closest("a,button,input,select,textarea,[contenteditable]")) return;
      drag = { id: e.pointerId, x: e.clientX };
      stage.style.cursor = "grabbing";
    };
    const onUp = () => {
      drag = null;
      stage.style.cursor = "";
    };
    stage.addEventListener("pointermove", onMove);
    stage.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);

    // ---- loop -------------------------------------------------------------------
    let raf = 0;
    let running = false;
    let visible = true;
    let last = performance.now();
    let prog01 = -1;
    let shownScene = -1;
    let guidePreparationRequested = false;
    let sectorPreparationRequested = false;

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const L = look.current;
      const moving = L.alive && !L.reduced;

      const r = root.getBoundingClientRect();
      const p = progressFrom(r.top - stickyTop, r.height, H);
      prog01 = prog01 < 0 || L.reduced ? p : prog01 + (p - prog01) * (1 - Math.exp(-dt * 6));
      const coord = sceneCoord(prog01, SCENES, HOLD);
      if (coord > 0.15 && !guidePreparationRequested) {
        guidePreparationRequested = true;
        setGuidePrepared(true);
      }
      if (coord > 1.15 && !sectorPreparationRequested) {
        sectorPreparationRequested = true;
        setSectorPrepared(true);
      }
      const scene = Math.round(coord);
      if (scene !== shownScene) {
        shownScene = scene;
        setActive(scene);
      }

      // camera
      const tall = H > W * 1.05;
      const sr = stage.getBoundingClientRect();
      const heroRect = heroArtworkRef.current?.getBoundingClientRect();
      const heroTarget = heroRect
        ? {
            // Reserve the rotating canopy envelope without enlarging the artwork.
            size: (Math.min(heroRect.width, heroRect.height / 1.1) * 1.15) / Math.min(W, H),
            ox: ((heroRect.left + heroRect.width / 2 - sr.left) * 2) / W - 1,
            oy: 1 - ((heroRect.top + heroRect.height / 2 - sr.top) * 2) / H,
          }
        : undefined;
      const galleryRect = galleryAnchor?.getBoundingClientRect();
      const galleryTarget =
        galleryRect && galleryRect.width > 0 && galleryRect.height > 0
          ? {
              size: (Math.min(galleryRect.width, galleryRect.height) * 1.15) / Math.min(W, H),
              ox: ((galleryRect.left + galleryRect.width / 2 - sr.left) * 2) / W - 1,
              oy: 1 - ((galleryRect.top + galleryRect.height / 2 - sr.top) * 2) / H,
            }
          : undefined;
      const guideRect = guideAnchor?.getBoundingClientRect();
      const guideTarget =
        guideRect && guideRect.width > 0 && guideRect.height > 0
          ? {
              size: (Math.min(guideRect.width, guideRect.height) * 1.05) / Math.min(W, H),
              ox: ((guideRect.left + guideRect.width / 2 - sr.left) * 2) / W - 1,
              oy: 1 - ((guideRect.top + guideRect.height / 2 - sr.top) * 2) / H,
            }
          : undefined;
      // Keep the artwork's position and size when its canvas extends into the side margins.
      const k = keyAt(coord, tall, W, H, guideTarget, galleryTarget, heroTarget);
      const placeholder = placeholderRef.current;
      if (placeholder) {
        // Side silhouette: the canopy (the model's largest extent) spans 248 of its 278 units.
        const width = Math.max(
          1,
          (k.size * Math.min(W, H) * SIDE_MASK.width) / (1.15 * SIDE_MASK.canopy),
        );
        placeholder.style.width = `${width}px`;
        placeholder.style.height = `${width / SIDE_MASK.aspect}px`;
        placeholder.style.left = `${((k.ox + 1) * W) / 2}px`;
        placeholder.style.top = `${((1 - k.oy) * H) / 2}px`;
        placeholder.style.visibility = "visible";
      }
      pointer.x += (pointer.tx - pointer.x) * (1 - Math.exp(-dt * 4));
      pointer.y += (pointer.ty - pointer.y) * (1 - Math.exp(-dt * 4));
      if (moving) {
        spin += spinVel + dt * 0.1;
        spinVel *= Math.exp(-dt * 3);
      } else {
        spin += spinVel;
        spinVel = 0;
      }
      const px = moving ? pointer.x : 0;
      const py = moving ? pointer.y : 0;
      const viewportShort = Math.min(window.innerWidth, window.innerHeight);
      window.dispatchEvent(
        new CustomEvent("dc:umbrella-home-frame", {
          detail: {
            spin: k.spin + spin + px * 0.35,
            elevation: k.el + py * 9,
            size: (k.size * Math.min(W, H)) / viewportShort,
            ox: ((sr.left + ((k.ox + 1) * W) / 2) * 2) / window.innerWidth - 1,
            oy: 1 - ((sr.top + ((1 - k.oy) * H) / 2) * 2) / window.innerHeight,
          },
        }),
      );
      // ---- the type ---------------------------------------------------------
      const still = L.reduced;
      for (const it of items) {
        const v = reveal(coord, it.scene, it.delay);
        const q = Math.round(v * 500) / 500;
        if (q === it.last) continue;
        it.last = q;
        const s = it.el.style;
        const dir = coord < it.scene ? 1 : -1;
        s.visibility = q <= 0 ? "hidden" : "";
        if (it.fx === "draw") {
          s.setProperty("--v", String(q));
          s.opacity = String(Math.min(1, q * 3));
          continue;
        }
        if (it.fx === "line") {
          s.transform = `scaleX(${q})`;
          s.opacity = String(Math.min(1, q * 2));
          continue;
        }
        s.opacity = String(q);
        if (still || it.fx === "fade") continue;
        if (it.fx === "clip") {
          const hid = ((1 - q) * 100).toFixed(1);
          s.clipPath = dir > 0 ? `inset(0 0 ${hid}% 0)` : `inset(${hid}% 0 0 0)`;
          s.transform = `translateY(${((1 - q) * 0.4 * dir).toFixed(3)}em)`;
        } else {
          s.transform = `translateY(${((1 - q) * 34 * dir).toFixed(1)}px)`;
          s.filter = q > 0.995 ? "" : `blur(${((1 - q) * 8).toFixed(1)}px)`;
        }
      }
    };

    const start = () => {
      if (running || !visible || document.hidden) return;
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible) start();
      else stop();
    });
    io.observe(root);
    const onVis = () => (document.hidden ? stop() : start());
    document.addEventListener("visibilitychange", onVis);
    start();

    return () => {
      stop();
      io.disconnect();
      ro.disconnect();
      childrenObserver.disconnect();
      anchorObserver.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      fonts?.removeEventListener?.("loadingdone", onFonts);
      stage.removeEventListener("pointermove", onMove);
      stage.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("dc:umbrella-status", syncModelStatus);
    };
  }, []);

  const jump = (i: number) => {
    jumpCancelRef.current?.();
    const root = rootRef.current;
    const stage = stageRef.current;
    if (!root || !stage) return;
    const r = root.getBoundingClientRect();
    const travel = r.height - stage.clientHeight;
    const delta =
      (i / (SCENES - 1)) * travel + r.top - Number.parseFloat(getComputedStyle(stage).top);
    let el: HTMLElement | null = root.parentElement;
    while (el && el !== document.body) {
      const oy = getComputedStyle(el).overflowY;
      if ((oy === "auto" || oy === "scroll") && el.scrollHeight > el.clientHeight) break;
      el = el.parentElement;
    }
    const scrollContainer =
      el && el !== document.body ? el : (document.scrollingElement ?? document.documentElement);
    const start = scrollContainer.scrollTop;
    const target = Math.max(
      0,
      Math.min(scrollContainer.scrollHeight - scrollContainer.clientHeight, start + delta),
    );
    const writeScroll = (top: number) => scrollContainer.scrollTo({ top, behavior: "instant" });
    if (reduced || Math.abs(target - start) < 1) {
      writeScroll(target);
      return;
    }

    const duration = 1300;
    const startedAt = performance.now();
    let raf = 0;
    const cancel = () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("wheel", cancel);
      window.removeEventListener("touchstart", cancel);
      window.removeEventListener("keydown", cancel);
      window.removeEventListener("pointerdown", cancel);
      window.removeEventListener("resize", cancel);
      if (jumpCancelRef.current === cancel) jumpCancelRef.current = null;
    };
    const frame = (now: number) => {
      const t = clamp01((now - startedAt) / duration);
      const eased = t * t * t * (t * (t * 6 - 15) + 10);
      writeScroll(start + (target - start) * eased);
      if (t < 1) raf = requestAnimationFrame(frame);
      else cancel();
    };
    jumpCancelRef.current = cancel;
    window.addEventListener("wheel", cancel, { passive: true });
    window.addEventListener("touchstart", cancel, { passive: true });
    window.addEventListener("keydown", cancel);
    window.addEventListener("pointerdown", cancel, { passive: true });
    window.addEventListener("resize", cancel);
    raf = requestAnimationFrame(frame);
  };

  // Scenes can ask for a jump (e.g. the S3 chat invite to the S5 footer).
  const jumpRef = React.useRef(jump);
  jumpRef.current = jump;
  React.useEffect(() => {
    const onJump = (event: Event) => {
      const scene = Number((event as CustomEvent<number>).detail);
      if (Number.isInteger(scene) && scene >= 0 && scene < SCENES) jumpRef.current(scene);
    };
    window.addEventListener("dc:home-jump", onJump);
    return () => window.removeEventListener("dc:home-jump", onJump);
  }, []);

  const display: React.CSSProperties = { fontFamily, fontWeight: 400 };
  const sans: React.CSSProperties = { fontFamily: SANS };
  const hidden: React.CSSProperties = { opacity: 0 };
  const collectionActive = active === 1;

  return (
    <section
      ref={rootRef}
      className={`relative w-full ${className}`}
      style={{
        height: `calc(${height} * ${(1 + (SCENES - 1) * sceneScroll).toFixed(3)})`,
        background: "transparent",
      }}
      aria-label="USDC collection"
    >
      <style>{CSS}</style>
      <div
        ref={stageRef}
        className="hs-stage sticky top-0 w-full overflow-hidden select-none"
        style={
          {
            height,
            color: textColor,
            background: "transparent",
            ["--hs-accent" as string]: accentColor,
          } as React.CSSProperties
        }
      >
        {!collectionActive && modelStatus !== "ready" && (
          <div
            ref={placeholderRef}
            data-site-loading={modelStatus === "loading" ? "true" : undefined}
            aria-hidden="true"
            className="pointer-events-none absolute"
            style={{
              left: "50%",
              top: "40%",
              width: "min(56%, 56svh)",
              aspectRatio: SIDE_MASK.aspect,
              transform: `translate(-50%, -${SIDE_MASK.centerY * 100}%)`,
            }}
          >
            {modelStatus === "error" ? (
              <SkeletonImage
                src="/marketplace/bulletproof-umbrella/cover.webp"
                alt=""
                shape="rounded"
                className="h-full w-full object-contain"
              />
            ) : (
              <span
                style={{
                  display: "block",
                  width: "100%",
                  height: "100%",
                  maskImage: `url("${umbrellaSideMask}")`,
                  maskSize: "contain",
                  maskPosition: "center",
                  maskRepeat: "no-repeat",
                  WebkitMaskImage: `url("${umbrellaSideMask}")`,
                  WebkitMaskSize: "contain",
                  WebkitMaskPosition: "center",
                  WebkitMaskRepeat: "no-repeat",
                }}
              >
                <CircleSkeleton style={{ width: "100%", height: "100%" }} />
              </span>
            )}
          </div>
        )}

        {/* ================================ 0 · crown ================================ */}
        <div
          className="hs-hero-layout pointer-events-none absolute inset-0 overflow-hidden"
          aria-hidden={active !== 0}
          inert={active !== 0}
        >
          <div className="hs-hero-stack">
            <div ref={heroArtworkRef} className="hs-hero-artwork" aria-hidden="true" />
            <div {...sc(0, "fade", 0.5)} className="hs-hero-copy" style={hidden}>
              <EmptyHeader className="w-full min-w-0">
                <EmptyTitle className="max-w-full break-words">
                  <h1 style={{ margin: 0, font: "inherit", letterSpacing: "inherit" }}>
                    <DCCurrencyMark />
                  </h1>
                </EmptyTitle>
                <EmptyDescription className="w-full">
                  United States Dirty Coin <DCCurrencyMark /> is a Solana-based digital asset
                  project focused on privacy development
                </EmptyDescription>
              </EmptyHeader>
              <div className="hs-hero-actions">
                <HomeAccessActions onContinue={() => jump(1)} />
              </div>
            </div>
          </div>
        </div>

        {/* ============================== 1 · collection ============================= */}
        <div
          className="pointer-events-none absolute inset-0"
          style={display}
          aria-hidden={!collectionActive}
          inert={!collectionActive}
        >
          <HomeItemShowcase active={collectionActive} artworkReady={modelStatus === "ready"} />
        </div>

        {/* ================================ 2 · fancy =============================== */}
        <div
          className="pointer-events-none absolute inset-0 overflow-hidden"
          style={display}
          aria-hidden={active !== 2}
          inert={active !== 2}
        >
          {guidePrepared && (
            <React.Suspense fallback={null}>
              <HomeGameStepper />
            </React.Suspense>
          )}
        </div>

        {/* ================================ 3 · umbrella ================================ */}
        <div
          className="pointer-events-none absolute inset-0 overflow-hidden"
          style={display}
          aria-hidden={active !== 3}
          inert={active !== 3}
        >
          {sectorPrepared && (
            <React.Suspense fallback={null}>
              <HomeSectorPreview />
            </React.Suspense>
          )}
        </div>

        {/* ================================ 4 · footer ================================ */}
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden={active !== 4}
          inert={active !== 4}
        />

        {/* ================================== nav ================================== */}
        <nav
          aria-label="Home slides"
          className="hs-nav hs-hide-sm absolute flex flex-col items-end"
          hidden={active === 0}
          inert={active === 0}
          style={{
            ...sans,
            display: active === 0 ? "none" : undefined,
            right: "2cqw",
            top: "50%",
            transform: "translateY(-50%)",
            fontSize: 9,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
          }}
        >
          {NAV.map((n, i) => (
            <button
              key={n}
              type="button"
              onClick={() => jump(i)}
              aria-current={active === i ? "step" : undefined}
            >
              <span className="hs-lab">
                {String(i + 1).padStart(2, "0")} {n}
              </span>
              <span className="hs-tick" />
            </button>
          ))}
        </nav>
      </div>
    </section>
  );
}
