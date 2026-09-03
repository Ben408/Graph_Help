"use client";

import { useMemo, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowRight, BookOpen, ExternalLink, ListChecks, Route, Search, Sparkles, X } from "lucide-react";
import { CATEGORIES, CATEGORY_COLORS, concepts } from "@/data/concepts";
import { ConceptCard } from "@/components/concept-card";
import { SiteHeader } from "@/components/site-header";
import { globalSearch, recentUpdates } from "@/lib/knowledge";

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-10">
      <h2 className="text-sm font-semibold text-foreground mb-3">{title}</h2>
      {children}
    </section>
  );
}

function SearchPageInner() {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [activeCategory, setActiveCategory] = useState(searchParams.get("category") || "");
  const result = useMemo(() => globalSearch(query), [query]);
  const browsing = query.trim().length < 2;
  const conceptList = browsing
    ? activeCategory
      ? concepts.filter((c) => c.category === activeCategory)
      : concepts
    : result.concepts.filter((c) => !activeCategory || c.category === activeCategory);
  const updates = browsing ? recentUpdates() : result.updates;
  const empty =
    !browsing &&
    !result.answers &&
    result.tasks.length === 0 &&
    conceptList.length === 0 &&
    result.paths.length === 0 &&
    result.updates.length === 0;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-5xl px-4 lg:px-6 py-8" id="main">
        <h1 className="font-serif text-3xl font-semibold text-foreground mb-2">Find</h1>
        <p className="text-muted-foreground mb-6">
          Answers, tasks, concepts, Skill Paths, documentation, and recent changes
        </p>

        <div className="relative mb-8">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Close AP, dimensions, period close, 2026 R3…"
            className="w-full h-11 rounded-lg border border-border bg-card pl-10 pr-10 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Search answers, tasks, concepts, paths, and updates"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring rounded"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>

        {empty ? (
          <p className="text-sm text-muted-foreground">No matches. Try a product noun, a how-to, or a release term.</p>
        ) : null}

        {!browsing && result.answers ? (
          <Section title="Answers">
            <Link
              href={`/ask?q=${encodeURIComponent(query)}`}
              className="flex items-center justify-between gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4 hover:bg-primary/10 focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div>
                <p className="text-sm font-medium text-foreground">Get a cited how-to from Help</p>
                <p className="text-sm text-muted-foreground mt-1">Ask will retrieve a procedure or say when coverage is thin.</p>
              </div>
              <span className="inline-flex items-center gap-1 text-sm font-medium text-primary shrink-0">
                Ask <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </Link>
          </Section>
        ) : null}

        {!browsing && result.tasks.length > 0 ? (
          <Section title="Tasks">
            <ul className="space-y-2">
              {result.tasks.map((item) => (
                <li key={`${item.conceptId}-${item.task}`}>
                  <Link
                    href={`/ask?q=${encodeURIComponent(item.task)}`}
                    className="flex items-start gap-3 rounded-lg border border-border px-3 py-2.5 hover:bg-secondary/60 focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <ListChecks className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <span>
                      <span className="text-sm text-foreground">{item.task}</span>
                      <span className="block text-xs text-muted-foreground mt-0.5">{item.conceptTitle}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </Section>
        ) : null}

        {!browsing && result.paths.length > 0 ? (
          <Section title="Skill Paths">
            <div className="flex flex-wrap gap-2">
              {result.paths.map((path) => (
                <Link
                  key={path.id}
                  href={`/paths/${path.id}`}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 text-primary px-3 py-2 text-sm font-medium focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Route className="h-3.5 w-3.5" />
                  {path.title}
                </Link>
              ))}
            </div>
          </Section>
        ) : null}

        <Section title="Concepts">
          {browsing ? (
            <div className="flex flex-wrap gap-2 mb-4">
              <button
                type="button"
                onClick={() => setActiveCategory("")}
                className={`text-xs font-medium rounded-full px-3 py-1.5 focus-visible:ring-2 focus-visible:ring-ring ${
                  !activeCategory ? "bg-primary text-primary-foreground" : "bg-secondary"
                }`}
              >
                All
              </button>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(activeCategory === cat ? "" : cat)}
                  className={`inline-flex items-center gap-1.5 text-xs font-medium rounded-full px-3 py-1.5 focus-visible:ring-2 focus-visible:ring-ring ${
                    activeCategory === cat ? "bg-primary text-primary-foreground" : "bg-secondary"
                  }`}
                >
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[cat] }} />
                  {cat}
                </button>
              ))}
            </div>
          ) : null}
          {conceptList.length === 0 ? (
            <p className="text-sm text-muted-foreground">No matching concepts.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {conceptList.slice(0, browsing ? 12 : 9).map((concept) => (
                <ConceptCard key={concept.id} concept={concept} />
              ))}
            </div>
          )}
        </Section>

        {!browsing ? (
          <Section title="Documentation">
            <a
              href={result.docsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-primary hover:underline focus-visible:ring-2 focus-visible:ring-ring rounded"
            >
              <BookOpen className="h-4 w-4" />
              Search Sage Intacct Help for “{query}”
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </Section>
        ) : null}

        <Section title="Recent changes">
          {updates.length === 0 ? (
            <p className="text-sm text-muted-foreground">No matching release notes.</p>
          ) : (
            <ul className="space-y-2">
              {updates.map((item) => (
                <li key={item.title}>
                  <Link
                    href="/whats-new"
                    className="block rounded-lg border border-border px-3 py-2.5 hover:bg-secondary/60 focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <p className="text-sm font-medium text-foreground inline-flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-primary" />
                      {item.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">{item.area}</p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>
    </div>
  );
}

export function SearchPageContent() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">
          Loading Find…
        </div>
      }
    >
      <SearchPageInner />
    </Suspense>
  );
}
