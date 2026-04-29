import Post from "./Post";
import { cn } from "@/lib/utils";

interface SanityPost {
  _id: string;
  title: string;
  slug: string;
  summary: string;
  publishedAt: string;
  tag?: string;
  coverImage?: unknown;
}

interface PostsProps {
  posts?: SanityPost[];
  range?: [number, number?];
  columns?: "1" | "2" | "3";
  thumbnail?: boolean;
  direction?: "row" | "column";
}

export function Posts({
  posts = [],
  range,
  columns = "1",
  thumbnail = false,
  direction,
}: PostsProps) {
  const displayed = range
    ? posts.slice(range[0] - 1, range[1] ?? posts.length)
    : posts;

  const gridCols =
    columns === "2"
      ? "grid-cols-1 sm:grid-cols-2"
      : columns === "3"
      ? "grid-cols-1 sm:grid-cols-3"
      : "grid-cols-1";

  if (displayed.length === 0) return null;

  return (
    <div className={cn("grid gap-3 w-full mb-10", gridCols)}>
      {displayed.map((post) => (
        <Post
          key={post._id}
          post={post}
          thumbnail={thumbnail}
          direction={direction}
        />
      ))}
    </div>
  );
}
