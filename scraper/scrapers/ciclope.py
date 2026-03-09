# Author: Charley Scholz, JLAI
# Co-authored: Claude Opus 4.6, Claude Code v2.1.38 (coding assistant), Cursor 2.4 (IDE)
#
"""
Ciclope Festival — Dedicated exclusively to "Craft" in commercials and music videos.
GOLD SOURCE: Separates by craft role. Best Colorist ≠ Best Director.
Maps directly to how producers actually search.

Extraction Priority: VERY HIGH — Closest alignment to agency workflow.
Budget Tier Signal: Mid-tier to established
"""

import logging
import re

from base_scraper import BaseScraper
from config import SourceConfig
from models import CreatorRecord, PrimaryOutput, BudgetTier

logger = logging.getLogger(__name__)


class CiclopeScraper(BaseScraper):
    """
    Key advantage: Ciclope categorizes by CRAFT ROLE, not just project.
    This means we get pre-separated records for directors, DPs, colorists, editors, etc.

    Categories typically include:
        Direction, Cinematography, Color Grading, VFX, Editing,
        Animation, Sound Design, Production Design, Music Video
    """

    # Map Ciclope categories to technical_capability tags
    CATEGORY_TAG_MAP = {
        "direction": [],
        "cinematography": ["cinematography"],
        "color grading": ["color-grading"],
        "colour grading": ["color-grading"],
        "color": ["color-grading"],
        "vfx": ["vfx"],
        "visual effects": ["vfx"],
        "editing": ["editing"],
        "edit": ["editing"],
        "animation": ["2d-animation"],  # refined by context
        "sound design": [],  # changes primary_output to AUDIO
        "sound": [],
        "production design": [],
        "music video": [],
        "motion design": ["motion-graphics"],
        "motion graphics": ["motion-graphics"],
    }

    def __init__(self, config: SourceConfig):
        super().__init__(config)
        self.base_url = "https://www.ciclopefestival.com"

    def discover_entries(self) -> list[dict]:
        entries = []
        seen_urls = set()

        page = self.fetch(f"{self.base_url}/behind-the-craft/")
        if not page:
            return entries

        for a in page.select("a[href]"):
            href = a.get("href", "")
            text = a.get_text(strip=True)

            if "behind-the-craft/" not in href or href == f"{self.base_url}/behind-the-craft/":
                continue
            if href in seen_urls:
                continue

            seen_urls.add(href)
            craft = ""
            lower_href = href.lower()
            if "meet-the-maker" in lower_href or "meet-the-creative" in lower_href:
                name_part = href.rstrip("/").split("/")[-1]
                name_part = name_part.replace("meet-the-maker-", "").replace("meet-the-creative-", "")
                name_part = " ".join(w.capitalize() for w in name_part.split("-"))
                craft = "direction"
            elif "production-company" in lower_href:
                craft = "production"
            elif "agency-of-the-year" in lower_href:
                craft = "agency"
            else:
                continue

            entries.append({
                "url": href,
                "name": name_part if "meet-the" in lower_href else "",
                "craft_category": craft,
                "brand": "",
            })

        return entries

    def parse_entry(self, entry: dict) -> list[CreatorRecord]:
        records = []
        detail = self.fetch(entry["url"]) if entry.get("url") else None

        craft = entry.get("craft_category", "")

        # Determine output subtype
        is_music_video = "music video" in craft or "music" in craft
        output_subtype = "music_video" if is_music_video else "commercial"

        record = self.make_record(
            name=entry.get("name", ""),
            primary_output=PrimaryOutput.VIDEO,
            output_subtype=output_subtype,
            budget_tier=BudgetTier.MID_TIER,
            source_url=entry.get("url", ""),
        )

        # Apply craft-specific tags
        for cat_key, tags in self.CATEGORY_TAG_MAP.items():
            if cat_key in craft:
                for tag in tags:
                    record.add_tag("technical_capability", tag)
                break

        # Sound design = AUDIO primary output
        if "sound" in craft:
            record.primary_output = PrimaryOutput.AUDIO

        # Music video tags
        if is_music_video:
            record.add_tag("subject_matter", "entertainment")
            record.add_tag("subject_subcategory", "music")

        # Infer industry vertical from brand/client
        brand = entry.get("brand", "")
        if brand:
            self.scan_text_for_tags(record, brand, ["industry_vertical", "subject_matter"])
            record.raw_data["client"] = brand

        # Detail page enrichment
        if detail:
            full_text = detail.get_text().lower()
            self.scan_text_for_tags(record, full_text, ["visual_style", "tone", "approach_style"])

            # Look for production company (reveals mid-tier director rosters)
            prodco_el = detail.select_one(
                ".production-company, .prodco, .company, [class*='production']"
            )
            if prodco_el:
                record.raw_data["production_company"] = prodco_el.get_text(strip=True)

            # Extract credits for secondary records
            credits_el = detail.select_one(".credits, .crew, .team")
            if credits_el:
                credits = self.parse_credits_block(credits_el.get_text())
                secondary = self.records_from_credits(credits, record)
                records.extend(secondary)

        # Award
        year_match = re.search(r"20\d{2}", entry.get("url", ""))
        year = int(year_match.group()) if year_match else 2025
        record.awards.append(self.make_award(
            year=year,
            category=f"Ciclope - {craft.title()}" if craft else "Ciclope",
            result="winner",
        ))

        record.raw_data.update(entry)
        records.append(record)
        return records
