"use client";

import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  HelpCircle,
  ListChecks,
  Route,
} from "lucide-react";
import { AskFeedback } from "@/components/ask-feedback";
import {
  engineHealth,
  getAsk,
  submitAsk,
  type AskSubmitOptions,
  type EngineAskResult,
} from "@/lib/engine-client";
import { getConceptById, getSkillPathById } from "@/lib/knowledge";
import { CATEGORY_COLORS } from "@/data/concepts";
import type { ResolvedPanelContext } from "@/lib/panel-context";

function isDecision(text: string) {
  return /\b(if you|if the|when you|when the|unless|only if|depending on|before you|after you)\b/i.test(
    text
  );
}

type PanelAskProps = {
  context: ResolvedPanelContext;
  onOpenContext?: (conceptId?: string) => void;
  onOpenGuide?: () => void;
  onOpenSkillPath?: (pathId: string) => void;
  compactLinks?: boolean;
};

export function PanelAsk({
  context,
  onOpenContext,
  onOpenGuide,
  onOpenSkillPath,
}: PanelAskProps) {
  const seed = context.q || context.suggestedQuery || "";
  const [query, setQuery] = useState(seed);
  const [busy, setBusy] = useState(false);
  const [engineOk, setEngineOk] = useState<boolean | null>(null);
  const [engineWarning, setEngineWarning] = useState("");
  const [result, setResult] = useState<EngineAskResult | null>(null);
  const autoRan = useRef(false);

  // Preserve last Ask results across tab switches. Only reset on Intacct screen change,
  // or when the parent pushes a new seed (e.g. "Ask about this").
  const screenKey = `${context.spineId || ""}|${context.screen || ""}`;
  const lastScreenKey = useRef(screenKey);
  const lastSeed = useRef(seed);

  useEffect(() => {
    engineHealth().then((h) => {
      setEngineOk(h.ok);
      setEngineWarning(h.ready === false ? h.detail || "" : "");
    });
  }, []);

  useEffect(() => {
    const screenChanged = lastScreenKey.current !== screenKey;
    const seedChanged = seed !== lastSeed.current && seed.trim().length >= 3;
    lastScreenKey.current = screenKey;
    lastSeed.current = seed;

    if (screenChanged) {
      setQuery(seed);
      autoRan.current = false;
      setResult(null);
      return;
    }

    if (seedChanged) {
      setQuery(seed);
      // Explicit new question from Guide/Context — run it.
      if (engineOk) {
        autoRan.current = true;
        void runAsk(seed);
      } else {
        autoRan.current = false;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed, screenKey, engineOk]);

  useEffect(() => {
    if (seed.length >= 3 && engineOk && !autoRan.current && context.mapped) {
      autoRan.current = true;
      void runAsk(seed);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engineOk, context.mapped]);

  async function pollAsk(askId: string) {
    for (let i = 0; i < 120; i++) {
      const current = await getAsk(askId);
      setResult(current);
      if (["completed", "refused", "failed"].includes(current.status)) return;
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  async function runAsk(text: string) {
    setBusy(true);
    setResult(null);
    const opts: AskSubmitOptions = {
      module: context.module || undefined,
      screen: context.screen || context.title || undefined,
      help_url: context.helpUrl || undefined,
      concept_ids: context.conceptIds.length ? context.conceptIds : undefined,
      skill_path_id: context.skillPathId || undefined,
      mode: "ask",
    };
    try {
      const queued = await submitAsk(text, opts);
      await pollAsk(queued.ask_id);
    } catch (error) {
      setResult({
        ask_id: "local",
        status: "failed",
        sources: [],
        error_detail:
          error instanceof Error ? error.message : "Ask request failed",
      });
    } finally {
      setBusy(false);
    }
  }

  const refusalReason = result?.refusal_reason ?? null;
  const suggestedPaths =
    result?.status === "completed"
      ? [...new Set(result.skill_path_ids || [])]
          .map((id) => getSkillPathById(id))
          .filter(Boolean)
      : [];

  const relatedSkillPath =
    suggestedPaths[0] ||
    (context.skillPathId ? getSkillPathById(context.skillPathId) : null) ||
    null;

  const uniqueSources = (() => {
    const list = result?.sources ?? [];
    const seen = new Set<string>();
    const out: typeof list = [];
    for (const source of list) {
      const key = (source.source_url || source.source_id).split("#")[0];
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(source);
    }
    return out;
  })();

  return (
    <div className="flex flex-col gap-4 p-3">
      <div>
        <h1 className="text-base font-semibold text-foreground">Ask</h1>
        <p className="text-xs text-muted-foreground mt-1">
          {context.mapped
            ? `Context: ${context.screen || context.title}`
            : "What do you want to do? Ask for a cited Help procedure, or open Context to explore concepts."}
        </p>
      </div>

      {engineOk === false && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs">
          <p className="font-medium flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5" />
            Ask engine offline
          </p>
          <p className="text-muted-foreground mt-1">
            Start the local engine on :8765. You can still browse Context.
          </p>
        </div>
      )}

      {engineWarning && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs">
          <p className="font-medium flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5" />
            Engine not ready
          </p>
          <p className="text-muted-foreground mt-1">{engineWarning}</p>
        </div>
      )}

      <form
        className="flex flex-col gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (query.trim().length >= 3) void runAsk(query.trim());
        }}
      >
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          rows={3}
          placeholder="How do I close my books for the month?"
          className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring resize-y min-h-[72px]"
        />
        <button
          type="submit"
          disabled={busy || query.trim().length < 3 || engineOk === false}
          className="h-9 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          {busy ? "Working…" : "Ask"}
        </button>
      </form>

      {!result && !busy && (
        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
          <ListChecks className="h-3.5 w-3.5" />
          Example: how do I reverse a journal entry
        </p>
      )}

      {result && (
        <div className="space-y-4">
          {result.status === "refused" && (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
              <p className="text-sm font-medium inline-flex items-center gap-1.5">
                <HelpCircle className="h-3.5 w-3.5" />
                {refusalReason === "out_of_scope"
                  ? "Outside Sage Intacct Help"
                  : refusalReason === "ambiguous"
                    ? "Need a clearer product goal"
                    : "Help does not cover this well enough"}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                {result.coverage_gap ||
                  "Try rephrasing with the module, object, and action."}
              </p>
              <button
                type="button"
                onClick={() => onOpenContext?.()}
                className="mt-2 text-xs font-medium text-primary"
              >
                Explore concepts
              </button>
            </div>
          )}

          {result.status === "failed" && (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs">
              <p className="font-medium inline-flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5" />
                Ask engine problem
              </p>
              <p className="text-muted-foreground mt-1">
                {result.error_code}
                {result.error_detail ? `: ${result.error_detail}` : ""}
              </p>
            </div>
          )}

          {result.answer && (
            <article className="rounded-lg border border-border bg-card p-3">
              <p className="text-[10px] font-medium text-primary mb-1">
                Procedure
              </p>
              <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
                {result.answer.summary}
              </p>
              <ol className="space-y-3">
                {result.answer.steps.map((step, i) => {
                  const decision = step.detail && isDecision(step.detail);
                  return (
                    <li key={i} className="flex gap-2">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary">
                        {i + 1}
                      </span>
                      <div>
                        <p className="text-sm font-medium">{step.instruction}</p>
                        {step.detail && (
                          <p
                            className={`text-xs mt-1 leading-relaxed ${
                              decision
                                ? "text-foreground border-l-2 border-primary/40 pl-2"
                                : "text-muted-foreground"
                            }`}
                          >
                            {decision ? `Decision: ${step.detail}` : step.detail}
                          </p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>
              {result.answer.notes.length > 0 && (
                <ul className="mt-3 text-xs text-muted-foreground list-disc pl-4 space-y-1">
                  {result.answer.notes.map((note) => (
                    <li key={note}>{note}</li>
                  ))}
                </ul>
              )}
            </article>
          )}

          {uniqueSources.length > 0 && (
            <div>
              <h2 className="text-xs font-semibold mb-1.5">
                {result.status === "completed"
                  ? "Cited Help"
                  : "Possibly related Help"}
              </h2>
              <ul className="space-y-1.5">
                {uniqueSources.slice(0, 5).map((source) => (
                  <li key={source.source_id}>
                    <a
                      href={source.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      {source.title}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.status === "completed" &&
            (result.touched_concept_ids?.length ?? 0) > 0 && (
              <div>
                <h2 className="text-xs font-semibold mb-1.5">Related concepts</h2>
                <div className="flex flex-wrap gap-1.5">
                  {result.touched_concept_ids!.map((id) => {
                    const concept = getConceptById(id);
                    if (!concept) return null;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => onOpenContext?.(id)}
                        className="inline-flex items-center gap-1 text-[11px] rounded-full bg-secondary px-2 py-1"
                      >
                        <span
                          className="h-1.5 w-1.5 rounded-full"
                          style={{
                            backgroundColor: CATEGORY_COLORS[concept.category],
                          }}
                        />
                        {concept.title}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

          {result.status === "completed" && suggestedPaths[0] && (
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
              <p className="text-[10px] font-medium text-primary">Next: Learn</p>
              <p className="text-sm font-semibold">{suggestedPaths[0]!.title}</p>
              <button
                type="button"
                onClick={() => onOpenGuide?.()}
                className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary"
              >
                <Route className="h-3 w-3" />
                Open Guide
              </button>
            </div>
          )}

          {result.status === "completed" && relatedSkillPath && (
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
              <p className="text-[10px] font-medium text-primary">Skill Path</p>
              <p className="text-sm font-semibold">{relatedSkillPath.title}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {relatedSkillPath.goal}
              </p>
              <button
                type="button"
                onClick={() => onOpenSkillPath?.(relatedSkillPath.id)}
                className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                Open full path
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          )}

          {(result.status === "completed" || result.status === "refused") &&
            result.ask_id &&
            result.ask_id !== "local" && (
              <AskFeedback askId={result.ask_id} status={result.status} />
            )}
        </div>
      )}
    </div>
  );
}
