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
    this.distance = 0;
    this.cameraZ = 0;
    this.cameraX = 0;
    this.player.laneOffset = 0;
    this.player.speed = 0;
    this.offRoad = false;
    this.flashTimer = 0;

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
      if (this.input.pressed('Enter', 'Space')) this.state = 'running';
      return;
    }

    if (this.state === 'gameover') {
      if (this.input.pressed('KeyR', 'Enter', 'Space')) this.reset();
      return;
    }

    this.updatePlayer(dt);
    this.updateCamera(dt);
    this.updateTraffic(dt);
    this.handleCollisions();
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
    this.player.laneOffset -= curveForce * dt * 140;

    const steerStrength = p.steerPower * (0.25 + p.speed / p.maxSpeed * 0.95);
    if (steerLeft) p.laneOffset -= steerStrength * dt;
    if (steerRight) p.laneOffset += steerStrength * dt;

    this.offRoad = Math.abs(p.laneOffset) > 0.95;
    if (this.offRoad) {
      p.speed -= 130 * dt;
      p.laneOffset = Math.max(-1.25, Math.min(1.25, p.laneOffset));
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

  handleCollisions() {
    const hitWindow = 55;
    let hit = false;

    for (const obstacle of this.obstacles) {
      const dz = (obstacle.z - this.cameraZ + this.track.length) % this.track.length;
      if (dz < hitWindow && Math.abs(obstacle.laneOffset - this.player.laneOffset) < 0.24) {
        obstacle.z = wrapZ(this.track, obstacle.z + 1400 + Math.random() * 800);
        this.player.speed *= 0.42;
        hit = true;
      }
    }

    for (const ai of this.aiCars) {
      const dz = (ai.z - this.cameraZ + this.track.length) % this.track.length;
      if (dz < hitWindow && Math.abs(ai.laneOffset - this.player.laneOffset) < 0.26) {
        this.player.speed *= 0.68;
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
