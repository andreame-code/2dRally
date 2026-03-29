import { Input } from './input.js';
import { createAiCar, createObstacle, createPlayer } from './entities.js';
import { createTrack, segmentIndexAtZ, wrapZ } from './track.js';
import { renderWorld } from './render.js';
import { drawHud } from './ui.js';

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.input = new Input();

    this.track = createTrack();
    this.player = createPlayer();

    this.reset();
  }

  reset() {
    this.state = 'start';
    this.startLock = true;
    this.distance = 0;
    this.score = 0;
    this.avgSpeed = 0;
    this.runTime = 0;
    this.cameraZ = 0;
    this.cameraX = 0;
    this.player.laneOffset = 0;
    this.player.laneVelocity = 0;
    this.player.steering = 0;
    this.player.speed = 0;
    this.offRoad = false;
    this.flashTimer = 0;
    this.controlLoss = 0;
    this.shake = 0;
    this.obstacleSpawnTimer = 0;
    this.aiSpawnTimer = 0;

    this.obstacles = [
      createObstacle(this.track.length, -0.55, 1000),
      createObstacle(this.track.length, 0.5, 1750),
      createObstacle(this.track.length, -0.1, 2450),
      createObstacle(this.track.length, 0.28, 3250),
    ];

    this.aiCars = [
      createAiCar(this.track.length, -0.25, 1300, 105),
      createAiCar(this.track.length, 0.25, 2100, 120),
      createAiCar(this.track.length, 0.05, 2900, 96),
    ];
  }

  update(dt) {
    if (this.state === 'start') {
      if (!this.input.pressed('Enter', 'Space')) this.startLock = false;
      if (!this.startLock && this.input.pressed('Enter', 'Space')) this.state = 'running';
      return;
    }

    if (this.state === 'gameover') {
      if (this.input.pressed('KeyR', 'Enter', 'Space')) this.reset();
      return;
    }

    this.updatePlayer(dt);
    this.updateCamera(dt);
    this.updateTraffic(dt);
    this.updateGameplay(dt);
    this.handleCollisions();
    this.updateEffects(dt);
  }

  updatePlayer(dt) {
    const p = this.player;
    const accelerating = this.input.pressed('ArrowUp', 'KeyW');
    const braking = this.input.pressed('ArrowDown', 'KeyS');
    const steerLeft = this.input.pressed('ArrowLeft', 'KeyA');
    const steerRight = this.input.pressed('ArrowRight', 'KeyD');

    if (accelerating) p.speed += p.accel * dt;
    if (braking) p.speed -= p.brake * dt;

    p.speed -= p.drag * dt;
    p.speed = Math.max(0, Math.min(p.maxSpeed, p.speed));

    const seg = this.track.segments[segmentIndexAtZ(this.track, this.cameraZ)];
    const curveForce = seg.curve * (0.8 + p.speed / p.maxSpeed * 2.1);
    p.laneVelocity -= curveForce * dt * 115;

    const steerTarget = (steerRight ? 1 : 0) - (steerLeft ? 1 : 0);
    p.steering += (steerTarget - p.steering) * Math.min(1, p.steerResponse * dt);

    const speedFactor = 0.3 + p.speed / p.maxSpeed;
    p.laneVelocity += p.steering * p.steerPower * dt * speedFactor;

    const highSpeed = Math.max(0, (p.speed - p.maxSpeed * 0.62) / p.maxSpeed);
    const driftFactor = highSpeed * (Math.abs(p.steering) + Math.abs(seg.curve) * 180);
    p.laneVelocity *= 1 - Math.min(0.23, driftFactor * 0.04);
    p.laneVelocity *= 1 - Math.min(0.98, p.steerFriction * dt);

    // NOTE: position integration without dt is frame-rate dependent,
    // but the entire velocity/friction model is tuned for per-frame steps.
    // A full fix would require retuning all physics constants.
    p.laneOffset += p.laneVelocity;
    this.offRoad = Math.abs(p.laneOffset) > 0.95;
    const grip = this.offRoad ? p.offRoadGrip : p.driftGrip;
    p.laneVelocity *= grip;

    if (this.offRoad) {
      p.speed -= 140 * dt;
      p.laneVelocity += (Math.random() - 0.5) * 0.002;
      p.laneOffset = Math.max(-1.25, Math.min(1.25, p.laneOffset));
    }

    if (this.controlLoss > 0) {
      this.controlLoss -= dt;
      p.laneVelocity += Math.sin(performance.now() * 0.03) * 0.0008;
    }
  }

  updateCamera(dt) {
    this.cameraZ = wrapZ(this.track, this.cameraZ + this.player.speed * dt * 1.2);
    this.distance += this.player.speed * dt;

    const seg = this.track.segments[segmentIndexAtZ(this.track, this.cameraZ)];
    this.cameraX += seg.curve * this.player.speed * dt * 0.5;
    this.cameraX += this.player.laneOffset * 0.018;
    this.cameraX *= 0.96;
  }

  updateTraffic(dt) {
    this.aiCars.forEach((car) => {
      car.z = wrapZ(this.track, car.z + car.speed * dt);
      if (Math.random() < 0.004) {
        car.laneOffset += (Math.random() - 0.5) * 0.15;
        car.laneOffset = Math.max(-0.75, Math.min(0.75, car.laneOffset));
      }
    });
  }

  updateGameplay(dt) {
    this.runTime += dt;
    this.avgSpeed += (this.player.speed - this.avgSpeed) * Math.min(1, dt * 0.7);
    this.score = Math.floor(this.distance + this.avgSpeed * 4.2);

    this.obstacleSpawnTimer -= dt;
    if (this.obstacleSpawnTimer <= 0) {
      this.spawnObstacle();
      this.obstacleSpawnTimer = 1.2 + Math.random() * 1.5;
    }

    this.aiSpawnTimer -= dt;
    if (this.aiSpawnTimer <= 0 && this.aiCars.length < 7) {
      this.spawnAiCar();
      this.aiSpawnTimer = 2.8 + Math.random() * 2.2;
    }
  }

  updateEffects(dt) {
    this.flashTimer = Math.max(0, this.flashTimer - dt);
    this.shake = Math.max(0, this.shake - dt * 2.4);
  }

  spawnObstacle() {
    const spawnZ = wrapZ(this.track, this.cameraZ + 900 + Math.random() * 1200);
    const lanes = [-0.58, -0.35, -0.1, 0.12, 0.37, 0.62];
    const lane = lanes[Math.floor(Math.random() * lanes.length)];
    this.obstacles.push(createObstacle(this.track.length, lane, spawnZ));
    if (this.obstacles.length > 15) this.obstacles.shift();
  }

  spawnAiCar() {
    const spawnZ = wrapZ(this.track, this.cameraZ + 1200 + Math.random() * 1700);
    const lane = -0.5 + Math.random();
    const speed = 90 + Math.random() * 65;
    this.aiCars.push(createAiCar(this.track.length, lane, spawnZ, speed));
    if (this.aiCars.length > 7) this.aiCars.shift();
  }

  handleCollisions() {
    const hitWindow = 55;
    let hit = false;

    for (const obstacle of this.obstacles) {
      const dz = (obstacle.z - this.cameraZ + this.track.length) % this.track.length;
      if (dz < hitWindow && Math.abs(obstacle.laneOffset - this.player.laneOffset) < 0.24) {
        obstacle.z = wrapZ(this.track, obstacle.z + 1400 + Math.random() * 800);
        const impact = obstacle.type === 'hole' ? 0.5 : obstacle.type === 'rock' ? 0.42 : 0.56;
        this.player.speed *= impact;
        this.player.laneVelocity += (Math.random() - 0.5) * 0.05;
        this.controlLoss = Math.max(this.controlLoss, obstacle.type === 'hole' ? 0.85 : 0.7);
        this.shake = 0.45;
        this.flashTimer = 0.2;
        hit = true;
      }
    }

    for (const ai of this.aiCars) {
      const dz = (ai.z - this.cameraZ + this.track.length) % this.track.length;
      if (dz < hitWindow && Math.abs(ai.laneOffset - this.player.laneOffset) < 0.26) {
        ai.z = wrapZ(this.track, ai.z + 800 + Math.random() * 600);
        this.player.speed *= 0.7;
        this.player.laneVelocity += (Math.random() - 0.5) * 0.04;
        this.controlLoss = Math.max(this.controlLoss, 0.45);
        this.shake = 0.3;
        this.flashTimer = 0.12;
        hit = true;
      }
    }

    if (hit && this.player.speed < 22) {
      this.state = 'gameover';
    }

    if (this.distance >= 5000) {
      this.state = 'gameover';
    }
  }

  render() {
    renderWorld(this.ctx, this, this.canvas);
    drawHud(this.ctx, this, this.canvas);
  }
}
