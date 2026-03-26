import { Game } from './game.js';

const canvas = document.getElementById('gameCanvas');
const game = new Game(canvas);

let lastTime = performance.now();

function loop(now) {
  const dt = Math.min((now - lastTime) / 1000, 0.05);
  lastTime = now;
  game.update(dt);
  game.render();
  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
