"use client";

import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type DCTheme = "dark" | "light";

interface DCThemeContextValue {
  theme: DCTheme;
  setTheme: (theme: DCTheme) => void;
  toggleTheme: () => void;
}

const DCThemeContext = createContext<DCThemeContextValue | null>(null);

function applyTheme(theme: DCTheme): void {
  document.documentElement.setAttribute("data-theme", theme);
  document.documentElement.setAttribute("data-dc-theme", theme);
}

function readInitialTheme(): DCTheme {
  const rootTheme = document.documentElement.getAttribute("data-dc-theme");
  return rootTheme === "light" ? "light" : "dark";
}

export function DCThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<DCTheme>("dark");

  useEffect(() => {
    setThemeState(readInitialTheme());
  }, []);

  const setTheme = useCallback((nextTheme: DCTheme) => {
    applyTheme(nextTheme);
    localStorage.setItem("data-theme", nextTheme);
    localStorage.setItem("data-dc-theme", nextTheme);
    setThemeState(nextTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [setTheme, theme]);

  const value = useMemo(() => ({ theme, setTheme, toggleTheme }), [setTheme, theme, toggleTheme]);

  return <DCThemeContext.Provider value={value}>{children}</DCThemeContext.Provider>;
}

export function useDCTheme(): DCThemeContextValue {
  const context = useContext(DCThemeContext);
  if (!context) {
    throw new Error("useDCTheme must be used within DCThemeProvider");
  }
  return context;
}
