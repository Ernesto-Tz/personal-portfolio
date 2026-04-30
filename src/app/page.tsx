import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Reveal } from "@/components/Reveal";
import { AnimatedText } from "@/components/AnimatedText";
import { AccentText } from "@/components/AccentText";
import { AnimatedFirstName } from "@/components/AnimatedFirstName";
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
    <div className="flex items-center gap-3 mb-4">
      <span className="font-code text-[0.7rem] font-bold tracking-[0.25em] whitespace-nowrap" style={{ color: "#FF8303" }}>
        {number}
      </span>
      {label && (
        <span className="font-code text-[0.65rem] tracking-[0.2em] uppercase text-muted-foreground/60 whitespace-nowrap font-medium">
          {label}
        </span>
      )}
      <div
        className="flex-1 h-0.5"
        style={{
          background: "linear-gradient(to right, #FF8303, #FF8303 30%, transparent 100%)",
        }}
      />
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
          <p className="font-code text-[0.58rem] tracking-[0.22em] uppercase text-accent mb-4">
            {person.role}
          </p>
        </Reveal>

        <div className="text-display-sm md:text-display-md text-balance">
          <AnimatedText staggerChildren>
            Hello, I&apos;m
          </AnimatedText>
          <AnimatedFirstName firstName={person.firstName} delay={0.3} />
        </div>

        <Reveal translateY={8} delay={0.2}>
          <p className="text-lg text-muted-foreground max-w-[48ch] leading-relaxed text-balance">
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
              className="flex items-center gap-3 w-full bg-card border border-border rounded-lg px-5 py-4 transition-all duration-300 group motion-safe:hover:-translate-y-1"
              style={{
                borderLeftWidth: "2px",
                borderLeftColor: "#FFAF42",
              }}
            >
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0 animate-pulse"
                style={{
                  background: "#FFAF42",
                  boxShadow: "0 0 12px rgba(255, 175, 66, 0.8)",
                }}
              />
              <span className="font-code text-[0.6rem] tracking-[0.1em] text-muted-foreground uppercase font-medium">
                {pageSettings.featuredLabel}{" "}
                <strong className="ml-3 font-bold" style={{ color: "#FFAF42" }}>{pageSettings.featuredProject.title}</strong>
              </span>
              <span
                className="ml-auto transition-all duration-300 text-sm font-bold motion-safe:group-hover:translate-x-1"
                style={{ color: "#FFAF42" }}
              >
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
