export function drawHud(ctx, game, canvas) {
  const { width, height } = canvas;
  const speedKmh = Math.round(game.player.speed * 1.45);

  // === Stage Timer (top right) ===
  drawTimer(ctx, game, width);

  // === Progress Bar (top center) ===
  drawProgressBar(ctx, game, width);

  // === Pace Notes (top center, below progress) ===
  drawPaceNotes(ctx, game, width);

  // === Tachometer & Speed (bottom right) ===
  drawTachometer(ctx, game, width, height, speedKmh);

  // === Damage Bar (bottom left) ===
  drawDamageBar(ctx, game, height);

  // === Off-road warning ===
  if (game.offRoad) {
    ctx.fillStyle = '#ffbc42';
    ctx.font = '700 16px monospace';
    ctx.fillText('⚠ OFF TRACK', 20, height - 20);
  }

  // === Overlays ===
  if (game.state === 'start') {
    drawStartOverlay(ctx, canvas);
  } else if (game.state === 'gameover') {
    drawFinishOverlay(ctx, game, canvas);
  }
}

function drawTimer(ctx, game, width) {
  // Timer background
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.fillRect(width - 200, 8, 192, 40);
  ctx.fillStyle = '#cc2200';
  ctx.fillRect(width - 200, 8, 80, 40);

  ctx.fillStyle = '#fff';
  ctx.font = '700 13px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('STAGE', width - 160, 34);

  ctx.fillStyle = '#f0f0f0';
  ctx.font = '700 20px monospace';
  ctx.fillText(formatTime(game.stageTime), width - 80, 36);
  ctx.textAlign = 'start';
}

function drawProgressBar(ctx, game, width) {
  const barW = 320;
  const barX = (width - barW) / 2;
  const barY = 14;
  const barH = 10;
  const progress = Math.min(1, game.distance / game.stageLength);

  // Bar background
  ctx.fillStyle = 'rgba(40,40,40,0.8)';
  ctx.fillRect(barX, barY, barW, barH);

  // Progress fill
  ctx.fillStyle = '#999';
  ctx.fillRect(barX, barY, barW * progress, barH);

  // Position marker
  const markerX = barX + barW * progress;
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.moveTo(markerX, barY - 4);
  ctx.lineTo(markerX - 4, barY);
  ctx.lineTo(markerX + 4, barY);
  ctx.closePath();
  ctx.fill();

  // Ticks
  ctx.fillStyle = '#666';
  for (let i = 0.25; i < 1; i += 0.25) {
    ctx.fillRect(barX + barW * i - 0.5, barY, 1, barH);
  }

  // Distance text
  ctx.fillStyle = '#ccc';
  ctx.font = '600 10px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`${Math.floor(game.distance)} / ${game.stageLength} m`, width / 2, barY + barH + 14);
  ctx.textAlign = 'start';
}

function drawPaceNotes(ctx, game, width) {
  if (!game.paceNotes || game.paceNotes.length === 0) return;

  const note = game.paceNotes[0];
  const noteX = width / 2;
  const noteY = 58;
  const boxSize = 48;

  // Green sign background (like CMR)
  const urgency = Math.max(0, 1 - note.distance / 80);
  const alpha = 0.6 + urgency * 0.4;
  ctx.fillStyle = `rgba(90,120,60,${alpha})`;
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;

  const rx = noteX - boxSize / 2;
  const ry = noteY - boxSize / 2;
  ctx.beginPath();
  ctx.roundRect(rx, ry, boxSize, boxSize, 6);
  ctx.fill();
  ctx.stroke();

  // Arrow
  ctx.save();
  ctx.translate(noteX, noteY);
  if (note.direction === 'left') ctx.scale(-1, 1);

  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();

  if (note.severity <= 2) {
    // Sharp turn
    ctx.moveTo(-8, 12);
    ctx.lineTo(-8, -4);
    ctx.lineTo(10, -14);
  } else if (note.severity <= 4) {
    // Medium curve
    ctx.moveTo(-6, 14);
    ctx.lineTo(-6, 0);
    ctx.quadraticCurveTo(-6, -12, 8, -14);
  } else {
    // Gentle curve
    ctx.moveTo(-4, 14);
    ctx.quadraticCurveTo(-4, -6, 10, -10);
  }
  ctx.stroke();

  // Arrow head
  const ax = note.severity <= 2 ? 10 : 8;
  const ay = note.severity <= 2 ? -14 : -14;
  ctx.beginPath();
  ctx.moveTo(ax, ay);
  ctx.lineTo(ax - 4, ay + 6);
  ctx.moveTo(ax, ay);
  ctx.lineTo(ax + 5, ay + 4);
  ctx.stroke();

  ctx.restore();

  // Severity number
  ctx.fillStyle = '#fff';
  ctx.font = '800 14px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`${note.severity}`, noteX, noteY + boxSize / 2 + 16);
  ctx.textAlign = 'start';
}

