export const ENGINE_BASE =
  process.env.NEXT_PUBLIC_ENGINE_URL?.replace(/\/$/, "") || "/engine-api";

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

export async function engineHealth(): Promise<{ ok: boolean; detail?: string }> {
  try {
    const res = await fetch(`${ENGINE_BASE}/api/health`);
    if (!res.ok) return { ok: false, detail: `Engine HTTP ${res.status}` };
    return { ok: true };
  } catch {
    return {
      ok: false,
      detail: "Knowledge engine is not running on port 8765.",
    };
  }
}

export async function submitAsk(text: string): Promise<EngineAskResult> {
  const res = await fetch(`${ENGINE_BASE}/api/ask`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) {
    throw new Error(`Ask failed (${res.status})`);
  }
  return res.json();
}

export async function getAsk(askId: string): Promise<EngineAskResult> {
  const res = await fetch(`${ENGINE_BASE}/api/ask/${askId}`);
  if (!res.ok) throw new Error(`Ask lookup failed (${res.status})`);
  return res.json();
}

export async function startRefresh(): Promise<{ refresh_id: string }> {
  const res = await fetch(`${ENGINE_BASE}/api/corpus/refresh`, { method: "POST" });
  if (!res.ok) throw new Error(`Refresh failed (${res.status})`);
  return res.json();
}

export async function getRefresh(id: string): Promise<{
  status: string;
  message?: string | null;
}> {
  const res = await fetch(`${ENGINE_BASE}/api/corpus/refresh/${id}`);
  if (!res.ok) throw new Error(`Refresh lookup failed (${res.status})`);
  return res.json();
}
