"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface TocItem {
  title: string;
  display: boolean;
  items: string[];
}

interface TableOfContentsProps {
  structure: TocItem[];
  about: { tableOfContent: { display: boolean; subItems: boolean } };
}

export default function TableOfContents({ structure, about }: TableOfContentsProps) {
  const [active, setActive] = useState<string>("");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActive(entry.target.id);
          }
        }
      },
      { rootMargin: "-30% 0px -60% 0px" }
    );

    structure
      .filter((item) => item.display)
      .forEach((item) => {
        const el = document.getElementById(item.title);
        if (el) observer.observe(el);
        if (about.tableOfContent.subItems) {
          item.items.forEach((sub) => {
            const subEl = document.getElementById(sub);
            if (subEl) observer.observe(subEl);
          });
        }
      });

    return () => observer.disconnect();
  }, [structure, about.tableOfContent.subItems]);

  return (
    <nav className="flex flex-col gap-2">
      {structure
        .filter((item) => item.display)
        .map((item) => (
          <div key={item.title} className="flex flex-col gap-1">
            <a
              href={`#${item.title}`}
              className={cn(
                "text-xs transition-colors [&:hover]:!text-[#FF8303]",
                active === item.title ? "text-foreground font-medium" : "text-muted-foreground"
              )}
            >
              {item.title}
            </a>
            {about.tableOfContent.subItems &&
              item.items.map((sub) => (
                <a
                  key={sub}
                  href={`#${sub}`}
                  className={cn(
                    "text-xs pl-3 transition-colors [&:hover]:!text-[#FF8303]",
                    active === sub ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {sub}
                </a>
              ))}
          </div>
        ))}
    </nav>
  );
}
