"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTheme } from "next-themes";
import { Home } from "lucide-react";
import { PanelAsk } from "@/components/panel-ask";
import { PanelGuide } from "@/components/panel-guide";
import { PanelContextTab } from "@/components/panel-context-tab";
import {
  resolvePanelContext,
  type PanelMode,
  type ResolvedPanelContext,
} from "@/lib/panel-context";

function useForcedLightTheme() {
  const { setTheme } = useTheme();
  useEffect(() => {
    setTheme("light");
    document.documentElement.classList.remove("dark");
    document.documentElement.style.colorScheme = "light";
  }, [setTheme]);
}

const TABS: { id: PanelMode; label: string }[] = [
  { id: "help", label: "Ask" },
  { id: "guide", label: "Guide" },
  { id: "context", label: "Context" },
];

function mergeLiveContext(
  base: ResolvedPanelContext,
  live: Partial<{
    title: string;
    screen: string;
    module: string;
    ifmod: string;
    helpUrl: string;
  }>
): ResolvedPanelContext {
  const params = new URLSearchParams();
  params.set("mode", base.mode);
  params.set("title", live.title || base.title);
  params.set("screen", live.screen || base.screen);
  params.set("module", live.module || base.module);
  if (live.ifmod) params.set("ifmod", live.ifmod);
  params.set("help_url", live.helpUrl || base.helpUrl);
  if (base.q) params.set("q", base.q);
  if (base.skillPathId) params.set("path", base.skillPathId);
  if (base.conceptIds[0]) params.set("concept", base.conceptIds.join(","));
  return resolvePanelContext(params);
}

function PanelShellInner() {
  useForcedLightTheme();
  const searchParams = useSearchParams();
  const fromUrl = useMemo(
    () => resolvePanelContext(searchParams),
    [searchParams]
  );
  const [context, setContext] = useState(fromUrl);
  const [mode, setMode] = useState<PanelMode>(fromUrl.mode);
  const [focusConcept, setFocusConcept] = useState<string | null>(
    searchParams.get("focus") || searchParams.get("concept") || null
  );
  const [askSeed, setAskSeed] = useState(fromUrl.q || fromUrl.suggestedQuery);

  useEffect(() => {
    setContext(fromUrl);
    setMode(fromUrl.mode);
    setAskSeed(fromUrl.q || fromUrl.suggestedQuery);
  }, [fromUrl]);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      const data = event.data;
      if (!data || data.type !== "graph-help:context") return;
      // Soft updates from the extension must not reset the active tab or Ask state.
      // Only refresh page identity fields when they actually change.
      setContext((prev) => {
        const nextTitle = data.title || prev.title;
        const nextScreen = data.screen || prev.screen;
        const nextModule = data.module || prev.module;
        const nextIfmod = data.ifmod || "";
        const nextHelp = data.helpUrl || prev.helpUrl;
        if (
          nextTitle === prev.title &&
          nextScreen === prev.screen &&
          nextModule === prev.module &&
          nextHelp === prev.helpUrl
        ) {
          return prev;
        }
        // Keep current mode / ask seed; rematch spine for the new screen only.
        return {
          ...mergeLiveContext(prev, {
            title: nextTitle,
            screen: nextScreen,
            module: nextModule,
            ifmod: nextIfmod,
            helpUrl: nextHelp,
          }),
          mode: prev.mode,
        };
      });
    }
    window.addEventListener("message", onMessage);
    try {
      window.parent?.postMessage({ type: "graph-help:ready" }, "*");
    } catch {
      /* ignore */
    }
    return () => window.removeEventListener("message", onMessage);
  }, []);

  const openHelp = useCallback((query?: string) => {
    if (query) setAskSeed(query);
    setMode("help");
  }, []);

  const openContext = useCallback((conceptId?: string) => {
    if (conceptId) setFocusConcept(conceptId);
    setMode("context");
  }, []);

  const openGuide = useCallback(() => setMode("guide"), []);

  const openExpanded = useCallback(
    (path: string) => {
      // Wide modal over Intacct — not the narrow side panel.
      try {
        window.parent?.postMessage(
          {
            type: "graph-help:expand-home",
            path,
            title: context.title,
            screen: context.screen,
            module: context.module,
          },
          "*"
        );
      } catch {
        /* ignore */
      }
      if (window.parent === window) {
        window.location.href = path;
      }
    },
    [context.module, context.screen, context.title]
  );

  const openHomeExpanded = useCallback(() => {
    const params = new URLSearchParams();
    if (context.module) params.set("fromModule", context.module);
    if (context.screen) params.set("fromScreen", context.screen);
    const qs = params.toString();
    openExpanded(qs ? `/?${qs}` : "/");
  }, [context.module, context.screen, openExpanded]);

  const openSkillPath = useCallback(
    (pathId: string) => openExpanded(`/paths/${pathId}`),
    [openExpanded]
  );

  const openGraph = useCallback(
    (focusConceptId: string, pathId?: string) => {
      const params = new URLSearchParams();
      params.set("focus", focusConceptId);
      if (pathId) params.set("path", pathId);
      openExpanded(`/graph?${params.toString()}`);
    },
    [openExpanded]
  );

  const askContext: ResolvedPanelContext = {
    ...context,
    mode: "help",
    q: askSeed,
    suggestedQuery: askSeed || context.suggestedQuery,
  };

  const activeContext: ResolvedPanelContext = {
    ...context,
    mode,
    q: askSeed || context.q,
    suggestedQuery: askSeed || context.suggestedQuery,
  };

  return (
    <div className="h-screen flex flex-col bg-background text-foreground">
      <header className="shrink-0 border-b border-border px-3 pt-2 pb-0">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
            Smart Help
          </p>
          <button
            type="button"
            onClick={openHomeExpanded}
            className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
            title="Open Smart Help home as a wide overlay"
          >
            <Home className="h-3 w-3" />
            Home
          </button>
        </div>
        <nav className="flex gap-1" aria-label="Panel modes">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setMode(tab.id)}
              className={`px-3 py-2 text-sm font-medium rounded-t-md border-b-2 -mb-px ${
                mode === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </header>
      <main className="flex-1 min-h-0 overflow-y-auto">
        {/* Keep tabs mounted so Ask results (and Guide step) survive tab switches. */}
        <div className={mode === "help" ? "h-full" : "hidden"}>
          <PanelAsk
            context={askContext}
            onOpenContext={openContext}
            onOpenGuide={openGuide}
            onOpenSkillPath={openSkillPath}
          />
        </div>
        <div className={mode === "guide" ? "h-full" : "hidden"}>
          <PanelGuide
            context={activeContext}
            onAsk={openHelp}
            onOpenContext={openContext}
            onOpenSkillPath={openSkillPath}
          />
        </div>
        <div className={mode === "context" ? "h-full" : "hidden"}>
          <PanelContextTab
            context={activeContext}
            focusConceptId={focusConcept}
            onAskAbout={openHelp}
            onOpenSkillPath={openSkillPath}
            onOpenConceptPage={(id) => openExpanded(`/concept/${id}`)}
            onOpenGraph={openGraph}
          />
        </div>
      </main>
    </div>
  );
}

export function PanelShell() {
  return (
    <Suspense
      fallback={
        <div className="h-screen flex items-center justify-center text-sm text-muted-foreground">
          Loading panel…
        </div>
      }
    >
      <PanelShellInner />
    </Suspense>
  );
}
