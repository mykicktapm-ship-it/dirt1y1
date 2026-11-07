"use client";

import { Link as LinkIcon } from "lucide-react";
import type { CSSProperties, JSX, ReactNode } from "react";
import { useState } from "react";

import styles from "./HeadingLink.module.scss";

interface HeadingLinkProps {
  children: ReactNode;
  id: string;
  level: 1 | 2 | 3 | 4 | 5 | 6;
  style?: CSSProperties;
}

export function HeadingLink({ id, level, children, style }: HeadingLinkProps) {
  const [status, setStatus] = useState("");
  const Heading = `h${level}` as keyof JSX.IntrinsicElements;

  async function copyURL() {
    try {
      const url = `${window.location.origin}${window.location.pathname}#${id}`;
      await navigator.clipboard.writeText(url);
      setStatus("Link copied to clipboard.");
    } catch {
      setStatus("Failed to copy link.");
    }
  }

  return (
    <div className={styles.control} style={style}>
      <Heading className={styles.text} id={id}>
        {children}
      </Heading>
      <button
        aria-label={`Copy link to ${String(children)}`}
        className={styles.copy}
        onClick={copyURL}
        type="button"
      >
        <LinkIcon aria-hidden="true" size={15} />
      </button>
      <span aria-live="polite" className={styles.status}>
        {status}
      </span>
    </div>
  );
}
