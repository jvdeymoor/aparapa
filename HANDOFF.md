# Handoff — progetto27

## Progetto

- Repository GitHub: `jvdeymoor/progetto27`
- Sito pubblicato: `https://jvdeymoor.github.io/progetto27/`
- Branch e pubblicazione: `main`, cartella principale (`/(root)`) tramite GitHub Pages.
- Il repository contiene attualmente il file principale `index.html`.

## Stato attuale

È disponibile una versione giocabile di un mondo 3D urbano con protagonista volante:

- terreno procedurale a chunk, con quattro profili: pianura, leggermente mosso, scosceso e montagna;
- profili diversi per ogni area, interpolati ai bordi per evitare scalini;
- altezza globale regolabile tramite `TERRAIN.verticalScale`;
- terreno urbano con asfalto dominante e chiazze di ghiaia, terra, cemento e poca erba;
- città procedurale per chunk con grattacieli ravvicinati, torri di altezze diverse, facciate in cemento/vetro, fasce luminose, tetti piatti e fondamenta profonde 2,6 metri;
- generazione deterministica tramite seed;
- chunk da 64×64 con 32 suddivisioni per lato;
- caricamento dinamico dei chunk in una griglia 5×5 attorno al giocatore;
- bordi dei chunk coerenti perché l’altezza usa coordinate globali;
- protagonista trasformato in un drone completamente sferico, controllato in terza persona, grande circa quanto un pallone da calcio, con spawn automatico in posizione libera sopra la linea dei tetti;
- il velivolo resta sopra il terreno e i chunk seguono la sua posizione;
- hitbox sferica ridotta per il drone (raggio 0,38), visualizzata con due soli cerchi gialli incrociati; hitbox AABB dei grattacieli con perimetro del corpo e altezza passante dentro le fondamenta, evidenziata in giallo con profondità corretta;
- cielo, nebbia, illuminazione e nuvole, senza alberi;
- pilotaggio su PC con WASD/frecce e mouse o trascinamento;
- visuale su PC con mouse, puntatore bloccato quando disponibile e trascinamento fallback;
- joystick virtuale a sinistra su cellulare: tenerlo premuto dà spinta; per ora spostare il pomello non cambia direzione o altezza;
- swipe sul lato destro dello schermo per controllare visuale e direzione come il mouse su PC;
- sparo con proiettili frontali: spingendo lo stick verso l’alto oltre metà raggio si spara a raffica;
- avvio in finestra del browser, senza richiesta automatica di fullscreen;
- schermata iniziale con pulsante `INIZIA`.

La pagina carica Three.js 0.160.0 da jsDelivr. Non sono necessari altri asset locali.

## Ultima modifica

I commit `666c77d7b7136af16a4d1d57ebe2092231246244`, `64f711a57d554076b1986238a48e3d1533956239`, `5f4d3ad4da1cb3d7a13ceefd8dd14378dbe674b7`, `575e138c2e1e974ad1d176a80daaeb581f8a5af3`, `91526c4971a717fbeeca85c1b3d4cfe1f8aa1305`, `51770673a22d3874a00a7b47ef524515a4894338`, `96330524b6596781f59052309b4a2b00228a0b2a`, `cc495f07c6bf5563c8add9c0cc1019e7df9dc7b4`, `aea425098a6d23f6540dd23104ae4b7d7676ed89`, `05ad67c220a06700bacc63248bbdf59d3bf7fc4e`, `5bf8fb67168d85ba3bb85caeec7c4ad6e8e769bb`, `5f522270887a0c6f720f52af3ac50cff4827c27`, `726b523f0cd2f6b210520d914fb6dedf72ae63de`, `7532d37e745be2060d125d7d17c86a0480bb2295` e `06fabcafd3cbf8309668095aed471088befb09d7`, `6687eff002cb2c78dbe682101f4bd4dba20e86c5` e `4b41b5a90a9d4f13fa85d712ee75351d9f2f1c23` e `c07d528b89491a94e60615b952e8813aa774ad43` e `e10c212dd06105779577fded3b6badfec94d5ddf` aggiungono il terreno procedurale, correggono l’orientamento dei triangoli, introducono i quattro profili con superfici colorate, il controllo globale dell’altezza, l’avvio senza fullscreen automatico, le costruzioni procedurali, la città compatta di grattacieli e il volo in prima persona con hitbox, lo spawn sicuro, il drone delle dimensioni di un pallone, la hitbox sferica, il drone sferico in terza persona e lo sparo da joystick e l’allineamento esatto delle hitbox dei palazzi e la loro visualizzazione in giallo e l’allineamento del perimetro alle torri. Il codice è stato controllato sintatticamente, verificato nel browser e salvato direttamente su `main`.

## Prossimi sviluppi possibili

- rendere le hitbox più precise e aggiungere punti di interesse;
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

