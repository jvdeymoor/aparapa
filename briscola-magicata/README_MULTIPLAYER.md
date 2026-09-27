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

## Risorse locali

- `assets/images/cards/sprite-sheet.png`: 10×7 celle da 120×187.
- `src/data/art.js`: mappa delle 67 carte per nome nell'ordine del foglio;
  celle 68 e 69 inutilizzate, cella 70 usata come retro.
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
- `POST /api/games/:code/end-turn`: fine turno manuale anticipato.
- `POST /api/games/:code/leave`: chiude la stanza e avvisa l'avversario.

Il token resta nel browser proprietario: si condivide soltanto il codice o il link.
Render distribuisce `release-multiplayer`, con `npm install`, `npm start` e le
variabili `MONGODB_URI` e `ALLOWED_ORIGINS`. Non inserire credenziali nei file.

## Verifica e pubblicazione

`npm test` controlla motore, regressioni del danno/fine turno, 50 partite CPU,
mappa sprite, caricamento dei 22 GLB e flussi UI con DOM simulato.
Il test UI non sostituisce un controllo grafico su telefono.

Per le API avvia un server temporaneo senza MongoDB con `PORT=3011 node server.js`,
poi esegui `npm run test:api`. Il test crea e chiude una stanza locale.

Mantieni sincronizzata la copia `/home/f/aparapa-main/briscola-magicata/`.
In GitHub Desktop invia i commit da NEON-WAR / release-multiplayer per Render,
e da aparapa-main / pubblica-briscola (upstream origin/main) per il sito pubblico.
