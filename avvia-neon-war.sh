#!/usr/bin/env bash
# Avviatore locale: nessun dato viene inviato in rete.
set -euo pipefail
GAME_DIR="$(cd "$(dirname "$0")" && pwd)"
PORT=8765
URL="http://127.0.0.1:${PORT}/index.html"

# Se il server esiste già, riusa quello; altrimenti avvialo in locale.
if ! curl --silent --fail "$URL" >/dev/null 2>&1; then
  (cd "$GAME_DIR" && python3 -m http.server "$PORT" --bind 127.0.0.1 > .neon-war-server.log 2>&1 &)
  sleep 1
fi

xdg-open "$URL" >/dev/null 2>&1 || true
