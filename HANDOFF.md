# HANDOFF — progetto27

Aggiornato il 28 agosto 2026 dopo la revisione 58. Questo documento descrive lo stato corrente e sostituisce integralmente le note precedenti in caso di conflitto.

## Riferimenti

- Cartella locale di lavoro: /home/f/Documents/Codex/progetto27
- Repository: jvdeymoor/progetto27
- Branch locale: main
- Nessun remote è configurato nel repository Git locale di questa cartella.
- Branch pubblicato su GitHub: main.
- Sito: https://jvdeymoor.github.io/progetto27/
- GitHub Pages pubblica la cartella principale del branch main.
- Ultimo commit pubblicato della revisione 48: 026618f6ae0966f29e758f8ea6a7d29a3f4b9917
- Ultimo commit funzionale locale della revisione 58: 2fa6fce
- Tag locale di riferimento precedente: TEST0 sul commit 4fa3208
- Contatore visibile e costante REVISION_COUNT: 58
- avviare blender con bridge attivo: /home/f/Documents/Codex/progetto27/avvia_blender_codex.sh

Le revisioni 49–58 sono state sviluppate e salvate prima nel Git locale. La pubblicazione richiesta in questa sessione porta gli stessi file funzionali sul branch main remoto.

## Struttura corrente

- index.html: inizializzazione della scena, luci, renderer, menu iniziale, HUD e ciclo principale.
- drone.js: DRONE_SETTINGS e classe DroneController; contiene modello, movimento, collisioni, camera, mirino, input e laser.
- terrain.js: TERRAIN_SETTINGS, BUILDING_SETTINGS e classe TerrainWorld; contiene terreno, edifici, hitbox e confini.
- DRONE_v2.glb: modello attualmente caricato dal gioco, separato nei nodi DRONE_BODY e DRONE_BLADES.
- DRONE_v2.blend: sorgente Blender canonico con gli oggetti DRONE_BODY e DRONE_BLADES.
- DRONE_v1.glb e DRONE_v1.blend: versione precedente, conservata ma non più usata dal player.
- killer.png: immagine di riferimento usata per DRONE_v2.
- avvia-locale.py: server HTTP locale e apertura automatica del browser.
- HANDOFF.md: stato operativo del progetto.

I parametri modificabili sono raccolti all’inizio dei rispettivi file e segnalati da commenti facili da trovare:

- CERCA: SETTAGGI SCENA in index.html
- CERCA: SETTAGGI DRONE in drone.js
- CERCA: SETTAGGI TERRENO in terrain.js
- CERCA: SETTAGGI EDIFICI in terrain.js
- CERCA: SETTAGGI AVVIO LOCALE in avvia-locale.py

Le classi e i parametri pubblici hanno commenti semplici in italiano. Per il normale bilanciamento usare questi blocchi senza modificare la logica interna.

## Stato del gioco

È disponibile un mondo 3D urbano giocabile con:

- centro cittadino piatto e cintura esterna montuosa;
- terreno procedurale deterministico a chunk da 64 unità e 32 segmenti per lato;
- raggio di caricamento 3, quindi fino a una griglia 7 × 7 attorno al drone;
- limite invisibile della mappa a 192 unità dal centro;
- città centrale fino a 400 edifici;
- edifici alieni leggeri con geometria e materiali riutilizzati;
- hitbox AABB aderenti al corpo visibile degli edifici;
- drone con hitbox sferica di raggio 0,38;
- collisioni con rimbalzo, quota minima sul terreno e quota massima;
- laser con pooling, durata limitata e massimo 32 elementi attivi;
- cielo, nebbia, luci, ombre contenute e nuvole;
- schermata iniziale con pulsante INIZIA e nessuna richiesta automatica di schermo intero.

Three.js 0.160.0 e GLTFLoader sono caricati tramite import map da jsDelivr.

## Controlli

Desktop:

