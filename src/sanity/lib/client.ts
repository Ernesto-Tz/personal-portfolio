import { createClient } from "next-sanity";
import { cache } from "react";
import { apiVersion, dataset, projectId } from "../env";

export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: true,
});

export const sanityFetch = cache(
  async <T>({
    query,
    params = {},
    tags,
  }: {
    query: string;
    params?: Record<string, unknown>;
    tags?: string[];
  }): Promise<T> => {
    return client.fetch<T>(query, params, {
      next: { tags },
    });
  }
);
