import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Reveal } from "@/components/Reveal";
import { Projects } from "@/components/work/Projects";
import { Posts } from "@/components/blog/Posts";
import { SkillsMarquee } from "@/components/SkillsMarquee";
import { JsonLd } from "@/components/JsonLd";
import { baseURL, routes } from "@/app/resources";
import { Metadata } from "next";
import { Mail } from "lucide-react";
import { SanityImageSource } from "@sanity/image-url";
import { sanityFetch } from "@/sanity/lib/client";
import { urlFor } from "@/sanity/lib/image";
import {
  PERSON_QUERY,
  ALL_SKILLS_QUERY,
  PAGE_SETTINGS_QUERY,
  ALL_WORK_PROJECTS_QUERY,
  ALL_SPORTS_POSTS_QUERY,
} from "@/sanity/lib/queries";

export const metadata: Metadata = {
  title: "Ernesto Tzompantzi's Portfolio",
  description: "Portfolio website showcasing my work as a Frontend Developer",
  openGraph: {
    title: "Ernesto Tzompantzi's Portfolio",
    description: "Portfolio website showcasing my work as a Frontend Developer",
    url: baseURL,
    images: ["/images/og/home.jpg"],
  },
};

function SectionMarker({ number, label }: { number: string; label?: string }) {
  return (
    <div className="flex items-center gap-3 mb-2">
      <span className="font-code text-[0.65rem] tracking-[0.25em] text-primary whitespace-nowrap">
        {number}
      </span>
      {label && (
        <span className="font-code text-[0.65rem] tracking-[0.2em] uppercase text-muted-foreground/40 whitespace-nowrap">
          {label}
        </span>
      )}
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}

export default async function Home() {
  const [person, skills, pageSettings, workProjects, sportsPosts] = await Promise.all([
    sanityFetch<{
      firstName: string;
      name: string;
      role: string;
      avatar: unknown;
      email: string;
    }>({ query: PERSON_QUERY, tags: ["person"] }),
    sanityFetch<{ _id: string; title: string; src: string; href: string }[]>({
      query: ALL_SKILLS_QUERY,
      tags: ["skill"],
    }),
    sanityFetch<{
      subline: string;
      contactCtaTitle: string;
      featuredLabel: string;
      featuredProject: { title: string; slug: string } | null;
      projectsSectionTitle: string;
      sportsSectionTitle: string;
    }>({ query: PAGE_SETTINGS_QUERY, tags: ["pageSettings"] }),
    sanityFetch<{
      _id: string;
      title: string;
      slug: string;
      summary: string;
      publishedAt: string;
      coverImage: SanityImageSource | null;
      link?: string;
    }[]>({ query: ALL_WORK_PROJECTS_QUERY, tags: ["workProject"] }),
    sanityFetch<{
      _id: string;
      title: string;
      slug: string;
      summary: string;
      publishedAt: string;
      tag?: string;
      coverImage: unknown;
    }[]>({ query: ALL_SPORTS_POSTS_QUERY, tags: ["sportsPost"] }),
  ]);

  const avatarUrl = person.avatar ? urlFor(person.avatar).width(200).url() : "";

  return (
    <div className="w-full max-w-screen-md flex flex-col gap-20 items-center pb-20">
      <JsonLd
        type="WebPage"
        baseURL={baseURL}
        path="/"
        title="Ernesto Tzompantzi's Portfolio"
        description="Portfolio website showcasing my work as a Frontend Developer"
        image={`${baseURL}/og?title=${encodeURIComponent("Ernesto Tzompantzi's Portfolio")}`}
        author={{
          name: person.name,
          url: `${baseURL}/about`,
          image: avatarUrl,
        }}
      />

      {/* 01 · HERO */}
      <div className="w-full flex flex-col gap-6 pt-8">
        <SectionMarker number="01" label="Introduction" />

        <Reveal translateY={4}>
          <p className="font-code text-[0.58rem] tracking-[0.22em] uppercase text-accent mb-3">
            {person.role}
          </p>
          <h1
            className="text-5xl sm:text-6xl tracking-[-0.025em] text-balance font-primary"
            style={{ lineHeight: "1.0" }}
          >
            <span style={{ fontWeight: 700 }}>Hello, I&apos;m </span>
            <em style={{ fontStyle: "italic", fontWeight: 300, color: "hsl(var(--primary))" }}>
              {person.firstName}
            </em>
          </h1>
        </Reveal>

        <Reveal translateY={8} delay={0.2}>
          <p className="text-base text-muted-foreground max-w-[48ch] leading-relaxed text-balance">
            {pageSettings.subline}
          </p>
        </Reveal>

        <Reveal delay={0.4}>
          <div className="flex flex-wrap gap-3 pt-2">
            <Button
              asChild
              className="rounded-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Link href={`mailto:${person.email}`}>
                <Mail className="h-4 w-4" />
                {pageSettings.contactCtaTitle}
              </Link>
            </Button>
            <Button asChild variant="outline" className="rounded-full gap-2">
              <Link href="/about">
                <Avatar className="w-5 h-5 -ml-1">
                  <AvatarImage src={avatarUrl} alt={person.name} />
                  <AvatarFallback>{person.firstName[0]}</AvatarFallback>
                </Avatar>
                More about me
              </Link>
            </Button>
          </div>
        </Reveal>

        {pageSettings.featuredProject && (
          <Reveal delay={0.5}>
            <Link
              href={`/work/${pageSettings.featuredProject.slug}`}
              className="flex items-center gap-3 w-full bg-card border border-border rounded-md px-4 py-3 hover:bg-secondary transition-colors group"
              style={{ borderLeftWidth: "2px", borderLeftColor: "hsl(var(--accent))" }}
            >
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{
                  background: "hsl(var(--accent))",
                  boxShadow: "0 0 6px hsl(var(--accent) / 0.6)",
                }}
              />
              <span className="font-code text-[0.55rem] tracking-[0.08em] text-muted-foreground">
                {pageSettings.featuredLabel}{" "}
                <strong className="ml-4">{pageSettings.featuredProject.title}</strong>
              </span>
              <span className="ml-auto text-muted-foreground/40 group-hover:text-muted-foreground transition-colors text-xs">
                →
              </span>
            </Link>
          </Reveal>
        )}
      </div>

      {/* 02 · SKILLS */}
      <div className="w-full flex flex-col gap-6">
        <SectionMarker number="02" label="Skills & Tools" />
        <Reveal translateY={8} delay={0.1}>
          <SkillsMarquee skills={skills} />
        </Reveal>
      </div>

      {/* 03 · SELECTED WORK */}
      <div className="w-full flex flex-col gap-6">
        <SectionMarker number="03" label={pageSettings.projectsSectionTitle} />
        <Reveal translateY={16} delay={0.15}>
          <Projects projects={workProjects} range={[1, 2]} />
        </Reveal>
      </div>

      {/* 04 · FROM SPORTS */}
      {(routes as Record<string, boolean>)["/sports"] && (
        <div className="w-full flex flex-col gap-6">
          <SectionMarker number="04" label={pageSettings.sportsSectionTitle} />
          <Posts posts={sportsPosts} range={[1, 2]} columns="2" />
        </div>
      )}
    </div>
  );
}
