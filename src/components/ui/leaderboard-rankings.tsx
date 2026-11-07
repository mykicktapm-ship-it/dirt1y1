"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import * as React from "react";
import styles from "./leaderboard-rankings.module.scss";

export interface LeaderboardRankingItem {
  userId: string;
  rank: number;
  userName: string;
  byline?: string;
  avatarUrl?: string;
  avatarFallback?: string;
  positionValue: number;
  positionLabel?: string;
  value: number;
  valueLabel?: string;
  displayed?: boolean;
}

interface LeaderboardRankingsProps extends React.OlHTMLAttributes<HTMLOListElement> {
  rankings: LeaderboardRankingItem[];
  currentUserId?: string;
  showPagination?: boolean;
  defaultPageSize?: number;
}

export interface PumpMetricBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  label: string;
  tone?: "negative" | "neutral" | "positive";
  value: string;
}

export function PumpMetricBadge({
  className,
  label,
  tone = "neutral",
  value,
  ...props
}: PumpMetricBadgeProps) {
  return (
    <span className={cn(styles.metricBadge, className)} {...props}>
      <span className={styles.metricLabel}>{label}</span>
      <span
        className={cn(
          styles.metricValue,
          tone === "negative" && styles.negative,
          tone === "positive" && styles.positive,
        )}
      >
        {value}
      </span>
    </span>
  );
}

function formatValue(v: number) {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
  return String(v);
}

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const LeaderboardRankings = React.forwardRef<HTMLOListElement, LeaderboardRankingsProps>(
  (
    { rankings, currentUserId, showPagination = false, defaultPageSize = 10, className, ...props },
    ref,
  ) => {
    const [page, setPage] = React.useState(0);
    const pageSize = defaultPageSize;
    const totalPages = Math.ceil(rankings.length / pageSize);
    const paged = rankings.slice(page * pageSize, (page + 1) * pageSize);

    const hasPrev = page > 0;
    const hasNext = page < totalPages - 1;

    return (
      <ol ref={ref} className={cn(styles.list, className)} {...props}>
        {paged.map((item) => {
          const isMe = currentUserId && item.userId === currentUserId;
          return (
            <li key={item.userId} className={styles.row} data-current-user={isMe || undefined}>
              <div className={styles.identity}>
                <Avatar aria-hidden="true" className={styles.avatar}>
                  {item.avatarUrl ? (
                    <AvatarImage
                      src={item.avatarUrl}
                      alt=""
                      decoding="async"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                    />
                  ) : null}
                  <AvatarFallback className={styles.avatarFallback}>
                    {initials(item.avatarFallback ?? item.userName)}
                  </AvatarFallback>
                </Avatar>
                <div className={styles.identityCopy}>
                  <p className={styles.name}>{item.userName}</p>
                  {item.byline ? <p className={styles.byline}>{item.byline}</p> : null}
                </div>
              </div>

              <div className={styles.metric}>
                <span className={styles.metricLabel}>Position</span>
                <span className={styles.metricValue}>
                  {item.positionLabel ?? formatValue(item.positionValue)}
                </span>
              </div>

              <div className={styles.metric}>
                <span className={styles.metricLabel}>Total PNL</span>
                <span
                  className={cn(
                    styles.metricValue,
                    item.value < 0 && styles.negative,
                    item.value > 0 && styles.positive,
                  )}
                >
                  {item.valueLabel ?? formatValue(item.value)}
                </span>
              </div>
            </li>
          );
        })}

        {showPagination && totalPages > 1 && (
          <div className="flex items-center justify-between pt-3">
            <button
              type="button"
              disabled={!hasPrev}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="inline-flex items-center gap-1 text-xs text-white/50 hover:text-white/80 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Prev
            </button>
            <span className="text-xs text-white/40">
              {page + 1} / {totalPages}
            </span>
            <button
              type="button"
              disabled={!hasNext}
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              className="inline-flex items-center gap-1 text-xs text-white/50 hover:text-white/80 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Next
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </ol>
    );
  },
);

LeaderboardRankings.displayName = "LeaderboardRankings";

export { LeaderboardRankings };
