interface DCStructuredDataAuthor {
  image: string;
  name: string;
  url: string;
}

interface DCStructuredDataProps {
  author: DCStructuredDataAuthor;
  baseURL: string;
  dateModified?: string;
  datePublished?: string;
  description: string;
  image: string;
  path: string;
  title: string;
  type: "BlogPosting" | "WebPage";
}

export function DCStructuredData({
  author,
  baseURL,
  dateModified,
  datePublished,
  description,
  image,
  path,
  title,
  type,
}: DCStructuredDataProps) {
  const resolveURL = (value: string) => new URL(value, baseURL).toString();
  const pagePath = path === "/" || path.endsWith("/") ? path : `${path}/`;
  const structuredData = {
    "@context": "https://schema.org",
    "@type": type,
    url: resolveURL(pagePath),
    sameAs: [],
    headline: title,
    description,
    image: resolveURL(image),
    ...(datePublished ? { datePublished } : {}),
    ...(dateModified ? { dateModified } : {}),
    author: {
      "@type": "Person",
      name: author.name,
      url: resolveURL(author.url),
      image: {
        "@type": "ImageObject",
        url: resolveURL(author.image),
      },
    },
  };
  const serializedData = JSON.stringify(structuredData).replace(/</g, "\\u003c");

  return (
    <script id={`dc-schema-${type}-${path}`} type="application/ld+json">
      {serializedData}
    </script>
  );
}
