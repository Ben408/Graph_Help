const DEFAULT_UI_BASE = "https://v0-concept-graph-demo.vercel.app";

chrome.storage.sync.get({ uiBase: DEFAULT_UI_BASE }, (data) => {
  document.getElementById("uiBase").value = data.uiBase || DEFAULT_UI_BASE;
});

document.getElementById("save").addEventListener("click", () => {
  const uiBase = document.getElementById("uiBase").value.trim().replace(/\/$/, "");
  chrome.storage.sync.set({ uiBase: uiBase || DEFAULT_UI_BASE }, () => {
    const el = document.getElementById("saved");
    el.hidden = false;
    setTimeout(() => {
      el.hidden = true;
    }, 1500);
  });
});
