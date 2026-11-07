"use client";

import { cn } from "@/lib/utils";
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";
import { Lock } from "lucide-react";
import Link from "next/link";
import type { MouseEvent } from "react";
import { Button } from "./button";
import { Card, CardContent } from "./card";

interface DirtycoinParallaxCardProps {
  description: string;
  price: string;
  href?: string;
  ctaLabel?: string;
  className?: string;
}

export function DirtycoinParallaxCard({
  description,
  price,
  href = "/market/",
  ctaLabel = "Sign Up",
  className,
}: DirtycoinParallaxCardProps) {
  const reducedMotion = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const xSpring = useSpring(x, { stiffness: 300, damping: 30 });
  const ySpring = useSpring(y, { stiffness: 300, damping: 30 });
  const rotateX = useTransform(ySpring, [-0.5, 0.5], ["6deg", "-6deg"]);
  const rotateY = useTransform(xSpring, [-0.5, 0.5], ["-6deg", "6deg"]);

  const handleMouseMove = (event: MouseEvent<HTMLDivElement>) => {
    if (reducedMotion) return;
    const rect = event.currentTarget.getBoundingClientRect();
    x.set((event.clientX - rect.left) / rect.width - 0.5);
    y.set((event.clientY - rect.top) / rect.height - 0.5);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={
        reducedMotion
          ? { fontFamily: "var(--dc-font-body, sans-serif)" }
          : {
              fontFamily: "var(--dc-font-body, sans-serif)",
              rotateX,
              rotateY,
              transformStyle: "preserve-3d",
            }
      }
      whileHover={
        reducedMotion ? undefined : { scale: 0.97, boxShadow: "0px 15px 35px rgba(0,0,0,0.25)" }
      }
      transition={{ type: "spring", stiffness: 200, damping: 25 }}
      className={cn("relative w-full cursor-pointer rounded-2xl", className)}
    >
      <Card
        className="relative z-10 rounded-2xl p-4"
        style={{
          backgroundColor: "rgb(128 128 128 / 0.1)",
          border: 0,
          boxShadow: "0 15px 30px -12px rgb(0 0 0 / 0.2)",
        }}
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-2xl"
          style={{
            border: "1px solid rgb(255 255 255 / 0.12)",
            borderBottomColor: "rgb(255 255 255 / 0.2)",
            borderLeftColor: "rgb(255 255 255 / 0.2)",
          }}
        />
        <img
          src="/images/dirtycoin-logo.png"
          alt=""
          aria-hidden="true"
          width={50}
          height={50}
          className="pointer-events-none absolute bottom-4 right-4 z-0 h-[50px] w-[50px] object-contain"
        />
        <CardContent className="relative z-10 p-0">
          <p className="max-w-[280px] pr-12 text-sm leading-[1.4] text-muted-foreground">
            {description}
          </p>
          <div className="mt-3 flex items-center gap-4">
            <p className="text-lg font-semibold text-white">{price}</p>
            <Button
              asChild
              className="h-9 gap-1.5 rounded-full bg-neutral-300 px-3.5 text-[12.6px] text-neutral-900 no-underline hover:bg-neutral-200"
            >
              <Link href={href} prefetch={false}>
                <Lock size={13} aria-hidden="true" strokeWidth={2.2} />
                {ctaLabel}
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
