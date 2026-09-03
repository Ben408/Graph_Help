"""Discover the newest Sage Intacct release notes home and refresh whats-new.json."""

from __future__ import annotations

import json
import re
from dataclasses import dataclass
from datetime import UTC, datetime
from pathlib import Path
from urllib.parse import urljoin

import httpx
from bs4 import BeautifulSoup

RELEASE_NOTES_ROOT = "https://www.intacct.com/ia/docs/en_US/releasenotes/"
USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36"
)
YEAR_RE = re.compile(r"/releasenotes/(\d{4})/")
RELEASE_HOME_RE = re.compile(
    r"/releasenotes/(\d{4})/(\d{4})_Release_(\d+)/(\d{4})-R(\d+)-home\.htm",
    re.IGNORECASE,
)
FEATURE_AREA_HINTS: list[tuple[str, str | None]] = [
    ("ap automation", "ap-automation"),
    ("accounts payable", "accounts-payable"),
    ("accounts receivable", "accounts-receivable"),
    ("cash management", "cash-management"),
    ("bank reconcil", "bank-reconciliation"),
    ("general ledger", "general-ledger"),
    ("journal entry", "journal-entries"),
    ("order entry", "order-entry"),
    ("purchasing", "purchasing"),
    ("reporting", "financial-reporting"),
    ("excel", "financial-reporting"),
    ("construction", "construction"),
    ("fixed asset", "fixed-assets"),
    ("tax", "tax-management"),
    ("copilot", "sage-copilot"),
    ("ai", "sage-ai"),
]


@dataclass
class ReleaseHome:
    year: int
    release: int
    url: str
    label: str


@dataclass
class WhatsNewSummary:
    version: str
    source_url: str
    changed: bool
    highlights: int
    sections: int


def _guess_concept(title: str, area: str) -> str | None:
    blob = f"{area} {title}".lower()
    for needle, concept_id in FEATURE_AREA_HINTS:
        if needle in blob:
            return concept_id
    return None


def _parse_release_homes(html: str, base_url: str) -> list[ReleaseHome]:
    soup = BeautifulSoup(html, "html.parser")
    found: dict[tuple[int, int], ReleaseHome] = {}
    for anchor in soup.find_all("a", href=True):
        href = str(anchor["href"])
        absolute = urljoin(base_url, href)
        match = RELEASE_HOME_RE.search(absolute)
        if not match:
            continue
        year = int(match.group(1))
        release = int(match.group(3))
        key = (year, release)
        found[key] = ReleaseHome(
            year=year,
            release=release,
            url=absolute.split("?")[0],
            label=f"{year} R{release}",
        )
    return sorted(found.values(), key=lambda item: (item.year, item.release), reverse=True)


