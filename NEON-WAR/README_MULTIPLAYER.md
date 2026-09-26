# BRISCOLA MAGICATA — release multiplayer

Questo ramo contiene il server Node `server.js`, pronto per Render e MongoDB Atlas.

## Pubblicazione

1. Crea un database gratuito MongoDB Atlas e un utente dedicato.
2. In Render crea un nuovo **Web Service** dal repository, selezionando questo ramo.
3. Render legge `render.yaml`: build `npm install`, avvio `npm start`.
4. In Render aggiungi la variabile segreta `MONGODB_URI`, usando il formato di `.env.example`.
5. In Atlas autorizza la rete di Render; per iniziare può essere `0.0.0.0/0`, poi va limitata agli IP/documentazione Render quando disponibili.
6. Apri l'URL Render: frontend e API sono serviti dallo stesso dominio, quindi non richiedono CORS.

## API

- `POST /api/games` crea una partita e restituisce codice e token Player 1.
- `POST /api/games/:code/join` assegna Player 2 e restituisce il suo token.
- `GET /api/games/:code` restituisce lo stato, nascondendo mano e mazzo dell'altro giocatore.
- `POST /api/games/:code/action` applica una mossa solo lato server.
- `POST /api/games/:code/end-turn` conclude il turno solo lato server.

Il token va conservato nel browser del proprietario e non condiviso. Il codice partita è quello da inviare all'avversario.

## Limite attuale

La UI di sviluppo è ancora collegata al salvataggio locale. Il backend è verificato e pronto; il prossimo commit collegherà lobby, token e azioni della UI alle API e rimuoverà i comandi debug dalla release.
