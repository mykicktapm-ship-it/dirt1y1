import { type VariantProps, cva } from "class-variance-authority";
import { ArrowDown, ArrowRight, ArrowUp } from "lucide-react";
import type * as React from "react";

import { cn } from "@/lib/utils";

const badgeDeltaVariants = cva(
  "inline-flex items-center gap-1 whitespace-nowrap rounded-md px-2 py-1 text-xs font-semibold leading-none tabular-nums",
  {
    variants: {
      variant: {
        outline: "border border-current bg-transparent",
        solid: "border border-transparent",
        solidOutline: "border",
      },
      deltaType: {
        increase: "",
        decrease: "",
        neutral: "",
      },
    },
    compoundVariants: [
      {
        className: "border-emerald-400/20 bg-emerald-400/15 text-emerald-400",
        deltaType: "increase",
        variant: "solid",
      },
      {
        className: "border-red-400/20 bg-red-400/15 text-red-400",
        deltaType: "decrease",
        variant: "solid",
      },
      {
        className: "border-white/10 bg-white/10 text-white/70",
        deltaType: "neutral",
        variant: "solid",
      },
      {
        className: "border-emerald-400/25 bg-emerald-400/10 text-emerald-400",
        deltaType: "increase",
        variant: "solidOutline",
      },
      {
        className: "border-red-400/25 bg-red-400/10 text-red-400",
        deltaType: "decrease",
        variant: "solidOutline",
      },
      {
        className: "border-white/15 bg-white/5 text-white/70",
        deltaType: "neutral",
        variant: "solidOutline",
      },
      {
        className: "text-emerald-400",
        deltaType: "increase",
        variant: "outline",
      },
      {
        className: "text-red-400",
        deltaType: "decrease",
        variant: "outline",
      },
      {
        className: "text-white/70",
        deltaType: "neutral",
        variant: "outline",
      },
    ],
    defaultVariants: {
      deltaType: "neutral",
      variant: "outline",
    },
  },
);

export interface BadgeDeltaProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeDeltaVariants> {
  showIcon?: boolean;
  value: string | number;
}

const deltaIcons = {
  decrease: ArrowDown,
  increase: ArrowUp,
  neutral: ArrowRight,
};

export function BadgeDelta({
  className,
  deltaType = "neutral",
  showIcon = true,
  value,
  variant = "outline",
  ...props
}: BadgeDeltaProps) {
  const DeltaIcon = deltaIcons[deltaType ?? "neutral"];

  return (
    <span className={cn(badgeDeltaVariants({ deltaType, variant }), className)} {...props}>
      {showIcon ? <DeltaIcon aria-hidden="true" className="size-3.5" /> : null}
      {value}
    </span>
  );
}
