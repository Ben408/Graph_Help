"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Compass, GraduationCap, MessageSquare } from "lucide-react";
import { concepts, CATEGORIES, CATEGORY_COLORS } from "@/data/concepts";
import { FOUNDATION_IDS, getSkillPaths } from "@/lib/knowledge";
import { SkillPathCard } from "@/components/skill-path-card";
import { ConceptSearch } from "@/components/concept-search";
import { ConceptCard } from "@/components/concept-card";
import { SiteHeader } from "@/components/site-header";
import { KnowledgeGraph } from "@/components/knowledge-graph";

const FEATURED_IDS = [
  "general-ledger",
  "accounts-payable",
  "accounts-receivable",
  "dimensions",
  "close-books",
  "ap-automation",
];

const featuredConcepts = concepts.filter((c) => FEATURED_IDS.includes(c.id));

export function HomeScreen() {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <section className="relative overflow-hidden" id="main">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.08),transparent_60%)]" />
        <div className="relative mx-auto max-w-7xl px-4 lg:px-6 py-12 md:py-16">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="font-serif text-4xl md:text-5xl font-semibold tracking-tight text-foreground text-balance">
              Get work done, learn a workflow, or understand the product
            </h1>
            <p className="mt-4 text-base md:text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              Cited how-tos from current Help, Skill Paths for jobs like period
              close, and a concept map that expands as you explore.
            </p>
            <div className="mt-8 mx-auto max-w-xl">
              <ConceptSearch
                size="lg"
                placeholder="Ask a question, or search a concept or path"
              />
            </div>
          </div>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl mx-auto">
            <Link
              href="/ask"
              className="group rounded-2xl border border-border bg-card p-5 text-left hover:border-primary/40 hover:shadow-md transition-all"
            >
              <MessageSquare className="h-5 w-5 text-primary mb-3" />
              <p className="text-sm font-semibold text-foreground">I need to do something</p>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                Ask a how-to. Answers come from Help, with citations.
              </p>
              <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary">
                Open Ask <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </Link>
            <Link
              href="/paths"
              className="group rounded-2xl border border-border bg-card p-5 text-left hover:border-primary/40 hover:shadow-md transition-all"
            >
              <GraduationCap className="h-5 w-5 text-primary mb-3" />
              <p className="text-sm font-semibold text-foreground">I want to learn a workflow</p>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                Follow a Skill Path: understand, practice, confirm, continue.
              </p>
              <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary">
                Open Learn <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </Link>
            <Link
              href="/graph"
              className="group rounded-2xl border border-border bg-card p-5 text-left hover:border-primary/40 hover:shadow-md transition-all"
            >
              <Compass className="h-5 w-5 text-primary mb-3" />
              <p className="text-sm font-semibold text-foreground">I want to understand the product</p>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                Start from core domains, then expand relationships as you go.
              </p>
              <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary">
                Open Explore <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 lg:px-6 pb-10">
        <button
          type="button"
          onClick={() => router.push("/graph")}
          className="group block w-full relative rounded-2xl border border-border bg-card/50 overflow-hidden hover:border-primary/30 text-left"
        >
          <div className="px-4 pt-3 flex items-center justify-between">
            <p className="text-sm font-medium text-foreground">Product map</p>
            <span className="text-xs text-primary inline-flex items-center gap-1">
              Expand in Explore <ArrowRight className="h-3 w-3" />
            </span>
          </div>
          <div className="h-[200px] pointer-events-none">
            <KnowledgeGraph
              visibleIds={[...FOUNDATION_IDS]}
              dimUnrelated={false}
              onNodeClick={(id) => router.push(`/graph?focus=${id}`)}
            />
          </div>
        </button>
      </section>

      <section className="mx-auto max-w-7xl px-4 lg:px-6 pb-16">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="font-serif text-2xl font-semibold text-foreground">Learn</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Skill Paths for close, procure-to-pay, cash, and the ledger
            </p>
          </div>
          <Link href="/paths" className="text-sm font-medium text-primary hover:underline">
            All paths
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {getSkillPaths().map((path) => (
            <SkillPathCard key={path.id} path={path} />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 lg:px-6 pb-16">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="font-serif text-2xl font-semibold text-foreground">Start with a concept</h2>
            <p className="text-sm text-muted-foreground mt-1">What it is, why it matters, when you use it</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {featuredConcepts.map((concept) => (
            <ConceptCard key={concept.id} concept={concept} />
          ))}
        </div>
      </section>

      <section className="border-t border-border bg-card/30">
        <div className="mx-auto max-w-7xl px-4 lg:px-6 py-12">
          <h2 className="font-serif text-2xl font-semibold text-foreground mb-6">Browse by category</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {CATEGORIES.map((cat) => {
              const count = concepts.filter((c) => c.category === cat).length;
              return (
                <Link
                  key={cat}
                  href={`/search?category=${encodeURIComponent(cat)}`}
                  className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 hover:border-primary/30"
                >
                  <span
                    className="h-3 w-3 rounded-full shrink-0"
                    style={{ backgroundColor: CATEGORY_COLORS[cat] }}
                    aria-hidden
                  />
                  <div>
                    <p className="text-sm font-medium text-foreground">{cat}</p>
                    <p className="text-xs text-muted-foreground">{count} concepts</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
      <footer className="border-t border-border">
        <div className="mx-auto max-w-7xl px-4 lg:px-6 py-6 flex justify-end">
          <Link href="/admin" className="text-xs text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring rounded">
            Diagnostics
          </Link>
        </div>
      </footer>
    </div>
  );
}
