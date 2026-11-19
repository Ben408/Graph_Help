import { sageIntacctPack } from "@/packs/sage-intacct/pack";
import { sagePlanningPack } from "@/packs/sage-planning/pack";
import type { ContentPack } from "./types";
import {
  DEFAULT_PACK_ID,
  isPackId,
  type PackId,
} from "./product-detect";

const REGISTRY: Record<PackId, ContentPack> = {
  "sage-intacct": sageIntacctPack,
  "sage-planning": sagePlanningPack,
};

export function listPacks(): ContentPack[] {
  return Object.values(REGISTRY);
}

export function getPackById(packId: string | null | undefined): ContentPack {
  if (isPackId(packId)) return REGISTRY[packId];
  return REGISTRY[DEFAULT_PACK_ID];
}

export function knownPackIds(): PackId[] {
  return Object.keys(REGISTRY) as PackId[];
}
