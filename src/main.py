import os
import pygame
from game.physics import CarPhysics
from game.camera import Camera
from game.input_handler import get_input
from game.track_loader import load_random_track


def init_pygame():
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
        self.track = load_random_track()

    def run(self):
        while self.running:
            for event in pygame.event.get():
                if event.type == pygame.QUIT:
                    self.running = False
            throttle, brake, steering = get_input()
            dt = self.clock.tick(60) / 1000.0
            self.physics.update(throttle, brake, steering, dt)
            self.camera.update(self.physics.position)
            self.screen.fill((0, 0, 0))
            car_rect = pygame.Rect(0, 0, 40, 20)
            car_rect.center = (400, 300)
            pygame.draw.rect(self.screen, (255, 0, 0), car_rect)
            pygame.display.flip()


if __name__ == "__main__":
    Game().run()
