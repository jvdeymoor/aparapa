# Audio del gioco

Sostituisci direttamente i file in questa cartella mantenendo nomi e formati.
Poi esegui commit e push da NEON-WAR; il workflow pubblica anche gli audio.

- ostLoop.mp3: musica in loop.
- touch.wav, conferma.wav, chiudi.wav: pulsanti e menu.
- carta.wav: apertura e animazioni carta; chiusura riprodotta al contrario dal codice.
- drone.wav, virus.wav, radioattivo.wav, laser.wav, scudo.wav, magicata.wav: carte giocate.
- attacco_drone.wav, attacco_virus.wav, attacco_radioattivo.wav: attacchi.

Laser usa laser.wav una sola volta anche per il danno istantaneo.
Volumi e associazioni sono in src/ui/audio.js (AUDIO_LEVELS e AUDIO_FILES).
Il pulsante speaker accanto al menu apre gli slider MUSICA ed EFFETTI (50% iniziale). I valori vengono ricordati; 0% silenzia il canale.
I browser possono impedire l'avvio automatico: la musica riparte al primo tocco.
Dopo una sostituzione, se senti ancora il vecchio file, ricarica svuotando la cache.
