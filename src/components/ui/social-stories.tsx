"use client";

import { ArrowUpRight, Pause, Play, Volume2, VolumeX, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { SkeletonImage } from "./skeleton-image";
import { RoundedSkeleton } from "./skeleton-shapes";
import styles from "./social-stories.module.scss";

export interface Story {
  id: string;
  mediaUrl: string;
  mediaType?: "video" | "image";
  mediaFit?: "cover" | "contain";
  alt?: string;
  platform: string;
  linkUrl?: string;
  caption?: string;
}

export function SocialStories({
  stories,
  profile,
  onClose,
}: {
  stories: Story[];
  profile: { name: string; avatarUrl: string };
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [holding, setHolding] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [muted, setMuted] = useState(true);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);
  const [progress, setProgress] = useState(0);
  const [retry, setRetry] = useState(0);
  const pressedAt = useRef(0);
  const imageElapsed = useRef(0);
  const story = stories[index];
  const isImage = story?.mediaType === "image";
  const stopped = paused || holding || hidden;

  useEffect(() => {
    const element = dialog.current;
    const previous = document.activeElement;
    const overflow = document.body.style.overflow;
    element?.showModal();
    document.body.style.overflow = "hidden";
    const visibility = () => setHidden(document.hidden);
    visibility();
    document.addEventListener("visibilitychange", visibility);
    return () => {
      element?.close();
      document.body.style.overflow = overflow;
      document.removeEventListener("visibilitychange", visibility);
      if (previous instanceof HTMLElement && previous.isConnected) previous.focus();
    };
  }, []);

  const navigate = useCallback(
    (direction: number) => {
      const next = index + direction;
      if (next < 0) return;
      if (next >= stories.length) {
        onClose();
        return;
      }
      setIndex(next);
      setReady(false);
      setError(false);
      setProgress(0);
      setHolding(false);
      imageElapsed.current = 0;
    },
    [index, stories.length, onClose],
  );

  useEffect(() => {
    const element = video.current;
    if (!element || !ready) return;
    if (stopped) element.pause();
    else
      element.play().catch(() => {
        if (video.current === element && element.isConnected) setPaused(true);
      });
  }, [stopped, ready]);

  useEffect(() => {
    if (!isImage || !ready || stopped) return;
    let frame = 0;
    let previous = performance.now();
    const tick = (now: number) => {
      imageElapsed.current += now - previous;
      previous = now;
      const value = Math.min(imageElapsed.current / 5_000, 1);
      setProgress(value);
      if (value === 1) navigate(1);
      else frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [isImage, ready, stopped, navigate]);

  if (!story) return null;

  return (
    <dialog
      ref={dialog}
      className={styles.dialog}
      aria-label={`${profile.name} stories`}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      onKeyDown={(event) => {
        if (event.key === "ArrowRight") {
          event.preventDefault();
          navigate(1);
        }
        if (event.key === "ArrowLeft") {
          event.preventDefault();
          navigate(-1);
        }
      }}
    >
      <div className={styles.card}>
        {isImage ? (
          <img
            key={`${story.id}-${retry}`}
            src={story.mediaUrl}
            alt={story.alt ?? story.caption ?? profile.name}
            className={styles.media}
            style={story.mediaFit ? { objectFit: story.mediaFit } : undefined}
            onLoad={() => setReady(true)}
            onError={() => {
              setError(true);
              setReady(false);
            }}
          />
        ) : (
          <video
            key={story.id}
            ref={video}
            src={story.mediaUrl}
            playsInline
            muted={muted}
            preload="auto"
            className={styles.media}
            onLoadedData={() => setReady(true)}
            onError={() => {
              setError(true);
              setReady(false);
            }}
            onTimeUpdate={(event) => {
              const media = event.currentTarget;
              if (Number.isFinite(media.duration) && media.duration > 0)
                setProgress(media.currentTime / media.duration);
            }}
            onEnded={() => navigate(1)}
          />
        )}
        <div className={styles.gradient} />
        <div className={styles.navigation}>
          {[-1, 1].map((direction) => (
            <button
              key={direction}
              type="button"
              aria-label={direction < 0 ? "Previous story" : "Next story"}
              disabled={direction < 0 && index === 0}
              onPointerDown={(event) => {
                pressedAt.current = performance.now();
                event.currentTarget.setPointerCapture(event.pointerId);
                setHolding(true);
              }}
              onPointerUp={() => setHolding(false)}
              onPointerCancel={() => {
                pressedAt.current = 0;
                setHolding(false);
              }}
              onLostPointerCapture={() => setHolding(false)}
              onClick={(event) => {
                if (event.detail === 0 || performance.now() - pressedAt.current < 250)
                  navigate(direction);
              }}
            />
          ))}
        </div>
        {!ready && !error && (
          <output
            className={styles.loading}
            aria-label={isImage ? "Loading photo" : "Loading video"}
          >
            <RoundedSkeleton
              as="span"
              style={{ width: "100%", height: "100%", borderRadius: "inherit" }}
            />
          </output>
        )}
        {error && (
          <div className={styles.error} role="alert">
            <p>{isImage ? "Photo couldn’t load." : "Video couldn’t load."}</p>
            <button
              type="button"
              onClick={() => {
                setError(false);
                setReady(false);
                setProgress(0);
                imageElapsed.current = 0;
                if (isImage) setRetry((value) => value + 1);
                else video.current?.load();
              }}
            >
              Try again
            </button>
            <button type="button" onClick={() => navigate(1)}>
              Next story
            </button>
          </div>
        )}
        <div className={styles.progress} aria-label={`Story ${index + 1} of ${stories.length}`}>
          {stories.map((item, position) => (
            <div key={item.id}>
              <span
                style={{
                  transform: `scaleX(${position < index ? 1 : position === index ? progress : 0})`,
                }}
              />
            </div>
          ))}
        </div>
        <header className={styles.header}>
          <SkeletonImage src={profile.avatarUrl} alt="" width={36} height={36} shape="circle" />
          <div className={styles.profile}>
            <strong>{profile.name}</strong>
            <small>{story.platform}</small>
          </div>
          <button
            type="button"
            aria-label={paused ? "Play story" : "Pause story"}
            onClick={() => setPaused(!paused)}
          >
            {paused ? <Play /> : <Pause />}
          </button>
          <button
            type="button"
            aria-label={isImage ? "This story has no audio" : muted ? "Unmute story" : "Mute story"}
            disabled={isImage}
            onClick={() => setMuted(!muted)}
          >
            {muted ? <VolumeX /> : <Volume2 />}
          </button>
          <button type="button" aria-label="Close stories" onClick={onClose}>
            <X />
          </button>
        </header>
        <footer className={styles.footer}>
          <p>{story.caption}</p>
          {story.linkUrl && (
            <a
              href={story.linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Open story link"
            >
              <ArrowUpRight />
            </a>
          )}
        </footer>
      </div>
    </dialog>
  );
}
