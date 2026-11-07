import type { CommunityFeedPost, CommunityVideoNote } from "@/components/ui/notifications-menu";
import { brand } from "@/resources";
import { changelogVideoNote } from "@/resources/video-note";
import { createArticleExcerpt, getMDXContent } from "@/utils/utils";

const DIRTYBOT_PROMO_SLUG = "ai-trading-bot-front-runs-pump-fun-hunters";

export function getNotificationsFeed(): {
  posts: CommunityFeedPost[];
  videoNote: CommunityVideoNote;
} {
  return {
    posts: getMDXContent("src/app/community/projects")
      .sort(
        (left, right) =>
          new Date(right.metadata.publishedAt).getTime() -
          new Date(left.metadata.publishedAt).getTime(),
      )
      .map((post) => ({
        avatar: post.metadata.team[0]?.avatar ?? brand.avatar,
        description: post.metadata.summary || createArticleExcerpt(post.content),
        isPromo: post.slug === DIRTYBOT_PROMO_SLUG,
        publishedAt: post.metadata.publishedAt,
        slug: post.slug,
        title: post.metadata.title,
        videoSrc: post.slug === DIRTYBOT_PROMO_SLUG ? "/videos/cover.mp4" : undefined,
      })),
    videoNote: changelogVideoNote,
  };
}
