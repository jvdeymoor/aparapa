# Handoff — progetto27

## Progetto

- Repository GitHub: `jvdeymoor/progetto27`
- Sito pubblicato: `https://jvdeymoor.github.io/progetto27/`
- Branch e pubblicazione: `main`, cartella principale (`/(root)`) tramite GitHub Pages.
- Il repository contiene attualmente un unico file principale: `index.html`.

## Stato attuale

È stata creata una prima versione giocabile di un mondo 3D in prima persona:

- pianura con prato verde e cielo azzurro;
- alberi e nuvole semplici per dare riferimenti nell’ambiente;
- movimento su PC con WASD o frecce;
- visuale su PC con mouse e puntatore bloccato;
- joystick virtuale a sinistra su cellulare;
- trascinamento sul lato destro dello schermo per guardarsi intorno su cellulare;
- ingresso a schermo intero quando si preme `INIZIA` (se supportato dal browser);
- schermata iniziale con pulsante `INIZIA`.

La pagina carica Three.js 0.160.0 da jsDelivr. Non sono necessari altri asset locali per questa versione.

## Ultima modifica

L’ultimo aggiornamento aggiunge l’ingresso a schermo intero all’avvio del mondo. Il file aggiornato è già stato salvato direttamente nel repository GitHub.

## Prossimi sviluppi possibili

- aggiungere un personaggio o altri elementi interattivi;
- migliorare terreno, alberi, cielo e illuminazione;
- aggiungere suoni e musica;
- aggiungere collisioni e punti di interesse;
- aggiungere un menu e un sistema di salvataggio;
- ottimizzare il rendering per telefoni meno potenti.

## Note importanti

- Questo progetto è separato dal sito Beat-O-Gato.
- Beat-O-Gato usa invece `index.html`, `click.php` e `click.txt` sul suo hosting PHP.
- Non inserire password, token o credenziali nel repository.
- Dopo ogni commit su `main`, GitHub Pages aggiorna il sito dopo alcuni minuti.

## Uso del plugin GitHub in Codex

Il plugin GitHub è collegato all’account e permette di leggere e aggiornare i file del repository direttamente da Codex.

Per continuare il lavoro, indicare chiaramente:

> Modifica direttamente il repository `jvdeymoor/progetto27`, aggiorna `index.html` e salva su `main`.

Nelle attività Codex supportate il plugin può essere selezionato da `Sources` → `Use plugins` → `GitHub`, oppure richiamato con `@GitHub`. Le modifiche al repository possono richiedere una conferma.

