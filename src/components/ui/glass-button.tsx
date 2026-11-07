"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import styles from "./glass-button.module.scss";

function cn(...inputs: (string | undefined | null | false)[]): string {
  return inputs.filter(Boolean).join(" ");
}

const glassButtonVariants = cva(styles.glassButton, {
  variants: {
    size: {
      default: "",
      sm: "",
      lg: "",
      icon: "",
    },
  },
  defaultVariants: {
    size: "default",
  },
});

const glassButtonTextVariants = cva(styles.glassButtonText, {
  variants: {
    size: {
      default: styles.sizeDefault,
      sm: styles.sizeSm,
      lg: styles.sizeLg,
      icon: styles.sizeIcon,
    },
  },
  defaultVariants: {
    size: "default",
  },
});

export interface GlassButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof glassButtonVariants> {
  contentClassName?: string;
}

const GlassButton = React.forwardRef<HTMLButtonElement, GlassButtonProps>(
  ({ className, children, size, contentClassName, ...props }, ref) => {
    return (
      <div
        className={cn(styles.glassButtonWrap, className)}
      >
        <button
          className={cn(styles.glassButton)}
          ref={ref}
          {...props}
        >
          <span
            className={cn(
              glassButtonTextVariants({ size }),
              contentClassName,
            )}
          >
            {children}
          </span>
        </button>
        <div className={styles.glassButtonShadow} />
      </div>
    );
  },
);
GlassButton.displayName = "GlassButton";

export { GlassButton, glassButtonVariants };
export default GlassButton;
