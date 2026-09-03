# Content packs

A pack is the portable unit: swap this folder for another company’s Help and the app still works.

Each pack needs:

1. **`pack.ts` / `pack.json`** — identity, corpus crawl binding, vocabulary, module map, skill path ids.
2. **`concepts.ts`** — authored ontology (nouns + typed edges). Slow clock; not rebuilt every Friday.
3. **`skill-paths.ts`** — ordered curricula over concept ids. Practice links resolve against live OKF after ingest.
4. **`corpus.ts`** — Help `startUrl`, `allowedPrefix`, locale, citation allowlist. **No product strings in `lib/knowledge` or `engine/src` except via the pack.**
5. **`aliases.ts`** — closed vocabulary for Ask classification (do not invent object names).

## Activate a pack

1. Point [`lib/knowledge/active-pack.ts`](../lib/knowledge/active-pack.ts) at the new pack.
2. Copy `pack.json` next to it (engine reads this file).
3. Set crawl URLs in the pack corpus binding.
4. From `concept-graph-demo`:

```bash
python -m uvicorn app:app --app-dir engine --host 127.0.0.1 --port 8765
```

5. In the UI, **Re-ingest Help** (or `POST /api/corpus/refresh`). That rebuilds Chroma + OKF for the new start URL.

## What stays generic

- Intent split: concept map vs skill path vs goal/Ask
- Cite-or-refuse recipe loop
- Friday corpus adapter (crawl → embed → OKF)
- Vocabulary constraint on classifiers

First pack: [`sage-intacct/`](sage-intacct/).
