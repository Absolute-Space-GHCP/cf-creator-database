# Author: Charley Scholz, JLIT
# Co-authored: Claude Opus 4.6, Claude Code v2.1.38 (coding assistant), Cursor 2.4 (IDE)
#
"""
Creator Database — Data Models
Maps directly to the three-tier schema (Hard Fields, Extractable Tags, AI-Derived Attributes).
"""

from dataclasses import dataclass, field
from datetime import datetime, date
from enum import Enum
from typing import Optional
from uuid import uuid4


# --- Enums ---

class PrimaryOutput(Enum):
    STILL = "STILL"
    VIDEO = "VIDEO"
    AUDIO = "AUDIO"


class BudgetTier(Enum):
    EMERGING = "emerging"
    MID_TIER = "mid-tier"
    ESTABLISHED = "established"


class ContactMethod(Enum):
    EMAIL = "email"
    DM = "DM"
    REP = "rep"
    FORM = "form"


# Output subtypes by primary output
STILL_SUBTYPES = {"photography", "illustration", "ai_imagery", "art"}
VIDEO_SUBTYPES = {"film_narrative", "commercial", "social_platform", "documentary", "music_video", "animation"}
AUDIO_SUBTYPES = {"podcast_spoken_word", "music_composition", "sound_design"}


# --- Tier 3: AI-Derived Attributes ---

@dataclass
class ColorAnalysis:
    dominant_color: str = ""
    secondary_color: str = ""
    palette_mood: str = ""       # warm | cool | neutral | mixed
    saturation_level: str = ""   # saturated | muted | desaturated


@dataclass
class CompositionAnalysis:
    typical_framing: str = ""    # tight_closeup | closeup | medium | wide | extreme_wide
    composition_style: str = ""  # symmetrical | rule_of_thirds | dynamic | centered | negative_space


@dataclass
class LightingAnalysis:
    quality: str = ""     # hard | soft | mixed
    direction: str = ""   # front | side | back | overhead | ambient
    mood: str = ""        # bright | moody | dramatic | natural | studio


@dataclass
class ComparableRef:
    reference_type: str = ""   # luminary | work | scene | brand_campaign
    reference_name: str = ""
    reference_aspect: str = ""
    confidence: float = 0.0


@dataclass
class Award:
    festival: str = ""
    year: int = 0
    category: str = ""
    result: str = ""  # nominee | winner | official_selection


# --- Main Creator Record ---

@dataclass
class CreatorRecord:
    """
    Complete creator record spanning all three schema tiers.
    """

    # --- Tier 1: Hard Fields ---
    id: str = field(default_factory=lambda: str(uuid4()))
    name: str = ""
    primary_output: Optional[PrimaryOutput] = None
    secondary_output: Optional[PrimaryOutput] = None
    output_subtype: str = ""
    budget_tier: Optional[BudgetTier] = None
    location_city: str = ""
    location_country: str = ""
    remote_available: Optional[bool] = None
    last_active: Optional[date] = None
    portfolio_url: str = ""
    contact_email: str = ""
    contact_method: Optional[ContactMethod] = None
    rep_name: str = ""
    rep_contact: str = ""
    source_url: str = ""
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)

    # --- Tier 2: Extractable Tags ---
    subject_matter: list[str] = field(default_factory=list)        # max 10
    subject_subcategory: list[str] = field(default_factory=list)   # max 5
    approach_style: list[str] = field(default_factory=list)        # max 5
    visual_style: list[str] = field(default_factory=list)          # max 8
    tone: list[str] = field(default_factory=list)                  # max 5
    technical_capability: list[str] = field(default_factory=list)  # max 10
    platform_usage: list[str] = field(default_factory=list)        # max 5
    industry_vertical: list[str] = field(default_factory=list)     # max 10
    illustration_style: list[str] = field(default_factory=list)    # max 5

    # --- Tier 3: AI-Derived (populated later) ---
    color_analysis: Optional[ColorAnalysis] = None
    composition_analysis: Optional[CompositionAnalysis] = None
    lighting_analysis: Optional[LightingAnalysis] = None
    comparable_to: list[ComparableRef] = field(default_factory=list)
    analysis_confidence: float = 0.0
    images_analyzed: int = 0
    last_analyzed: Optional[datetime] = None

    # --- Metadata ---
    awards: list[Award] = field(default_factory=list)
    extraction_source: str = ""     # which scraper produced this
    extraction_confidence: float = 0.0
    raw_data: dict = field(default_factory=dict)  # preserve original scraped data

    # --- Tag Limits ---
    TAG_LIMITS = {
        "subject_matter": 10,
        "subject_subcategory": 5,
        "approach_style": 5,
        "visual_style": 8,
        "tone": 5,
        "technical_capability": 10,
        "platform_usage": 5,
        "industry_vertical": 10,
        "illustration_style": 5,
    }

    def enforce_tag_limits(self):
        """Truncate tag arrays to schema-defined maximums."""
        for tag_field, limit in self.TAG_LIMITS.items():
            current = getattr(self, tag_field)
            if len(current) > limit:
                setattr(self, tag_field, current[:limit])

    def add_tag(self, field_name: str, tag: str) -> bool:
        """Add a tag if within limits. Returns False if at capacity."""
        if field_name not in self.TAG_LIMITS:
            return False
        current = getattr(self, field_name)
        if tag in current:
            return True  # already present
        if len(current) >= self.TAG_LIMITS[field_name]:
            return False
        current.append(tag)
        return True

    def to_dict(self) -> dict:
        """Serialize to dictionary for JSON/database storage."""
        d = {}
        for k, v in self.__dict__.items():
            if k == "TAG_LIMITS":
                continue
            if isinstance(v, Enum):
                d[k] = v.value
            elif isinstance(v, (datetime, date)):
                d[k] = v.isoformat()
            elif isinstance(v, list) and v and hasattr(v[0], '__dict__'):
                d[k] = [item.__dict__ for item in v]
            elif hasattr(v, '__dict__') and v is not None:
                d[k] = v.__dict__
            else:
                d[k] = v
        return d
