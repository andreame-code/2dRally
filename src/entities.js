export function createPlayer() {
  return {
    laneOffset: 0,
    laneVelocity: 0,
    steering: 0,
    speed: 0,
    maxSpeed: 320,
    accel: 140,
    brake: 280,
    drag: 40,
    steerPower: 1.85,
    steerResponse: 4.5,
    steerFriction: 5.2,
    driftGrip: 0.88,
    offRoadGrip: 0.72,
  };
}

export function createAiCar(trackLength, lane = 0, z = 0, speed = 100) {
  const colors = ['#2f4ac7', '#b93f2d', '#3f9b52', '#6f39b4'];
  return {
    laneOffset: lane,
    z: ((z % trackLength) + trackLength) % trackLength,
    speed,
    widthFactor: 0.32,
    color: colors[Math.floor(Math.random() * colors.length)],
    active: true,
  };
}

export function createObstacle(trackLength, lane = 0, z = 0) {
  const types = ['cone', 'rock', 'hole'];
  return {
    laneOffset: lane,
    z: ((z % trackLength) + trackLength) % trackLength,
    widthFactor: 0.24,
    type: types[Math.floor(Math.random() * types.length)],
    active: true,
  };
}
