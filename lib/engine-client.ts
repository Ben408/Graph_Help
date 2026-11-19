import { getEngineBase, getHostedEngineUrl } from "@/lib/runtime-target";

/** @deprecated Prefer getEngineBase() so local/hosted switch applies. */
export const ENGINE_BASE =
  process.env.NEXT_PUBLIC_ENGINE_URL?.replace(/\/$/, "") || "/engine-api";

export { getEngineBase, getHostedEngineUrl };

export type EngineAskResult = {
  ask_id: string;
  status: "queued" | "processing" | "completed" | "refused" | "failed";
  classification?: {
    feature: string;
    intent: string;
    task_type: string;
    search_query: string;
    help_topics: string[];
  } | null;
  answer?: {
    summary: string;
    steps: { instruction: string; detail: string; source_ids: string[] }[];
    notes: string[];
    sources: EngineSource[];
  } | null;
  sources: EngineSource[];
  coverage_gap?: string | null;
  refusal_reason?: "out_of_scope" | "ambiguous" | "insufficient_evidence" | null;
  error_code?: string | null;
  error_detail?: string | null;
  touched_concept_ids?: string[];
  skill_path_ids?: string[];
};

export type EngineSource = {
  source_id: string;
  source_url: string;
  title: string;
  heading_path: string;
  score: number;
};

export type EngineHealthPayload = {
  status?: string;
  ready?: boolean;
  pack?: string;
  app_env?: string;
  checked_at?: string;
  llm?: Record<string, unknown>;
  okf?: Record<string, unknown>;
  vector?: Record<string, unknown>;
  workspace?: Record<string, unknown>;
  jira?: { configured?: boolean };
};

export async function engineHealth(target?: "local" | "hosted"): Promise<{
  ok: boolean;
  ready?: boolean;
  detail?: string;
  body?: EngineHealthPayload;
  base?: string;
}> {
  const base = getEngineBase(target);
  if (!base) {
    return {
      ok: false,
      detail:
        "Hosted engine URL is not set. Add NEXT_PUBLIC_ENGINE_URL (Railway) in Vercel env, or switch to Local while developing.",
      base: "",
    };
  }
  try {
    const res = await fetch(`${base}/api/health`, { cache: "no-store" });
    if (!res.ok) return { ok: false, detail: `Engine HTTP ${res.status}`, base };
    const body = (await res.json()) as EngineHealthPayload;
    // Reachable but not ready means Ask will fail: Ollama/RunPod down or model missing.
    if (body?.ready === false) {
      const llm = body.llm as { detail?: string } | undefined;
      return {
        ok: true,
        ready: false,
        detail:
          llm?.detail ||
          "Engine is running but Ask is not ready (LLM or OKF).",
        body,
        base,
      };
    }
    return { ok: true, ready: true, body, base };
  } catch {
    return {
      ok: false,
      detail:
        base === "/engine-api"
          ? "Local knowledge engine is not running on port 8765."
          : `Cannot reach hosted engine at ${base}.`,
      base,
    };
  }
}

/** Full health probe used by Diagnostics (local URL or hosted via BFF). */
export async function fetchOpsHealth(target: "local" | "hosted"): Promise<{
  ok: boolean;
  ready?: boolean;
  detail?: string;
  body?: EngineHealthPayload;
  base?: string;
  via?: string;
}> {
  if (target === "hosted") {
    try {
      const res = await fetch("/api/ops/health", { cache: "no-store" });
      const payload = await res.json();
      return {
        ok: Boolean(payload.ok),
        ready: payload.ready,
        detail: payload.detail,
        body: payload.body,
        base: payload.base,
        via: "vercel-bff",
      };
    } catch (error) {
      return {
        ok: false,
        detail: error instanceof Error ? error.message : "Ops health request failed",
        via: "vercel-bff",
      };
    }
  }
  const local = await engineHealth("local");
  return { ...local, via: "local-rewrite" };
}

export type AskSubmitOptions = {
  module?: string;
  screen?: string;
  error_code?: string;
  help_url?: string;
  concept_ids?: string[];
  skill_path_id?: string;
  mode?: "ask" | "guided";
  preferred_source_ids?: string[];
};

function clamp(value: string | undefined, max: number): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return trimmed.length > max ? trimmed.slice(0, max) : trimmed;
}

/** Prefer a short Help/doc URL; strip oversized Intacct app query strings. */
function normalizeHelpUrl(raw: string | undefined): string | undefined {
  const value = clamp(raw, 2000);
  if (!value) return undefined;
  try {
    const u = new URL(value);
    // In-app Intacct URLs are context, not Help — omit so they cannot 422 Ask.
    if (/\.intacct\.com$/i.test(u.hostname) && !/help/i.test(u.pathname)) {
      return undefined;
    }
    // Keep identity without giant query blobs.
    if (value.length > 1800) {
      return clamp(`${u.origin}${u.pathname}`, 2000);
    }
  } catch {
    /* keep clamped string */
  }
  return value;
}

