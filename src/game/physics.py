class CarPhysics:
    """Simple car physics model."""

    def __init__(self):
        self.position = [0.0, 0.0]
        self.velocity = [0.0, 0.0]
        self.angle = 0.0

    def update(self, throttle: float, brake: float, steering: float, dt: float) -> None:
        """Update the car's physics state."""
        acceleration = throttle * 5.0 - brake * 10.0
        self.velocity[0] += acceleration * dt
        self.velocity[0] *= 0.98  # basic friction
        self.angle += steering * dt
        self.position[0] += self.velocity[0] * dt
