import { Biohazard } from "lucide-react";

import { DCText, SkeletonImage } from "@/dc-ui";
import { social } from "@/resources";
import { iconLibrary } from "@/resources/icons";

import styles from "./Footer.module.scss";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <DCText as="div" className={styles.copyright} color="secondary" variant="body-sm">
          <span>© {currentYear} / Dirtycoin</span>
          <SkeletonImage className={styles.hand} src="/images/dirty-hand.webp" alt="Dirty Hand" />
          <Biohazard aria-hidden="true" className={styles.biohazard} />
        </DCText>

        <nav aria-label="Social links" className={styles.social}>
          {social.map((item) => {
            const Icon = iconLibrary[item.icon];
            if (!Icon) return null;
            if (!item.link) {
              return (
                <span
                  aria-label={`${item.name} — soon`}
                  className={`${styles.socialLink} ${styles.pending}`}
                  key={item.name}
                  role="img"
                  title={`${item.name} — soon`}
                >
                  <Icon aria-hidden="true" />
                </span>
              );
            }

            return (
              <a
                aria-label={item.name}
                className={styles.socialLink}
                href={item.link}
                key={item.name}
                rel="noreferrer"
                target="_blank"
                title={item.name}
              >
                <Icon aria-hidden="true" />
              </a>
            );
          })}
        </nav>
      </div>
    </footer>
  );
}
