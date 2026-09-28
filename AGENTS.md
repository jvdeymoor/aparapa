# BRISCOLA MAGICATA — unica sorgente

- Lavora sul gioco soltanto in `/home/f/NEON-WAR`, ramo `release-multiplayer`.
- `/home/f/aparapa-main` è un worktree dello STESSO repository, ramo locale
  `pubblica-briscola` con upstream `origin/main`: non è una seconda sorgente del gioco.
- Non ricopiare modifiche e non creare commit manuali del gioco nel worktree del sito.
  `.github/workflows/publish-briscola.yml` genera `main:briscola-magicata/` dopo i test
  e dopo che Render serve lo stesso commit, poi richiede esplicitamente il build Pages.
- Il resto del sito e il suo CNAME non vanno modificati dalla pubblicazione del gioco.
- I vecchi file di server/test sul ramo del sito vengono rimossi solo dall'export
  generato: la sorgente e la cronologia restano qui. Non cancellare altri progetti.
- Per una release basta UN commit/push da questo ramo; segnalare errori del workflow,
  non aggirarli facendo un secondo push manuale.
- Versione visibile in src/main.js e query in index.html devono coincidere.
- Handoff locale: `/home/f/BRISCOLA_MAGICATA_HANDOFF.md`, mai pubblicarlo.
