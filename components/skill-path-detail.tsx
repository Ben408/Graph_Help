"use client";

import Link from "next/link";
import { ArrowLeft, BookOpen, Check, ListChecks } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { getConceptById, getSkillPathById } from "@/lib/knowledge";
import { usePathProgress } from "@/lib/path-progress";

function difficultyLabel(value?: string) {
  if (value === "introductory") return "Introductory";
  if (value === "advanced") return "Advanced";
  return "Intermediate";
}

export function SkillPathDetail({ pathId }: { pathId: string }) {
  const path = getSkillPathById(pathId);
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
  const currentConcept = current ? getConceptById(current.conceptId) : undefined;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-3xl px-4 lg:px-6 py-10">
        <Link
          href="/paths"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          All Skill Paths
        </Link>

        <h1 className="font-serif text-3xl font-semibold text-foreground">{path.title}</h1>
        <p className="text-muted-foreground mt-2 leading-relaxed">{path.summary}</p>

        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          {path.estimatedMinutes ? (
            <span className="rounded-full bg-secondary px-2.5 py-1">{path.estimatedMinutes} min</span>
          ) : null}
          <span className="rounded-full bg-secondary px-2.5 py-1">{difficultyLabel(path.difficulty)}</span>
          <span className="rounded-full bg-secondary px-2.5 py-1">{progress.percent}% complete</span>
        </div>

        <dl className="mt-6 space-y-2 text-sm">
          <div>
            <dt className="font-medium text-foreground">Intended role</dt>
            <dd className="text-muted-foreground">{path.audience}</dd>
          </div>
          <div>
            <dt className="font-medium text-foreground">Goal</dt>
            <dd className="text-muted-foreground">{path.goal}</dd>
          </div>
          {path.completionCriteria ? (
            <div>
              <dt className="font-medium text-foreground">Done when</dt>
              <dd className="text-muted-foreground">{path.completionCriteria}</dd>
            </div>
          ) : null}
        </dl>

        {!progress.complete && currentConcept && (
          <div className="mt-6 rounded-xl border border-primary/30 bg-primary/5 p-4">
            <p className="text-xs font-medium text-primary mb-1">Resume</p>
            <p className="text-sm text-foreground">
              Continue with {currentConcept.title}
            </p>
            <a href={`#step-${progress.resumeIndex}`} className="text-xs text-primary mt-2 inline-block">
              Jump to step {progress.resumeIndex + 1}
            </a>
          </div>
        )}

        <ol className="mt-8 space-y-4">
          {path.steps.map((step, i) => {
            const concept = getConceptById(step.conceptId);
            const outcome = step.practiceOutcome || step.practiceQuery;
            const practiceHref = step.practiceQuery
              ? `/ask?q=${encodeURIComponent(step.practiceQuery)}`
              : `/concept/${step.conceptId}`;
            const done = progress.done.includes(i);
            return (
              <li
                id={`step-${i}`}
                key={`${step.conceptId}-${i}`}
                className={`rounded-xl border bg-card p-5 ${
                  done ? "border-primary/40" : "border-border"
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <p className="text-xs font-medium text-primary">Lesson {i + 1}</p>
                    <h2 className="text-lg font-semibold text-foreground">
                      Understand {concept?.title ?? step.conceptId}
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => progress.toggle(i)}
                    className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs ${
                      done
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:text-foreground"
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
                    className="inline-flex items-center gap-1.5 text-sm font-medium rounded-lg bg-primary px-3 py-2 text-primary-foreground"
                  >
                    <ListChecks className="h-4 w-4" />
                    Do this in Help
                  </Link>
                  {concept && (
                    <Link
                      href={`/concept/${concept.id}`}
                      className="inline-flex items-center gap-1.5 text-sm rounded-lg border border-border px-3 py-2 text-muted-foreground hover:text-foreground"
                    >
                      <BookOpen className="h-3.5 w-3.5" />
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
