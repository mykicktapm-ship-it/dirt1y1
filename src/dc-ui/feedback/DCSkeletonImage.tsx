"use client";

import { motion, useReducedMotion } from "framer-motion";
import { type ImgHTMLAttributes, useEffect, useRef, useState } from "react";

import { marketplaceSkeletonMasks } from "@/resources/marketplace-skeletons";
import { useDCLoadingPhase } from "./DCLoadingContext";
import { skeletonBackground, skeletonPulse } from "./DCSkeleton";
import { isSlowImageConnection, queueImageLoad } from "./image-load-queue";

export type SkeletonImageProps = Omit<
  ImgHTMLAttributes<HTMLImageElement>,
  "onAnimationStart" | "onDrag" | "onDragStart" | "onDragEnd"
> & { shape?: "circle" | "rounded" | "square"; minimumDuration?: number; enabled?: boolean };

const readySources = new Set<string>();
const svgUrl = (svg: string) => `data:image/svg+xml,${encodeURIComponent(svg)}`;
const genericMasks = {
  circle: svgUrl(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="white"/></svg>',
  ),
  rounded: svgUrl(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="8" fill="white"/></svg>',
  ),
  square: svgUrl(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="white"/></svg>',
  ),
};

export function SkeletonImage({
  src,
  srcSet,
  shape = "square",
  minimumDuration = 1000,
  enabled = true,
  style,
  onLoad,
  onError,
  ...props
}: SkeletonImageProps) {
  const loadingPhase = useDCLoadingPhase();
  const canLoad = enabled && loadingPhase !== "brand";
  const loading = props.loading ?? "lazy";
  const imageRef = useRef<HTMLImageElement>(null);
  const source = `${src ?? ""}|${srcSet ?? ""}`;
  const [settledSource, setSettledSource] = useState<string | null>(() =>
    readySources.has(source) ? source : null,
  );
  const reduced = useReducedMotion();
  const pending = (typeof src === "string" || Boolean(srcSet)) && settledSource !== source;
  const opacity = style?.opacity === undefined ? 1 : Number(style.opacity);

  const itemMatch =
    typeof src === "string" ? src.match(/^\/marketplace\/([a-z0-9-]+)\/cover\.webp$/) : null;
  const mask = itemMatch
    ? (marketplaceSkeletonMasks[itemMatch[1]] ?? genericMasks[shape])
    : genericMasks[shape];
  const blank = svgUrl(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${Number(props.width) || 556}" height="${Number(props.height) || 384}"/>`,
  );

  useEffect(() => {
    if (!canLoad || (typeof src !== "string" && !srcSet)) return;
    if (readySources.has(source)) {
      setSettledSource(source);
      return;
    }
    let alive = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let cancelPreload: (() => void) | undefined;
    let started = false;
    const start = () => {
      if (started) return;
      started = true;
      let startTime = 0;
      let finished = false;
      const finish = (success: boolean) => {
        if (!alive || finished) return;
        finished = true;
        clearTimeout(timer);
        timer = setTimeout(
          () => {
            if (!alive) return;
            if (success) readySources.add(source);
            setSettledSource(source);
          },
          success ? Math.max(0, minimumDuration - (performance.now() - startTime)) : 0,
        );
      };
      cancelPreload = queueImageLoad(
        (release) => {
          const preload = new Image();
          startTime = performance.now();
          preload.onload = () => {
            release();
            finish(true);
          };
          preload.onerror = () => {
            release();
            finish(false);
          };
          if (props.crossOrigin) preload.crossOrigin = props.crossOrigin;
          if (props.referrerPolicy) preload.referrerPolicy = props.referrerPolicy;
          if (props.sizes) preload.sizes = props.sizes;
          if (srcSet) preload.srcset = srcSet;
          if (typeof src === "string") preload.src = src;
          if (preload.complete && preload.naturalWidth > 0) {
            release();
            finish(true);
          }
          return () => {
            preload.onload = null;
            preload.onerror = null;
            preload.removeAttribute("srcset");
            preload.removeAttribute("src");
          };
        },
        () => finish(false),
      );
    };
    let observer: IntersectionObserver | undefined;
    if (loading === "lazy" && imageRef.current && typeof IntersectionObserver !== "undefined") {
      observer = new IntersectionObserver(
        ([entry]) => {
          if (!entry.isIntersecting) return;
          observer?.disconnect();
          start();
        },
        { rootMargin: isSlowImageConnection() ? "40px" : "100px" },
      );
      observer.observe(imageRef.current);
    } else start();
    return () => {
      alive = false;
      clearTimeout(timer);
      observer?.disconnect();
      cancelPreload?.();
    };
  }, [
    source,
    canLoad,
    src,
    srcSet,
    minimumDuration,
    props.crossOrigin,
    props.referrerPolicy,
    props.sizes,
    loading,
  ]);

  return (
    <motion.img
      {...props}
      loading={loading}
      ref={imageRef}
      src={pending ? blank : src}
      srcSet={pending ? undefined : srcSet}
      aria-busy={pending || undefined}
      aria-hidden={pending ? true : props["aria-hidden"]}
      data-slot={pending ? "styled-skeleton" : undefined}
      data-site-loading={enabled && pending ? "true" : undefined}
      style={{
        ...style,
        background: pending ? skeletonBackground : style?.background,
        maskImage: pending ? `url("${mask}")` : style?.maskImage,
        WebkitMaskImage: pending ? `url("${mask}")` : style?.WebkitMaskImage,
        maskSize: pending ? (itemMatch ? "contain" : "100% 100%") : style?.maskSize,
        WebkitMaskSize: pending ? (itemMatch ? "contain" : "100% 100%") : style?.WebkitMaskSize,
        maskPosition: pending ? "center" : style?.maskPosition,
        WebkitMaskPosition: pending ? "center" : style?.WebkitMaskPosition,
        maskRepeat: pending ? "no-repeat" : style?.maskRepeat,
        WebkitMaskRepeat: pending ? "no-repeat" : style?.WebkitMaskRepeat,
      }}
      animate={{ opacity: pending && !reduced ? [opacity * 0.5, opacity, opacity * 0.5] : opacity }}
      transition={
        pending && !reduced ? skeletonPulse : { duration: reduced ? 0 : 0.22, ease: "easeOut" }
      }
      onLoad={(event) => {
        if (!pending) onLoad?.(event);
      }}
      onError={(event) => {
        if (!pending) onError?.(event);
      }}
    />
  );
}
