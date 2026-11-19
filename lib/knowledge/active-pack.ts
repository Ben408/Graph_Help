import { getPackById } from "./pack-registry";
import {
  DEFAULT_PACK_ID,
  isPackId,
  resolvePackId,
  type PackId,
} from "./product-detect";
import type { ContentPack } from "./types";

/** @deprecated Prefer resolvePackId / getPackById — kept for call sites. */
export const ACTIVE_PACK_ID = DEFAULT_PACK_ID;

let sessionPackId: PackId | null = null;

/** Client/session override (panel, product switcher). */
export function setSessionPackId(packId: string | null | undefined): void {
  sessionPackId = isPackId(packId) ? packId : null;
}

export function getSessionPackId(): PackId | null {
  return sessionPackId;
}

/**
 * Active pack for the current UI surface.
 * Resolution: explicit id → session → ?pack= (browser) → default Intacct.
 */
export function getActivePackId(explicit?: string | null): PackId {
  if (isPackId(explicit)) return explicit;
  if (sessionPackId) return sessionPackId;
  if (typeof window !== "undefined") {
    try {
      const pack = new URLSearchParams(window.location.search).get("pack");
      if (isPackId(pack)) return pack;
    } catch {
      /* ignore */
    }
  }
  return DEFAULT_PACK_ID;
}

export function getActivePack(explicit?: string | null): ContentPack {
  return getPackById(getActivePackId(explicit));
}

export function getPackForUrls(options: {
  packId?: string | null;
  pageUrl?: string | null;
  helpUrl?: string | null;
}): ContentPack {
  return getPackById(resolvePackId(options));
}
