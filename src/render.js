import { segmentIndexAtZ } from './track.js';

const FOV = 100;
const CAMERA_HEIGHT = 1.15;
const DRAW_DISTANCE = 220;
const ROAD_BOTTOM_HALF_WIDTH_RATIO = 0.32;
const ROAD_TOP_HALF_WIDTH_RATIO = 0.08;

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
  drawDust(ctx, game, width, height);
  renderPlayerCar(ctx, game, width, height);

  if (game.flashTimer > 0) {
    ctx.fillStyle = `rgba(180,100,50,${Math.min(0.35, game.flashTimer * 2)})`;
    ctx.fillRect(0, 0, width, height);
  }

  ctx.restore();
}

function drawBackground(ctx, game, width, height, horizon) {
  // Overcast rally sky
  const sky = ctx.createLinearGradient(0, 0, 0, horizon);
  sky.addColorStop(0, '#b8cce0');
  sky.addColorStop(0.6, '#95b3cf');
  sky.addColorStop(1, '#7a9db8');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, horizon);

  // Distant forested hills
  const hillColors = ['#3a5a3a', '#2e4d2e', '#345634'];
  for (let layer = 0; layer < 3; layer++) {
    const count = 5 + layer * 3;
    const parallax = 0.01 + layer * 0.015;
    const hillH = 50 + layer * 30;
    const baseY = horizon - 15 + layer * 15;

    ctx.fillStyle = hillColors[layer];
    for (let i = 0; i < count; i++) {
      const spacing = (width + 400) / count;
      const x = (((i * spacing - game.distance * parallax) % (width + 400)) + (width + 400)) % (width + 400) - 200;
      ctx.beginPath();
      ctx.ellipse(x, baseY + 20, 140 - layer * 20, hillH, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Tree line silhouette at horizon
  ctx.fillStyle = '#1e3a1e';
  for (let i = 0; i < 30; i++) {
    const spacing = (width + 200) / 30;
    const x = (((i * spacing - game.distance * 0.05) % (width + 200)) + (width + 200)) % (width + 200) - 100;
    const h = 25 + (i * 7) % 30;
    // Pine tree shape
    ctx.beginPath();
    ctx.moveTo(x, horizon + 5);
    ctx.lineTo(x - 8 - (i % 3) * 3, horizon + 5);
    ctx.lineTo(x, horizon - h);
    ctx.lineTo(x + 8 + (i % 3) * 3, horizon + 5);
    ctx.closePath();
    ctx.fill();
  }

  // Forest floor / dirt ground
  const ground = ctx.createLinearGradient(0, horizon, 0, height);
  ground.addColorStop(0, '#5a7a4a');
  ground.addColorStop(0.15, '#4a6a3a');
  ground.addColorStop(1, '#3a5528');
  ctx.fillStyle = ground;
  ctx.fillRect(0, horizon, width, height - horizon);

  // Ground texture dots
  for (let i = 0; i < 150; i++) {
    const x = (i * 131 + Math.floor(game.distance * 0.6)) % width;
    const y = horizon + ((i * 71) % (height - horizon));
    const alpha = 0.06 + ((i % 5) / 5) * 0.08;
    ctx.fillStyle = `rgba(30,50,20,${alpha})`;
    ctx.fillRect(x, y, 3, 2);
  }
}

function drawTree(ctx, x, y, roadW, side) {
  const scale = Math.max(0.15, roadW / 160);
  const trunkH = 55 * scale;
  const trunkW = 7 * scale;
  const canopyW = 22 * scale;

  // Trunk
  ctx.fillStyle = '#3d2b1a';
  ctx.fillRect(x - trunkW * 0.5, y - trunkH, trunkW, trunkH);

  // Pine canopy (layered triangles)
  ctx.fillStyle = '#1e4a1e';
  for (let layer = 0; layer < 3; layer++) {
    const layerY = y - trunkH * 0.3 - layer * canopyW * 0.8;
    const layerW = canopyW * (1.1 - layer * 0.2);
    ctx.beginPath();
    ctx.moveTo(x, layerY - canopyW * 0.9);
    ctx.lineTo(x - layerW, layerY);
    ctx.lineTo(x + layerW, layerY);
    ctx.closePath();
    ctx.fill();
  }

  // Darker shade on one side
  ctx.fillStyle = 'rgba(0,20,0,0.3)';
  for (let layer = 0; layer < 3; layer++) {
    const layerY = y - trunkH * 0.3 - layer * canopyW * 0.8;
    const layerW = canopyW * (1.1 - layer * 0.2);
    ctx.beginPath();
    ctx.moveTo(x, layerY - canopyW * 0.9);
    ctx.lineTo(x - layerW * (side < 0 ? 1 : 0.3), layerY);
    ctx.lineTo(x, layerY);
    ctx.closePath();
    ctx.fill();
  }
}

function drawBarrier(ctx, x1, y1, w1, x2, y2, w2, side) {
  const bx1 = side < 0 ? x1 - w1 * 1.08 : x1 + w1 * 1.08;
  const bx2 = side < 0 ? x2 - w2 * 1.08 : x2 + w2 * 1.08;
  const bw1 = w1 * 0.06;
  const bw2 = w2 * 0.06;

  // Red barrier posts
  ctx.fillStyle = '#c92a2a';
  const postH1 = Math.max(2, (y2 - y1) * 0.7);
  ctx.fillRect(bx1 - bw1, y1 - postH1, bw1 * 2, postH1);

  // Barrier tape
  ctx.strokeStyle = '#c92a2a';
  ctx.lineWidth = Math.max(1, bw2 * 1.5);
  ctx.beginPath();
  ctx.moveTo(bx1, y1 - postH1 * 0.5);
  ctx.lineTo(bx2, y2 - postH1 * 0.5);
  ctx.stroke();
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

    // Forest floor on sides
    const sideGround = near.segment.colorIndex ? '#4a6a3a' : '#436234';
    ctx.fillStyle = sideGround;
    ctx.fillRect(0, topY, width, bottomY - topY);

    // Dirt road surface - alternating brown/tan stripes
    const dirtLight = near.segment.colorIndex ? '#b87a42' : '#a86e3a';
    const dirtDark = near.segment.colorIndex ? '#9a6434' : '#8c5a2e';

    // Road shoulder (dirt edge)
    drawQuad(ctx, far.x, topY, far.roadW * 1.12, near.x, bottomY, near.roadW * 1.12, '#6a5230');
    // Main dirt road
    drawQuad(ctx, far.x, topY, far.roadW, near.x, bottomY, near.roadW, dirtLight);

    // Tire tracks (darker lines on road)
    if (near.segment.colorIndex) {
      drawQuad(ctx, far.x, topY, far.roadW * 0.55, near.x, bottomY, near.roadW * 0.55, dirtDark);
      drawQuad(ctx, far.x, topY, far.roadW * 0.45, near.x, bottomY, near.roadW * 0.45, dirtLight);
    }

    // Center line (subtle tire track)
    if (((far.n + dashedOffset) % 16) < 8) {
      drawQuad(ctx, far.x, topY, far.roadW * 0.02, near.x, bottomY, near.roadW * 0.02, '#7a5828');
    }

    // Red barriers on sharp curves
    const curveStrength = Math.abs(near.segment.curve);
    if (curveStrength > 0.001) {
      const side = near.segment.curve > 0 ? 1 : -1;
      drawBarrier(ctx, near.x, topY, near.roadW, far.x, bottomY, far.roadW, side);
    }

    // Trees on sides of road
    if (near.n % 8 === 0 && near.roadW > 15) {
      const treeOffsetL = near.x - near.roadW * 1.6 - (near.n * 13) % 40;
      const treeOffsetR = near.x + near.roadW * 1.6 + (near.n * 17) % 40;
      drawTree(ctx, treeOffsetL, bottomY, near.roadW, -1);
      drawTree(ctx, treeOffsetR, bottomY, near.roadW, 1);
    }
    if (near.n % 8 === 4 && near.roadW > 20) {
      const side = (near.n % 16 < 8) ? -1 : 1;
      const treeX = near.x + side * (near.roadW * 1.8 + (near.n * 11) % 30);
      drawTree(ctx, treeX, bottomY, near.roadW, side);
    }

    // Render obstacles
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

    if (obj.type === 'rock') {
      // Gray-brown rock
      ctx.fillStyle = '#5a5048';
      ctx.beginPath();
      ctx.ellipse(x, nearProj.screenY - h * 0.3, w * 0.5, h * 0.35, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#706860';
      ctx.beginPath();
      ctx.ellipse(x - w * 0.1, nearProj.screenY - h * 0.4, w * 0.3, h * 0.2, -0.2, 0, Math.PI * 2);
      ctx.fill();
    } else if (obj.type === 'puddle') {
      // Water puddle
      ctx.fillStyle = 'rgba(60,90,120,0.7)';
      ctx.beginPath();
      ctx.ellipse(x, nearProj.screenY - 2, w * 0.65, h * 0.18, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(120,160,200,0.4)';
      ctx.beginPath();
      ctx.ellipse(x + w * 0.1, nearProj.screenY - 3, w * 0.3, h * 0.1, 0, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Fallen log
      ctx.fillStyle = '#4a3520';
      ctx.fillRect(x - w * 0.55, nearProj.screenY - h * 0.25, w * 1.1, h * 0.22);
      ctx.fillStyle = '#5d4430';
      ctx.beginPath();
      ctx.ellipse(x + w * 0.55, nearProj.screenY - h * 0.14, h * 0.12, h * 0.12, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  game.obstacles.forEach((o) => {
    if (o.active && Math.floor(o.z / game.track.segmentLength) % game.track.segments.length === segIndex) {
      drawObstacle(o);
    }
  });
}

function drawDust(ctx, game, width, height) {
  const baseX = width * 0.5 + game.player.laneOffset * width * 0.22;
  const baseY = height * 0.88;

  game.dustParticles.forEach((p) => {
    const alpha = Math.max(0, (p.life / p.maxLife) * 0.5);
    const size = p.size * (1 + (1 - p.life / p.maxLife) * 1.5);
    ctx.fillStyle = `rgba(160,120,70,${alpha})`;
    ctx.beginPath();
    ctx.ellipse(baseX + p.x, baseY + p.y, size, size * 0.7, 0, 0, Math.PI * 2);
    ctx.fill();
  });
}

function renderPlayerCar(ctx, game, width, height) {
  const baseX = width * 0.5 + game.player.laneOffset * width * 0.22;
  const baseY = height * 0.86;
  const wobble = Math.sin(game.distance * 0.08) * Math.min(8, game.player.speed * 0.035);
  const tilt = -game.player.steering * 0.14;
  const wheelSpin = game.distance * 0.18;

  ctx.save();
  ctx.translate(baseX + wobble, baseY);
  ctx.rotate(tilt);

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.28)';
  ctx.beginPath();
  ctx.ellipse(0, 2, 50, 13, 0, 0, Math.PI * 2);
  ctx.fill();

  // === Subaru Impreza WRC style ===

  // Main body (WRC blue)
  ctx.fillStyle = '#0c3d8f';
  ctx.fillRect(-38, -40, 76, 40);

  // Body contour (slightly lighter blue top)
  ctx.fillStyle = '#1552b5';
  ctx.fillRect(-34, -54, 68, 18);

  // Rear window
  ctx.fillStyle = '#1a2a40';
  ctx.fillRect(-22, -50, 44, 12);

  // Roof scoop (rally feature)
  ctx.fillStyle = '#0a2d6a';
  ctx.fillRect(-6, -57, 12, 5);

  // Gold/yellow rally stripes
  ctx.fillStyle = '#d4a828';
  ctx.fillRect(-36, -32, 72, 3);
  // Side gold accents
  ctx.fillRect(-38, -22, 5, 14);
  ctx.fillRect(33, -22, 5, 14);

  // Gold star pattern (simplified Subaru stars)
  ctx.fillStyle = '#e8c040';
  const starPositions = [[-12, -26], [0, -26], [12, -26]];
  starPositions.forEach(([sx, sy]) => {
    ctx.fillRect(sx - 2, sy - 2, 4, 4);
  });

  // Headlights (yellow)
  ctx.fillStyle = '#ffe066';
  ctx.fillRect(-26, -27, 12, 6);
  ctx.fillRect(14, -27, 12, 6);

  // Tail lights (red)
  ctx.fillStyle = '#cc2200';
  ctx.fillRect(-36, -8, 8, 5);
  ctx.fillRect(28, -8, 8, 5);

  // Rear bumper
  ctx.fillStyle = '#081e4a';
  ctx.fillRect(-38, -4, 76, 4);

  // Exhaust
  ctx.fillStyle = '#444';
  ctx.fillRect(8, -2, 10, 3);

  // Mud splatter effect
  if (game.player.speed > 60) {
    ctx.fillStyle = 'rgba(120,80,30,0.4)';
    ctx.fillRect(-38, -10, 15, 8);
    ctx.fillRect(23, -10, 15, 8);
    ctx.fillRect(-30, -5, 60, 4);
  }

  // Wheels with rally tire look
  drawRallyWheel(ctx, -42, -14, wheelSpin);
  drawRallyWheel(ctx, 26, -14, wheelSpin);

  // Number plate
  ctx.fillStyle = '#fff';
  ctx.fillRect(-8, -6, 16, 5);
  ctx.fillStyle = '#111';
  ctx.font = '700 4px monospace';
  ctx.fillText('555', -5, -2);

  ctx.restore();
}

function drawRallyWheel(ctx, x, y, spin) {
  // Tire
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(x, y, 18, 18);
  // Rim (gold)
  ctx.fillStyle = '#b8960a';
  ctx.fillRect(x + 3, y + 3, 12, 12);
  // Spoke pattern
  ctx.strokeStyle = '#8a7008';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x + 9, y + 4);
  ctx.lineTo(x + 9 + Math.sin(spin) * 4, y + 14);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x + 5, y + 9);
  ctx.lineTo(x + 13, y + 9 + Math.cos(spin) * 3);
  ctx.stroke();
  // Center cap
  ctx.fillStyle = '#d4b020';
  ctx.fillRect(x + 7, y + 7, 4, 4);
}
