"use client";

import { useEffect, useState } from "react";
import { ENGINE_BASE } from "@/lib/engine-client";

type Rating = "helpful" | "partly_helpful" | "not_helpful";

const REASONS = [
  { id: "wrong_source", label: "Wrong source" },
  { id: "missing_detail", label: "Missing detail" },
  { id: "unclear_steps", label: "Unclear steps" },
  { id: "should_have_refused", label: "Should have refused" },
  { id: "other", label: "Other" },
] as const;

function storageKey(askId: string) {
  return `ask-feedback:${askId}`;
}

export function AskFeedback({
  askId,
  status,
}: {
  askId: string;
  status: "completed" | "refused" | "failed";
}) {
  const [rating, setRating] = useState<Rating | null>(null);
  const [reason, setReason] = useState<string>("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey(askId));
      if (!raw) return;
      const parsed = JSON.parse(raw) as { rating?: Rating; reason?: string };
      if (parsed.rating) {
        setRating(parsed.rating);
        setReason(parsed.reason || "");
        setSaved(true);
      }
    } catch {
      /* ignore */
    }
  }, [askId]);

  async function submit(next: Rating, nextReason?: string) {
    const effectiveReason = next === "helpful" ? "" : (nextReason ?? reason);
    setRating(next);
    if (nextReason !== undefined) setReason(nextReason);
    const payload = {
      ask_id: askId,
      status,
      rating: next,
      reason: effectiveReason,
      client_ts: new Date().toISOString(),
    };
    try {
      localStorage.setItem(storageKey(askId), JSON.stringify(payload));
    } catch {
      /* ignore quota */
    }
    try {
      await fetch(`${ENGINE_BASE}/api/ask/${encodeURIComponent(askId)}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch {
      /* offline engine — local copy still kept */
    }
    setSaved(true);
  }

  if (status !== "completed" && status !== "refused") return null;

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-sm font-medium text-foreground mb-2">Was this useful?</p>
      <div className="flex flex-wrap gap-2">
        {(
          [
            ["helpful", "Helpful"],
            ["partly_helpful", "Partly helpful"],
            ["not_helpful", "Not helpful"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => void submit(value)}
            className={`rounded-lg px-3 py-1.5 text-sm border focus-visible:ring-2 focus-visible:ring-ring ${
              rating === value
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:bg-secondary"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      {rating && rating !== "helpful" && (
        <div className="mt-3 flex flex-wrap gap-2">
          {REASONS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                void submit(rating, item.id);
              }}
              className={`rounded-full px-2.5 py-1 text-xs border ${
                reason === item.id
                  ? "border-primary text-primary"
                  : "border-border text-muted-foreground"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
      {saved && (
        <p className="mt-2 text-xs text-muted-foreground">
          Thanks — saved for this answer (no account required).
        </p>
      )}
    </div>
  );
}
