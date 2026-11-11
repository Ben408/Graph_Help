"use client";

import { useEffect, useState } from "react";
import { Compass, ExternalLink, ListChecks, Sparkles } from "lucide-react";
import { getConceptById, getSkillPathById } from "@/lib/knowledge";
import type { ResolvedPanelContext } from "@/lib/panel-context";
import { CATEGORY_COLORS, getHelpLinkData } from "@/data/concepts";

const HIGHLIGHT_MSG = "graph-help:highlight";

export function postHighlightLabels(labels: string[]) {
  try {
    window.parent?.postMessage(
      { type: HIGHLIGHT_MSG, labels },
      "*"
    );
  } catch {
    /* ignore */
  }
  try {
    window.postMessage({ type: HIGHLIGHT_MSG, labels }, "*");
  } catch {
    /* ignore */
  }
}

type PanelGuideProps = {
  context: ResolvedPanelContext;
  onAsk: (query?: string) => void;
  onOpenContext: (conceptId?: string) => void;
  onOpenSkillPath?: (pathId: string) => void;
};

export function PanelGuide({
  context,
  onAsk,
  onOpenContext,
  onOpenSkillPath,
}: PanelGuideProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const path = context.skillPathId
    ? getSkillPathById(context.skillPathId)
    : null;
  const steps = context.guideSteps;
  const hasFieldGuide = steps.length > 0;

  useEffect(() => {
    setStepIndex(0);
  }, [context.spineId, context.screen]);

  useEffect(() => {
    if (!hasFieldGuide) {
      postHighlightLabels([]);
      return;
    }
    const step = steps[stepIndex];
    const labels = step?.highlight
      ? [step.highlight]
      : context.highlightLabels.slice(0, 1);
    postHighlightLabels(labels);
    return () => postHighlightLabels([]);
  }, [stepIndex, hasFieldGuide, steps, context.highlightLabels]);

  if (!hasFieldGuide) {
    return (
      <div className="flex flex-col gap-4 p-3">
        <div>
          <h1 className="text-base font-semibold">Guide</h1>
          <p className="text-xs text-muted-foreground mt-1">
            No field-level guide for this screen yet. Ask for a procedure or
            explore concepts for this area of Intacct.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onAsk(context.suggestedQuery || undefined)}
          className="h-9 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground inline-flex items-center justify-center gap-1.5"
        >
          <Sparkles className="h-3.5 w-3.5" />
          Ask about this screen
        </button>
        <button
          type="button"
          onClick={() => onOpenContext()}
          className="h-9 rounded-lg border border-border px-3 text-sm font-medium inline-flex items-center justify-center gap-1.5"
        >
          <Compass className="h-3.5 w-3.5" />
          Explore concepts
        </button>
        {path && (
          <div className="rounded-lg border border-border bg-card p-3">
            <button
              type="button"
              onClick={() => onOpenSkillPath?.(path.id)}
              className="w-full text-left group"
            >
              <p className="text-[10px] font-medium text-primary">Skill Path</p>
              <p className="text-sm font-semibold group-hover:text-primary">
                {path.title}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{path.goal}</p>
            </button>
            <ul className="mt-2 space-y-1.5">
              {path.steps.slice(0, 6).map((s) => {
                const c = getConceptById(s.conceptId);
                return (
                  <li key={s.conceptId}>
                    <button
                      type="button"
                      onClick={() => onOpenContext(s.conceptId)}
                      className="text-xs text-left text-primary hover:underline"
                    >
                      {c?.title || s.conceptId}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    );
  }

  const step = steps[stepIndex];

  return (
    <div className="flex flex-col gap-4 p-3">
      <div>
        <h1 className="text-base font-semibold">Guide</h1>
        <p className="text-xs text-muted-foreground mt-1">
          {context.screen || context.title || "This screen"} — step{" "}
          {stepIndex + 1} of {steps.length}
        </p>
      </div>

      <div className="rounded-lg border border-border bg-card p-3">
        <p className="text-[10px] font-medium text-primary mb-1 flex items-center gap-1">
          <ListChecks className="h-3 w-3" />
          On this page
        </p>
        <p className="text-sm font-semibold">{step.title}</p>
        <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
          {step.detail}
        </p>
        {step.highlight && (
          <p className="mt-2 text-[11px] text-primary">
            Highlighting: {step.highlight}
          </p>
        )}
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          disabled={stepIndex === 0}
          onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
          className="flex-1 h-9 rounded-lg border border-border text-sm disabled:opacity-40"
        >
          Back
        </button>
        <button
          type="button"
          disabled={stepIndex >= steps.length - 1}
          onClick={() =>
            setStepIndex((i) => Math.min(steps.length - 1, i + 1))
          }
          className="flex-1 h-9 rounded-lg bg-primary text-sm font-medium text-primary-foreground disabled:opacity-40"
        >
          Next
        </button>
      </div>

      {(() => {
        const topicId = context.conceptIds[0];
        const help = topicId ? getHelpLinkData(topicId) : null;
        if (help?.helpUrl) {
          return (
            <a
              href={help.helpUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-medium text-primary inline-flex items-center gap-1"
            >
              Open Sage Intacct Help topic
              <ExternalLink className="h-3 w-3" />
            </a>
          );
        }
        return (
          <button
            type="button"
            onClick={() =>
              onAsk(
                context.suggestedQuery ||
                  "How do I close my books for the period?"
              )
            }
            className="text-xs font-medium text-primary text-left"
          >
            Ask for a cited Help procedure →
          </button>
        );
      })()}

      {path && (
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
          <p className="text-[10px] font-medium text-primary">Continue learning</p>
          <button
            type="button"
            onClick={() => onOpenSkillPath?.(path.id)}
            className="text-left w-full group"
          >
            <p className="text-sm font-semibold group-hover:text-primary">
              {path.title}
            </p>
            <p className="text-xs text-muted-foreground mt-1">{path.goal}</p>
          </button>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {path.steps.map((s) => {
              const c = getConceptById(s.conceptId);
              if (!c) return null;
              return (
                <button
                  key={s.conceptId}
                  type="button"
                  onClick={() => onOpenContext(s.conceptId)}
                  className="inline-flex items-center gap-1 text-[11px] rounded-full bg-secondary px-2 py-1"
                >
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: CATEGORY_COLORS[c.category] }}
                  />
                  {c.title}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
