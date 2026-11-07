"use client";

import { useReducedMotion } from "framer-motion";
import {
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { DCMediaCard } from "../cards/DCMediaCard";
import { RoundedSkeleton } from "../feedback/DCSkeleton";
import { SkeletonImage } from "../feedback/DCSkeletonImage";
import styles from "./media-carousel.module.scss";

export interface MediaCarouselSlide {
  id: string;
  mediaUrl: string;
  mediaType?: "video" | "image";
  mediaFit?: "cover" | "contain";
  alt?: string;
  linkUrl?: string;
}

export function DCMediaCarousel({
  slides,
  title,
  description,
  onClose,
}: {
  slides: MediaCarouselSlide[];
  title: string;
  description: string;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const cardRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const gesture = useRef<{ id: number; x: number; y: number } | null>(null);
  const [index, setIndex] = useState(0);
  const [retry, setRetry] = useState(0);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [failedKey, setFailedKey] = useState<string | null>(null);
  const [playback, setPlayback] = useState<"auto" | "playing" | "paused">("auto");
  const [muted, setMuted] = useState(true);
  const [hidden, setHidden] = useState(false);
  const reduced = useReducedMotion();
  const slide = slides[index];
  const mediaKey = `${slide?.id}-${retry}`;
  const isImage = slide?.mediaType === "image";
  const ready = loadedKey === mediaKey;
  const error = failedKey === mediaKey;
  const playing = playback === "playing" || (playback === "auto" && reduced === false);

  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const previousFocus = document.activeElement;
    const overflow = document.body.style.overflow;
    dialog.showModal();
    closeRef.current?.focus();
    document.body.style.overflow = "hidden";
    const card = cardRef.current;
    const caption = card?.querySelector("figcaption");
    let frame = 0;
    const sizeMedia = () => {
      if (!card || !caption) return;
      const padding = getComputedStyle(dialog);
      const available =
        (dialog.clientHeight -
          Number.parseFloat(padding.paddingTop) -
          Number.parseFloat(padding.paddingBottom)) *
        0.8;
      // Give the caption its actual space before fitting the media into the remaining viewport.
      const height = Math.floor(
        Math.min(
          card.clientWidth * 1.25,
          Math.max(112, available - caption.getBoundingClientRect().height),
        ),
      );
      card.style.setProperty("--carousel-media-height", `${height}px`);
    };
    const scheduleSize = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(sizeMedia);
    };
    sizeMedia();
    const observer = new ResizeObserver(scheduleSize);
    observer.observe(dialog);
    if (card) observer.observe(card);
    if (caption) observer.observe(caption);
    const visibility = () => setHidden(document.hidden);
    visibility();
    document.addEventListener("visibilitychange", visibility);
    return () => {
      dialog.close();
      document.body.style.overflow = overflow;
      observer.disconnect();
      cancelAnimationFrame(frame);
      document.removeEventListener("visibilitychange", visibility);
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus();
    };
  }, []);

  const goTo = useCallback(
    (next: number) => {
      if (next < 0 || next >= slides.length || next === index) return;
      videoRef.current?.pause();
      setIndex(next);
      setRetry(0);
      setLoadedKey(null);
      setFailedKey(null);
      setPlayback("auto");
    },
    [index, slides.length],
  );

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !ready || isImage || error) return;
    let cancelled = false;
    if (hidden || !playing) video.pause();
    else {
      video.play().catch(() => {
        if (!cancelled && videoRef.current === video && video.isConnected) setPlayback("paused");
      });
    }
    return () => {
      cancelled = true;
      video.pause();
    };
  }, [ready, isImage, error, hidden, playing]);

  if (!slide) return null;

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      aria-label={`${title} media gallery`}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      onKeyDown={(event) => {
        if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
          event.preventDefault();
          goTo(index + (event.key === "ArrowRight" ? 1 : -1));
        }
      }}
    >
      <DCMediaCard
        ref={cardRef}
        className={styles.card}
        mediaClassName={styles.mediaStage}
        captionClassName={styles.caption}
        title={title}
        description={description}
        whileHover={undefined}
        initial={reduced ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduced ? 0 : 0.22, ease: [0.2, 0.8, 0.2, 1] }}
        media={
          <section
            className={styles.viewport}
            aria-label="Item media"
            aria-roledescription="carousel"
            aria-busy={!ready && !error}
            onPointerDown={(event) => {
              if (event.button !== 0 || (event.target as HTMLElement).closest("button,a")) return;
              gesture.current = { id: event.pointerId, x: event.clientX, y: event.clientY };
              event.currentTarget.setPointerCapture(event.pointerId);
            }}
            onPointerUp={(event) => {
              const start = gesture.current;
              gesture.current = null;
              if (!start || start.id !== event.pointerId) return;
              const dx = event.clientX - start.x;
              const dy = event.clientY - start.y;
              if (Math.abs(dx) >= 40 && Math.abs(dx) > Math.abs(dy) * 1.2)
                goTo(index + (dx < 0 ? 1 : -1));
            }}
            onPointerCancel={() => {
              gesture.current = null;
            }}
            onLostPointerCapture={() => {
              gesture.current = null;
            }}
          >
            <section
              className={styles.slide}
              aria-roledescription="slide"
              aria-label={`${index + 1} of ${slides.length}`}
            >
              {isImage ? (
                <SkeletonImage
                  key={mediaKey}
                  src={slide.mediaUrl}
                  alt={slide.alt ?? title}
                  draggable={false}
                  shape="rounded"
                  className={styles.media}
                  style={{ objectFit: slide.mediaFit ?? "contain" }}
                  onLoad={() => setLoadedKey(mediaKey)}
                  onError={() => setFailedKey(mediaKey)}
                />
              ) : (
                <video
                  key={mediaKey}
                  ref={videoRef}
                  src={slide.mediaUrl}
                  playsInline
                  loop
                  muted={muted}
                  preload="auto"
                  aria-label={slide.alt ?? title}
                  className={styles.media}
                  style={{ opacity: ready ? 1 : 0, objectFit: slide.mediaFit ?? "contain" }}
                  onLoadedData={() => setLoadedKey(mediaKey)}
                  onError={() => setFailedKey(mediaKey)}
                />
              )}
              {!isImage && !ready && !error && (
                <output className={styles.loading} aria-label="Loading video">
                  <RoundedSkeleton
                    as="span"
                    style={{ width: "100%", height: "100%", borderRadius: 0 }}
                  />
                </output>
              )}
              {error && (
                <div className={styles.error} role="alert">
                  <p>{isImage ? "Photo couldn’t load." : "Video couldn’t load."}</p>
                  <button type="button" onClick={() => setRetry((value) => value + 1)}>
                    Try again
                  </button>
                </div>
              )}
            </section>
            {slides.length > 1 && (
              <>
                <button
                  type="button"
                  className={`${styles.arrow} ${styles.previous}`}
                  aria-label="Previous slide"
                  disabled={index === 0}
                  onClick={() => goTo(index - 1)}
                >
                  <ChevronLeft aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className={`${styles.arrow} ${styles.next}`}
                  aria-label="Next slide"
                  disabled={index === slides.length - 1}
                  onClick={() => goTo(index + 1)}
                >
                  <ChevronRight aria-hidden="true" />
                </button>
              </>
            )}
            <div className={styles.controls}>
              {!isImage && (
                <>
                  <button
                    type="button"
                    className={styles.control}
                    aria-label={playing ? "Pause video" : "Play video"}
                    onClick={() => setPlayback(playing ? "paused" : "playing")}
                  >
                    {playing ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}
                  </button>
                  <button
                    type="button"
                    className={styles.control}
                    aria-label={muted ? "Unmute video" : "Mute video"}
                    onClick={() => setMuted((value) => !value)}
                  >
                    {muted ? <VolumeX aria-hidden="true" /> : <Volume2 aria-hidden="true" />}
                  </button>
                </>
              )}
              <button
                type="button"
                className={styles.control}
                aria-label="Close gallery"
                onClick={onClose}
                ref={closeRef}
              >
                <X aria-hidden="true" />
              </button>
            </div>
          </section>
        }
        captionFooter={
          <div className={styles.paginationRow}>
            <nav className={styles.pagination} aria-label="Choose a slide">
              {slides.map((item, position) => (
                <button
                  key={item.id}
                  type="button"
                  aria-label={`Show slide ${position + 1} of ${slides.length}`}
                  aria-current={index === position ? "true" : undefined}
                  onClick={() => goTo(position)}
                >
                  <span />
                </button>
              ))}
            </nav>
            <output className={styles.status}>
              Slide {index + 1} of {slides.length}
            </output>
            {slide.linkUrl && (
              <a
                className={styles.source}
                href={slide.linkUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Open media source"
              >
                <ArrowUpRight aria-hidden="true" />
              </a>
            )}
          </div>
        }
      />
    </dialog>
  );
}
