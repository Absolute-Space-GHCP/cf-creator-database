# Author: Charley Scholz, JLIT
# Co-authored: Claude Opus 4.6, Claude Code v2.1.38 (coding assistant), Cursor 2.4 (IDE)
#
"""
Ars Electronica (Austria) — Creative tech, interactive art, projection mapping, AI art.
Surfaces talent for experiential/activation work that traditional ad databases miss.

Extraction Priority: MEDIUM-HIGH
Budget Tier Signal: Emerging to mid-tier
"""

import logging
from base_scraper import BaseScraper
from config import SourceConfig
from models import CreatorRecord, PrimaryOutput, BudgetTier

logger = logging.getLogger(__name__)


class ArsElectronicaScraper(BaseScraper):

    def __init__(self, config: SourceConfig):
        super().__init__(config)
        self.base_url = "https://ars.electronica.art"

    def discover_entries(self) -> list[dict]:
        entries = []

        # Prix Ars Electronica winners/nominees
        prix_page = self.fetch(f"{self.base_url}/en/prix")
        if prix_page:
            for el in prix_page.select(".project, .winner, .entry, article, .prix-entry"):
                name_el = el.select_one("h2, h3, .title, .project-title")
                link_el = el.select_one("a")
                if name_el:
                    entries.append({
                        "url": self.resolve_url(link_el.get("href", "")) if link_el else "",
                        "name": name_el.get_text(strip=True),
                    })

        # Festival archive
        archive_page = self.fetch(f"{self.base_url}/en/archive")
        if archive_page:
            for el in archive_page.select(".project, article"):
                name_el = el.select_one("h2, h3, .title")
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
            source_url=entry.get("url", ""),
        )

        # Default tags for Ars Electronica context
        record.add_tag("approach_style", "experimental")
        record.add_tag("approach_style", "conceptual")
        record.add_tag("platform_usage", "experiential")
        record.add_tag("tone", "sophisticated")

        if detail:
            full_text = detail.get_text().lower()

            # Infer primary output from project description
            if any(w in full_text for w in ["installation", "projection", "immersive", "interactive"]):
                record.primary_output = PrimaryOutput.VIDEO
                record.add_tag("platform_usage", "experiential")
            if any(w in full_text for w in ["ai art", "generative", "machine learning"]):
                record.primary_output = PrimaryOutput.STILL
                record.output_subtype = "ai_imagery"
            if "video" in full_text or "film" in full_text:
                record.primary_output = PrimaryOutput.VIDEO
            if "sound" in full_text or "audio" in full_text:
                record.secondary_output = PrimaryOutput.AUDIO

            # Technical capabilities
            tech_signals = {
                "vfx": ["vfx", "visual effects", "cgi"],
                "3d": ["3d", "three-dimensional", "rendered"],
                "motion-graphics": ["motion graphics", "kinetic", "motion design"],
            }
            for tag, keywords in tech_signals.items():
                if any(k in full_text for k in keywords):
                    record.add_tag("technical_capability", tag)

            self.scan_text_for_tags(record, full_text)

            # Location
            country_el = detail.select_one(".country, .location, [class*='origin']")
            if country_el:
                record.location_country = country_el.get_text(strip=True)

        record.budget_tier = BudgetTier.EMERGING
        record.raw_data = entry
        records.append(record)
        return records
