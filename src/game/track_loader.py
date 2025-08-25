import os
import random
from pathlib import Path

ASSET_DIR = Path(__file__).resolve().parent.parent.parent / "assets" / "tracks"


def load_random_track() -> Path:
    tracks = list(ASSET_DIR.glob("*.txt"))
    return random.choice(tracks) if tracks else None
