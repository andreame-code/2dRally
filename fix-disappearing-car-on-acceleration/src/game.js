import { Input } from './input.js';
import { createObstacle, createPlayer } from './entities.js';
import { createTrack, segmentIndexAtZ, wrapZ, getPaceNotes } from './track.js';
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
    this.stageTime = 0;
    this.stageLength = 5000;
    this.bestTime = 0;
    this.laps = 0;
    this.avgSpeed = 0;
    this.runTime = 0;
    this.cameraZ = 0;
    this.cameraX = 0;
    this.player.laneOffset = 0;
    this.player.laneVelocity = 0;
    this.player.steering = 0;
    this.player.speed = 0;
    this.player.gear = 1;
    this.player.rpm = 0;
    this.player.damage = 0;
    this.offRoad = false;
    this.flashTimer = 0;
    this.controlLoss = 0;
    this.shake = 0;
    this.obstacleSpawnTimer = 0;
    this.paceNotes = [];
    this.dustParticles = [];

    this.obstacles = [
      createObstacle(this.track.length, -0.55, 800),
      createObstacle(this.track.length, 0.5, 1500),
      createObstacle(this.track.length, -0.1, 2200),
      createObstacle(this.track.length, 0.28, 3000),
      createObstacle(this.track.length, -0.4, 3800),
      createObstacle(this.track.length, 0.35, 4500),
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
    this.updateGameplay(dt);
    this.handleCollisions();
    this.updateEffects(dt);
    this.updateDust(dt);
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

    // Gear & RPM simulation
    const speedRatio = p.speed / p.maxSpeed;
    p.gear = speedRatio < 0.15 ? 1 : speedRatio < 0.3 ? 2 : speedRatio < 0.5 ? 3 : speedRatio < 0.72 ? 4 : speedRatio < 0.9 ? 5 : 6;
    const gearRanges = [0, 0.15, 0.3, 0.5, 0.72, 0.9, 1.0];
    const gearLow = gearRanges[p.gear - 1];
    const gearHigh = gearRanges[p.gear];
    p.rpm = (speedRatio - gearLow) / (gearHigh - gearLow);
    p.rpm = Math.max(0, Math.min(1, p.rpm));

    const seg = this.track.segments[segmentIndexAtZ(this.track, this.cameraZ)];
    const curveForce = seg.curve * (0.8 + p.speed / p.maxSpeed * 2.1);
    p.laneVelocity -= curveForce * dt * 130;

    const steerTarget = (steerRight ? 1 : 0) - (steerLeft ? 1 : 0);
    p.steering += (steerTarget - p.steering) * Math.min(1, p.steerResponse * dt);

    const speedFactor = 0.3 + p.speed / p.maxSpeed;
    p.laneVelocity += p.steering * p.steerPower * dt * speedFactor;

    // Dirt/gravel physics: more sliding, less grip
    const highSpeed = Math.max(0, (p.speed - p.maxSpeed * 0.55) / p.maxSpeed);
    const driftFactor = highSpeed * (Math.abs(p.steering) + Math.abs(seg.curve) * 200);
    p.laneVelocity *= 1 - Math.min(0.28, driftFactor * 0.05);
    p.laneVelocity *= 1 - Math.min(0.98, p.steerFriction * dt);

    // Integrate lateral movement with delta-time so lane drift stays frame-rate independent.
    p.laneOffset += p.laneVelocity * dt;
    this.offRoad = Math.abs(p.laneOffset) > 0.95;
    const grip = this.offRoad ? p.offRoadGrip : p.driftGrip;
    p.laneVelocity *= grip;

    if (this.offRoad) {
      p.speed -= 160 * dt;
      p.laneVelocity += (Math.random() - 0.5) * 0.003;
      p.laneOffset = Math.max(-1.35, Math.min(1.35, p.laneOffset));
    }

    // Keep the car recoverable even after strong drifts/impacts.
    p.laneOffset = Math.max(-1.35, Math.min(1.35, p.laneOffset));

    if (this.controlLoss > 0) {
      this.controlLoss -= dt;
      p.laneVelocity += Math.sin(performance.now() * 0.03) * 0.001;
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

  updateGameplay(dt) {
    this.runTime += dt;
    this.stageTime += dt;
    this.avgSpeed += (this.player.speed - this.avgSpeed) * Math.min(1, dt * 0.7);

    // Pace notes
    this.paceNotes = getPaceNotes(this.track, this.cameraZ, 120);

    this.obstacleSpawnTimer -= dt;
    if (this.obstacleSpawnTimer <= 0) {
      this.spawnObstacle();
      this.obstacleSpawnTimer = 1.8 + Math.random() * 2.0;
    }

    // Stage completion
    if (this.distance >= this.stageLength) {
      if (this.bestTime === 0 || this.stageTime < this.bestTime) {
        this.bestTime = this.stageTime;
      }
      this.laps += 1;
      this.state = 'gameover';
    }
  }

  updateEffects(dt) {
    this.flashTimer = Math.max(0, this.flashTimer - dt);
    this.shake = Math.max(0, this.shake - dt * 2.4);
  }

  updateDust(dt) {
    // Spawn dust when driving fast or drifting
    if (this.player.speed > 40 && this.state === 'running') {
      const intensity = Math.min(3, Math.floor(this.player.speed / 80));
      for (let i = 0; i < intensity; i++) {
        this.dustParticles.push({
          x: (Math.random() - 0.5) * 60,
          y: 0,
          vx: (Math.random() - 0.5) * 30,
          vy: -15 - Math.random() * 25,
          life: 0.4 + Math.random() * 0.5,
          maxLife: 0.4 + Math.random() * 0.5,
          size: 3 + Math.random() * 5,
        });
      }
    }

    // Extra dust when off-road
    if (this.offRoad && this.player.speed > 20) {
      for (let i = 0; i < 2; i++) {
        this.dustParticles.push({
          x: (Math.random() - 0.5) * 80,
          y: 0,
          vx: (Math.random() - 0.5) * 50,
          vy: -10 - Math.random() * 20,
          life: 0.5 + Math.random() * 0.6,
          maxLife: 0.5 + Math.random() * 0.6,
          size: 5 + Math.random() * 8,
        });
      }
    }

    // Update particles
    for (let i = this.dustParticles.length - 1; i >= 0; i--) {
      const p = this.dustParticles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) {
        this.dustParticles.splice(i, 1);
      }
    }

    if (this.dustParticles.length > 80) {
      this.dustParticles.splice(0, this.dustParticles.length - 80);
    }
  }

  spawnObstacle() {
    const spawnZ = wrapZ(this.track, this.cameraZ + 900 + Math.random() * 1200);
    const lanes = [-0.58, -0.35, -0.1, 0.12, 0.37, 0.62];
    const lane = lanes[Math.floor(Math.random() * lanes.length)];
    this.obstacles.push(createObstacle(this.track.length, lane, spawnZ));
    if (this.obstacles.length > 18) this.obstacles.shift();
  }

  handleCollisions() {
    const hitWindow = 55;
    let hit = false;

    for (const obstacle of this.obstacles) {
      const dz = (obstacle.z - this.cameraZ + this.track.length) % this.track.length;
      if (dz < hitWindow && Math.abs(obstacle.laneOffset - this.player.laneOffset) < 0.24) {
        obstacle.z = wrapZ(this.track, obstacle.z + 1400 + Math.random() * 800);
        const impact = obstacle.type === 'puddle' ? 0.65 : obstacle.type === 'rock' ? 0.4 : 0.5;
        this.player.speed *= impact;
        this.player.laneVelocity += (Math.random() - 0.5) * 0.05;
        this.controlLoss = Math.max(this.controlLoss, obstacle.type === 'puddle' ? 0.6 : 0.8);
        this.shake = obstacle.type === 'puddle' ? 0.2 : 0.5;
        this.flashTimer = 0.15;
        this.player.damage = Math.min(1, this.player.damage + (obstacle.type === 'rock' ? 0.18 : 0.08));
        hit = true;
      }
    }

    if (hit && this.player.speed < 18) {
      this.state = 'gameover';
    }

    if (this.player.damage >= 1) {
      this.state = 'gameover';
    }
  }

  render() {
    renderWorld(this.ctx, this, this.canvas);
    drawHud(this.ctx, this, this.canvas);
  }
}
