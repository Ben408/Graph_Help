"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Filter, RotateCcw, Maximize2, X } from "lucide-react";
import {
  concepts,
  getConceptById,
  CATEGORIES,
  CATEGORY_COLORS,
  RELATIONSHIP_LABELS,
  type RelationshipType,
} from "@/data/concepts";
import { KnowledgeGraph } from "@/components/knowledge-graph";
import { ConceptSearch } from "@/components/concept-search";
import { SiteHeader } from "@/components/site-header";
import {
  FOUNDATION_IDS,
  GRAPH_LENSES,
  getPack,
  getSkillPathById,
  neighborSet,
  relatedDetailed,
  sentenceFor,
} from "@/lib/knowledge";

const REL_TYPES: RelationshipType[] = [
  "REQUIRES",
  "PART_OF",
  "USED_BY",
  "CONTRASTS_WITH",
  "EXTENDS",
];

const PROMPTS = [
  {
    label: "What should I understand before learning consolidation?",
    focus: "consolidation",
    hops: 2 as const,
  },
  {
    label: "Show everything involved in period close",
    path: "period-close",
    hops: 1 as const,
  },
  {
    label: "How are AP Automation and Vendor Payments related?",
    seeds: ["ap-automation", "vendor-payments"],
    hops: 1 as const,
  },
];

