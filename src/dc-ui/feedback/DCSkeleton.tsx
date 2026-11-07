"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ComponentPropsWithoutRef } from "react";

import { cn } from "@/lib/utils";

export type StyledSize = "sm" | "md" | "lg" | "xl";
export type SkeletonProps = ComponentPropsWithoutRef<"div"> & {
  as?: "div" | "span";
  size?: StyledSize;
};

export const skeletonBackground =
  "color-mix(in oklab, var(--dc-color-text-muted) 18%, var(--dc-color-surface-raised))";
export const skeletonPulse = {
  duration: 1.6,
  ease: "easeInOut" as const,
  repeat: Number.POSITIVE_INFINITY,
};

const box = { sm: "size-8", md: "size-10", lg: "size-12", xl: "size-16" };
const bar = { sm: "h-3", md: "h-4", lg: "h-5", xl: "h-6" };
const pill = { sm: "w-16", md: "w-20", lg: "w-24", xl: "w-28" };

function Shape({
  as: Root = "div",
  className,
  blockClassName,
  ...props
}: SkeletonProps & { blockClassName: string }) {
  const reduce = useReducedMotion();
  return (
    <Root {...props} data-slot="styled-skeleton" aria-hidden="true" className={className}>
      <motion.span
        className={cn("block h-full w-full", blockClassName)}
        style={{ background: skeletonBackground }}
        animate={{ opacity: reduce ? 1 : [0.5, 1, 0.5] }}
        transition={reduce ? { duration: 0 } : skeletonPulse}
      />
    </Root>
  );
}

export function CircleSkeleton({ className, size = "md", ...props }: SkeletonProps) {
  return (
    <Shape
      {...props}
      className={cn("inline-flex shrink-0", box[size], className)}
      blockClassName="rounded-full"
    />
  );
}

export function SquareSkeleton({ className, size = "md", ...props }: SkeletonProps) {
  return (
    <Shape
      {...props}
      className={cn("inline-flex shrink-0", box[size], className)}
      blockClassName="rounded-none"
    />
  );
}

export function RoundedSkeleton({ className, size = "md", ...props }: SkeletonProps) {
  return (
    <Shape
      {...props}
      className={cn("inline-flex shrink-0", box[size], className)}
      blockClassName="rounded-xl"
    />
  );
}

export function PillSkeleton({ className, size = "md", ...props }: SkeletonProps) {
  return (
    <Shape
      {...props}
      className={cn("inline-flex shrink-0", bar[size], pill[size], className)}
      blockClassName="rounded-full"
    />
  );
}

export function BarSkeleton({ className, size = "md", ...props }: SkeletonProps) {
  return (
    <Shape
      {...props}
      className={cn("flex w-full shrink-0", bar[size], className)}
      blockClassName="rounded-md"
    />
  );
}
