"use client";

import { Pause, Pin, Play } from "lucide-react";
import Link from "next/link";
import React from "react";

import {
  decimalSign,
  formatLeaderboardUsd,
  shortWallet,
} from "@/components/leaderboard-presentation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { BadgeDelta } from "@/components/ui/badge-delta";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import FallbackCard, { LetterGlitch } from "@/components/ui/fallback-card";
import { CircleSkeleton, PillSkeleton } from "@/components/ui/skeleton-shapes";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DCCurrencyMark,
  DCCurrencyText,
  currencyDisplayText,
} from "@/dc-ui/typography/DCCurrencyMark";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import { type Notification, notificationItems as notifications } from "@/resources/notifications";

export type CommunityFeedPost = {
  avatar: string;
  description: string;
  isPromo: boolean;
  publishedAt: string;
  slug: string;
  title: string;
  videoSrc?: string;
};

export type CommunityVideoNote = {
  avatar: string;
  publishedAt?: string;
  title: string;
  videoSrc?: string;
};

function NotificationItem({ notification }: { notification: Notification }) {
  return (
    <div className="w-full py-4 first:pt-0 last:pb-0">
      <div className="flex gap-3">
        <Avatar className="size-11">
          <AvatarImage
            alt={`${notification.user.name}'s profile picture`}
            className="object-cover ring-1 ring-border"
            src={notification.user.avatar || "/placeholder.svg"}
          />
          <AvatarFallback>{notification.user.fallback}</AvatarFallback>
        </Avatar>

        <div className="flex flex-1 flex-col space-y-2">
          <div className="w-full items-start">
            <div>
              <div className="flex items-center justify-between gap-2">
                <div className="text-sm">
                  <span className="font-medium">{notification.user.name}</span>
                  <span className="text-muted-foreground"> {notification.action} </span>
                  {notification.target && (
                    <span className="font-medium">{notification.target}</span>
                  )}
                </div>
                {!notification.isRead && <div className="size-1.5 rounded-full bg-emerald-500" />}
              </div>
              <div className="flex items-center justify-between gap-2">
                <div className="mt-0.5 text-xs text-muted-foreground">{notification.timestamp}</div>
                <div className="text-xs text-muted-foreground">{notification.timeAgo}</div>
              </div>
            </div>
          </div>

          {notification.content && (
            <div className="rounded-lg bg-muted p-2.5 text-sm tracking-[-0.006em]">
              {notification.content}
            </div>
          )}

          {notification.file && (
            <div className="flex items-center gap-2 rounded-lg bg-muted p-2">
              <svg
                aria-hidden="true"
                className="relative shrink-0"
                fill="none"
                height="34"
                viewBox="0 0 40 40"
                width="34"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  className="fill-white stroke-border dark:fill-card/70"
                  d="M30 39.25H10C7.10051 39.25 4.75 36.8995 4.75 34V6C4.75 3.10051 7.10051 0.75 10 0.75H20.5147C21.9071 0.75 23.2425 1.30312 24.227 2.28769L33.7123 11.773C34.6969 12.7575 35.25 14.0929 35.25 15.4853V34C35.25 36.8995 32.8995 39.25 30 39.25Z"
                  strokeWidth="1.5"
                />
                <path
                  className="stroke-border dark:fill-muted-foreground"
                  d="M23 1V9C23 11.2091 24.7909 13 27 13H35"
                  strokeWidth="1.5"
                />
                <foreignObject height="40" width="40" x="0" y="0">
                  <div className="absolute bottom-1.5 left-0 flex h-4 items-center rounded bg-primary px-[3px] py-0.5 text-[11px] leading-none font-semibold text-white dark:bg-muted">
                    {notification.file.type}
                  </div>
                </foreignObject>
              </svg>
              <div className="flex-1">
                <div className="text-sm font-medium">{notification.file.name}</div>
                <div className="text-xs text-muted-foreground">
                  {notification.file.type} • {notification.file.size}
                </div>
              </div>
              <Button aria-label="Download file" className="size-8" size="icon" variant="ghost">
                <svg
                  aria-hidden="true"
                  height="1em"
                  viewBox="0 0 24 24"
                  width="1em"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12.554 16.506a.75.75 0 0 1-1.107 0l-4-4.375a.75.75 0 0 1 1.107-1.012l2.696 2.95V3a.75.75 0 0 1 1.5 0v11.068l2.697-2.95a.75.75 0 1 1 1.107 1.013z"
                    fill="currentColor"
                  />
                  <path
                    d="M3.75 15a.75.75 0 0 0-1.5 0v.055c0 1.367 0 2.47.117 3.337c.12.9.38 1.658.981 2.26c.602.602 1.36.86 2.26.982c.867.116 1.97.116 3.337.116h6.11c1.367 0 2.47 0 3.337-.116c.9-.122 1.658-.38 2.26-.982s.86-1.36.982-2.26c.116-.867.116-1.97.116-3.337V15a.75.75 0 0 0-1.5 0c0 1.435-.002 2.436-.103 3.192c-.099.734-.28 1.122-.556 1.399c-.277.277-.665.457-1.4.556c-.755.101-1.756.103-3.191.103H9c-1.435 0-2.437-.002-3.192-.103c-.734-.099-1.122-.28-1.399-.556c-.277-.277-.457-.665-.556-1.4c-.101-.755-.103-1.756-.103-3.191"
                    fill="currentColor"
                  />
                </svg>
              </Button>
            </div>
          )}

          {notification.hasActions && (
            <div className="flex gap-2">
              <Button className="h-7 text-xs" size="sm" variant="outline">
                Details
              </Button>
              <Button className="h-7 text-xs" size="sm">
                Accept
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const postDate = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  month: "long",
  timeZone: "UTC",
  year: "numeric",
});

function PostNotificationItem({
  post,
  profitDisclosure,
  profitPending,
  profitValue,
  titleContent,
}: {
  post: CommunityFeedPost;
  profitDisclosure?: string;
  profitPending?: boolean;
  profitValue?: string;
  titleContent?: React.ReactNode;
}) {
  return (
    <div className="w-full py-4 first:pt-0 last:pb-0">
      <div className="flex gap-3">
        <Avatar className="size-11">
          <AvatarImage
            alt="$Dirtycoin's profile picture"
            className="object-cover ring-1 ring-border"
            src={post.avatar}
          />
          <AvatarFallback>
            $<DCCurrencyMark />
          </AvatarFallback>
        </Avatar>

        <div className="flex min-w-0 flex-1 flex-col space-y-2">
          <div className="w-full items-start">
            <div>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 text-sm">
                  <span className="font-medium">$Dirtycoin</span>
                  <span className="text-muted-foreground"> published </span>
                  <span className="font-medium">
                    {titleContent ?? <DCCurrencyText value={post.title} />}
                  </span>
                  {profitValue ? (
                    <>
                      {" "}
                      <BadgeDelta
                        aria-label={profitDisclosure}
                        className="align-middle"
                        deltaType="increase"
                        showIcon={false}
                        title={profitDisclosure}
                        value={profitValue}
                        variant="solid"
                      />
                    </>
                  ) : profitPending ? (
                    <output aria-busy="true" aria-label="Retrieving top wallet PNL">
                      {" "}
                      <PillSkeleton
                        as="span"
                        style={{ height: 22, verticalAlign: "middle", width: 88 }}
                      />
                    </output>
                  ) : null}
                </div>
                <div className="flex shrink-0 items-center">
                  <Pin aria-label="Pinned publication" className="size-3.5" />
                </div>
              </div>
              <div className="flex items-center justify-between gap-2">
                <div className="mt-0.5 text-xs text-muted-foreground">
                  {postDate.format(new Date(post.publishedAt))}
                </div>
                <div className="text-xs text-muted-foreground">Pinned</div>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg bg-muted">
            <FallbackCard
              className="rounded-none"
              framed={false}
              showFooter={false}
              showGlitch
              videoSrc={post.videoSrc}
            />
            <div className="p-2.5 text-sm tracking-[-0.006em]">
              <DCCurrencyText value={post.description.replace(/[.!?…]+$/u, "")} />…{" "}
              <Link
                className="font-semibold text-foreground no-underline"
                href={`/community/${post.slug}`}
              >
                Read full
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** The round video note: lazy source, plays only while visible, pause/play on click. */
export function VideoNoteCircle({
  note,
  sizeClassName = "size-[min(15rem,70vw)]",
}: {
  note: CommunityVideoNote;
  sizeClassName?: string;
}) {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const visibleRef = React.useRef(false);
  const playbackPreference = React.useRef<"auto" | "play" | "pause">("auto");
  const staticFrameRequested = React.useRef(false);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [requestedSource, setRequestedSource] = React.useState<string | null>(null);
  const [settledSource, setSettledSource] = React.useState<string | null>(null);
  const [failed, setFailed] = React.useState(false);
  const source = note.videoSrc;
  const pending = Boolean(source) && settledSource !== source;

  React.useLayoutEffect(() => {
    const video = videoRef.current;
    playbackPreference.current = "auto";
    staticFrameRequested.current = false;
    setRequestedSource(null);
    setSettledSource(null);
    setFailed(false);
    setIsPlaying(false);
    if (!source || !video) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setRequestedSource(source);
        observer.disconnect();
      },
      { rootMargin: "100px" },
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, [source]);

  React.useEffect(() => {
    const video = videoRef.current;
    if (!source || !video) return;
    if (requestedSource === source && video.readyState >= 2) setSettledSource(source);
    const rect = video.getBoundingClientRect();
    visibleRef.current =
      rect.width > 0 &&
      rect.height > 0 &&
      rect.bottom > 0 &&
      rect.right > 0 &&
      rect.top < window.innerHeight &&
      rect.left < window.innerWidth;
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncPlayback = () => {
      const explicitPlay = playbackPreference.current === "play";
      if (
        requestedSource !== source ||
        failed ||
        !visibleRef.current ||
        document.hidden ||
        // Hidden Home scenes stay in the layout (and "intersect"), but are inert.
        video.closest("[inert]") !== null ||
        playbackPreference.current === "pause" ||
        (motionQuery.matches && !explicitPlay)
      ) {
        video.pause();
      } else {
        void video.play().catch(() => setIsPlaying(false));
      }
    };
    const observer = new IntersectionObserver(([entry]) => {
      visibleRef.current = entry.isIntersecting;
      syncPlayback();
    });
    observer.observe(video);
    const inertObserver = new MutationObserver(syncPlayback);
    inertObserver.observe(document.body, { attributeFilter: ["inert"], subtree: true });
    syncPlayback();
    document.addEventListener("visibilitychange", syncPlayback);
    motionQuery.addEventListener("change", syncPlayback);

    return () => {
      observer.disconnect();
      inertObserver.disconnect();
      document.removeEventListener("visibilitychange", syncPlayback);
      motionQuery.removeEventListener("change", syncPlayback);
      video.pause();
    };
  }, [failed, requestedSource, source]);

  const togglePlayback = () => {
    const video = videoRef.current;
    if (!source || !video) return;
    if (video.paused) {
      playbackPreference.current = "play";
      setRequestedSource(source);
      if (failed) {
        setFailed(false);
        setSettledSource(null);
        video.load();
      }
      if (video.getAttribute("src") && visibleRef.current && !document.hidden) {
        void video.play().catch(() => setIsPlaying(false));
      }
    } else {
      playbackPreference.current = "pause";
      video.pause();
    }
  };

  const visual = (
    <>
      {note.videoSrc ? (
        <video
          className="absolute inset-0 size-full object-cover"
          data-site-loading={pending ? "true" : undefined}
          key={source}
          loop
          muted
          onError={() => {
            setFailed(true);
            setSettledSource(source ?? null);
            setIsPlaying(false);
          }}
          onLoadedData={() => setSettledSource(source ?? null)}
          onLoadedMetadata={(event) => {
            const video = event.currentTarget;
            if (
              !staticFrameRequested.current &&
              playbackPreference.current !== "play" &&
              video.paused &&
              video.readyState < 2 &&
              Number.isFinite(video.duration) &&
              video.duration > 0 &&
              window.matchMedia("(prefers-reduced-motion: reduce)").matches
            ) {
              staticFrameRequested.current = true;
              // Request a decoded still frame without reduced-motion autoplay.
              try {
                video.currentTime = Math.min(0.001, video.duration / 2);
              } catch {
                // Native loadeddata/error events still settle media readiness.
              }
            }
          }}
          onPause={() => setIsPlaying(false)}
          onPlay={() => setIsPlaying(true)}
          playsInline
          preload="metadata"
          ref={videoRef}
          src={requestedSource === source ? source : undefined}
          style={{ opacity: pending || failed ? 0 : 1 }}
          tabIndex={-1}
        />
      ) : null}
      {pending ? (
        <CircleSkeleton as="span" className="pointer-events-none absolute inset-0 z-10 size-full" />
      ) : null}
      <span
        className="pointer-events-none absolute inset-0 z-10 opacity-25"
        style={{ opacity: pending ? 0 : undefined }}
      >
        <LetterGlitch characters="₀₁. " />
      </span>
      {note.videoSrc && !pending && !isPlaying ? (
        <span className="absolute inset-0 z-20 flex items-center justify-center bg-black/20">
          <span className="flex size-10 items-center justify-center rounded-full bg-black/65 text-white backdrop-blur-sm">
            <Play aria-hidden="true" className="ml-0.5 size-4 fill-current" />
          </span>
        </span>
      ) : null}
      {note.videoSrc && !pending && isPlaying ? (
        <span className="absolute inset-0 z-20 flex items-center justify-center bg-black/0 opacity-0 transition-opacity group-hover:bg-black/20 group-hover:opacity-100 group-focus-visible:bg-black/20 group-focus-visible:opacity-100 motion-reduce:transition-none">
          <span className="flex size-10 items-center justify-center rounded-full bg-black/65 text-white backdrop-blur-sm">
            <Pause aria-hidden="true" className="size-4 fill-current" />
          </span>
        </span>
      ) : null}
    </>
  );

  return note.videoSrc ? (
    <button
      aria-label={`${isPlaying ? "Pause" : "Play"} video note: ${currencyDisplayText(note.title)}`}
      className={`group relative ${sizeClassName} shrink-0 appearance-none overflow-hidden rounded-full border-0 bg-black p-0 ring-1 ring-white/20 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white`}
      onClick={togglePlayback}
      type="button"
    >
      {visual}
    </button>
  ) : (
    <div
      aria-label={`${currencyDisplayText(note.title)} video note placeholder`}
      className={`relative ${sizeClassName} shrink-0 overflow-hidden rounded-full bg-black ring-1 ring-white/20`}
      role="img"
    >
      {visual}
    </div>
  );
}

function VideoNoteNotificationItem({ note }: { note: CommunityVideoNote }) {
  return (
    <div className="w-full py-4 first:pt-0 last:pb-0">
      <div className="flex gap-3">
        <Avatar className="size-11">
          <AvatarImage
            alt="$Dirtycoin's profile picture"
            className="object-cover ring-1 ring-border"
            src={note.avatar}
          />
          <AvatarFallback>
            $<DCCurrencyMark />
          </AvatarFallback>
        </Avatar>

        <div className="flex min-w-0 flex-1 flex-col items-start space-y-2">
          <div className="w-full">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 text-sm">
                <span className="font-medium">$Dirtycoin</span>
                <span className="text-muted-foreground"> published </span>
                <span className="font-medium">
                  <DCCurrencyText value={note.title} />
                </span>
              </div>
              <Pin aria-label="Pinned publication" className="size-3.5 shrink-0" />
            </div>
            <div className="flex items-center justify-between gap-2">
              {note.publishedAt ? (
                <time className="mt-0.5 text-xs text-muted-foreground" dateTime={note.publishedAt}>
                  {postDate.format(new Date(note.publishedAt))}
                </time>
              ) : (
                <span />
              )}
              <span className="text-xs text-muted-foreground">Pinned</span>
            </div>
          </div>

          <VideoNoteCircle note={note} />
        </div>
      </div>
    </div>
  );
}

export function NotificationsMenu({
  posts,
  videoNote,
}: {
  posts: CommunityFeedPost[];
  videoNote?: CommunityVideoNote;
}) {
  const [activeTab, setActiveTab] = React.useState<string>("all");
  const { snapshot, status } = useLeaderboard();
  const topWallet =
    status === "ready" || status === "delayed" ? (snapshot?.entries[0] ?? null) : null;
  const walletLabel =
    topWallet && decimalSign(topWallet.totalPnlUsd) > 0
      ? (topWallet.displayName ?? shortWallet(topWallet.wallet))
      : null;
  const promoTitle = walletLabel ? (
    <>
      How <span className="text-emerald-400">{walletLabel}</span> hit #1 trading $<DCCurrencyMark />
    </>
  ) : null;
  const profitValue =
    walletLabel && topWallet ? `+${formatLeaderboardUsd(topWallet.totalPnlUsd)}` : undefined;
  const profitDisclosure =
    walletLabel && topWallet && snapshot
      ? `${formatLeaderboardUsd(topWallet.totalPnlUsd)} Birdeye-reported all-time Total PNL · snapshot ${snapshot.generatedAt}`
      : undefined;

  const verifiedCount = notifications.filter(
    (notification) => notification.type === "follow" || notification.type === "like",
  ).length;
  const mentionCount = notifications.filter(
    (notification) => notification.type === "mention",
  ).length;

  const getFilteredNotifications = () => {
    switch (activeTab) {
      case "verified":
        return notifications.filter(
          (notification) => notification.type === "follow" || notification.type === "like",
        );
      case "mentions":
        return notifications.filter((notification) => notification.type === "mention");
      default:
        return notifications;
    }
  };

  const filteredNotifications = getFilteredNotifications();
  const visibleCount = notifications.length + posts.length + (videoNote ? 1 : 0);

  return (
    <Card className="flex w-full max-w-lg flex-col gap-6 border-0 bg-transparent p-0 shadow-none [--primary-foreground:0_0%_3.9%] [--primary:0_0%_98%]">
      <CardHeader className="p-0">
        <div className="flex items-center justify-between">
          <h3 className="text-base leading-none font-semibold tracking-[-0.006em]">
            Your notifications
          </h3>
          <div className="flex items-center gap-2">
            <Button aria-label="Mark all as read" className="size-8" size="icon" variant="ghost">
              <svg
                aria-hidden="true"
                className="size-4.5 text-muted-foreground"
                height="1em"
                viewBox="0 0 24 24"
                width="1em"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  clipRule="evenodd"
                  d="M15.493 6.935a.75.75 0 0 1 .072 1.058l-7.857 9a.75.75 0 0 1-1.13 0l-3.143-3.6a.75.75 0 0 1 1.13-.986l2.578 2.953l7.292-8.353a.75.75 0 0 1 1.058-.072m5.025.085c.3.285.311.76.025 1.06l-8.571 9a.75.75 0 0 1-1.14-.063l-.429-.563a.75.75 0 0 1 1.076-1.032l7.978-8.377a.75.75 0 0 1 1.06-.026"
                  fill="currentColor"
                  fillRule="evenodd"
                />
              </svg>
            </Button>
            <Button
              aria-label="Notification settings"
              className="size-8"
              size="icon"
              variant="ghost"
            >
              <svg
                aria-hidden="true"
                className="size-4.5 text-muted-foreground"
                height="1em"
                viewBox="0 0 24 24"
                width="1em"
                xmlns="http://www.w3.org/2000/svg"
              >
                <g clipRule="evenodd" fill="currentColor" fillRule="evenodd">
                  <path d="M12 8.25a3.75 3.75 0 1 0 0 7.5a3.75 3.75 0 0 0 0-7.5M9.75 12a2.25 2.25 0 1 1 4.5 0a2.25 2.25 0 0 1-4.5 0" />
                  <path d="M11.975 1.25c-.445 0-.816 0-1.12.02a2.8 2.8 0 0 0-.907.19a2.75 2.75 0 0 0-1.489 1.488c-.145.35-.184.72-.2 1.122a.87.87 0 0 1-.415.731a.87.87 0 0 1-.841-.005c-.356-.188-.696-.339-1.072-.389a2.75 2.75 0 0 0-2.033.545a2.8 2.8 0 0 0-.617.691c-.17.254-.356.575-.578.96l-.025.044c-.223.385-.408.706-.542.98c-.14.286-.25.568-.29.88a2.75 2.75 0 0 0 .544 2.033c.231.301.532.52.872.734a.87.87 0 0 1 .426.726a.87.87 0 0 1-.426.726c-.34.214-.64.433-.872.734a2.75 2.75 0 0 0-.545 2.033c.041.312.15.594.29.88c.135.274.32.595.543.98l.025.044c.222.385.408.706.578.96c.177.263.367.5.617.69a2.75 2.75 0 0 0 2.033.546c.376-.05.716-.2 1.072-.389a.87.87 0 0 1 .84-.005a.86.86 0 0 1 .417.731c.015.402.054.772.2 1.122a2.75 2.75 0 0 0 1.488 1.489c.29.12.59.167.907.188c.304.021.675.021 1.12.021h.05c.445 0 .816 0 1.12-.02c.318-.022.617-.069.907-.19a2.75 2.75 0 0 0 1.489-1.488c.145-.35.184-.72.2-1.122a.87.87 0 0 1 .415-.732a.87.87 0 0 1 .841.006c.356.188.696.339 1.072.388a2.75 2.75 0 0 0 2.033-.544c.25-.192.44-.428.617-.691c.17-.254.356-.575.578-.96l.025-.044c.223-.385.408-.706.542-.98c.14-.286.25-.569.29-.88a2.75 2.75 0 0 0-.544-2.033c-.231-.301-.532-.52-.872-.734a.87.87 0 0 1-.426-.726c0-.278.152-.554.426-.726c.34-.214.64-.433.872-.734a2.75 2.75 0 0 0 .545-2.033a2.8 2.8 0 0 0-.29-.88a18 18 0 0 0-.543-.98l-.025-.044a18 18 0 0 0-.578-.96a2.8 2.8 0 0 0-.617-.69a2.75 2.75 0 0 0-2.033-.546c-.376-.05-.716-.2-1.072-.389a.87.87 0 0 1-.84.005a.87.87 0 0 1-.417-.731c-.015-.402-.054-.772-.2-1.122a2.75 2.75 0 0 0-1.488-1.489c-.29-.12-.59-.167-.907-.188c-.304-.021-.675-.021-1.12-.021zm-1.453 1.595c.077-.032.194-.061.435-.078c.247-.017.567-.017 1.043-.017s.796 0 1.043.017c.241.017.358.046.435.078c.307.127.55.37.677.677c.04.096.073.247.086.604c.03.792.439 1.555 1.165 1.974s1.591.392 2.292.022c.316-.167.463-.214.567-.227a1.25 1.25 0 0 1 .924.247c.066.051.15.138.285.338c.139.206.299.483.537.895s.397.69.506.912c.107.217.14.333.15.416a1.25 1.25 0 0 1-.247.924c-.064.083-.178.187-.48.377c-.672.422-1.128 1.158-1.128 1.996s.456 1.574 1.128 1.996c.302.19.416.294.48.377c.202.263.29.595.247.924c-.01.083-.044.2-.15.416c-.109.223-.268.5-.506.912s-.399.689-.537.895c-.135.2-.219.287-.285.338a1.25 1.25 0 0 1-.924.247c-.104-.013-.25-.06-.567-.227c-.7-.37-1.566-.398-2.292.021s-1.135 1.183-1.165 1.975c-.013.357-.046.508-.086.604a1.25 1.25 0 0 1-.677.677c-.077.032-.194.061-.435.078c-.247.017-.567.017-1.043.017s-.796 0-1.043-.017c-.241-.017-.358-.046-.435-.078a1.25 1.25 0 0 1-.677-.677c-.04-.096-.073-.247-.086-.604c-.03-.792-.439-1.555-1.165-1.974s-1.591-.392-2.292-.022c-.316.167-.463.214-.567.227a1.25 1.25 0 0 1-.924-.247c-.066-.051-.15-.138-.285-.338a17 17 0 0 1-.537-.895c-.238-.412-.397-.69-.506-.912c-.107-.217-.14-.333-.15-.416a1.25 1.25 0 0 1 .247-.924c.064-.083.178-.187.48-.377c.672-.422 1.128-1.158 1.128-1.996s-.456-1.574 1.128-1.996c.302-.19.416-.294.48-.377a1.25 1.25 0 0 1 .247-.924c.01-.083.044-.2.15-.416c.109-.223.268-.5.506-.912s.399-.689.537-.895c.135-.2.219-.287.285-.338a1.25 1.25 0 0 1 .924-.247c.104.013.25.06.567.227c.7.37 1.566.398 2.292-.022c.726-.419 1.135-1.182 1.165-1.974c.013-.357.046-.508.086-.604c.127-.307.37-.55.677-.677" />
                </g>
              </svg>
            </Button>
          </div>
        </div>

        <Tabs
          className="w-full flex-col justify-start"
          onValueChange={setActiveTab}
          value={activeTab}
        >
          <div className="flex items-center justify-between">
            <TabsList className="rounded-full **:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:bg-muted-foreground/30 [&_button]:gap-1.5">
              <TabsTrigger className="rounded-full" value="all">
                View all
                <Badge variant="secondary">{visibleCount}</Badge>
              </TabsTrigger>
              <TabsTrigger className="rounded-full" value="verified">
                Verified <Badge variant="secondary">{verifiedCount}</Badge>
              </TabsTrigger>
              <TabsTrigger className="rounded-full" value="mentions">
                Mentions <Badge variant="secondary">{mentionCount}</Badge>
              </TabsTrigger>
            </TabsList>
          </div>
        </Tabs>
      </CardHeader>

      <CardContent className="h-full p-0">
        <div className="space-y-0 [&>*+*]:border-x-0 [&>*+*]:border-b-0 [&>*+*]:border-t [&>*+*]:border-dashed [&>*+*]:border-border">
          {filteredNotifications.length > 0 ? (
            filteredNotifications.map((notification) => (
              <NotificationItem key={notification.id} notification={notification} />
            ))
          ) : (
            <div className="flex flex-col items-center justify-center space-y-2.5 py-12 text-center">
              <div className="rounded-full bg-muted p-4">
                <svg
                  aria-hidden="true"
                  className="text-muted-foreground"
                  fill="none"
                  height="24"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  width="24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                  <path d="m13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
              </div>
              <p className="text-sm font-medium tracking-[-0.006em] text-muted-foreground">
                No notifications yet.
              </p>
            </div>
          )}
          {activeTab === "all"
            ? [
                ...posts.map((post) => (
                  <PostNotificationItem
                    key={post.slug}
                    post={post}
                    profitDisclosure={post.isPromo ? profitDisclosure : undefined}
                    profitPending={post.isPromo && status === "loading" && !snapshot}
                    profitValue={post.isPromo ? profitValue : undefined}
                    titleContent={post.isPromo ? promoTitle : undefined}
                  />
                )),
                videoNote ? <VideoNoteNotificationItem key="video-note" note={videoNote} /> : null,
              ]
            : null}
        </div>
      </CardContent>
    </Card>
  );
}

export const Component = NotificationsMenu;
