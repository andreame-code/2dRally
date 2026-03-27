# 2dRally (Browser Edition)

Gioco rally arcade pseudo-3D giocabile direttamente da browser con `Canvas 2D`.

## Caratteristiche implementate
- Visuale terza persona con auto del giocatore vista da dietro, in basso allo schermo.
- Strada pseudo-3D a segmenti con prospettiva e curve cumulative.
- Controlli arcade (`WASD` o frecce) con accelerazione, frenata e sterzo.
- Penalità fuori strada.
- Ostacoli + traffico semplice con collisioni.
- Start screen, HUD (velocità/distanza), game over e restart.

## Struttura
- `index.html`
- `style.css`
- `src/main.js`
- `src/game.js`
- `src/render.js`
- `src/input.js`
- `src/track.js`
- `src/entities.js`
- `src/ui.js`

## Avvio rapido
Nessun backend richiesto.

Opzione 1: apri direttamente `index.html` nel browser.

Opzione 2 (consigliata per evitare limiti di sicurezza locali):
```bash
python -m http.server 8000
```
Poi apri `http://localhost:8000`.

## Controlli
- `↑` / `W`: accelera
- `↓` / `S`: frena
- `←` / `A`: sterza sinistra
- `→` / `D`: sterza destra
- `Invio` o `Spazio`: avvia
- `R`: restart dopo game over
- Mobile: pulsanti touch a schermo (sterzo, accelera, frena, start/restart)

## Licenza
MIT (`LICENSE`).
