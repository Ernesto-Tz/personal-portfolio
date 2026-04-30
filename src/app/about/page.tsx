import Image from "next/image";
import Link from "next/link";
import { Globe, Mail } from "lucide-react";
import { FaGithub, FaLinkedin, FaXTwitter } from "react-icons/fa6";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import TableOfContents from "@/components/about/TableOfContents";
import { JsonLd } from "@/components/JsonLd";
import { baseURL } from "@/app/resources";
import { Metadata } from "next";
import React from "react";
import { PortableText, PortableTextBlock } from "@portabletext/react";
import { SanityImageSource } from "@sanity/image-url";
import { sanityFetch } from "@/sanity/lib/client";
import { urlFor } from "@/sanity/lib/image";
import {
  PERSON_QUERY,
  ALL_SKILLS_QUERY,
  WORK_EXPERIENCE_QUERY,
  SOCIAL_LINKS_QUERY,
} from "@/sanity/lib/queries";

const iconMap: Record<string, React.ElementType> = {
  github: FaGithub,
  linkedin: FaLinkedin,
  email: Mail,
  x: FaXTwitter,
};

export const metadata: Metadata = {
  title: "More about me 😎",
  description: "Meet Ernesto Tzompantzi, Frontend Developer",
  openGraph: {
    title: "More about me 😎",
    description: "Meet Ernesto Tzompantzi, Frontend Developer",
    url: `${baseURL}/about`,
    images: [`${baseURL}/og?title=${encodeURIComponent("More about me 😎")}`],
  },
};

function SectionDivider({ number, label }: { number: string; label: string }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <span className="font-code text-[0.7rem] font-bold tracking-[0.25em] whitespace-nowrap" style={{ color: "#FF8303" }}>
        {number}
      </span>
      <span className="font-code text-[0.65rem] tracking-[0.2em] uppercase text-muted-foreground/60 whitespace-nowrap font-medium">
        {label}
      </span>
      <div
        className="flex-1 h-0.5"
        style={{
          background: "linear-gradient(to right, #FF8303, #FF8303 30%, transparent 100%)",
        }}
      />
    </div>
  );
}

