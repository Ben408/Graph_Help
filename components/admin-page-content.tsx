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
        <h1 className="font-serif heading-display text-3xl font-semibold text-foreground mb-2">
          Diagnostics
        </h1>
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

        <section className="rounded-xl border border-border bg-card p-5 mb-6">
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
          <p className="text-sm text-muted-foreground leading-relaxed mb-3">
            Future operator / instructional-writer console — separate from this
            learner Diagnostics page. Placeholder only; no UI yet. TBD after the
            demo, but intended as a durable tool for content developers (not a
            one-off scaffold).
          </p>
          <ul className="text-sm text-muted-foreground space-y-2 list-disc pl-5">
            <li>
              <span className="text-foreground">Ask feedback triage</span> —
              capture question, answer/refuse payload, rating, and reason;
              review queue for authors (today ratings land in{" "}
              <code className="text-xs">engine/data/runs/ask_feedback.jsonl</code>{" "}
              without request/output pairing).
            </li>
            <li>
              <span className="text-foreground">Council → writers</span> —
              surface council results to writers with valid minority
              recommendations, proposed remediation, and the editor panel.
              Today singleton curriculum bullets fold into{" "}
              <code className="text-xs">specialized_aside</code> / dissent; the
              handoff should distinguish{" "}
              <span className="text-foreground">genuinely specialized</span>{" "}
              material,{" "}
              <span className="text-foreground">plausible but unsupported</span>{" "}
              suggestions, and{" "}
              <span className="text-foreground">
                grounded recommendations that lacked council agreement
              </span>
              .
            </li>
            <li>
              <span className="text-foreground">OKF editor</span> — simple
              YAML front-matter add/remove/populate plus body text edit for OKF
              topics (no auto-publish to Help).
            </li>
          </ul>
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