function drawTachometer(ctx, game, width, height, speedKmh) {
  const cx = width - 100;
  const cy = height - 90;
  const radius = 70;

  // Background circle
  ctx.fillStyle = 'rgba(0,0,0,0.75)';
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = 'rgba(255,255,255,0.3)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.stroke();

  // RPM arc
  const startAngle = Math.PI * 0.75;
  const endAngle = Math.PI * 2.25;
  const totalArc = endAngle - startAngle;

  // Tick marks
  for (let i = 0; i <= 8; i++) {
    const angle = startAngle + (i / 8) * totalArc;
    const innerR = i >= 7 ? radius - 16 : radius - 12;
    ctx.strokeStyle = i >= 7 ? '#cc2200' : '#888';
    ctx.lineWidth = i % 2 === 0 ? 2 : 1;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(angle) * innerR, cy + Math.sin(angle) * innerR);
    ctx.lineTo(cx + Math.cos(angle) * (radius - 5), cy + Math.sin(angle) * (radius - 5));
    ctx.stroke();

    // Numbers
    if (i % 2 === 0) {
      ctx.fillStyle = i >= 7 ? '#cc2200' : '#999';
      ctx.font = '600 9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${i}`, cx + Math.cos(angle) * (radius - 22), cy + Math.sin(angle) * (radius - 22) + 3);
    }
  }

  // RPM needle
  const rpmAngle = startAngle + game.player.rpm * totalArc;
  ctx.strokeStyle = '#cc2200';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + Math.cos(rpmAngle) * (radius - 15), cy + Math.sin(rpmAngle) * (radius - 15));
  ctx.stroke();

  // Center cap
  ctx.fillStyle = '#333';
  ctx.beginPath();
  ctx.arc(cx, cy, 5, 0, Math.PI * 2);
  ctx.fill();

  // Gear number (large, center)
  ctx.fillStyle = '#fff';
  ctx.font = '800 32px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`${game.player.gear}`, cx + 22, cy + 10);

  // Speed (below)
  ctx.font = '700 16px monospace';
  ctx.fillText(`${speedKmh}`, cx, cy + 35);
  ctx.font = '600 9px monospace';
  ctx.fillStyle = '#999';
  ctx.fillText('km/h', cx, cy + 47);

  // Label
  ctx.fillStyle = '#666';
  ctx.font = '600 8px monospace';
  ctx.fillText('x1000', cx - 20, cy + 56);
  ctx.fillText('rpm', cx + 15, cy + 56);

  ctx.textAlign = 'start';

  // Gauge labels: TURBO / WATER / OIL
  const gaugeX = width - 50;
  const gaugeY = height - 22;
  const gauges = [
    { label: 'TURBO', value: game.player.rpm, color: '#4a9' },
    { label: 'WATER', value: 0.45, color: '#4a9' },
    { label: 'OIL', value: 0.6, color: '#4a9' },
  ];
  gauges.forEach((g, i) => {
    const gy = gaugeY - i * 14;
    ctx.fillStyle = '#888';
    ctx.font = '600 8px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(g.label, gaugeX - 4, gy + 3);
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.fillRect(gaugeX, gy - 3, 40, 6);
    ctx.fillStyle = g.color;
    ctx.fillRect(gaugeX, gy - 3, 40 * g.value, 6);
    ctx.textAlign = 'start';
  });
}

