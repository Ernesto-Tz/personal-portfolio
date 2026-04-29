// IMPORTANT: Replace with your own domain address - it's used for SEO in meta tags and schema
const baseURL = "https://ernesto-tzompantzi.com/";

const routes = {
  "/": true,
  "/about": true,
  "/work": true,
  "/sports": true,
  "/gallery": true,
};

// Enable password protection on selected routes
// Set password in the .env file, refer to .env.example
const protectedRoutes = {
  "/work/automate-design-handovers-with-a-figma-to-code-pipeline": true,
};

import { Fraunces } from "next/font/google";
import { Instrument_Sans } from "next/font/google";
import { JetBrains_Mono } from "next/font/google";

const primaryFont = Fraunces({
  variable: "--font-primary",
  subsets: ["latin"],
  display: "swap",
});

const secondaryFont = Instrument_Sans({
  variable: "--font-secondary",
  subsets: ["latin"],
  display: "swap",
});

const monoFont = JetBrains_Mono({
  variable: "--font-code",
  subsets: ["latin"],
  display: "swap",
});

const font = {
  primary: primaryFont,
  secondary: secondaryFont,
  tertiary: primaryFont,
  code: monoFont,
};

const display = {
  location: true,
  time: true,
  themeSwitcher: true,
};

const nav = {
  timezone: "Europe/Budapest",
  aboutLabel: "About",
  workLabel: "Work",
  sportsLabel: "Sports",
};

const site = {
  title: "Ernesto Tzompantzi's Portfolio",
  description: "Portfolio website showcasing my work as a Frontend Developer",
  image: "/images/og/home.jpg",
};

export { routes, protectedRoutes, display, baseURL, font, nav, site };