- W o il pulsante destro del mouse accelerano in avanti.
- Mouse controlla yaw e pitch; il pointer lock viene usato quando disponibile.
- Il trascinamento sul canvas resta il fallback quando il browser rifiuta il pointer lock.
- Il pulsante sinistro spara subito e continua a raffica finché resta premuto.
- Sinistro, destro e movimento del mouse sono indipendenti e funzionano contemporaneamente.
- Esc libera il puntatore.
- Le frecce e gli altri tasti non controllano il drone.

Mobile:

- Il joystick sinistro dà accelerazione mentre è premuto.
- Stick verso l’alto oltre la soglia: accelera e spara a raffica.
- Stick verso il basso oltre la soglia: spara da fermo.
- Tutta la superficie libera del display controlla yaw e pitch tramite swipe; joystick e pulsanti sono esclusi.
- Durante uno swipe il rollio resta nell’ultima posizione finché il dito rimane appoggiato e comincia a rientrare soltanto al rilascio.
- Il rollio mobile usa la distanza totale del gesto normalizzata al 12% del lato corto dello schermo, quindi non dipende dalla densità o dalla risoluzione del telefono.
- I controlli mobile sono mostrati solo con puntatore coarse e larghezza massima 900 px.

Non aggiungere testi di istruzioni permanenti nello HUD senza una richiesta esplicita. Il contatore resta visibile in alto; il pulsante quadrato in alto a destra attiva e disattiva la terza persona.

## Movimento, camera e mirino

La fisica vive nel gruppo invisibile flyer; la mesh è soltanto la rappresentazione visiva e non sostituisce la hitbox.

- Il volo usa la direzione calcolata da yaw e pitch.
- L’ordine di rotazione del flyer è YXZ.
- Il pitch visivo del modello segue il movimento realmente ottenuto nel frame. Il drone quindi non appare impennato quando collisioni, terreno o limiti impediscono un movimento verticale equivalente.
- In prima persona il corpo usa un layer separato e non viene renderizzato; le falci restano visibili.
- La camera locale desktop e mobile usa attualmente Z = 0,10.
- Il desktop usa FOV base 85° e zoom manuale 2; il mobile usa FOV base 105° e zoom manuale 1,4.
- Gli zoom sono regolabili separatamente in DRONE_SETTINGS senza modificare fisica o terza persona.
- La terza persona conserva il FOV della scena di 74°, distanza 2 e altezza 1,25.
- In terza persona il mirino proietta la direzione reale di volo davanti al drone; non resta fissato al centro della mesh.
- Durante le virate il modello esegue un rollio smorzato sul proprio asse longitudinale.
- maxTurnBankDegrees è 50 e bankDirection è -1.
- Il rollio senza accelerazione usa il fattore 0,6.
- Entrata, mantenimento e ritorno del rollio sono regolabili in DRONE_SETTINGS.

Non modificare fisica, hitbox o rapporto fra movimento e modello senza una richiesta esplicita.

## Asset DRONE_v2 e Blender

DRONE_v2 è un modello low-poly costruito a partire da killer.png. Il gioco lo usa direttamente senza correzioni JavaScript di posizione, rotazione o scala.

Stato canonico dell’asset dalla revisione locale 49:

- oggetti Blender: DRONE_BODY e DRONE_BLADES
- mesh: DRONE_BODY_Mesh e DRONE_BLADES_Mesh
- posizione di entrambi gli oggetti: 0, 0, 0
- rotazione di entrambi gli oggetti: 0°, 0°, 0°
- scala di entrambi gli oggetti: 1, 1, 1
- una unità Blender corrisponde a una unità del gioco
- assi Blender: fronte +Y, alto +Z, ali lungo X
- assi Three.js/GLB: fronte -Z, alto +Y, ali lungo X
- raggio massimo della mesh: 0,372
- raggio della hitbox sferica: 0,38
- mesh sorgente Blender complessiva: 446 vertici e 840 triangoli
- DRONE_BODY: 206 vertici e 376 triangoli
- DRONE_BLADES: 240 vertici e 464 triangoli
- limiti conservati nelle proprietà Blender: 1303 vertici e 2343 triangoli
- falci esterne orizzontali e falci interne verticali

