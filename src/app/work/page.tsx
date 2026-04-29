import { baseURL } from "@/app/resources";
import { Projects } from "@/components/work/Projects";
import { JsonLd } from "@/components/JsonLd";
import { Metadata } from "next";
import { sanityFetch } from "@/sanity/lib/client";
import { ALL_WORK_PROJECTS_QUERY, PERSON_QUERY } from "@/sanity/lib/queries";
import { SanityImageSource } from "@sanity/image-url";

export const metadata: Metadata = {
  title: "Projects — Ernesto Tzompantzi",
  description: "Collaborations & projects by Ernesto Tzompantzi",
  openGraph: {
    title: "Projects — Ernesto Tzompantzi",
    description: "Collaborations & projects by Ernesto Tzompantzi",
    url: `${baseURL}/work`,
    images: [`${baseURL}/og?title=${encodeURIComponent("Projects — Ernesto Tzompantzi")}`],
  },
};

export default async function Work() {
  const [projects, person] = await Promise.all([
    sanityFetch<{
      _id: string;
      title: string;
      slug: string;
      summary: string;
      publishedAt: string;
      coverImage: SanityImageSource | null;
      link?: string;
    }[]>({ query: ALL_WORK_PROJECTS_QUERY, tags: ["workProject"] }),
    sanityFetch<{ name: string }>({
      query: PERSON_QUERY,
      tags: ["person"],
    }),
  ]);

  return (
    <div className="w-full max-w-screen-md">
      <JsonLd
        type="WebPage"
        baseURL={baseURL}
        path="/work"
        title="Projects — Ernesto Tzompantzi"
        description="Collaborations & projects by Ernesto Tzompantzi"
        image={`${baseURL}/og?title=${encodeURIComponent("Projects — Ernesto Tzompantzi")}`}
        author={{
          name: person.name,
          url: `${baseURL}/about`,
          image: "",
        }}
      />
      <Projects projects={projects} />
    </div>
  );
}
