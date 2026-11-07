import type { Metadata } from "next";

interface DCMetadataInput {
  baseURL: string;
  description: string;
  image: string;
  path: string;
  title: string;
}

export function createDCMetadata({
  baseURL,
  description,
  image,
  path,
  title,
}: DCMetadataInput): Metadata {
  const pagePath = path === "/" || path.endsWith("/") ? path : `${path}/`;
  const pageURL = new URL(pagePath, baseURL).toString();
  const imageURL = new URL(image, baseURL);

  return {
    title,
    description,
    alternates: { canonical: pageURL },
    openGraph: {
      type: "website",
      url: pageURL,
      title,
      description,
      images: [{ url: imageURL }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageURL],
    },
  };
}