Il cockpit è stato accorciato nella revisione 48: il punto frontale del corpo procedurale è passato da 0,205 a 0,155 prima della normalizzazione. Sono stati rimossi anche i tre pannelli verdi rettangolari che si trovavano sotto la vecchia gabbia. La gabbia tubolare, le piastre segnate dall’utente e le aste esterne erano già state eliminate nella revisione 46.

L’URL attivo è ./DRONE_v2.glb?rev=49. Ogni volta che il binario viene sostituito, incrementare questa query per evitare che il browser combini codice nuovo e GLB in cache vecchio.

### Come modificare il drone in Blender

1. Aprire DRONE_v2.blend.
2. Modificare DRONE_BODY o DRONE_BLADES senza usare rotazioni, spostamenti o scale dell’oggetto per correggere l’orientamento.
3. Conservare per entrambi posizione 0, rotazione 0 e scala 1.
4. Mantenere ogni vertice entro il raggio 0,38 e restare sotto 1303 vertici e 2343 triangoli.
5. Esportare in GLB con asse Y verso l’alto e trasformazioni applicate, sovrascrivendo DRONE_v2.glb.
6. Aggiornare modelUrl in drone.js, il contatore HTML e REVISION_COUNT.
7. Verificare prima in locale e poi su GitHub Pages sia la prima sia la terza persona.

Il file blend contiene proprietà personalizzate con assi, disposizione delle falci, raggio della hitbox, limiti geometrici e nota sulle trasformazioni.

Blender verificato in questa sessione: 4.0.2. La scena contiene due oggetti, DRONE_BODY e DRONE_BLADES. Il runtime Python di Blender usa `/tmp/blender_pydeps` per la dipendenza numpy necessaria all’esportazione GLB.

## Avvio locale

Non aprire index.html con file://: i moduli ES e il GLB vengono bloccati dalle regole di sicurezza del browser.

Dalla cartella /home/f/Documents/Codex/progetto27 eseguire:

    python3 avvia-locale.py

Il launcher usa per impostazione predefinita http://127.0.0.1:8765/ e apre il browser. Si può passare una porta diversa come primo argomento. Fermare il server con Ctrl+C.

Il server ascolta su 0.0.0.0 e stampa anche l’indirizzo LAN utilizzabile da un cellulare sulla stessa rete Wi-Fi. In questa sessione l’indirizzo rilevato era http://192.168.1.2:8765/; può cambiare dopo una riconnessione di rete.

## Cronologia della sessione: revisioni 34–48

- Revisione 34, commit 64f137c: ordine di rotazione YXZ per rendere coerenti le rotazioni del modello in tutte le direzioni.
- Revisione 35, commit d0dd3ac: mirino in terza persona proiettato nella direzione di volo, pitch visivo basato sul movimento reale e primo rollio di virata.
- Revisione 36, commit 752589d: correzione dell’inclinazione interna originale del modello di 13,2°.
- Revisione 37, commit 50a35cd: rollio massimo portato a 50°.
- Revisione 38, commit 83ddbd0: rollio più rapido, sostenuto e leggibile durante la virata.
- Revisione 39, commit b56a3b6: inversione del verso del rollio.
- Revisione 40, commit b816731, 5772bf1 e 630b846: separazione in drone.js e terrain.js, blocchi di settaggi e commenti italiani.
- Revisione 41, commit 064e2ab e 1ce22a8: launcher HTTP locale e documentazione del problema file://.
- Revisione 42, commit 2aa28b6: trasformazioni incorporate in DRONE_v1, aggiunta del blend e rimozione delle correzioni runtime.
- Revisione 43, commit 202c598 e 2dbd9d3: creazione e attivazione di DRONE_v2 ispirato a killer.png, con cache bust del modulo.
- Revisione 44, commit 7e95104: correzione della posa neutra di DRONE_v2.
- Revisione 45, commit 7d53f54: falci esterne orizzontali e falci interne verticali.
- Revisione 46, commit 2636783: rimozione delle piastre indicate, delle aste esterne e della gabbia tubolare del cockpit.
- Revisione 47, commit 52f2485: prima persona con quattro punte visibili, camera sul muso e FOV dedicato; terza persona invariata.
- Revisione 48, commit 026618f: cockpit accorciato e rimozione dei tre pannelli verdi sotto la vecchia gabbia.

