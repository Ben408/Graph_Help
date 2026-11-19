"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  getActivePackId,
  listPacks,
  setSessionPackId,
  type PackId,
} from "@/lib/knowledge";

/** Standalone demo control: switch Intacct vs Planning content packs. */
export function ProductSwitcher() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [packId, setPackId] = useState<PackId>("sage-intacct");

  useEffect(() => {
    const fromQuery = searchParams.get("pack");
    const id = getActivePackId(fromQuery);
    setPackId(id);
    setSessionPackId(id);
  }, [searchParams]);

  const onChange = useCallback(
    (next: PackId) => {
      setSessionPackId(next);
      setPackId(next);
      const params = new URLSearchParams(searchParams.toString());
      params.set("pack", next);
      const qs = params.toString();
      const href = qs ? `${pathname}?${qs}` : pathname;
      // Full navigation so every surface remounts against the selected pack.
      window.location.assign(href);
    },
    [pathname, searchParams]
  );

  return (
    <label className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
      <span className="hidden md:inline">Product</span>
      <select
        className="h-8 rounded-md border border-border bg-background px-2 text-sm text-foreground focus-visible:ring-2 focus-visible:ring-ring"
        value={packId}
        onChange={(e) => onChange(e.target.value as PackId)}
        aria-label="Sage product pack"
      >
        {listPacks().map((pack) => (
          <option key={pack.id} value={pack.id}>
            {pack.name}
          </option>
        ))}
      </select>
    </label>
  );
}
