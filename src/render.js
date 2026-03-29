import { segmentIndexAtZ } from './track.js';

const FOV = 100;
// World Y units are in "road widths", so the camera height must stay low.
// A very large value flattens every segment to the screen bottom and the road disappears.
const CAMERA_HEIGHT = 1.15;
const DRAW_DISTANCE = 220;
const ROAD_BOTTOM_HALF_WIDTH_RATIO = 0.34;
const ROAD_TOP_HALF_WIDTH_RATIO = 0.085;

function projectPoint(worldX, worldY, worldZ, cameraX, cameraY, cameraZ, width, height, roadHalfWidth) {
  const dz = worldZ - cameraZ;
  const dx = worldX - cameraX;
  const dy = worldY - cameraY;
  const scale = FOV / dz;

  return {
    screenX: Math.round((1 + scale * dx) * width * 0.5),
    screenY: Math.round((1 - scale * dy) * height * 0.5),
    roadW: Math.round(scale * roadHalfWidth * width * 0.5),
    scale,
    dz,
  };
}

function drawQuad(ctx, x1, y1, w1, x2, y2, w2, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x1 - w1, y1);
  ctx.lineTo(x2 - w2, y2);
  ctx.lineTo(x2 + w2, y2);
  ctx.lineTo(x1 + w1, y1);
  ctx.closePath();
  ctx.fill();
}

export function renderWorld(ctx, game, canvas) {
  const { width, height } = canvas;
  const horizon = Math.floor(height * 0.35);
  const shakeX = (Math.random() - 0.5) * 18 * game.shake;
  const shakeY = (Math.random() - 0.5) * 14 * game.shake;

  ctx.save();
  ctx.translate(shakeX, shakeY);

  drawBackground(ctx, game, width, height, horizon);
  drawRoad(ctx, game, width, height);
  drawSpeedLines(ctx, game, width, height, horizon);
  renderPlayerCar(ctx, game, width, height);

  if (game.flashTimer > 0) {
    ctx.fillStyle = `rgba(255,120,95,${Math.min(0.32, game.flashTimer * 1.8)})`;
    ctx.fillRect(0, 0, width, height);
  }

  ctx.restore();
}

