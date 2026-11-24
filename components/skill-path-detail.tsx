"use client";

import Link from "next/link";
import { ArrowLeft, BookOpen, Check, ListChecks } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import {
  conceptHref,
  getActivePack,
  setSessionPackId,
  withPackQuery,
} from "@/lib/knowledge";
import { usePathProgress } from "@/lib/path-progress";

function difficultyLabel(value?: string) {
  if (value === "introductory") return "Introductory";
  if (value === "advanced") return "Advanced";
  return "Intermediate";
}

export function SkillPathDetail({
  pathId,
  packId,
}: {
  pathId: string;
  packId?: string | null;
}) {
  setSessionPackId(packId);
  const pack = getActivePack(packId);
  const path = pack.skillPaths.find((item) => item.id === pathId);
  const progress = usePathProgress(pathId, path?.steps.length ?? 0);

  if (!path) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <p className="p-8 text-muted-foreground">Skill path not found.</p>
      </div>
    );
  }

  const current = path.steps[progress.resumeIndex];
  const currentConcept = current
    ? pack.concepts.find((item) => item.id === current.conceptId)
    : undefined;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-3xl px-4 lg:px-6 py-10">
        <Link
          href={withPackQuery("/paths", pack.id)}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          All Skill Paths
        </Link>

        <h1 className="font-serif heading-display text-3xl font-semibold text-foreground">{path.title}</h1>
        <p className="text-muted-foreground mt-2 leading-relaxed">{path.summary}</p>

        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          {path.estimatedMinutes ? (
            <span className="rounded-full bg-secondary px-2.5 py-1">{path.estimatedMinutes} min</span>
          ) : null}
          <span className="rounded-full bg-secondary px-2.5 py-1">{difficultyLabel(path.difficulty)}</span>
          <span className="rounded-full bg-secondary px-2.5 py-1">{path.audience}</span>
        </div>

        {!progress.complete && currentConcept && (
          <div className="mt-6 rounded-2xl border border-primary/25 bg-primary/5 p-5">
            <p className="text-xs font-semibold text-primary mb-1">Resume</p>
            <p className="text-sm font-medium text-foreground">
              Continue with {currentConcept.title}
            </p>
            <a
              href={`#step-${progress.resumeIndex}`}
              className="mt-3 inline-flex items-center rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Jump to step {progress.resumeIndex + 1}
            </a>
          </div>
        )}

        <ol className="mt-8 space-y-4">
          {path.steps.map((step, i) => {
            const concept = pack.concepts.find((item) => item.id === step.conceptId);
            const outcome = step.practiceOutcome || step.practiceQuery;
            const practiceHref = step.practiceQuery
              ? withPackQuery(
                  `/ask?q=${encodeURIComponent(step.practiceQuery)}`,
                  pack.id
                )
              : conceptHref(step.conceptId, pack.id);
            const done = progress.done.includes(i);
            return (
              <li
                id={`step-${i}`}
                key={`${step.conceptId}-${i}`}
                className={`rounded-2xl border bg-card p-5 shadow-sm ${
                  done ? "border-primary/40" : "border-border"
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <p className="text-xs font-semibold text-primary">Lesson {i + 1}</p>
                    <h2 className="text-lg font-semibold text-foreground">
                      Understand {concept?.title ?? step.conceptId}
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => progress.toggle(i)}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                      done
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:text-foreground hover:bg-secondary"
                    }`}
                  >
                    <Check className="h-3.5 w-3.5" />
                    {done ? "Completed" : "Mark complete"}
                  </button>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-3">{step.rationale}</p>
                {outcome ? (
                  <p className="text-sm text-foreground mb-4">
                    <span className="font-medium">Confirm: </span>
                    {outcome}
                  </p>
                ) : null}
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={practiceHref}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold rounded-full bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    <ListChecks className="h-3.5 w-3.5" />
                    Do this in Help
                  </Link>
                  {concept && (
                    <Link
                      href={conceptHref(concept.id, pack.id)}
                      className="inline-flex items-center gap-1.5 text-xs font-medium rounded-full border border-foreground/80 bg-card px-4 py-2 text-foreground hover:bg-secondary transition-colors"
                    >
                      <BookOpen className="h-3.5 w-3.5 text-primary" />
                      Background
                    </Link>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
