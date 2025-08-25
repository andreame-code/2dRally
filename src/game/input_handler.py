import pygame


def get_input():
    """Read player input.

    Returns throttle, brake and steering values in the range ``[0, 1]`` for
    throttle/brake and ``[-1, 1]`` for steering.  Keyboard input is mapped to
    digital values (0 or 1) while an attached joystick provides analogue
    intensities.
    """

    keys = pygame.key.get_pressed()

    throttle = 1.0 if keys[pygame.K_w] or keys[pygame.K_UP] else 0.0
    brake = 1.0 if keys[pygame.K_s] or keys[pygame.K_DOWN] else 0.0
    steering = 0.0
    if keys[pygame.K_a] or keys[pygame.K_LEFT]:
        steering -= 1.0
    if keys[pygame.K_d] or keys[pygame.K_RIGHT]:
        steering += 1.0

    # Joystick support (first joystick only)
    if pygame.joystick.get_count() > 0:
        joystick = pygame.joystick.Joystick(0)
        if not joystick.get_init():
            joystick.init()
        # Axis values are in the range [-1, 1]
        axis_x = joystick.get_axis(0)
        axis_y = joystick.get_axis(1)

        steering = axis_x
        throttle = max(0.0, -axis_y)
        brake = max(0.0, axis_y)

    return float(throttle), float(brake), float(steering)
