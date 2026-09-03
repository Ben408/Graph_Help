"use client";

import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ListChecks,
  Lightbulb,
  ExternalLink,
  ChevronRight,
  Route,
  Clock3,
} from "lucide-react";
import {
  getConceptById,
  CATEGORY_COLORS,
  getHelpLinkData,
} from "@/data/concepts";
import { KnowledgeGraph } from "@/components/knowledge-graph";
import { SiteHeader } from "@/components/site-header";
import {
  getPack,
  getPathsForConcept,
  groupedRelationships,
  neighborSet,
  sentenceFor,
} from "@/lib/knowledge";
import Link from "next/link";

export function ConceptPageContent({ conceptId }: { conceptId: string }) {
  const router = useRouter();
  const pack = getPack();
  const concept = getConceptById(conceptId);

  if (!concept) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Concept not found.</p>
      </div>
    );
  }

  const groups = groupedRelationships(pack, conceptId, 6);
  const skillPaths = getPathsForConcept(conceptId);
  const color = CATEGORY_COLORS[concept.category];
  const helpLinkData = getHelpLinkData(conceptId);
  const localIds = [...neighborSet(pack, [conceptId], 1)];

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-6xl px-4 lg:px-6 py-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => router.back()}
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back
            </button>
            {helpLinkData?.hierarchy.breadcrumb.map((crumb, i) => (
              <span key={i} className="flex items-center gap-1.5">
                {i > 0 && <ChevronRight className="h-3 w-3 text-muted-foreground/50" />}
                <span className={`text-xs ${i === helpLinkData.hierarchy.breadcrumb.length - 1 ? "text-foreground" : "text-muted-foreground"}`}>
                  {crumb}
                </span>
              </span>
            ))}
          </div>
          {helpLinkData && (
            <a
              href={helpLinkData.helpUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-xs font-medium text-primary bg-primary/10 rounded-lg px-3 py-2"
            >
              Source documentation
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 space-y-5">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2" style={{ color }}>
                {concept.category}
              </p>
              <h1 className="font-serif text-3xl font-semibold text-foreground text-balance">
                {concept.title}
              </h1>
              <p className="mt-3 text-base text-muted-foreground leading-relaxed">
                {concept.summary}
              </p>
            </div>

            <section className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-semibold text-foreground">Why it matters</h2>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{concept.whyItMatters}</p>
            </section>

            <section className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center gap-2 mb-2">
                <Clock3 className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-semibold text-foreground">When you use it</h2>
              </div>
              <ul className="space-y-2">
                {concept.keyDetails.slice(0, 4).map((detail) => (
                  <li key={detail} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
                    {detail}
                  </li>
                ))}
              </ul>
            </section>

            {groups.find((g) => g.key === "learn-first") && (
              <section className="rounded-xl border border-border bg-card p-5">
                <h2 className="text-sm font-semibold text-foreground mb-3">Prerequisites</h2>
                <div className="space-y-2">
                  {groups
                    .find((g) => g.key === "learn-first")!
                    .items.map((rel) => (
                      <Link
                        key={rel.concept.id}
                        href={`/concept/${rel.concept.id}`}
                        className="block text-sm text-foreground hover:text-primary"
                      >
                        {sentenceFor(pack, conceptId, rel)}
                      </Link>
                    ))}
                </div>
              </section>
            )}

            {(concept.tasks?.length || 0) > 0 && (
              <section className="rounded-xl border border-border bg-card p-5">
                <div className="flex items-center gap-2 mb-3">
                  <ListChecks className="h-4 w-4 text-primary" />
                  <h2 className="text-sm font-semibold text-foreground">Common tasks</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  {concept.tasks!.map((task) => (
                    <Link
                      key={task}
                      href={`/ask?q=${encodeURIComponent(task)}`}
                      className="text-xs font-medium bg-secondary rounded-full px-3 py-1.5 hover:bg-primary/10 hover:text-primary"
                    >
                      {task}
                    </Link>
                  ))}
                </div>
              </section>
            )}

            <section className="rounded-xl border border-border bg-card p-5">
              <h2 className="text-sm font-semibold text-foreground mb-3">Related concepts</h2>
              <div className="space-y-4">
                {groups
                  .filter((group) => group.key !== "learn-first")
                  .map((group) => (
                  <div key={group.key}>
                    <p className="text-xs font-medium text-muted-foreground mb-1.5">{group.label}</p>
                    <div className="space-y-1.5">
                      {group.items.map((rel) => (
                        <Link
                          key={`${rel.concept.id}-${rel.type}`}
                          href={`/concept/${rel.concept.id}`}
                          className="block rounded-lg border border-border px-3 py-2 text-sm hover:bg-secondary/50"
                        >
                          {sentenceFor(pack, conceptId, rel)}
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {skillPaths.length > 0 && (
              <section className="rounded-xl border border-border bg-card p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Route className="h-4 w-4 text-primary" />
                  <h2 className="text-sm font-semibold text-foreground">Skill Paths containing this concept</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  {skillPaths.map((path) => (
                    <Link
                      key={path.id}
                      href={`/paths/${path.id}`}
                      className="text-xs font-medium rounded-full bg-primary/10 text-primary px-3 py-1.5"
                    >
                      {path.title}
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {helpLinkData && (
              <section className="rounded-xl border border-border bg-card p-5">
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen className="h-4 w-4 text-primary" />
                  <h2 className="text-sm font-semibold text-foreground">Source documentation</h2>
                </div>
                <a
                  href={helpLinkData.helpUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline inline-flex items-center gap-1.5"
                >
                  Sage Intacct Help
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </section>
            )}
          </div>

          <div className="lg:col-span-2">
            <div className="sticky top-20 rounded-xl border border-border bg-card overflow-hidden">
              <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Neighborhood</h3>
                  <p className="text-xs text-muted-foreground">Strongest nearby relationships</p>
                </div>
                <Link href={`/graph?focus=${conceptId}`} className="text-xs font-medium text-primary">
                  Open in full graph
                </Link>
              </div>
              <div className="h-[320px]">
                <KnowledgeGraph
                  currentConceptId={conceptId}
                  visibleIds={localIds}
                  dimUnrelated={false}
                  onNodeClick={(id) => router.push(`/concept/${id}`)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
