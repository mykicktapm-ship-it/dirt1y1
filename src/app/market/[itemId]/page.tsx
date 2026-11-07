import { notFound } from "next/navigation";

import { ItemMarketPage as ItemMarketScene } from "@/components/ItemMarketPage.client";
import { createDCMetadata } from "@/dc-ui";
import { baseURL } from "@/resources";
import { marketplaceItems } from "@/resources/marketplace";

import styles from "./page.module.scss";

type ItemPageProps = { params: Promise<{ itemId: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return marketplaceItems.map((item) => ({ itemId: item.id }));
}

function getItem(itemId: string) {
  const item = marketplaceItems.find((entry) => entry.id === itemId);
  if (!item) notFound();
  return item;
}

export async function generateMetadata({ params }: ItemPageProps) {
  const item = getItem((await params).itemId);
  return createDCMetadata({
    baseURL,
    title: `${item.title} — Item Market`,
    description: item.description,
    image: `/marketplace/${item.id}/cover.webp`,
    path: `/market/${item.id}/`,
  });
}

export default async function ItemMarketPage({ params }: ItemPageProps) {
  const item = getItem((await params).itemId);
  return (
    <div className={styles.page}>
      <ItemMarketScene key={item.id} itemId={item.id} />
    </div>
  );
}
