# BRISCOLA MAGICATA — singleplayer e multiplayer

Il frontend pubblico è https://aparapa.com/briscola-magicata/ (GitHub Pages).
L'API multiplayer è https://aparapa.onrender.com (Node e MongoDB Atlas), configurata
in `window.CONFIG.MULTIPLAYER_API`. `ALLOWED_ORIGINS` abilita CORS per aparapa.com.

## Flusso di gioco

La lobby iniziale richiede una scelta:

- **SINGLEPLAYER**: componi il mazzo e avvia una partita contro la CPU. Il pulsante
  SINGLEPLAYER sospende la CPU e riapre la lobby; CONTINUA A GIOCARE riprende lo stato.
- **MULTIPLAYER**: componi il mazzo e crea una stanza, oppure inserisci il codice
  ricevuto e componi il mazzo per entrare. Durante la partita il pulsante
  MULTIPLAYER è disabilitato. L'invito WhatsApp contiene il link una sola volta.

Ogni mazzo contiene 38 carte scelte e 2 Magicate. L'avversario ha un mazzo indipendente.
Il motore termina automaticamente il turno quando non rimangono azioni legali:
conta anche gli attacchi dei Droni, che non consumano Energia. La UI mostra FINE TURNO.

I danni di Laser, Droni, Virus e Radiazioni attraversano **Scudi → Droni → Nucleo**,
in ordine di ingresso delle difese. I Droni distrutti perdono il Dominio prodotto.
I valori di un Drone indicano Attacco/Integrità, non Energia. L'esaurimento del mazzo
attraversa gli Scudi e colpisce il Nucleo. L'Intercettazione appartiene al difensore e
si consuma al primo Laser di almeno 4 danni. La penalità alle mosse dura un turno.
CHIUDI a fine partita cancella la sessione e ricarica la pagina, come ESCI.

## Preparazione iniziale (v1.0)

Ogni nuova partita ha `phase: preparation`. Ciascun giocatore vede le sue cinque carte
iniziali in una griglia fissa 3+2, con dettaglio/GIOCA come in partita. Il server assegna
Energia e budget mosse separati e autentica il proprietario delle azioni. I Laser e gli
attacchi dei Droni sono vietati: le carte a danno immediato sono oscurate con il messaggio
«NON SI PUO' ATTACCARE NEL PRIMO TURNO». Nel motore attuale Virus e Radiazioni sono
effetti differiti e sono consentiti; non si risolvono durante la preparazione.

`INIZIA` conferma anche senza carte utilizzabili e attende l'altro giocatore. Esaurire
le mosse non sostituisce questa conferma. Quando entrambi confermano, si passa a
`phase: battle`, turno 3 di Player 1, con la normale pesca/ricarica/risoluzione effetti.
La CPU prepara e conferma la propria mano automaticamente. Le carte pescate da Magicate
durante la preparazione sono conservate per la battaglia; la griglia resta la prima mano.
Le partite già salvate senza `phase` continuano normalmente, senza una preparazione retroattiva.

Le richieste della stessa stanza vengono serializzate prima della lettura/scrittura,
per evitare aggiornamenti persi durante azioni o conferme simultanee. La mano iniziale
dell'avversario (`openingHand`) è mascherata, come mano e mazzo.

## Interfaccia e arena

Lobby e configuratore coprono tutto lo schermo e rendono `inert` il gioco sottostante.
Le istruzioni `?` nella lobby tornano alla scelta della modalità quando vengono chiuse.
Nel configuratore solo le categorie scorrono: contatore «Carte scelte X/38» e pulsanti
Avvia/Indietro restano sotto il box. I + si disabilitano al totale di 38 o al limite
categoria; anche l'inserimento manuale rispetta il budget. Le Magicate sono fisse a 2,
senza +/- né spinner.

Il pulsante modalità è accanto alla stringa TURNO/PLAYER, come da correzione finale
della richiesta. La barra Briscola/Mosse resta libera. Registro è nel menu.
Le carte mostrano il costo effettivo in alto a destra, con il solo simbolo Energia
verde/rosso in base all'Energia disponibile. Gli elementi in campo mostrano il proprio
sprite nella riga e nel popup, a destra e a tutta altezza.

