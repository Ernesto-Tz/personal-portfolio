"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Home, User, LayoutGrid, Dumbbell } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { routes, display, nav } from "@/app/resources";
import { ThemeToggle } from "./ThemeToggle";

type TimeDisplayProps = { timeZone: string; locale?: string };

const TimeDisplay: React.FC<TimeDisplayProps> = ({ timeZone, locale = "en-GB" }) => {
  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        timeZone,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      };
      setCurrentTime(new Intl.DateTimeFormat(locale, options).format(now));
    };
    updateTime();
    const id = setInterval(updateTime, 1000);
    return () => clearInterval(id);
  }, [timeZone, locale]);

  return <>{currentTime}</>;
};

function NavButton({
  href,
  selected,
  icon: Icon,
  label,
}: {
  href: string;
  selected: boolean;
  icon: React.ElementType;
  label: string;
}) {
  return (
    <>
      <Button
        asChild
        variant="ghost"
        size="sm"
        className={cn(
          "hidden sm:flex gap-1.5 text-xs font-normal h-8 px-3",
          selected
            ? "bg-secondary text-foreground"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <Link href={href}>
          <Icon className="h-3.5 w-3.5" />
          {label}
        </Link>
      </Button>
      <Button
        asChild
        variant="ghost"
        size="icon"
        className={cn(
          "sm:hidden w-8 h-8",
          selected
            ? "bg-secondary text-foreground"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <Link href={href}>
          <Icon className="h-4 w-4" />
        </Link>
      </Button>
    </>
  );
}

export const Header = () => {
  const pathname = usePathname() ?? "";

  return (
    <>
      <div className="hidden sm:block fixed top-0 left-0 right-0 h-20 bg-gradient-to-b from-background to-transparent z-[9] pointer-events-none" />
      <div className="sm:hidden fixed bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-background to-transparent z-[9] pointer-events-none" />

      <header className="sticky top-0 sm:relative z-[9] w-full flex items-center justify-center px-2 py-2">
        <div className="flex-1 hidden sm:flex pl-3 text-xs text-muted-foreground">
          {display.location && nav.timezone}
        </div>

        <div className="flex items-center bg-card border border-border rounded-[10px] shadow-lg px-1 py-1 gap-1">
          {routes["/"] && (
            <NavButton href="/" selected={pathname === "/"} icon={Home} label="Home" />
          )}
          <Separator orientation="vertical" className="h-5 mx-0.5" />
          {routes["/about"] && (
            <NavButton href="/about" selected={pathname === "/about"} icon={User} label={nav.aboutLabel} />
          )}
          {routes["/work"] && (
            <NavButton href="/work" selected={pathname.startsWith("/work")} icon={LayoutGrid} label={nav.workLabel} />
          )}
          {routes["/sports"] && (
            <NavButton href="/sports" selected={pathname.startsWith("/sports")} icon={Dumbbell} label={nav.sportsLabel} />
          )}
          {display.themeSwitcher && (
            <>
              <Separator orientation="vertical" className="h-5 mx-0.5" />
              <ThemeToggle />
            </>
          )}
        </div>

        <div className="flex-1 hidden sm:flex justify-end pr-3 text-xs text-muted-foreground">
          {display.time && <TimeDisplay timeZone={nav.timezone} />}
        </div>
      </header>
    </>
  );
};

export default TimeDisplay;
