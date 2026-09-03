"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Globe,
  Sparkles,
  Zap,
  FlaskConical,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import {
  highlights,
  allChanges,
  RELEASE_VERSION,
  RELEASE_DATE,
  RELEASE_SOURCE_URL,
} from "@/data/release-notes";
import { CATEGORY_COLORS } from "@/data/concepts";
import { SiteHeader } from "@/components/site-header";

const AREA_COLORS: Record<string, string> = {
  "Sage Copilot": "#10b981",
  "AI and Automation": "#ef4444",
  "Accounts Payable": "#3b82f6",
  "Accounts Receivable": "#f59e0b",
  "Cash Management": "#8b5cf6",
  Purchasing: "#14b8a6",
  "Fixed Assets": "#a855f7",
  Construction: "#f97316",
  "Revenue Management": "#f97316",
  "Tax & Compliance": "#64748b",
  "Tax": "#64748b",
  "Time & Expenses": "#f43f5e",
  "User Interface": "#06b6d4",
  "Platform & API": "#ef4444",
  Consolidation: "#ec4899",
  Reporting: "#06b6d4",
};

function getAreaColor(area: string) {
  return (
    AREA_COLORS[area] ||
    CATEGORY_COLORS[area] ||
    "#6b7280"
  );
}

export function WhatsNewContent() {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set()
  );
  const [view, setView] = useState<"highlights" | "all">("highlights");

  const toggleSection = (area: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(area)) {
        next.delete(area);
      } else {
        next.add(area);
      }
      return next;
    });
  };

  const expandAll = () => {
    setExpandedSections(new Set(allChanges.map((s) => s.area)));
  };

  const collapseAll = () => {
    setExpandedSections(new Set());
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Hero banner */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,hsl(var(--primary)/0.12),transparent_50%),radial-gradient(ellipse_at_bottom_right,hsl(160_84%_39%/0.08),transparent_50%)]" />
        <div className="relative mx-auto max-w-7xl px-4 lg:px-6 py-12 md:py-16">
          <div className="flex items-center gap-2 mb-4">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Home
            </Link>
          </div>

          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-4 py-1.5 text-xs font-semibold text-primary mb-4">
                <Zap className="h-3.5 w-3.5" />
                Latest Release
              </div>
              <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-semibold text-foreground text-balance">
                {RELEASE_VERSION}{" "}
                <span className="text-primary">Release Notes</span>
              </h1>
              <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  {RELEASE_DATE}
                </span>
                <span className="flex items-center gap-1.5">
                  <Globe className="h-4 w-4" />
                  All supported regions
                </span>
              </div>
              <p className="mt-4 text-muted-foreground max-w-2xl leading-relaxed">
                Discover new features including Sage Copilot Close Workspace,
                AP Automation enhancements, Vendor Payments powered by
                MineralTree, and major improvements across purchasing,
                construction, and reporting.
              </p>
            </div>

            <a
              href={RELEASE_SOURCE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground hover:bg-secondary transition-colors"
            >
              View on Sage Help Center
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </section>

      {/* Quick stats */}
      <section className="border-b border-border bg-card/50">
        <div className="mx-auto max-w-7xl px-4 lg:px-6 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">
                {highlights.length}
              </p>
              <p className="text-sm text-muted-foreground mt-1">Highlights</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">
                {allChanges.reduce((a, s) => a + s.features.length, 0)}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Total Changes
              </p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">
                {allChanges.length}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Module Areas
              </p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">7</p>
              <p className="text-sm text-muted-foreground mt-1">Regions</p>
            </div>
          </div>
        </div>
      </section>

      {/* View toggle */}
      <div className="mx-auto max-w-7xl px-4 lg:px-6 pt-8">
        <div className="flex items-center gap-1 rounded-lg bg-secondary/50 p-1 w-fit">
          <button
            type="button"
            onClick={() => setView("highlights")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              view === "highlights"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span className="flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5" />
              Highlights
            </span>
          </button>
          <button
            type="button"
            onClick={() => setView("all")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              view === "all"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span className="flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5" />
              All Changes
            </span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-7xl px-4 lg:px-6 py-8 pb-16">
        {view === "highlights" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {highlights.map((h, i) => {
              const color = getAreaColor(h.area);
              return (
                <div
                  key={i}
                  className="group rounded-xl border border-border bg-card p-5 hover:border-primary/20 hover:shadow-md transition-all"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span
                      className="h-2.5 w-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    <span
                      className="text-[10px] font-semibold uppercase tracking-wider"
                      style={{ color }}
                    >
                      {h.area}
                    </span>
                    {h.isEarlyAdopter && (
                      <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-medium bg-amber-500/10 text-amber-500 rounded-full px-2 py-0.5">
                        <FlaskConical className="h-3 w-3" />
                        Early Adopter
                      </span>
                    )}
                    {h.isGeneralAvailability && (
                      <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-medium bg-primary/10 text-primary rounded-full px-2 py-0.5">
                        <CheckCircle2 className="h-3 w-3" />
                        GA
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-semibold text-foreground mb-2 text-pretty">
                    {h.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    {h.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-1.5">
                      {h.regions.slice(0, 3).map((r) => (
                        <span
                          key={r}
                          className="text-[10px] text-muted-foreground bg-secondary rounded-full px-2 py-0.5"
                        >
                          {r}
                        </span>
                      ))}
                      {h.regions.length > 3 && (
                        <span className="text-[10px] text-muted-foreground bg-secondary rounded-full px-2 py-0.5">
                          +{h.regions.length - 3} more
                        </span>
                      )}
                    </div>
                    {h.relatedConceptId && (
                      <Link
                        href={`/concept/${h.relatedConceptId}`}
                        className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                      >
                        Learn more
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-end gap-3 mb-2">
              <button
                type="button"
                onClick={expandAll}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Expand all
              </button>
              <span className="text-muted-foreground/30">|</span>
              <button
                type="button"
                onClick={collapseAll}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Collapse all
              </button>
            </div>

            {allChanges.map((section) => {
              const isExpanded = expandedSections.has(section.area);
              const color = getAreaColor(section.area);

              return (
                <div
                  key={section.area}
                  className="rounded-xl border border-border bg-card overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => toggleSection(section.area)}
                    className="w-full flex items-center gap-3 px-5 py-4 hover:bg-secondary/30 transition-colors text-left"
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    )}
                    <span
                      className="h-3 w-3 rounded-full shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-sm font-semibold text-foreground">
                      {section.area}
                    </span>
                    <span className="ml-auto text-xs text-muted-foreground bg-secondary rounded-full px-2.5 py-0.5">
                      {section.features.length} feature
                      {section.features.length !== 1 ? "s" : ""}
                    </span>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-border divide-y divide-border">
                      {section.features.map((feature, i) => (
                        <div
                          key={i}
                          className="px-5 py-4 pl-14 flex flex-col sm:flex-row sm:items-start gap-3"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="text-sm font-medium text-foreground">
                                {feature.title}
                              </h4>
                              {feature.isEarlyAdopter && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-amber-500/10 text-amber-500 rounded-full px-2 py-0.5 shrink-0">
                                  <FlaskConical className="h-2.5 w-2.5" />
                                  EA
                                </span>
                              )}
                              {feature.isGA && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-primary/10 text-primary rounded-full px-2 py-0.5 shrink-0">
                                  GA
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              {feature.description}
                            </p>
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {feature.regions.map((r) => (
                                <span
                                  key={r}
                                  className="text-[10px] text-muted-foreground bg-secondary rounded-full px-2 py-0.5"
                                >
                                  {r}
                                </span>
                              ))}
                            </div>
                          </div>
                          {feature.relatedConceptId && (
                            <Link
                              href={`/concept/${feature.relatedConceptId}`}
                              className="shrink-0 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                            >
                              View concept
                              <ArrowRight className="h-3 w-3" />
                            </Link>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
