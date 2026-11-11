# Graph Help extension (Chrome / Edge)

Local-first side panel for Sage Intacct. **Copilot is untouched.** This replaces **Help on this page** with Graph Help (Help / Guide / Context).

## Prerequisites

1. Knowledge engine on `http://127.0.0.1:8765` (`ready: true`)
2. Next UI on `http://127.0.0.1:3002` (Graph Help — not the marketing site on 3001)
3. Training (or other) Intacct session in Chrome/Edge

## Load unpacked

1. Open `chrome://extensions` or `edge://extensions`
2. Enable **Developer mode**
3. **Load unpacked** → select this folder:
   `concept-graph-demo/extension`
4. Pin **Graph Help for Sage Intacct**

## Use

1. Sign in to Intacct (e.g. Close books under General Ledger)
2. Click the extension action, the floating **Graph Help** button, or **Help on this page**
3. Side panel opens `/panel` with page context
   - **Close books** → Guide tab + field highlights
   - Unmapped screens → Help tab ready to Ask (never a “not enough context” dead end)
4. **Context** tab: concept cards + mini graph

The side panel loads `/panel` **once**. Intacct navigation updates context via `postMessage` only when the screen identity changes — it does not remount the iframe (so Ask and Context stay put).

**Home** in the panel header opens Graph Help home in an expanded overlay covering most of the Intacct tab (Chrome cannot widen the native side panel). **Back to Intacct** (or the dimmed strip) collapses it.

After pulling extension or engine fixes: reload the unpacked extension, and restart the engine on `:8765` if Ask was failing on truncated JSON.

## Settings

Extension options → **UI base URL** (default `http://127.0.0.1:3002`).  
Point at a hosted origin later without changing Intacct or the Ask pipeline.

## Portability

| Local now | Hosted later |
|-----------|----------------|
| `uiBase` → `:3002` | `uiBase` → Vercel (or other) serving `/panel` |
| Engine via Next rewrite `/engine-api` → `:8765` | `NEXT_PUBLIC_ENGINE_URL` on the hosted UI |

Do not embed Intacct secrets in the extension; context is page title / module / URL only.
