"use client";

import { Moon, Sun } from "lucide-react";

import { useDCTheme } from "@/dc-ui";

import styles from "./ThemeToggle.module.scss";

export function ThemeToggle() {
  const { theme, toggleTheme } = useDCTheme();
  const nextTheme = theme === "dark" ? "light" : "dark";
  const Icon = theme === "dark" ? Sun : Moon;

  return (
    <button
      aria-label={`Switch to ${nextTheme} mode`}
      className={styles.button}
      onClick={toggleTheme}
      type="button"
    >
      <Icon aria-hidden="true" />
    </button>
  );
}
