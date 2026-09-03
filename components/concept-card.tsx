"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { type Concept, CATEGORY_COLORS } from "@/data/concepts";

interface ConceptCardProps {
  concept: Concept;
  variant?: "default" | "compact";
}

export function ConceptCard({ concept, variant = "default" }: ConceptCardProps) {
  const color = CATEGORY_COLORS[concept.category];

  if (variant === "compact") {
    return (
      <Link
        href={`/concept/${concept.id}`}
        className="group flex items-center gap-3 rounded-lg border border-border bg-card p-3 hover:border-primary/30 hover:bg-secondary/50 transition-all"
      >
        <span
          className="h-2.5 w-2.5 rounded-full shrink-0"
          style={{ backgroundColor: color }}
        />
        <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate">
          {concept.title}
        </span>
        <ArrowRight className="ml-auto h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
      </Link>
    );
  }

  return (
    <Link
      href={`/concept/${concept.id}`}
      className="group relative flex flex-col rounded-xl border border-border bg-card p-5 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all"
    >
      <div className="flex items-center gap-2.5 mb-3">
        <span
          className="h-3 w-3 rounded-full"
          style={{ backgroundColor: color }}
        />
        <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
          {concept.category}
        </span>
      </div>
      <h3 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors mb-2 text-balance">
        {concept.title}
      </h3>
      <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2 mb-4">
        {concept.summary}
      </p>
      <div className="mt-auto flex items-center gap-1.5 text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
        <span>Explore</span>
        <ArrowRight className="h-3 w-3" />
      </div>
      <div
        className="absolute top-0 left-0 right-0 h-0.5 rounded-t-xl opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ backgroundColor: color }}
      />
    </Link>
  );
}
