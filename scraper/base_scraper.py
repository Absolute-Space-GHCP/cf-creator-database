# Author: Charley Scholz, JLAI
# Co-authored: Claude Opus 4.6, Claude Code v2.1.38 (coding assistant), Cursor 2.4 (IDE)
#
"""
Creator Database — Base Scraper
Abstract base class for all source-specific scrapers.
Handles common logic: HTTP requests, tag normalization, credit parsing, record creation.
"""

import json
import logging
import re
import time
from abc import ABC, abstractmethod
from datetime import datetime
from typing import Optional
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup

from config import SourceConfig
from credit_mapping import resolve_credit_role, CREDIT_ROLE_MAP
from models import (
    CreatorRecord, PrimaryOutput, BudgetTier, Award,
    STILL_SUBTYPES, VIDEO_SUBTYPES, AUDIO_SUBTYPES,
)
from normalization import TagNormalizer

logger = logging.getLogger(__name__)


class BaseScraper(ABC):
    """
    Base class for all 14 source scrapers.

    Subclasses must implement:
        - discover_entries()   → yields raw entry dicts from the source
        - parse_entry(entry)   → returns one or more CreatorRecord objects

    The base class provides:
        - HTTP fetching with rate limiting and retries
        - BeautifulSoup parsing helpers
        - Tag normalization via the shared TagNormalizer
        - Credit role resolution
        - Record construction helpers
        - Award object creation
    """

    # --- Class-level settings ---
    RATE_LIMIT_SECONDS = 2.0      # minimum delay between requests
    MAX_RETRIES = 3
    RETRY_BACKOFF = 5.0
    USER_AGENT = (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/122.0.0.0 Safari/537.36"
    )

    def __init__(self, source_config: SourceConfig):
        self.config = source_config
        self.normalizer = TagNormalizer()
        self.session = requests.Session()
        self.session.headers.update({"User-Agent": self.USER_AGENT})
        self._last_request_time = 0.0

    # ------------------------------------------------------------------
    # Abstract Interface
    # ------------------------------------------------------------------

    @abstractmethod
    def discover_entries(self) -> list[dict]:
        """
        Discover all scrapeable entries from this source.
        Returns a list of raw entry dicts with at least:
            - 'url': the page URL for this entry
            - 'name': creator/project name (if available at discovery stage)
        """
        ...

    @abstractmethod
    def parse_entry(self, entry: dict) -> list[CreatorRecord]:
        """
        Parse a single discovered entry into one or more CreatorRecords.
        May return multiple records (e.g., extracting multiple credited roles).
        """
        ...

    # ------------------------------------------------------------------
    # Main Run Method
    # ------------------------------------------------------------------

    def run(self) -> list[CreatorRecord]:
        """Execute full scrape: discover → parse → normalize → return records."""
        logger.info(f"[{self.config.key}] Starting scrape of {self.config.name}")

        entries = self.discover_entries()
        logger.info(f"[{self.config.key}] Discovered {len(entries)} entries")

        all_records = []
        for i, entry in enumerate(entries):
            try:
                records = self.parse_entry(entry)
                for record in records:
                    self._finalize_record(record)
                    all_records.append(record)
            except Exception as e:
                logger.error(f"[{self.config.key}] Error parsing entry {i}: {e}")
                continue

        logger.info(f"[{self.config.key}] Produced {len(all_records)} records")
        return all_records

    # ------------------------------------------------------------------
    # HTTP Helpers
    # ------------------------------------------------------------------

    def fetch(self, url: str) -> Optional[BeautifulSoup]:
        """Fetch a URL and return parsed BeautifulSoup, or None on failure."""
        self._rate_limit()

        for attempt in range(self.MAX_RETRIES):
            try:
                resp = self.session.get(url, timeout=30)
                resp.raise_for_status()
                return BeautifulSoup(resp.text, "html.parser")
            except requests.RequestException as e:
                logger.warning(
                    f"[{self.config.key}] Fetch attempt {attempt + 1} failed for {url}: {e}"
                )
                if attempt < self.MAX_RETRIES - 1:
                    time.sleep(self.RETRY_BACKOFF * (attempt + 1))

        logger.error(f"[{self.config.key}] All fetch attempts failed for {url}")
        return None

    def fetch_json(self, url: str) -> Optional[dict]:
        """Fetch a URL expecting JSON response."""
        self._rate_limit()

        for attempt in range(self.MAX_RETRIES):
            try:
                resp = self.session.get(url, timeout=30)
                resp.raise_for_status()
                return resp.json()
            except (requests.RequestException, json.JSONDecodeError) as e:
                logger.warning(f"[{self.config.key}] JSON fetch attempt {attempt + 1} failed: {e}")
                if attempt < self.MAX_RETRIES - 1:
                    time.sleep(self.RETRY_BACKOFF * (attempt + 1))

        return None

    def _rate_limit(self):
        """Enforce minimum delay between requests."""
        elapsed = time.time() - self._last_request_time
        if elapsed < self.RATE_LIMIT_SECONDS:
            time.sleep(self.RATE_LIMIT_SECONDS - elapsed)
        self._last_request_time = time.time()

    # ------------------------------------------------------------------
    # Parsing Helpers
    # ------------------------------------------------------------------

    def resolve_url(self, path: str) -> str:
        """Resolve a relative URL against the source's base URL."""
        return urljoin(self.config.url, path)

    def extract_text(self, soup: BeautifulSoup, selector: str) -> str:
        """Extract text from the first matching CSS selector, stripped."""
        el = soup.select_one(selector)
        return el.get_text(strip=True) if el else ""

    def extract_all_text(self, soup: BeautifulSoup, selector: str) -> list[str]:
        """Extract text from all matching CSS selectors."""
        return [el.get_text(strip=True) for el in soup.select(selector)]

    def extract_link(self, soup: BeautifulSoup, selector: str) -> str:
        """Extract href from the first matching CSS selector."""
        el = soup.select_one(selector)
        return el.get("href", "") if el else ""

    # ------------------------------------------------------------------
    # Credit Extraction
    # ------------------------------------------------------------------

    def parse_credits_block(self, text: str) -> list[dict]:
        """
        Parse a credits block into structured role-name pairs.
        Handles common formats:
            "Director: Jane Smith"
            "DP / Cinematographer - John Doe"
            "Colorist: Studio Name"
        Returns list of {"role": str, "name": str, "mapping": dict|None}
        """
        credits = []
        # Common separators between role and name
        patterns = [
            r"^(.+?):\s*(.+)$",           # "Role: Name"
            r"^(.+?)\s*[-–—]\s*(.+)$",    # "Role - Name"
            r"^(.+?)\s*/\s*(.+)$",        # "Role / Name" (be careful with this one)
        ]

        for line in text.strip().splitlines():
            line = line.strip()
            if not line:
                continue
            for pattern in patterns:
                match = re.match(pattern, line)
                if match:
                    role_text = match.group(1).strip()
                    name_text = match.group(2).strip()
                    mapping = resolve_credit_role(role_text)
                    credits.append({
                        "role": role_text,
                        "name": name_text,
                        "mapping": mapping,
                    })
                    break

        return credits

    def records_from_credits(
        self,
        credits: list[dict],
        base_record: CreatorRecord,
        include_secondary: bool = True,
    ) -> list[CreatorRecord]:
        """
        Create individual CreatorRecords from parsed credits.
        base_record provides shared fields (source_url, awards, etc.)
        that get copied to each credited person's record.
        """
        records = []

        for credit in credits:
            mapping = credit.get("mapping")
            if not mapping:
                continue

            if mapping["record_type"] == "secondary" and not include_secondary:
                continue

            record = CreatorRecord(
                name=credit["name"],
                source_url=base_record.source_url,
                extraction_source=self.config.key,
                raw_data={"credit_role": credit["role"]},
            )

            # Copy shared fields from base
            record.primary_output = base_record.primary_output
            record.output_subtype = base_record.output_subtype
            record.budget_tier = base_record.budget_tier
            record.awards = list(base_record.awards)  # copy

            # Apply auto-tags from role mapping
            auto_tags = mapping.get("auto_tags", {})
            for tag_field, tags in auto_tags.items():
                if tag_field == "primary_output":
                    record.primary_output = tags
                elif tag_field == "output_subtype":
                    record.output_subtype = tags
                elif isinstance(tags, list):
                    for tag in tags:
                        record.add_tag(tag_field, tag)

            # Secondary records get flagged with lower budget tier
            if mapping["record_type"] == "secondary":
                record.budget_tier = BudgetTier.MID_TIER
                record.raw_data["record_type"] = "secondary_credit"

            records.append(record)

        return records

    # ------------------------------------------------------------------
    # Tag Helpers
    # ------------------------------------------------------------------

    def normalize_and_add_tag(self, record: CreatorRecord, category: str, raw_term: str) -> bool:
        """Normalize a raw term and add it to the record if it resolves."""
        canonical = self.normalizer.normalize(raw_term, category)
        if canonical:
            return record.add_tag(category, canonical)
        return False

    def scan_text_for_tags(self, record: CreatorRecord, text: str, categories: list[str] = None):
        """Scan free text for matching tags across one or more categories."""
        if categories is None:
            categories = [
                "subject_matter", "approach_style", "visual_style",
                "tone", "technical_capability",
            ]
        for category in categories:
            found = self.normalizer.normalize_text(text, category)
            for tag in found:
                record.add_tag(category, tag)

    # ------------------------------------------------------------------
    # Record Helpers
    # ------------------------------------------------------------------

    def make_record(self, **kwargs) -> CreatorRecord:
        """Create a new CreatorRecord with source metadata pre-filled."""
        record = CreatorRecord(
            extraction_source=self.config.key,
            **kwargs,
        )
        return record

    def make_award(self, year: int, category: str, result: str = "winner") -> Award:
        """Create an Award object for this source."""
        return Award(
            festival=self.config.name,
            year=year,
            category=category,
            result=result,
        )

    def infer_budget_tier(self, signals: dict) -> BudgetTier:
        """
        Infer budget tier from available signals.
        signals can include: awards_count, festival_tier, years_active, client_list_size
        """
        if signals.get("festival_tier") == "top":
            return BudgetTier.ESTABLISHED
        if signals.get("awards_count", 0) >= 3:
            return BudgetTier.ESTABLISHED
        if signals.get("is_student") or signals.get("years_active", 99) < 2:
            return BudgetTier.EMERGING
        return BudgetTier.MID_TIER

    # ------------------------------------------------------------------
    # Finalization
    # ------------------------------------------------------------------

    def _finalize_record(self, record: CreatorRecord):
        """Apply final normalization and validation to a record."""
        record.enforce_tag_limits()
        record.updated_at = datetime.utcnow()

        # Set default budget tier from source config if not set
        if record.budget_tier is None:
            tier_str = self.config.default_budget_tier
            if tier_str != "varies":
                record.budget_tier = BudgetTier(tier_str)

        # Set default primary output from source config if not set
        if record.primary_output is None:
            output_str = self.config.default_primary_output
            if output_str != "varies":
                record.primary_output = PrimaryOutput(output_str)