function GraphExplorerInner() {
  const params = useSearchParams();
  const initialFocus = params.get("focus");
  const [selectedId, setSelectedId] = useState<string | null>(initialFocus);
  const [hops, setHops] = useState<1 | 2>(1);
  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set(initialFocus ? [initialFocus] : [])
  );
  const [filterCategories, setFilterCategories] = useState<Set<string>>(new Set());
  const [relTypes, setRelTypes] = useState<Set<RelationshipType>>(new Set());
  const [showFilters, setShowFilters] = useState(true);
  const [fitToken, setFitToken] = useState(0);
  const [lensId, setLensId] = useState<(typeof GRAPH_LENSES)[number]["id"]>("all");
  const pack = getPack();

  const selected = selectedId ? getConceptById(selectedId) : null;

  const visibleIds = useMemo(() => {
    const seeds = new Set<string>(FOUNDATION_IDS);
    for (const id of expanded) seeds.add(id);
    if (selectedId) {
      for (const id of neighborSet(pack, [selectedId], hops)) seeds.add(id);
    }
    const lens = GRAPH_LENSES.find((item) => item.id === lensId);
    if (lens && lens.id !== "all" && lens.conceptIds.length > 0) {
      return [...seeds].filter((id) => (lens.conceptIds as readonly string[]).includes(id) || expanded.has(id) || id === selectedId);
    }
    return [...seeds];
  }, [expanded, selectedId, hops, pack, lensId]);

  const related = selectedId ? relatedDetailed(selectedId) : [];

  function selectNode(id: string) {
    setSelectedId(id);
    setExpanded((prev) => new Set(prev).add(id));
  }

  function resetView() {
    setSelectedId(null);
    setExpanded(new Set());
    setHops(1);
    setLensId("all");
    setFilterCategories(new Set());
    setRelTypes(new Set());
    setFitToken((n) => n + 1);
  }

  function applyPrompt(prompt: (typeof PROMPTS)[number]) {
    if ("path" in prompt && prompt.path) {
      const path = getSkillPathById(prompt.path);
      const ids = path?.steps.map((s) => s.conceptId) ?? [];
      setExpanded(new Set(ids));
      setSelectedId(ids[0] ?? null);
      setHops(prompt.hops);
    } else if ("seeds" in prompt && prompt.seeds) {
      setExpanded(new Set(prompt.seeds));
      setSelectedId(prompt.seeds[0] ?? null);
      setHops(prompt.hops);
    } else if ("focus" in prompt && prompt.focus) {
      setSelectedId(prompt.focus);
      setExpanded(new Set([prompt.focus]));
      setHops(prompt.hops);
    }
    setFitToken((n) => n + 1);
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <SiteHeader />
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-72 shrink-0 border-r border-border bg-card flex flex-col overflow-hidden hidden lg:flex">
          <div className="p-4 border-b border-border">
            <p className="text-xs font-medium text-muted-foreground mb-2">
              Ask the graph a question
            </p>
            <ConceptSearch
              size="sm"
              placeholder="Find a concept…"
              onSelect={(concept) => selectNode(concept.id)}
            />
          </div>
          <div className="p-3 border-b border-border space-y-1.5">
            {PROMPTS.map((prompt) => (
              <button
                key={prompt.label}
                type="button"
                onClick={() => applyPrompt(prompt)}
                className="w-full text-left text-xs leading-snug rounded-md px-2.5 py-2 text-foreground hover:bg-secondary border border-transparent hover:border-border"
              >
                {prompt.label}
              </button>
            ))}
          </div>
          <div className="p-4 border-b border-border">
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 w-full text-xs font-medium text-foreground"
            >
              <Filter className="h-3.5 w-3.5" />
              Filters
            </button>
            {showFilters && (
              <div className="mt-3 space-y-3">
                <div>
                  <p className="text-[11px] text-muted-foreground mb-1.5">Category</p>
                  {CATEGORIES.map((cat) => {
                    const on = filterCategories.has(cat);
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => {
                          setFilterCategories((prev) => {
                            const next = new Set(prev);
                            if (next.has(cat)) next.delete(cat);
                            else next.add(cat);
                            return next;
                          });
                        }}
                        className={`w-full flex items-center gap-2 rounded-md px-2 py-1 text-xs ${
                          on ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary"
                        }`}
                      >
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: CATEGORY_COLORS[cat] }}
                        />
                        <span className="truncate">{cat}</span>
                      </button>
                    );
                  })}
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground mb-1.5">Role or goal</p>
                  {GRAPH_LENSES.map((lens) => {
                    const on = lensId === lens.id;
                    return (
                      <button
                        key={lens.id}
                        type="button"
                        aria-pressed={on}
                        onClick={() => {
                          setLensId(lens.id);
                          if (lens.id !== "all") {
                            setExpanded(new Set(lens.conceptIds));
                            setSelectedId(lens.conceptIds[0] ?? null);
                            setFitToken((n) => n + 1);
                          }
                        }}
                        className={`w-full text-left rounded-md px-2 py-1 text-xs focus-visible:ring-2 focus-visible:ring-ring ${
                          on ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary"
                        }`}
                      >
                        {lens.label}
                      </button>
                    );
                  })}
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground mb-1.5">Relationship</p>
                  {REL_TYPES.map((type) => {
                    const on = relTypes.has(type);
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => {
                          setRelTypes((prev) => {
                            const next = new Set(prev);
                            if (next.has(type)) next.delete(type);
                            else next.add(type);
                            return next;
                          });
                        }}
                        className={`w-full text-left rounded-md px-2 py-1 text-xs ${
                          on ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary"
                        }`}
                      >
                        {RELATIONSHIP_LABELS[type]}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            <p className="px-2 py-1 text-[11px] text-muted-foreground">
              Visible ({visibleIds.length})
            </p>
            {concepts
              .filter((c) => visibleIds.includes(c.id))
              .map((concept) => (
                <button
                  key={concept.id}
                  type="button"
                  onClick={() => selectNode(concept.id)}
                  className={`w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs ${
                    selectedId === concept.id
                      ? "bg-primary/10 text-primary"
                      : "text-foreground hover:bg-secondary"
                  }`}
                >
                  <span
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{ backgroundColor: CATEGORY_COLORS[concept.category] }}
                  />
                  <span className="truncate">{concept.title}</span>
                </button>
              ))}
          </div>
        </aside>

        <main className="flex-1 relative" id="main">
          <KnowledgeGraph
            currentConceptId={selectedId ?? undefined}
            visibleIds={visibleIds}
            hops={hops}
            filterCategories={[...filterCategories]}
            relationTypes={[...relTypes]}
            fitToken={fitToken}
            onNodeClick={selectNode}
          />
          <p className="absolute bottom-4 right-4 max-w-xs text-[11px] text-muted-foreground bg-card/90 border border-border rounded-md px-2 py-1.5">
            Tab to the graph. Arrows move, Enter selects, + / − zoom, 0 fits.
          </p>
          <div className="absolute top-4 left-4 flex flex-wrap gap-2">
            <button
              type="button"
              aria-pressed={hops === 1}
              onClick={() => setHops(1)}
              className={`rounded-md border px-2.5 py-1.5 text-xs focus-visible:ring-2 focus-visible:ring-ring ${
                hops === 1 ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border"
              }`}
            >
              One hop
            </button>
            <button
              type="button"
              aria-pressed={hops === 2}
              onClick={() => setHops(2)}
              className={`rounded-md border px-2.5 py-1.5 text-xs focus-visible:ring-2 focus-visible:ring-ring ${
                hops === 2 ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border"
              }`}
            >
              Two hops
            </button>
            <button
              type="button"
              onClick={resetView}
              className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2.5 py-1.5 text-xs"
            >
              <RotateCcw className="h-3 w-3" />
              Reset
            </button>
            <button
              type="button"
              onClick={() => setFitToken((n) => n + 1)}
              className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2.5 py-1.5 text-xs"
            >
              <Maximize2 className="h-3 w-3" />
              Fit selection
            </button>
          </div>
        </main>

        {selected && (
          <aside className="w-80 shrink-0 border-l border-border bg-card flex flex-col overflow-hidden">
            <div className="p-4 border-b border-border flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-foreground truncate">{selected.title}</h3>
              <button type="button" onClick={() => setSelectedId(null)} className="text-muted-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <p className="text-sm text-muted-foreground leading-relaxed">{selected.summary}</p>
              <div>
                <p className="text-xs font-medium text-foreground mb-2">Relationships</p>
                <div className="space-y-1.5">
                  {related.map((rel) => (
                    <button
                      key={`${rel.concept.id}-${rel.type}-${rel.direction}`}
                      type="button"
                      onClick={() => selectNode(rel.concept.id)}
                      className="w-full text-left rounded-md border border-border px-2.5 py-2 hover:bg-secondary/60"
                    >
                      <p className="text-xs text-foreground leading-snug">
                        {sentenceFor(pack, selected.id, rel)}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-border">
              <Link
                href={`/concept/${selected.id}`}
                className="flex items-center justify-center gap-2 w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground"
              >
                Open concept page
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}

export function GraphExplorer() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">
          Loading Explore…
        </div>
      }
    >
      <GraphExplorerInner />
    </Suspense>
  );
}
