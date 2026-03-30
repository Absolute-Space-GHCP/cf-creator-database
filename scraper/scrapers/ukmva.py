# Author: Charley Scholz, JLAI
# Co-authored: Claude Opus 4.6, Claude Code v2.1.38 (coding assistant), Cursor 2.4 (IDE)
#
"""
UKMVA (UK Music Video Awards) — Highest standard for music video production.
Production company credits reveal rosters of mid-tier directors.

Extraction Priority: HIGH
Budget Tier Signal: Mid-tier
"""

import logging
from base_scraper import BaseScraper
from config import SourceConfig
from models import CreatorRecord, PrimaryOutput, BudgetTier

logger = logging.getLogger(__name__)


class UKMVAScraper(BaseScraper):

    def __init__(self, config: SourceConfig):
        super().__init__(config)
        self.base_url = "https://www.ukmva.com"

    def discover_entries(self) -> list[dict]:
        entries = []
        # UKMVA is JS-heavy; try root and any discoverable content paths
        for path in ["/", "/winners", "/nominations", "/archive",
                     "/awards", "/categories", "/history"]:
            page = self.fetch(f"{self.base_url}{path}")
            if not page:
                continue
            for el in page.select(
                ".winner, .nominee, .entry, article, .award-entry, "
                ".video-entry, .card, .nomination"
            ):
                name_el = el.select_one("h2, h3, .title, .director-name, .name")
                cat_el = el.select_one(".category, .award-category")
                link_el = el.select_one("a")
                if name_el:
                    entries.append({
                        "url": self.resolve_url(link_el.get("href", "")) if link_el else "",
                        "name": name_el.get_text(strip=True),
                        "category": cat_el.get_text(strip=True) if cat_el else "",
                    })
        if not entries:
            logger.warning("[ukmva] No entries found — site may require JS rendering (Playwright)")
        return entries

    def parse_entry(self, entry: dict) -> list[CreatorRecord]:
        records = []
        detail = self.fetch(entry["url"]) if entry.get("url") else None

        record = self.make_record(
            name=entry.get("name", ""),
            primary_output=PrimaryOutput.VIDEO,
            output_subtype="music_video",
            budget_tier=BudgetTier.MID_TIER,
            source_url=entry.get("url", ""),
        )

        # Always music + entertainment
        record.add_tag("subject_matter", "entertainment")
        record.add_tag("subject_subcategory", "music")

        # Infer from award category
        category = entry.get("category", "").lower()
        if "animation" in category:
            record.add_tag("technical_capability", "2d-animation")
        if "choreograph" in category or "dance" in category:
            record.add_tag("approach_style", "action")
        if "vfx" in category or "visual effect" in category:
            record.add_tag("technical_capability", "vfx")

        if detail:
            full_text = detail.get_text().lower()
            self.scan_text_for_tags(record, full_text, ["visual_style", "tone", "technical_capability"])

            # Production company → reveals mid-tier director rosters
            prodco_el = detail.select_one(".production-company, .prodco, .company")
            if prodco_el:
                record.raw_data["production_company"] = prodco_el.get_text(strip=True)

            # Credits
            credits_el = detail.select_one(".credits, .crew")
            if credits_el:
                credits = self.parse_credits_block(credits_el.get_text())
                records.extend(self.records_from_credits(credits, record))

        record.raw_data = entry
        records.append(record)
        return records
