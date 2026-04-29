import Link from "next/link";
import { FaGithub, FaLinkedin, FaXTwitter } from "react-icons/fa6";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { sanityFetch } from "@/sanity/lib/client";
import { PERSON_QUERY, SOCIAL_LINKS_QUERY } from "@/sanity/lib/queries";

const iconMap: Record<string, React.ElementType> = {
  github: FaGithub,
  linkedin: FaLinkedin,
  email: Mail,
  x: FaXTwitter,
};

export const Footer = async () => {
  const [person, socialLinks] = await Promise.all([
    sanityFetch<{ name: string }>({ query: PERSON_QUERY, tags: ["person"] }),
    sanityFetch<{ _id: string; name: string; icon: string; link: string }[]>({
      query: SOCIAL_LINKS_QUERY,
      tags: ["socialLink"],
    }),
  ]);

  const currentYear = new Date().getFullYear();

  return (
    <>
      <div className="h-20 sm:hidden" />
      <footer className="w-full flex justify-center px-2 py-2">
        <div className="w-full max-w-screen-md flex items-center justify-between px-4 py-2">
          <p className="text-xs text-muted-foreground">
            © {currentYear} / <span className="text-foreground">{person.name}</span>
          </p>
          <div className="flex gap-1">
            {socialLinks.map((item) => {
              if (!item.link) return null;
              const Icon = iconMap[item.icon] ?? Mail;
              return (
                <Button
                  key={item._id}
                  asChild
                  variant="ghost"
                  size="icon"
                  className="w-7 h-7 text-muted-foreground hover:text-foreground"
                >
                  <Link href={item.link} target="_blank" rel="noopener noreferrer" aria-label={item.name}>
                    <Icon className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              );
            })}
          </div>
        </div>
      </footer>
    </>
  );
};
