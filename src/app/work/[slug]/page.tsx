import { notFound } from "next/navigation";
import { PortableText, PortableTextBlock } from "@portabletext/react";
import { baseURL } from "@/app/resources";
import { formatDate } from "@/app/utils/formatDate";
import { JsonLd } from "@/components/JsonLd";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { Metadata } from "next";
import { SanityImageSource } from "@sanity/image-url";
import { sanityFetch } from "@/sanity/lib/client";
import { urlFor } from "@/sanity/lib/image";
import {
  WORK_PROJECT_BY_SLUG_QUERY,
  ALL_WORK_PROJECT_SLUGS_QUERY,
  ALL_SKILLS_QUERY,
  PERSON_QUERY,
} from "@/sanity/lib/queries";

export async function generateStaticParams(): Promise<{ slug: string }[]> {
  const projects = await sanityFetch<{ slug: string }[]>({
    query: ALL_WORK_PROJECT_SLUGS_QUERY,
    tags: ["workProject"],
  });
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = await sanityFetch<{
    title: string;
    summary: string;
    coverImage: SanityImageSource | null;
  } | null>({
    query: WORK_PROJECT_BY_SLUG_QUERY,
    params: { slug },
    tags: ["workProject"],
  });
  if (!project) return {};
  return {
    title: project.title,
    description: project.summary,
    openGraph: {
      title: project.title,
      description: project.summary,
      images: [
        project.coverImage
          ? urlFor(project.coverImage).width(1200).url()
          : `${baseURL}/og?title=${encodeURIComponent(project.title)}`,
      ],
    },
  };
}

export default async function WorkPost({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const [project, skills, person] = await Promise.all([
    sanityFetch<{
      _id: string;
      title: string;
      slug: string;
      summary: string;
      publishedAt: string;
      body: PortableTextBlock[];
    } | null>({
      query: WORK_PROJECT_BY_SLUG_QUERY,
      params: { slug },
      tags: ["workProject"],
    }),
    sanityFetch<{ _id: string; title: string; projects?: string[] }[]>({
      query: ALL_SKILLS_QUERY,
      tags: ["skill"],
    }),
    sanityFetch<{ name: string }>({
      query: PERSON_QUERY,
      tags: ["person"],
    }),
  ]);

  if (!project) notFound();

  const techSkills = skills.filter(
    (s) => Array.isArray(s.projects) && s.projects.includes(slug)
  );

  return (
    <div className="w-full max-w-screen-sm flex flex-col gap-6">
      <JsonLd
        type="WebPage"
        baseURL={baseURL}
        path={`/work/${project.slug}`}
        title={project.title}
        description={project.summary}
        image={`${baseURL}/og?title=${encodeURIComponent(project.title)}`}
        author={{
          name: person.name,
          url: `${baseURL}/about`,
          image: "",
        }}
      />
      <Button asChild variant="ghost" size="sm" className="w-fit -ml-2 gap-1 text-muted-foreground">
        <Link href="/work">
          <ChevronLeft className="h-4 w-4" />
          Work
        </Link>
      </Button>
      <h1 className="text-3xl font-bold font-primary">{project.title}</h1>
      <p className="text-sm text-muted-foreground">
        {project.publishedAt && formatDate(project.publishedAt)}
      </p>
      <article className="w-full prose prose-invert max-w-none">
        <PortableText value={project.body} />
      </article>
      {techSkills.length > 0 && (
        <div className="flex flex-col gap-4 mt-4">
          <h2 className="text-2xl font-bold font-primary">Technologies Used</h2>
          <div className="flex flex-wrap gap-2">
            {techSkills.map((skill) => (
              <Badge key={skill._id} variant="secondary">
                {skill.title}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
