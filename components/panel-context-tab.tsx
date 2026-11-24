"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, GraduationCap } from "lucide-react";
import { ConceptCard } from "@/components/concept-card";
import { ConceptPeekDialog } from "@/components/concept-peek-dialog";
import { KnowledgeGraph } from "@/components/knowledge-graph";
import {
  FOUNDATION_IDS,
  getConceptById,
  getPathsForConcept,
  getSkillPathById,
} from "@/lib/knowledge";
import type { ResolvedPanelContext } from "@/lib/panel-context";

type PanelContextTabProps = {
  context: ResolvedPanelContext;
  focusConceptId?: string | null;
  onAskAbout?: (query: string) => void;
  onOpenSkillPath?: (pathId: string) => void;
  onOpenConceptPage?: (conceptId: string) => void;
  onOpenGraph?: (focusConceptId: string, pathId?: string) => void;
};

export function PanelContextTab({
  context,
  focusConceptId,
  onAskAbout,
  onOpenSkillPath,
  onOpenConceptPage,
  onOpenGraph,
}: PanelContextTabProps) {
  const seedIds = useMemo(() => {
    if (focusConceptId) return [focusConceptId, ...context.conceptIds];
    if (context.conceptIds.length) return context.conceptIds;
    return [...FOUNDATION_IDS].slice(0, 6);
  }, [context.conceptIds, focusConceptId]);

  const primaryId = focusConceptId || seedIds[0] || "general-ledger";
  const [selectedId, setSelectedId] = useState(primaryId);
  const [peekId, setPeekId] = useState<string | null>(null);

  useEffect(() => {
    setSelectedId(primaryId);
  }, [primaryId]);

  const concepts = seedIds.map((id) => getConceptById(id)).filter(Boolean);
  const selected = getConceptById(selectedId);

  const browseFoundations =
    !context.mapped && !context.moduleOnly && context.conceptIds.length === 0;

  const path =
    (context.skillPathId && getSkillPathById(context.skillPathId)) ||
    getPathsForConcept(selectedId)[0] ||
    getPathsForConcept(primaryId)[0] ||
    null;

  const pathConceptIds = useMemo(
    () => path?.steps.map((s) => s.conceptId) ?? [],
    [path]
  );

  const graphFocusId = useMemo(() => {
    if (!pathConceptIds.length) return selectedId;
    if (pathConceptIds.includes(selectedId)) return selectedId;
    const fromContext = context.conceptIds.find((id) =>
      pathConceptIds.includes(id)
    );
    return fromContext || pathConceptIds[0];
  }, [pathConceptIds, selectedId, context.conceptIds]);

  return (
    <div className="flex flex-col gap-3.5 p-4 h-full min-h-0">
      <div>
        <h1 className="text-sm font-semibold text-slate-900">Context</h1>
        <p className="text-xs text-slate-600 mt-1">
          {browseFoundations
            ? "Browse core concepts. Pick a noun, then Ask when you have a goal."
            : context.mapped
              ? `Topic for ${context.screen || context.title}`
              : `Concepts related to ${context.module.replace(/_/g, " ") || "this area"}`}
        </p>
      </div>

      {selected && (
        <div className="shrink-0">
          <ConceptCard
            concept={selected}
            onSelect={() => setPeekId(selected.id)}
          />
          {onAskAbout && (
            <div className="mt-2.5 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() =>
                  onAskAbout(
                    `How do I work with ${selected.title} in Sage Intacct?`
                  )
                }
                className="inline-flex items-center rounded-full border border-slate-900 bg-white px-3.5 py-1.5 text-xs font-medium text-slate-900 hover:bg-slate-50 transition-colors"
              >
                Ask about this
              </button>
            </div>
          )}
        </div>
      )}

      {(browseFoundations || concepts.length > 1) && (
        <div className="space-y-1.5 max-h-48 overflow-y-auto">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
            Related
          </p>
          {(browseFoundations
            ? FOUNDATION_IDS.map((id) => getConceptById(id)).filter(Boolean)
            : concepts.filter((c) => c && c.id !== selectedId)
          ).map((c) =>
            c ? (
              <ConceptCard
                key={c.id}
                concept={c}
                variant="compact"
                onSelect={() => {
                  setSelectedId(c.id);
                  setPeekId(c.id);
                }}
              />
            ) : null
          )}
        </div>
      )}

      {path && (
        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
          <p className="text-[11px] font-semibold text-primary inline-flex items-center gap-1">
            <GraduationCap className="h-3.5 w-3.5" />
            Skill Path
          </p>
          <p className="text-sm font-semibold text-slate-900 mt-0.5">
            {path.title}
          </p>
          <p className="text-xs text-slate-600 mt-1">{path.goal}</p>
          <button
            type="button"
            onClick={() => onOpenSkillPath?.(path.id)}
            className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
          >
            Open full path
            <GraduationCap className="h-3.5 w-3.5" />
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      )}

      {pathConceptIds.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          <div className="flex items-center justify-between gap-2 px-3.5 pt-3 pb-1">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
              Explore Relationships
            </p>
            <button
              type="button"
              onClick={() => onOpenGraph?.(graphFocusId, path?.id)}
              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              Open in Explore
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>
          <button
            type="button"
            onClick={() => onOpenGraph?.(graphFocusId, path?.id)}
            className="block w-full text-left hover:bg-secondary/40 transition-colors"
            title="Open graph centered on this topic"
          >
            <div className="h-[140px] pointer-events-none">
              <KnowledgeGraph
                currentConceptId={graphFocusId}
                visibleIds={pathConceptIds}
                dimUnrelated={false}
              />
            </div>
          </button>
        </div>
      )}

      {peekId && (
        <ConceptPeekDialog
          conceptId={peekId}
          onClose={() => setPeekId(null)}
          onOpenFullPage={
            onOpenConceptPage
              ? (id) => {
                  setPeekId(null);
                  onOpenConceptPage(id);
                }
              : undefined
          }
        />
      )}
    </div>
  );
}
