# Author: Charley Scholz, JLAI
# Co-authored: Claude Opus 4.6, Claude Code v2.1.38 (coding assistant), Cursor 2.4 (IDE)
#
"""
SXSW Title Design Awards — "Oscars" for title sequences.
Extraction Priority: HIGH — Motion graphics is a frequent agency need.
"""

import logging
from base_scraper import BaseScraper
from config import SourceConfig
from models import CreatorRecord, PrimaryOutput, BudgetTier

logger = logging.getLogger(__name__)


class SXSWTitleScraper(BaseScraper):
    """
    Title sequences = motion graphics, typography, opening credits design.
    Credits often list animators, designers, compositors individually — extract as separate mid-tier records.
    """

    def __init__(self, config: SourceConfig):
        super().__init__(config)
        self.base_url = "https://www.sxsw.com"

    def discover_entries(self) -> list[dict]:
        entries = []
        # Title design competition page was removed; try current award paths
        page = None
        for path in [
            "/festivals/film-awards/",
            "/awards/title-design-competition/",
            "/awards/",
        ]:
            page = self.fetch(f"{self.base_url}{path}")
            if page:
                break
        if not page:
            return entries

        for el in page.select(".winner, .nominee, .entry, article, .award-entry"):
            name_el = el.select_one("h2, h3, .title, .entry-title")
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
            output_subtype="animation",
            budget_tier=BudgetTier.MID_TIER,
            source_url=entry.get("url", ""),
        )

        # Core tags for title design
        record.add_tag("technical_capability", "motion-graphics")
        record.add_tag("approach_style", "conceptual")
        record.add_tag("approach_style", "editorial")
        record.add_tag("industry_vertical", "entertainment")
        record.add_tag("subject_subcategory", "film-tv")

        if detail:
            full_text = detail.get_text().lower()

            # Technique inference
            if "3d" in full_text or "cgi" in full_text:
                record.add_tag("technical_capability", "3d")
            if "2d" in full_text or "hand-drawn" in full_text:
                record.add_tag("technical_capability", "2d-animation")
            if "vfx" in full_text or "compositing" in full_text:
                record.add_tag("technical_capability", "vfx")

            self.scan_text_for_tags(record, full_text, ["visual_style", "illustration_style"])

            # Extract individual credited crew members
            credits_el = detail.select_one(".credits, .crew, .team")
            if credits_el:
                credits = self.parse_credits_block(credits_el.get_text())
                secondary = self.records_from_credits(credits, record, include_secondary=True)
                records.extend(secondary)

        record.raw_data = entry
        records.append(record)
        return records
