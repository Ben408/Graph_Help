"use client";

import { Suspense, useEffect, useMemo, useState, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  ChevronRight,
  Filter,
  Maximize2,
  PanelRightOpen,
  RotateCcw,
  X,
} from "lucide-react";
import type { RelationshipType } from "@/lib/knowledge/types";
import { KnowledgeGraph } from "@/components/knowledge-graph";
import { ConceptPeekDialog } from "@/components/concept-peek-dialog";
import { ConceptSearch } from "@/components/concept-search";
import { SiteHeader } from "@/components/site-header";
import {
  conceptHref,
  foundationIdsForPack,
  getActivePack,
  getConceptById,
  getSkillPathById,
  neighborSet,
  relatedDetailed,
  sentenceFor,
  setSessionPackId,
  type ContentPack,
} from "@/lib/knowledge";

const REL_TYPES: RelationshipType[] = [
  "REQUIRES",
  "PART_OF",
  "USED_BY",
  "CONTRASTS_WITH",
  "EXTENDS",
];

type ExplorePrompt = {
  label: string;
  hops: 1 | 2;
  focus?: string;
  path?: string;
  seeds?: string[];
};

const INTACCT_PROMPTS: ExplorePrompt[] = [
  {
    label: "What should I understand before learning consolidation?",
    focus: "consolidation",
    hops: 2,
  },
  {
    label: "Show everything involved in period close",
    path: "period-close",
    hops: 1,
  },
  {
    label: "How are AP Automation and Vendor Payments related?",
    seeds: ["ap-automation", "vendor-payments"],
    hops: 1,
  },
];

function promptsForPack(pack: ContentPack): ExplorePrompt[] {
  if (pack.id === "sage-planning") {
    return [
      {
        label: "What should I understand before workforce planning?",
        focus: "workforce-planning",
        hops: 1,
      },
      {
        label: "Show everything involved in creating a forecast",
        path: "create-forecast",
        hops: 1,
      },
      {
        label: "How are plans, versions, and sharing related?",
        seeds: ["plans-and-versions", "manage-and-share"],
        hops: 1,
      },
    ];
  }
  return INTACCT_PROMPTS;
}

function lensesForPack(pack: ContentPack) {
  return [
    {
      id: "all",
      label: "All roles",
      kind: "role" as const,
      conceptIds: [] as string[],
    },
    ...pack.skillPaths.map((path) => ({
      id: path.id,
      label: path.title,
      kind: "goal" as const,
      pathId: path.id,
      conceptIds: path.steps.map((step) => step.conceptId),
    })),
  ];
}

function FilterGroup({
  label,
  summary,
  open,
  onToggle,
  children,
}: {
  label: string;
  summary: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <div className="rounded-md border border-border/60">
      <button
        type="button"
        aria-expanded={open}
        onClick={onToggle}
        className="flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-[11px] hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ChevronRight
          className={`h-3 w-3 shrink-0 text-muted-foreground transition-transform ${
            open ? "rotate-90" : ""
          }`}
        />
        <span className="font-medium text-foreground">{label}</span>
        <span className="ml-auto truncate text-muted-foreground">{summary}</span>
      </button>
      {open && <div className="px-1 pb-1.5">{children}</div>}
    </div>
  );
}

