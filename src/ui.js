export function drawHud(ctx, game, canvas) {
  const speedKmh = Math.round(game.player.speed * 1.45);
  const avgKmh = Math.round(game.avgSpeed * 1.45);
  ctx.fillStyle = 'rgba(5,10,24,0.55)';
  ctx.fillRect(16, 16, 290, 124);

  ctx.fillStyle = '#dce9ff';
  ctx.font = '700 20px Segoe UI';
  ctx.fillText(`Velocità: ${speedKmh} km/h`, 28, 48);
  ctx.fillText(`Distanza: ${Math.floor(game.distance)} m`, 28, 78);
  ctx.fillText(`Media: ${avgKmh} km/h`, 28, 108);

  ctx.fillStyle = 'rgba(5,10,24,0.55)';
  ctx.fillRect(canvas.width - 220, 16, 200, 74);
  ctx.fillStyle = '#f8fbff';
  ctx.font = '800 18px Segoe UI';
  ctx.fillText('Punteggio', canvas.width - 198, 44);
  ctx.font = '800 28px Segoe UI';
  ctx.fillText(`${game.score}`, canvas.width - 198, 78);

  if (game.offRoad) {
    ctx.fillStyle = '#ffbc42';
    ctx.font = '700 18px Segoe UI';
    ctx.fillText('FUORI STRADA: trazione ridotta', 300, 48);
  }

  if (game.state === 'start') {
    drawOverlay(ctx, canvas, '2D RALLY ARCADE', 'Premi SPAZIO per iniziare');
  } else if (game.state === 'gameover') {
    drawOverlay(
      ctx,
      canvas,
      'GAME OVER',
      `Score: ${game.score} · Distanza: ${Math.floor(game.distance)} m · Premi R`,
    );
  }
}

function drawOverlay(ctx, canvas, title, subtitle) {
  ctx.fillStyle = 'rgba(3,6,15,0.68)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#f5faff';
  ctx.textAlign = 'center';
  ctx.font = '800 54px Segoe UI';
  ctx.fillText(title, canvas.width / 2, canvas.height * 0.43);
  ctx.font = '700 24px Segoe UI';
  ctx.fillText(subtitle, canvas.width / 2, canvas.height * 0.55);
  ctx.textAlign = 'start';
}
