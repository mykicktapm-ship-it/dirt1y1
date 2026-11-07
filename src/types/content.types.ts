import type { IconName } from "@/resources/icons";

/** The project as it signs pages: display name, avatar and document language. */
export type Brand = {
  name: string;
  avatar: string;
  /** BCP 47 language tag for the HTML `lang` attribute. */
  locale: string;
};

/** Community and trading links shown in the footer; an empty `link` renders the icon inactive. */
export type Social = Array<{
  name: string;
  icon: IconName;
  link: string;
}>;

/** Route metadata: navigation label and the title, description and image for link previews. */
export type Page = {
  path: `/${string}`;
  label: string;
  title: string;
  description: string;
  image?: `/images/${string}`;
};

// Community posts (MDX front matter)

export type TeamMember = {
  name: string;
  role: string;
  avatar: string;
  linkedIn: string;
};

export type MDXMetadata = {
  title: string;
  subtitle?: string;
  publishedAt: string;
  summary: string;
  image?: string;
  images: string[];
  tag?: string;
  team: TeamMember[];
  link?: string;
};

export type MDXDocument = {
  metadata: MDXMetadata;
  slug: string;
  content: string;
};
