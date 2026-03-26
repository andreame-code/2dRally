import { segmentIndexAtZ, wrapZ } from './track.js';

const FOV = 100;
const CAMERA_HEIGHT = 900;
const DRAW_DISTANCE = 220;

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
  const horizon = Math.floor(height * 0.36);

  // Sky + background hills
  ctx.fillStyle = '#7ec4ff';
  ctx.fillRect(0, 0, width, horizon);
  ctx.fillStyle = '#95d86a';
  ctx.fillRect(0, horizon, width, height - horizon);
  ctx.fillStyle = 'rgba(60, 110, 55, 0.55)';
  for (let i = 0; i < 8; i += 1) {
    const hillX = ((i * 170 - game.distance * 0.05) % (width + 300)) - 150;
    ctx.beginPath();
    ctx.ellipse(hillX, horizon + 20, 160, 55, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  const { track, cameraZ } = game;
  let baseIndex = segmentIndexAtZ(track, cameraZ);
  let x = 0;
  let dx = 0;
  let maxY = height;

  for (let n = 0; n < DRAW_DISTANCE; n += 1) {
    const segIndex = (baseIndex + n) % track.segments.length;
    const segment = track.segments[segIndex];

    const z1 = wrapZ(track, Math.floor(cameraZ / track.segmentLength) * track.segmentLength + n * track.segmentLength);
    const z2 = wrapZ(track, z1 + track.segmentLength);

    const p1 = projectPoint(x, 0, z1, game.cameraX, CAMERA_HEIGHT, cameraZ, width, height, track.roadHalfWidth);
    x += dx;
    dx += segment.curve;
    const p2 = projectPoint(x, 0, z2, game.cameraX, CAMERA_HEIGHT, cameraZ, width, height, track.roadHalfWidth);

    if (p1.dz <= 1 || p2.dz <= 1 || p2.screenY >= maxY) continue;

    const grass = segment.colorIndex ? '#4aa14c' : '#3b8f40';
    const rumble = segment.colorIndex ? '#ffefef' : '#d23131';
    const road = segment.colorIndex ? '#626262' : '#5a5a5a';

    ctx.fillStyle = grass;
    ctx.fillRect(0, p2.screenY, width, p1.screenY - p2.screenY);

    drawQuad(ctx, p1.screenX, p1.screenY, p1.roadW * 1.16, p2.screenX, p2.screenY, p2.roadW * 1.16, rumble);
    drawQuad(ctx, p1.screenX, p1.screenY, p1.roadW, p2.screenX, p2.screenY, p2.roadW, road);

    if (n % 3 === 0) {
      drawQuad(ctx, p1.screenX, p1.screenY, p1.roadW * 0.05, p2.screenX, p2.screenY, p2.roadW * 0.05, '#e6e6e6');
    }

    renderRoadObjects(ctx, game, segIndex, p2, p1, width);
    maxY = p2.screenY;
  }

  renderPlayerCar(ctx, game, width, height);
}

function renderRoadObjects(ctx, game, segIndex, nearProj, farProj) {
  const drawObject = (obj, color, heightFactor) => {
    const t = (obj.z - game.cameraZ + game.track.length) % game.track.length;
    if (t < 0 || t > DRAW_DISTANCE * game.track.segmentLength) return;

    const scale = nearProj.scale;
    const x = nearProj.screenX + nearProj.roadW * obj.laneOffset;
    const h = Math.max(8, nearProj.roadW * heightFactor);
    const w = Math.max(6, nearProj.roadW * obj.widthFactor);

    ctx.fillStyle = color;
    ctx.fillRect(x - w / 2, nearProj.screenY - h, w, h);
    ctx.fillStyle = 'rgba(255,255,255,0.28)';
    ctx.fillRect(x - (w * 0.25), nearProj.screenY - h + 2, w * 0.5, h * 0.2);
  };

  game.obstacles.forEach((o) => {
    if (o.active && Math.floor(o.z / game.track.segmentLength) % game.track.segments.length === segIndex) {
      drawObject(o, '#8d5a2b', 0.36);
    }
  });

  game.aiCars.forEach((c) => {
    if (c.active && Math.floor(c.z / game.track.segmentLength) % game.track.segments.length === segIndex) {
      drawObject(c, '#2f4ac7', 0.48);
    }
  });
}

function renderPlayerCar(ctx, game, width, height) {
  const baseX = width * 0.5 + game.player.laneOffset * width * 0.22;
  const baseY = height * 0.86;
  const sway = Math.sin(game.distance * 0.07) * Math.min(6, game.player.speed * 0.03);

  ctx.save();
  ctx.translate(baseX + sway, baseY);

  ctx.fillStyle = '#17328f';
  ctx.fillRect(-35, -35, 70, 35);
  ctx.fillStyle = '#244dd2';
  ctx.fillRect(-28, -50, 56, 15);
  ctx.fillStyle = '#f4d35e';
  ctx.fillRect(-22, -25, 14, 8);
  ctx.fillRect(8, -25, 14, 8);
  ctx.fillStyle = '#111';
  ctx.fillRect(-40, -12, 16, 16);
  ctx.fillRect(24, -12, 16, 16);

  ctx.restore();
}
