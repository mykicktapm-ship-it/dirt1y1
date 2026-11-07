"use client";

import type { CSSProperties, ElementType, ReactElement } from "react";

import type { PolymorphicProps } from "@/dc-ui/types/polymorphic";
import { cn } from "@/lib/utils";

import styles from "./reveal.module.scss";

interface DCRevealOwnProps {
  delay?: number;
  duration?: number;
  translateY?: number;
}

export type DCRevealProps<Component extends ElementType = "div"> = PolymorphicProps<
  Component,
  DCRevealOwnProps
>;

type DCRevealStyle = CSSProperties & {
  "--dc-reveal-delay"?: string;
  "--dc-reveal-duration"?: string;
  "--dc-reveal-translate-y"?: string;
};

export function DCReveal<Component extends ElementType = "div">({
  as,
  className,
  delay = 0,
  duration = 0.6,
  style,
  translateY = 0,
  ...props
}: DCRevealProps<Component>): ReactElement {
  const Element = (as ?? "div") as ElementType;
  const revealStyle: DCRevealStyle = {
    "--dc-reveal-delay": `${delay}s`,
    "--dc-reveal-duration": `${duration}s`,
    "--dc-reveal-translate-y": `${translateY}px`,
    ...style,
  };

  return <Element className={cn(styles.reveal, className)} style={revealStyle} {...props} />;
}
