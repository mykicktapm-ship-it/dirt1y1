import { DashboardView } from "@/components/about/DashboardView.client";
import { NotificationsPanel } from "@/components/about/NotificationsPanel.client";
import styles from "@/components/about/about.module.scss";
import { DCStructuredData, createDCMetadata } from "@/dc-ui";
import { baseURL, brand, dashboard } from "@/resources";
import { getNotificationsFeed } from "@/utils/notifications-feed";

export async function generateMetadata() {
  return createDCMetadata({
    title: dashboard.title,
    description: dashboard.description,
    baseURL,
    image: "/images/og/home.jpg",
    path: dashboard.path,
  });
}

export default function DashboardPage() {
  const { posts, videoNote } = getNotificationsFeed();

  return (
    <div className={styles.page}>
      <DCStructuredData
        author={{ name: brand.name, url: `${baseURL}${dashboard.path}`, image: brand.avatar }}
        baseURL={baseURL}
        description={dashboard.description}
        image="/images/og/home.jpg"
        path={dashboard.path}
        title={dashboard.title}
        type="WebPage"
      />
      <div className={styles.layout}>
        <div className={styles.content}>
          <DashboardView />
          <NotificationsPanel posts={posts} videoNote={videoNote} />
        </div>
      </div>
    </div>
  );
}
