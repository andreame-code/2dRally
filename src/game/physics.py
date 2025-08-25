from pygame.math import Vector2


class CarPhysics:
    """Simple car physics model."""

    def __init__(self):
        # Use Vector2 for 2D position and velocity
        self.position = Vector2(0.0, 0.0)
        self.velocity = Vector2(0.0, 0.0)
        self.angle = 0.0

    def update(self, throttle: float, brake: float, steering: float, dt: float) -> None:
        """Update the car's physics state."""
        acceleration = throttle * 5.0 - brake * 10.0

        # Apply acceleration in the direction the car is facing
        direction = Vector2(1, 0).rotate_rad(self.angle)
        self.velocity += direction * acceleration * dt

        # Progressive deceleration (friction) on both axes
        self.velocity *= 0.98

        self.angle += steering * dt
        self.position += self.velocity * dt