def _client(timeout_seconds: float) -> httpx.Client:
    return httpx.Client(
        follow_redirects=True,
        timeout=timeout_seconds,
        headers={
            "User-Agent": USER_AGENT,
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
    )


def _probe_release_homes(client: httpx.Client, root_url: str) -> list[ReleaseHome]:
    """Probe year/release URL patterns when the index page is blocked or sparse."""
    found: dict[tuple[int, int], ReleaseHome] = {}
    year_now = datetime.now(UTC).year
    for year in (year_now, year_now - 1):
        for release in (4, 3, 2, 1):
            url = urljoin(
                root_url,
                f"{year}/{year}_Release_{release}/{year}-R{release}-home.htm",
            )
            try:
                response = client.head(url)
                if response.status_code >= 400:
                    response = client.get(url)
                if response.status_code >= 400:
                    continue
                found[(year, release)] = ReleaseHome(
                    year=year,
                    release=release,
                    url=str(response.url).split("?")[0],
                    label=f"{year} R{release}",
                )
            except httpx.HTTPError:
                continue
    return sorted(found.values(), key=lambda item: (item.year, item.release), reverse=True)


def discover_latest_release_home(
    *,
    root_url: str = RELEASE_NOTES_ROOT,
    timeout_seconds: float = 60,
) -> ReleaseHome:
    with _client(timeout_seconds) as client:
        homes: list[ReleaseHome] = []
        try:
            response = client.get(root_url)
            if not response.is_error:
                homes = _parse_release_homes(response.text, str(response.url))
        except httpx.HTTPError:
            homes = []

        if not homes:
            year = datetime.now(UTC).year
            for candidate_year in (year, year - 1):
                year_url = urljoin(root_url, f"{candidate_year}/")
                try:
                    year_response = client.get(year_url)
                    if year_response.is_error:
                        continue
                    homes.extend(
                        _parse_release_homes(year_response.text, str(year_response.url))
                    )
                except httpx.HTTPError:
                    continue
            homes = sorted(
                {(h.year, h.release): h for h in homes}.values(),
                key=lambda item: (item.year, item.release),
                reverse=True,
            )

        if not homes:
            homes = _probe_release_homes(client, root_url)

    if not homes:
        raise RuntimeError("Could not discover a release notes home page")
    return homes[0]


def _extract_date(soup: BeautifulSoup) -> str:
    text = soup.get_text(" ", strip=True)
    match = re.search(
        r"(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+\d{4}",
        text,
    )
    return match.group(0) if match else ""


def _extract_highlights(soup: BeautifulSoup) -> list[dict[str, object]]:
    highlights: list[dict[str, object]] = []
    heading = soup.find(
        lambda tag: tag.name in {"h1", "h2", "h3"}
        and "release highlight" in tag.get_text(" ", strip=True).lower()
    )
    table = heading.find_next("table") if heading else None
    if table is None:
        return highlights
    for row in table.find_all("tr"):
        cells = row.find_all(["td", "th"])
        if len(cells) < 2:
            continue
        title = cells[0].get_text(" ", strip=True)
        regions_text = cells[1].get_text(" ", strip=True)
        if not title or title.lower() in {"feature", "available in"}:
            continue
        if len(title) < 8:
            continue
        early = "early adopter" in title.lower()
        clean_title = re.sub(
            r"\s*[—\-]\s*Early Adopter", "", title, flags=re.IGNORECASE
        ).strip()
        item: dict[str, object] = {
            "title": clean_title,
            "description": clean_title,
            "area": "Release highlights",
            "regions": [part.strip() for part in regions_text.split(",") if part.strip()]
            or ["All regions"],
        }
        if early:
            item["isEarlyAdopter"] = True
        concept = _guess_concept(clean_title, "Release highlights")
        if concept:
            item["relatedConceptId"] = concept
        highlights.append(item)
        if len(highlights) >= 12:
            break
    return highlights


def _extract_all_changes(soup: BeautifulSoup) -> list[dict[str, object]]:
    sections: list[dict[str, object]] = []
    heading = soup.find(
        lambda tag: tag.name in {"h1", "h2", "h3"}
        and "all changes" in tag.get_text(" ", strip=True).lower()
    )
    table = heading.find_next("table") if heading else None
    if table is None:
        return sections
    current_area = "General"
    bucket: dict[str, list[dict[str, object]]] = {}
    for row in table.find_all("tr"):
        cells = row.find_all(["td", "th"])
        if len(cells) < 2:
            continue
        area = cells[0].get_text(" ", strip=True)
        title = cells[1].get_text(" ", strip=True)
        regions_text = (
            cells[2].get_text(" ", strip=True) if len(cells) > 2 else "All regions"
        )
        if area and area.lower() not in {"area", ""}:
            current_area = area
        if not title or title.lower() in {"feature", "available in"}:
            continue
        early = "early adopter" in title.lower()
        clean_title = re.sub(
            r"\s*[—\-]\s*Early Adopter", "", title, flags=re.IGNORECASE
        ).strip()
        feature: dict[str, object] = {
            "title": clean_title,
            "description": clean_title,
            "regions": [part.strip() for part in regions_text.split(",") if part.strip()]
            or ["All regions"],
        }
        if early:
            feature["isEarlyAdopter"] = True
        concept = _guess_concept(clean_title, current_area)
        if concept:
            feature["relatedConceptId"] = concept
        bucket.setdefault(current_area, []).append(feature)
    for area, features in bucket.items():
        sections.append({"area": area, "features": features[:20]})
    return sections


def build_whats_new_payload(
    *,
    release: ReleaseHome,
    timeout_seconds: float = 60,
) -> dict[str, object]:
    with _client(timeout_seconds) as client:
        response = client.get(release.url)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, "html.parser")
    highlights = _extract_highlights(soup)
    all_changes = _extract_all_changes(soup)
    if not highlights and all_changes:
        # Flatten a few features as highlights when the highlights table is missing.
        for section in all_changes[:4]:
            for feature in section.get("features", [])[:2]:
                highlights.append(
                    {
                        "title": feature["title"],
                        "description": feature.get("description") or feature["title"],
                        "area": section["area"],
                        "regions": feature.get("regions") or ["All regions"],
                        **(
                            {"relatedConceptId": feature["relatedConceptId"]}
                            if feature.get("relatedConceptId")
                            else {}
                        ),
                        **(
                            {"isEarlyAdopter": True}
                            if feature.get("isEarlyAdopter")
                            else {}
                        ),
                    }
                )
    return {
        "version": release.label,
        "date": _extract_date(soup) or datetime.now(UTC).strftime("%B %d, %Y"),
        "sourceUrl": release.url,
        "discoveredAt": datetime.now(UTC).isoformat().replace("+00:00", "Z"),
        "highlights": highlights,
        "allChanges": all_changes,
    }


def refresh_whats_new_file(
    output_path: Path,
    *,
    root_url: str = RELEASE_NOTES_ROOT,
    force: bool = False,
) -> WhatsNewSummary:
    release = discover_latest_release_home(root_url=root_url)
    current: dict[str, object] = {}
    if output_path.is_file():
        current = json.loads(output_path.read_text(encoding="utf-8"))
    current_url = str(current.get("sourceUrl") or "")
    if not force and current_url.rstrip("/") == release.url.rstrip("/"):
        return WhatsNewSummary(
            version=str(current.get("version") or release.label),
            source_url=current_url or release.url,
            changed=False,
            highlights=len(current.get("highlights") or []),
            sections=len(current.get("allChanges") or []),
        )
    payload = build_whats_new_payload(release=release)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(
        json.dumps(payload, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    return WhatsNewSummary(
        version=str(payload["version"]),
        source_url=str(payload["sourceUrl"]),
        changed=True,
        highlights=len(payload.get("highlights") or []),
        sections=len(payload.get("allChanges") or []),
    )
