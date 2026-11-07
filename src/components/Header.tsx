"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { IconType } from "react-icons";
import { PiGridFourDuotone, PiHouseDuotone, PiUserCircleDuotone } from "react-icons/pi";

import { dashboard, market, routes } from "@/resources";

import styles from "./Header.module.scss";

interface NavigationItem {
  href: "/" | "/about" | "/market";
  icon: IconType;
  label?: string;
  matches: (pathname: string) => boolean;
}

const navigation: NavigationItem[] = [
  {
    href: "/",
    icon: PiHouseDuotone,
    matches: (pathname) => pathname === "/",
  },
  {
    href: "/about",
    icon: PiUserCircleDuotone,
    label: dashboard.label,
    matches: (pathname) =>
      pathname === "/about" ||
      pathname === "/about/" ||
      pathname === "/community" ||
      pathname.startsWith("/community/"),
  },
  {
    href: "/market",
    icon: PiGridFourDuotone,
    label: market.label,
    matches: (pathname) => pathname.startsWith("/market"),
  },
];

function Navigation({ pathname }: { pathname: string }) {
  const enabledItems = navigation.filter((item) => routes[item.href]);

  return (
    <nav aria-label="Primary" className={styles.navigation}>
      <div className={styles.navigationItems}>
        {enabledItems.map((item, index) => {
          const selected = item.matches(pathname);
          const Icon = item.icon;

          return (
            <div className={styles.navigationEntry} key={item.href}>
              {index === 1 && <span aria-hidden="true" className={styles.separator} />}
              <Link
                aria-current={selected ? "page" : undefined}
                aria-label={item.label ?? "Home"}
                className={styles.navigationLink}
                data-selected={selected || undefined}
                href={item.href}
                prefetch={false}
              >
                {item.href === "/" && selected ? (
                  // On Home the umbrella lives in the scene, so the slot shows the name instead.
                  <span className={styles.navigationLabel}>Dirtycoin</span>
                ) : (
                  <>
                    <Icon
                      aria-hidden="true"
                      className={styles.navigationIcon}
                      data-umbrella-slot={item.href === "/" ? "" : undefined}
                    />
                    {item.label && <span className={styles.navigationLabel}>{item.label}</span>}
                  </>
                )}
              </Link>
            </div>
          );
        })}
      </div>
    </nav>
  );
}

export function Header() {
  const pathname = usePathname() ?? "";
  const [homeSlide, setHomeSlide] = useState(0);
  const isHome = pathname === "/";

  useEffect(() => {
    if (!isHome) {
      setHomeSlide(0);
      return;
    }

    const readSlide = () => {
      const index = Number(document.documentElement.dataset.homeSlide ?? 0);
      setHomeSlide(Number.isInteger(index) && index >= 0 && index <= 4 ? index : 0);
    };
    const handleSlideChange = (event: Event) => {
      const index = (event as CustomEvent<{ index: number }>).detail?.index;
      if (Number.isInteger(index) && index >= 0 && index <= 4) setHomeSlide(index);
    };

    readSlide();
    window.addEventListener("dc:home-slide-change", handleSlideChange);
    return () => window.removeEventListener("dc:home-slide-change", handleSlideChange);
  }, [isHome]);

  if (isHome && homeSlide === 0) return null;

  return (
    <>
      <div aria-hidden="true" className={styles.fade} />

      <header className={styles.desktopHeader} data-home={isHome || undefined}>
        <Navigation pathname={pathname} />
      </header>

      <header className={styles.mobileHeader}>
        <Navigation pathname={pathname} />
      </header>
    </>
  );
}
