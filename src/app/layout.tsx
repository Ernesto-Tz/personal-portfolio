// src/app/layout.tsx
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

import { ThemeProvider } from "next-themes";
import { Footer, Header, RouteGuard } from "@/components";
import { baseURL, font, site } from "@/app/resources";
import { Background } from "@/components/Background";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: site.title,
  description: site.description,
  metadataBase: new URL(baseURL),
  openGraph: {
    title: site.title,
    description: site.description,
    url: baseURL,
    images: [site.image],
  },
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={[
        font.primary.variable,
        font.secondary.variable,
        font.tertiary.variable,
        font.code.variable,
      ].join(" ")}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const theme = localStorage.getItem('theme') || 'system';
                  const root = document.documentElement;
                  if (theme === 'system') {
                    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                    root.classList.add(isDark ? 'dark' : 'light');
                  } else {
                    root.classList.add(theme);
                  }
                } catch (e) {
                  document.documentElement.classList.add('dark');
                }
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-screen flex flex-col bg-background text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          storageKey="theme"
        >
          <Background />
          <div className="h-4 hidden sm:block" />
          <Header />
          <main className="flex-1 flex flex-col items-center px-6 py-8 z-0">
            <div className="w-full flex justify-center">
              <RouteGuard>{children}</RouteGuard>
              <Analytics />
            </div>
          </main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
