"use client";

import Link from "next/link";
import { ArrowRight, Route } from "lucide-react";
import { getConceptById, type SkillPath } from "@/lib/knowledge";
import { CATEGORY_COLORS } from "@/data/concepts";
import { usePathProgress } from "@/lib/path-progress";

export function SkillPathCard({ path }: { path: SkillPath }) {
  const progress = usePathProgress(path.id, path.steps.length);
  return (
    <Link
      href={`/paths/${path.id}`}
      className="group flex flex-col rounded-xl border border-border bg-card p-5 hover:border-primary/30 hover:shadow-md transition-all"
    >
      <div className="flex items-start gap-3 mb-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Route className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-foreground group-hover:text-primary">
            {path.title}
          </h3>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{path.summary}</p>
        </div>
      </div>
      <p className="text-[11px] text-muted-foreground mb-3">
        {path.estimatedMinutes ? `${path.estimatedMinutes} min · ` : ""}
        {path.difficulty ?? "intermediate"} · {progress.percent}% complete
      </p>
      <ol className="flex flex-wrap gap-1.5 mb-4">
        {path.steps.map((step, i) => {
          const concept = getConceptById(step.conceptId);
          return (
            <li
              key={`${step.conceptId}-${i}`}
              className="inline-flex items-center gap-1.5 text-[11px] rounded-full bg-secondary px-2 py-1"
            >
              <span className="text-muted-foreground">{i + 1}.</span>
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{
                  backgroundColor: concept ? CATEGORY_COLORS[concept.category] : undefined,
                }}
              />
              {concept?.title ?? step.conceptId}
            </li>
          );
        })}
      </ol>
      <span className="mt-auto inline-flex items-center gap-1.5 text-xs font-medium text-primary">
        {progress.percent > 0 ? "Resume path" : "Start path"}
        <ArrowRight className="h-3.5 w-3.5" />
      </span>
    </Link>
  );
}
