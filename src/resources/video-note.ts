import type { CommunityVideoNote } from "@/components/ui/notifications-menu";
import { brand } from "./content";

/** The pinned round video note, shared by Dashboard notifications and Home S3. */
export const changelogVideoNote: CommunityVideoNote = {
  avatar: brand.avatar,
  title: "Changelog Deploy",
  videoSrc: "/videos/cover2.mp4",
};
