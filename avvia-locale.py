#!/usr/bin/env python3
"""Avvia progetto27 in locale usando un piccolo server HTTP."""

from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import os
import sys
import threading
import webbrowser


# CERCA: SETTAGGI AVVIO LOCALE
HOST = "127.0.0.1"  # Il server resta accessibile soltanto da questo computer.
DEFAULT_PORT = 8765  # Porta predefinita; puoi passarne un'altra dopo il nome del file.
OPEN_DELAY_SECONDS = 0.6  # Piccola attesa prima di aprire automaticamente il browser.


def main() -> None:
    """Serve la cartella del progetto e apre la pagina nel browser predefinito."""
    project_directory = Path(__file__).resolve().parent
    os.chdir(project_directory)

    port = int(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_PORT
    address = (HOST, port)
    server = ThreadingHTTPServer(address, SimpleHTTPRequestHandler)
    url = f"http://{HOST}:{port}/"

    print(f"Progetto27 disponibile su {url}")
    print("Premi Ctrl+C nel terminale per fermare il server.")
    threading.Timer(OPEN_DELAY_SECONDS, lambda: webbrowser.open(url)).start()

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nServer locale fermato.")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
