from __future__ import annotations

from src.rag.okf.store import OkfStore
from src.knowledge.pack_loader import load_pack


def practice_for_concept(store: OkfStore, concept_id: str, limit: int = 8) -> list[dict]:
    pack = load_pack()
    fragments: list[str] = []
    for mapping in pack.get("moduleMap") or []:
        if concept_id in (mapping.get("conceptIds") or []):
            fragments.extend(mapping.get("urlIncludes") or [])
    title = next(
        (
            str(n.get("title") or "")
            for n in pack.get("vocabulary") or []
            if n.get("id") == concept_id
        ),
        concept_id.replace("-", " "),
    )
    query = title
    rows = store.catalog_for_pack_concept(concept_id, types=("Procedure",), limit=limit * 3)
    if not rows:
        rows = store.list_concepts(concept_type="Procedure", query=query, limit=40)
        if fragments:
            extra = []
            for item in store.list_concepts(concept_type="Procedure", limit=4000):
                url = str(item.get("page_url") or "")
                if any(frag in url for frag in fragments):
                    extra.append(item)
            rows = extra or rows
    out = []
    seen: set[str] = set()
    for item in rows:
        cid = str(item.get("concept_id") or "")
        if not cid or cid in seen:
            continue
        seen.add(cid)
        out.append(
            {
                "id": cid,
                "type": item.get("type"),
                "title": item.get("title"),
                "pageUrl": item.get("page_url"),
                "headingPath": item.get("heading_path"),
                "conceptIds": [concept_id],
            }
        )
        if len(out) >= limit:
            break
    return out
