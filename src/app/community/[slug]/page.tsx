import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CustomMDX, ProjectCard, ScrollToHash } from "@/components";
import dashboardStyles from "@/components/about/about.module.scss";
import { CommunityProjects } from "@/components/community/CommunityProjects";
import {
  DirtyBotPromoConversion,
  DirtyBotPromoHeader,
} from "@/components/community/DirtyBotPromo.client";
import { DCStructuredData, createDCMetadata } from "@/dc-ui";
import { baseURL, brand, community, dashboard } from "@/resources";
import { formatDate } from "@/utils/formatDate";
import { createArticleExcerpt, getMDXContent } from "@/utils/utils";

import styles from "./project.module.scss";

const DIRTYBOT_PROMO_SLUG = "ai-trading-bot-front-runs-pump-fun-hunters";

export async function generateStaticParams(): Promise<{ slug: string }[]> {
  return getMDXContent("src/app/community/projects").map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string | string[] }>;
}): Promise<Metadata> {
  const routeParams = await params;
  const slug = Array.isArray(routeParams.slug)
    ? routeParams.slug.join("/")
    : routeParams.slug || "";
  const post = getMDXContent("src/app/community/projects").find((entry) => entry.slug === slug);
  if (!post) return {};
  const description = post.metadata.summary || createArticleExcerpt(post.content);

  return createDCMetadata({
    title: post.metadata.title,
    description,
    baseURL,
    image: post.metadata.image || "/images/og/home.jpg",
    path: `${community.path}/${post.slug}`,
  });
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string | string[] }>;
}) {
  const routeParams = await params;
  const slug = Array.isArray(routeParams.slug)
    ? routeParams.slug.join("/")
    : routeParams.slug || "";
  const posts = getMDXContent("src/app/community/projects");
  const post = posts.find((entry) => entry.slug === slug);
  if (!post) notFound();

  const image = post.metadata.image || "/images/og/home.jpg";
  const structuredDescription = post.metadata.summary || createArticleExcerpt(post.content);
  const cardProps = {
    avatars: post.metadata.team?.map((member) => ({ src: member.avatar })) ?? [],
    content: post.content,
    description: post.metadata.summary,
    href: `/community/${post.slug}`,
    images: post.metadata.images,
    link: post.metadata.link || "",
    publishedAt: {
      dateTime: post.metadata.publishedAt,
      label: formatDate(post.metadata.publishedAt),
    },
    videoSrc: slug === DIRTYBOT_PROMO_SLUG ? "/videos/cover.mp4" : undefined,
    variant: "detail" as const,
  };

  return (
    <div className={styles.page}>
      <DCStructuredData
        author={{
          name: brand.name,
          url: `${baseURL}${dashboard.path}`,
          image: brand.avatar,
        }}
        baseURL={baseURL}
        dateModified={post.metadata.publishedAt}
        datePublished={post.metadata.publishedAt}
        description={structuredDescription}
        image={image}
        path={`${community.path}/${post.slug}`}
        title={post.metadata.title}
        type="BlogPosting"
      />
      <div className={styles.layout}>
        <aside className={dashboardStyles.avatar}>
          <div className={dashboardStyles.tags}>
            <Link className={dashboardStyles.backLink} href="/about/#notifications">
              <span aria-hidden="true" className={dashboardStyles.backIcon}>
                <ArrowLeft size={16} strokeWidth={3} />
              </span>
              <span className={dashboardStyles.tag}>Dashboard</span>
            </Link>
          </div>
        </aside>
        <section className={styles.content}>
          {slug === DIRTYBOT_PROMO_SLUG ? (
            <DirtyBotPromoHeader {...cardProps} fallbackTitle={post.metadata.title} />
          ) : (
            <ProjectCard {...cardProps} title={post.metadata.title} />
          )}

          <article className={styles.article}>
            <CustomMDX source={post.content} />
          </article>

          {slug === DIRTYBOT_PROMO_SLUG ? <DirtyBotPromoConversion /> : null}

          <section aria-labelledby="related-content" className={styles.related}>
            <hr />
            <h2 id="related-content">Related content</h2>
            <CommunityProjects exclude={[post.slug]} range={[2]} />
          </section>
          <ScrollToHash />
        </section>
      </div>
    </div>
  );
}
