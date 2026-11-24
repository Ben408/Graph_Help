"use client";

import { useEffect, useState } from "react";
import {
  BookOpen,
  Compass,
  ExternalLink,
  GraduationCap,
  Info,
  Sparkles,
} from "lucide-react";
import { getActivePack, getConceptById, getSkillPathById } from "@/lib/knowledge";
import type { ResolvedPanelContext } from "@/lib/panel-context";

const HIGHLIGHT_MSG = "graph-help:highlight";

export function postHighlightLabels(labels: string[], stepLabel?: string) {
  const payload = {
    type: HIGHLIGHT_MSG,
    labels,
    stepLabel: stepLabel || "",
  };
  try {
    window.parent?.postMessage(payload, "*");
  } catch {
    /* ignore */
  }
  try {
    window.postMessage(payload, "*");
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
  const [started, setStarted] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const pack = getActivePack(context.packId);
  const path = context.skillPathId
    ? getSkillPathById(context.skillPathId)
    : null;
  const steps = context.guideSteps;
  const hasFieldGuide = steps.length > 0;
  const categoryColors = pack.categoryColors;
  const screenLabel = context.screen || context.title || "this screen";

  useEffect(() => {
    setStarted(false);
    setStepIndex(0);
  }, [context.spineId, context.screen]);

  useEffect(() => {
    if (!hasFieldGuide || !started) {
      postHighlightLabels([], "");
      return;
    }
    const step = steps[stepIndex];
    const labels = step?.highlight
      ? [step.highlight]
      : context.highlightLabels.slice(0, 1);
    const stepLabel = `step ${stepIndex + 1}/${steps.length}`;
    postHighlightLabels(labels, stepLabel);
    return () => postHighlightLabels([], "");
  }, [stepIndex, started, hasFieldGuide, steps, context.highlightLabels]);

  const topicId = context.conceptIds[0];
  const screenHelpUrl =
    context.helpUrl ||
    (topicId ? getConceptById(topicId)?.helpUrl : null) ||
    null;

  if (!hasFieldGuide) {
    return (
      <div className="flex flex-col gap-4 p-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
          <div>
            <h1 className="text-sm font-semibold text-slate-900">
              Welcome to {screenLabel}.
            </h1>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              No field-level walkthrough is mapped for this screen yet. Choose
              how you would like to get help:
            </p>
          </div>
          <div className="flex flex-col items-start gap-2 pt-1">
            {screenHelpUrl && (
              <a
                href={screenHelpUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Read a step-by-step article
                <BookOpen className="h-3.5 w-3.5" />
              </a>
            )}
            <button
              type="button"
              onClick={() => onAsk(context.suggestedQuery || undefined)}
              className="inline-flex items-center justify-center gap-1.5 rounded-full border border-slate-900 bg-white px-4 py-2 text-xs font-medium text-slate-900 hover:bg-slate-50 transition-colors"
            >
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Ask about this screen
            </button>
            <button
              type="button"
              onClick={() => onOpenContext()}
              className="inline-flex items-center justify-center gap-1.5 rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:border-slate-400 hover:text-slate-900 transition-colors"
            >
              <Compass className="h-3.5 w-3.5" />
              Explore concepts
            </button>
          </div>
        </div>

        {path && (
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
            <button
              type="button"
              onClick={() => onOpenSkillPath?.(path.id)}
              className="w-full text-left group"
            >
              <p className="text-[11px] font-medium text-primary inline-flex items-center gap-1">
                <GraduationCap className="h-3.5 w-3.5" />
                Skill Path
              </p>
              <p className="text-sm font-semibold text-slate-900 group-hover:text-primary mt-0.5">
                {path.title}
              </p>
              <p className="text-xs text-slate-600 mt-1">{path.goal}</p>
            </button>
            <ul className="mt-2.5 space-y-1.5">
              {path.steps.slice(0, 6).map((s) => {
                const c = getConceptById(s.conceptId);
                return (
                  <li key={s.conceptId}>
                    <button
                      type="button"
                      onClick={() => onOpenContext(s.conceptId)}
                      className="text-xs text-left font-medium text-primary hover:underline"
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

  if (!started) {
    return (
      <div className="flex flex-col gap-4 p-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
          <div>
            <h1 className="text-sm font-semibold text-slate-900">
              Welcome to {screenLabel}.
            </h1>
            <p className="text-xs text-slate-600 mt-1">
              Choose the learning experience that works best for you.
            </p>
          </div>

          <div className="flex flex-col items-start gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                setStepIndex(0);
                setStarted(true);
              }}
              className="inline-flex items-center justify-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Guide me through it
            </button>

            {screenHelpUrl ? (
              <a
                href={screenHelpUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 rounded-full border border-slate-900 bg-white px-4 py-2 text-xs font-medium text-slate-900 hover:bg-slate-50 transition-colors"
              >
                Read a step-by-step article
                <BookOpen className="h-3.5 w-3.5 text-primary" />
              </a>
            ) : (
              <button
                type="button"
                onClick={() => onAsk(context.suggestedQuery || undefined)}
                className="inline-flex items-center justify-center gap-1.5 rounded-full border border-slate-900 bg-white px-4 py-2 text-xs font-medium text-slate-900 hover:bg-slate-50 transition-colors"
              >
                Read a step-by-step procedure
              </button>
            )}

            <button
              type="button"
              onClick={() => onOpenContext()}
              className="inline-flex items-center justify-center gap-1.5 rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:border-slate-400 hover:text-slate-900 transition-colors"
            >
              Explore concepts
            </button>
          </div>
        </div>

        {path && (
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
            <p className="text-[11px] font-medium text-primary inline-flex items-center gap-1">
              <GraduationCap className="h-3.5 w-3.5" />
              Continue learning
            </p>
            <button
              type="button"
              onClick={() => onOpenSkillPath?.(path.id)}
              className="text-left w-full group mt-0.5"
            >
              <p className="text-sm font-semibold text-slate-900 group-hover:text-primary">
                {path.title}
              </p>
              <p className="text-xs text-slate-600 mt-1">{path.goal}</p>
            </button>
          </div>
        )}
      </div>
    );
  }

  const step = steps[stepIndex];
  const nextStep = stepIndex < steps.length - 1 ? steps[stepIndex + 1] : null;
  const isLastStep = stepIndex >= steps.length - 1;

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex justify-end">
        <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-[11px] font-medium text-slate-700">
          Guide me through it
        </span>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
        <div>
          <p className="text-sm font-semibold text-slate-900 leading-snug">
            Step {stepIndex + 1} of {steps.length} — {step.title}
          </p>
          <p className="text-xs text-slate-600 mt-2 leading-relaxed">
            {step.detail}
          </p>
          {step.highlight && (
            <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-[#E6F4EC] px-2.5 py-0.5 text-[11px] font-medium text-primary">
              Highlighting: {step.highlight}
            </p>
          )}
        </div>

        <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-3 flex items-start gap-2">
          <Info className="h-4 w-4 text-slate-700 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-700 leading-relaxed">
            <p className="font-semibold text-slate-900">
              Need more detail on this step?
            </p>
            <button
              type="button"
              onClick={() =>
                onAsk(
                  context.suggestedQuery ||
                    `How do I ${step.title.toLowerCase()} on ${screenLabel}?`
                )
              }
              className="mt-0.5 inline-flex items-center gap-1 font-medium text-primary hover:underline"
            >
              Ask Smart Help for cited steps
              <BookOpen className="h-3 w-3" />
            </button>
          </div>
        </div>

        {screenHelpUrl && (
          <div className="pt-0.5">
            <p className="text-[11px] font-semibold text-slate-900 mb-1">
              Related help
            </p>
            <a
              href={screenHelpUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
            >
              Read Help: {screenLabel}
              <BookOpen className="h-3.5 w-3.5" />
              <ExternalLink className="h-3 w-3 opacity-75" />
            </a>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 pt-1">
          {nextStep ? (
            <button
              type="button"
              onClick={() =>
                setStepIndex((i) => Math.min(steps.length - 1, i + 1))
              }
              className="inline-flex items-center justify-center rounded-full border border-slate-900 bg-white px-4 py-1.5 text-xs font-semibold text-slate-900 hover:bg-slate-50 transition-colors max-w-full"
            >
              <span className="truncate">Next step: {nextStep.title}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setStarted(false);
                setStepIndex(0);
              }}
              className="inline-flex items-center justify-center rounded-full border border-slate-900 bg-white px-4 py-1.5 text-xs font-semibold text-slate-900 hover:bg-slate-50 transition-colors"
            >
              Done
            </button>
          )}

          {stepIndex > 0 ? (
            <button
              type="button"
              onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
              className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-medium text-slate-700 hover:border-slate-400 hover:text-slate-900 transition-colors"
            >
              Back
            </button>
          ) : (
            !isLastStep && (
              <button
                type="button"
                onClick={() => setStarted(false)}
                className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-medium text-slate-700 hover:border-slate-400 hover:text-slate-900 transition-colors"
              >
                All options
              </button>
            )
          )}
        </div>
      </div>

      {path && (
        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
          <p className="text-[11px] font-medium text-primary inline-flex items-center gap-1">
            <GraduationCap className="h-3.5 w-3.5" />
            Continue learning
          </p>
          <button
            type="button"
            onClick={() => onOpenSkillPath?.(path.id)}
            className="text-left w-full group mt-0.5"
          >
            <p className="text-sm font-semibold text-slate-900 group-hover:text-primary">
              {path.title}
            </p>
            <p className="text-xs text-slate-600 mt-1">{path.goal}</p>
          </button>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {path.steps.map((s) => {
              const c = getConceptById(s.conceptId);
              if (!c) return null;
              return (
                <button
                  key={s.conceptId}
                  type="button"
                  onClick={() => onOpenContext(s.conceptId)}
                  className="inline-flex items-center gap-1.5 text-[11px] rounded-full border border-slate-200 bg-white px-2.5 py-1 text-slate-700 hover:border-primary/40 hover:text-primary transition-colors"
                >
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: categoryColors[c.category] }}
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
