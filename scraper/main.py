# Author: Charley Scholz, JLIT
# Co-authored: Claude Opus 4.6, Claude Code v2.1.38 (coding assistant), Cursor 2.4 (IDE)
#
#!/usr/bin/env python3
"""
Creator Database — Scraper Pipeline
Entry point for running the full extraction pipeline.

Usage:
    # Run all sources at or above HIGH priority
    python main.py

    # Run specific sources
    python main.py --sources ciclope ukmva the_rookies

    # Run with minimum priority threshold
    python main.py --min-priority MEDIUM

    # Dry run (discover only, don't parse)
    python main.py --dry-run

    # Export to specific path
    python main.py --output ./data/creators.json
"""

import argparse
import json
import logging
import sys
from datetime import datetime

from config import SOURCES, ExtractionPriority
from pipeline import Pipeline


def setup_logging(verbose: bool = False):
    level = logging.DEBUG if verbose else logging.INFO
    logging.basicConfig(
        level=level,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )


def list_sources():
    """Print all configured sources with their priorities."""
    print("\nConfigured Sources:")
    print("-" * 80)
    print(f"{'Key':<20} {'Name':<35} {'Priority':<12} {'Cadence':<10}")
    print("-" * 80)

    for s in sorted(SOURCES, key=lambda x: x.priority.value, reverse=True):
        stars = "⭐" * s.priority.value
        print(f"{s.key:<20} {s.name:<35} {stars:<12} {s.cadence:<10}")

    print("-" * 80)
    print(f"Total: {len(SOURCES)} sources\n")


def main():
    parser = argparse.ArgumentParser(
        description="Creator Database Scraper Pipeline",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )

    parser.add_argument(
        "--sources", "-s",
        nargs="+",
        help="Specific source keys to scrape (e.g., ciclope ukmva the_rookies)",
    )
    parser.add_argument(
        "--min-priority", "-p",
        choices=["LOW_MEDIUM", "MEDIUM", "MEDIUM_HIGH", "HIGH", "VERY_HIGH"],
        default="MEDIUM",
        help="Minimum extraction priority to include (default: MEDIUM)",
    )
    parser.add_argument(
        "--output", "-o",
        default=f"./data/creators_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json",
        help="Output JSON file path",
    )
    parser.add_argument(
        "--list-sources", "-l",
        action="store_true",
        help="List all configured sources and exit",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Discover entries only, don't parse (test connectivity)",
    )
    parser.add_argument(
        "--verbose", "-v",
        action="store_true",
        help="Enable debug logging",
    )
    parser.add_argument(
        "--summary",
        action="store_true",
        help="Print summary report after pipeline run",
    )

    args = parser.parse_args()
    setup_logging(args.verbose)

    if args.list_sources:
        list_sources()
        return

    # --- Run Pipeline ---
    pipeline = Pipeline()
    min_priority = ExtractionPriority[args.min_priority]

    if args.dry_run:
        print("\n🔍 DRY RUN — Discovery only, no parsing\n")
        from config import get_source_by_key
        from scrapers import SCRAPER_REGISTRY

        sources = args.sources or [s.key for s in SOURCES if s.priority.value >= min_priority.value]
        for source_key in sources:
            config = get_source_by_key(source_key)
            scraper_class = SCRAPER_REGISTRY.get(source_key)
            if not config or not scraper_class:
                print(f"  ❌ {source_key}: not found")
                continue
            try:
                scraper = scraper_class(config)
                entries = scraper.discover_entries()
                print(f"  ✅ {config.name}: {len(entries)} entries discovered")
            except Exception as e:
                print(f"  ❌ {config.name}: {e}")
        return

    # Full pipeline run
    records = pipeline.run(sources=args.sources, min_priority=min_priority)

    # Export
    pipeline.export_json(args.output)
    print(f"\n✅ Exported {len(records)} records to {args.output}")

    # Summary
    if args.summary or True:  # always show summary
        summary = pipeline.export_summary()
        print("\n" + "=" * 60)
        print("PIPELINE SUMMARY")
        print("=" * 60)
        print(f"  Total records: {summary['total_records']}")
        print(f"\n  By source:")
        for source, count in sorted(summary["by_source"].items(), key=lambda x: -x[1]):
            print(f"    {source}: {count}")
        print(f"\n  By output type:")
        for output, count in sorted(summary["by_primary_output"].items(), key=lambda x: -x[1]):
            print(f"    {output}: {count}")
        print(f"\n  By budget tier:")
        for tier, count in sorted(summary["by_budget_tier"].items()):
            print(f"    {tier}: {count}")
        print()


if __name__ == "__main__":
    main()