L'arena non ha più il tavolo: `src/render/space.js` crea 480 stelle da un pixel e
22 asteroidi procedurali in movimento sotto le cittadelle, capaci di ricevere ombre.
Il pool di geometrie viene riutilizzato all'infinito. Gli schieramenti sono avvicinati
al 70% della distanza precedente. Limiti zoom 0,412–4,08 e passo 0,34 (capacità +70%).
La cornice resta sotto HUD e controlli, con `pointer-events: none`. Canvas e cornice
condividono `arenaView`, traslato -2,8% in X e +1,7% in Y per compensare il margine
asimmetrico del foglio mostrato nello screenshot. Un ResizeObserver mantiene il canvas
allineato al suo contenitore. Zoom al centro in basso, espansione P1/P2 ai due angoli:
i pannelli coprono 75% della larghezza e tutta l'altezza, con lista scorrevole e chiusura
esterna. I nomi delle unità hanno la stessa dimensione delle intestazioni di categoria.
HUD in una riga per giocatore (PLAYER, cuore, fulmine) con fondo nero al 50%.

Luce direzionale con shadow map 2048 e due ampi asteroidi sempre sotto gli schieramenti
rendono possibili le ombre delle cittadelle e degli elementi anche dopo un lungo volo.
Gli altri asteroidi continuano a viaggiare e riciclarsi. Solo gli accenti dei droni
3D passano dal giallo chiaro a `#66501a`, con emissione ridotta: metallo e colori UI
restano invariati.

Versione visibile **v1.0** sotto il titolo (header e lobby), posizionata in assoluto
senza spostare il layout. Per le revisioni successive incrementare `APP_VERSION` in
`src/main.js` e il parametro della stessa versione su `src/main.js?v=...` in `index.html`.
Il foglio refinements usa automaticamente lo stesso parametro anticache.
`src/ui/refinements.css` contiene le nuove regole finali, senza cambiare le dimensioni
dei pannelli giocatori.

## Risorse locali

- `assets/images/cards/sprite-sheet.png`: 10×7 celle da 120×187.
- `src/data/art.js`: mappa delle 67 carte per nome nell'ordine del foglio;
  cella 68 inutilizzata, cella 69 ruotata di 90° come cornice trasparente
  dell’arena (SVG senza intercettare tocchi), cella 70 usata come retro.
- `assets/models/orbital/manifest.json`: quattro varianti per ogni famiglia,
  due cittadelle. Il renderer sceglie una variante casuale stabile per oggetto.
  Le Magicate sono effetti temporanei nell'arena; i Laser restano animazioni.
- `vendor/GLTFLoader.js` e `BufferGeometryUtils.js`: stessa release Three.js
  0.180.0 già presente, senza dipendenze remote.
- Palette: Scudo `#0fa7ef`, Virus `#bf1014`, Drone `#ffed9a`, Radiazione
  `#4cdd4d`, Laser `#fb8920`, Magicata `#e870e9`. I materiali incorporati conservano
  le proprietà fisiche; gli accenti cromatici sono armonizzati alla famiglia.

## API

- `POST /api/games`: crea stanza e token P1.
- `POST /api/games/:code/join`: assegna P2 e crea i mazzi.
- `GET /api/games/:code`: nasconde mano e mazzo avversari; recupera anche eventuali
  turni esauriti salvati prima dell'aggiornamento.
- `POST /api/games/:code/action`: valida e applica l'azione, incluso il fine turno automatico.
- `POST /api/games/:code/ready`: conferma la preparazione; avvia solo con entrambi pronti.
- `POST /api/games/:code/end-turn`: fine turno manuale anticipato.
- `POST /api/games/:code/leave`: chiude la stanza e avvisa l'avversario.

Il token resta nel browser proprietario: si condivide soltanto il codice o il link.
Render distribuisce `release-multiplayer`, con `npm install`, `npm start` e le
variabili `MONGODB_URI` e `ALLOWED_ORIGINS`. Non inserire credenziali nei file.

## Verifica e pubblicazione

`npm test` controlla motore, regressioni del danno/fine turno, 50 partite CPU,
mappa sprite, caricamento dei 22 GLB, flussi UI con DOM simulato e dieci minuti
di animazione spaziale simulata (limiti zoom e riutilizzo delle geometrie).
Sono inclusi test dedicati alla preparazione, a due conferme concorrenti via API,
alla segretezza della prima mano e alle superfici riceventi sotto le cittadelle.
Il test UI non sostituisce un controllo grafico su telefono.

Per le API avvia un server temporaneo senza MongoDB con `PORT=3011 node server.js`,
poi esegui `npm run test:api`. Il test crea e chiude una stanza locale.

Mantieni sincronizzata la copia `/home/f/aparapa-main/briscola-magicata/`.
In GitHub Desktop invia i commit da NEON-WAR / release-multiplayer per Render,
e da aparapa-main / pubblica-briscola (upstream origin/main) per il sito pubblico.
