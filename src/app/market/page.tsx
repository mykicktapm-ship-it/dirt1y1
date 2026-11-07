import MarketplaceCards from "@/components/MarketplaceCards.client";

import { DCStack, DCStructuredData, createDCMetadata } from "@/dc-ui";
import { baseURL, brand, market } from "@/resources";

import styles from "./page.module.scss";

const image = "/images/og/home.jpg";

export async function generateMetadata() {
  return createDCMetadata({
    title: market.title,
    description: market.description,
    baseURL,
    image,
    path: market.path,
  });
}

export default function Market() {
  return (
    <DCStack as="section" className={styles.page}>
      <DCStructuredData
        author={{
          name: brand.name,
          url: `${baseURL}/market`,
          image: brand.avatar,
        }}
        baseURL={baseURL}
        description={market.description}
        image={image}
        path={market.path}
        title={market.title}
        type="WebPage"
      />

      <MarketplaceCards />
    </DCStack>
  );
}
