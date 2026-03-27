export class Input {
  constructor() {
    this.keys = new Set();
    this.virtualKeys = new Set();

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

    this.bindMobileControls();
  }

  bindMobileControls() {
    const controls = document.getElementById('mobileControls');
    if (!controls) return;

    const holdButtons = controls.querySelectorAll('[data-code]');
    holdButtons.forEach((button) => {
      const code = button.dataset.code;
      if (!code) return;

      const press = (e) => {
        e.preventDefault();
        this.virtualKeys.add(code);
        button.classList.add('is-pressed');
      };

      const release = (e) => {
        e.preventDefault();
        this.virtualKeys.delete(code);
        button.classList.remove('is-pressed');
      };

      button.addEventListener('pointerdown', press);
      button.addEventListener('pointerup', release);
      button.addEventListener('pointerleave', release);
      button.addEventListener('pointercancel', release);
    });
  }

  pressed(...codes) {
    return codes.some((c) => this.keys.has(c) || this.virtualKeys.has(c));
  }
}
