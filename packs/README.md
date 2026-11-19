# Content packs

A pack is the portable unit for one Sage product. Intacct and Planning each have their own folder, Help corpus, ontology, and Ask retrieval.

Each pack needs:

1. **`pack.ts` / `pack.json`** — identity, corpus crawl binding, vocabulary, module map, skill path ids.
2. **`concepts.ts`** — authored ontology (nouns + typed edges). Slow clock; not rebuilt every Friday.
3. **`skill-paths.ts`** — ordered curricula over concept ids. Practice links resolve against live OKF after ingest.
4. **`corpus.ts`** — Help `startUrl`, `allowedPrefix`, locale, citation allowlist, optional `pathMarker`. **No product strings in `lib/knowledge` or `engine/src` except via the pack.**
5. **`aliases.ts`** — closed vocabulary for Ask classification (do not invent object names).

## Multi-product runtime

- Registry: [`lib/knowledge/pack-registry.ts`](../lib/knowledge/pack-registry.ts)
- URL → pack: [`lib/knowledge/product-detect.ts`](../lib/knowledge/product-detect.ts) (`*.intacct-planning.com` → Planning; `*.intacct.com` → Intacct)
- Standalone UI: product switcher / `?pack=sage-planning`
- Extension: hostname selects pack; Planning uses SPA paths (not Frameset/`ifmod`)
- Engine corpora: `engine/data/packs/{pack_id}/…` (Intacct may fall back to legacy flat dirs)

## Re-ingest a pack

```bash
# Planning Help corpus (example)
curl -X POST "http://127.0.0.1:8765/api/corpus/refresh?pack_id=sage-planning"
```

Or Admin **Re-ingest Help** with the active product selected.

## Packs

- [`sage-intacct/`](sage-intacct/) — Sage Intacct
- [`sage-planning/`](sage-planning/) — Sage Planning