function drawDamageBar(ctx, game, height) {
  const x = 20;
  const y = height - 110;
  const w = 55;
  const h = 90;

  // Car damage silhouette
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(x - 4, y - 4, w + 8, h + 8);
  ctx.strokeStyle = 'rgba(255,255,255,0.3)';
  ctx.lineWidth = 1;
  ctx.strokeRect(x - 4, y - 4, w + 8, h + 8);

  // Simple car outline (top-down view)
  const carX = x + w / 2;
  const carY = y + h / 2;

  // Car body outline
  ctx.strokeStyle = game.player.damage > 0.7 ? '#cc2200' : game.player.damage > 0.3 ? '#d4a828' : '#4a9a4a';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(carX - 12, carY - 28, 24, 56, 4);
  ctx.stroke();

  // Wheels
  ctx.fillStyle = '#888';
  ctx.fillRect(carX - 16, carY - 20, 5, 12);
  ctx.fillRect(carX + 11, carY - 20, 5, 12);
  ctx.fillRect(carX - 16, carY + 8, 5, 12);
  ctx.fillRect(carX + 11, carY + 8, 5, 12);

  // Damage fill
  if (game.player.damage > 0) {
    const dmgColor = game.player.damage > 0.7 ? 'rgba(204,34,0,0.5)' : 'rgba(212,168,40,0.4)';
    ctx.fillStyle = dmgColor;
    ctx.beginPath();
    ctx.roundRect(carX - 12, carY - 28, 24, 56 * game.player.damage, 4);
    ctx.fill();
  }

  // Damage percentage
  ctx.fillStyle = '#ccc';
  ctx.font = '600 10px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`${Math.round(game.player.damage * 100)}%`, carX, y + h + 14);
  ctx.textAlign = 'start';
}

function drawStartOverlay(ctx, canvas) {
  const { width, height } = canvas;

  ctx.fillStyle = 'rgba(0,5,15,0.78)';
  ctx.fillRect(0, 0, width, height);

  // Title
  ctx.fillStyle = '#e8e8e8';
  ctx.textAlign = 'center';
  ctx.font = '800 48px monospace';
  ctx.fillText('2D RALLY', width / 2, height * 0.32);

  // Subtitle with rally styling
  ctx.fillStyle = '#cc2200';
  ctx.font = '700 20px monospace';
  ctx.fillText('STAGE 1 — FOREST', width / 2, height * 0.42);

  // Car info
  ctx.fillStyle = '#0c3d8f';
  ctx.fillRect(width / 2 - 120, height * 0.50, 240, 32);
  ctx.fillStyle = '#d4a828';
  ctx.font = '700 16px monospace';
  ctx.fillText('SUBARU IMPREZA WRC', width / 2, height * 0.50 + 22);

  ctx.fillStyle = '#aaa';
  ctx.font = '600 16px monospace';
  ctx.fillText('Premi SPAZIO per partire', width / 2, height * 0.68);

  ctx.fillStyle = '#666';
  ctx.font = '600 12px monospace';
  ctx.fillText('← → sterza  ·  ↑ accelera  ·  ↓ frena', width / 2, height * 0.78);

  ctx.textAlign = 'start';
}

function drawFinishOverlay(ctx, game, canvas) {
  const { width, height } = canvas;

  ctx.fillStyle = 'rgba(0,5,15,0.78)';
  ctx.fillRect(0, 0, width, height);

  const finished = game.distance >= game.stageLength;

  ctx.fillStyle = '#e8e8e8';
  ctx.textAlign = 'center';
  ctx.font = '800 42px monospace';
  ctx.fillText(finished ? 'STAGE COMPLETE' : 'RETIRED', width / 2, height * 0.30);

  if (finished) {
    ctx.fillStyle = '#d4a828';
    ctx.font = '700 28px monospace';
    ctx.fillText(formatTime(game.stageTime), width / 2, height * 0.44);

    if (game.bestTime > 0) {
      ctx.fillStyle = '#888';
      ctx.font = '600 16px monospace';
      ctx.fillText(`Miglior tempo: ${formatTime(game.bestTime)}`, width / 2, height * 0.53);
    }
  } else {
    ctx.fillStyle = '#cc2200';
    ctx.font = '600 18px monospace';
    const reason = game.player.damage >= 1 ? 'Danni critici' : 'Incidente';
    ctx.fillText(reason, width / 2, height * 0.44);

    ctx.fillStyle = '#888';
    ctx.font = '600 16px monospace';
    ctx.fillText(`Distanza: ${Math.floor(game.distance)} m · Tempo: ${formatTime(game.stageTime)}`, width / 2, height * 0.53);
  }

  ctx.fillStyle = '#aaa';
  ctx.font = '600 16px monospace';
  ctx.fillText('Premi R per riprovare', width / 2, height * 0.68);

  ctx.textAlign = 'start';
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const whole = Math.floor(secs);
  const ms = Math.floor((secs - whole) * 100);
  return `${String(mins).padStart(2, '0')}:${String(whole).padStart(2, '0')}.${String(ms).padStart(2, '0')}`;
}