export async function submitAsk(
  text: string,
  options: AskSubmitOptions = {}
): Promise<EngineAskResult> {
  const body: Record<string, unknown> = {
    text: clamp(text, 20_000) || text,
  };
  const module = clamp(options.module, 100);
  const screen = clamp(options.screen, 200);
  const errorCode = clamp(options.error_code, 100);
  const helpUrl = normalizeHelpUrl(options.help_url);
  const skillPathId = clamp(options.skill_path_id, 80);
  if (module) body.module = module;
  if (screen) body.screen = screen;
  if (errorCode) body.error_code = errorCode;
  if (helpUrl) body.help_url = helpUrl;
  if (options.concept_ids?.length) {
    body.concept_ids = options.concept_ids.slice(0, 24);
  }
  if (skillPathId) body.skill_path_id = skillPathId;
  if (options.mode) body.mode = options.mode;
  if (options.preferred_source_ids?.length) {
    body.preferred_source_ids = options.preferred_source_ids.slice(0, 12);
  }
  const res = await fetch(`${getEngineBase()}/api/ask`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    let detail = "";
    try {
      const errBody = await res.json();
      const first = Array.isArray(errBody?.detail) ? errBody.detail[0] : null;
      if (first?.msg) {
        detail = `: ${first.loc?.join(".") || "body"} ${first.msg}`;
      } else if (typeof errBody?.detail === "string") {
        detail = `: ${errBody.detail}`;
      }
    } catch {
      /* ignore */
    }
    throw new Error(`Ask failed (${res.status})${detail}`);
  }
  return res.json();
}

export type ContextResolveResult = {
  conceptIds: string[];
  skillPathIds: string[];
  suggestedQuery: string;
  module: string | null;
  screen: string | null;
  mapped: boolean;
};

export async function resolveContext(params: {
  module?: string;
  screen?: string;
  title?: string;
  help_url?: string;
}): Promise<ContextResolveResult | null> {
  const q = new URLSearchParams();
  if (params.module) q.set("module", params.module);
  if (params.screen) q.set("screen", params.screen);
  if (params.title) q.set("title", params.title);
  if (params.help_url) q.set("help_url", params.help_url);
  try {
    const res = await fetch(`${getEngineBase()}/api/context/resolve?${q}`);
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function getAsk(askId: string): Promise<EngineAskResult> {
  const res = await fetch(`${getEngineBase()}/api/ask/${askId}`);
  if (!res.ok) throw new Error(`Ask lookup failed (${res.status})`);
  return res.json();
}

export async function startRefresh(): Promise<{ refresh_id: string }> {
  const res = await fetch(`${getEngineBase()}/api/corpus/refresh`, { method: "POST" });
  if (!res.ok) throw new Error(`Refresh failed (${res.status})`);
  return res.json();
}

export async function getRefresh(id: string): Promise<{
  status: string;
  message?: string | null;
}> {
  const res = await fetch(`${getEngineBase()}/api/corpus/refresh/${id}`);
  if (!res.ok) throw new Error(`Refresh lookup failed (${res.status})`);
  return res.json();
}

export type PilotBugContext = {
  module?: string;
  screen?: string;
  title?: string;
  helpUrl?: string;
  panelMode?: string;
  extensionVersion?: string;
  distribution?: string;
  surface?: string;
};

export type PilotBugResult = {
  ok: boolean;
  key: string;
  url?: string;
  mirrored?: string;
};

export async function submitPilotBug(input: {
  description: string;
  screenshotDataUrl: string;
  context?: PilotBugContext;
}): Promise<PilotBugResult> {
  const ctx = input.context || {};
  const body: Record<string, unknown> = {
    description: clamp(input.description, 8_000) || input.description,
    screenshot_data_url: input.screenshotDataUrl,
    client_ts: new Date().toISOString(),
  };
  const module = clamp(ctx.module, 100);
  const screen = clamp(ctx.screen, 200);
  const title = clamp(ctx.title, 200);
  const helpUrl = normalizeHelpUrl(ctx.helpUrl);
  const panelMode = clamp(ctx.panelMode, 40);
  const extensionVersion = clamp(ctx.extensionVersion, 40);
  const distribution = clamp(ctx.distribution, 40);
  const surface = clamp(ctx.surface, 40);
  if (module) body.module = module;
  if (screen) body.screen = screen;
  if (title) body.title = title;
  if (helpUrl) body.help_url = helpUrl;
  if (panelMode) body.panel_mode = panelMode;
  if (extensionVersion) body.extension_version = extensionVersion;
  if (distribution) body.distribution = distribution;
  if (surface) body.surface = surface;

  const res = await fetch(`${getEngineBase()}/api/pilot/bugs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    let detail = "";
    try {
      const errBody = await res.json();
      if (typeof errBody?.detail === "string") detail = errBody.detail;
    } catch {
      /* ignore */
    }
    throw new Error(detail || `Bug report failed (${res.status})`);
  }
  return res.json();
}
