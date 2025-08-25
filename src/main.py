"""Entry point for the 2dRally prototype.

Il file fornisce un loop di gioco minimale basato su Pygame.
"""

import os
import sys

import pygame


WINDOW_SIZE = (800, 600)
USE_DUMMY_VIDEO = os.environ.get("SDL_VIDEODRIVER") == "dummy"


def main() -> None:
    """Inizializza Pygame e avvia il loop principale."""
    pygame.init()
    screen = pygame.display.set_mode(WINDOW_SIZE)
    pygame.display.set_caption("2dRally")
    clock = pygame.time.Clock()

    running = True
    while running:
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                running = False
            elif event.type == pygame.KEYDOWN and event.key == pygame.K_ESCAPE:
                running = False

        screen.fill((0, 0, 0))
        pygame.display.flip()
        clock.tick(60)

        if USE_DUMMY_VIDEO:
            # Evita loop infinito negli ambienti senza display.
            running = False

    pygame.quit()
    sys.exit()


if __name__ == "__main__":
    main()
