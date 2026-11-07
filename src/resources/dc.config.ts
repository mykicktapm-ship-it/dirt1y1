import localFont from "next/font/local";

import type { FontsConfig, RoutesConfig } from "@/types";

function readPublicOrigin(value: string | undefined): string {
  const url = new URL(value?.trim() || "https://dirtycoin.sol");
  const isLoopback = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  const validProtocol = url.protocol === "https:" || (url.protocol === "http:" && isLoopback);
  if (
    !validProtocol ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  ) {
    throw new TypeError("NEXT_PUBLIC_SITE_URL must be an HTTPS origin");
  }
  return url.origin;
}

export const baseURL = readPublicOrigin(process.env.NEXT_PUBLIC_SITE_URL);

export const routes: RoutesConfig = {
  "/": true,
  "/about": true,
  "/community": false,
  "/market": true,
};

const heading = localFont({
  display: "swap",
  src: "./fonts/geist-latin.woff2",
  variable: "--font-heading",
  weight: "100 900",
});
const body = localFont({
  display: "swap",
  src: "./fonts/geist-latin.woff2",
  variable: "--font-body",
  weight: "100 900",
});
const label = localFont({
  display: "swap",
  src: "./fonts/geist-latin.woff2",
  variable: "--font-label",
  weight: "100 900",
});
const code = localFont({
  display: "swap",
  src: "./fonts/geist-mono-latin.woff2",
  variable: "--font-code",
  weight: "100 900",
});

export const fonts: FontsConfig = { heading, body, label, code };
