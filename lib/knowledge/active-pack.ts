import { sageIntacctPack } from "@/packs/sage-intacct/pack";
import type { ContentPack } from "./types";

export const ACTIVE_PACK_ID = "sage-intacct";

export function getActivePack(): ContentPack {
  return sageIntacctPack;
}
