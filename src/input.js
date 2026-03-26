export class Input {
  constructor() {
    this.keys = new Set();
    window.addEventListener('keydown', (e) => {
      this.keys.add(e.code);
      if ([
        'ArrowLeft',
        'ArrowRight',
        'ArrowUp',
        'ArrowDown',
        'KeyW',
        'KeyA',
        'KeyS',
        'KeyD',
        'Space',
        'Enter',
      ].includes(e.code)) {
        e.preventDefault();
      }
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.code));
  }

  pressed(...codes) {
    return codes.some((c) => this.keys.has(c));
  }
}
