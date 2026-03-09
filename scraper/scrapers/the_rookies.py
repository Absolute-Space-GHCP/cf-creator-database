# Author: Charley Scholz, JLAI
# Co-authored: Claude Opus 4.6, Claude Code v2.1.38 (coding assistant), Cursor 2.4 (IDE)
#
"""
The Rookies — Portfolio platform for student/emerging VFX, game dev, and 3D talent.
Best source for emerging talent at accessible rates. The "farm system."

Extraction Priority: VERY HIGH
Budget Tier Signal: Emerging (by definition)
"""

import logging
from base_scraper import BaseScraper
from config import SourceConfig
from models import CreatorRecord, PrimaryOutput, BudgetTier

logger = logging.getLogger(__name__)


class TheRookiesScraper(BaseScraper):
    """
    Highly vetted through competition structure.
    Today's "Rookie of the Year" = next year's mid-tier hire.

    Discovery strategy:
        1. Scrape competition winners/finalists (highest signal)
        2. Scrape featured portfolios
        3. Extract profile data: skills, discipline, location
    """

    # Map Rookies discipline categories to our schema
    DISCIPLINE_MAP = {
        "vfx": {"output": PrimaryOutput.VIDEO, "subtype": "animation", "tech": ["vfx"]},
        "visual effects": {"output": PrimaryOutput.VIDEO, "subtype": "animation", "tech": ["vfx"]},
        "3d animation": {"output": PrimaryOutput.VIDEO, "subtype": "animation", "tech": ["3d"]},
        "3d": {"output": PrimaryOutput.VIDEO, "subtype": "animation", "tech": ["3d"]},
        "2d animation": {"output": PrimaryOutput.VIDEO, "subtype": "animation", "tech": ["2d-animation"]},
        "concept art": {"output": PrimaryOutput.STILL, "subtype": "illustration", "tech": []},
        "character design": {"output": PrimaryOutput.STILL, "subtype": "illustration", "tech": []},
        "motion design": {"output": PrimaryOutput.VIDEO, "subtype": "animation", "tech": ["motion-graphics"]},
        "motion graphics": {"output": PrimaryOutput.VIDEO, "subtype": "animation", "tech": ["motion-graphics"]},
        "game design": {"output": PrimaryOutput.VIDEO, "subtype": "animation", "tech": ["3d"]},
        "game art": {"output": PrimaryOutput.STILL, "subtype": "illustration", "tech": ["3d"]},
        "film": {"output": PrimaryOutput.VIDEO, "subtype": "film_narrative", "tech": []},
        "immersive": {"output": PrimaryOutput.VIDEO, "subtype": "animation", "tech": ["vfx"]},
    }

    def __init__(self, config: SourceConfig):
        super().__init__(config)
        self.base_url = "https://www.therookies.co"

    def discover_entries(self) -> list[dict]:
        entries = []

        # Competition winners — highest signal
        for path in ["/contests", "/winners", "/rookies-of-the-year"]:
            page = self.fetch(f"{self.base_url}{path}")
            if not page:
                continue
            for el in page.select(".rookie, .winner, .finalist, .profile-card, article"):
                name_el = el.select_one("h2, h3, .name, .title, .rookie-name")
                link_el = el.select_one("a")
                discipline_el = el.select_one(".discipline, .category, .skill, .tag")
                if name_el:
                    entries.append({
                        "url": self.resolve_url(link_el.get("href", "")) if link_el else "",
                        "name": name_el.get_text(strip=True),
                        "discipline": discipline_el.get_text(strip=True).lower() if discipline_el else "",
                        "is_winner": "/winner" in (link_el.get("href", "") if link_el else ""),
                    })

        # Featured portfolios
        page = self.fetch(f"{self.base_url}/explore")
        if page:
            for el in page.select(".portfolio-card, .project-card, article"):
                name_el = el.select_one("h2, h3, .name, .author")
                link_el = el.select_one("a")
                if name_el:
                    entries.append({
                        "url": self.resolve_url(link_el.get("href", "")) if link_el else "",
                        "name": name_el.get_text(strip=True),
                        "discipline": "",
                    })

        return entries

    def parse_entry(self, entry: dict) -> list[CreatorRecord]:
        records = []
        detail = self.fetch(entry["url"]) if entry.get("url") else None

        record = self.make_record(
            name=entry.get("name", ""),
            budget_tier=BudgetTier.EMERGING,
            source_url=entry.get("url", ""),
        )

        # Map discipline to schema fields
        discipline = entry.get("discipline", "")
        matched = False
        for disc_key, mapping in self.DISCIPLINE_MAP.items():
            if disc_key in discipline:
                record.primary_output = mapping["output"]
                record.output_subtype = mapping["subtype"]
                for tech_tag in mapping["tech"]:
                    record.add_tag("technical_capability", tech_tag)
                matched = True
                break

        if not matched and detail:
            # Try to infer from profile page
            full_text = detail.get_text().lower()
            for disc_key, mapping in self.DISCIPLINE_MAP.items():
                if disc_key in full_text:
                    record.primary_output = mapping["output"]
                    record.output_subtype = mapping["subtype"]
                    for tech_tag in mapping["tech"]:
                        record.add_tag("technical_capability", tech_tag)
                    break

        if detail:
            full_text = detail.get_text().lower()
            self.scan_text_for_tags(record, full_text)

            # Location from profile
            loc_el = detail.select_one(".location, .country, [class*='location']")
            if loc_el:
                loc_text = loc_el.get_text(strip=True)
                parts = [p.strip() for p in loc_text.split(",")]
                if len(parts) >= 2:
                    record.location_city = parts[0]
                    record.location_country = parts[-1]
                else:
                    record.location_country = loc_text

            # Portfolio URL
            portfolio_el = detail.select_one("a[href*='artstation'], a[href*='behance'], a.portfolio")
            if portfolio_el:
                record.portfolio_url = portfolio_el.get("href", "")

            # Skills/software tags
            for skill_el in detail.select(".skill, .tag, .tool"):
                skill_text = skill_el.get_text(strip=True)
                self.normalize_and_add_tag(record, "technical_capability", skill_text)

        record.remote_available = True  # Emerging talent is typically remote-available
        record.raw_data = entry
        records.append(record)
        return records
