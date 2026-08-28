# Handoff — progetto27

## Progetto

- Base principale del progetto: `/home/f/Documents/Codex/progetto27` (cartella da usare come riferimento operativo per il lavoro locale).
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
- il drone resta sopra il terreno e i chunk seguono la sua posizione;
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

Codex è ora collegato a Blender per poter lavorare direttamente sulle scene e visualizzare le modifiche nel viewport; Blender deve rimanere aperto durante questo tipo di lavoro.

## Regole operative

- **Fonte di verità:** per il progetto fa fede il contenuto remoto del repository GitHub `jvdeymoor/progetto27`, sul branch `main`. La copia locale non sostituisce GitHub.
- **Aggiornamento dell’handoff:** modificare `HANDOFF.md` solo quando l’utente lo chiede esplicitamente. Ogni aggiornamento deve essere applicato prima all’handoff remoto su GitHub e poi replicato nell’handoff locale, mantenendo i due file identici.
- **Lavoro sul progetto e working tree:** file, modifiche, commit, pubblicazione e controllo dello stato del progetto si gestiscono direttamente su GitHub; non trattare la cartella locale come working tree o fonte di verità del progetto.
- **Uso del percorso locale:** quando serve un percorso locale per analisi, test o strumenti che richiedono file locali, usare esclusivamente `/home/f/Documents/Codex/progetto27`, indicato nell’handoff locale. Dopo il lavoro, la versione di riferimento resta quella remota su GitHub.
- **Connessione a GitHub:** usare il connettore/plugin GitHub per leggere il repository `jvdeymoor/progetto27`, verificare il branch `main`, leggere i file remoti e controllare l’ultimo commit prima di operare. Per modifiche al repository usare le operazioni GitHub autorizzate e verificare il risultato remoto.
- **Controllo del bridge Blender:** Blender deve essere aperto. Verificare il collegamento con `blender_ping`, quindi controllare versione e scena con `blender_version` e `blender_scene_info`. Quando serve un controllo operativo, usare anche `blender_exec_python` in sola lettura e/o `blender_capture_viewport`; riportare chiaramente eventuali errori o se è caricata la scena predefinita invece della scena del progetto.

## Ultima modifica

I commit `666c77d7b7136af16a4d1d57ebe2092231246244`, `64f711a57d554076b1986238a48e3d1533956239`, `5f4d3ad4da1cb3d7a13ceefd8dd14378dbe674b7`, `575e138c2e1e974ad1d176a80daaeb581f8a5af3`, `91526c4971a717fbeeca85c1b3d4cfe1f8aa1305`, `51770673a22d3874a00a7b47ef524515a4894338`, `96330524b6596781f59052309b4a2b00228a0b2a`, `cc495f07c6bf5563c8add9c0cc1019e7df9dc7b4`, `aea425098a6d23f6540dd23104ae4b7d7676ed89`, `05ad67c220a06700bacc63248bbdf59d3bf7fc4e`, `5bf8fb67168d85ba3bb85caeec7c4ad6e8e769bb`, `5f522270887a0c6f720f52af3ac50cff4827c27`, `726b523f0cd2f6b210520d914fb6dedf72ae63de`, `7532d37e745be2060d125d7d17c86a0480bb2295` e `06fabcafd3cbf8309668095aed471088befb09d7`, `6687eff002cb2c78dbe682101f4bd4dba20e86c5` e `4b41b5a90a9d4f13fa85d712ee75351d9f2f1c23` e `c07d528b89491a94e60615b952e8813aa774ad43` e `e10c212dd06105779577fded3b6badfec94d5ddf` aggiungono il terreno procedurale, correggono l’orientamento dei triangoli, introducono i quattro profili con superfici colorate, il controllo globale dell’altezza, l’avvio senza fullscreen automatico, le costruzioni procedurali, la città compatta di grattacieli e il volo in terza persona con drone sferico, hitbox e sparo, lo spawn sicuro e l’allineamento delle hitbox dei palazzi alle torri. Il commit attuale di `index.html` è `e10c212dd06105779577fded3b6badfec94d5ddf`. Il codice è stato controllato sintatticamente, verificato nel browser e salvato direttamente su `main`.

