# Author: Charley Scholz, JLIT
# Co-authored: Claude Opus 4.6, Claude Code v2.1.38 (coding assistant), Cursor 2.4 (IDE)
#
"""
Creator Database — Synonym Normalization Engine
Implements the complete normalization map from Section 3.
Any scraped text is resolved to canonical tags before storage.
"""

import re
from typing import Optional


class TagNormalizer:
    """
    Resolves variant terms to canonical tags.
    Usage:
        normalizer = TagNormalizer()
        canonical = normalizer.normalize("verité", "approach_style")  # → "documentary"
        canonical = normalizer.normalize("drone", "technical_capability")  # → "aerial"
    """

    def __init__(self):
        self._maps = self._build_maps()
        self._reverse = self._build_reverse_index()

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def normalize(self, term: str, category: Optional[str] = None) -> Optional[str]:
        """
        Resolve a term to its canonical tag.
        If category is provided, search only that category.
        If None, search all categories (first match wins).
        Returns None if no match found.
        """
        term_lower = term.strip().lower()

        if category:
            cat_map = self._reverse.get(category, {})
            return cat_map.get(term_lower)

        # Search all categories
        for cat, cat_map in self._reverse.items():
            if term_lower in cat_map:
                return cat_map[term_lower]
        return None

    def normalize_text(self, text: str, category: str) -> list[str]:
        """
        Scan free text for any matching terms in a given category.
        Returns list of unique canonical tags found.
        """
        text_lower = text.lower()
        found = set()
        cat_map = self._reverse.get(category, {})

        # Sort by length descending to match longer phrases first
        for variant in sorted(cat_map.keys(), key=len, reverse=True):
            if variant in text_lower:
                found.add(cat_map[variant])

        return list(found)

    def get_canonical_tags(self, category: str) -> list[str]:
        """Return all canonical tags for a category."""
        return list(self._maps.get(category, {}).keys())

    def is_valid_tag(self, tag: str, category: str) -> bool:
        """Check if a tag is canonical for a given category."""
        return tag in self._maps.get(category, {})

    # ------------------------------------------------------------------
    # Map Construction
    # ------------------------------------------------------------------

    def _build_maps(self) -> dict[str, dict[str, list[str]]]:
        """Build the complete normalization map: {category: {canonical: [variants]}}"""
        return {
            "subject_matter": self._subject_matter_map(),
            "subject_subcategory": self._subject_subcategory_map(),
            "approach_style": self._approach_style_map(),
            "visual_style": self._visual_style_map(),
            "tone": self._tone_map(),
            "technical_capability": self._technical_capability_map(),
            "platform_usage": self._platform_usage_map(),
            "illustration_style": self._illustration_style_map(),
        }

    def _build_reverse_index(self) -> dict[str, dict[str, str]]:
        """Build reverse lookup: {category: {variant_lowercase: canonical}}"""
        reverse = {}
        for category, tag_map in self._maps.items():
            reverse[category] = {}
            for canonical, variants in tag_map.items():
                # The canonical tag itself is always a match
                reverse[category][canonical.lower()] = canonical
                for v in variants:
                    reverse[category][v.lower()] = canonical
        return reverse

    # ------------------------------------------------------------------
    # Subject Matter
    # ------------------------------------------------------------------

    @staticmethod
    def _subject_matter_map():
        return {
            "food": ["culinary", "tabletop food", "food photography", "f&b", "food and beverage",
                      "gastronomy", "cuisine", "dining", "restaurant", "edible", "recipe",
                      "cooking", "chef", "kitchen"],
            "beverage": ["drinks", "cocktails", "spirits", "wine", "beer", "coffee", "tea",
                         "liquid pour", "beverage photography", "mixology"],
            "automotive": ["cars", "vehicles", "auto", "transportation", "automotive photography",
                           "car photography", "motorcycles", "trucks", "ev", "electric vehicle", "driving"],
            "fashion": ["apparel", "clothing", "garments", "style", "runway", "couture", "streetwear",
                        "ready-to-wear", "fashion photography", "lookbook"],
            "beauty": ["cosmetics", "makeup", "skincare", "haircare", "grooming", "beauty photography",
                       "cosmetic", "personal care", "fragrance", "perfume"],
            "lifestyle": ["everyday life", "slice of life", "real life", "authentic moments", "candid",
                          "lifestyle photography", "lived-in", "domestic"],
            "portrait": ["portraiture", "headshot", "people photography", "faces", "character study",
                         "environmental portrait"],
            "product": ["still life", "product photography", "packshot", "e-commerce", "hero shot",
                        "tabletop", "object photography"],
            "sports": ["athletics", "fitness", "athletic", "sporting", "action sports", "extreme sports",
                       "sports photography", "workout", "training", "gym"],
            "travel": ["destination", "tourism", "wanderlust", "travel photography", "location",
                       "adventure travel", "hospitality"],
            "tech": ["technology", "gadgets", "electronics", "devices", "hardware", "software",
                     "digital", "innovation", "startup"],
            "medical": ["healthcare", "health", "pharma", "pharmaceutical", "clinical", "hospital",
                        "wellness", "biotech", "life sciences"],
            "architecture": ["buildings", "structures", "interiors", "exteriors", "real estate",
                             "architectural photography", "spaces", "built environment"],
            "nature": ["landscape", "outdoor", "wilderness", "wildlife", "animals", "flora", "fauna",
                       "environment", "natural", "botanical"],
            "children": ["kids", "youth", "family", "pediatric", "juvenile", "young people",
                         "childhood", "parenting"],
            "seniors": ["elderly", "aging", "mature", "older adults", "retirement", "50+", "60+",
                        "silver generation"],
            "corporate": ["business", "b2b", "enterprise", "professional", "institutional",
                          "executive", "workplace", "office"],
            "entertainment": ["celebrity", "talent", "film", "tv", "gaming", "esports", "streaming",
                              "influencer", "creator economy"],
            "luxury": ["premium", "high-end", "prestige", "affluent", "aspirational luxury",
                       "wealth", "exclusive"],
        }

    # ------------------------------------------------------------------
    # Subject Subcategories
    # ------------------------------------------------------------------

    @staticmethod
    def _subject_subcategory_map():
        return {
            # Under entertainment
            "music": ["concert", "live music", "band", "musician", "rock", "hip-hop", "tour",
                       "backstage", "festival", "recording studio", "album art", "artist portrait"],
            "film-tv": ["movie", "television", "on-set", "behind the scenes", "promotional",
                        "key art", "episodic"],
            "gaming": ["esports", "video games", "streaming", "twitch", "gameplay", "gaming lifestyle"],
            "celebrity": ["talent", "red carpet", "publicity", "press", "editorial celebrity"],
            # Under sports
            "team-sports": ["football", "basketball", "soccer", "baseball", "hockey", "rugby"],
            "individual-sports": ["tennis", "golf", "boxing", "mma", "track and field", "swimming"],
            "action-sports": ["skateboarding", "surfing", "snowboarding", "bmx", "motocross", "extreme"],
            "fitness": ["gym", "training", "workout", "wellness", "athletic lifestyle", "crossfit"],
            # Under food
            "restaurant": ["dining", "chef", "kitchen", "plating", "hospitality", "menu"],
            "packaged-goods": ["cpg", "grocery", "packaging", "product food", "e-commerce food"],
            "recipe": ["cooking", "ingredients", "process", "editorial food", "cookbook"],
            # beverage is both a subject_matter and a subcategory under food
            # Under automotive
            "luxury-automotive": ["exotic", "supercar", "premium auto", "prestige vehicles"],
            "commercial-automotive": ["trucks", "fleet", "industrial vehicles", "dealership"],
            "motorsport": ["racing", "f1", "nascar", "rally", "track"],
            "lifestyle-automotive": ["road trip", "adventure driving", "car culture", "enthusiast"],
            # Under fashion
            "high-fashion": ["couture", "runway", "editorial fashion", "designer", "avant-garde fashion"],
            "commercial-fashion": ["catalog", "e-commerce fashion", "lookbook", "retail"],
            "streetwear": ["urban fashion", "sneakers", "street style", "youth fashion"],
            "accessories": ["jewelry", "watches", "bags", "eyewear", "shoes"],
        }

    # ------------------------------------------------------------------
    # Approach / Style
    # ------------------------------------------------------------------

    @staticmethod
    def _approach_style_map():
        return {
            "documentary": ["docu-style", "verité", "verite", "observational", "fly-on-the-wall",
                            "unscripted", "real", "journalistic", "reportage", "photojournalism"],
            "narrative": ["storytelling", "story-driven", "cinematic narrative", "scripted",
                          "story", "plot-driven"],
            "conceptual": ["idea-driven", "symbolic", "metaphorical", "abstract concept",
                           "high-concept", "artistic"],
            "editorial": ["magazine style", "editorial photography", "publication-ready", "editorial look"],
            "commercial": ["advertising", "ad", "branded", "promotional", "marketing", "campaign"],
            "experimental": ["avant-garde", "unconventional", "innovative", "boundary-pushing",
                             "artistic experimentation"],
            "humor": ["comedy", "comedic", "funny", "humorous", "witty", "satirical", "parody",
                      "tongue-in-cheek", "playful"],
            "dramatic": ["drama", "intense", "emotional intensity", "serious", "weighty", "gravitas"],
            "romantic": ["love", "intimacy", "tender", "soft romantic", "sensual", "affectionate",
                         "warm emotional"],
            "fantasy": ["fantastical", "magical", "otherworldly", "surreal fantasy", "mythical",
                        "fairy tale"],
            "sci-fi": ["science fiction", "futuristic", "speculative", "dystopian", "space",
                       "cyberpunk", "tech-noir"],
            "horror": ["scary", "dark horror", "thriller", "suspense", "macabre", "gothic", "unsettling"],
            "action": ["dynamic action", "high-energy", "kinetic", "adrenaline", "explosive", "fast-paced"],
            "slice-of-life": ["everyday", "mundane beauty", "quotidian", "ordinary moments", "simple moments"],
        }

    # ------------------------------------------------------------------
    # Visual Style
    # ------------------------------------------------------------------

    @staticmethod
    def _visual_style_map():
        return {
            "black-and-white": ["b&w", "bw", "monochrome", "monochromatic", "grayscale", "noir"],
            "high-contrast": ["contrasty", "bold contrast", "dramatic lighting", "chiaroscuro", "shadow-heavy"],
            "soft-light": ["diffused", "gentle light", "even lighting", "flattering light", "beauty lighting"],
            "natural-light": ["available light", "daylight", "window light", "ambient", "practical lighting"],
            "cinematic": ["filmic", "movie-like", "cinema-quality", "theatrical", "widescreen aesthetic"],
            "gritty": ["raw", "unpolished", "textured", "rough", "lo-fi aesthetic", "imperfect"],
            "polished": ["clean", "refined", "high-production", "slick", "glossy", "premium finish"],
            "retro": ["vintage", "throwback", "nostalgic", "period", "classic aesthetic", "old-school"],
            "minimalist": ["minimal", "simple", "clean lines", "negative space", "sparse", "restrained"],
            "maximalist": ["busy", "layered", "dense", "rich visual", "ornate", "baroque"],
            "warm-tones": ["warm palette", "golden", "amber", "orange-red spectrum", "warm color grade"],
            "cool-tones": ["cool palette", "blue", "teal", "cold", "clinical color", "desaturated cool"],
            "saturated": ["vivid", "vibrant colors", "punchy", "colorful", "bold color", "high saturation"],
            "desaturated": ["muted", "washed out", "faded", "low saturation", "subtle color", "pastel"],
        }

    # ------------------------------------------------------------------
    # Tone / Emotional Register
    # ------------------------------------------------------------------

    @staticmethod
    def _tone_map():
        return {
            "aspirational": ["inspirational", "elevated", "premium feel", "luxury tone", "desirable"],
            "approachable": ["friendly", "accessible", "warm and inviting", "relatable", "down-to-earth"],
            "edgy": ["provocative", "bold", "boundary-pushing", "rebellious", "subversive", "counterculture"],
            "wholesome": ["heartwarming", "feel-good", "family-friendly", "innocent", "pure", "uplifting"],
            "sophisticated": ["refined", "cultured", "intellectual", "discerning", "elevated taste"],
            "playful": ["fun", "whimsical", "lighthearted", "cheerful", "energetic joy", "bouncy"],
            "serious": ["grave", "weighty", "sober", "earnest", "no-nonsense", "substantial"],
            "quirky": ["offbeat", "eccentric", "idiosyncratic", "weird in a good way", "unconventional charm"],
            "nostalgic": ["wistful", "memory-laden", "sentimental", "reminiscent", "longing"],
            "urgent": ["immediate", "pressing", "time-sensitive feel", "now", "breaking", "vital"],
        }

    # ------------------------------------------------------------------
    # Technical Capability
    # ------------------------------------------------------------------

    @staticmethod
    def _technical_capability_map():
        return {
            "aerial": ["drone", "overhead", "bird's eye", "helicopter shot", "top-down"],
            "underwater": ["aquatic", "submerged", "pool", "ocean photography", "wet"],
            "stop-motion": ["frame-by-frame", "puppet animation", "object animation"],
            "motion-graphics": ["mograph", "animated graphics", "kinetic typography", "motion design"],
            "vfx": ["visual effects", "cgi", "compositing", "post-production effects", "digital effects"],
            "3d": ["three-dimensional", "rendered", "cg", "computer generated"],
            "2d-animation": ["traditional animation", "cel animation", "hand-drawn", "frame animation"],
            "time-lapse": ["hyperlapse", "accelerated time", "sped-up", "compressed time"],
            "slow-motion": ["slow-mo", "high-speed", "overcranked", "ramping"],
            "macro": ["close-up extreme", "micro", "detail photography", "magnified"],
            "motion-control": ["robotic camera", "programmed movement", "repeatable moves", "moco"],
            # Extended from credit role mapping
            "cinematography": ["director of photography", "dp", "camera"],
            "color-grading": ["colorist", "color grade", "color correction", "color science"],
            "editing": ["editor", "edit", "assembly", "cut"],
            "special-effects": ["sfx", "practical effects", "prosthetics", "creature design", "miniatures"],
            "lighting": ["gaffer", "grip", "key light", "lighting design"],
        }

    # ------------------------------------------------------------------
    # Platform / Usage
    # ------------------------------------------------------------------

    @staticmethod
    def _platform_usage_map():
        return {
            "broadcast": ["tv", "television", "network", "cable", "streaming platform", "ott"],
            "social": ["social media", "instagram", "tiktok", "youtube", "reels", "shorts",
                       "stories", "feed content"],
            "digital": ["online", "web", "banner", "display", "programmatic", "digital advertising"],
            "print": ["magazine", "newspaper", "ooh", "out-of-home", "billboard", "poster"],
            "experiential": ["event", "activation", "installation", "immersive", "live experience", "pop-up"],
            "ugc-style": ["user-generated", "lo-fi social", "authentic social", "creator-style",
                          "native content"],
        }

    # ------------------------------------------------------------------
    # Illustration Style
    # ------------------------------------------------------------------

    @staticmethod
    def _illustration_style_map():
        return {
            "line-art": ["line drawing", "outline", "linework", "contour", "pen and ink"],
            "cartoon": ["cartoony", "animated style", "toon", "comic style"],
            "painterly": ["painted", "brushwork", "fine art style", "impressionistic", "expressive"],
            "vector": ["flat", "geometric", "digital illustration", "clean vector", "graphic illustration"],
            "realistic": ["photorealistic", "hyperrealistic", "lifelike", "true-to-life"],
            "collage": ["cut-and-paste", "mixed media", "assemblage", "composite"],
            "vintage-illustration": ["retro illustration", "classic illustration", "mid-century",
                                     "throwback style"],
            "graffiti": ["street art", "urban art", "spray paint", "mural style", "tagging"],
        }
