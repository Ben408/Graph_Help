import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Server-side probe of the hosted Graph engine (Railway).
 * Used by Vercel /admin so the browser does not need CORS to Railway yet,
 * and so missing NEXT_PUBLIC_ENGINE_URL shows a clear unhealthy state.
 */
export async function GET() {
  const base = (
    process.env.HOSTED_ENGINE_URL ||
    process.env.NEXT_PUBLIC_ENGINE_URL ||
    ""
  ).replace(/\/$/, "");

  if (!base) {
    return NextResponse.json({
      ok: false,
      ready: false,
      base: "",
      detail:
        "NEXT_PUBLIC_ENGINE_URL (or HOSTED_ENGINE_URL) is not set on this Vercel deployment. Railway is not wired yet — expected unhealthy until that URL exists.",
      triage: "Vercel project → Settings → Environment Variables → add Railway HTTPS URL",
      ui: {
        host: process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "vercel",
        env: process.env.VERCEL_ENV || process.env.NODE_ENV,
      },
    });
  }

  try {
    const res = await fetch(`${base}/api/health`, {
      cache: "no-store",
      signal: AbortSignal.timeout(12_000),
    });
    if (!res.ok) {
      return NextResponse.json({
        ok: false,
        ready: false,
        base,
        detail: `Hosted engine HTTP ${res.status}`,
        triage: "Open Railway service logs / confirm the public domain matches NEXT_PUBLIC_ENGINE_URL",
        ui: {
          host: process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "vercel",
          env: process.env.VERCEL_ENV || process.env.NODE_ENV,
        },
      });
    }
    const body = await res.json();
    return NextResponse.json({
      ok: true,
      ready: Boolean(body?.ready),
      base,
      body,
      detail: body?.ready
        ? undefined
        : body?.llm?.detail || "Engine reachable but not ready (LLM or OKF).",
      triage: body?.ready
        ? undefined
        : "Check Railway Ollama/embed + OKF/Chroma volume; RunPod chat if chat_ready is false",
      ui: {
        host: process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "vercel",
        env: process.env.VERCEL_ENV || process.env.NODE_ENV,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({
      ok: false,
      ready: false,
      base,
      detail: `Cannot reach hosted engine: ${message}`,
      triage:
        "Confirm Railway is deployed and publicly reachable, then set NEXT_PUBLIC_ENGINE_URL on Vercel and redeploy",
      ui: {
        host: process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "vercel",
        env: process.env.VERCEL_ENV || process.env.NODE_ENV,
      },
    });
  }
}
