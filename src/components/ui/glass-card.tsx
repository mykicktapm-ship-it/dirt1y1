"use client";
import { useDCLoadingPhase } from "@/dc-ui/feedback/DCLoadingContext";
import { DCCurrencyText, currencyDisplayText } from "@/dc-ui/typography/DCCurrencyMark";
import { getMarketplaceCoverStyle } from "@/resources/marketplace-cover-framing";
import { ShoppingCart } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { BadgeDelta } from "./badge-delta";
import styles from "./glass-card.module.scss";
import { SkeletonImage } from "./skeleton-image";
import { useCartCountdown } from "./use-cart-countdown";

export interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  assetId: string;
  title: string;
  openHref: string;
  price: string;
  exactPrice?: string;
  change?: string;
  volume?: string;
  exactVolume?: string;
  ownedShares?: string;
  /** Off-screen hosts pass their slide activation so no media is queued early. */
  active?: boolean;
}

type PreviewLoad = { start: () => void; started: boolean; released: boolean };
const previewLoads: PreviewLoad[] = [];
let activePreviewLoads = 0;

function drainPreviewLoads() {
  while (activePreviewLoads < 2 && previewLoads.length) {
    const next = previewLoads.shift();
    if (!next || next.released) continue;
    next.started = true;
    activePreviewLoads += 1;
    next.start();
  }
}

function enqueuePreview(start: () => void) {
  const entry: PreviewLoad = { start, started: false, released: false };
  previewLoads.push(entry);
  drainPreviewLoads();
  return () => {
    if (entry.released) return;
    entry.released = true;
    if (entry.started) activePreviewLoads -= 1;
    else {
      const index = previewLoads.indexOf(entry);
      if (index !== -1) previewLoads.splice(index, 1);
    }
    drainPreviewLoads();
  };
}

