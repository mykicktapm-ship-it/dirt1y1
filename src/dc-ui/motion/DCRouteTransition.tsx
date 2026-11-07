"use client";

import { useAnimate, useReducedMotion } from "framer-motion";
import { usePathname } from "next/navigation";
import { type ReactNode, useCallback, useEffect, useLayoutEffect, useState } from "react";

import { DCSiteEntrance, type DCSiteEntranceProps } from "@/dc-ui/feedback/DCSiteEntrance";

import styles from "./route-transition.module.scss";

export interface DCRouteTransitionProps extends Pick<DCSiteEntranceProps, "dashboardFeed"> {
  children: ReactNode;
}

function clearEntryStyles(element: HTMLDivElement) {
  element.style.removeProperty("opacity");
  element.style.removeProperty("transform");
  element.style.removeProperty("will-change");
}

function RouteEntry({
  children,
  dashboardFeed,
  animateOnMount,
}: DCRouteTransitionProps & { animateOnMount: boolean }) {
  const [scope, animate] = useAnimate<HTMLDivElement>();
  const reducedMotion = useReducedMotion();
  const [enterOnMount] = useState(animateOnMount);
  const [pageReady, setPageReady] = useState(!animateOnMount);
  const handleReady = useCallback(() => setPageReady(true), []);

  useLayoutEffect(() => {
    const element = scope.current;
    if (!element || !enterOnMount || !pageReady || reducedMotion) return;

    // Start after the router commits and performs its native scroll/focus work.
    element.style.willChange = "opacity";
    const animation = animate(
      element,
      { opacity: [0, 1] },
      { type: "tween", duration: 0.16, ease: [0.16, 1, 0.3, 1] },
    );
    let active = true;

    void animation.then(() => {
      // Release temporary compositor hints once the page has appeared.
      if (active) {
        animation.cancel();
        clearEntryStyles(element);
      }
    });

    return () => {
      active = false;
      animation.stop();
      clearEntryStyles(element);
    };
  }, [animate, enterOnMount, pageReady, reducedMotion, scope]);

  return (
    <div className={styles.entry} ref={scope}>
      {enterOnMount ? (
        <DCSiteEntrance mode="page" onReady={handleReady} dashboardFeed={dashboardFeed}>
          {children}
        </DCSiteEntrance>
      ) : (
        children
      )}
    </div>
  );
}

/** Enter only the new page; persistent navigation and wallet state stay in the layout. */
export function DCRouteTransition({ children, dashboardFeed }: DCRouteTransitionProps) {
  const pathname = usePathname();
  const [isClientReady, setIsClientReady] = useState(false);

  useEffect(() => setIsClientReady(true), []);

  return (
    <RouteEntry animateOnMount={isClientReady} key={pathname} dashboardFeed={dashboardFeed}>
      {children}
    </RouteEntry>
  );
}
