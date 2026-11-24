"use client";

import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  ExternalLink,
  GraduationCap,
  HelpCircle,
  ListChecks,
  Route,
  Send,
} from "lucide-react";
import { AskFeedback } from "@/components/ask-feedback";
import {
  engineHealth,
  getAsk,
  submitAsk,
  type AskSubmitOptions,
  type EngineAskResult,
} from "@/lib/engine-client";
import {
  ASK_BACKEND_EVENT,
  getStoredAskBackend,
  setStoredAskBackend,
  type AskBackend,
} from "@/lib/ask-backend";
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
  const [backend, setBackend] = useState<AskBackend>("ask");
  const autoRan = useRef(false);

  useEffect(() => {
    setBackend(getStoredAskBackend());
    const onChange = () => setBackend(getStoredAskBackend());
    window.addEventListener(ASK_BACKEND_EVENT, onChange);
    return () => window.removeEventListener(ASK_BACKEND_EVENT, onChange);
  }, []);

  function switchBackend(next: AskBackend) {
    setBackend(next);
    setStoredAskBackend(next);
    setResult(null);
  }

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
      backend,
      pack_id: context.packId,
      page_url:
        typeof window !== "undefined"
          ? new URLSearchParams(window.location.search).get("page_url") ||
            undefined
          : undefined,
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
    <div className="flex flex-col gap-4 p-4">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-sm font-semibold text-slate-900">Ask Smart Help</h1>
          <div
            role="group"
            aria-label="Answer backend"
            className="inline-flex rounded-full border border-slate-200 bg-slate-100 p-0.5 text-[11px]"
          >
            <button
              type="button"
              onClick={() => switchBackend("ask")}
              className={`rounded-full px-2.5 py-0.5 font-medium transition-colors ${
                backend === "ask"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Ask
            </button>
            <button
              type="button"
              onClick={() => switchBackend("copilot")}
              className={`rounded-full px-2.5 py-0.5 font-medium transition-colors ${
                backend === "copilot"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Copilot (Hybrid)
            </button>
          </div>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          {context.mapped
            ? `Context: ${context.screen || context.title}`
            : backend === "copilot"
              ? "Hybrid mode: Sage Copilot answers inside Smart Help's Concept Graph wrapper."
              : "Ask a single question for a cited Sage Help procedure, or switch to Context to explore concepts."}
        </p>
      </div>

      {backend === "ask" && engineOk === false && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-50 p-3.5 text-xs">
          <p className="font-medium text-slate-900 flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
            Ask engine offline
          </p>
          <p className="text-slate-600 mt-1">
            Start the local engine on :8765, or switch to Copilot (Hybrid).
          </p>
        </div>
      )}

      {backend === "ask" && engineWarning && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-50 p-3.5 text-xs">
          <p className="font-medium text-slate-900 flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
            Engine not ready
          </p>
          <p className="text-slate-600 mt-1">{engineWarning}</p>
        </div>
      )}

      <form
        className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm flex flex-col gap-2.5"
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
          className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus-visible:ring-2 focus-visible:ring-ring resize-y min-h-[72px]"
        />
        <div className="flex items-center justify-between gap-2">
          {result ? (
            <button
              type="button"
              onClick={() => {
                setResult(null);
                setQuery("");
              }}
              className="rounded-full border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-medium text-slate-700 hover:border-slate-400 hover:text-slate-900 transition-colors"
            >
              Clear
            </button>
          ) : (
            <span className="text-[11px] text-slate-500">
              Single-question Help lookup
            </span>
          )}
          <button
            type="submit"
            disabled={busy || query.trim().length < 3 || (backend === "ask" && engineOk === false)}
            className="inline-flex items-center justify-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {busy ? "Working…" : "Ask"}
            {!busy && <Send className="h-3 w-3" />}
          </button>
        </div>
        <p className="text-[10px] text-slate-500 leading-snug">
          Check AI content for inaccuracies. Answers are grounded in Sage Help
          and are not professional advice.
        </p>
      </form>

      {!result && !busy && (
        <p className="text-xs text-slate-500 flex items-center gap-1.5 px-1">
          <ListChecks className="h-3.5 w-3.5 text-primary" />
          Example: how do I reverse a journal entry
        </p>
      )}

      {result && (
        <div className="space-y-4">
          {result.status === "refused" && (
            <div className="rounded-2xl border border-amber-500/30 bg-amber-50 p-4">
              <p className="text-sm font-semibold text-slate-900 inline-flex items-center gap-1.5">
                <HelpCircle className="h-4 w-4 text-amber-600" />
                {refusalReason === "out_of_scope"
                  ? "Outside Sage Intacct Help"
                  : refusalReason === "ambiguous"
                    ? "Need a clearer product goal"
                    : "Help does not cover this well enough"}
              </p>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                {result.coverage_gap ||
                  "Try rephrasing with the module, object, and action."}
              </p>
              <button
                type="button"
                onClick={() => onOpenContext?.()}
                className="mt-3 inline-flex items-center rounded-full border border-slate-900 bg-white px-3.5 py-1.5 text-xs font-medium text-slate-900 hover:bg-slate-50 transition-colors"
              >
                Explore concepts
              </button>
            </div>
          )}

          {result.status === "failed" && (
            <div className="rounded-2xl border border-amber-500/30 bg-amber-50 p-4 text-xs">
              <p className="font-semibold text-slate-900 inline-flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                Ask engine problem
              </p>
              <p className="text-slate-600 mt-1">
                {result.error_code}
                {result.error_detail ? `: ${result.error_detail}` : ""}
              </p>
            </div>
          )}

          {result.answer && (
            <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <p className="text-[11px] font-semibold text-primary">
                  {result.backend_source?.startsWith("copilot") ? "Copilot Answer" : "Procedure"}
                </p>
                {result.backend_source === "copilot-demo-replay" && (
                  <span className="rounded-full bg-[#E6F4EC] px-2 py-0.5 text-[10px] font-medium text-primary">
                    Sage Copilot · Hybrid (Demo Replay)
                  </span>
                )}
                {result.backend_source === "copilot-live" && (
                  <span className="rounded-full bg-[#E6F4EC] px-2 py-0.5 text-[10px] font-medium text-primary">
                    Sage Copilot · Hybrid (Live)
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-700 mb-3 leading-relaxed">
                {result.answer.summary}
              </p>
              {result.answer.steps.length > 0 && (
              <ol className="space-y-3">
                {result.answer.steps.map((step, i) => {
                  const decision = step.detail && isDecision(step.detail);
                  return (
                    <li key={i} className="flex gap-2.5">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#E6F4EC] text-[10px] font-semibold text-primary mt-0.5">
                        {i + 1}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          {step.instruction}
                        </p>
                        {step.detail && (
                          <p
                            className={`text-xs mt-1 leading-relaxed ${
                              decision
                                ? "text-slate-800 rounded-lg bg-slate-50 border-l-2 border-primary px-2.5 py-1.5"
                                : "text-slate-600"
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
              )}
              {result.answer.notes.length > 0 && (
                <ul className="mt-3 text-xs text-slate-600 list-disc pl-4 space-y-1">
                  {result.answer.notes.map((note) => (
                    <li key={note}>{note}</li>
                  ))}
                </ul>
              )}
              {result.followup_queries && result.followup_queries.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <p className="text-[11px] font-medium text-slate-500 mb-1.5">
                    Suggested follow-ups
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {result.followup_queries.map((fq) => (
                      <button
                        key={fq}
                        type="button"
                        onClick={() => {
                          setQuery(fq);
                          void runAsk(fq);
                        }}
                        className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] text-slate-700 hover:border-primary/40 hover:text-primary transition-colors text-left"
                      >
                        {fq}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </article>
          )}

          {uniqueSources.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5">
              <h2 className="text-xs font-semibold text-slate-900 mb-2">
                {result.status === "completed"
                  ? "Cited Help"
                  : "Possibly related Help"}
              </h2>
              <ul className="space-y-2">
                {uniqueSources.slice(0, 5).map((source) => (
                  <li key={source.source_id}>
                    <a
                      href={source.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                    >
                      <span>Read Help: {source.title}</span>
                      <BookOpen className="h-3.5 w-3.5 shrink-0" />
                      <ExternalLink className="h-3 w-3 shrink-0 opacity-75" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.status === "completed" &&
            (result.touched_concept_ids?.length ?? 0) > 0 && (
              <div>
                <h2 className="text-xs font-semibold text-slate-900 mb-2">
                  Related concepts
                </h2>
                <div className="flex flex-wrap gap-1.5">
                  {result.touched_concept_ids!.map((id) => {
                    const concept = getConceptById(id);
                    if (!concept) return null;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => onOpenContext?.(id)}
                        className="inline-flex items-center gap-1.5 text-[11px] rounded-full border border-slate-200 bg-white px-2.5 py-1 text-slate-700 hover:border-primary/40 hover:text-primary transition-colors"
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
            <div className="rounded-2xl border border-primary/25 bg-[#E6F4EC]/50 p-4">
              <p className="text-[11px] font-semibold text-primary inline-flex items-center gap-1">
                <Route className="h-3.5 w-3.5" />
                Next: Learn
              </p>
              <p className="text-sm font-semibold text-slate-900 mt-0.5">
                {suggestedPaths[0]!.title}
              </p>
              <button
                type="button"
                onClick={() => onOpenGuide?.()}
                className="mt-2.5 inline-flex items-center gap-1.5 rounded-full border border-slate-900 bg-white px-3.5 py-1.5 text-xs font-medium text-slate-900 hover:bg-slate-50 transition-colors"
              >
                <Route className="h-3 w-3 text-primary" />
                Open Guide
              </button>
            </div>
          )}

          {result.status === "completed" && relatedSkillPath && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
              <p className="text-[11px] font-semibold text-primary inline-flex items-center gap-1">
                <GraduationCap className="h-3.5 w-3.5" />
                Skill Path
              </p>
              <p className="text-sm font-semibold text-slate-900 mt-0.5">
                {relatedSkillPath.title}
              </p>
              <p className="text-xs text-slate-600 mt-1">
                {relatedSkillPath.goal}
              </p>
              <button
                type="button"
                onClick={() => onOpenSkillPath?.(relatedSkillPath.id)}
                className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
              >
                Open full path
                <GraduationCap className="h-3.5 w-3.5" />
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
