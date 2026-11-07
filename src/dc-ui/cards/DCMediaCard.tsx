"use client";

import { cn } from "@/lib/utils";
import { type HTMLMotionProps, motion, useReducedMotion } from "framer-motion";
import { type ReactNode, type Ref, forwardRef, useId } from "react";
import styles from "./media-card.module.scss";

type DCMediaCardProps = Omit<HTMLMotionProps<"figure">, "children" | "title"> & {
  title: string;
  description: string;
  media: ReactNode;
  mediaClassName?: string;
  captionClassName?: string;
  captionFooter?: ReactNode;
  contentRef?: Ref<HTMLDivElement>;
};

export const DCMediaCard = forwardRef<HTMLElement, DCMediaCardProps>(function DCMediaCard(
  {
    title,
    description,
    media,
    mediaClassName,
    captionClassName,
    captionFooter,
    contentRef,
    className,
    ...props
  },
  ref,
) {
  const titleId = useId();
  const reduced = useReducedMotion();

  return (
    <motion.figure
      ref={ref}
      className={cn(styles.card, className)}
      aria-labelledby={titleId}
      whileHover={reduced ? undefined : { scale: 1.03, y: -5 }}
      transition={{ type: "spring", stiffness: 400, damping: 10 }}
      {...props}
    >
      <div className={cn(styles.media, mediaClassName)}>{media}</div>
      <figcaption className={cn(styles.caption, captionClassName)}>
        <div ref={contentRef} aria-live="polite">
          <h3 id={titleId} className={styles.title}>
            {title}
          </h3>
          <p className={styles.description}>{description}</p>
        </div>
        {captionFooter}
      </figcaption>
    </motion.figure>
  );
});
