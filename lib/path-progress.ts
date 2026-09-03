"use client";

import { useCallback, useEffect, useState } from "react";

const KEY = "si-skill-path-progress-v1";

type Store = Record<string, { done: number[] }>;

function readStore(): Store {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}") as Store;
  } catch {
    return {};
  }
}

function writeStore(store: Store) {
  localStorage.setItem(KEY, JSON.stringify(store));
}

export function usePathProgress(pathId: string, stepCount: number) {
  const [done, setDone] = useState<number[]>([]);

  useEffect(() => {
    setDone(readStore()[pathId]?.done ?? []);
  }, [pathId]);

  const toggle = useCallback(
    (index: number) => {
      setDone((prev) => {
        const next = prev.includes(index)
          ? prev.filter((i) => i !== index)
          : [...prev, index].sort((a, b) => a - b);
        const store = readStore();
        store[pathId] = { done: next };
        writeStore(store);
        return next;
      });
    },
    [pathId]
  );

  const resumeIndex = done.length === 0 ? 0 : Math.min(Math.max(...done) + 1, stepCount - 1);
  const complete = stepCount > 0 && done.length >= stepCount;

  return { done, toggle, resumeIndex, complete, percent: stepCount ? Math.round((done.length / stepCount) * 100) : 0 };
}
