"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Network, Moon, Sun, Compass, MessageSquare, GraduationCap, Sparkles } from "lucide-react";
import { useTheme } from "next-themes";
import { ConceptSearch } from "@/components/concept-search";

const NAV = [
  { href: "/ask", label: "Ask", match: (p: string) => p.startsWith("/ask"), icon: MessageSquare },
  { href: "/paths", label: "Learn", match: (p: string) => p.startsWith("/paths"), icon: GraduationCap },
  { href: "/graph", label: "Explore", match: (p: string) => p.startsWith("/graph") || p.startsWith("/concept"), icon: Compass },
  { href: "/whats-new", label: "Updates", match: (p: string) => p.startsWith("/whats-new"), icon: Sparkles },
];

export function SiteHeader() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-2 focus:z-[60] focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-sm focus:text-primary-foreground"
      >
        Skip to content
      </a>
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4 lg:px-6">
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Network className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-sm font-semibold text-foreground hidden sm:block">
            Sage Intacct
          </span>
        </Link>

        <nav className="flex items-center gap-1 ml-1">
          {NAV.map((item) => {
            const active = item.match(pathname || "");
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-1.5 rounded-md text-sm transition-colors inline-flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-ring ${
                  active
                    ? "text-foreground font-medium bg-secondary"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                }`}
              >
                <Icon className="h-3.5 w-3.5 hidden sm:block" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex-1 max-w-md ml-auto">
          <ConceptSearch size="sm" placeholder="Search concepts, tasks, or questions…" />
        </div>

        <button
          type="button"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors shrink-0 focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Toggle theme"
        >
          <Sun className="h-4 w-4 hidden dark:block" />
          <Moon className="h-4 w-4 block dark:hidden" />
        </button>
      </div>
    </header>
  );
}
