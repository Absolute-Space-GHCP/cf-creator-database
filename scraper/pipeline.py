# Author: Charley Scholz, JLAI
# Co-authored: Claude Opus 4.6, Claude Code v2.1.38 (coding assistant), Cursor 2.4 (IDE)
#
"""
Creator Database — Pipeline Orchestrator
Manages the full scrape lifecycle: run scrapers → deduplicate → quality filter → export.

Implements requirements from Source Extraction Rules:
    - Deduplication: Same person may appear across multiple sources; need matching logic
    - Quality Threshold: Must have at least one award OR 3+ credits
    - Tag Extraction Priority Matrix: Weight by signal reliability
"""

import json
import logging
import os
from collections import defaultdict
from datetime import datetime
from difflib import SequenceMatcher

from config import SOURCES, get_source_by_key, ExtractionPriority
from models import CreatorRecord, BudgetTier
from scrapers import SCRAPER_REGISTRY

logger = logging.getLogger(__name__)


class Pipeline:
    """
    Full extraction pipeline.

    Usage:
        pipeline = Pipeline()
        pipeline.run()                              # Run all sources
        pipeline.run(sources=["ciclope", "ukmva"])  # Run specific sources
        pipeline.export_json("output.json")         # Export results
    """

    # Quality threshold: minimum signal for record creation
    MIN_TAGS_FOR_INCLUSION = 3       # At least 3 tags total across all categories
    MIN_AWARDS_FOR_BYPASS = 1        # 1+ awards bypasses tag minimum
    NAME_SIMILARITY_THRESHOLD = 0.85 # For deduplication fuzzy matching

    def __init__(self):
        self.records: list[CreatorRecord] = []
        self.stats = defaultdict(int)

    # ------------------------------------------------------------------
    # Main Pipeline
    # ------------------------------------------------------------------

    def run(
        self,
        sources: list[str] | None = None,
        min_priority: ExtractionPriority = ExtractionPriority.LOW_MEDIUM,
    ) -> list[CreatorRecord]:
        """
        Execute the full pipeline.

        Args:
            sources: List of source keys to run. If None, runs all above min_priority.
            min_priority: Minimum extraction priority to include (when sources is None).

        Returns:
            List of deduplicated, quality-filtered CreatorRecords.
        """
        logger.info("=" * 60)
        logger.info("CREATOR DATABASE PIPELINE — Starting")
        logger.info("=" * 60)

        # Phase 1: Scrape
        raw_records = self._run_scrapers(sources, min_priority)
        self.stats["raw_records"] = len(raw_records)
        logger.info(f"Phase 1 complete: {len(raw_records)} raw records")

        # Phase 2: Quality filter
        quality_records = self._filter_quality(raw_records)
        self.stats["post_quality_filter"] = len(quality_records)
        logger.info(f"Phase 2 complete: {len(quality_records)} records pass quality threshold")

        # Phase 3: Deduplicate
        deduped_records = self._deduplicate(quality_records)
        self.stats["post_dedup"] = len(deduped_records)
        logger.info(f"Phase 3 complete: {len(deduped_records)} unique records")

        self.records = deduped_records
        self._log_stats()
        return self.records

    # ------------------------------------------------------------------
    # Phase 1: Scraping
    # ------------------------------------------------------------------

    def _run_scrapers(
        self,
        sources: list[str] | None,
        min_priority: ExtractionPriority,
    ) -> list[CreatorRecord]:
        """Run selected scrapers and collect records."""
        all_records = []

        if sources:
            source_configs = [get_source_by_key(k) for k in sources if get_source_by_key(k)]
        else:
            source_configs = [
                s for s in SOURCES if s.priority.value >= min_priority.value
            ]

        for config in source_configs:
            scraper_class = SCRAPER_REGISTRY.get(config.key)
            if not scraper_class:
                logger.warning(f"No scraper registered for source: {config.key}")
                continue

            try:
                scraper = scraper_class(config)
                records = scraper.run()
                all_records.extend(records)
                self.stats[f"source_{config.key}"] = len(records)
            except Exception as e:
                logger.error(f"Scraper failed for {config.key}: {e}")
                self.stats[f"source_{config.key}_error"] = str(e)

        return all_records

    # ------------------------------------------------------------------
    # Phase 2: Quality Filtering
    # ------------------------------------------------------------------

    def _filter_quality(self, records: list[CreatorRecord]) -> list[CreatorRecord]:
        """
        Apply quality threshold from documentation:
        Must have at least one award OR 3+ extracted tags.
        """
        passed = []

        for record in records:
            # Count total meaningful tags
            tag_count = sum(
                len(getattr(record, field, []))
                for field in record.TAG_LIMITS.keys()
            )

            has_awards = len(record.awards) >= self.MIN_AWARDS_FOR_BYPASS
            has_enough_tags = tag_count >= self.MIN_TAGS_FOR_INCLUSION
            has_name = bool(record.name.strip())

            if has_name and (has_awards or has_enough_tags):
                passed.append(record)
            else:
                self.stats["filtered_low_quality"] += 1

        return passed

    # ------------------------------------------------------------------
    # Phase 3: Deduplication
    # ------------------------------------------------------------------

    def _deduplicate(self, records: list[CreatorRecord]) -> list[CreatorRecord]:
        """
        Merge records that appear to be the same creator across multiple sources.

        Strategy:
            1. Exact name match → merge
            2. Fuzzy name match (>85% similarity) + same primary_output → merge
            3. Same portfolio_url → merge

        When merging, we keep the record with more data and union the tags.
        """
        # Group by normalized name for efficient matching
        name_groups: dict[str, list[CreatorRecord]] = defaultdict(list)
        url_index: dict[str, list[CreatorRecord]] = defaultdict(list)

        for record in records:
            norm_name = self._normalize_name(record.name)
            name_groups[norm_name].append(record)

            if record.portfolio_url:
                url_index[record.portfolio_url].append(record)

        merged = []
        seen_ids = set()

        # Merge exact name matches
        for norm_name, group in name_groups.items():
            if not group:
                continue

            # Filter out already-processed records
            group = [r for r in group if r.id not in seen_ids]
            if not group:
                continue

            if len(group) == 1:
                merged.append(group[0])
                seen_ids.add(group[0].id)
            else:
                # Merge all records in this group
                primary = self._select_primary_record(group)
                for secondary in group:
                    if secondary.id != primary.id:
                        self._merge_into(primary, secondary)
                        self.stats["merged_duplicates"] += 1
                merged.append(primary)
                seen_ids.update(r.id for r in group)

        # Check for portfolio URL matches among remaining
        for url, group in url_index.items():
            unmerged = [r for r in group if r.id not in seen_ids]
            if len(unmerged) > 1:
                primary = self._select_primary_record(unmerged)
                for secondary in unmerged:
                    if secondary.id != primary.id:
                        self._merge_into(primary, secondary)
                        self.stats["merged_duplicates"] += 1
                if primary.id not in seen_ids:
                    merged.append(primary)
                    seen_ids.add(primary.id)

        return merged

    def _normalize_name(self, name: str) -> str:
        """Normalize a name for matching: lowercase, strip punctuation, collapse whitespace."""
        import re
        name = name.lower().strip()
        name = re.sub(r"[^\w\s]", "", name)
        name = re.sub(r"\s+", " ", name)
        return name

    def _select_primary_record(self, records: list[CreatorRecord]) -> CreatorRecord:
        """
        Select the best record to be the primary (merged-into) record.
        Prefers: more awards > more tags > more recent > earlier creation.
        """
        def score(r):
            tag_count = sum(len(getattr(r, f, [])) for f in r.TAG_LIMITS.keys())
            return (
                len(r.awards),
                tag_count,
                1 if r.portfolio_url else 0,
                1 if r.contact_email else 0,
            )
        return max(records, key=score)

    def _merge_into(self, primary: CreatorRecord, secondary: CreatorRecord):
        """Merge secondary record's data into primary, preserving richer data."""
        # Union tags
        for field_name in primary.TAG_LIMITS.keys():
            primary_tags = getattr(primary, field_name)
            secondary_tags = getattr(secondary, field_name)
            for tag in secondary_tags:
                if tag not in primary_tags:
                    primary.add_tag(field_name, tag)

        # Fill empty fields from secondary
        if not primary.portfolio_url and secondary.portfolio_url:
            primary.portfolio_url = secondary.portfolio_url
        if not primary.contact_email and secondary.contact_email:
            primary.contact_email = secondary.contact_email
        if not primary.location_city and secondary.location_city:
            primary.location_city = secondary.location_city
        if not primary.location_country and secondary.location_country:
            primary.location_country = secondary.location_country

        # Merge awards (no duplicates)
        existing_awards = {(a.festival, a.year, a.category) for a in primary.awards}
        for award in secondary.awards:
            key = (award.festival, award.year, award.category)
            if key not in existing_awards:
                primary.awards.append(award)

        # Track merge in raw_data
        primary.raw_data.setdefault("merged_from", []).append({
            "source": secondary.extraction_source,
            "original_id": secondary.id,
        })

    # ------------------------------------------------------------------
    # Export
    # ------------------------------------------------------------------

    def export_json(self, filepath: str):
        """Export all records to a JSON file."""
        data = {
            "metadata": {
                "exported_at": datetime.utcnow().isoformat(),
                "total_records": len(self.records),
                "pipeline_stats": dict(self.stats),
            },
            "records": [r.to_dict() for r in self.records],
        }

        os.makedirs(os.path.dirname(filepath) if os.path.dirname(filepath) else ".", exist_ok=True)
        with open(filepath, "w") as f:
            json.dump(data, f, indent=2, default=str)

        logger.info(f"Exported {len(self.records)} records to {filepath}")

    def export_summary(self) -> dict:
        """Generate a summary report of the pipeline run."""
        by_source = defaultdict(int)
        by_output = defaultdict(int)
        by_budget = defaultdict(int)
        by_subtype = defaultdict(int)

        for r in self.records:
            by_source[r.extraction_source] += 1
            by_output[r.primary_output.value if r.primary_output else "unknown"] += 1
            by_budget[r.budget_tier.value if r.budget_tier else "unknown"] += 1
            if r.output_subtype:
                by_subtype[r.output_subtype] += 1

        return {
            "total_records": len(self.records),
            "by_source": dict(by_source),
            "by_primary_output": dict(by_output),
            "by_budget_tier": dict(by_budget),
            "by_output_subtype": dict(by_subtype),
            "pipeline_stats": dict(self.stats),
        }

    # ------------------------------------------------------------------
    # Reporting
    # ------------------------------------------------------------------

    def _log_stats(self):
        """Log pipeline statistics."""
        logger.info("=" * 60)
        logger.info("PIPELINE SUMMARY")
        logger.info("=" * 60)
        logger.info(f"  Raw records scraped:    {self.stats.get('raw_records', 0)}")
        logger.info(f"  After quality filter:   {self.stats.get('post_quality_filter', 0)}")
        logger.info(f"  After deduplication:    {self.stats.get('post_dedup', 0)}")
        logger.info(f"  Filtered (low quality): {self.stats.get('filtered_low_quality', 0)}")
        logger.info(f"  Merged duplicates:      {self.stats.get('merged_duplicates', 0)}")
        logger.info("-" * 60)

        for key, val in sorted(self.stats.items()):
            if key.startswith("source_"):
                source_name = key.replace("source_", "").replace("_error", " (ERROR)")
                logger.info(f"  {source_name}: {val}")
