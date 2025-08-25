class Camera:
    """Third-person camera following a target with offset."""

    def __init__(self, offset=(0, 0)):
        self.offset = list(offset)
        self.position = [0.0, 0.0]

    def update(self, target_pos):
        self.position[0] = target_pos[0] - self.offset[0]
        self.position[1] = target_pos[1] - self.offset[1]
        return self.position
