import { DCHeading, DCStack, DCText } from "@/dc-ui";

import styles from "./not-found.module.scss";

export default function NotFound() {
  return (
    <DCStack as="section" className={styles.page} fill center>
      <DCText
        as="span"
        className={styles.code}
        fontSize="5rem"
        letterSpacing="-0.055em"
        lineHeight="5rem"
        weight="semibold"
      >
        404
      </DCText>
      <DCHeading as="h1" className={styles.heading} weight="regular">
        Page Not Found
      </DCHeading>
      <DCText
        as="span"
        className={styles.description}
        color="secondary"
        fontSize="1rem"
        lineHeight="1.3rem"
      >
        The page you are looking for does not exist.
      </DCText>
    </DCStack>
  );
}
