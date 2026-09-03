"use client";

import { SiteHeader } from "@/components/site-header";
import { SkillPathCard } from "@/components/skill-path-card";
import { getSkillPaths } from "@/lib/knowledge";

export function SkillPathsContent() {
  const paths = getSkillPaths();
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-7xl px-4 lg:px-6 py-10">
        <h1 className="font-serif text-3xl font-semibold text-foreground mb-2">Learn</h1>
        <p className="text-muted-foreground max-w-2xl mb-8">
          Skill Paths are short, ordered lessons for a job. Track progress,
          practice a real outcome, then continue.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {paths.map((path) => (
            <SkillPathCard key={path.id} path={path} />
          ))}
        </div>
      </div>
    </div>
  );
}
