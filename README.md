# 2dRally

## Obiettivo del progetto
2dRally mira a diventare un semplice gioco di corse in 2D, ispirato ai rally classici.
L'obiettivo è offrire un esempio didattico di sviluppo di videogiochi in Python
utilizzando la libreria Pygame.

## Stato attuale
Il progetto è nelle fasi iniziali e non include ancora il gameplay completo.
Il file `src/main.py` contiene un loop Pygame minimale da cui iniziare lo sviluppo.

## Dipendenze
- Python 3.x
- [Pygame](https://www.pygame.org/) – installabile con:
  ```bash
  pip install pygame
  ```

## Avvio del gioco
1. Installare le dipendenze indicate.
2. Avviare l'applicazione eseguendo:
   ```bash
   python src/main.py
   ```

### Modalità headless
In ambienti senza display (ad esempio integrazione continua), il gioco può
essere eseguito in modalità *headless* utilizzando il driver video ``dummy``.
Per forzare la modalità headless è possibile impostare la variabile
``PYGAME_HEADLESS`` a ``1`` prima di avviare lo script:

```bash
PYGAME_HEADLESS=1 python src/main.py
```

Impostando ``PYGAME_HEADLESS`` a ``0`` si disabilita la modalità headless,
forzando l'uso del driver video standard. Se la variabile non è definita, la
modalità headless viene attivata automaticamente solo quando non è rilevato
alcun display.

## Controlli da tastiera
- **Freccia su** – accelera
- **Freccia giù** – frena o retromarcia
- **Freccia sinistra/destra** – sterza
- **Esc** – chiude il gioco

## Contributi futuri
Le proposte di miglioramento sono benvenute. Aprite una issue o una pull request
per discutere nuove funzionalità, correzioni di bug o idee di design.

## Licenza
Questo progetto è distribuito sotto la licenza MIT. Vedere il file `LICENSE`
per i dettagli completi.
