# Author: Charley Scholz, JLIT
# Co-authored: Claude Opus 4.6, Claude Code v2.1.38 (coding assistant), Cursor 2.4 (IDE)
#
"""
ShotDeck / FilmGrab — Reference sites for film stills.
Not creator databases, but a HACK: scrape credits of featured shots to find working DPs.

Extraction Priority: LOW-MEDIUM (indirect extraction)
Strategy: "I want something like that shot from Arrival" → trace to DP Bradford Young → find his crew.
"""

import logging
import re
from base_scraper import BaseScraper
from config import SourceConfig
from models import CreatorRecord, PrimaryOutput, BudgetTier

logger = logging.getLogger(__name__)


class ShotDeckScraper(BaseScraper):
    """
    Indirect extraction: ShotDeck tags shots by lighting, color, composition.
    We extract the DP credits and use the film/director as a comparable reference.
    """

    def __init__(self, config: SourceConfig):
        super().__init__(config)
        self.base_url = "https://shotdeck.com"

    def discover_entries(self) -> list[dict]:
        entries = []

        # ShotDeck is subscription-gated; scrape public browse/featured
        for path in ["/browse", "/featured", "/popular"]:
            page = self.fetch(f"{self.base_url}{path}")
            if not page:
                continue

            for el in page.select(".shot, .card, .film-entry, article"):
                title_el = el.select_one("h2, h3, .title, .film-title")
                link_el = el.select_one("a")
                if title_el:
                    entries.append({
                        "url": self.resolve_url(link_el.get("href", "")) if link_el else "",
                        "film_title": title_el.get_text(strip=True),
                    })

        return entries

    def parse_entry(self, entry: dict) -> list[CreatorRecord]:
        """
        Extract DP/cinematographer from film credits.
        The film/director becomes a comparable_to reference.
        """
        records = []
        detail = self.fetch(entry["url"]) if entry.get("url") else None
        if not detail:
            return records

        # Look for credits information
        credits_el = detail.select_one(".credits, .crew, .film-info")
        if not credits_el:
            return records

        credits_text = credits_el.get_text()
        parsed = self.parse_credits_block(credits_text)

        # We primarily want DPs and colorists from this source
        for credit in parsed:
            mapping = credit.get("mapping")
            if not mapping:
                continue

            role = mapping.get("role", "")
            if role not in ("director of photography", "colorist", "production designer"):
                continue

            record = self.make_record(
                name=credit["name"],
                primary_output=PrimaryOutput.VIDEO,
                budget_tier=BudgetTier.ESTABLISHED,
                source_url=entry.get("url", ""),
            )

            # Apply role-specific tags
            auto_tags = mapping.get("auto_tags", {})
            for tag_field, tags in auto_tags.items():
                if isinstance(tags, list):
                    for tag in tags:
                        record.add_tag(tag_field, tag)

            record.add_tag("approach_style", "cinematic")

            # The film itself becomes a comparable reference
            film_title = entry.get("film_title", "")
            if film_title:
                record.raw_data["notable_work"] = film_title

            # Extract visual style tags from ShotDeck's own tagging
            for tag_el in detail.select(".tag, .filter-tag, .shot-tag"):
                tag_text = tag_el.get_text(strip=True)
                self.normalize_and_add_tag(record, "visual_style", tag_text)
                self.normalize_and_add_tag(record, "technical_capability", tag_text)

            record.raw_data = entry
            records.append(record)

        return records
