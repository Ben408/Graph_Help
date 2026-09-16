"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Lightbulb,
  ListChecks,
  X,
} from "lucide-react";
import { CATEGORY_COLORS, getConceptById, getHelpLinkData } from "@/data/concepts";
import { getPathsForConcept } from "@/lib/knowledge";

// Deliberately not built on Radix Dialog: its modal layer sets
// pointer-events:none on document.body and restores it from layer bookkeeping,
// which leaves the whole page unclickable if the layer unmounts during a
// client-side navigation from a link inside the modal.
export function ConceptPeekDialog({
  conceptId,
  onClose,
}: {
  conceptId: string | null;
  onClose: () => void;
}) {
  const concept = conceptId ? getConceptById(conceptId) : null;
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!concept) return;
    closeButtonRef.current?.focus();
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [concept, onClose]);

  if (!concept) return null;

  const helpLink = getHelpLinkData(concept.id);
  const skillPaths = getPathsForConcept(concept.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60"
        aria-hidden="true"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="concept-peek-title"
        className="relative flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-lg border border-border bg-background shadow-lg"
      >
        <button
          ref={closeButtonRef}
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-sm p-1 text-muted-foreground opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>

        <div className="border-b border-border py-5 pl-8 pr-14">
          <p
            className="mb-1 text-xs font-medium"
            style={{ color: CATEGORY_COLORS[concept.category] }}
          >
            {concept.category}
          </p>
          <h2
            id="concept-peek-title"
            className="font-serif heading-display text-xl font-semibold text-foreground"
          >
            {concept.title}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {concept.summary}
          </p>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-8 py-6">
          <section>
            <div className="mb-1.5 flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Why it matters</h3>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {concept.whyItMatters}
            </p>
          </section>

          {concept.keyDetails.length > 0 && (
            <section>
              <div className="mb-1.5 flex items-center gap-2">
                <Clock3 className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">When you use it</h3>
              </div>
              <ul className="space-y-2">
                {concept.keyDetails.slice(0, 4).map((detail) => (
                  <li
                    key={detail}
                    className="flex items-start gap-2.5 text-sm text-muted-foreground"
                  >
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    {detail}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {(concept.tasks?.length ?? 0) > 0 && (
            <section>
              <div className="mb-2 flex items-center gap-2">
                <ListChecks className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">Common tasks</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {concept.tasks!.map((task) => (
                  <Link
                    key={task}
                    href={`/ask?q=${encodeURIComponent(task)}`}
                    onClick={onClose}
                    className="rounded-full bg-secondary px-3 py-1.5 text-xs font-medium hover:bg-primary/10 hover:text-primary"
                  >
                    {task}
                  </Link>
                ))}
              </div>
            </section>
          )}

          {skillPaths.length > 0 && (
            <section>
              <h3 className="mb-2 text-sm font-semibold text-foreground">Skill Paths</h3>
              <div className="flex flex-wrap gap-2">
                {skillPaths.map((path) => (
                  <Link
                    key={path.id}
                    href={`/paths/${path.id}`}
                    onClick={onClose}
                    className="rounded-full bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary"
                  >
                    {path.title}
                  </Link>
                ))}
              </div>
            </section>
          )}

          {helpLink && (
            <section>
              <div className="mb-1.5 flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">Source documentation</h3>
              </div>
              <a
                href={helpLink.helpUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
              >
                Sage Intacct Help
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </section>
          )}
        </div>

        <div className="flex items-center justify-between gap-4 border-t border-border px-8 py-4">
          <p className="text-xs text-muted-foreground">Close to keep exploring the graph.</p>
          <Link
            href={`/concept/${concept.id}`}
            onClick={onClose}
            className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Open full page
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
