import { baseURL } from "@/app/resources";
import { Posts } from "@/components/blog/Posts";
import { Metadata } from "next";
import { sanityFetch } from "@/sanity/lib/client";
import { ALL_SPORTS_POSTS_QUERY } from "@/sanity/lib/queries";
import { SanityImageSource } from "@sanity/image-url";

export const metadata: Metadata = {
  title: "Sports — Ernesto Tzompantzi",
  description: "My thoughts on sports, running, and more",
  openGraph: {
    title: "Sports — Ernesto Tzompantzi",
    description: "My thoughts on sports, running, and more",
    url: `${baseURL}/sports`,
  },
};

export default async function Sports() {
  const posts = await sanityFetch<{
    _id: string;
    title: string;
    slug: string;
    summary: string;
    publishedAt: string;
    tag?: string;
    coverImage?: SanityImageSource;
  }[]>({ query: ALL_SPORTS_POSTS_QUERY, tags: ["sportsPost"] });

  return (
    <div className="w-full max-w-screen-md flex flex-col gap-8">
      <h1 className="text-3xl font-bold font-primary">Sports</h1>
      <Posts posts={posts} thumbnail columns="1" />
    </div>
  );
}
