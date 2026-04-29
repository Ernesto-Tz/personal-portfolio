"use client";

import Image from "next/image";
import Link from "next/link";
import { FileText, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface ProjectCardProps {
  href: string;
  priority?: boolean;
  images: string[];
  title: string;
  content: string;
  description: string;
  avatars: { src: string }[];
  link: string;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  href,
  priority,
  images = [],
  title,
  content,
  description,
  avatars,
  link,
}) => {
  return (
    <div className="w-full flex flex-col gap-4">
      {images[0] && (
        <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-border">
          <Image
            src={images[0]}
            alt={title}
            fill
            className="object-cover"
            sizes="(max-width: 960px) 100vw, 960px"
            priority={priority}
          />
        </div>
      )}
      <div className="flex flex-col sm:flex-row gap-6 px-2 py-2">
        {title && (
          <div className="flex-[5]">
            <h2 className="text-2xl font-bold text-balance font-primary leading-tight">
              {title}
            </h2>
          </div>
        )}
        {(avatars?.length > 0 || description?.trim() || content?.trim()) && (
          <div className="flex-[7] flex flex-col gap-4">
            {avatars?.length > 0 && (
              <div className="flex">
                {avatars.map((avatar, i) => (
                  <Avatar
                    key={i}
                    className="w-7 h-7 border-2 border-background"
                    style={{ marginLeft: i > 0 ? "-8px" : "0" }}
                  >
                    <AvatarImage src={avatar.src} />
                    <AvatarFallback>?</AvatarFallback>
                  </Avatar>
                ))}
              </div>
            )}
            {description?.trim() && (
              <p className="text-sm text-primary/70 text-balance leading-relaxed">
                {description}
              </p>
            )}
            <div className="flex flex-wrap gap-4">
              {content?.trim() && (
                <Button asChild variant="outline" size="sm" className="gap-2">
                  <Link href={href}>
                    <FileText className="h-3.5 w-3.5" />
                    Project experience
                  </Link>
                </Button>
              )}
              {link && (
                <Link
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Check the live project
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
