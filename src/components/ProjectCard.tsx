"use client";

import { ExternalLink, Eye, Pin } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import FallbackCard from "@/components/ui/fallback-card";
import { SkeletonImage } from "@/components/ui/skeleton-image";
import { DCCurrencyText } from "@/dc-ui/typography/DCCurrencyMark";

import styles from "./ProjectCard.module.scss";

export interface ProjectCardProps {
  avatars: { src: string }[];
  content: string;
  description: string;
  href: string;
  images: string[];
  link: string;
  priority?: boolean;
  publishedAt?: {
    dateTime: string;
    label: string;
  };
  title: string;
  titleAccessory?: ReactNode;
  titleContent?: ReactNode;
  videoSrc?: string;
  variant?: "detail" | "preview";
}

export function ProjectCard({
  avatars = [],
  content,
  description,
  href,
  link,
  publishedAt,
  title,
  titleAccessory,
  titleContent,
  videoSrc,
  variant = "preview",
}: ProjectCardProps) {
  const hasArticle = content.trim().length > 0;
  const isDetail = variant === "detail";
  const summary = isDetail ? description.trim() : description.trim().replace(/[.!?…]+$/u, "");
  const Title = isDetail ? "h1" : "h2";

  return (
    <article className={styles.card} data-variant={variant}>
      <div className={styles.media}>
        <FallbackCard framed={false} showFooter={false} showGlitch videoSrc={videoSrc} />
        {avatars[0]?.src ? (
          <SkeletonImage alt="" shape="circle" className={styles.avatar} src={avatars[0].src} />
        ) : null}
        {(hasArticle || link) && (
          <div className={styles.mediaActions}>
            {hasArticle && !isDetail && (
              <Link aria-label={`Read ${title}`} className={styles.mediaAction} href={href}>
                <Eye aria-hidden="true" />
              </Link>
            )}
            {link && (
              <a
                aria-label={`View ${title}`}
                className={styles.mediaAction}
                href={link}
                rel="noreferrer"
                target="_blank"
              >
                <ExternalLink aria-hidden="true" />
              </a>
            )}
          </div>
        )}
      </div>

      <div className={styles.content}>
        <div className={styles.identity}>
          <Title
            className={
              titleAccessory ? `${styles.title} ${styles.titleWithAccessory}` : styles.title
            }
          >
            {titleContent ?? title}
            {titleAccessory ? (
              <span className={styles.titleAccessory}>{titleAccessory}</span>
            ) : null}
          </Title>
          <span aria-label="Pinned publication" className={styles.pinBadge} role="img">
            <Pin aria-hidden="true" />
          </span>
        </div>

        {summary ? (
          <p className={styles.description}>
            <DCCurrencyText value={summary} />
            {!isDetail ? <>… </> : null}
            {hasArticle && !isDetail ? (
              <Link className={styles.readLink} href={href}>
                Read full
              </Link>
            ) : null}
          </p>
        ) : hasArticle && !isDetail ? (
          <Link className={styles.readLink} href={href}>
            Read full
          </Link>
        ) : null}

        {isDetail && publishedAt ? (
          <time className={styles.date} dateTime={publishedAt.dateTime}>
            {publishedAt.label}
          </time>
        ) : null}
      </div>
    </article>
  );
}
