import { baseURL, routes as routesConfig } from "@/app/resources";
import { sanityFetch } from "@/sanity/lib/client";
import {
  ALL_SPORTS_POST_SLUGS_QUERY,
  ALL_WORK_PROJECT_SLUGS_QUERY,
} from "@/sanity/lib/queries";

export default async function sitemap() {
  const [sportsPosts, workProjects] = await Promise.all([
    sanityFetch<{ slug: string }[]>({
      query: ALL_SPORTS_POST_SLUGS_QUERY,
      tags: ["sportsPost"],
    }),
    sanityFetch<{ slug: string }[]>({
      query: ALL_WORK_PROJECT_SLUGS_QUERY,
      tags: ["workProject"],
    }),
  ]);

  const sports = sportsPosts.map((post) => ({
    url: `${baseURL}sports/${post.slug}`,
    lastModified: new Date().toISOString().split("T")[0],
  }));

  const works = workProjects.map((project) => ({
    url: `${baseURL}work/${project.slug}`,
    lastModified: new Date().toISOString().split("T")[0],
  }));

  const activeRoutes = Object.keys(routesConfig).filter(
    (route) => routesConfig[route as keyof typeof routesConfig]
  );

  const routes = activeRoutes.map((route) => ({
    url: `${baseURL}${route !== "/" ? route : ""}`,
    lastModified: new Date().toISOString().split("T")[0],
  }));

  return [...routes, ...sports, ...works];
}
