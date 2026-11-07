"use client";

import { type Variants, motion } from "framer-motion";
import * as React from "react";

import { DCCurrencyText } from "@/dc-ui/typography/DCCurrencyMark";
import { cn } from "@/lib/utils";
import glassStyles from "./dc-glass.module.scss";

type SubStat = {
  label: string;
  subLabel: string;
  value: number | string;
};

type AvailabilityBar = {
  id: string;
  level: number;
};

export interface WalletStatsCardProps extends React.HTMLAttributes<HTMLDivElement> {
  headerAction?: React.ReactNode;
  availability: {
    bars: AvailabilityBar[];
    label: string;
    title: string;
  };
  balance: {
    amount: number | string;
    label: string;
    stateLabel?: string;
  };
  ranking: {
    category: string;
    icon?: React.ReactNode;
    place: string;
  };
  secretClub: {
    features: readonly string[];
    label: string;
  };
  subStats: [SubStat, SubStat];
  timeFrame: string;
  title: string;
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const barVariants: Variants = {
  hidden: { opacity: 0, scaleY: 0 },
  visible: { opacity: 1, scaleY: 1, transition: { duration: 0.5, ease: "easeOut" } },
};

const barColors = ["#3b82f6", "#4f46e5", "#a855f7", "#d946ef", "#ec4899", "#ef4444"];

export const WalletStatsCard = React.forwardRef<HTMLDivElement, WalletStatsCardProps>(
  (
    {
      availability,
      balance,
      className,
      headerAction,
      ranking,
      secretClub,
      subStats,
      timeFrame,
      title,
      ...props
    },
    ref,
  ) => {
    const titleId = React.useId();

    return (
      <div
        aria-labelledby={titleId}
        className={cn(glassStyles.dcGlassCard, className)}
        ref={ref}
        {...props}
      >
        <header className={cn("flex items-center", title ? "justify-between" : "justify-end")}>
          {title ? (
            <h2 className="text-xl font-bold" id={titleId}>
              {title}
            </h2>
          ) : null}
          {headerAction ?? (
            <div
              className={cn(glassStyles.dcGlassSection, "rounded-md px-3 py-1 text-sm font-medium")}
            >
              <span className={glassStyles.dcMutedText}>{timeFrame}</span>
            </div>
          )}
        </header>

        <section aria-label="Wallet balance">
          <p className={cn("text-sm", glassStyles.dcMutedText)}>
            <DCCurrencyText value={balance.label} />
          </p>
          <h3 className="mt-1 break-words text-5xl font-bold tracking-tighter">
            <DCCurrencyText value={String(balance.amount)} />
          </h3>
          <p className={cn("mt-2 text-sm font-semibold", glassStyles.dcGreenText)}>
            <DCCurrencyText value={balance.stateLabel ?? "USDC in connected wallet"} />
          </p>
        </section>

        <section aria-label="Position metrics" className="grid grid-cols-2 gap-4">
          {subStats.map((stat) => (
            <div className={cn(glassStyles.dcGlassSection, "p-4")} key={stat.label}>
              <p className="text-2xl font-bold">
                {stat.value}{" "}
                <span className={cn("text-base font-normal", glassStyles.dcMutedText)}>
                  {stat.label}
                </span>
              </p>
              <p className={cn("mt-1 text-xs", glassStyles.dcMutedText)}>{stat.subLabel}</p>
            </div>
          ))}
        </section>

        <section
          aria-label={`Level: ${ranking.place}, ${ranking.category}`}
          className={cn(glassStyles.dcGlassSectionDark, "flex items-center justify-between p-4")}
        >
          <div>
            <h4 className={cn("text-xl font-bold", glassStyles.dcGreenText)}>{ranking.place}</h4>
            <p className={cn("text-sm", glassStyles.dcGreenTextMuted)}>{ranking.category}</p>
          </div>
          {ranking.icon ? <div aria-hidden="true">{ranking.icon}</div> : null}
        </section>

        <section aria-labelledby={`${titleId}-progress`}>
          <h4 className="text-md font-semibold" id={`${titleId}-progress`}>
            {availability.title}
          </h4>
          <motion.div
            animate="visible"
            aria-label="Level progress chart"
            className="mt-3 flex h-5 items-end gap-1"
            initial="hidden"
            variants={containerVariants}
          >
            {availability.bars.map((bar, index) => {
              const colorIndex = Math.floor(
                (index / availability.bars.length) * (barColors.length - 1),
              );
              const color = bar.level > 0 ? barColors[colorIndex] : "rgba(255,255,255,0.06)";

              return (
                <div
                  className={cn("flex h-full w-full items-end", glassStyles.dcProgressBar)}
                  key={bar.id}
                >
                  <motion.div
                    className="w-full origin-bottom rounded-sm"
                    style={{ backgroundColor: color, height: `${bar.level * 100}%` }}
                    variants={barVariants}
                  />
                </div>
              );
            })}
          </motion.div>
          <p className={cn("mt-2 text-xs", glassStyles.dcMutedText)}>{availability.label}</p>
        </section>

        <section aria-label="Secret Club" className={cn(glassStyles.dcGlassSectionAccent, "p-4")}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h4 className="text-md font-semibold">Secret Club</h4>
              <p className={cn("mt-1 text-xs", glassStyles.dcMutedText)}>
                {secretClub.features.join(" · ")}
              </p>
            </div>
            <span
              className={cn(glassStyles.dcGlassSection, "rounded-md px-2 py-1 text-xs font-medium")}
            >
              <span className={glassStyles.dcMutedText}>{secretClub.label}</span>
            </span>
          </div>
        </section>
      </div>
    );
  },
);

WalletStatsCard.displayName = "WalletStatsCard";

export function LaurelIcon() {
  return (
    <svg
      aria-hidden="true"
      className="opacity-20"
      fill="none"
      height="36"
      viewBox="0 0 80 36"
      width="80"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M26.6667 35C20 35 15.3333 30.8333 12.6667 22.3333C10 13.8333 10 1 10 1M53.3333 35C60 35 64.6667 30.8333 67.3333 22.3333C70 13.8333 70 1 70 1"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <path
        d="M18 6.83331C19.1667 7.49998 22.3 9.7 20.5 13.5C18.7 17.3 14.8333 15.6666 14 15M21.3333 12.3333C22.5 13 25.6333 15.2 23.8333 19C22.0333 22.8 18.1667 21.1666 17.3333 20.5M24.6667 17.8333C25.8333 18.5 28.9667 20.7 27.1667 24.5C25.3667 28.3 21.5 26.6666 20.6667 26"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <path
        d="M62 6.83331C60.8333 7.49998 57.7 9.7 59.5 13.5C61.3 17.3 65.1666 15.6666 66 15M58.6667 12.3333C57.5 13 54.3667 15.2 56.1667 19C57.9667 22.8 61.8333 21.1666 62.6667 20.5M55.3333 17.8333C54.1667 18.5 51.0333 20.7 52.8333 24.5C54.6333 28.3 58.5 26.6666 59.3333 26"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}
