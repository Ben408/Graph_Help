"use client";

import { useState, type ClipboardEvent } from "react";
import { Bug, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { fileToDataUrl } from "@/lib/capture-dom";
import { submitPilotBug, type PilotBugContext } from "@/lib/engine-client";

export function PanelReportBugButton({
  context,
}: {
  context: PilotBugContext;
}) {
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [filedKey, setFiledKey] = useState<string | null>(null);

  function openReporter() {
    setSubmitError(null);
    setFiledKey(null);
    setDescription("");
    setScreenshot(null);
    setOpen(true);
  }

  async function applyImageFile(file: File | null) {
    if (!file || !file.type.startsWith("image/")) return;
    try {
      const dataUrl = await fileToDataUrl(file);
      setScreenshot(dataUrl);
      setSubmitError(null);
    } catch {
      setSubmitError("Could not read that image. Try pasting again.");
    }
  }

  async function onPaste(event: ClipboardEvent) {
    const items = event.clipboardData?.items;
    if (!items) return;
    for (const item of Array.from(items)) {
      if (item.type.startsWith("image/")) {
        event.preventDefault();
        await applyImageFile(item.getAsFile());
        return;
      }
    }
  }

  async function onSubmit() {
    const text = description.trim();
    if (!screenshot) {
      setSubmitError("Paste a screenshot first (Ctrl + V).");
      return;
    }
    if (text.length < 3) {
      setSubmitError("Add a short description of the issue.");
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      const result = await submitPilotBug({
        description: text,
        screenshotDataUrl: screenshot,
        context: {
          ...context,
          surface: "paste",
        },
      });
      setFiledKey(result.key);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Could not file the bug."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={openReporter}
        className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground"
        title="Report a bug to the pilot backlog"
      >
        <Bug className="h-3 w-3" />
        Report a bug
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        {open ? (
        <DialogContent
          data-report-bug-ui
          className="max-w-md max-h-[90vh] overflow-y-auto"
          onPaste={onPaste}
        >
          <DialogHeader>
            <DialogTitle>Report a bug</DialogTitle>
            <DialogDescription>
              Files to the pilot Jira backlog. Screenshots may include company
              data visible on screen.
            </DialogDescription>
          </DialogHeader>

          {filedKey ? (
            <div className="space-y-3 py-2">
              <p className="text-sm text-foreground">
                Thanks — filed as{" "}
                <span className="font-medium">{filedKey}</span>. You can keep
                testing.
              </p>
              <DialogFooter>
                <button
                  type="button"
                  className="rounded-lg bg-primary px-3 py-1.5 text-sm text-primary-foreground"
                  onClick={() => setOpen(false)}
                >
                  Done
                </button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-3">
              <ol className="list-decimal list-inside space-y-1.5 rounded-lg border border-border bg-secondary/30 px-3 py-2.5 text-xs text-foreground">
                <li>
                  Press{" "}
                  <kbd className="rounded border border-border bg-background px-1 py-0.5 font-mono text-[10px]">
                    Win
                  </kbd>{" "}
                  +{" "}
                  <kbd className="rounded border border-border bg-background px-1 py-0.5 font-mono text-[10px]">
                    Shift
                  </kbd>{" "}
                  +{" "}
                  <kbd className="rounded border border-border bg-background px-1 py-0.5 font-mono text-[10px]">
                    S
                  </kbd>{" "}
                  to capture the screen
                </li>
                <li>
                  Click back here, then press{" "}
                  <kbd className="rounded border border-border bg-background px-1 py-0.5 font-mono text-[10px]">
                    Ctrl
                  </kbd>{" "}
                  +{" "}
                  <kbd className="rounded border border-border bg-background px-1 py-0.5 font-mono text-[10px]">
                    V
                  </kbd>{" "}
                  to paste
                </li>
                <li>Type a short description</li>
                <li>Click Send</li>
              </ol>

              <div
                className="rounded-lg border border-dashed border-border bg-background p-2 min-h-[7rem] flex items-center justify-center"
                tabIndex={0}
                onPaste={onPaste}
              >
                {screenshot ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={screenshot}
                    alt="Pasted screenshot preview"
                    className="w-full max-h-48 object-contain rounded-md"
                  />
                ) : (
                  <p className="text-xs text-muted-foreground text-center px-3">
                    Paste screenshot here (Ctrl + V)
                  </p>
                )}
              </div>

              <label className="block space-y-1">
                <span className="text-xs font-medium text-foreground">
                  What went wrong?
                </span>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  maxLength={8000}
                  placeholder="Describe the issue…"
                  className="w-full rounded-md border border-border bg-background px-2.5 py-2 text-sm resize-y min-h-[96px]"
                  disabled={submitting}
                  onPaste={onPaste}
                />
              </label>

              {submitError && (
                <p className="text-xs text-destructive">{submitError}</p>
              )}

              <DialogFooter>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-lg border border-border px-3 py-1.5 text-sm text-muted-foreground hover:bg-secondary"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void onSubmit()}
                  disabled={submitting}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm text-primary-foreground disabled:opacity-60"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Sending…
                    </>
                  ) : (
                    "Send"
                  )}
                </button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
        ) : null}
      </Dialog>
    </>
  );
}
