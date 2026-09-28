# BRISCOLA MAGICATA

Gioco di carte con CPU locale e multiplayer a turni, anche asincrono.
Gioco pubblico: https://aparapa.com/briscola-magicata/

## Un solo progetto, un solo push

La sorgente da modificare è **NEON-WAR**, ramo **release-multiplayer** del repository
`jvdeymoor/aparapa`. La cartella locale è `/home/f/NEON-WAR`.

In GitHub Desktop basta fare commit e **Push origin** da quel progetto/ramo.
Il push aggiorna il backend Render e avvia il workflow **Pubblica BRISCOLA MAGICATA**:

1. Esegue i test del gioco e delle API.
2. Aspetta che Render serva lo stesso commit.
3. Genera soltanto i file necessari al browser in `main:briscola-magicata/`.
4. Crea automaticamente il commit sul ramo del sito e richiede il build GitHub Pages.

**Non modificare o copiare a mano il gioco in aparapa-main e non fare il secondo push.**
La cartella pubblica è un risultato generato, non un altro progetto da mantenere.
Gli altri progetti del sito, la home e il dominio non vengono sostituiti.
Il vecchio worktree locale del sito può restare disponibile per gli altri progetti;
prima di modificarli esegui Fetch/Pull, perché il bot può avere aggiornato `main`.

## Configurazione di pubblicazione

Non servono nuove chiavi o token personali: il workflow usa `GITHUB_TOKEN`, con
`contents: write` e `pages: write` soltanto nel job di pubblicazione.
Si appoggia alla configurazione esistente:

- Render: repository `jvdeymoor/aparapa`, ramo `release-multiplayer`, deploy automatico
  a ogni commit, comandi `npm install` e `npm start`, variabili MongoDB/CORS già impostate.
- GitHub Pages: **Deploy from a branch**, ramo **main**, cartella **/ (root)**,
  dominio **aparapa.com**. Non passare a una diversa sorgente Pages per questa procedura.
- GitHub Actions deve essere abilitato; le protezioni di `main` devono consentire al
  workflow il commit generato. Non viene usato force-push e non vengono cambiate protezioni.

I commit del token Actions non avviano Pages da soli: lo script chiede esplicitamente
il build tramite l'[API ufficiale Pages](https://docs.github.com/en/rest/pages/pages#request-a-github-pages-build).
`/api/health` espone il commit Render per verificare l'ordine backend → frontend,
utilizzando [RENDER_GIT_COMMIT](https://render.com/docs/environment-variables).

Il primo avvio remoto si verifica dopo il primo push che contiene il workflow.
Se fallisce, apri GitHub → Actions → Pubblica BRISCOLA MAGICATA e leggi il passaggio
rosso. Dopo la correzione puoi usare **Re-run failed jobs**. Un errore nei test,
nel deploy Render o nella configurazione Pages ferma la pubblicazione del frontend.
Se `main` è avanzato durante l'export, il push viene rifiutato senza sovrascrivere
il lavoro altrui: riesegui il job, che rilegge il ramo più recente.

## Sviluppo locale

- `npm ci` installa le dipendenze bloccate nel lockfile.
- `npm start` avvia il server locale; senza MONGODB_URI usa memoria temporanea.
- `npm test` verifica gioco, interfaccia simulata e pubblicazione.
- `PORT=3011 npm start` e poi `npm run test:api` verificano il multiplayer locale.
- `./avvia-neon-war.sh` resta disponibile per l'anteprima statica locale.

Le regole sono in `src/game/engine.js`, le carte in `src/data/cards.js`, l'interfaccia
in `src/main.js` e `src/ui/`, la scena in `src/render/`, le API in `server.js`.
Per le funzioni di gioco e il multiplayer vedi [README_MULTIPLAYER.md](README_MULTIPLAYER.md).
