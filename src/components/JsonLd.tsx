interface WebPageJsonLdProps {
  type: "WebPage" | "BlogPosting";
  baseURL: string;
  path: string;
  title: string;
  description: string;
  image?: string;
  datePublished?: string;
  dateModified?: string;
  author: {
    name: string;
    url: string;
    image: string;
  };
}

export function JsonLd({
  type,
  baseURL,
  path,
  title,
  description,
  image,
  datePublished,
  dateModified,
  author,
}: WebPageJsonLdProps) {
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": type,
    url: `${baseURL}${path}`,
    name: title,
    description,
    ...(image && { image }),
    ...(datePublished && { datePublished }),
    ...(dateModified && { dateModified }),
    author: {
      "@type": "Person",
      name: author.name,
      url: author.url,
      image: author.image,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
