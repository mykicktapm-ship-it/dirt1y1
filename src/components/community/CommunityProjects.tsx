import { ProjectCard } from "@/components";
import { createArticleExcerpt, getMDXContent } from "@/utils/utils";

import styles from "./CommunityProjects.module.scss";
import { DirtyBotPromoPreview } from "./DirtyBotPromo.client";

const DIRTYBOT_PROMO_SLUG = "ai-trading-bot-front-runs-pump-fun-hunters";

interface CommunityProjectsProps {
  columns?: "1" | "2" | "3";
  exclude?: string[];
  range?: [number, number?];
}

export function CommunityProjects({ range, exclude, columns = "1" }: CommunityProjectsProps) {
  let allProjects = getMDXContent("src/app/community/projects");

  if (exclude?.length) {
    allProjects = allProjects.filter((post) => !exclude.includes(post.slug));
  }

  const sortedProjects = allProjects.sort(
    (a, b) =>
      new Date(b.metadata.publishedAt).getTime() - new Date(a.metadata.publishedAt).getTime(),
  );
  const displayedProjects = range
    ? sortedProjects.slice(range[0] - 1, range[1] ?? sortedProjects.length).reverse()
    : sortedProjects;

  return (
    <div className={styles.grid} data-columns={columns}>
      {displayedProjects.map((post, index) => {
        const cardProps = {
          avatars: post.metadata.team?.map((member) => ({ src: member.avatar })) ?? [],
          content: post.content,
          description:
            post.slug === DIRTYBOT_PROMO_SLUG
              ? createArticleExcerpt(post.content)
              : post.metadata.summary,
          href: `/community/${post.slug}`,
          images: post.metadata.images,
          link: post.metadata.link || "",
          priority: index < 2,
          videoSrc: post.slug === DIRTYBOT_PROMO_SLUG ? "/videos/cover.mp4" : undefined,
        };

        return post.slug === DIRTYBOT_PROMO_SLUG ? (
          <DirtyBotPromoPreview
            {...cardProps}
            fallbackTitle={post.metadata.title}
            key={post.slug}
          />
        ) : (
          <ProjectCard {...cardProps} key={post.slug} title={post.metadata.title} />
        );
      })}
    </div>
  );
}
