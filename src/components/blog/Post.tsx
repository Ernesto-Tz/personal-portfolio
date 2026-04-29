"use client";

import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/app/utils/formatDate";
import { cn } from "@/lib/utils";
import { urlFor } from "@/sanity/lib/image";
import { SanityImageSource } from "@sanity/image-url";

interface SanityPost {
  _id: string;
  title: string;
  slug: string;
  summary: string;
  publishedAt: string;
  tag?: string;
  coverImage?: unknown;
}

interface PostProps {
  post: SanityPost;
  thumbnail: boolean;
  direction?: "row" | "column";
}

export default function Post({ post, thumbnail, direction }: PostProps) {
  const coverImageUrl =
    post.coverImage
      ? urlFor(post.coverImage as SanityImageSource).width(640).url()
      : null;

  return (
    <Link
      href={`/sports/${post.slug}`}
      className="group block w-full rounded-xl border border-border hover:border-border/80 hover:bg-secondary/40 transition-all duration-200"
    >
      <div
        className={cn(
          "relative flex",
          direction === "row" ? "flex-row" : "flex-col"
        )}
      >
        {coverImageUrl && thumbnail && (
          <div className="relative w-full aspect-video rounded-t-xl overflow-hidden">
            <Image
              src={coverImageUrl}
              alt={"Thumbnail of " + post.title}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 640px"
              className="object-cover"
            />
          </div>
        )}
        <div className="flex flex-col gap-1 p-5">
          <h2 className="text-base font-semibold text-balance leading-snug group-hover:text-primary transition-colors font-primary">
            {post.title}
          </h2>
          <p className="text-xs text-muted-foreground">
            {formatDate(post.publishedAt, false)}
          </p>
          {post.tag && (
            <Badge variant="secondary" className="w-fit mt-2 text-xs">
              {post.tag}
            </Badge>
          )}
        </div>
      </div>
    </Link>
  );
}
