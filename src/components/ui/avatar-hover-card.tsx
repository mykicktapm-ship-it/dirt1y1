"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DCCurrencyText } from "@/dc-ui/typography/DCCurrencyMark";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { type ReactNode, useState } from "react";

export interface AvatarHoverCardProps {
  imageSrc: string;
  imageAlt?: string;
  name: string;
  username?: string;
  description?: string;
  buttonText?: string;
  onButtonClick?: () => void;
  buttonContent?: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  avatarSize?: number;
  className?: string;
  variant?: "default" | "glass" | "bordered";
  alwaysExpanded?: boolean;
  /** Remove background & border from the expanded card */
  transparent?: boolean;
}

const imageSizeVariants = {
  sm: "w-16 h-16",
  md: "w-24 h-24",
  lg: "w-32 h-32",
  xl: "w-40 h-40",
};

const imagePixelSizes: Record<string, number> = {
  sm: 64,
  md: 96,
  lg: 128,
  xl: 160,
};

const cardWidthVariants = {
  sm: "w-48",
  md: "w-52",
  lg: "w-80",
  xl: "w-96",
};

const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

/* Dark theme tokens for the hover card. */
const variantStyles: Record<string, { bg: string; border: string }> = {
  default: { bg: "rgba(255,255,255,0.04)", border: "rgba(255,255,255,0.08)" },
  glass: { bg: "rgba(255,255,255,0.03)", border: "rgba(255,255,255,0.06)" },
  bordered: { bg: "rgba(255,255,255,0.06)", border: "rgba(120,180,255,0.2)" },
};

export function AvatarHoverCard({
  imageSrc,
  imageAlt,
  name,
  username,
  description,
  buttonText = "View Profile",
  onButtonClick,
  buttonContent,
  size = "md",
  avatarSize,
  className,
  variant = "default",
  alwaysExpanded = false,
  transparent = false,
}: AvatarHoverCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const expanded = alwaysExpanded || isHovered;
  const vs = variantStyles[variant] ?? variantStyles.default;

  const resolvedAvatarSize = avatarSize ?? imagePixelSizes[size] ?? 96;

  const avatarElement = (
    <div
      style={{
        width: resolvedAvatarSize,
        height: resolvedAvatarSize,
        borderRadius: "50%",
        overflow: "hidden",
        boxShadow: "0 0 0 2px rgba(120,180,255,0.25), 0 2px 8px rgba(0,0,0,0.4)",
        margin: "0 auto",
      }}
    >
      <Avatar className="w-full h-full">
        <AvatarImage src={imageSrc || "/placeholder.svg"} alt={imageAlt || name} />
        <AvatarFallback
          className="text-xs font-bold"
          style={{
            background: "hsl(var(--muted) / 0.15)",
            color: "hsl(var(--muted-foreground) / 0.7)",
          }}
        >
          {getInitials(name)}
        </AvatarFallback>
      </Avatar>
    </div>
  );

  return (
    <motion.div
      className={cn("relative inline-block", className)}
      onMouseEnter={() => !alwaysExpanded && setIsHovered(true)}
      onMouseLeave={() => !alwaysExpanded && setIsHovered(false)}
      initial={false}
      animate={{ width: expanded ? "auto" : "fit-content" }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      {/* ── Collapsed avatar ── */}
      <motion.div
        className={cn("relative rounded-full overflow-hidden", imageSizeVariants[size])}
        style={{ cursor: "pointer" }}
        layout
        animate={{ padding: expanded ? "8px" : "0px" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        {avatarElement}
      </motion.div>

      {/* ── Expanded card ── */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={cn(
              "absolute top-0 left-0 rounded-xl shadow-lg overflow-hidden z-10",
              cardWidthVariants[size],
            )}
            style={{
              pointerEvents: "auto",
              ...(transparent
                ? { background: "none", border: "none", boxShadow: "none" }
                : {
                    background: `linear-gradient(135deg, ${vs.bg}, rgba(0,0,0,0.95))`,
                    backdropFilter: "blur(16px)",
                    WebkitBackdropFilter: "blur(16px)",
                    border: `1px solid ${vs.border}`,
                    boxShadow: "0 8px 32px rgba(0,0,0,0.5), 0 2px 8px rgba(120,180,255,0.1)",
                  }),
            }}
          >
            <div className="relative">
              {/* Avatar in card */}
              <motion.div
                className={cn("relative px-2 pb-0", imageSizeVariants[size])}
                style={{ paddingTop: 10 }}
              >
                {avatarElement}
              </motion.div>

              {/* Content */}
              <motion.div
                initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: 10, filter: "blur(4px)" }}
                transition={{ delay: 0.1, duration: 0.2 }}
                className={cn("space-y-3", alwaysExpanded ? "px-6 pt-0 pb-3" : "p-4")}
              >
                <div className="-mt-1">
                  <motion.h3
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15 }}
                    className="text-lg font-bold leading-tight"
                    style={{ color: "hsl(var(--foreground) / 0.95)" }}
                  >
                    {name}
                  </motion.h3>
                  {username && (
                    <motion.p
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.18 }}
                      className="text-sm"
                      style={{ color: "hsl(var(--muted-foreground) / 0.8)" }}
                    >
                      @{username}
                    </motion.p>
                  )}
                </div>
                {description && (
                  <motion.p
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-sm leading-relaxed line-clamp-2"
                    style={{ color: "hsl(var(--foreground) / 0.7)" }}
                  >
                    <DCCurrencyText value={description} />
                  </motion.p>
                )}
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                >
                  {buttonContent ? (
                    buttonContent
                  ) : (
                    <Button
                      onClick={onButtonClick}
                      size="sm"
                      className="w-1/2"
                      style={{
                        background: "#ffffff",
                        color: "#000000",
                        border: "none",
                      }}
                    >
                      {buttonText}
                    </Button>
                  )}
                </motion.div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default AvatarHoverCard;
