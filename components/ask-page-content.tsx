"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ListChecks,
  Route,
  AlertTriangle,
  ExternalLink,
  HelpCircle,
} from "lucide-react";
import { AskFeedback } from "@/components/ask-feedback";
import { SiteHeader } from "@/components/site-header";
import {
  engineHealth,
  getAsk,
  submitAsk,
  type EngineAskResult,
} from "@/lib/engine-client";
import {
  getConceptById,
  getSkillPathById,
  routeQuery,
} from "@/lib/knowledge";
import { CATEGORY_COLORS } from "@/data/concepts";

function isDecision(text: string) {
  return /\b(if you|if the|when you|when the|unless|only if|depending on|before you|after you)\b/i.test(
    text
  );
}

function AskInner() {
  const searchParams = useSearchParams();
  const initial = searchParams.get("q") || "";
  const [query, setQuery] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [engineOk, setEngineOk] = useState<boolean | null>(null);
  const [result, setResult] = useState<EngineAskResult | null>(null);
  const intent = query.trim().length >= 2 ? routeQuery(query) : null;

  const autoRan = useRef(false);

  useEffect(() => {
    engineHealth().then((h) => {
      setEngineOk(h.ok);
    });
  }, []);

  useEffect(() => {
    if (initial.length >= 3 && engineOk && !autoRan.current) {
      autoRan.current = true;
      void runAsk(initial);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engineOk]);

  async function pollAsk(askId: string) {
    for (let i = 0; i < 120; i++) {
      const current = await getAsk(askId);
      setResult(current);
      if (["completed", "refused", "failed"].includes(current.status)) {
        return;
      }
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  async function runAsk(text: string) {
    setBusy(true);
    setResult(null);
    try {
      const queued = await submitAsk(text);
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
      ? [
          ...new Set(
            (result?.skill_path_ids?.length
              ? result.skill_path_ids
              : (intent?.skillPathHits.map((p) => p.id) ?? [])) as string[],
          ),
        ]
          .map((id) => getSkillPathById(id))
          .filter(Boolean)
      : [];

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
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-3xl px-4 lg:px-6 py-10" id="main">
        <h1 className="font-serif text-3xl font-semibold text-foreground mb-2">Ask</h1>
        <p className="text-muted-foreground mb-6">
          Describe the outcome you need. Ask returns a cited procedure from
          current Help, or says when Help is not enough.
        </p>

        {engineOk === false && (
          <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm">
            <p className="font-medium text-foreground flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Ask is temporarily unavailable
            </p>
            <p className="text-muted-foreground mt-2">
              The Help engine is offline. You can still use Learn and Explore.
            </p>
          </div>
        )}

        <form
          className="flex gap-2 mb-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (query.trim().length >= 3) void runAsk(query.trim());
          }}
        >
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="How do I close my books for the month?"
            className="flex-1 h-11 rounded-lg border border-border bg-card px-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <button
            type="submit"
            disabled={busy || query.trim().length < 3}
            className="h-11 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-ring"
          >
            {busy ? "Working…" : "Ask"}
          </button>
        </form>

        {intent && intent.intent !== "goal" && query.length >= 2 && (
          <p className="text-xs text-muted-foreground mb-4">
            This query looks like a {intent.intent} question. Ask still runs
            procedure retrieval; you can also open a concept or skill path.
          </p>
        )}

        {result && (
          <div className="space-y-6">
            {result.status === "refused" && (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-5">
                <p className="font-medium text-foreground mb-2 inline-flex items-center gap-2">
                  <HelpCircle className="h-4 w-4" />
                  {refusalReason === "out_of_scope"
                    ? "Outside Sage Intacct Help"
                    : refusalReason === "ambiguous"
                      ? "Need a clearer product goal"
                      : "Help does not cover this well enough"}
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  {result.coverage_gap ||
                    (refusalReason === "out_of_scope"
                      ? "This does not look like an in-scope Sage Intacct Help question."
                      : refusalReason === "ambiguous"
                        ? "Try rephrasing with the Intacct module, object, and action you mean."
                        : "Current Help does not have a complete procedure for this question.")}
                </p>
                {refusalReason === "insufficient_evidence" ? (
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href="/paths"
                      className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      Learn a Skill Path
                    </Link>
                    <Link
                      href={`/search?q=${encodeURIComponent(query)}`}
                      className="rounded-lg border border-border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      Search related material
                    </Link>
                  </div>
                ) : (
                  <Link
                    href="/search"
                    className="rounded-lg border border-border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring inline-flex"
                  >
                    Browse Find instead
                  </Link>
                )}
              </div>
            )}
            {result.status === "failed" && (
              <div className="rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground">
                Help could not retrieve an answer just now. Try again, or open Learn for a Skill Path.
              </div>
            )}
            {result.answer && (
              <article className="rounded-xl border border-border bg-card p-5">
                <p className="text-xs font-medium text-primary mb-2">Procedure</p>
                <h2 className="text-lg font-semibold text-foreground mb-3">{query}</h2>
                <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
                  {result.answer.summary}
                </p>
                <ol className="space-y-4">
                  {result.answer.steps.map((step, i) => {
                    const decision = step.detail && isDecision(step.detail);
                    return (
                      <li key={i} className="flex gap-3">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                          {i + 1}
                        </span>
                        <div>
                          <p className="text-sm font-medium text-foreground">{step.instruction}</p>
                          {step.detail && (
                            <p
                              className={`text-sm mt-1 leading-relaxed ${
                                decision
                                  ? "text-foreground border-l-2 border-primary/40 pl-3"
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
                {result.answer.notes.filter(isDecision).length > 0 && (
                  <div className="mt-5 rounded-lg bg-secondary/60 p-3">
                    <p className="text-xs font-medium text-foreground mb-2">Decision points</p>
                    <ul className="space-y-1.5 text-sm text-muted-foreground">
                      {result.answer.notes.filter(isDecision).map((note) => (
                        <li key={note}>{note}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {result.answer.notes.filter((n) => !isDecision(n)).length > 0 && (
                  <ul className="mt-4 text-sm text-muted-foreground list-disc pl-5">
                    {result.answer.notes
                      .filter((n) => !isDecision(n))
                      .map((note) => (
                        <li key={note}>{note}</li>
                      ))}
                  </ul>
                )}
              </article>
            )}

            {uniqueSources.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-foreground mb-2">
                  {result.status === "completed"
                    ? "Cited Help"
                    : "Possibly related Help"}
                </h2>
                <ul className="space-y-2">
                  {uniqueSources.map((source) => (
                    <li key={source.source_id}>
                      <a
                        href={source.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm text-primary hover:underline focus-visible:ring-2 focus-visible:ring-ring rounded"
                      >
                        {source.title}
                        {source.heading_path ? (
                          <span className="text-muted-foreground">· {source.heading_path}</span>
                        ) : null}
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
                <h2 className="text-sm font-semibold text-foreground mb-2">Related concepts</h2>
                <div className="flex flex-wrap gap-2">
                  {result.touched_concept_ids!.map((id) => {
                    const concept = getConceptById(id);
                    if (!concept) return null;
                    return (
                      <Link
                        key={id}
                        href={`/concept/${id}`}
                        className="inline-flex items-center gap-1.5 text-xs rounded-full bg-secondary px-3 py-1.5 focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <span
                          className="h-1.5 w-1.5 rounded-full"
                          style={{ backgroundColor: CATEGORY_COLORS[concept.category] }}
                        />
                        {concept.title}
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {result.status === "completed" && suggestedPaths[0] ? (
              <div className="rounded-xl border border-primary/30 bg-primary/5 p-5">
                <p className="text-xs font-medium text-primary mb-1">Next: Learn</p>
                <p className="text-sm font-semibold text-foreground">{suggestedPaths[0].title}</p>
                <p className="text-sm text-muted-foreground mt-1">{suggestedPaths[0].goal}</p>
                <Link
                  href={`/paths/${suggestedPaths[0].id}`}
                  className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary focus-visible:ring-2 focus-visible:ring-ring rounded"
                >
                  <Route className="h-3.5 w-3.5" />
                  Continue this Skill Path
                </Link>
              </div>
            ) : null}

            {(result.status === "completed" || result.status === "refused") &&
              result.ask_id &&
              result.ask_id !== "local" && (
                <AskFeedback askId={result.ask_id} status={result.status} />
              )}
          </div>
        )}

        {!result && !busy && (
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <ListChecks className="h-4 w-4" />
            Example: how do I reverse a journal entry
          </p>
        )}
      </div>
    </div>
  );
}

export function AskPageContent() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">
          Loading Ask…
        </div>
      }
    >
      <AskInner />
    </Suspense>
  );
}
