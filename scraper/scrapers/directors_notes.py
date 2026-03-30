# Author: Charley Scholz, JLAI
# Co-authored: Claude Opus 4.6, Claude Code v2.1.38 (coding assistant), Cursor 2.4 (IDE)
#
"""
Director's Notes — Deep-dive interviews with filmmakers about how they made specific shots.
Interview content provides LANGUAGE that maps to taxonomy.
"I wanted a handheld, vérité feel" → documentary + gritty + natural-light.

Extraction Priority: MEDIUM (rich qualitative data; slower to scrape)
"""

import logging
from base_scraper import BaseScraper
from config import SourceConfig
from models import CreatorRecord, PrimaryOutput, BudgetTier

logger = logging.getLogger(__name__)


class DirectorsNotesScraper(BaseScraper):
    """
    Process-focused, not portfolio-focused.
    Key value: creators describe their own work in terms that map directly to our taxonomy.
    Self-declared style signals are high-reliability (Priority 2 in extraction matrix).
    """

    def __init__(self, config: SourceConfig):
        super().__init__(config)
        self.base_url = "https://directorsnotes.com"

    def discover_entries(self) -> list[dict]:
        entries = []

        # Sub-paths /interviews, /features, /shorts return 404 as of 2026;
        # root page and paginated archives work (WordPress blog structure)
        for path in ["/", "/page/2/", "/page/3/"]:
            page = self.fetch(f"{self.base_url}{path}")
            if not page:
                continue

            for el in page.select("article, .post, .interview, .feature"):
                title_el = el.select_one("h2 a, h3 a, .title a, .entry-title a")
                if title_el:
                    entries.append({
                        "url": self.resolve_url(title_el.get("href", "")),
                        "title": title_el.get_text(strip=True),
                    })

        return entries

    def parse_entry(self, entry: dict) -> list[CreatorRecord]:
        records = []
        detail = self.fetch(entry["url"]) if entry.get("url") else None
        if not detail:
            return records

        # Extract interviewee name — usually the director or DP
        name = ""
        # Try byline patterns
        byline_el = detail.select_one(
            ".interviewee, .filmmaker, .director-name, "
            "h1, .entry-title, .post-title"
        )
        if byline_el:
            name = byline_el.get_text(strip=True)
            # Strip article title prefix like "Interview: " or "Making of: "
            for prefix in ["interview:", "making of:", "behind:", "the making of:"]:
                if name.lower().startswith(prefix):
                    name = name[len(prefix):].strip()

        if not name:
            name = entry.get("title", "")

        record = self.make_record(
            name=name,
            primary_output=PrimaryOutput.VIDEO,
            source_url=entry.get("url", ""),
        )

        # The gold of this source: scan interview text for self-declared style language
        article_el = detail.select_one(
            ".entry-content, .post-content, article, .interview-body, main"
        )
        if article_el:
            full_text = article_el.get_text()

            # Aggressive text scanning — this is where the value is
            self.scan_text_for_tags(record, full_text, [
                "approach_style", "visual_style", "tone",
                "technical_capability", "subject_matter",
            ])

            # Look for self-declared comparables
            # Patterns like "inspired by [Name]", "influenced by [Name]", "channeling [Name]"
            import re
            inspiration_patterns = [
                r"inspired by\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)",
                r"influenced by\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)",
                r"channeling\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)",
                r"homage to\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)",
                r"reminiscent of\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)",
            ]
            for pattern in inspiration_patterns:
                matches = re.findall(pattern, full_text)
                for match in matches:
                    record.raw_data.setdefault("self_declared_comparables", []).append(match)

            # Look for technical details
            # "We used a snorkel lens", "We shot on 16mm", "Alexa Mini"
            tech_patterns = {
                "16mm": "cinematic", "35mm": "cinematic", "film stock": "cinematic",
                "anamorphic": "cinematic", "snorkel lens": "macro",
                "drone": "aerial", "underwater": "underwater",
                "steadicam": "cinematic", "handheld": "gritty",
            }
            full_lower = full_text.lower()
            for keyword, tag in tech_patterns.items():
                if keyword in full_lower:
                    # Determine which category this belongs to
                    if tag in ("aerial", "underwater", "macro"):
                        record.add_tag("technical_capability", tag)
                    else:
                        record.add_tag("visual_style", tag)

        # Portfolio URL — often linked in the interview
        portfolio_el = detail.select_one(
            "a[href*='vimeo'], a[href*='website'], a[href*='portfolio'], "
            "a[href*='.com']:not([href*='directorsnotes'])"
        )
        if portfolio_el:
            record.portfolio_url = portfolio_el.get("href", "")

        record.raw_data.update(entry)
        records.append(record)
        return records
