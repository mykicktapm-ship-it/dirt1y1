// Generates static rss.xml for IPFS/static hosting
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

// --- Public feed configuration (mirrors dc.config.ts + content.tsx) ---
function readPublicOrigin(value) {
  const url = new URL(value?.trim() || "https://dirtycoin.sol");
  const isLoopback = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  const validProtocol = url.protocol === "https:" || (url.protocol === "http:" && isLoopback);
  if (
    !validProtocol ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  ) {
    throw new TypeError("NEXT_PUBLIC_SITE_URL must be an HTTPS origin");
  }
  return url.origin;
}

const baseURL = readPublicOrigin(process.env.NEXT_PUBLIC_SITE_URL);
const blog = {
  title: "$Dirtycoin's Blog",
  description: "Dirtycoin community research and product updates",
};
const person = { avatar: "/images/avatar.jpg", locale: "en" };

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function escapeCdata(value) {
  return String(value).replaceAll("]]>", "]]]]><![CDATA[>");
}

// --- Read MDX posts ---
function getMDXFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((file) => path.extname(file) === ".mdx")
    .sort((left, right) => left.localeCompare(right));
}

function readMDXFile(filePath) {
  const raw = fs.readFileSync(filePath, "utf-8");
  const { data } = matter(raw);
  const publishedAt = new Date(data.publishedAt);
  if (!data.publishedAt || Number.isNaN(publishedAt.getTime())) {
    throw new TypeError(`${filePath} must define a valid publishedAt date`);
  }
  return { metadata: data, publishedAt, slug: path.basename(filePath, ".mdx") };
}

const postsDir = path.join(root, "src", "app", "community", "projects");
const posts = getMDXFiles(postsDir)
  .map((f) => readMDXFile(path.join(postsDir, f)))
  .sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());

// --- Generate XML ---
const items = posts
  .map(
    (post) => `
    <item>
      <title>${escapeXml(post.metadata.title)}</title>
      <link>${baseURL}/community/${escapeXml(post.slug)}/</link>
      <guid>${baseURL}/community/${escapeXml(post.slug)}/</guid>
      <pubDate>${post.publishedAt.toUTCString()}</pubDate>
      <description><![CDATA[${escapeCdata(post.metadata.summary || "")}]]></description>
      ${post.metadata.tag ? `<category>${escapeXml(post.metadata.tag)}</category>` : ""}
    </item>`,
  )
  .join("");

const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${blog.title}</title>
    <link>${baseURL}/community/</link>
    <description>${blog.description}</description>
    <language>${person.locale || "en"}</language>
    ${posts[0] ? `<lastBuildDate>${posts[0].publishedAt.toUTCString()}</lastBuildDate>` : ""}
    <atom:link href="${baseURL}/rss.xml" rel="self" type="application/rss+xml" />
    <image>
      <url>${baseURL}${person.avatar}</url>
      <title>${blog.title}</title>
      <link>${baseURL}/community/</link>
    </image>
    ${items}
  </channel>
</rss>`;

const outPath = path.join(root, "public", "rss.xml");
fs.writeFileSync(outPath, rssXml, "utf-8");
console.log(`RSS generated: ${outPath} (${posts.length} posts)`);
