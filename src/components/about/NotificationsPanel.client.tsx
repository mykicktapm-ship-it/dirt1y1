"use client";

import { Bell, X } from "lucide-react";
import { type CSSProperties, useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

import {
  type CommunityFeedPost,
  type CommunityVideoNote,
  NotificationsMenu,
} from "@/components/ui/notifications-menu";
import { notificationItems } from "@/resources/notifications";

import styles from "./notifications-panel.module.scss";

/**
 * Dashboard notifications, collapsed by default: a `View all` button in the top-right corner
 * of the screen opens the full menu in a panel anchored to that corner. `/about/#notifications`
 * opens it directly. The menu mounts on first open, so its data is not read before.
 */
export function NotificationsPanel({
  posts,
  videoNote,
}: {
  posts: CommunityFeedPost[];
  videoNote?: CommunityVideoNote;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [mounted, setMounted] = useState(false);
  const [portal, setPortal] = useState<HTMLElement | null>(null);
  const [place, setPlace] = useState<CSSProperties>({});
  const panelId = useId();
  const count = notificationItems.length + posts.length + (videoNote ? 1 : 0);

  const open = useCallback(() => {
    setMounted(true);
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  // The trigger lives in <body>: inside the page it sits under the full-width fixed header.
  useEffect(() => setPortal(document.body), []);

  // Match the visible header pill: same height, same vertical centre; drop below it when the
  // two would touch on narrow screens.
  useEffect(() => {
    if (!portal) return;
    const align = () => {
      const pill = Array.from(document.querySelectorAll<HTMLElement>("header nav")).find(
        (nav) => nav.getBoundingClientRect().width > 0,
      );
      const trigger = triggerRef.current;
      if (!pill || !trigger) return;
      const rect = pill.getBoundingClientRect();
      const width = trigger.offsetWidth;
      const right = 16;
      const clears = window.innerWidth - right - width >= rect.right + 8;
      setPlace({
        top: clears ? rect.top : rect.bottom + 8,
        height: rect.height,
      });
    };
    align();
    const observer = new ResizeObserver(align);
    observer.observe(document.documentElement);
    window.addEventListener("resize", align);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", align);
    };
  }, [portal]);

  useEffect(() => {
    if (window.location.hash === "#notifications") open();
    const onHash = () => {
      if (window.location.hash === "#notifications") open();
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, [open]);

  return (
    <>
      {portal &&
        createPortal(
          <button
            ref={triggerRef}
            type="button"
            id="notifications"
            className={styles.trigger}
            style={place}
            aria-haspopup="dialog"
            aria-controls={panelId}
            onClick={open}
          >
            <Bell size={15} aria-hidden="true" />
            <span className={styles.label}>View all</span>
            <span className={styles.count}>{count}</span>
          </button>,
          portal,
        )}

      <dialog
        ref={dialogRef}
        id={panelId}
        className={styles.panel}
        aria-label="Your notifications"
        onClick={(event) => {
          // A click on the backdrop (the dialog element itself) closes the panel.
          if (event.target === event.currentTarget) event.currentTarget.close();
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") event.currentTarget.close();
        }}
      >
        <div className={styles.inner}>
          <button
            type="button"
            className={styles.close}
            aria-label="Close notifications"
            onClick={() => dialogRef.current?.close()}
          >
            <X size={16} aria-hidden="true" />
          </button>
          {mounted && <NotificationsMenu posts={posts} videoNote={videoNote} />}
        </div>
      </dialog>
    </>
  );
}
