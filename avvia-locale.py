#!/usr/bin/env python3
"""Avvia progetto27 in locale usando un piccolo server HTTP."""

from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import os
import socket
import sys
import threading
import webbrowser


# CERCA: SETTAGGI AVVIO LOCALE
HOST = "0.0.0.0"  # Ascolta anche sulla rete locale per consentire il test da cellulare.
DEFAULT_PORT = 8765  # Porta predefinita; puoi passarne un'altra dopo il nome del file.
OPEN_DELAY_SECONDS = 0.6  # Piccola attesa prima di aprire automaticamente il browser.


def main() -> None:
    """Serve la cartella del progetto e apre la pagina nel browser predefinito."""
    project_directory = Path(__file__).resolve().parent
    os.chdir(project_directory)

    port = int(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_PORT
    address = (HOST, port)
    server = ThreadingHTTPServer(address, SimpleHTTPRequestHandler)
    local_url = f"http://127.0.0.1:{port}/"
    lan_addresses = {
        info[4][0]
        for info in socket.getaddrinfo(socket.gethostname(), None, socket.AF_INET)
        if not info[4][0].startswith("127.")
    }
    probe = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        # Non invia dati: serve solo a chiedere al sistema quale interfaccia
        # userebbe per raggiungere la rete esterna.
        probe.connect(("8.8.8.8", 80))
        route_address = probe.getsockname()[0]
        if not route_address.startswith("127."):
            lan_addresses.add(route_address)
    except OSError:
        pass
    finally:
        probe.close()
    lan_addresses = sorted(lan_addresses)

    print(f"Progetto27 disponibile su {local_url}")
    if lan_addresses:
        print("Da un cellulare sulla stessa rete Wi-Fi usa uno di questi indirizzi:")
        for lan_address in lan_addresses:
            print(f"  http://{lan_address}:{port}/")
    else:
        print("Nessun indirizzo LAN rilevato: controlla la connessione Wi-Fi del PC.")
    print("Premi Ctrl+C nel terminale per fermare il server.")
    threading.Timer(OPEN_DELAY_SECONDS, lambda: webbrowser.open(local_url)).start()

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nServer locale fermato.")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
