"use client";

import { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";
import { ENGINE_BASE } from "@/lib/engine-client";

type Procedure = {
  id: string;
  title: string;
  pageUrl: string;
};

export function PracticeLinks({ conceptId }: { conceptId: string }) {
  const [items, setItems] = useState<Procedure[]>([]);
  const [available, setAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`${ENGINE_BASE}/api/practice/${conceptId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((payload) => {
        if (cancelled || !payload) return;
        setAvailable(Boolean(payload.okfAvailable));
        setItems(payload.procedures || []);
      })
      .catch(() => {
        if (!cancelled) setAvailable(false);
      });
    return () => {
      cancelled = true;
    };
  }, [conceptId]);

  if (!available || items.length === 0) return null;

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-3">
        Practice in current Help
      </h2>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={item.pageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
            >
              {item.title}
              <ExternalLink className="h-3 w-3" />
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