function drawBackground(ctx, game, width, height, horizon) {
  const sky = ctx.createLinearGradient(0, 0, 0, horizon);
  sky.addColorStop(0, '#9ad8ff');
  sky.addColorStop(1, '#68b6ff');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, horizon);

  const farMountains = '#5c7ca7';
  for (let i = 0; i < 6; i += 1) {
    const x = (((i * 270 - game.distance * 0.03) % (width + 450)) + (width + 450)) % (width + 450) - 220;
    ctx.fillStyle = farMountains;
    ctx.beginPath();
    ctx.moveTo(x, horizon);
    ctx.lineTo(x + 130, horizon - 90);
    ctx.lineTo(x + 300, horizon);
    ctx.closePath();
    ctx.fill();
  }

  const hillColor = 'rgba(53,109,52,0.75)';
  for (let i = 0; i < 8; i += 1) {
    const hillX = (((i * 180 - game.distance * 0.07) % (width + 320)) + (width + 320)) % (width + 320) - 160;
    ctx.fillStyle = hillColor;
    ctx.beginPath();
    ctx.ellipse(hillX, horizon + 20, 170, 55, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  const grass = ctx.createLinearGradient(0, horizon, 0, height);
  grass.addColorStop(0, '#5dbb53');
  grass.addColorStop(1, '#3e8a37');
  ctx.fillStyle = grass;
  ctx.fillRect(0, horizon, width, height - horizon);

  for (let i = 0; i < 200; i += 1) {
    const x = (i * 131 + Math.floor(game.distance * 0.6)) % width;
    const y = horizon + ((i * 71) % (height - horizon));
    const alpha = 0.05 + ((i % 7) / 7) * 0.09;
    ctx.fillStyle = `rgba(20,65,19,${alpha})`;
    ctx.fillRect(x, y, 3, 2);
  }
}

function drawRoad(ctx, game, width, height) {
  const { track, cameraZ } = game;
  const horizon = Math.floor(height * 0.35);
  const baseIndex = segmentIndexAtZ(track, cameraZ);
  const baseSegmentZ = Math.floor(cameraZ / track.segmentLength) * track.segmentLength;
  const roadSpan = Math.max(1, height - horizon);
  const dashedOffset = Math.floor(game.distance * 0.08);

  let x = 0;
  let dx = 0;
  const projected = [];

  for (let n = 0; n < DRAW_DISTANCE; n += 1) {
    const segIndex = (baseIndex + n) % track.segments.length;
    const segment = track.segments[segIndex];

    const z2 = baseSegmentZ + (n + 1) * track.segmentLength;

    x += dx;
    dx += segment.curve;
    const p2 = projectPoint(x, 0, z2, game.cameraX, CAMERA_HEIGHT, cameraZ, width, height, track.roadHalfWidth);

    if (p2.dz <= 1) continue;

    const clampedY = Math.max(horizon, Math.min(height + 2, p2.screenY));
    const depth = Math.min(1, Math.max(0, (clampedY - horizon) / roadSpan));
    const targetHalfWidth = width * (ROAD_TOP_HALF_WIDTH_RATIO + (ROAD_BOTTOM_HALF_WIDTH_RATIO - ROAD_TOP_HALF_WIDTH_RATIO) * depth);
    const curveShift = (p2.screenX - width * 0.5) * 1.25;

    projected.push({
      y: clampedY,
      x: width * 0.5 + curveShift,
      roadW: targetHalfWidth,
      segIndex,
      segment,
      n,
    });
  }

  for (let i = projected.length - 1; i > 0; i -= 1) {
    const far = projected[i];
    const near = projected[i - 1];
    const topY = Math.max(horizon, far.y);
    const bottomY = Math.min(height + 2, near.y);

    if (bottomY <= topY) continue;

    const sideGrass = near.segment.colorIndex ? '#4ea748' : '#45953f';
    const sideShade = near.segment.colorIndex ? 'rgba(36,82,31,0.2)' : 'rgba(24,68,21,0.2)';
    const shoulder = near.segment.colorIndex ? '#d0d3d7' : '#bf5151';
    const asphalt = near.segment.colorIndex ? '#656a71' : '#5d636a';

    ctx.fillStyle = sideGrass;
    ctx.fillRect(0, topY, width, bottomY - topY);

    ctx.fillStyle = sideShade;
    const patternOffset = ((near.n * 37) + dashedOffset * 5) % 90;
    ctx.fillRect((patternOffset + 16) % width, topY, 48, bottomY - topY);
    ctx.fillRect((patternOffset + width * 0.52) % width, topY, 48, bottomY - topY);

    drawQuad(ctx, far.x, topY, far.roadW * 1.14, near.x, bottomY, near.roadW * 1.14, shoulder);
    drawQuad(ctx, far.x, topY, far.roadW * 1.04, near.x, bottomY, near.roadW * 1.04, '#f8f8f8');
    drawQuad(ctx, far.x, topY, far.roadW, near.x, bottomY, near.roadW, asphalt);

    if (((far.n + dashedOffset) % 14) < 7) {
      drawQuad(ctx, far.x, topY, far.roadW * 0.045, near.x, bottomY, near.roadW * 0.045, '#f5f5f5');
    }

    renderRoadObjects(ctx, game, near.segIndex, {
      screenX: near.x,
      screenY: bottomY,
      roadW: near.roadW,
    });
  }
}

function renderRoadObjects(ctx, game, segIndex, nearProj) {
  const drawObstacle = (obj) => {
    const x = nearProj.screenX + nearProj.roadW * obj.laneOffset;
    const w = Math.max(7, nearProj.roadW * obj.widthFactor);
    const h = Math.max(10, nearProj.roadW * 0.36);

    if (obj.type === 'cone') {
      ctx.fillStyle = '#f57c21';
      ctx.beginPath();
      ctx.moveTo(x, nearProj.screenY - h);
      ctx.lineTo(x - w * 0.45, nearProj.screenY);
      ctx.lineTo(x + w * 0.45, nearProj.screenY);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#fff5d6';
      ctx.fillRect(x - w * 0.15, nearProj.screenY - h * 0.5, w * 0.3, h * 0.12);
    } else if (obj.type === 'hole') {
      ctx.fillStyle = 'rgba(22,19,19,0.82)';
      ctx.beginPath();
      ctx.ellipse(x, nearProj.screenY - 2, w * 0.55, h * 0.2, 0, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = '#705135';
      ctx.beginPath();
      ctx.ellipse(x, nearProj.screenY - h * 0.35, w * 0.5, h * 0.35, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#917258';
      ctx.fillRect(x - w * 0.24, nearProj.screenY - h * 0.55, w * 0.48, h * 0.2);
    }
  };

  const drawAiCar = (car) => {
    const x = nearProj.screenX + nearProj.roadW * car.laneOffset;
    const w = Math.max(9, nearProj.roadW * car.widthFactor);
    const h = Math.max(13, nearProj.roadW * 0.55);

    ctx.fillStyle = car.color;
    ctx.fillRect(x - w * 0.5, nearProj.screenY - h, w, h * 0.72);
    ctx.fillStyle = '#99b7ff';
    ctx.fillRect(x - w * 0.28, nearProj.screenY - h * 0.9, w * 0.56, h * 0.2);
    ctx.fillStyle = '#0e0f12';
    ctx.fillRect(x - w * 0.52, nearProj.screenY - h * 0.2, w * 0.22, h * 0.2);
    ctx.fillRect(x + w * 0.3, nearProj.screenY - h * 0.2, w * 0.22, h * 0.2);
  };

  game.obstacles.forEach((o) => {
    if (o.active && Math.floor(o.z / game.track.segmentLength) % game.track.segments.length === segIndex) {
      drawObstacle(o);
    }
  });

  game.aiCars.forEach((c) => {
    if (c.active && Math.floor(c.z / game.track.segmentLength) % game.track.segments.length === segIndex) {
      drawAiCar(c);
    }
  });
}

function drawSpeedLines(ctx, game, width, height, horizon) {
  const amount = Math.floor(game.player.speed / 18);
  if (amount < 3) return;

  ctx.strokeStyle = 'rgba(255,255,255,0.16)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 0; i < amount; i += 1) {
    const x = (i * 53 + game.distance * 4.2) % width;
    const y = horizon + ((i * 29) % (height - horizon));
    ctx.moveTo(x, y);
    ctx.lineTo(x, y + 8 + amount * 0.15);
  }
  ctx.stroke();
}

function renderPlayerCar(ctx, game, width, height) {
  const baseX = width * 0.5 + game.player.laneOffset * width * 0.22;
  const baseY = height * 0.86;
  const wobble = Math.sin(game.distance * 0.08) * Math.min(8, game.player.speed * 0.035);
  const tilt = -game.player.steering * 0.12;
  const wheelSpin = game.distance * 0.18;

  ctx.save();
  ctx.translate(baseX + wobble, baseY);
  ctx.rotate(tilt);

  ctx.fillStyle = 'rgba(0,0,0,0.24)';
  ctx.beginPath();
  ctx.ellipse(0, -1, 48, 12, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#17328f';
  ctx.fillRect(-36, -36, 72, 36);
  ctx.fillStyle = '#2f5bf0';
  ctx.fillRect(-30, -51, 60, 18);
  ctx.fillStyle = '#9fd3ff';
  ctx.fillRect(-20, -48, 40, 11);

  ctx.fillStyle = '#f4d35e';
  ctx.fillRect(-23, -25, 15, 8);
  ctx.fillRect(8, -25, 15, 8);

  drawWheel(ctx, -39, -12, wheelSpin);
  drawWheel(ctx, 25, -12, wheelSpin);

  ctx.restore();
}

function drawWheel(ctx, x, y, spin) {
  ctx.fillStyle = '#121316';
  ctx.fillRect(x, y, 16, 17);
  ctx.strokeStyle = '#6b6e77';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x + 8, y + 2);
  ctx.lineTo(x + 8 + Math.sin(spin) * 4, y + 15);
  ctx.stroke();
}