## Verifiche della revisione 48

- Blender 4.0.2 collegato e scena valida.
- Un solo oggetto DRONE_v2 con trasformazioni canoniche.
- 446 vertici, 840 triangoli, raggio massimo 0,372 entro l’hitbox 0,38.
- DRONE_v2.blend e DRONE_v2.glb riesportati insieme.
- Prima persona locale libera dal cockpit con quattro falci visibili.
- Terza persona locale verificata senza errori di console.
- GitHub Pages mostra la revisione 48; prima persona online caricata senza errori di console usando una query nuova.

## Cronologia locale della sessione: revisioni 49–58

- Revisione 49, commit locale 956194e: separazione Blender/GLB in DRONE_BODY e DRONE_BLADES, layer distinti e prime camere/FOV separati.
- Revisione 50, commit locale 08c4662: correzione dell’assegnazione layer alle primitive figlie create da GLTFLoader.
- Revisione 51, commit locale 33293d3: zoom manuale della prima persona desktop; il successivo commit 4fa3208 è marcato dal tag locale TEST0.
- Revisione 52, commit locale 4fa7837: avvio HTTP accessibile dalla LAN e stampa dell’indirizzo per il cellulare.
- Revisione 53, commit locale 0ac738e: zoom manuale separato per la prima persona mobile.
- Revisione 54, commit locale 7241e2c: accelerazione con tasto destro e fuoco continuo con sinistro su desktop.
- Revisione 55, commit locale 79a13fa: prima separazione degli stati dei due pulsanti del mouse.
- Revisione 56, commit locale a4fdc7c: gestione desktop basata sul bitmask reale dei pulsanti, con movimento, fuoco e accelerazione simultanei.
- Revisione 57, commit locale 19b97ee: area swipe mobile estesa all’intero display libero e ritorno del rollio rinviato al rilascio del dito.
- Revisione 58, commit locale 2fa6fce: rollio mobile calcolato dalla distanza totale normalizzata del gesto e mantenuto esattamente finché il dito resta sul display.

## Verifiche delle revisioni 49–58

- Blender 4.0.2 collegato tramite bridge MCP; DRONE_BODY e DRONE_BLADES hanno trasformazioni canoniche.
- Geometria complessiva invariata: 446 vertici, 840 triangoli e raggio massimo 0,372 entro l’hitbox 0,38.
- GLB verificato con due nodi e 840 triangoli; query modello aggiornata a rev=49.
- Sintassi JavaScript verificata come modulo ES e `git diff --check` eseguito dopo le revisioni.
- Server locale verificato su 127.0.0.1:8765 e server LAN verificato con indirizzo 192.168.1.2:8765.
- Normalizzazione rollio verificata su viewport 360×800, 430×932 e relativi landscape: uno spostamento pari al 12% del lato corto produce sempre input 1,0.
- Il browser automatizzabile non era disponibile durante la revisione 58; la verifica tattile reale su più telefoni resta da confermare dopo la pubblicazione.

## Regole operative

- Prima di modificare, leggere lo stato corrente di main su GitHub.
- Pubblicare le modifiche al progetto direttamente sul branch main tramite il connettore GitHub.
- Incrementare sempre sia il numero HTML iniziale sia REVISION_COUNT per ogni revisione del codice.
- Quando cambia il GLB, incrementare anche la query modelUrl.
- Dopo la pubblicazione attendere GitHub Pages, aprire un URL con query nuova e controllare revisione, console e comportamento reale.
- Aggiornare HANDOFF.md soltanto quando l’utente lo chiede esplicitamente.
- Quando viene aggiornato, modificare prima HANDOFF.md remoto e poi la copia locale, mantenendoli identici.
- Per operazioni Blender verificare prima connessione, versione e scena; segnalare eventuali errori.
- Non salvare credenziali, token o password nel repository.