## Prossimi sviluppi possibili

- aggiungere collisioni con punti di interesse;
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


## ULTIMI AGGIORNAMENTI

Aggiornato il 2026-08-28 dopo la revisione completa della chat. Questa sezione raccoglie le regole e le decisioni più recenti, che hanno precedenza sulle descrizioni più vecchie presenti sopra quando sono in conflitto.

### Controlli e comportamento del drone

- Le frecce non servono per ruotare il drone e non devono essere presentate come controlli. Su PC l’unico tasto di movimento è **W** per accelerare; il click sinistro spara. Il mouse controlla la visuale tramite pointer lock quando disponibile; **Esc** libera il mouse. Gli altri tasti non fanno nulla.
- Su mobile il joystick serve per accelerare; spingendolo verso l’alto si spara mentre si accelera, tirandolo verso il basso si spara da fermo. Tutte le rotazioni e il controllo della visuale avvengono con swipe della mano destra sullo schermo.
- I controlli mobile devono sparire sugli schermi grandi; il riferimento attuale è la media CSS `(pointer: coarse) and (max-width: 900px)`.
- Non modificare il movimento, la fisica o gli hitbox del player senza una richiesta esplicita. La propulsione di verifica richiesta nella chat appartiene esclusivamente al modello 3D decorativo, non al player.
- Non aggiungere testi di istruzioni come “premi”, “vola” o “swipe” nella scena/HUD. Il titolo “Il mio mondo” in alto è stato rimosso; deve restare solo il contatore.

### Modello 3D DRONE_v1

- `DRONE_v1.glb` viene caricato dalla cartella locale `/home/f/Documents/Codex/progetto27` per l’analisi e dall’asset `./DRONE_v1.glb` nel sito. È un modello decorativo separato: non è il modello del player e non deve essere usato come sua hitbox o controller.
- A inizio partita il modello viene piazzato circa un metro davanti alla camera/player.
- Il punto zero/rotazione predefinita dello spawn usa **+90° sull’asse X** (non -90°), mantenendo l’allineamento Y già presente nel codice.
- Per la verifica visiva, la propulsione costante è applicata soltanto al modello DRONE_v1. L’ultima direzione impostata è l’asse globale X positivo: `decorativeDroneDirection.set(1, 0, 0)`, con velocità `1.8`. Il player deve rimanere fermo senza input.
- Se viene cambiato l’orientamento del modello, verificare sempre che punta, asse di traslazione e direzione di volo coincidano; non correggere il problema spostando la propulsione sul player.

### Città, terreno e hitbox

- La zona di gioco è un blocco centrale urbano con terreno piatto, circondato da una cintura senza edifici in cui il terreno sale e diventa montagnoso/variegato. Un grande limite invisibile chiude l’area giocabile.
- La generazione procedurale è stata riscritta e la città può contenere al massimo **400 edifici**; l’ultima richiesta di 400 sostituisce il precedente limite di 300.
- Gli edifici devono essere semplici e diversi tra loro, costruiti con una mesh condivisa e computazionalmente leggera: parallelepipedi con finte finestre/architettura aliena, scanalature verticali, nicchie scavate e anelli/rientranze verso l’interno. Evitare anelli o dettagli che sporgono e possono creare intersezioni.
- Ogni hitbox di edificio deve essere sempre un parallelepipedo AABB aderente alla parte visibile della torre/muro. Non deve includere podio, fondamenta o volume extra; il drone non può scendere al livello del podio.
- Il terreno deve essere sempre presente. La zona centrale resta piatta, mentre la cintura esterna usa rilievi montagnosi e colori/varietà coerenti.
- Mantenere le ombre a risoluzione contenuta e privilegiare la semplicità delle mesh, il riuso delle geometrie e il limite ai laser attivi.

