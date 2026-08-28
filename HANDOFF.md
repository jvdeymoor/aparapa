# HANDOFF — progetto27

Aggiornato il 28 agosto 2026 dopo la revisione 42. Questo documento descrive lo stato corrente e sostituisce integralmente le note precedenti in caso di conflitto.

## Riferimenti

- Cartella locale di lavoro: /home/f/Documents/Codex/progetto27
- Repository: jvdeymoor/progetto27
- Branch pubblicato: main
- Sito: https://jvdeymoor.github.io/progetto27/
- GitHub Pages pubblica la cartella principale del branch main.
- Ultimo commit funzionale della revisione 42: 2aa28b6c7dd125f74cf975eca100976af6f6b49f
- Contatore visibile e costante REVISION_COUNT: 42

La fonte di verità è il repository remoto su GitHub. La cartella locale serve per Blender, verifiche e strumenti che richiedono file locali.

## Struttura corrente

- index.html: inizializzazione della scena, luci, renderer, menu iniziale, HUD e ciclo principale.
- drone.js: DRONE_SETTINGS e classe DroneController; contiene modello, movimento, collisioni, camera, mirino, input e laser.
- terrain.js: TERRAIN_SETTINGS, BUILDING_SETTINGS e classe TerrainWorld; contiene terreno, edifici, hitbox e confini.
- DRONE_v1.glb: asset del drone già normalizzato nelle unità e negli assi del gioco.
- DRONE_v1.blend: sorgente Blender modificabile del medesimo asset, con trasformazioni applicate.
- avvia-locale.py: server HTTP locale e apertura automatica del browser.
- HANDOFF.md: stato operativo del progetto.

I parametri modificabili sono raccolti all’inizio dei rispettivi file e segnalati da commenti facili da trovare:

- CERCA: SETTAGGI SCENA in index.html
- CERCA: SETTAGGI DRONE in drone.js
- CERCA: SETTAGGI TERRENO in terrain.js
- CERCA: SETTAGGI EDIFICI in terrain.js
- CERCA: SETTAGGI AVVIO LOCALE in avvia-locale.py

Le classi e i parametri pubblici hanno commenti semplici in italiano. Per il normale bilanciamento usare questi blocchi, senza modificare la logica interna.

## Stato del gioco

È disponibile un mondo 3D urbano giocabile con:

- centro cittadino piatto e cintura esterna montuosa;
- terreno procedurale deterministico a chunk da 64 unità e 32 segmenti per lato;
- raggio di caricamento 3, quindi fino a una griglia 7 × 7 attorno al drone;
- limite invisibile della mappa a 192 unità dal centro;
- città centrale fino a 400 edifici;
- edifici alieni leggeri con geometria e materiali riutilizzati, rientri e nicchie che non aumentano la hitbox;
- hitbox AABB aderenti al corpo visibile degli edifici;
- drone con hitbox sferica di raggio 0,38;
- collisioni con rimbalzo, quota minima sul terreno e quota massima;
- laser con pooling, durata limitata e massimo 32 elementi attivi;
- cielo, nebbia, luci, ombre contenute e nuvole;
- schermata iniziale con pulsante INIZIA e nessuna richiesta automatica di schermo intero.

Three.js 0.160.0 e GLTFLoader sono caricati tramite import map da jsDelivr.

## Controlli

Desktop:

- W accelera in avanti.
- Mouse controlla yaw e pitch; il pointer lock viene usato quando disponibile.
- Il trascinamento sul canvas resta il fallback quando il browser rifiuta il pointer lock.
- Click sinistro spara.
- Esc libera il puntatore.
- Le frecce e gli altri tasti non controllano il drone.

Mobile:

- Il joystick sinistro dà accelerazione mentre è premuto.
- Stick verso l’alto oltre la soglia: accelera e spara a raffica.
- Stick verso il basso oltre la soglia: spara da fermo.
- Lo swipe sul lato destro controlla yaw e pitch.
- I controlli mobile sono mostrati solo con puntatore coarse e larghezza massima 900 px.

Non aggiungere testi di istruzioni permanenti nello HUD senza una richiesta esplicita. Il contatore resta visibile in alto; il pulsante quadrato in alto a destra attiva e disattiva la terza persona.

## Movimento, camera e mirino

La fisica vive nel gruppo invisibile flyer; la mesh è soltanto la rappresentazione visiva e non sostituisce la hitbox.

- Il volo usa la direzione calcolata da yaw e pitch.
- L’ordine di rotazione del flyer è YXZ.
- Il pitch visivo del modello segue il movimento realmente ottenuto nel frame. In questo modo il drone non appare impennato di circa 90° quando collisioni, terreno o limiti impediscono un movimento verticale equivalente.
- La prima persona usa una camera sul muso con offset 0,18712463414227523.
- La terza persona è una chase camera con distanza 2 e altezza 1,25.
- In terza persona il mirino proietta la direzione reale di volo davanti al drone; non deve restare fissato al centro della mesh.
- Durante le virate il modello esegue un rollio smorzato sul proprio asse longitudinale.
- Il valore corrente maxTurnBankDegrees è 50.
- Il rollio è più leggero senza accelerazione, con fattore 0,6.
- bankDirection è -1, cioè il verso richiesto nell’ultima correzione.
- Entrata, mantenimento e ritorno del rollio sono regolabili in DRONE_SETTINGS.

