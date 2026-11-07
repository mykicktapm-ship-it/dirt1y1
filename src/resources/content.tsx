import type { Brand, Page, Social } from "@/types";

const avatar =
  "https://images.pump.fun/coin-image/3AhBGRpVWuQudccqfmjeUcifgicN6MyNK3YPy3qwpump?variant=80x80&ipfs=bafybeiedpnlkwxjp5e6hw5bijbwpvnnea54xwf23btia3esyqrk63576na&src=https%3A%2F%2Fipfs.io%2Fipfs%2Fbafybeiedpnlkwxjp5e6hw5bijbwpvnnea54xwf23btia3esyqrk63576na";

const brand: Brand = { name: "$Dirtycoin", avatar, locale: "en" };

const social: Social = [
  { name: "Telegram", icon: "telegram", link: "https://t.me/fuckingdirtycoin" },
  { name: "Twitter", icon: "twitter", link: "https://x.com/dirtycoin" },
  // Invite URL pending from the owner; the footer shows the icon as inactive until it is set.
  { name: "Discord", icon: "discord", link: "" },
  {
    name: "Pump.fun",
    icon: "pumpfun",
    link: "https://pump.fun/coin/3AhBGRpVWuQudccqfmjeUcifgicN6MyNK3YPy3qwpump",
  },
];

const home = {
  path: "/",
  label: "Home",
  image: "/images/og/home.jpg",
  title: `${brand.name} — Smart Money Dashboard`,
  description:
    "A focused dashboard for tracking $USDC market data, position context, and community research.",
} satisfies Page;

const dashboard: Page = {
  path: "/about",
  label: "Dashboard",
  title: `Dashboard — ${brand.name}`,
  description:
    "Track the current $USDC balance, market context, and wallet position from one dashboard.",
};

const market: Page = {
  path: "/market",
  label: "Market",
  title: `Market — ${brand.name}`,
  description: `Market insights for ${brand.name}`,
};

const community: Page = {
  path: "/community",
  label: "Community",
  title: `Community — ${brand.name}`,
  description:
    "Research notes, product updates, and technical field reports from the Dirtycoin community.",
};

export { brand, social, home, dashboard, market, community };
