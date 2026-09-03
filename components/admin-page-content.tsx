"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { engineHealth, getRefresh, startRefresh } from "@/lib/engine-client";

export function AdminPageContent() {
  const [engineOk, setEngineOk] = useState<boolean | null>(null);
  const [engineDetail, setEngineDetail] = useState("");
  const [refreshStatus, setRefreshStatus] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    engineHealth().then((h) => {
      setEngineOk(h.ok);
      setEngineDetail(h.detail || "");
    });
  }, []);

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
        <h1 className="font-serif text-3xl font-semibold text-foreground mb-2">Diagnostics</h1>
        <p className="text-muted-foreground mb-8">
          Engine health and Help corpus refresh. This is not part of the learner experience.
        </p>

        <section className="rounded-xl border border-border bg-card p-5 mb-6">
          <h2 className="text-sm font-semibold text-foreground mb-2">Knowledge engine</h2>
          {engineOk === null ? (
            <p className="text-sm text-muted-foreground">Checking…</p>
          ) : engineOk ? (
            <p className="text-sm text-foreground">Engine is reachable.</p>
          ) : (
            <div className="text-sm">
              <p className="font-medium text-foreground inline-flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Engine offline
              </p>
              <p className="text-muted-foreground mt-2">{engineDetail}</p>
              <p className="text-muted-foreground mt-2 font-mono text-xs">
                python -m uvicorn app:app --app-dir engine --host 127.0.0.1 --port 8765
              </p>
            </div>
          )}
        </section>

        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold text-foreground mb-2">Corpus refresh</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Recrawl Help, rebuild Chroma, convert OKF, and regenerate concept copy. Can take a long time.
          </p>
          <button
            type="button"
            disabled={busy || engineOk === false}
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

        <p className="text-xs text-muted-foreground mt-8">
          <Link href="/" className="underline focus-visible:ring-2 focus-visible:ring-ring rounded">
            Back to home
          </Link>
        </p>
      </main>
    </div>
  );
}