export default async function About() {
  const [person, skills, workExperiences, socialLinks] = await Promise.all([
    sanityFetch<{
      firstName: string;
      name: string;
      role: string;
      avatar: SanityImageSource;
      location: string;
      languages: string[];
      introText: PortableTextBlock[];
    }>({ query: PERSON_QUERY, tags: ["person"] }),
    sanityFetch<{ _id: string; title: string; src: string; href: string }[]>({
      query: ALL_SKILLS_QUERY,
      tags: ["skill"],
    }),
    sanityFetch<{
      _id: string;
      company: string;
      timeframe: string;
      role: string;
      achievements: PortableTextBlock[];
    }[]>({ query: WORK_EXPERIENCE_QUERY, tags: ["workExperience"] }),
    sanityFetch<{ _id: string; name: string; icon: string; link: string }[]>({
      query: SOCIAL_LINKS_QUERY,
      tags: ["socialLink"],
    }),
  ]);

  const avatarUrl = person.avatar ? urlFor(person.avatar).width(400).url() : "";

  const structure = [
    { title: "Introduction", display: true, items: [] },
    { title: "Work Experience", display: true, items: workExperiences.map((e) => e.company) },
    { title: "Studies", display: true, items: ["Obuda University, Hungary"] },
    { title: "Technical skills", display: true, items: skills.map((s) => s.title) },
  ];

  return (
    <div className="w-full max-w-screen-md">
      <JsonLd
        type="WebPage"
        baseURL={baseURL}
        path="/about"
        title="More about me 😎"
        description="Meet Ernesto Tzompantzi, Frontend Developer"
        image={`${baseURL}/og?title=${encodeURIComponent("More about me 😎")}`}
        author={{
          name: person.name,
          url: `${baseURL}/about`,
          image: avatarUrl,
        }}
      />

      {/* Fixed ToC sidebar */}
      <div className="fixed left-0 top-1/2 -translate-y-1/2 pl-6 gap-8 hidden lg:flex flex-col">
        <TableOfContents
          structure={structure}
          about={{
            tableOfContent: { display: true, subItems: false },
          }}
        />
      </div>

      <div className="flex flex-col sm:flex-row justify-center gap-8">
        {/* Sticky avatar column */}
        <div className="sm:sticky sm:top-20 flex flex-col items-center gap-3 min-w-[160px] px-4 pb-8 self-start">
          <Avatar className="w-24 h-24">
            <AvatarImage src={avatarUrl} alt={person.name} />
            <AvatarFallback>{person.firstName[0]}</AvatarFallback>
          </Avatar>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Globe className="h-3.5 w-3.5" />
            {person.location}
          </div>
          {person.languages.length > 0 && (
            <div className="flex flex-wrap gap-1.5 justify-center">
              {person.languages.map((lang) => (
                <Badge key={lang} variant="secondary" className="text-xs">
                  {lang}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Main content */}
        <div className="flex-[9] max-w-[640px] flex flex-col">
          {/* Hero */}
          <div id="Introduction" className="min-h-[160px] flex flex-col justify-center mb-8">
            <h1 className="text-4xl font-bold font-primary">{person.name}</h1>
            <p className="text-lg font-code tracking-[0.15em] mt-1 uppercase text-sm font-medium" style={{ color: "#FF8303" }}>{person.role}</p>
            {socialLinks.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-5">
                {socialLinks.map((item) => {
                  if (!item.link) return null;
                  const Icon = iconMap[item.icon] ?? Mail;
                  return (
                    <React.Fragment key={item.name}>
                      <Button asChild variant="secondary" size="sm" className="hidden sm:flex gap-1.5 text-xs">
                        <Link href={item.link} target="_blank" rel="noopener noreferrer">
                          <Icon className="h-3.5 w-3.5" />
                          {item.name}
                        </Link>
                      </Button>
                      <Button asChild variant="secondary" size="icon" className="sm:hidden w-8 h-8">
                        <Link href={item.link} target="_blank" rel="noopener noreferrer" aria-label={item.name}>
                          <Icon className="h-4 w-4" />
                        </Link>
                      </Button>
                    </React.Fragment>
                  );
                })}
              </div>
            )}
          </div>

          {/* Intro */}
          <>
            <SectionDivider number="01" label="Introduction" />
            <div className="text-base leading-relaxed mb-10 flex flex-col gap-4">
              <PortableText value={person.introText} />
            </div>
          </>

          {/* Work Experience */}
          <>
            <SectionDivider number="02" label="Work Experience" />
            <h2 id="Work Experience" className="text-2xl font-bold font-primary mb-4" style={{ color: "#005B96" }}>
              Work Experience
            </h2>
            <div className="flex flex-col gap-8 mb-10">
              {workExperiences.map((exp) => (
                <div key={exp._id} className="flex flex-col">
                  <div className="flex justify-between items-end mb-1 flex-wrap gap-1">
                    <span id={exp.company} className="text-base font-semibold">
                      {exp.role}
                    </span>
                    <span className="text-xs text-muted-foreground">{exp.timeframe}</span>
                  </div>
                  <span className="text-sm font-medium mb-3" style={{ color: "#FF8303" }}>{exp.company}</span>
                  <div className="text-sm text-foreground/80 leading-relaxed flex flex-col gap-3">
                    <PortableText value={exp.achievements} />
                  </div>
                </div>
              ))}
            </div>
          </>

          {/* Studies */}
          <>
            <SectionDivider number="03" label="Studies" />
            <h2 id="Studies" className="text-2xl font-bold font-primary mb-4">
              Studies
            </h2>
            <div className="flex flex-col gap-6 mb-10">
              <div className="flex flex-col gap-1">
                <div className="flex justify-between items-end flex-wrap gap-1">
                  <span id="Obuda University, Hungary" className="text-base font-semibold">
                    Bachelor of Computer Science Engineering
                  </span>
                  <span className="text-xs text-muted-foreground">SEP 2017 - DIC 2021</span>
                </div>
                <span className="text-sm font-medium" style={{ color: "#FF8303" }}>Obuda University, Hungary</span>
              </div>
            </div>
          </>

          {/* Technical skills */}
          <>
            <SectionDivider number="04" label="Technical skills" />
            <h2 id="Technical skills" className="text-2xl font-bold font-primary mb-8">
              Technical skills
            </h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 mb-10">
              {skills.map((skill) => (
                <Link
                  key={skill._id}
                  href={skill.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center gap-2 p-4 rounded-xl border border-transparent transition-all duration-300 hover:border-orange-500/50 hover:bg-orange-500/10 hover:shadow-lg hover:shadow-orange-500/20"
                  title={skill.title}
                >
                  <Image
                    src={skill.src}
                    alt={skill.title}
                    width={40}
                    height={40}
                    className="w-10 h-10 object-contain"
                  />
                  <span className="text-xs text-muted-foreground text-center">{skill.title}</span>
                </Link>
              ))}
            </div>
          </>
        </div>
      </div>
    </div>
  );
}
