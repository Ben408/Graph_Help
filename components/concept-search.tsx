"use client";

import React from "react";

import { useState, useRef, useEffect, useCallback } from "react";
import { Search, X, ExternalLink, Route, ListChecks } from "lucide-react";
import { CATEGORY_COLORS, buildSageSearchUrl, type Concept } from "@/data/concepts";
import { routeQuery } from "@/lib/knowledge";
import { useRouter } from "next/navigation";

interface ConceptSearchProps {
  className?: string;
  placeholder?: string;
  autoFocus?: boolean;
  onSelect?: (concept: Concept) => void;
  size?: "sm" | "md" | "lg";
}

export function ConceptSearch({
  className = "",
  placeholder = "Search concepts, paths, or how-to…",
  autoFocus = false,
  onSelect,
  size = "md",
}: ConceptSearchProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const routed = query.length >= 2 ? routeQuery(query) : null;
  const conceptHits = (routed?.conceptHits ?? []).slice(0, 5);
  const pathHits = (routed?.skillPathHits ?? []).slice(0, 3);
  const showGoal = routed?.intent === "goal";
  const showSkillCue = routed?.intent === "skill" && pathHits.length > 0;

  type Row =
    | { kind: "goal"; href: string }
    | { kind: "path"; id: string; title: string }
    | { kind: "concept"; concept: Concept };

  const rows: Row[] = [];
  if (showGoal) {
    rows.push({ kind: "goal", href: `/ask?q=${encodeURIComponent(query)}` });
  }
  for (const path of pathHits) {
    rows.push({ kind: "path", id: path.id, title: path.title });
  }
  for (const hit of conceptHits) {
    rows.push({ kind: "concept", concept: hit.concept });
  }

  const handleSearch = useCallback((value: string) => {
    setQuery(value);
    setIsOpen(value.length >= 2);
    setSelectedIndex(0);
  }, []);

  const handleSelectConcept = useCallback(
    (concept: Concept) => {
      setQuery("");
      setIsOpen(false);
      if (onSelect) {
        onSelect(concept);
      } else {
        router.push(`/concept/${concept.id}`);
      }
    },
    [onSelect, router]
  );

  const activateRow = useCallback(
    (row: Row) => {
      setQuery("");
      setIsOpen(false);
      if (row.kind === "goal") router.push(row.href);
      else if (row.kind === "path") router.push(`/paths/${row.id}`);
      else handleSelectConcept(row.concept);
    },
    [handleSelectConcept, router]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, Math.max(rows.length - 1, 0)));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const row = rows[selectedIndex];
        if (row) activateRow(row);
        else if (showGoal) router.push(`/ask?q=${encodeURIComponent(query)}`);
        else router.push(`/search?q=${encodeURIComponent(query)}`);
      } else if (e.key === "Escape") {
        setIsOpen(false);
      }
    },
    [isOpen, rows, selectedIndex, activateRow, showGoal, query, router]
  );

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const sizeClasses = {
    sm: "h-9 text-sm px-3",
    md: "h-11 text-sm px-4",
    lg: "h-14 text-base px-5",
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        <Search
          className={`absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground ${
            size === "lg" ? "h-5 w-5 left-4" : "h-4 w-4"
          }`}
        />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => query.length >= 2 && setIsOpen(true)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className={`w-full rounded-lg border border-border bg-card text-foreground ${sizeClasses[size]} ${
            size === "lg" ? "pl-12" : "pl-10"
          } pr-10 outline-none ring-0 focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all placeholder:text-muted-foreground`}
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setIsOpen(false);
              inputRef.current?.focus();
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {isOpen && query.length >= 2 && (
        <div className="absolute z-50 top-full mt-2 w-full rounded-lg border border-border bg-card shadow-xl overflow-hidden">
          {showSkillCue && (
            <p className="px-4 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Skill paths
            </p>
          )}
          {rows.map((row, i) => {
            const active = i === selectedIndex;
            if (row.kind === "goal") {
              return (
                <button
                  key="goal"
                  type="button"
                  onClick={() => activateRow(row)}
                  onMouseEnter={() => setSelectedIndex(i)}
                  className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors ${
                    active ? "bg-secondary" : "hover:bg-secondary/50"
                  }`}
                >
                  <ListChecks className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">Answers</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Cited how-to from current Help
                    </p>
                  </div>
                </button>
              );
            }
            if (row.kind === "path") {
              return (
                <button
                  key={`path-${row.id}`}
                  type="button"
                  onClick={() => activateRow(row)}
                  onMouseEnter={() => setSelectedIndex(i)}
                  className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors ${
                    active ? "bg-secondary" : "hover:bg-secondary/50"
                  }`}
                >
                  <Route className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{row.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Skill path</p>
                  </div>
                </button>
              );
            }
            const concept = row.concept;
            return (
              <button
                key={concept.id}
                type="button"
                onClick={() => activateRow(row)}
                onMouseEnter={() => setSelectedIndex(i)}
                className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors ${
                  active ? "bg-secondary" : "hover:bg-secondary/50"
                }`}
              >
                <span
                  className="mt-1 h-2 w-2 rounded-full shrink-0"
                  style={{ backgroundColor: CATEGORY_COLORS[concept.category] }}
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {concept.title}
                  </p>
                  <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                    {concept.summary}
                  </p>
                </div>
                <span className="ml-auto shrink-0 text-[10px] font-medium text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                  {concept.category}
                </span>
              </button>
            );
          })}
          {rows.length === 0 && (
            <div className="px-4 py-3 text-sm text-muted-foreground">
              No matching concepts. Try a skill path or Ask a how-to.
            </div>
          )}
          {query.length >= 2 && (
            <a
              href={buildSageSearchUrl(query)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-4 py-3 border-t border-border text-left hover:bg-primary/5 transition-colors"
            >
              <Search className="h-4 w-4 text-primary shrink-0" />
              <span className="text-sm text-primary">
                {"Search Sage Help Center for \"" + query + "\""}
              </span>
              <ExternalLink className="h-3.5 w-3.5 text-primary ml-auto shrink-0" />
            </a>
          )}
        </div>
      )}
    </div>
  );
}
