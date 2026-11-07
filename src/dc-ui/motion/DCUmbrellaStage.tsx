"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import styles from "./umbrella-stage.module.scss";

export const DC_UMBRELLA_STAGE_ENABLED = true;

type Frame = { spin: number; elevation: number; size: number; ox: number; oy: number };
type Phase = "intro" | "home" | "badge" | "toCover" | "cover" | "toTarget";

const COVER_MS = 850;
const FLIGHT_MS = 850;
const MIN_COVER_MS = 850;
/** Smootherstep: zero speed and acceleration at both ends, so flights start and land softly. */
const EASE = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
const initialFrame: Frame = { spin: 1.4, elevation: 88, size: 0.56, ox: 0, oy: 0 };
/**
 * First Home load: the model enters upright, seen from the side (the angle of the ParaPactum
 * cover and of the S1 skeleton), and turns to the S1 top view once the site has loaded.
 */
const INTRO_ELEVATION = 10;
const INTRO_HOLD_MS = 600;
const INTRO_TURN_MS = 1400;
const sideView = (target: Frame): Frame => ({ ...target, elevation: INTRO_ELEVATION });

function badgeFrame(spin: number): Frame {
  const slot = Array.from(document.querySelectorAll<HTMLElement>("[data-umbrella-slot]")).find(
    (element) => element.getBoundingClientRect().width > 0,
  );
  const rect = slot?.getBoundingClientRect();
  return {
    spin,
    elevation: 88,
    size: 28 / Math.min(window.innerWidth, window.innerHeight),
    ox: rect ? ((rect.left + rect.width / 2) * 2) / window.innerWidth - 1 : 0,
    oy: rect ? 1 - ((rect.top + rect.height / 2) * 2) / window.innerHeight : 0.85,
  };
}

function interpolate(a: Frame, b: Frame, t: number): Frame {
  const k = EASE(Math.min(1, t));
  return {
    spin: a.spin + (b.spin - a.spin) * k,
    elevation: a.elevation + (b.elevation - a.elevation) * k,
    size: a.size + (b.size - a.size) * k,
    ox: a.ox + (b.ox - a.ox) * k,
    oy: a.oy + (b.oy - a.oy) * k,
  };
}

