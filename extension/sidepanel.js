const DEFAULT_UI_BASE = "http://127.0.0.1:3002";

/** Last context fingerprint applied to the iframe (avoid churn). */
let lastFingerprint = "";
let panelLoaded = false;

function contextFingerprint(ctx) {
  if (!ctx) return "";
  return [ctx.screen || "", ctx.title || "", ctx.module || "", ctx.ifmod || ""]
    .join("|")
    .toLowerCase();
}

function buildPanelUrl(uiBase, ctx) {
  const u = new URL("/panel", uiBase.replace(/\/$/, "") + "/");
  if (ctx?.title) u.searchParams.set("title", ctx.title);
  if (ctx?.screen) u.searchParams.set("screen", ctx.screen);
  if (ctx?.module) u.searchParams.set("module", ctx.module);
  if (ctx?.ifmod) u.searchParams.set("ifmod", ctx.ifmod);
  // Never pass the Intacct app iframe URL as help_url — that is not Sage Help.
  // The panel resolves the canonical Help topic from DEMO_SPINE / help-links.
  // Always open on Guide so every Intacct screen gets an oriented help experience.
  u.searchParams.set("mode", "guide");
  return u.toString();
}

function getUiBase() {
  return new Promise((resolve) => {
    chrome.storage.sync.get({ uiBase: DEFAULT_UI_BASE }, (data) => {
      resolve(data.uiBase || DEFAULT_UI_BASE);
    });
  });
}

async function activeTabId() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  return tabs[0]?.id;
}

function postContextToFrame(ctx) {
  const frame = document.getElementById("frame");
  if (!frame?.contentWindow || !ctx) return;
  try {
    frame.contentWindow.postMessage(
      {
        type: "graph-help:context",
        title: ctx.title,
        screen: ctx.screen,
        module: ctx.module,
        ifmod: ctx.ifmod,
        // Only forward real Sage Help URLs; never the app mainUrl.
        helpUrl: ctx.helpUrl || "",
        soft: true,
      },
      "*"
    );
  } catch {
    /* ignore */
  }
}

/** Full navigation — only on first open or when the Intacct screen identity changes. */
async function loadPanel(ctx, { force = false } = {}) {
  const frame = document.getElementById("frame");
  const status = document.getElementById("status");
  const uiBase = await getUiBase();
  const fp = contextFingerprint(ctx);

  status.style.display = "none";
  frame.style.display = "block";

  // Already showing this screen — do not touch the iframe (preserves Ask / Context).
  if (panelLoaded && !force && fp && fp === lastFingerprint) {
    return;
  }

  // Different Intacct screen while panel is open: soft postMessage only — never remount.
  if (panelLoaded && !force) {
    lastFingerprint = fp;
    postContextToFrame(ctx);
    return;
  }

  const url = buildPanelUrl(uiBase, ctx || {});
  lastFingerprint = fp;
  frame.onload = () => {
    panelLoaded = true;
    postContextToFrame(ctx);
  };
  if (frame.src === url) {
    panelLoaded = true;
    postContextToFrame(ctx);
    return;
  }
  frame.src = url;
}

function showOffline(uiBase) {
  const frame = document.getElementById("frame");
  const status = document.getElementById("status");
  frame.style.display = "none";
  status.style.display = "block";
  panelLoaded = false;
  status.innerHTML = `
    <p><strong>Smart Help UI not reachable</strong></p>
    <p>Start the local UI at <code>${uiBase}</code> and the engine on :8765.</p>
    <p><a href="${uiBase}/panel" target="_blank">Open /panel</a></p>
  `;
}

async function init() {
  const uiBase = await getUiBase();
  const tabId = await activeTabId();
  let ctx = null;
  if (tabId != null) {
    const key = `ctx:${tabId}`;
    const stored = await chrome.storage.session.get(key);
    ctx = stored[key] || null;
    try {
      await chrome.tabs.sendMessage(tabId, {
        type: "graph-help:request-context",
      });
    } catch {
      /* not Intacct */
    }
  }

  try {
    const res = await fetch(`${uiBase}/panel`);
    if (!res.ok) throw new Error(String(res.status));
  } catch {
    showOffline(uiBase);
    return;
  }

  await loadPanel(ctx, { force: true });
}

chrome.runtime.onMessage.addListener((message) => {
  const payload =
    message?.payload ||
    (message?.type === "graph-help:context" ? message.payload : null);
  if (
    message?.type === "graph-help:context-updated" ||
    (message?.type === "graph-help:context" && message.payload)
  ) {
    // Soft path: never force-reload the iframe on polling updates.
    loadPanel(message.payload || payload, { force: false });
  }
});

window.addEventListener("message", async (event) => {
  const data = event.data;
  if (!data) return;

  const tabId = await activeTabId();
  if (tabId == null) return;

  if (data.type === "graph-help:highlight") {
    chrome.tabs
      .sendMessage(tabId, {
        type: "graph-help:highlight",
        labels: data.labels || [],
      })
      .catch(() => {});
    return;
  }

  // Wide modal over Intacct — never load Home into the narrow side panel.
  if (
    data.type === "graph-help:expand-home" ||
    data.type === "graph-help:show-home"
  ) {
    chrome.tabs
      .sendMessage(tabId, {
        type: "graph-help:expand-home",
        path: data.path || "/",
        title: data.title,
        screen: data.screen,
        module: data.module,
      })
      .catch(() => {});
  }
});

init();
