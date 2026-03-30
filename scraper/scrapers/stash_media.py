# Author: Charley Scholz, JLAI
# Co-authored: Claude Opus 4.6, Claude Code v2.1.38 (coding assistant), Cursor 2.4 (IDE)
#
"""
Stash Media — "Permanent collection" of motion design & VFX.
Full archive requires subscription; scrape public previews and highlights.

Extraction Priority: MEDIUM (valuable but access-limited)
"""

import logging
from base_scraper import BaseScraper
from config import SourceConfig
from models import CreatorRecord, PrimaryOutput, BudgetTier

logger = logging.getLogger(__name__)


class StashMediaScraper(BaseScraper):

    def __init__(self, config: SourceConfig):
        super().__init__(config)
        self.base_url = "https://www.stashmedia.tv"

    def discover_entries(self) -> list[dict]:
        entries = []

        # Sub-paths /permanent-collection, /features, /news return 404 as of 2026;
        # root page works (blog-style homepage with latest posts)
        for path in ["/", "/page/2/", "/page/3/"]:
            page = self.fetch(f"{self.base_url}{path}")
            if not page:
                continue
            for el in page.select("article, .post, .project, .entry, .collection-item"):
                title_el = el.select_one("h2 a, h3 a, .title a")
                if title_el:
                    entries.append({
                        "url": self.resolve_url(title_el.get("href", "")),
                        "name": title_el.get_text(strip=True),
                    })

        return entries

    def parse_entry(self, entry: dict) -> list[CreatorRecord]:
        records = []
        detail = self.fetch(entry["url"]) if entry.get("url") else None

        record = self.make_record(
            name=entry.get("name", ""),
            primary_output=PrimaryOutput.VIDEO,
            budget_tier=BudgetTier.MID_TIER,
            source_url=entry.get("url", ""),
        )

        record.add_tag("technical_capability", "motion-graphics")

        if detail:
            full_text = detail.get_text().lower()

            if "3d" in full_text or "cgi" in full_text:
                record.add_tag("technical_capability", "3d")
            if "vfx" in full_text:
                record.add_tag("technical_capability", "vfx")

            self.scan_text_for_tags(record, full_text, [
                "visual_style", "tone", "approach_style", "illustration_style",
            ])

            # Check for award mentions
            if "award" in full_text or "winner" in full_text:
                record.raw_data["has_awards"] = True

            client_el = detail.select_one(".client, .brand, [class*='client']")
            if client_el:
                record.raw_data["client"] = client_el.get_text(strip=True)

        record.raw_data = entry
        records.append(record)
        return records