/** The root layout owns the single renderer; Home only supplies camera targets. */
export function DCUmbrellaStage() {
  const pathname = usePathname() ?? "/";
  const frameRef = useRef<HTMLIFrameElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [src, setSrc] = useState<string>();
  const [ready, setReady] = useState(false);
  const readyRef = useRef(false);
  const frame = useRef<Frame>(initialFrame);
  const homeFrame = useRef<Frame | null>(null);
  const homeSpinOffset = useRef(0);
  const phase = useRef<Phase>(pathname === "/" ? "home" : "badge");
  const path = useRef(pathname);
  const destination = useRef(pathname);
  const routeReady = useRef(false);
  const started = useRef(0);
  const phaseStarted = useRef(0);
  const phaseFrom = useRef<Frame>(initialFrame);
  const phaseTo = useRef<Frame>(initialFrame);
  const reduced = useRef(false);
  const raf = useRef(0);
  const lastTick = useRef(0);
  const lastBadgeRender = useRef(0);
  /** Intro clock: model ready, site revealed (side view visible), turn to the top view started. */
  const introShown = useRef(0);
  const introRevealed = useRef(0);
  const introTurn = useRef(0);

  const send = useCallback((next: Frame) => {
    frame.current = next;
    if (readyRef.current) {
      frameRef.current?.contentWindow?.postMessage(
        { type: "umbrella-frame", ...next },
        window.location.origin,
      );
    }
  }, []);

  const setPhase = useCallback((next: Phase) => {
    phase.current = next;
    if (stageRef.current) stageRef.current.dataset.pose = next;
    document.documentElement.dataset.umbrellaLive = next === "badge" ? "true" : "false";
  }, []);

  const animate = useCallback(() => {
    if (raf.current) return;
    raf.current = requestAnimationFrame(function tick(now) {
      raf.current = 0;
      if (document.hidden || !readyRef.current) return;
      const dt = Math.min(0.05, lastTick.current ? (now - lastTick.current) / 1000 : 0);
      lastTick.current = now;
      const current = phase.current;
      if (current === "intro") {
        const target = homeFrame.current ?? initialFrame;
        if (!introRevealed.current && document.querySelector('[data-app-ready="true"]')) {
          introRevealed.current = now;
        }
        // Hold the side view where the visitor can see it, then turn.
        if (
          !introTurn.current &&
          introRevealed.current &&
          now - introRevealed.current >= INTRO_HOLD_MS
        ) {
          introTurn.current = now;
        }
        const progress = introTurn.current ? (now - introTurn.current) / INTRO_TURN_MS : 0;
        send(interpolate(sideView(target), target, progress));
        if (progress >= 1) setPhase("home");
      } else if (current === "toCover" || current === "toTarget") {
        const duration = current === "toCover" ? COVER_MS : FLIGHT_MS;
        const progress = Math.min(1, (now - phaseStarted.current) / duration);
        send(interpolate(phaseFrom.current, phaseTo.current, progress));
        if (progress >= 1) {
          setPhase(
            current === "toCover" ? "cover" : destination.current === "/" ? "home" : "badge",
          );
          if (current === "toCover") window.dispatchEvent(new Event("dc:umbrella-cover-ready"));
        }
      } else if (current === "cover") {
        if (!reduced.current) send({ ...frame.current, spin: frame.current.spin + dt * 2.2 });
      } else if (current === "badge") {
        if (now - lastBadgeRender.current >= 32) {
          const elapsed = lastBadgeRender.current
            ? Math.min(0.1, (now - lastBadgeRender.current) / 1000)
            : 0;
          lastBadgeRender.current = now;
          send(badgeFrame(frame.current.spin + (reduced.current ? 0 : elapsed * 0.55)));
        }
      }
      if (phase.current !== "home" && (!reduced.current || phase.current.startsWith("to"))) {
        raf.current = requestAnimationFrame(tick);
      }
    });
  }, [send, setPhase]);

  const finishRoute = useCallback(() => {
    if (!routeReady.current || phase.current !== "cover") return;
    const remaining = MIN_COVER_MS - (performance.now() - started.current);
    if (remaining > 0) {
      window.setTimeout(finishRoute, remaining);
      return;
    }
    const isHome = destination.current === "/";
    if (isHome && !homeFrame.current) {
      window.setTimeout(finishRoute, 50);
      return;
    }
    const target = isHome ? homeFrame.current : badgeFrame(frame.current.spin);
    if (!target) return;
    const offset = isHome
      ? Math.round((frame.current.spin - target.spin) / (2 * Math.PI)) * 2 * Math.PI
      : 0;
    if (isHome) homeSpinOffset.current = offset;
    phaseFrom.current = frame.current;
    phaseTo.current = { ...target, spin: target.spin + offset + (isHome ? 0 : Math.PI * 0.5) };
    phaseStarted.current = performance.now();
    setPhase("toTarget");
    animate();
  }, [animate, setPhase]);

  const beginRoute = useCallback(
    (nextPath: string) => {
      if (!readyRef.current || reduced.current) return;
      if (nextPath === destination.current && phase.current !== "home" && phase.current !== "badge")
        return;
      destination.current = nextPath;
      routeReady.current = false;
      started.current = performance.now();
      phaseStarted.current = started.current;
      phaseFrom.current = frame.current;
      phaseTo.current = {
        spin: frame.current.spin + Math.PI * 2,
        elevation: 88,
        size: 0.92,
        ox: 0,
        oy: 0,
      };
      setPhase("toCover");
      animate();
      // A cancelled or failed navigation must not leave the cover on screen.
      window.setTimeout(() => {
        if (destination.current !== nextPath || path.current === nextPath || routeReady.current)
          return;
        destination.current = path.current;
        setPhase(path.current === "/" ? "home" : "badge");
        if (path.current === "/") {
          if (homeFrame.current)
            send({ ...homeFrame.current, spin: homeFrame.current.spin + homeSpinOffset.current });
        } else {
          send(badgeFrame(frame.current.spin));
          animate();
        }
      }, 4000);
    },
    [animate, send, setPhase],
  );

  useEffect(() => {
    if (!DC_UMBRELLA_STAGE_ENABLED) return;
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } })
      .connection;
    if (connection?.saveData) {
      document.documentElement.dataset.umbrellaStage = "error";
      window.dispatchEvent(new Event("dc:umbrella-status"));
      return;
    }
    const load = () => setSrc("/home/umbrella-viewer.html");
    if (pathname === "/" || document.querySelector('[data-app-ready="true"]')) load();
    else window.addEventListener("dc:site-ready", load, { once: true });
    return () => window.removeEventListener("dc:site-ready", load);
  }, [pathname]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {
      reduced.current = media.matches;
    };
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== location.origin || event.source !== frameRef.current?.contentWindow)
        return;
      if (event.data?.type === "umbrella-ready") {
        readyRef.current = true;
        setReady(true);
        document.documentElement.dataset.umbrellaStage = "ready";
        window.dispatchEvent(new Event("dc:umbrella-status"));
        if (path.current === "/" && !reduced.current && !introShown.current) {
          introShown.current = performance.now();
          setPhase("intro");
          send(sideView(homeFrame.current ?? initialFrame));
          animate();
        } else if (path.current === "/") {
          setPhase("home");
          send(homeFrame.current ?? initialFrame);
        } else {
          setPhase("badge");
          send(badgeFrame(frame.current.spin));
          animate();
        }
      } else if (event.data?.type === "umbrella-error") {
        document.documentElement.dataset.umbrellaStage = "error";
        window.dispatchEvent(new Event("dc:umbrella-status"));
      }
    };
    const onHomeFrame = (event: Event) => {
      const next = (event as CustomEvent<Frame>).detail;
      if (!next || ![next.spin, next.elevation, next.size, next.ox, next.oy].every(Number.isFinite))
        return;
      homeFrame.current = next;
      if (phase.current === "home") send({ ...next, spin: next.spin + homeSpinOffset.current });
    };
    const onClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      const anchor = (event.target as Element)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (
        !anchor ||
        anchor.target ||
        anchor.hasAttribute("download") ||
        anchor.origin !== location.origin
      )
        return;
      if (anchor.pathname.replace(/\/$/, "") !== location.pathname.replace(/\/$/, ""))
        beginRoute(anchor.pathname);
    };
    const onPop = () => beginRoute(location.pathname);
    const onPageReady = () => {
      routeReady.current = true;
      finishRoute();
    };
    const onVisibility = () => {
      if (!document.hidden) {
        lastTick.current = 0;
        if (phase.current !== "home") animate();
      }
    };
    const onResize = () => {
      if (phase.current === "badge") send(badgeFrame(frame.current.spin));
    };
    window.addEventListener("message", onMessage);
    window.addEventListener("dc:umbrella-home-frame", onHomeFrame);
    document.addEventListener("click", onClick, true);
    window.addEventListener("popstate", onPop);
    window.addEventListener("dc:page-ready", onPageReady);
    window.addEventListener("dc:umbrella-cover-ready", finishRoute);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("message", onMessage);
      window.removeEventListener("dc:umbrella-home-frame", onHomeFrame);
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("popstate", onPop);
      window.removeEventListener("dc:page-ready", onPageReady);
      window.removeEventListener("dc:umbrella-cover-ready", finishRoute);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(raf.current);
      delete document.documentElement.dataset.umbrellaStage;
      delete document.documentElement.dataset.umbrellaLive;
    };
  }, [animate, beginRoute, finishRoute, send, setPhase]);

  useEffect(() => {
    if (path.current === pathname) return;
    // Leaving Home mid-intro: the route flight starts from the current pose.
    if (phase.current === "intro") setPhase("home");
    const previous = path.current;
    path.current = pathname;
    if (!ready) return;
    if (reduced.current) {
      destination.current = pathname;
      setPhase(pathname === "/" ? "home" : "badge");
      if (pathname !== "/") {
        send(badgeFrame(frame.current.spin));
        animate();
      }
      return;
    }
    if (phase.current === "home" || phase.current === "badge") beginRoute(pathname);
    destination.current = pathname;
    if (previous === "/") homeFrame.current = null;
  }, [pathname, ready, animate, beginRoute, send, setPhase]);

  if (!DC_UMBRELLA_STAGE_ENABLED) return null;
  return (
    <div aria-hidden="true" className={styles.stage} data-pose="home" ref={stageRef}>
      {src && (
        <iframe
          className={styles.frame}
          ref={frameRef}
          src={src}
          tabIndex={-1}
          title="ParaPactum 3D artwork"
        />
      )}
    </div>
  );
}
