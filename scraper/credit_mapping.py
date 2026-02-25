# Author: Charley Scholz, JLIT
# Co-authored: Claude Opus 4.6, Claude Code v2.1.38 (coding assistant), Cursor 2.4 (IDE)
#
"""
Creator Database — Credit Role Mapping
Maps credit roles found in festival/project listings to database fields.
From Source Extraction Rules documentation.
"""

from models import PrimaryOutput


# Maps a credit role string to the fields/tags it should populate.
# "primary" means this role warrants its own creator record.
# "secondary" means extract but flag as crew-level (mid-tier pipeline target).

CREDIT_ROLE_MAP = {
    # --- Primary record roles ---
    "director": {
        "record_type": "primary",
        "auto_tags": {},
        "notes": "approach_style inferred from work",
    },
    "director of photography": {
        "record_type": "primary",
        "auto_tags": {"technical_capability": ["cinematography"]},
        "aliases": ["cinematographer", "dp", "dop", "camera operator"],
    },
    "colorist": {
        "record_type": "primary",
        "auto_tags": {"technical_capability": ["color-grading"]},
        "aliases": ["color grading", "color grade", "colour grading", "colourist"],
    },
    "editor": {
        "record_type": "primary",
        "auto_tags": {"technical_capability": ["editing"]},
        "aliases": ["film editor", "video editor", "offline editor", "online editor"],
    },
    "vfx supervisor": {
        "record_type": "primary",
        "auto_tags": {"technical_capability": ["vfx"]},
        "aliases": ["visual effects supervisor", "vfx supe"],
    },
    "vfx artist": {
        "record_type": "primary",
        "auto_tags": {"technical_capability": ["vfx"]},
        "aliases": ["compositor", "compositing artist", "vfx compositor"],
    },
    "animator": {
        "record_type": "primary",
        "auto_tags": {},  # subtype inferred: 2d-animation / 3d / stop-motion
        "aliases": ["lead animator", "character animator", "animation director"],
    },
    "motion designer": {
        "record_type": "primary",
        "auto_tags": {"technical_capability": ["motion-graphics"]},
        "aliases": ["motion graphics designer", "motion artist", "mograph artist"],
    },
    "sfx supervisor": {
        "record_type": "primary",
        "auto_tags": {"technical_capability": ["special-effects"]},
        "aliases": ["practical effects", "special effects supervisor", "sfx",
                    "creature designer", "prosthetics artist"],
    },
    "sound designer": {
        "record_type": "primary",
        "auto_tags": {},
        "notes": "primary_output → AUDIO if this is their main role",
        "aliases": ["sound design", "audio designer", "sound artist"],
    },
    "production designer": {
        "record_type": "primary",
        "auto_tags": {},
        "notes": "Consider new tag: production-design",
        "aliases": ["art director", "set designer"],
    },
    "illustrator": {
        "record_type": "primary",
        "auto_tags": {"primary_output": PrimaryOutput.STILL, "output_subtype": "illustration"},
        "aliases": ["illustration", "concept artist", "character designer"],
    },
    "photographer": {
        "record_type": "primary",
        "auto_tags": {"primary_output": PrimaryOutput.STILL, "output_subtype": "photography"},
        "aliases": ["stills photographer", "unit photographer"],
    },

    # --- Secondary record roles (crew-level, mid-tier pipeline) ---
    "gaffer": {
        "record_type": "secondary",
        "auto_tags": {"technical_capability": ["lighting"]},
        "aliases": ["chief lighting technician", "key grip"],
    },
    "camera operator": {
        "record_type": "secondary",
        "auto_tags": {"technical_capability": ["cinematography"]},
        "aliases": ["camera assistant", "1st ac", "2nd ac", "steadicam operator"],
    },
    "grip": {
        "record_type": "secondary",
        "auto_tags": {},
        "aliases": ["key grip", "best boy grip", "dolly grip"],
    },
}


def resolve_credit_role(role_text: str) -> dict | None:
    """
    Given a credit role string, find the matching role mapping.
    Returns the mapping dict or None.
    """
    role_lower = role_text.strip().lower()

    for canonical_role, mapping in CREDIT_ROLE_MAP.items():
        if role_lower == canonical_role:
            return {"role": canonical_role, **mapping}
        aliases = mapping.get("aliases", [])
        if role_lower in [a.lower() for a in aliases]:
            return {"role": canonical_role, **mapping}

    return None
