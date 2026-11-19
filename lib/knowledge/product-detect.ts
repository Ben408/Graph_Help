/** Resolve which Sage product pack a URL / host belongs to. */

export const PACK_IDS = ["sage-intacct", "sage-planning"] as const;
export type PackId = (typeof PACK_IDS)[number];

export const DEFAULT_PACK_ID: PackId = "sage-intacct";

const PACK_ID_SET = new Set<string>(PACK_IDS);

export function isPackId(value: string | null | undefined): value is PackId {
  return Boolean(value && PACK_ID_SET.has(value));
}

/**
 * Hostname / page URL → pack id.
 * Planning hosts are checked first so `intacct-planning.com` never maps to Intacct.
 */
export function detectPackIdFromUrl(
  urlOrHost: string | null | undefined
): PackId | null {
  if (!urlOrHost) return null;
  let host = urlOrHost.trim().toLowerCase();
  try {
    if (host.includes("://") || host.startsWith("//")) {
      host = new URL(host.startsWith("//") ? `https:${host}` : host).hostname;
    } else if (host.includes("/") && !host.includes(" ")) {
      // pathname-only — not enough for product detection
      return null;
    }
  } catch {
    /* treat as bare host */
  }
  host = host.replace(/^www\./, "");

  if (host === "intacct-planning.com" || host.endsWith(".intacct-planning.com")) {
    return "sage-planning";
  }
  if (host === "intacct.com" || host.endsWith(".intacct.com")) {
    return "sage-intacct";
  }
  return null;
}

/** Query `pack=`, then URL host, then default. */
export function resolvePackId(options?: {
  packId?: string | null;
  pageUrl?: string | null;
  helpUrl?: string | null;
}): PackId {
  if (isPackId(options?.packId)) return options!.packId!;
  return (
    detectPackIdFromUrl(options?.pageUrl) ||
    detectPackIdFromUrl(options?.helpUrl) ||
    DEFAULT_PACK_ID
  );
}
