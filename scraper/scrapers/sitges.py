# Author: Charley Scholz, JLAI
# Co-authored: Claude Opus 4.6, Claude Code v2.1.38 (coding assistant), Cursor 2.4 (IDE)
#
"""
Sitges Film Festival (Spain) — Premier fantasy/horror festival.
Practical effects artists are rare and in demand for high-concept commercials.
Extraction Priority: MEDIUM

Fantastic Fest (Austin) — Practical effects, genre-bending, cult cinema.
Extraction Priority: MEDIUM
"""

import logging
from base_scraper import BaseScraper
from config import SourceConfig
from models import CreatorRecord, PrimaryOutput, BudgetTier

logger = logging.getLogger(__name__)


class _GenreFestivalScraper(BaseScraper):
    """Shared logic for genre/horror festivals (Sitges, Fantastic Fest)."""

    GENRE_TAGS = {
        "approach_style": ["horror", "fantasy", "sci-fi"],
        "visual_style": ["gritty", "high-contrast", "cinematic"],
        "tone": ["edgy", "dramatic"],
    }

    def discover_entries(self) -> list[dict]:
        entries = []
        for path in ["/films", "/programme", "/lineup", "/archive", "/official-selection"]:
            page = self.fetch(f"{self.base_url}{path}")
            if not page:
                continue
            for el in page.select(".film, .entry, article, .movie, .program-item"):
                name_el = el.select_one("h2, h3, .title, .film-title")
                link_el = el.select_one("a")
                if name_el:
                    entries.append({
                        "url": self.resolve_url(link_el.get("href", "")) if link_el else "",
                        "name": name_el.get_text(strip=True),
                    })
        return entries

    def parse_entry(self, entry: dict) -> list[CreatorRecord]:
        records = []
        detail = self.fetch(entry["url"]) if entry.get("url") else None

        record = self.make_record(
            name=entry.get("name", ""),
            primary_output=PrimaryOutput.VIDEO,
            output_subtype="film_narrative",
            budget_tier=BudgetTier.MID_TIER,
            source_url=entry.get("url", ""),
        )

        # Genre defaults
        for category, tags in self.GENRE_TAGS.items():
            for tag in tags:
                record.add_tag(category, tag)

        if detail:
            full_text = detail.get_text().lower()

            # Practical effects — the key value of these sources
            sfx_signals = ["practical effects", "prosthetics", "creature", "miniature",
                           "sfx", "special effects", "makeup effects", "puppeteer"]
            if any(s in full_text for s in sfx_signals):
                record.add_tag("technical_capability", "special-effects")

            if "vfx" in full_text or "visual effects" in full_text:
                record.add_tag("technical_capability", "vfx")

            self.scan_text_for_tags(record, full_text, ["visual_style", "tone"])

            # Credits — specifically targeting SFX supervisors and DPs
            credits_el = detail.select_one(".credits, .crew, .team")
            if credits_el:
                credits = self.parse_credits_block(credits_el.get_text())
                records.extend(self.records_from_credits(credits, record))

        record.raw_data = entry
        records.append(record)
        return records


class SitgesScraper(_GenreFestivalScraper):
    def __init__(self, config: SourceConfig):
        super().__init__(config)
        self.base_url = "https://sitgesfilmfestival.com"


class FantasticFestScraper(_GenreFestivalScraper):
    def __init__(self, config: SourceConfig):
        super().__init__(config)
        self.base_url = "https://fantasticfest.com"
