import { MDXRemote, type MDXRemoteProps } from "next-mdx-remote/rsc";
import Link from "next/link";
import type { AnchorHTMLAttributes, HTMLAttributes, ReactNode } from "react";
import { slugify as transliterate } from "transliteration";

import { HeadingLink } from "@/components/HeadingLink";
import { SkeletonImage } from "@/components/ui/skeleton-image";

import styles from "./mdx.module.scss";

type CustomLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  children: ReactNode;
  href: string;
};

function CustomLink({ href, children, ...props }: CustomLinkProps) {
  if (href.startsWith("/")) {
    return (
      <Link href={href} {...props}>
        {children}
      </Link>
    );
  }
  if (href.startsWith("#"))
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  return (
    <a href={href} rel="noopener noreferrer" target="_blank" {...props}>
      {children}
    </a>
  );
}

function slugify(value: string) {
  return transliterate(value.replace(/&/g, " and "), {
    lowercase: true,
    separator: "-",
  }).replace(/--+/g, "-");
}

function createHeading(level: 1 | 2 | 3 | 4 | 5 | 6) {
  function MDXHeading({ children }: { children: ReactNode }) {
    const label = String(children);
    return (
      <HeadingLink
        id={slugify(label)}
        level={level}
        style={{ marginTop: "1.5rem", marginBottom: "0.75rem" }}
      >
        {children}
      </HeadingLink>
    );
  }
  MDXHeading.displayName = `MDXHeading${level}`;
  return MDXHeading;
}

function Paragraph({ children }: { children: ReactNode }) {
  return <p className={styles.paragraph}>{children}</p>;
}

function Image({ alt = "", src }: { alt?: string; src?: string }) {
  if (!src) return null;
  return <SkeletonImage alt={alt} className={styles.image} loading="lazy" src={src} />;
}

function Code({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <code className={className ? styles.codeBlockContent : styles.inlineCode}>{children}</code>
  );
}

function Pre({ children, ...props }: HTMLAttributes<HTMLPreElement>) {
  return (
    <pre className={styles.codeBlock} {...props}>
      {children}
    </pre>
  );
}

const components = {
  a: CustomLink,
  blockquote: (props: HTMLAttributes<HTMLQuoteElement>) => (
    <blockquote className={styles.quote} {...props} />
  ),
  code: Code,
  h1: createHeading(1),
  h2: createHeading(2),
  h3: createHeading(3),
  h4: createHeading(4),
  h5: createHeading(5),
  h6: createHeading(6),
  hr: () => <hr className={styles.rule} />,
  img: Image,
  li: (props: HTMLAttributes<HTMLLIElement>) => <li className={styles.listItem} {...props} />,
  ol: (props: HTMLAttributes<HTMLOListElement>) => <ol className={styles.list} {...props} />,
  p: Paragraph,
  pre: Pre,
  table: (props: HTMLAttributes<HTMLTableElement>) => (
    <div className={styles.tableWrap}>
      <table {...props} />
    </div>
  ),
  ul: (props: HTMLAttributes<HTMLUListElement>) => <ul className={styles.list} {...props} />,
};

type CustomMDXProps = Omit<MDXRemoteProps, "components"> & {
  components?: MDXRemoteProps["components"];
};

export function CustomMDX(props: CustomMDXProps) {
  return (
    <MDXRemote
      options={{ blockJS: false }}
      {...props}
      components={{ ...components, ...(props.components ?? {}) } as MDXRemoteProps["components"]}
    />
  );
}
