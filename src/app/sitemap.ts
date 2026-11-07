import { baseURL, routes as routesConfig } from "@/resources";
import { marketplaceItems } from "@/resources/marketplace";
import { getMDXContent } from "@/utils/utils";

export const dynamic = "force-static";

export default async function sitemap() {
  const works = getMDXContent("src/app/community/projects").map((post) => ({
    url: `${baseURL}/community/${post.slug}/`,
    lastModified: post.metadata.publishedAt,
  }));

  const activeRoutes = Object.keys(routesConfig).filter(
    (route) => routesConfig[route as keyof typeof routesConfig],
  );

  const routes = activeRoutes.map((route) => ({
    url: route === "/" ? `${baseURL}/` : `${baseURL}${route}/`,
  }));

  const itemMarkets = marketplaceItems.map((item) => ({
    url: `${baseURL}/market/${item.id}/`,
  }));

  return [...routes, ...itemMarkets, ...works];
}
