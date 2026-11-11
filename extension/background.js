const DEFAULT_UI_BASE = "http://127.0.0.1:3002";

chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {});
});

chrome.action.onClicked.addListener(async (tab) => {
  if (tab?.id) {
    try {
      await chrome.sidePanel.open({ tabId: tab.id });
    } catch (err) {
      console.warn("sidePanel.open failed", err);
    }
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === "graph-help:get-settings") {
    chrome.storage.sync.get({ uiBase: DEFAULT_UI_BASE }, (data) => {
      sendResponse(data);
    });
    return true;
  }
  if (message?.type === "graph-help:open-panel" && sender.tab?.id) {
    chrome.sidePanel.open({ tabId: sender.tab.id }).then(
      () => sendResponse({ ok: true }),
      (err) => sendResponse({ ok: false, error: String(err) })
    );
    return true;
  }
  if (message?.type === "graph-help:context" && sender.tab?.id) {
    const key = `ctx:${sender.tab.id}`;
    const fpKey = `ctxfp:${sender.tab.id}`;
    const payload = message.payload || {};
    const fp = [payload.screen, payload.title, payload.module, payload.ifmod]
      .join("|")
      .toLowerCase();
    chrome.storage.session.get(fpKey, (prev) => {
      const changed = prev[fpKey] !== fp;
      chrome.storage.session.set({ [key]: payload, [fpKey]: fp });
      // Only notify the side panel when the page identity changes.
      if (changed) {
        chrome.runtime
          .sendMessage({
            type: "graph-help:context-updated",
            tabId: sender.tab.id,
            payload,
          })
          .catch(() => {});
      }
    });
  }
  return false;
});
