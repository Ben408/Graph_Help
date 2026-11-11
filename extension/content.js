(function () {
  const HIGHLIGHT_CLASS = "graph-help-field-hl";
  const STYLE_ID = "graph-help-hl-style";
  const EXPAND_ID = "graph-help-expand-root";
  const DEFAULT_UI_BASE = "http://127.0.0.1:3002";

  function ensureStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      .${HIGHLIGHT_CLASS} {
        outline: 2px solid #007E45 !important;
        outline-offset: 2px !important;
        box-shadow: 0 0 0 4px rgba(0, 126, 69, 0.25) !important;
        border-radius: 2px;
      }
      #${EXPAND_ID} {
        position: fixed;
        inset: 0;
        z-index: 2147483645;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 2.5vh 2.5vw;
        box-sizing: border-box;
        pointer-events: none;
      }
      #${EXPAND_ID} .gh-dim {
        position: absolute;
        inset: 0;
        background: rgba(15, 23, 42, 0.55);
        pointer-events: auto;
        cursor: pointer;
      }
      #${EXPAND_ID} .gh-stage {
        position: relative;
        z-index: 1;
        width: min(1280px, 96vw);
        height: min(920px, 95vh);
        pointer-events: auto;
        display: flex;
        flex-direction: column;
        background: #fff;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 24px 64px rgba(0,0,0,.4);
      }
      #${EXPAND_ID} .gh-bar {
        flex: 0 0 auto;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        padding: 10px 14px;
        background: #0f172a;
        color: #e2e8f0;
        font: 600 12px system-ui, sans-serif;
        border-bottom: 1px solid #1e293b;
      }
      #${EXPAND_ID} .gh-bar button {
        border: 0;
        background: #007E45;
        color: #fff;
        border-radius: 6px;
        padding: 6px 12px;
        font: 600 12px system-ui, sans-serif;
        cursor: pointer;
      }
      #${EXPAND_ID} iframe {
        flex: 1 1 auto;
        width: 100%;
        border: 0;
        background: #fff;
      }
    `;
    document.documentElement.appendChild(style);
  }

  function getUiBase() {
    return new Promise((resolve) => {
      try {
        chrome.runtime.sendMessage(
          { type: "graph-help:get-settings" },
          (data) => {
            resolve((data && data.uiBase) || DEFAULT_UI_BASE);
          }
        );
      } catch {
        resolve(DEFAULT_UI_BASE);
      }
    });
  }

  function collapseExpanded() {
    document.getElementById(EXPAND_ID)?.remove();
  }

  async function expandHome(message) {
    ensureStyle();
    collapseExpanded();
    const uiBase = (await getUiBase()).replace(/\/$/, "");
    const path = message?.path || "/";
    const url = path.startsWith("http")
      ? path
      : `${uiBase}${path.startsWith("/") ? path : `/${path}`}`;

    const root = document.createElement("div");
    root.id = EXPAND_ID;
    root.innerHTML = `
      <div class="gh-dim" title="Return to Intacct"></div>
      <div class="gh-stage" role="dialog" aria-modal="true" aria-label="Smart Help home">
        <div class="gh-bar">
          <span>Smart Help</span>
          <button type="button" data-gh-close>Back to Intacct</button>
        </div>
        <iframe title="Smart Help home" src="${url.replace(/"/g, "&quot;")}"></iframe>
      </div>
    `;
    root.querySelector(".gh-dim")?.addEventListener("click", collapseExpanded);
    root
      .querySelector("[data-gh-close]")
      ?.addEventListener("click", collapseExpanded);
    document.documentElement.appendChild(root);
  }

  function clearHighlights(root) {
    root.querySelectorAll("." + HIGHLIGHT_CLASS).forEach((el) => {
      el.classList.remove(HIGHLIGHT_CLASS);
    });
  }

  function highlightLabelsInDoc(doc, labels) {
    if (!doc || !labels?.length) return;
    ensureStyle();
    clearHighlights(doc);
    const wanted = labels.map((l) => l.toLowerCase().trim()).filter(Boolean);
    const candidates = doc.querySelectorAll(
      "label, .field-label, th, .caption, .ia-label, td, span, div"
    );
    for (const el of candidates) {
      const text = (el.textContent || "").replace(/\s+/g, " ").trim();
      if (!text || text.length > 80) continue;
      const lower = text.toLowerCase().replace(/\*$/, "").trim();
      if (wanted.some((w) => lower === w || lower.includes(w) || w.includes(lower))) {
        el.classList.add(HIGHLIGHT_CLASS);
        const control =
          el.control ||
          el.parentElement?.querySelector("input, select, textarea, .select2");
        if (control) control.classList.add(HIGHLIGHT_CLASS);
      }
    }
  }

  function highlightInMain(labels) {
    const main = document.getElementById("iamain");
    try {
      if (main?.contentDocument) {
        highlightLabelsInDoc(main.contentDocument, labels);
      }
    } catch {
      /* cross-origin */
    }
    highlightLabelsInDoc(document, labels);
  }

  function readMainDoc() {
    const main = document.getElementById("iamain");
    try {
      return main?.contentDocument || null;
    } catch {
      return null;
    }
  }

  function collectContext() {
    const main = document.getElementById("iamain");
    let mainUrl = "";
    let mainTitle = "";
    let screenLabel = "";
    try {
      if (main?.contentWindow) {
        mainUrl = main.contentWindow.location.href || "";
        mainTitle = main.contentDocument?.title || "";
        const bodyText = (main.contentDocument?.body?.innerText || "")
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, 120);
        screenLabel = bodyText.split("Cancel")[0]?.trim().slice(0, 80) || "";
      }
    } catch {
      /* ignore */
    }

    let ifmod = "";
    let config = "";
    try {
      const u = new URL(mainUrl || location.href);
      ifmod = u.searchParams.get(".ifmod") || u.searchParams.get("ifmod") || "";
      config = u.searchParams.get(".config") || u.searchParams.get("config") || "";
    } catch {
      /* ignore */
    }

    let helpId = null;
    try {
      if (window.mappedHelpIdObject && typeof window.mappedHelpIdObject === "object") {
        const keys = Object.keys(window.mappedHelpIdObject);
        helpId = keys.length ? keys[0] : null;
      }
    } catch {
      /* ignore */
    }

    const title = mainTitle || document.title || "";
    let screen = screenLabel;
    const blob = `${title} ${screenLabel} ${config}`;

    // Prefer explicit page titles / NextGen .config paths over body snippets.
    const titleOnly = title
      .replace(/^Intacct(\s+Corporation)?\s*-?\s*/i, "")
      .replace(/^IA\./i, "")
      .trim();
    if (titleOnly && titleOnly.length < 80 && !/^nextgen$/i.test(titleOnly)) {
      screen = titleOnly;
    }

    if (/close\s*books/i.test(blob)) screen = "Close books";
    else if (/close\s*ap\s*subledger/i.test(blob)) screen = "Close AP subledger";
    else if (/close\s*ar\s*subledger/i.test(blob)) screen = "Close AR subledger";
    else if (/close\s*period|close_period/i.test(blob)) screen = "Close period";
    else if (/pay\s*bills?/i.test(blob)) screen = "Pay bills";
    else if (/ap\/stable\/bill|\/bill\./i.test(config))
      screen = /list/i.test(config) ? "Bills" : "Bill";
    else if (/\bbills\b/i.test(blob) && !/pay\s*bills?/i.test(blob))
      screen = "Bills";
    else if (/(?:^|[^a-z])bill(?:$|[^a-z])/i.test(blob)) screen = "Bill";
    else if (/journal\s*entries/i.test(blob)) screen = "Journal entries";
    else if (/journal\s*entry/i.test(blob)) screen = "Journal entry";
    else if (/reconcil\w*\s*bank|check\s*reconcil/i.test(blob))
      screen = "Reconcile bank account";
    else if (/purchase\s*order/i.test(blob)) screen = "Purchase Order";
    else if (/sales\s*order/i.test(blob)) screen = "Sales Order";
    else if (/reporting\s*periods?/i.test(blob)) screen = "Reporting periods";

    let module = "";
    const ifmodMap = {
      gl: "General_Ledger",
      ap: "Accounts_Payable",
      ar: "Accounts_Receivable",
      po: "Purchasing",
      so: "Order_Entry",
      cm: "Cash_Management",
      reportcenter: "Reporting",
    };
    if (ifmod && ifmodMap[ifmod.toLowerCase()]) {
      module = ifmodMap[ifmod.toLowerCase()];
    } else if (/\/ap\//i.test(config)) module = "Accounts_Payable";
    else if (/\/ar\//i.test(config)) module = "Accounts_Receivable";
    else if (/\/gl\//i.test(config)) module = "General_Ledger";
    else if (/\/po\//i.test(config)) module = "Purchasing";
    else if (/\/so\//i.test(config)) module = "Order_Entry";
    else if (/\/cm\//i.test(config)) module = "Cash_Management";

    return {
      title,
      screen,
      module,
      ifmod,
      mainUrl,
      helpId,
      pageUrl: location.href,
    };
  }

  function openGraphHelp() {
    const payload = collectContext();
    chrome.runtime.sendMessage({
      type: "graph-help:context",
      payload,
    });
    chrome.runtime.sendMessage({ type: "graph-help:open-panel" });
  }

  function ownLabel(el) {
    const direct = Array.from(el.childNodes)
      .filter((n) => n.nodeType === Node.TEXT_NODE)
      .map((n) => n.textContent || "")
      .join("")
      .replace(/\s+/g, " ")
      .trim();
    if (direct) return direct;
    return (el.textContent || "").replace(/\s+/g, " ").trim();
  }

  function looksLikeFieldHelp(el) {
    if (!(el instanceof Element)) return false;
    // Field-level Sage Help affordances (?, help balls, "What can I do here?").
    // These must keep opening native Help — never Smart Help.
    if (el.closest(".help, .ia-help, .field-help, .qhelp, [data-help]")) {
      return true;
    }
    const labeled = el.closest("a, button, [role='button'], img, svg, span");
    if (!labeled) return false;
    const tip = `${labeled.getAttribute("title") || ""} ${
      labeled.getAttribute("aria-label") || ""
    }`.toLowerCase();
    if (
      tip.includes("what can i do") ||
      tip === "help" ||
      tip.includes("field help") ||
      tip.includes("page help")
    ) {
      return true;
    }
    const label = ownLabel(labeled);
    if (label === "?" || label === "？") return true;
    if (/^what can i do here\??$/i.test(label)) return true;
    return false;
  }

  function interceptHelpOnThisPage() {
    document.addEventListener(
      "click",
      (event) => {
        // Field-level ? balls often trigger Help via a synthetic click on
        // "Help on this page". Never intercept those — only real user clicks
        // on the shell menu item should open Smart Help.
        if (!event.isTrusted) return;

        const t = event.target;
        if (!(t instanceof Element)) return;
        if (looksLikeFieldHelp(t)) return;

        // Only the exact shell menu item "Help on this page".
        // Intacct renders it as an <li>; match own label only (never a parent
        // whose textContent concatenates the whole Help menu).
        const control = t.closest("a, button, [role='menuitem'], li");
        if (!control) return;
        const text = ownLabel(control);
        if (!/^help on this page$/i.test(text)) return;

        event.preventDefault();
        event.stopPropagation();
        openGraphHelp();
      },
      true
    );
  }

  function injectMenuHint() {
    if (document.getElementById("graph-help-entry")) return;
    const btn = document.createElement("button");
    btn.id = "graph-help-entry";
    btn.type = "button";
    btn.textContent = "Smart Help";
    btn.title = "Open Smart Help (Ask / Guide / Context)";
    Object.assign(btn.style, {
      position: "fixed",
      right: "12px",
      bottom: "48px",
      zIndex: "2147483646",
      padding: "8px 12px",
      borderRadius: "8px",
      border: "none",
      background: "#007E45",
      color: "#ffffff",
      font: "600 12px system-ui,sans-serif",
      cursor: "pointer",
      boxShadow: "0 2px 8px rgba(0,0,0,.25)",
    });
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      openGraphHelp();
    });
    document.documentElement.appendChild(btn);
  }

  let lastPushedFp = "";

  function contextFingerprint(ctx) {
    return [ctx.screen || "", ctx.title || "", ctx.module || "", ctx.ifmod || ""]
      .join("|")
      .toLowerCase();
  }

  function pushContextIfChanged(force) {
    const payload = collectContext();
    const fp = contextFingerprint(payload);
    if (!force && fp && fp === lastPushedFp) return;
    lastPushedFp = fp;
    chrome.runtime.sendMessage({
      type: "graph-help:context",
      payload,
    });
  }

  function watchMainNavigation() {
    const main = document.getElementById("iamain");
    if (!main) return;
    main.addEventListener("load", () => pushContextIfChanged(true));
    // Poll only to detect in-frame navigations that do not fire load;
    // unchanged screens must not notify the side panel.
    setInterval(() => pushContextIfChanged(false), 2500);
  }

  window.addEventListener("message", (event) => {
    const data = event.data;
    if (!data || !data.type) return;
    if (data.type === "graph-help:highlight") {
      highlightInMain(Array.isArray(data.labels) ? data.labels : []);
    }
    if (data.type === "graph-help:expand-home") {
      void expandHome(data);
    }
    if (data.type === "graph-help:collapse-home") {
      collapseExpanded();
    }
  });

  chrome.runtime.onMessage.addListener((message) => {
    if (message?.type === "graph-help:highlight") {
      highlightInMain(message.labels || []);
    }
    if (message?.type === "graph-help:request-context") {
      pushContextIfChanged(true);
    }
    if (message?.type === "graph-help:expand-home") {
      void expandHome(message);
    }
    if (message?.type === "graph-help:collapse-home") {
      collapseExpanded();
    }
  });

  interceptHelpOnThisPage();
  injectMenuHint();
  watchMainNavigation();
  pushContextIfChanged(true);
})();
