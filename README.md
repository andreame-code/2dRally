# 2dRally (Browser Edition)

Gioco rally arcade pseudo-3D giocabile direttamente da browser con `Canvas 2D`.

## Stato del progetto

Il codice JavaScript è organizzato in moduli chiari (input, stato di gioco, rendering, UI) e risulta leggibile/estendibile.

### Review rapida (Mar 2026)
- ✅ Buona separazione delle responsabilità (`Game`, renderer, HUD, input).
- ✅ Loop principale stabile con `dt` clampato (max 50ms) per evitare salti eccessivi.
- ✅ UX completa: start screen, HUD, pace notes, game over, restart, controlli touch.
- ⚠️ Presente anche `src/main.py` (entrypoint Pygame legacy) non collegato alla build browser attuale.
- ⚠️ Mancano script automatici di test/lint nel repository.

---

## Feature principali
- Visuale terza persona con auto del giocatore in basso allo schermo.
- Strada pseudo-3D a segmenti con prospettiva, curve cumulative e decorazioni laterali.
- Fisica arcade con accelerazione/frenata, drag, grip differenziato (strada/fuori pista), deriva e perdita di controllo su impatto.
- Ostacoli dinamici (`rock`, `log`, `puddle`) con collisioni, danni e shake/flash feedback.
- HUD completo:
  - tempo stage,
  - barra progresso distanza,
  - pace notes (direzione + severità curva),
  - tachimetro/contagiri/marcia,
  - indicatore danni.
- Effetti visivi: polvere, camera shake, overlay start/finish.
- Controlli desktop + mobile (bottoni touch a schermo).

## Architettura (moduli)
- `index.html`: canvas principale + UI controlli mobile.
- `style.css`: layout e stile della pagina.
- `src/main.js`: bootstrap e game loop (`requestAnimationFrame`).
- `src/game.js`: stato globale, update loop, fisica player, gameplay, collisioni.
- `src/render.js`: pipeline di rendering mondo/strada/ostacoli/auto/effetti.
- `src/ui.js`: HUD e overlay.
- `src/input.js`: input tastiera + touch virtual keys.
- `src/track.js`: generazione tracciato, utility segmenti, pace notes.
- `src/entities.js`: factory player/ostacoli.
- `src/main.py`: prototipo Pygame legacy (non usato nella versione browser).

## Avvio rapido
Nessun backend richiesto.

### Opzione 1
Apri direttamente `index.html` nel browser.

### Opzione 2 (consigliata)
Avvia un server statico locale:

```bash
python -m http.server 8000
```

Poi apri: `http://localhost:8000`

## Controlli
### Desktop
- `↑` / `W`: accelera
- `↓` / `S`: frena
- `←` / `A`: sterza sinistra
- `→` / `D`: sterza destra
- `Invio` o `Spazio`: avvia
- `R` (o `Invio`/`Spazio`): restart dopo game over

### Mobile
- Pulsanti touch on-screen per sterzo, accelerazione, frenata, start/restart.

## Possibili miglioramenti
- Aggiungere script `npm` con lint/test automatici.
- Gestione resize responsive del canvas.
- Seed random opzionale per riproducibilità delle run.
- Split in modalità/stage multipli con leaderboard locale.

## Licenza
MIT (`LICENSE`).
