import random
from pathlib import Path

import pygame

ASSET_DIR = Path(__file__).resolve().parent.parent.parent / "assets" / "tracks"


def load_random_track() -> Path:
    tracks = list(ASSET_DIR.glob("*.txt"))
    return random.choice(tracks) if tracks else None


def parse_track(track_path: Path, tile_size: int = 40):
    """Convert a track file into drawable ``pygame.Rect`` objects.

    The track file is interpreted as a simple ASCII map where a ``#`` character
    denotes a piece of track. Each character is mapped to a tile of
    ``tile_size`` pixels squared. The function returns a list of
    ``pygame.Rect`` instances positioned in world coordinates.
    """

    rects = []
    with track_path.open() as fh:
        for y, line in enumerate(fh):
            for x, ch in enumerate(line.rstrip("\n")):
                if ch == "#":
                    rects.append(pygame.Rect(x * tile_size, y * tile_size, tile_size, tile_size))

    return rects
