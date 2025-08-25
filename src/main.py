import os
import sys
import pygame
from game.physics import CarPhysics
from game.camera import Camera
from game.input_handler import get_input
from game.track_loader import load_random_track, parse_track


def init_pygame():
    """Initialize Pygame, supporting headless environments.

    The SDL ``dummy`` video driver is enabled automatically when no display is
    detected (e.g. in CI) or when the ``PYGAME_HEADLESS`` environment variable is
    set to ``1``.  Setting ``PYGAME_HEADLESS`` to ``0`` forces the normal video
    driver even if no display is present.
    """

    headless_env = os.getenv("PYGAME_HEADLESS")
    if headless_env == "1" or (
        headless_env is None and os.environ.get("DISPLAY") is None and sys.platform != "win32"
    ):
        os.environ.setdefault("SDL_VIDEODRIVER", "dummy")
    pygame.init()
    return pygame.display.set_mode((800, 600))


class Game:
    def __init__(self):
        self.screen = init_pygame()
        self.clock = pygame.time.Clock()
        self.running = True
        self.physics = CarPhysics()
        self.camera = Camera(offset=(400, 300))
        track_path = load_random_track()
        self.track = parse_track(track_path) if track_path else []

    def run(self):
        while self.running:
            for event in pygame.event.get():
                if event.type == pygame.QUIT:
                    self.running = False
                elif event.type == pygame.KEYDOWN and event.key == pygame.K_ESCAPE:
                    self.running = False
            throttle, brake, steering = get_input()
            dt = self.clock.tick(60) / 1000.0
            self.physics.update(throttle, brake, steering, dt)
            self.camera.update(self.physics.position)
            self.screen.fill((0, 0, 0))

            for rect in self.track:
                draw_rect = rect.move(-self.camera.position[0], -self.camera.position[1])
                pygame.draw.rect(self.screen, (100, 100, 100), draw_rect)

            car_rect = pygame.Rect(0, 0, 40, 20)
            draw_pos = (
                int(self.physics.position.x - self.camera.position[0]),
                int(self.physics.position.y - self.camera.position[1]),
            )
            car_rect.center = draw_pos
            pygame.draw.rect(self.screen, (255, 0, 0), car_rect)
            pygame.display.flip()


if __name__ == "__main__":
    Game().run()
