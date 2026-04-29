"use client";

import Image from "next/image";

interface Skill {
  title: string;
  src: string;
  href: string;
}

interface SkillsMarqueeProps {
  skills: Skill[];
}

export function SkillsMarquee({ skills }: SkillsMarqueeProps) {
  return (
    <div
      className="relative overflow-hidden"
      style={{
        maskImage: "linear-gradient(90deg, transparent, black 10%, black 90%, transparent)",
        WebkitMaskImage: "linear-gradient(90deg, transparent, black 10%, black 90%, transparent)",
      }}
    >
      <div
        className="flex gap-6 w-max"
        style={{ animation: "marquee 25s linear infinite" }}
        onMouseEnter={(e) =>
          ((e.currentTarget as HTMLDivElement).style.animationPlayState = "paused")
        }
        onMouseLeave={(e) =>
          ((e.currentTarget as HTMLDivElement).style.animationPlayState = "running")
        }
      >
        {[...skills, ...skills].map((skill, i) => (
          <Image
            key={`${skill.title}-${i}`}
            src={skill.src}
            alt={skill.title}
            width={32}
            height={32}
            className="w-8 h-8 object-contain flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity"
            title={skill.title}
          />
        ))}
      </div>
    </div>
  );
}
