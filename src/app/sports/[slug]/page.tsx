import { notFound } from "next/navigation";
import { PortableText, PortableTextBlock } from "@portabletext/react";
import { baseURL } from "@/app/resources";
import { formatDate } from "@/app/utils/formatDate";
import { JsonLd } from "@/components/JsonLd";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { Metadata } from "next";
import { SanityImageSource } from "@sanity/image-url";
import { sanityFetch } from "@/sanity/lib/client";
import { urlFor } from "@/sanity/lib/image";
import {
  SPORTS_POST_BY_SLUG_QUERY,
  ALL_SPORTS_POST_SLUGS_QUERY,
  PERSON_QUERY,
} from "@/sanity/lib/queries";

export async function generateStaticParams(): Promise<{ slug: string }[]> {
  const posts = await sanityFetch<{ slug: string }[]>({
    query: ALL_SPORTS_POST_SLUGS_QUERY,
    tags: ["sportsPost"],
  });
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await sanityFetch<{
    title: string;
    summary: string;
    coverImage?: SanityImageSource;
  } | null>({
    query: SPORTS_POST_BY_SLUG_QUERY,
    params: { slug },
    tags: ["sportsPost"],
  });
  if (!post) return {};
  return {
    title: post.title,
    description: post.summary,
    openGraph: {
      title: post.title,
      description: post.summary,
      images: [
        post.coverImage
          ? urlFor(post.coverImage).width(1200).url()
          : `${baseURL}/og?title=${encodeURIComponent(post.title)}`,
      ],
    },
  };
}

export default async function SportsPost({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const [post, person] = await Promise.all([
    sanityFetch<{
      _id: string;
      title: string;
      slug: string;
      summary: string;
      publishedAt: string;
      body: PortableTextBlock[];
    } | null>({
      query: SPORTS_POST_BY_SLUG_QUERY,
      params: { slug },
      tags: ["sportsPost"],
    }),
    sanityFetch<{ name: string; avatar: SanityImageSource | null }>({
      query: PERSON_QUERY,
      tags: ["person"],
    }),
  ]);

  if (!post) notFound();

  const avatarUrl = person.avatar ? urlFor(person.avatar).width(200).url() : "";

  return (
    <div className="w-full flex justify-center">
      <div className="w-full max-w-screen-sm flex flex-col gap-6">
        <JsonLd
          type="BlogPosting"
          baseURL={baseURL}
          path={`/sports/${post.slug}`}
          title={post.title}
          description={post.summary}
          datePublished={post.publishedAt}
          dateModified={post.publishedAt}
          image={`${baseURL}/og?title=${encodeURIComponent(post.title)}`}
          author={{
            name: person.name,
            url: `${baseURL}/about`,
            image: avatarUrl,
          }}
        />
        <Button asChild variant="ghost" size="sm" className="w-fit -ml-2 gap-1 text-muted-foreground">
          <Link href="/sports">
            <ChevronLeft className="h-4 w-4" />
            Sports
          </Link>
        </Button>
        <h1 className="text-3xl font-bold font-primary">{post.title}</h1>
        <div className="flex items-center gap-3">
          <Avatar className="w-6 h-6 border-2 border-background">
            <AvatarImage src={avatarUrl} />
            <AvatarFallback>{person.name[0]}</AvatarFallback>
          </Avatar>
          <p className="text-sm text-muted-foreground">
            {post.publishedAt && formatDate(post.publishedAt)}
          </p>
        </div>
        <article className="w-full prose prose-invert max-w-none">
          <PortableText value={post.body} />
        </article>
      </div>
    </div>
  );
}
