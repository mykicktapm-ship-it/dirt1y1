import HomeStage from "@/components/ui/home-stage";
import { DCStructuredData, createDCMetadata } from "@/dc-ui";
import { baseURL, brand, dashboard, home } from "@/resources";
import styles from "./page.module.scss";

export async function generateMetadata() {
  return createDCMetadata({
    title: home.title,
    description: home.description,
    baseURL,
    path: home.path,
    image: home.image,
  });
}

export default function Home() {
  return (
    <div className={styles.page} data-home-page>
      <DCStructuredData
        author={{ name: brand.name, url: `${baseURL}${dashboard.path}`, image: brand.avatar }}
        baseURL={baseURL}
        description={home.description}
        image={home.image}
        path={home.path}
        title={home.title}
        type="WebPage"
      />
      <HomeStage height="var(--home-stage-height, 100svh)" />
    </div>
  );
}
