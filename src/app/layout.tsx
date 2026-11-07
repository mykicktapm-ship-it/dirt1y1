import "@/dc-ui/tokens/tokens.css";
import "@/resources/custom.css";

import classNames from "classnames";
import Script from "next/script";

import { Footer, Header } from "@/components";
import MatrixBackground from "@/components/MatrixBackground";
import { DCChainProvider } from "@/dc-chain";
import { DCThemeProvider, createDCMetadata, getDCThemeInitializationScript } from "@/dc-ui";
import { DCSiteEntrance } from "@/dc-ui/feedback/DCSiteEntrance";
import { DCRouteTransition } from "@/dc-ui/motion/DCRouteTransition";
import { DCUmbrellaStage } from "@/dc-ui/motion/DCUmbrellaStage";
import { baseURL, brand, fonts, home } from "@/resources";
import { getNotificationsFeed } from "@/utils/notifications-feed";

import styles from "./layout.module.scss";

export async function generateMetadata() {
  return createDCMetadata({
    title: home.title,
    description: home.description,
    baseURL,
    path: home.path,
    image: home.image,
  });
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const dashboardFeed = getNotificationsFeed();
  return (
    <html
      className={classNames(
        fonts.heading.variable,
        fonts.body.variable,
        fonts.label.variable,
        fonts.code.variable,
      )}
      lang={brand.locale}
      suppressHydrationWarning
    >
      <head>
        <link
          rel="preload"
          href="/fonts/manufacturing-consent/ManufacturingConsent-Regular.ttf"
          as="font"
          type="font/ttf"
          crossOrigin="anonymous"
        />
        <Script id="dc-theme-init" strategy="beforeInteractive">
          {getDCThemeInitializationScript()}
        </Script>
      </head>
      <body className={styles.body}>
        <DCThemeProvider>
          <DCChainProvider>
            <DCSiteEntrance dashboardFeed={dashboardFeed}>
              <MatrixBackground />
              <DCUmbrellaStage />
              <div className={styles.shell}>
                <div aria-hidden="true" className={styles.desktopSpacer} />
                <Header />
                <div aria-hidden="true" className={styles.mobileSpacer} />
                <main className={styles.content}>
                  <div className={styles.contentInner}>
                    <DCRouteTransition dashboardFeed={dashboardFeed}>{children}</DCRouteTransition>
                  </div>
                </main>
                <Footer />
              </div>
            </DCSiteEntrance>
          </DCChainProvider>
        </DCThemeProvider>
      </body>
    </html>
  );
}
