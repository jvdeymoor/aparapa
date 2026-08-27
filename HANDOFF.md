# Handoff — progetto27

## Progetto

- Repository GitHub: `jvdeymoor/progetto27`
- Sito pubblicato: `https://jvdeymoor.github.io/progetto27/`
- Branch e pubblicazione: `main`, cartella principale (`/(root)`) tramite GitHub Pages.
- Il repository contiene attualmente il file principale `index.html`.

## Stato attuale

È disponibile una versione giocabile di un mondo 3D in prima persona:

- terreno procedurale a chunk, con quattro profili: pianura, leggermente mosso, scosceso e montagna;
- profili diversi per ogni area, interpolati ai bordi per evitare scalini;
- altezza globale regolabile tramite `TERRAIN.verticalScale`;
- colori e superfici diversificate: prato, roccia, terra e sabbia;
- generazione deterministica tramite seed;
- chunk da 64×64 con 32 suddivisioni per lato;
- caricamento dinamico dei chunk in una griglia 5×5 attorno al giocatore;
- bordi dei chunk coerenti perché l’altezza usa coordinate globali;
- alberi posizionati sulla quota reale del terreno;
- altezza del giocatore aggiornata seguendo il terreno;
- cielo, nebbia, illuminazione, alberi e nuvole;
- movimento su PC con WASD o frecce;
- visuale su PC con mouse e puntatore bloccato;
- joystick virtuale a sinistra su cellulare;
- trascinamento sul lato destro dello schermo per guardarsi intorno su cellulare;
- ingresso a schermo intero quando si preme `INIZIA` (se supportato dal browser);
- schermata iniziale con pulsante `INIZIA`.

La pagina carica Three.js 0.160.0 da jsDelivr. Non sono necessari altri asset locali.

## Ultima modifica

I commit `666c77d7b7136af16a4d1d57ebe2092231246244`, `64f711a57d554076b1986238a48e3d1533956239`, `5f4d3ad4da1cb3d7a13ceefd8dd14378dbe674b7` e `575e138c2e1e974ad1d176a80daaeb581f8a5af3` aggiungono il terreno procedurale, correggono l’orientamento dei triangoli, introducono i quattro profili con superfici colorate e il controllo globale dell’altezza. Il codice è stato controllato sintatticamente, verificato nel browser e salvato direttamente su `main`.

## Prossimi sviluppi possibili

- aggiungere collisioni con alberi e punti di interesse;
- aggiungere materiali più dettagliati o texture;
- aggiungere acqua, fiumi e biomi;
- aggiungere suoni e musica;
- aggiungere un menu e un sistema di salvataggio;
- ottimizzare il numero di suddivisioni e il caricamento per telefoni meno potenti.

## Note importanti

- Non inserire password, token o credenziali nel repository.
- Dopo ogni commit su `main`, GitHub Pages aggiorna il sito dopo alcuni minuti.
- Se il sito mostra ancora la versione precedente, attendere la propagazione della pubblicazione o ricaricare senza cache.

## Uso del plugin GitHub in Codex

Il plugin GitHub è collegato all’account e permette di leggere e aggiornare i file del repository direttamente da Codex.

Per continuare il lavoro, indicare chiaramente:

> Modifica direttamente il repository `jvdeymoor/progetto27`, aggiorna `index.html` e salva su `main`.

Nelle attività Codex supportate il plugin può essere selezionato da `Sources` → `Use plugins` → `GitHub`, oppure richiamato con `@GitHub`. Le modifiche al repository possono richiedere una conferma.

