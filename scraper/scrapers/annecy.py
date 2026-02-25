# Author: Charley Scholz, JLIT
# Co-authored: Claude Opus 4.6, Claude Code v2.1.38 (coding assistant), Cursor 2.4 (IDE)
#
"""
Annecy International Animation Film Festival (France)
World's highest standard for animation. Cristal = top prize.

Extraction Priority: HIGH
Budget Tier Signal: Varies (Commissioned = mid-tier, Features = established)
"""

import logging
import re

from base_scraper import BaseScraper
from config import SourceConfig
from models import CreatorRecord, PrimaryOutput, BudgetTier

logger = logging.getLogger(__name__)


class AnnecyScraper(BaseScraper):
    """
    Scrapes Annecy festival for animation talent.
    Also scrapes Mifa (market section) for emerging studios seeking work.

    Key sections:
        - Official selection / competition films
        - Commissioned films (= commercial animation)
        - Short films
        - Mifa participants (market/pitch forum)
    """

    CATEGORY_MAP = {
        "feature": {"subtype": "animation", "budget": BudgetTier.ESTABLISHED, "approach": "narrative"},
        "short": {"subtype": "animation", "budget": BudgetTier.MID_TIER, "approach": "narrative"},
        "commissioned": {"subtype": "commercial", "budget": BudgetTier.MID_TIER, "approach": "commercial"},
        "tv": {"subtype": "animation", "budget": BudgetTier.MID_TIER, "approach": "narrative"},
        "graduation": {"subtype": "animation", "budget": BudgetTier.EMERGING, "approach": "experimental"},
        "vr": {"subtype": "animation", "budget": BudgetTier.EMERGING, "approach": "experimental"},
    }

    def __init__(self, config: SourceConfig):
        super().__init__(config)
        self.base_url = "https://www.annecy.org"

    def discover_entries(self) -> list[dict]:
        entries = []

        # Scrape official selection pages
        index = self.fetch(f"{self.base_url}/en/the-festival/official-selection")
        if not index:
            # Try alternate URL patterns
            index = self.fetch(f"{self.base_url}/en/programme")

        if index:
            for link in index.select("a[href*='film'], a[href*='selection'], .film-card a"):
                href = link.get("href", "")
                if href:
                    entries.append({
                        "url": self.resolve_url(href),
                        "name": link.get_text(strip=True),
                        "source_section": "official_selection",
                    })

        # Scrape Mifa market for emerging studios
        mifa_page = self.fetch(f"{self.base_url}/en/mifa")
        if mifa_page:
            for el in mifa_page.select(".participant, .company, .studio, .exhibitor"):
                name = el.select_one("h2, h3, .name, .title")
                link_el = el.select_one("a")
                if name:
                    entries.append({
                        "url": self.resolve_url(link_el.get("href", "")) if link_el else "",
                        "name": name.get_text(strip=True),
                        "source_section": "mifa",
                    })

        return entries

    def parse_entry(self, entry: dict) -> list[CreatorRecord]:
        records = []

        # Fetch detail page if URL available
        detail = None
        if entry.get("url"):
            detail = self.fetch(entry["url"])

        name = entry.get("name", "")
        if not name:
            return records

        # Determine category from detail page or section
        category_key = self._infer_category(entry, detail)
        cat_info = self.CATEGORY_MAP.get(category_key, self.CATEGORY_MAP["short"])

        record = self.make_record(
            name=name,
            primary_output=PrimaryOutput.VIDEO,
            output_subtype="animation",
            budget_tier=cat_info["budget"],
            source_url=entry.get("url", ""),
        )

        record.add_tag("approach_style", cat_info["approach"])

        # Animation technique inference
        if detail:
            full_text = detail.get_text().lower()
            if "stop motion" in full_text or "stop-motion" in full_text:
                record.add_tag("technical_capability", "stop-motion")
            if "3d" in full_text or "cgi" in full_text:
                record.add_tag("technical_capability", "3d")
            if "2d" in full_text or "hand-drawn" in full_text or "cel" in full_text:
                record.add_tag("technical_capability", "2d-animation")
            if "mixed media" in full_text or "collage" in full_text:
                record.add_tag("illustration_style", "collage")

            # Scan for style/tone signals
            self.scan_text_for_tags(record, full_text, ["visual_style", "tone", "subject_matter"])

            # Extract country/location
            country_el = detail.select_one(".country, .origin, [class*='country']")
            if country_el:
                record.location_country = country_el.get_text(strip=True)

        # Mifa entries are emerging studios actively seeking work
        if entry.get("source_section") == "mifa":
            record.budget_tier = BudgetTier.EMERGING
            record.raw_data["mifa_participant"] = True

        record.raw_data = entry
        records.append(record)
        return records

    def _infer_category(self, entry: dict, detail) -> str:
        """Infer the competition category from entry data or page content."""
        url = entry.get("url", "").lower()
        for key in self.CATEGORY_MAP:
            if key in url:
                return key

        if detail:
            text = detail.get_text().lower()
            if "commissioned" in text or "commercial" in text:
                return "commissioned"
            if "feature" in text:
                return "feature"
            if "graduation" in text or "student" in text:
                return "graduation"

        return "short"
