/** Local vs hosted engine target for Diagnostics / Ask during pilot development. */

export type RuntimeTarget = "local" | "hosted";

const STORAGE_KEY = "smart-help:runtime-target";

export function isLocalDevHost(): boolean {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname;
  return host === "localhost" || host === "127.0.0.1";
}

export function getStoredRuntimeTarget(): RuntimeTarget {
  if (typeof window === "undefined") return "hosted";
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === "local" || raw === "hosted") return raw;
  } catch {
    /* ignore */
  }
  // Local Next.js defaults to local engine; Vercel defaults to hosted.
  return isLocalDevHost() ? "local" : "hosted";
}

export function setStoredRuntimeTarget(target: RuntimeTarget): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, target);
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new CustomEvent("smart-help:runtime-target", { detail: target }));
}

/** Hosted engine URL from env (Railway). Empty until that service exists. */
export function getHostedEngineUrl(): string {
  return (process.env.NEXT_PUBLIC_ENGINE_URL || "").replace(/\/$/, "");
}

/**
 * Resolve API base for the current target.
 * - local: Next rewrite `/engine-api` → 127.0.0.1:8765 (dev only)
 * - hosted: absolute Railway URL, or empty string if not configured
 */
export function getEngineBase(target?: RuntimeTarget): string {
  const mode = target ?? (typeof window !== "undefined" ? getStoredRuntimeTarget() : "hosted");
  if (mode === "local") {
    return "/engine-api";
  }
  return getHostedEngineUrl();
}

export function runtimeTargetLabel(target: RuntimeTarget): string {
  return target === "local" ? "Local (Ollama + Chroma)" : "Hosted (Railway + RunPod)";
}