### Proiettili e prestazioni

- I laser devono andare dritti nella direzione di sparo, avere una durata limitata e scaricarsi automaticamente.
- Il sistema usa pooling, geometria/materiale riutilizzati e un limite agli elementi attivi; evitare di creare e distruggere continuamente mesh durante il gioco.
- Per la pagina Three.js, usare un import map coerente per `three` e `three/addons/`; il precedente import diretto del loader con lo specifier bare `three` bloccava il caricamento della pagina.

### Contatore e abitudini di lavoro

- Il contatore visibile è un contatore di revisione del progetto, non un valore di gameplay. Dopo l’ultima modifica al progetto il valore corrente è **33**.
- Incrementare sempre il contatore a ogni modifica pubblicata al codice del progetto e aggiornare sia il valore HTML iniziale sia `MODIFICATION_COUNT` in `index.html`.
- Prima di chiudere una modifica: leggere/verificare il contenuto remoto su GitHub `main`, controllare la sintassi, verificare la pagina pubblicata e controllare che non compaiano errori JavaScript.
- La fonte di verità resta il repository remoto GitHub `jvdeymoor/progetto27`; il lavoro sul codice va salvato direttamente su `main`. La copia locale serve per analisi o strumenti locali.
- Quando GitHub Pages mostra ancora una versione precedente, considerare la propagazione/cache e usare un ricaricamento senza cache o un URL di verifica con query string.
- Quando l’utente chiede una modifica al progetto, mantenere le regole sopra, aggiornare il contatore e non ripristinare comportamenti già esclusi senza una nuova richiesta esplicita.


### Aggiornamento della sessione del 2026-08-28 — revisioni 24–33

Queste note sostituiscono ogni istruzione precedente in conflitto.

- Il contatore di revisione corrente è **33**. L’ultimo commit di `index.html` è `142715fdf8f41466967349b152a389b561cb6718`; l’ultima revisione pubblicata è la 33.
- `DRONE_v1.glb` non è più un oggetto decorativo separato: è il modello visivo del player. Il controller, la fisica e l’hitbox restano nel gruppo sferico invisibile `flyer` con raggio `0,38`; il modello è figlio di quel controller e il suo centro geometrico coincide con il centro della hitbox.
- La distanza misurata tra le punte estreme delle ali è `13,5`. Il modello è scalato a `0,0562962963`, così l’apertura alare è `0,76`, uguale al diametro della hitbox. Non esiste più alcuna propulsione automatica di test.
- L’orientamento base attuale del modello usa `rotateY(Math.PI)` e `rotateX(Math.PI * 0.5)`, con la punta frontale allineata alla direzione di volo del player. Non modificare questo allineamento, né i controlli o la fisica, senza una nuova richiesta esplicita.
- In prima persona la camera è alla punta frontale del modello e resta nel volume dell’hitbox. In alto a destra c’è un unico pulsante senza testo per attivare/disattivare la terza persona; è giallo quando attiva. Non sono più presenti menu, slider, valori manuali o pulsanti testuali `3P`.
- La terza persona attuale è una chase camera: segue la posizione e la direzione orizzontale data da `yaw`, guarda il centro del player e usa distanza orizzontale `2` e altezza `1,25`. Questa configurazione è il ripristino della chase camera precedente, mantenendo il solo avvicinamento richiesto.
- La distanza minima orizzontale tra gli AABB degli edifici è `MIN_BUILDING_CLEARANCE = flyerHitboxRadius * 2 * 1.15`, cioè `0,874`. Il controllo avviene sia rispetto agli edifici del chunk corrente sia rispetto ai chunk già caricati.
- Le modifiche di questa sessione hanno prodotto i commit `6caea0f`, `9d4c05d`, `aebedb`, `cf924dd`, `87979e`, `a7a7fb`, `5f6503f`, `e4845b0`, `fcc2693` e `142715f`. GitHub Pages può mostrare una revisione precedente durante la propagazione/cache.
