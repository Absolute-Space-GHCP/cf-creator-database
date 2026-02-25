# Author: Charley Scholz, JLIT
# Co-authored: Claude Opus 4.6, Claude Code v2.1.38 (coding assistant), Cursor 2.4 (IDE)
#
"""
Creator Database — Source Configuration
All 14 scraping sources with URLs, priorities, cadence, and extraction metadata.
"""

from dataclasses import dataclass
from enum import Enum


class SourceCategory(Enum):
    FESTIVAL = "festival"
    PORTFOLIO_PLATFORM = "portfolio_platform"
    REFERENCE_SITE = "reference_site"
    EDITORIAL = "editorial"


class ExtractionPriority(Enum):
    VERY_HIGH = 5
    HIGH = 4
    MEDIUM_HIGH = 3
    MEDIUM = 2
    LOW_MEDIUM = 1


@dataclass
class SourceConfig:
    name: str
    key: str                          # internal identifier
    url: str
    category: SourceCategory
    priority: ExtractionPriority
    cadence: str                      # annual | quarterly | monthly
    default_primary_output: str       # VIDEO | STILL | varies
    default_budget_tier: str          # emerging | mid-tier | established | varies
    notes: str = ""
    requires_subscription: bool = False


SOURCES: list[SourceConfig] = [

    # ================================================================
    # CATEGORY 1: FESTIVAL & AWARD CIRCUIT
    # ================================================================

    # --- Holy Trinity of Craft Festivals ---

    SourceConfig(
        name="Camerimage",
        key="camerimage",
        url="https://camerimage.pl",
        category=SourceCategory.FESTIVAL,
        priority=ExtractionPriority.HIGH,
        cadence="annual",
        default_primary_output="VIDEO",
        default_budget_tier="established",
        notes="Cinematography only. Golden Frog = top honor. "
              "Secondary extraction: trace credits to find gaffers, colorists, camera ops.",
    ),

    SourceConfig(
        name="Annecy International Animation Film Festival",
        key="annecy",
        url="https://www.annecy.org",
        category=SourceCategory.FESTIVAL,
        priority=ExtractionPriority.HIGH,
        cadence="annual",
        default_primary_output="VIDEO",
        default_budget_tier="varies",
        notes="Animation authority. Cristal = top prize. "
              "Scrape Mifa (market section) for emerging studios seeking work.",
    ),

    SourceConfig(
        name="Ars Electronica",
        key="ars_electronica",
        url="https://ars.electronica.art",
        category=SourceCategory.FESTIVAL,
        priority=ExtractionPriority.MEDIUM_HIGH,
        cadence="annual",
        default_primary_output="varies",
        default_budget_tier="emerging",
        notes="Creative tech, interactive art, projection mapping, AI art. "
              "Surfaces talent for experiential/activation work.",
    ),

    # --- Editors & Post-Production ---

    SourceConfig(
        name="SXSW Title Design Awards",
        key="sxsw_title",
        url="https://www.sxsw.com/awards/title-design-competition/",
        category=SourceCategory.FESTIVAL,
        priority=ExtractionPriority.HIGH,
        cadence="annual",
        default_primary_output="VIDEO",
        default_budget_tier="mid-tier",
        notes="Title sequences = motion graphics + typography. "
              "Credits list animators, designers, compositors individually.",
    ),

    SourceConfig(
        name="Ciclope Festival",
        key="ciclope",
        url="https://www.ciclopefestival.com",
        category=SourceCategory.FESTIVAL,
        priority=ExtractionPriority.VERY_HIGH,
        cadence="annual",
        default_primary_output="VIDEO",
        default_budget_tier="mid-tier",
        notes="GOLD SOURCE. Separates by craft role (Best Colorist ≠ Best Director). "
              "Closest alignment to agency workflow.",
    ),

    SourceConfig(
        name="UKMVA (UK Music Video Awards)",
        key="ukmva",
        url="https://www.ukmva.com",
        category=SourceCategory.FESTIVAL,
        priority=ExtractionPriority.HIGH,
        cadence="annual",
        default_primary_output="VIDEO",
        default_budget_tier="mid-tier",
        notes="Music video craft. Often more technically rigorous than VMAs. "
              "Production company credits reveal rosters of mid-tier directors.",
    ),

    SourceConfig(
        name="Promax Awards",
        key="promax",
        url="https://www.promax.org",
        category=SourceCategory.FESTIVAL,
        priority=ExtractionPriority.MEDIUM,
        cadence="annual",
        default_primary_output="VIDEO",
        default_budget_tier="mid-tier",
        notes="Broadcast design and motion graphics. Network branding, show packaging, promo design.",
    ),

    # --- Niche Genre ---

    SourceConfig(
        name="Sitges Film Festival",
        key="sitges",
        url="https://sitgesfilmfestival.com",
        category=SourceCategory.FESTIVAL,
        priority=ExtractionPriority.MEDIUM,
        cadence="annual",
        default_primary_output="VIDEO",
        default_budget_tier="mid-tier",
        notes="Fantasy/horror. Practical effects artists (creature design, prosthetics, miniatures) "
              "are rare and in demand for high-concept commercials.",
    ),

    SourceConfig(
        name="Fantastic Fest",
        key="fantastic_fest",
        url="https://fantasticfest.com",
        category=SourceCategory.FESTIVAL,
        priority=ExtractionPriority.MEDIUM,
        cadence="annual",
        default_primary_output="VIDEO",
        default_budget_tier="mid-tier",
        notes="Practical effects, genre-bending, cult cinema. Similar to Sitges.",
    ),

    # ================================================================
    # CATEGORY 2: DEEP-WEB PLATFORMS & PORTFOLIOS
    # ================================================================

    SourceConfig(
        name="The Rookies",
        key="the_rookies",
        url="https://www.therookies.co",
        category=SourceCategory.PORTFOLIO_PLATFORM,
        priority=ExtractionPriority.VERY_HIGH,
        cadence="quarterly",
        default_primary_output="varies",
        default_budget_tier="emerging",
        notes="Farm system. Student/emerging VFX, game dev, 3D. "
              "Today's Rookie of the Year = next year's mid-tier hire.",
    ),

    SourceConfig(
        name="ShotDeck",
        key="shotdeck",
        url="https://shotdeck.com",
        category=SourceCategory.REFERENCE_SITE,
        priority=ExtractionPriority.LOW_MEDIUM,
        cadence="quarterly",
        default_primary_output="VIDEO",
        default_budget_tier="established",
        notes="HACK: scrape credits of featured shots to find working DPs. "
              "Cross-reference IMDb. Useful for building comparable chains.",
        requires_subscription=True,
    ),

    SourceConfig(
        name="Director's Notes",
        key="directors_notes",
        url="https://directorsnotes.com",
        category=SourceCategory.EDITORIAL,
        priority=ExtractionPriority.MEDIUM,
        cadence="quarterly",
        default_primary_output="VIDEO",
        default_budget_tier="varies",
        notes="Interview content provides LANGUAGE that maps to taxonomy. "
              "'I wanted a handheld, vérité feel' → documentary + gritty + natural-light.",
    ),

    SourceConfig(
        name="Motionographer",
        key="motionographer",
        url="https://motionographer.com",
        category=SourceCategory.EDITORIAL,
        priority=ExtractionPriority.VERY_HIGH,
        cadence="monthly",
        default_primary_output="VIDEO",
        default_budget_tier="mid-tier",
        notes="Industry standard for motion design. Features + studio profiles + jobs. "
              "Jobs section reveals studios actively hiring = healthy mid-tier shops.",
    ),

    SourceConfig(
        name="Stash Media",
        key="stash_media",
        url="https://www.stashmedia.tv",
        category=SourceCategory.EDITORIAL,
        priority=ExtractionPriority.MEDIUM,
        cadence="quarterly",
        default_primary_output="VIDEO",
        default_budget_tier="mid-tier",
        notes="Permanent collection of motion design & VFX. "
              "Full archive requires subscription; scrape public previews.",
        requires_subscription=True,
    ),
]


def get_source_by_key(key: str) -> SourceConfig | None:
    """Look up a source config by its internal key."""
    for s in SOURCES:
        if s.key == key:
            return s
    return None


def get_sources_by_priority(min_priority: ExtractionPriority = ExtractionPriority.MEDIUM) -> list[SourceConfig]:
    """Return sources at or above the given priority level."""
    return [s for s in SOURCES if s.priority.value >= min_priority.value]


def get_sources_by_category(category: SourceCategory) -> list[SourceConfig]:
    """Return all sources in a given category."""
    return [s for s in SOURCES if s.category == category]