const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  (
    {
      className = "",
      assetId,
      title,
      openHref,
      price,
      exactPrice,
      change,
      volume: _volume,
      exactVolume: _exactVolume,
      ownedShares: _ownedShares,
      active = true,
      ...props
    },
    ref,
  ) => {
    const router = useRouter();
    const cardRef = React.useRef<HTMLDivElement>(null);
    const frameRef = React.useRef<HTMLIFrameElement>(null);
    const releaseLoad = React.useRef<(() => void) | null>(null);
    const loadingPhase = useDCLoadingPhase();
    const loadingAllowed = active && loadingPhase !== "brand";
    const [visible, setVisible] = React.useState(false);
    const [canAnimate, setCanAnimate] = React.useState(false);
    const [mounted, setMounted] = React.useState(false);
    const [ready, setReady] = React.useState(false);
    const [previewRequested, setPreviewRequested] = React.useState(false);
    const countdown = useCartCountdown();

    React.useEffect(() => {
      const card = cardRef.current;
      if (!card) return;
      const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
      const stopPreview = () => setPreviewRequested(false);
      const sync = () => {
        const allowed = !document.hidden && !motion.matches;
        setCanAnimate(allowed);
        if (!allowed) stopPreview();
      };
      sync();
      document.addEventListener("visibilitychange", sync);
      motion.addEventListener("change", sync);
      window.addEventListener("blur", stopPreview);
      const observer = new IntersectionObserver(([entry]) => {
        setVisible(entry.isIntersecting);
        if (!entry.isIntersecting) stopPreview();
      });
      observer.observe(card);
      return () => {
        observer.disconnect();
        document.removeEventListener("visibilitychange", sync);
        motion.removeEventListener("change", sync);
        window.removeEventListener("blur", stopPreview);
      };
    }, []);

    React.useEffect(() => {
      if (!visible || !loadingAllowed) return;
      let timeout: ReturnType<typeof setTimeout> | undefined;
      const release = enqueuePreview(() => {
        setMounted(true);
        timeout = setTimeout(() => {
          releaseLoad.current?.();
          setMounted(false);
          setReady(false);
          setPreviewRequested(false);
        }, 45_000);
      });
      releaseLoad.current = () => {
        clearTimeout(timeout);
        release();
      };
      return () => {
        clearTimeout(timeout);
        release();
        releaseLoad.current = null;
        setMounted(false);
        setReady(false);
      };
    }, [visible, loadingAllowed]);

    React.useEffect(() => {
      if (!mounted || !ready) return;
      frameRef.current?.contentWindow?.postMessage(
        {
          type: "model-motion",
          paused: !previewRequested || !visible || !canAnimate || !loadingAllowed,
        },
        window.location.origin,
      );
    }, [previewRequested, mounted, ready, visible, canAnimate, loadingAllowed]);

    React.useEffect(() => {
      function receive(event: MessageEvent) {
        if (
          event.origin !== window.location.origin ||
          event.source !== frameRef.current?.contentWindow
        )
          return;
        if (event.data?.type === "model-ready") {
          setReady(true);
          releaseLoad.current?.();
        }
        if (event.data?.type === "model-error") {
          setReady(false);
          setMounted(false);
          setPreviewRequested(false);
          releaseLoad.current?.();
        }
      }
      window.addEventListener("message", receive);
      return () => window.removeEventListener("message", receive);
    }, []);

    return (
      <div
        ref={(node) => {
          cardRef.current = node;
          if (typeof ref === "function") ref(node);
          else if (ref) ref.current = node;
        }}
        className={`${styles.card} ${className}`}
        {...props}
      >
        <div className={styles.stage}>
          <div className={styles.surface}>
            <div className={styles.frame} aria-hidden="true" />
            <Link
              href={openHref}
              prefetch={false}
              aria-label={`Open ${title}`}
              title={title}
              className={`${styles.title} ${title.length > 18 ? styles.longTitle : ""}`}
            >
              {title}
            </Link>
            <div className={styles.media}>
              <button
                type="button"
                aria-label={`${previewRequested ? "Stop" : "Animate"} ${title} preview`}
                aria-pressed={previewRequested}
                onPointerDown={(event) => {
                  if (event.button !== 0 || !event.isPrimary) return;
                  event.currentTarget.setPointerCapture(event.pointerId);
                  setPreviewRequested(true);
                }}
                onPointerUp={() => setPreviewRequested(false)}
                onPointerCancel={() => setPreviewRequested(false)}
                onLostPointerCapture={() => setPreviewRequested(false)}
                onBlur={() => setPreviewRequested(false)}
                onContextMenu={(event) => event.preventDefault()}
                onClick={(event) => {
                  // Keyboard and assistive activation retain a toggle; pointer preview lasts only while held.
                  if (event.detail === 0) setPreviewRequested((previous) => !previous);
                }}
                className={styles.poster}
              >
                <SkeletonImage
                  src={`/marketplace/${assetId}/cover.webp`}
                  loading="lazy"
                  enabled={active}
                  alt={title}
                  width={556}
                  height={384}
                  className={styles.image}
                  shape="rounded"
                  style={{
                    ...getMarketplaceCoverStyle(assetId),
                    opacity: mounted && ready ? 0 : 1,
                  }}
                />
              </button>
              {mounted && (
                <iframe
                  key={assetId}
                  ref={frameRef}
                  title={`${title} — rotating 3D preview`}
                  src={`/marketplace/viewer/index.html?asset=${assetId}&quality=thumbnail&paused=1`}
                  className={styles.viewer}
                  style={{ opacity: ready ? 1 : 0 }}
                  tabIndex={-1}
                  aria-hidden="true"
                />
              )}
            </div>
            <div className={styles.footer}>
              <div className={styles.buyColumn}>
                <button
                  className={styles.buyAction}
                  type="button"
                  onClick={() => router.push(openHref)}
                  aria-label={`Buy ${title} — open item page${countdown ? `, ${countdown.label} left` : ""}`}
                >
                  <ShoppingCart className={styles.buyIcon} size={14} aria-hidden="true" />
                </button>
                {countdown && (
                  <span className={styles.buyTimer} aria-hidden="true">
                    {countdown.compact}
                  </span>
                )}
              </div>
              <div className={styles.quote}>
                {change && (
                  <BadgeDelta
                    className={styles.metricBadge}
                    showIcon={false}
                    deltaType="neutral"
                    variant="solid"
                    value={change}
                    aria-label={`Price change: ${change}`}
                  />
                )}
                <span
                  className={styles.priceValue}
                  title={currencyDisplayText(exactPrice ?? price)}
                  aria-label={`Price: ${currencyDisplayText(exactPrice ?? price)}`}
                >
                  <DCCurrencyText value={price} />
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  },
);

GlassCard.displayName = "GlassCard";

export default GlassCard;
