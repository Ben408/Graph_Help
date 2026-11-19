"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  fetchOpsHealth,
  getRefresh,
  startRefresh,
  type EngineHealthPayload,
} from "@/lib/engine-client";
import {
  getHostedEngineUrl,
  getStoredRuntimeTarget,
  isLocalDevHost,
  runtimeTargetLabel,
  setStoredRuntimeTarget,
  type RuntimeTarget,
} from "@/lib/runtime-target";

type CardState = "ok" | "degraded" | "down" | "unknown" | "expected";

type HealthCard = {
  id: string;
  title: string;
  state: CardState;
  summary: string;
  triage: string;
  detail?: string;
};

function stateBadge(state: CardState) {
  switch (state) {
    case "ok":
      return <Badge className="bg-emerald-700 hover:bg-emerald-700">Healthy</Badge>;
    case "degraded":
      return <Badge variant="secondary">Degraded</Badge>;
    case "expected":
      return <Badge variant="outline">Not wired yet</Badge>;
    case "down":
      return <Badge variant="destructive">Down</Badge>;
    default:
      return <Badge variant="outline">Checking…</Badge>;
  }
}

function overallFrom(cards: HealthCard[]): CardState {
  if (cards.some((c) => c.state === "unknown")) return "unknown";
  if (cards.some((c) => c.state === "down")) return "down";
  if (cards.some((c) => c.state === "degraded" || c.state === "expected")) return "degraded";
  return "ok";
}

function buildCards(input: {
  target: RuntimeTarget;
  ok: boolean;
  ready?: boolean;
  detail?: string;
  body?: EngineHealthPayload;
  base?: string;
  via?: string;
  hostedConfigured: boolean;
  localHost: boolean;
}): HealthCard[] {
  const { target, ok, ready, detail, body, base, via, hostedConfigured, localHost } = input;
  const llm = (body?.llm || {}) as Record<string, unknown>;
  const okf = (body?.okf || {}) as Record<string, unknown>;
  const vector = (body?.vector || {}) as Record<string, unknown>;
  const jira = body?.jira;

  const uiCard: HealthCard = {
    id: "ui",
    title: "Vercel UI",
    state: "ok",
    summary: localHost
      ? "Running on localhost (Next.js). Deploy this same /admin to Vercel for the hosted console."
      : "This Diagnostics page is served from the current deployment.",
    triage: "Vercel → Project → Deployments",
    detail: typeof window !== "undefined" ? window.location.origin : undefined,
  };

  if (target === "hosted" && !hostedConfigured && !ok) {
    return [
      uiCard,
      {
        id: "engine",
        title: "Railway engine",
        state: "expected",
        summary: detail || "Hosted engine URL not configured.",
        triage: "Vercel env → NEXT_PUBLIC_ENGINE_URL = https://<railway-service>",
      },
      {
        id: "okf",
        title: "OKF",
        state: "expected",
        summary: "Waiting on Railway volume + Friday / seed ingest.",
        triage: "Railway volume → engine/data/okf",
      },
      {
        id: "vector",
        title: "Vector store (Chroma)",
        state: "expected",
        summary: "Waiting on Railway volume + Friday ingest.",
        triage: "Railway volume → engine/data/vector_store",
      },
      {
        id: "embed",
        title: "Embeddings",
        state: "expected",
        summary: "Will live on Railway (CPU) with the engine.",
        triage: "Railway Ollama / embed model after engine is up",
      },
      {
        id: "chat",
        title: "Chat LLM (RunPod / Gemma)",
        state: "expected",
        summary: "RunPod Serverless not wired yet — expected unhealthy.",
        triage: "RunPod flex endpoint → wire into Railway engine → re-check here",
      },
      {
        id: "jira",
        title: "Jira (bug reports)",
        state: "expected",
        summary: "Configured on Railway when JIRA_* env is set.",
        triage: "Railway env JIRA_BASE_URL, JIRA_EMAIL, JIRA_API_TOKEN, JIRA_PROJECT_KEY",
      },
    ];
  }

  const engineState: CardState = !ok ? "down" : ready === false ? "degraded" : "ok";
  const cards: HealthCard[] = [
    uiCard,
    {
      id: "engine",
      title: target === "local" ? "Local engine" : "Railway engine",
      state: engineState,
      summary: ok
        ? `Reachable${ready === false ? " but not fully ready" : ""}${body?.pack ? ` · pack ${body.pack}` : ""}`
        : detail || "Unreachable",
      triage:
        target === "local"
          ? "python -m uvicorn app:app --app-dir engine --host 127.0.0.1 --port 8765"
          : "Railway service logs / public domain / NEXT_PUBLIC_ENGINE_URL",
      detail: [base, via ? `via ${via}` : "", body?.checked_at ? `checked ${body.checked_at}` : ""]
        .filter(Boolean)
        .join(" · "),
    },
    {
      id: "okf",
      title: "OKF",
      state: !ok
        ? "down"
        : okf.available
          ? "ok"
          : "degraded",
      summary: okf.available
        ? `Available${typeof okf.concept_count === "number" ? ` · ${okf.concept_count} concepts` : ""}`
        : String(okf.message || "OKF bundle not available"),
      triage:
        target === "local"
          ? "engine/data/okf — run corpus refresh or build_okf"
          : "Railway volume okf + Friday ingest",
    },
    {
      id: "vector",
      title: "Vector store (Chroma)",
      state: !ok
        ? "down"
        : vector.available
          ? "ok"
          : "degraded",
      summary: vector.available
        ? `Available${typeof vector.count === "number" ? ` · ${vector.count} chunks` : ""}`
        : String(vector.detail || "Vector store empty or unavailable"),
      triage:
        target === "local"
          ? "Local Chroma under engine/data/vector_store"
          : "Railway volume vector_store — Friday refresh",
      detail: typeof vector.dir === "string" ? vector.dir : undefined,
    },
  ];

  const embedReady = Boolean(llm.embed_ready ?? llm.embed_model_pulled ?? llm.ready);
  const chatReady = Boolean(llm.chat_ready ?? llm.chat_model_pulled ?? llm.ready);
  const llmReachable = Boolean(llm.reachable);

  cards.push({
    id: "embed",
    title: "Embeddings",
    state: !ok ? "down" : embedReady ? "ok" : llmReachable ? "degraded" : "down",
    summary: embedReady
      ? `Ready · ${String(llm.embed_model || "embed model")}`
      : String(llm.detail || "Embed model not ready"),
    triage:
      target === "local"
        ? "Local Ollama: ollama pull nomic-embed-text"
        : "Railway CPU Ollama / embed path",
  });

  cards.push({
    id: "chat",
    title: target === "local" ? "Chat LLM (local Ollama)" : "Chat LLM (RunPod / Gemma)",
    state: !ok
      ? "down"
      : chatReady
        ? "ok"
        : llmReachable
          ? "degraded"
          : target === "hosted"
            ? "expected"
            : "down",
    summary: chatReady
      ? `Ready · ${String(llm.chat_model || "chat model")}`
      : target === "hosted" && !llmReachable
        ? "Not reachable yet (RunPod / engine LLM adapter not wired) — expected until RunPod is connected."
        : String(llm.detail || "Chat model not ready"),
    triage:
      target === "local"
        ? "Local Ollama: ollama pull gemma3:12b"
        : "RunPod Serverless flex (min 0) → Railway chat adapter",
    detail: typeof llm.base_url === "string" ? `base ${llm.base_url}` : undefined,
  });

  cards.push({
    id: "jira",
    title: "Jira (bug reports)",
    state: !ok ? "unknown" : jira?.configured ? "ok" : "degraded",
    summary: jira?.configured
      ? "Jira credentials configured on engine"
      : "Jira not configured on this engine (bug reports will fail or mirror locally)",
    triage: "Engine JIRA_* env (Railway for hosted)",
  });

  return cards;
}

