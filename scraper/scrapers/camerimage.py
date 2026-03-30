# Author: Charley Scholz, JLAI
# Co-authored: Claude Opus 4.6, Claude Code v2.1.38 (coding assistant), Cursor 2.4 (IDE)
#
"""
Camerimage (Poland) — The only major festival dedicated to cinematography.
Golden Frog = highest honor for DPs.

Extraction Priority: HIGH
Budget Tier Signal: Established (but trace credits to find mid-tier crew)
Primary Value: Cinematography gold standard
"""

import logging
import re
from typing import Optional

from base_scraper import BaseScraper
from config import SourceConfig
from models import CreatorRecord, PrimaryOutput, BudgetTier, Award

logger = logging.getLogger(__name__)


class CameramageScraper(BaseScraper):
    """
    Scrapes Camerimage festival pages for nominees, winners, and their credits.

    Discovery strategy:
        1. Navigate to yearly award pages (Golden Frog, Silver Frog, Bronze Frog)
        2. Extract each nominated/winning entry
        3. For each entry, extract the DP as the primary record
        4. Parse credits for secondary records (gaffers, colorists, camera ops)

    Page structure (typical):
        - /en/competition/[year]/main-competition  → Feature film DPs
        - /en/competition/[year]/documentary       → Documentary DPs
        - /en/competition/[year]/music-video        → Music video DPs
        - /en/competition/[year]/commercials        → Commercial DPs
    """

    # Map Camerimage competition sections to our output subtypes
    SECTION_MAP = {
        "main-competition": "film_narrative",
        "feature-film": "film_narrative",
        "documentary": "documentary",
        "music-video": "music_video",
        "music-videos": "music_video",
        "commercials": "commercial",
        "short-film": "film_narrative",
        "debut": "film_narrative",
        "tv-series": "film_narrative",
        "student": "film_narrative",
    }

    # Map result labels to our award result values
    RESULT_MAP = {
        "golden frog": "winner",
        "silver frog": "winner",
        "bronze frog": "winner",
        "winner": "winner",
        "nominee": "nominee",
        "official selection": "official_selection",
        "selected": "official_selection",
    }

    def __init__(self, config: SourceConfig):
        super().__init__(config)
        self.base_url = "https://camerimage.pl"

    def discover_entries(self) -> list[dict]:
        """
        Discover nominated/winning entries from competition pages.
        Scrapes the most recent year by default; can be configured for historical.
        """
        entries = []

        # Navigate to the main film/competition index (site restructured ~2026)
        index_page = None
        for index_path in ["/en/movies", "/en/festival", "/en/sekcje-konkursowe"]:
            index_page = self.fetch(f"{self.base_url}{index_path}")
            if index_page:
                break
        if not index_page:
            logger.warning("[camerimage] Could not fetch festival index")
            return entries

        # Find links to competition sections
        competition_links = []
        for link in index_page.select(
            "a[href*='competition'], a[href*='programme'], "
            "a[href*='movies'], a[href*='sekcje']"
        ):
            href = link.get("href", "")
            if href and ("/en/" in href or "/pl/" in href):
                competition_links.append(self.resolve_url(href))

        # If structured competition links aren't found, try year-based URLs
        if not competition_links:
            import datetime
            current_year = datetime.datetime.now().year
            for year in range(current_year, current_year - 3, -1):
                for section in self.SECTION_MAP.keys():
                    competition_links.append(
                        f"{self.base_url}/en/competition/{year}/{section}"
                    )

        # Scrape each competition section
        for comp_url in competition_links:
            page = self.fetch(comp_url)
            if not page:
                continue

            # Determine section/subtype from URL
            section_key = self._section_from_url(comp_url)
            year = self._year_from_url(comp_url)

            # Extract individual entries (films/projects with their DPs)
            for entry_el in page.select(
                ".film-item, .competition-entry, .nominee, .entry, article"
            ):
                entry = self._extract_entry_from_element(entry_el, section_key, year, comp_url)
                if entry and entry.get("name"):
                    entries.append(entry)

        logger.info(f"[camerimage] Discovered {len(entries)} entries")
        return entries

    def parse_entry(self, entry: dict) -> list[CreatorRecord]:
        """
        Parse a discovered entry into CreatorRecord(s).
        Primary record = the DP/Cinematographer.
        Secondary records = credited crew members (gaffers, colorists, etc.)
        """
        records = []

        # --- Primary record: the Cinematographer ---
        dp_name = entry.get("dp_name") or entry.get("name", "")
        if not dp_name:
            return records

        record = self.make_record(
            name=dp_name,
            primary_output=PrimaryOutput.VIDEO,
            output_subtype=entry.get("output_subtype", "film_narrative"),
            budget_tier=BudgetTier.ESTABLISHED,
            source_url=entry.get("url", ""),
        )

        # Tags: cinematography is always the core capability
        record.add_tag("technical_capability", "cinematography")
        record.add_tag("approach_style", "cinematic")

        # Infer subject from section
        if entry.get("output_subtype") == "documentary":
            record.add_tag("approach_style", "documentary")
        elif entry.get("output_subtype") == "music_video":
            record.add_tag("subject_matter", "entertainment")
            record.add_tag("subject_subcategory", "music")
        elif entry.get("output_subtype") == "commercial":
            record.add_tag("approach_style", "commercial")

        # Scan description/jury notes for visual style signals
        description = entry.get("description", "")
        if description:
            self.scan_text_for_tags(
                record, description,
                ["visual_style", "tone", "approach_style"]
            )

        # Award
        if entry.get("year") and entry.get("category"):
            record.awards.append(self.make_award(
                year=entry["year"],
                category=entry["category"],
                result=entry.get("result", "nominee"),
            ))

        # Portfolio URL if available
        if entry.get("portfolio_url"):
            record.portfolio_url = entry["portfolio_url"]

        record.raw_data = entry
        records.append(record)

        # --- Secondary records: crew from credits ---
        credits_text = entry.get("credits", "")
        if credits_text:
            parsed_credits = self.parse_credits_block(credits_text)
            secondary = self.records_from_credits(
                parsed_credits,
                base_record=record,
                include_secondary=True,
            )
            records.extend(secondary)

        return records

    # ------------------------------------------------------------------
    # Internal Helpers
    # ------------------------------------------------------------------

    def _extract_entry_from_element(self, el, section_key: str, year: int, page_url: str) -> dict:
        """Extract structured data from a single entry element on a competition page."""
        entry = {
            "url": page_url,
            "output_subtype": self.SECTION_MAP.get(section_key, "film_narrative"),
            "year": year,
            "category": f"Camerimage {year} - {section_key.replace('-', ' ').title()}",
        }

        # Try multiple selector strategies for the entry's data
        # Film/project title
        title_el = el.select_one("h2, h3, .title, .film-title, .entry-title")
        entry["project_title"] = title_el.get_text(strip=True) if title_el else ""

        # DP / Cinematographer name — this is the primary target
        dp_el = el.select_one(
            ".cinematographer, .dp, .dop, "
            "[class*='cinematograph'], [class*='director-of-photo']"
        )
        if dp_el:
            entry["dp_name"] = dp_el.get_text(strip=True)
        else:
            # Fall back to scanning text for "Cinematographer:" or "DP:" pattern
            full_text = el.get_text()
            dp_match = re.search(
                r"(?:cinematograph(?:er|y)|d\.?p\.?|director of photography)[:\s]+([^\n,]+)",
                full_text,
                re.IGNORECASE,
            )
            if dp_match:
                entry["dp_name"] = dp_match.group(1).strip()

        # Name falls back to DP name or project title
        entry["name"] = entry.get("dp_name", entry.get("project_title", ""))

        # Director name (for reference, not primary record)
        dir_el = el.select_one(".director, [class*='director']")
        if dir_el:
            entry["director_name"] = dir_el.get_text(strip=True)
        else:
            dir_match = re.search(
                r"(?:director|directed by)[:\s]+([^\n,]+)",
                el.get_text(),
                re.IGNORECASE,
            )
            if dir_match:
                entry["director_name"] = dir_match.group(1).strip()

        # Award result (winner/nominee)
        result_text = el.get_text().lower()
        for label, result_val in self.RESULT_MAP.items():
            if label in result_text:
                entry["result"] = result_val
                break
        else:
            entry["result"] = "official_selection"

        # Full credits block
        credits_el = el.select_one(".credits, .crew, .team, [class*='credit']")
        if credits_el:
            entry["credits"] = credits_el.get_text()

        # Description / jury notes
        desc_el = el.select_one(".description, .synopsis, .notes, p")
        if desc_el:
            entry["description"] = desc_el.get_text(strip=True)

        # Portfolio/website link
        link_el = el.select_one("a[href*='portfolio'], a[href*='website'], a.external")
        if link_el:
            entry["portfolio_url"] = link_el.get("href", "")

        return entry

    @staticmethod
    def _section_from_url(url: str) -> str:
        """Extract the competition section key from a URL."""
        parts = url.rstrip("/").split("/")
        for part in reversed(parts):
            if part and not part.isdigit() and part != "en":
                return part
        return "main-competition"

    @staticmethod
    def _year_from_url(url: str) -> int:
        """Extract a year from a URL."""
        match = re.search(r"/(\d{4})/", url)
        if match:
            return int(match.group(1))
        from datetime import datetime
        return datetime.now().year
