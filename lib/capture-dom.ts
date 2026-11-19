/**
 * Snapshot a DOM subtree to a PNG data URL for pilot bug reports.
 * Uses SVG foreignObject + canvas (no extra npm dependency).
 * Paste/upload remain available if capture fails in some browsers.
 */

export async function captureElementPng(
  element: HTMLElement,
  options?: { maxHeight?: number; pixelRatio?: number }
): Promise<string> {
  const maxHeight = options?.maxHeight ?? 2400;
  const pixelRatio =
    options?.pixelRatio ?? Math.min(window.devicePixelRatio || 1, 2);

  const width = Math.max(element.scrollWidth, element.clientWidth, 1);
  const height = Math.min(
    Math.max(element.scrollHeight, element.clientHeight, 1),
    maxHeight
  );

  const clone = element.cloneNode(true) as HTMLElement;
  clone.querySelectorAll("[data-report-bug-ui]").forEach((node) => node.remove());
  clone.setAttribute(
    "style",
    `${clone.getAttribute("style") || ""};width:${width}px;height:${height}px;overflow:hidden;background:#fff;`
  );

  const css = inlineStylesheets();
  const xhtml = new XMLSerializer().serializeToString(clone);
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
  <foreignObject width="100%" height="100%">
    <div xmlns="http://www.w3.org/1999/xhtml" style="width:${width}px;height:${height}px;background:#fff;">
      <style>${css.replace(/]]>|<script/gi, "")}</style>
      ${xhtml}
    </div>
  </foreignObject>
</svg>`;

  const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  try {
    const img = await loadImage(url);
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas unavailable");
    ctx.scale(pixelRatio, pixelRatio);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);
    return canvas.toDataURL("image/png");
  } finally {
    URL.revokeObjectURL(url);
  }
}

function inlineStylesheets(): string {
  const parts: string[] = [];
  for (const sheet of Array.from(document.styleSheets)) {
    try {
      const rules = sheet.cssRules;
      if (!rules) continue;
      const css = Array.from(rules)
        .map((r) => r.cssText)
        .join("\n");
      if (css) parts.push(css);
    } catch {
      if (sheet.href) {
        parts.push(`@import url("${sheet.href}");`);
      }
    }
  }
  return parts.join("\n");
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to render screenshot"));
    img.src = src;
  });
}

export function fileToDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Could not read image file"));
    reader.readAsDataURL(file);
  });
}