Non modificare fisica, hitbox o rapporto tra movimento e modello senza una richiesta esplicita.

## Asset DRONE_v1 e Blender

Dalla revisione 42 orientamento, posizione e scala non vengono più corretti da JavaScript. Sono incorporati direttamente in DRONE_v1.glb e DRONE_v1.blend.

Stato canonico dell’asset:

- nome oggetto Blender: DRONE_v1
- nome mesh: DRONE_v1_Mesh
- posizione oggetto: 0, 0, 0
- rotazione oggetto: 0°, 0°, 0°
- scala oggetto: 1, 1, 1
- apertura tra le estremità delle ali: 0,76 unità
- una unità Blender corrisponde a una unità del gioco
- assi Blender: fronte +Y, alto +Z, ali lungo X
- assi Three.js/GLB: fronte -Z, alto +Y, ali lungo X
- l’origine corrisponde esattamente al centro del controller usato prima della normalizzazione

Il vecchio caricamento eseguiva al runtime:

1. centratura tramite il bounding box originale;
2. scala uniforme 0,0562962962963;
3. rotazione locale Y di 180°;
4. rotazione locale X di 103,2°.

Queste trasformazioni sono ora applicate ai vertici dell’asset. drone.js carica la scena GLB a posizione zero, rotazione zero e scala uno. Non reintrodurre le vecchie correzioni.

Il confronto fra il vecchio risultato runtime e il nuovo GLB normalizzato ha dato un errore massimo fra vertici inferiore a 0,00000007 unità. Il file pubblicato è stato inoltre verificato nel gioco locale e su GitHub Pages.

L’URL corrente è ./DRONE_v1.glb?rev=42. Quando il binario viene sostituito in futuro, incrementare anche questa query di versione per evitare che il browser combini codice nuovo e GLB in cache vecchio.

### Come modificare il drone in Blender

1. Aprire DRONE_v1.blend, non il vecchio GLB recuperato dalla cronologia.
2. Modificare normalmente la mesh in Edit Mode.
3. Non ruotare, spostare o scalare l’oggetto per correggere l’orientamento: il file è già pronto per il gioco.
4. Se una trasformazione in Object Mode è davvero necessaria, applicarla prima dell’esportazione e riportare l’oggetto a posizione 0, rotazione 0 e scala 1.
5. Esportare in GLB con asse Y verso l’alto e trasformazioni applicate, sovrascrivendo DRONE_v1.glb.
6. Aggiornare la versione cache in drone.js, incrementare il contatore e verificare prima locale e poi online.

Il file blend contiene anche proprietà personalizzate con gli assi, l’apertura alare, il raggio della hitbox e una nota sulle trasformazioni.

Blender usato nella sessione: 4.0.2. L’importatore GLTF inizialmente non trovava numpy; il problema è stato risolto aggiungendo al Python 3.12 di Blender il site-packages già incluso nel runtime Codex. Non è stato necessario installare nulla.

## Avvio locale

Non aprire index.html con file://: i moduli ES e il GLB vengono bloccati dalle regole di sicurezza del browser.

Dalla cartella /home/f/Documents/Codex/progetto27 eseguire:

    python3 avvia-locale.py

Il launcher usa per impostazione predefinita http://127.0.0.1:8765/ e apre il browser. Si può passare una porta diversa come primo argomento. Fermare il server con Ctrl+C.

## Cronologia della sessione: revisioni 34–42

- Revisione 34, commit 64f137c: ordine di rotazione YXZ per rendere coerenti le rotazioni del modello in tutte le direzioni.
- Revisione 35, commit d0dd3ac: mirino in terza persona proiettato nella direzione di volo, pitch visivo basato sul movimento reale e primo rollio di virata.
- Revisione 36, commit 752589d: correzione dell’inclinazione interna originale del modello di 13,2°.
- Revisione 37, commit 50a35cd: rollio massimo portato a 50°.
- Revisione 38, commit 83ddbd0: rollio più rapido, sostenuto e leggibile durante la virata.
- Revisione 39, commit b56a3b6: inversione del verso del rollio.
- Revisione 40, commit b816731, 5772bf1 e 630b846: separazione in drone.js e terrain.js, blocchi di settaggi e commenti italiani.
- Revisione 41, commit 064e2ab e 1ce22a8: launcher HTTP locale e documentazione del problema file://.
- Revisione 42, commit 2aa28b6: trasformazioni incorporate nel GLB, aggiunta del file blend, rimozione delle correzioni runtime e cache bust dell’asset.

## Regole operative

- Prima di modificare, leggere lo stato corrente di main su GitHub.
- Pubblicare le modifiche al progetto direttamente sul branch main tramite il connettore GitHub.
- Incrementare sempre sia il numero HTML iniziale sia REVISION_COUNT per ogni revisione del codice.
- Dopo la pubblicazione attendere GitHub Pages, aprire un URL con query nuova e controllare revisione, console e comportamento reale.
- Aggiornare HANDOFF.md soltanto quando l’utente lo chiede esplicitamente.
- Quando viene aggiornato, modificare prima HANDOFF.md remoto e poi la copia locale, mantenendoli identici.
- Per operazioni Blender verificare prima connessione, versione e scena; segnalare eventuali errori.
- Non salvare credenziali, token o password nel repository.
