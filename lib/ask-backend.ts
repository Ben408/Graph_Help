/**
 * Answer backend selection for Ask surfaces:
 * - "ask": Smart Help Ask engine (cite-or-refuse, structured steps, local/hosted)
 * - "copilot": Sage Copilot Hybrid mode (Copilot answers inside our Concept Graph wrapper)
 */

export type AskBackend = "ask" | "copilot";

const STORAGE_KEY = "smart-help:ask-backend";
export const ASK_BACKEND_EVENT = "smart-help:ask-backend";

export function getStoredAskBackend(): AskBackend {
  if (typeof window === "undefined") return "ask";
  try {
    const param = new URLSearchParams(window.location.search).get("backend");
    if (param === "ask" || param === "copilot") return param;
  } catch {
    /* ignore */
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === "ask" || raw === "copilot") return raw;
  } catch {
    /* ignore */
  }
  return "ask";
}

export function setStoredAskBackend(backend: AskBackend): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, backend);
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new CustomEvent(ASK_BACKEND_EVENT, { detail: backend }));
}
