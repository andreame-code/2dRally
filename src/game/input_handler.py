import pygame


def get_input():
    keys = pygame.key.get_pressed()
    throttle = keys[pygame.K_w] or keys[pygame.K_UP]
    brake = keys[pygame.K_s] or keys[pygame.K_DOWN]
    steering = 0
    if keys[pygame.K_a] or keys[pygame.K_LEFT]:
        steering -= 1
    if keys[pygame.K_d] or keys[pygame.K_RIGHT]:
        steering += 1
    return float(throttle), float(brake), float(steering)
