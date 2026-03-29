export function createPlayer() {
  return {
    laneOffset: 0,
    laneVelocity: 0,
    steering: 0,
    speed: 0,
    maxSpeed: 300,
    accel: 120,
    brake: 260,
    drag: 35,
    steerPower: 2.1,
    steerResponse: 3.8,
    steerFriction: 4.8,
    driftGrip: 0.82,
    offRoadGrip: 0.62,
    gear: 1,
    rpm: 0,
    damage: 0,
  };
}

export function createObstacle(trackLength, lane = 0, z = 0) {
  const types = ['rock', 'log', 'puddle'];
  return {
    laneOffset: lane,
    z: ((z % trackLength) + trackLength) % trackLength,
    widthFactor: 0.26,
    type: types[Math.floor(Math.random() * types.length)],
    active: true,
  };
}
