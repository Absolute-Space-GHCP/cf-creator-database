# Author: Charley Scholz, JLAI
# Co-authored: Claude Opus 4.6, Claude Code v2.1.38 (coding assistant), Cursor 2.4 (IDE)
#
"""
Motionographer — Industry-standard news/curation hub for motion design.
Features work + studio profiles + job postings.
Jobs section reveals studios actively hiring = healthy mid-tier shops.

Extraction Priority: VERY HIGH — Core source for motion design talent.
"""

import logging
from base_scraper import BaseScraper
from config import SourceConfig
from models import CreatorRecord, PrimaryOutput, BudgetTier

logger = logging.getLogger(__name__)


class MotionographerScraper(BaseScraper):
    """
    Two discovery paths:
        1. Featured work → studio/individual profiles
        2. Job postings → active mid-tier studios (secondary signal)
    """

    def __init__(self, config: SourceConfig):
        super().__init__(config)
        self.base_url = "https://motionographer.com"

    def discover_entries(self) -> list[dict]:
        entries = []
        seen_urls = set()

        for page_num in range(1, 4):
            path = "/" if page_num == 1 else f"/page/{page_num}/"
            page = self.fetch(f"{self.base_url}{path}")
            if not page:
                continue

            for el in page.select("article.post"):
                header_link = el.select_one(".article-header a[href]")
                if not header_link:
                    header_link = el.select_one("a[href]")
                if not header_link:
                    continue

                url = header_link.get("href", "")
                name = header_link.get("title", "") or header_link.get_text(strip=True)

                if url and url not in seen_urls and "motionographer.com" in url:
                    seen_urls.add(url)
                    entries.append({
                        "url": url,
                        "name": name,
                        "entry_type": "featured_work",
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

        record.add_tag("technical_capability", "motion-graphics")

        if detail:
            content_el = detail.select_one(".entry-content, .post-content, article .content")
            full_text = content_el.get_text().lower() if content_el else detail.get_text().lower()

            tech_signals = {
                "3d": ["3d", "cinema 4d", "c4d", "blender", "maya", "houdini"],
                "2d-animation": ["2d", "after effects", "cel", "hand-drawn", "frame-by-frame"],
                "vfx": ["vfx", "compositing", "nuke", "flame"],
            }
            for tag, keywords in tech_signals.items():
                if any(k in full_text for k in keywords):
                    record.add_tag("technical_capability", tag)

            self.scan_text_for_tags(record, full_text, [
                "visual_style", "tone", "approach_style", "illustration_style",
            ])

            if content_el:
                ext_links = content_el.select("a[href]")
                for link in ext_links:
                    href = link.get("href", "")
                    if href and "motionographer" not in href and href.startswith("http"):
                        record.portfolio_url = href
                        break

        record.raw_data.update(entry)
        records.append(record)
        return records