function GraphExplorerInner() {
  const params = useSearchParams();
  const packParam = params.get("pack");
  // Set before children render so KnowledgeGraph/search use the URL pack.
  setSessionPackId(packParam);
  useEffect(() => {
    setSessionPackId(packParam);
  }, [packParam]);
  const pack = getActivePack(packParam);
  const categories = pack.categories;
  const categoryColors = pack.categoryColors;
  const relationshipLabels = pack.relationshipLabels;
  const concepts = pack.concepts;
  const prompts = useMemo(() => promptsForPack(pack), [pack]);
  const lenses = useMemo(() => lensesForPack(pack), [pack]);
  const foundationIds = foundationIdsForPack(pack);
  const knownIds = useMemo(
    () => new Set(concepts.map((concept) => concept.id)),
    [concepts]
  );

  const initialFocus = params.get("focus");
  const initialPathId = params.get("path");
  const initialPath = initialPathId
    ? pack.skillPaths.find((path) => path.id === initialPathId)
    : null;
  const initialPathIds = initialPath?.steps.map((s) => s.conceptId) ?? [];
  const [selectedId, setSelectedId] = useState<string | null>(
    initialFocus || initialPathIds[0] || null
  );
  const [hops, setHops] = useState<1 | 2>(1);
  const [expanded, setExpanded] = useState<Set<string>>(
    () =>
      new Set(
        initialPathIds.length
          ? initialPathIds
          : initialFocus
            ? [initialFocus]
            : []
      )
  );
  const [filterCategories, setFilterCategories] = useState<Set<string>>(new Set());
  const [relTypes, setRelTypes] = useState<Set<RelationshipType>>(new Set());
  const [showFilters, setShowFilters] = useState(true);
  // Groups start collapsed so the Visible list stays on screen without scrolling.
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set());
  const [fitToken, setFitToken] = useState(0);
  const [peekId, setPeekId] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(true);
  const [lensId, setLensId] = useState<string>("all");

  const selected = selectedId
    ? concepts.find((concept) => concept.id === selectedId) ??
      getConceptById(selectedId)
    : null;

  const visibleIds = useMemo(() => {
    const seeds = new Set<string>(
      foundationIds.filter((id) => knownIds.has(id))
    );
    for (const id of expanded) {
      if (knownIds.has(id)) seeds.add(id);
    }
    if (selectedId && knownIds.has(selectedId)) {
      for (const id of neighborSet(pack, [selectedId], hops)) {
        if (knownIds.has(id)) seeds.add(id);
      }
    }
    const lens = lenses.find((item) => item.id === lensId);
    if (lens && lens.id !== "all" && lens.conceptIds.length > 0) {
      return [...seeds].filter(
        (id) =>
          lens.conceptIds.includes(id) ||
          expanded.has(id) ||
          id === selectedId
      );
    }
    return [...seeds];
  }, [
    expanded,
    selectedId,
    hops,
    pack,
    lensId,
    lenses,
    foundationIds,
    knownIds,
  ]);

  const related = selectedId ? relatedDetailed(selectedId) : [];

  function selectNode(id: string) {
    setSelectedId(id);
    setExpanded((prev) => new Set(prev).add(id));
    setShowDetails(true);
  }

  function toggleGroup(id: string) {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function resetView() {
    setSelectedId(null);
    setExpanded(new Set());
    setHops(1);
    setLensId("all");
    setFilterCategories(new Set());
    setRelTypes(new Set());
    setShowDetails(true);
    setFitToken((n) => n + 1);
  }

  function applyPrompt(prompt: ExplorePrompt) {
    if (prompt.path) {
      const path =
        pack.skillPaths.find((item) => item.id === prompt.path) ||
        getSkillPathById(prompt.path);
      const ids = path?.steps.map((s) => s.conceptId) ?? [];
      setExpanded(new Set(ids));
      setSelectedId(ids[0] ?? null);
      setHops(prompt.hops);
    } else if (prompt.seeds) {
      setExpanded(new Set(prompt.seeds));
      setSelectedId(prompt.seeds[0] ?? null);
      setHops(prompt.hops);
    } else if (prompt.focus) {
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
              Find a concept
            </p>
            <ConceptSearch
              size="sm"
              placeholder="Search concepts…"
              onSelect={(concept) => selectNode(concept.id)}
            />
            <p className="mt-3 text-xs text-muted-foreground">
              Need a how-to?{" "}
              <Link href="/ask" className="text-primary font-medium hover:underline">
                Ask about a goal
              </Link>
            </p>
          </div>
          {/* One scroll region: filter groups can never push Visible off-screen. */}
          <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="p-3 border-b border-border space-y-1.5">
            <p className="px-2.5 text-[11px] font-medium text-muted-foreground">
              Explore these topics
            </p>
            {prompts.map((prompt) => (
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
              aria-expanded={showFilters}
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 w-full text-xs font-medium text-foreground"
            >
              <Filter className="h-3.5 w-3.5" />
              Filters
            </button>
            {showFilters && (
              <div className="mt-3 space-y-2">
                <FilterGroup
                  label="Category"
                  summary={
                    filterCategories.size > 0
                      ? `${filterCategories.size} selected`
                      : `All ${categories.length}`
                  }
                  open={openGroups.has("category")}
                  onToggle={() => toggleGroup("category")}
                >
                  {categories.map((cat) => {
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
                          style={{ backgroundColor: categoryColors[cat] }}
                        />
                        <span className="truncate">{cat}</span>
                      </button>
                    );
                  })}
                </FilterGroup>
                <FilterGroup
                  label="Role or goal"
                  summary={
                    lenses.find((lens) => lens.id === lensId)?.label ?? "All"
                  }
                  open={openGroups.has("lens")}
                  onToggle={() => toggleGroup("lens")}
                >
                  {lenses.map((lens) => {
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
                </FilterGroup>
                <FilterGroup
                  label="Relationship"
                  summary={relTypes.size > 0 ? `${relTypes.size} selected` : "Any"}
                  open={openGroups.has("relationship")}
                  onToggle={() => toggleGroup("relationship")}
                >
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
                        {relationshipLabels[type]}
                      </button>
                    );
                  })}
                </FilterGroup>
              </div>
            )}
          </div>
          <div className="p-2">
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
                    style={{ backgroundColor: categoryColors[concept.category] }}
                  />
                  <span className="truncate">{concept.title}</span>
                </button>
              ))}
          </div>
          </div>
        </aside>

        {/* min-w-0: the canvas carries an explicit pixel width, so without this
            the default min-width:auto keeps main from shrinking and pushes the
            details panel outside the viewport. */}
        <main className="flex-1 min-w-0 relative" id="main">
          <KnowledgeGraph
            packId={pack.id}
            currentConceptId={selectedId ?? undefined}
            visibleIds={visibleIds}
            hops={hops}
            filterCategories={[...filterCategories]}
            relationTypes={[...relTypes]}
            fitToken={fitToken}
            onNodeClick={selectNode}
            onNodeDoubleClick={(id) => {
              selectNode(id);
              setPeekId(id);
            }}
            onCanvasDoubleClick={() => setFitToken((n) => n + 1)}
          />
          <p className="absolute bottom-4 right-4 max-w-xs text-[11px] text-muted-foreground bg-card/90 border border-border rounded-md px-2 py-1.5">
            Tab to the graph. Arrows move, Enter selects then reads, + / − zoom,
            0 fits. Double-click a concept to read it, the background to refit.
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
            {selected && !showDetails && (
              <button
                type="button"
                onClick={() => setShowDetails(true)}
                className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2.5 py-1.5 text-xs"
              >
                <PanelRightOpen className="h-3 w-3" />
                Details
              </button>
            )}
          </div>
        </main>

        {selected && showDetails && (
          <aside className="w-80 shrink-0 border-l border-border bg-card flex flex-col overflow-hidden">
            <div className="p-4 border-b border-border flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-foreground truncate">{selected.title}</h3>
              <button
                type="button"
                onClick={() => setShowDetails(false)}
                className="text-muted-foreground"
                aria-label="Hide concept details"
              >
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
                href={conceptHref(selected.id, pack.id)}
                className="flex items-center justify-center gap-2 w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground"
              >
                Open concept page
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </aside>
        )}
      </div>
      <ConceptPeekDialog conceptId={peekId} onClose={() => setPeekId(null)} />
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
