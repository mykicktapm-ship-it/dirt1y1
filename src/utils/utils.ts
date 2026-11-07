import fs from "node:fs";
import path from "node:path";
import type { MDXDocument, MDXMetadata, TeamMember } from "@/types";
import matter from "gray-matter";
import { notFound } from "next/navigation";

function getMDXFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) {
    return [];
  }
  return fs
    .readdirSync(dir)
    .filter((file) => path.extname(file) === ".mdx")
    .sort((left, right) => left.localeCompare(right));
}

function readMDXFile(filePath: string): { metadata: MDXMetadata; content: string } {
  if (!fs.existsSync(filePath)) {
    notFound();
  }

  const rawContent = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(rawContent);

  const metadata: MDXMetadata = {
    title: data.title || "",
    subtitle: data.subtitle || "",
    publishedAt: data.publishedAt,
    summary: data.summary || "",
    image: data.image || "",
    images: data.images || [],
    tag: data.tag || [],
    team: (data.team || []) as TeamMember[],
    link: data.link || "",
  };

  return { metadata, content };
}

/**
 * Universal MDX content loader — parses any folder of .mdx files.
 * @param directory — path relative to project root, e.g. "src/app/blog/posts"
 */
export function getMDXContent(directory: string): MDXDocument[] {
  const dir = path.join(process.cwd(), directory);
  const mdxFiles = getMDXFiles(dir);
  return mdxFiles.map((file) => {
    const { metadata, content } = readMDXFile(path.join(dir, file));
    const slug = path.basename(file, path.extname(file));
    return { metadata, slug, content };
  });
}

export function createArticleExcerpt(content: string, maximumLength = 160): string {
  const text = content
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/[`*_>#~]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (text.length <= maximumLength) {
    return text;
  }

  const candidate = text.slice(0, maximumLength + 1);
  const wordBoundary = candidate.lastIndexOf(" ");
  return candidate.slice(0, wordBoundary > 0 ? wordBoundary : maximumLength).trim();
}

/** @deprecated Use getMDXContent(directory) instead */
export const getPosts = getMDXContent;
