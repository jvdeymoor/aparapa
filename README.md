# NEON//WAR

Gioco di carte strategico futuristico per due giocatori, progettato per turni asincroni senza timer. È completamente locale: non invia dati, non richiede account, server, installazioni o connessione per giocare.

## Avvio

Apri semplicemente `index.html` in un browser moderno. La libreria Three.js è già inclusa in `vendor/`; non c'è CDN né build da eseguire.

## Come giocare

Scegli una carta nella mano; cliccala una seconda volta per usarla contro l'avversario. I Drone possono attaccare con il loro pulsante. Hai due mosse, poi premi **Fine Turno**. Il gioco viene salvato automaticamente nel browser; i controlli in alto permettono anche Salva, Esporta, Importa e Reset.

Vinci portando l'Integrità del Nucleo nemico a zero o iniziando tre tuoi turni consecutivi con almeno 10 Dominio.

## Configurazione semplice

All'inizio di `index.html` c'è la sezione `window.CONFIG`, con commenti italiani. Da lì puoi cambiare regole, colori, tavolo, carte, camera, luci, audio, animazioni e debug. I percorsi sostituibili degli asset sono in `CONFIG.IMAGES`; sono predisposte le cartelle `assets/images`, `assets/icons`, `assets/textures` e `assets/audio`.

## Struttura

- `src/game/engine.js`: regole, azioni valide e stato deterministico.
- `src/data/cards.js`: pool carte (10 Scudi, 10 Virus, 15 Drone, 10 Radiazioni, 12 Laser, 10 Magicate, 12 Briscole).
- `src/render/table.js`: tavolo e pedine Three.js.
- `src/ui/`: interfaccia responsive.
- `src/storage/adapter.js`: salvataggio locale e contratto futuro Node.
- `tests/`: test del motore.

## Aggiungere carte e futuro Node

Aggiungi dati in `src/data/cards.js`: ogni carta ha id, categoria, costo, rarità, descrizione, valori e tag. La logica è separata dall'interfaccia. Per il multiplayer futuro, sostituisci `LocalGameAdapter` con `NodeGameAdapter`: il server deve validare `gameId`, `playerId`, `turnId` e `actionId` in modo autoritativo. Non è incluso né avviato alcun server remoto.

## Verifica

Per chi vuole controllare il motore: `npm test`. L'uso normale resta l'apertura di `index.html`.
