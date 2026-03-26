export function createPlayer() {
  return {
    laneOffset: 0,
    speed: 0,
    maxSpeed: 280,
    accel: 120,
    brake: 220,
    drag: 45,
    steerPower: 1.5,
  };
}

export function createAiCar(trackLength, lane = 0, z = 0, speed = 100) {
  return {
    laneOffset: lane,
    z: ((z % trackLength) + trackLength) % trackLength,
    speed,
    widthFactor: 0.32,
    active: true,
  };
}

export function createObstacle(trackLength, lane = 0, z = 0) {
  return {
    laneOffset: lane,
    z: ((z % trackLength) + trackLength) % trackLength,
    widthFactor: 0.24,
    active: true,
  };
}
