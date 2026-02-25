# Author: Charley Scholz, JLIT
# Co-authored: Claude Opus 4.6, Claude Code v2.1.38 (coding assistant), Cursor 2.4 (IDE)
#
"""
Creator Database — Source Scrapers
Each module implements discover_entries() and parse_entry() for one of the 14 sources.
"""

from scrapers.camerimage import CameramageScraper
from scrapers.annecy import AnnecyScraper
from scrapers.ars_electronica import ArsElectronicaScraper
from scrapers.sxsw_title import SXSWTitleScraper
from scrapers.ciclope import CiclopeScraper
from scrapers.ukmva import UKMVAScraper
from scrapers.promax import PromaxScraper
from scrapers.sitges import SitgesScraper
from scrapers.fantastic_fest import FantasticFestScraper
from scrapers.the_rookies import TheRookiesScraper
from scrapers.shotdeck import ShotDeckScraper
from scrapers.directors_notes import DirectorsNotesScraper
from scrapers.motionographer import MotionographerScraper
from scrapers.stash_media import StashMediaScraper

SCRAPER_REGISTRY = {
    "camerimage": CameramageScraper,
    "annecy": AnnecyScraper,
    "ars_electronica": ArsElectronicaScraper,
    "sxsw_title": SXSWTitleScraper,
    "ciclope": CiclopeScraper,
    "ukmva": UKMVAScraper,
    "promax": PromaxScraper,
    "sitges": SitgesScraper,
    "fantastic_fest": FantasticFestScraper,
    "the_rookies": TheRookiesScraper,
    "shotdeck": ShotDeckScraper,
    "directors_notes": DirectorsNotesScraper,
    "motionographer": MotionographerScraper,
    "stash_media": StashMediaScraper,
}