export function AdminPageContent() {
  const localHost = isLocalDevHost();
  const hostedConfigured = Boolean(getHostedEngineUrl());
  const [target, setTarget] = useState<RuntimeTarget>("hosted");
  const [cards, setCards] = useState<HealthCard[]>([]);
  const [checking, setChecking] = useState(true);
  const [refreshStatus, setRefreshStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [lastError, setLastError] = useState("");

  useEffect(() => {
    setTarget(getStoredRuntimeTarget());
  }, []);

  const refreshHealth = useCallback(async (mode: RuntimeTarget) => {
    setChecking(true);
    setLastError("");
    try {
      if (mode === "local" && !isLocalDevHost()) {
        setCards([
          {
            id: "ui",
            title: "Vercel UI",
            state: "ok",
            summary: "Hosted Diagnostics is up.",
            triage: "Vercel deployments",
          },
          {
            id: "local",
            title: "Local engine",
            state: "expected",
            summary:
              "Local target only works when Next.js is running on your machine (rewrite → 127.0.0.1:8765). Use Local on localhost to develop against laptop Ollama + Chroma.",
            triage: "npm run dev locally → switch to Local on /admin",
          },
        ]);
        return;
      }
      const result = await fetchOpsHealth(mode);
      setCards(
        buildCards({
          target: mode,
          ok: result.ok,
          ready: result.ready,
          detail: result.detail,
          body: result.body,
          base: result.base,
          via: result.via,
          hostedConfigured,
          localHost: isLocalDevHost(),
        }),
      );
      if (!result.ok && result.detail) setLastError(result.detail);
    } catch (error) {
      setLastError(error instanceof Error ? error.message : "Health check failed");
      setCards([]);
    } finally {
      setChecking(false);
    }
  }, [hostedConfigured]);

  useEffect(() => {
    void refreshHealth(target);
  }, [target, refreshHealth]);

  const overall = useMemo(() => overallFrom(cards), [cards]);
  const engineOk = cards.find((c) => c.id === "engine")?.state === "ok" ||
    cards.find((c) => c.id === "engine")?.state === "degraded";

  function onTargetChange(next: RuntimeTarget) {
    setStoredRuntimeTarget(next);
    setTarget(next);
  }

  async function onRefresh() {
    setBusy(true);
    setRefreshStatus("Starting Help re-ingest…");
    try {
      const queued = await startRefresh();
      for (let i = 0; i < 600; i++) {
        const current = await getRefresh(queued.refresh_id);
        setRefreshStatus(current.message || current.status);
        if (["completed", "failed"].includes(current.status)) break;
        await new Promise((r) => setTimeout(r, 2000));
      }
      await refreshHealth(target);
    } catch (error) {
      setRefreshStatus(error instanceof Error ? error.message : "Refresh failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main id="main" className="mx-auto max-w-3xl px-4 lg:px-6 py-10">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-2">
          <h1 className="font-serif heading-display text-3xl font-semibold text-foreground">
            Diagnostics
          </h1>
          {stateBadge(checking ? "unknown" : overall)}
        </div>
        <p className="text-muted-foreground mb-6">
          Pilot ops console: system health and triage. Not part of the learner experience.
        </p>

        <section className="rounded-xl border border-border bg-card p-5 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold text-foreground mb-1">Runtime target</h2>
              <p className="text-sm text-muted-foreground">
                {runtimeTargetLabel(target)}. Affects Ask, bugs, and refresh from this browser.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Label htmlFor="runtime-target" className="text-sm text-muted-foreground">
                Local
              </Label>
              <Switch
                id="runtime-target"
                checked={target === "hosted"}
                onCheckedChange={(hosted) => onTargetChange(hosted ? "hosted" : "local")}
              />
              <Label htmlFor="runtime-target" className="text-sm text-muted-foreground">
                Hosted
              </Label>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3 font-mono">
            Hosted URL: {getHostedEngineUrl() || "(not set — NEXT_PUBLIC_ENGINE_URL)"}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void refreshHealth(target)}
              className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${checking ? "animate-spin" : ""}`} />
              Re-check
            </button>
          </div>
        </section>

        <div className="space-y-3 mb-6">
          {checking && cards.length === 0 ? (
            <p className="text-sm text-muted-foreground">Checking components…</p>
          ) : null}
          {cards.map((card) => (
            <section
              key={card.id}
              className="rounded-xl border border-border bg-card p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <h2 className="text-sm font-semibold text-foreground">{card.title}</h2>
                {stateBadge(card.state)}
              </div>
              <p className="text-sm text-foreground">{card.summary}</p>
              {card.detail ? (
                <p className="text-xs text-muted-foreground mt-2 font-mono break-all">
                  {card.detail}
                </p>
              ) : null}
              <p className="text-xs text-muted-foreground mt-2">
                <span className="font-medium text-foreground">Triage: </span>
                {card.triage}
              </p>
            </section>
          ))}
        </div>

        {lastError ? (
          <div className="rounded-xl border border-border bg-card p-4 mb-6 text-sm">
            <p className="font-medium text-foreground inline-flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Last probe note
            </p>
            <p className="text-muted-foreground mt-2">{lastError}</p>
          </div>
        ) : null}

        <section className="rounded-xl border border-border bg-card p-5 mb-6">
          <h2 className="text-sm font-semibold text-foreground mb-2">Corpus refresh</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Recrawl Help, rebuild Chroma, convert OKF. Runs on the selected engine target.
            Prefer Local while developing to avoid hosted cost.
          </p>
          <button
            type="button"
            disabled={busy || !engineOk}
            onClick={() => void onRefresh()}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-ring"
          >
            <RefreshCw className={`h-4 w-4 ${busy ? "animate-spin" : ""}`} />
            Re-ingest Help
          </button>
          {refreshStatus ? (
            <p className="text-sm text-muted-foreground mt-3">{refreshStatus}</p>
          ) : null}
        </section>

        <section
          id="writers-admin"
          className="rounded-xl border border-dashed border-border bg-card/40 p-5 mb-6"
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider rounded-full border border-border px-2 py-0.5 text-muted-foreground">
              Planned
            </span>
            <h2 className="text-sm font-semibold text-foreground">
              Writers admin (not built)
            </h2>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Future operator console for Ask feedback triage, council → writers, and OKF editing.
          </p>
        </section>

        <p className="text-xs text-muted-foreground mt-8">
          <Link href="/" className="underline focus-visible:ring-2 focus-visible:ring-ring rounded">
            Back to home
          </Link>
        </p>
      </main>
    </div>
  );
}
