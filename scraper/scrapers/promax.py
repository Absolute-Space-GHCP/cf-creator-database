# Author: Charley Scholz, JLAI
# Co-authored: Claude Opus 4.6, Claude Code v2.1.38 (coding assistant), Cursor 2.4 (IDE)
#
"""
Promax Awards — Broadcast design and motion graphics.
Extraction Priority: MEDIUM
"""

import logging
from base_scraper import BaseScraper
from config import SourceConfig
from models import CreatorRecord, PrimaryOutput, BudgetTier

logger = logging.getLogger(__name__)


class PromaxScraper(BaseScraper):

    def __init__(self, config: SourceConfig):
        super().__init__(config)
        self.base_url = "https://www.promax.org"

    def discover_entries(self) -> list[dict]:
        entries = []
        for path in ["/awards", "/awards/winners", "/awards/archive"]:
            page = self.fetch(f"{self.base_url}{path}")
            if not page:
                continue
            for el in page.select(".winner, .entry, article, .award-item"):
                name_el = el.select_one("h2, h3, .title, .name")
                link_el = el.select_one("a")
                if name_el:
                    entries.append({
                        "url": self.resolve_url(link_el.get("href", "")) if link_el else "",
                        "name": name_el.get_text(strip=True),
                    })
        return entries

    def parse_entry(self, entry: dict) -> list[CreatorRecord]:
        records = []

        record = self.make_record(
            name=entry.get("name", ""),
            primary_output=PrimaryOutput.VIDEO,
            output_subtype="animation",
            budget_tier=BudgetTier.MID_TIER,
            source_url=entry.get("url", ""),
        )

        # Broadcast design defaults
        record.add_tag("technical_capability", "motion-graphics")
        record.add_tag("platform_usage", "broadcast")
        record.add_tag("industry_vertical", "entertainment")
        record.add_tag("subject_subcategory", "film-tv")
        record.add_tag("approach_style", "commercial")

        detail = self.fetch(entry["url"]) if entry.get("url") else None
        if detail:
            full_text = detail.get_text().lower()
            if "3d" in full_text:
                record.add_tag("technical_capability", "3d")
            if "vfx" in full_text:
                record.add_tag("technical_capability", "vfx")
            self.scan_text_for_tags(record, full_text, ["visual_style"])

        record.raw_data = entry
        records.append(record)
        return records
