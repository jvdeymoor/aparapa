// ============================================================================
// INTERFACCIA MULTIPLAYER
// Il client statico (GitHub Pages) comunica con il server Node.js via WSS.
// Il server resta l'autorità: il client invia solo input e riceve snapshot.
// ============================================================================

export const MULTIPLAYER_PROTOCOL_VERSION = 1;

export class MultiplayerClient {
  /**
   * @param {object} options Configurazione del trasporto verso il server.
   * @param {boolean} options.enabled Attiva la connessione solo quando esiste un server.
   * @param {string} options.serverUrl URL wss:// del futuro servizio Node.js.
   * @param {number} options.inputRate Numero di invii input al secondo.
   * @param {Function} options.onSnapshot Riceve snapshot validi dal server.
   * @param {Function} options.onStatus Riceve i cambi di stato della connessione.
   */
  constructor({ enabled, serverUrl, inputRate, onSnapshot, onStatus }) {
    this.enabled = enabled;
    this.serverUrl = serverUrl;
    this.inputInterval = 1 / inputRate;
    this.onSnapshot = onSnapshot;
    this.onStatus = onStatus;
    this.socket = null;
    this.status = "offline";
    this.inputSequence = 0;
    this.inputElapsed = 0;
  }

  setStatus(status) {
    this.status = status;
    this.onStatus(status);
  }

  connect() {
    if (!this.enabled || this.socket) return;
    if (!this.serverUrl.startsWith("wss://")) {
      console.warn("Il server multiplayer deve usare un endpoint wss://");
      return;
    }
    this.setStatus("connecting");
    try {
      this.socket = new WebSocket(this.serverUrl);
    } catch (error) {
      console.error("Impossibile aprire il WebSocket multiplayer", error);
      this.socket = null;
      this.setStatus("offline");
      return;
    }
    this.socket.addEventListener("open", () => {
      this.setStatus("connected");
      this.send({ type: "join", protocolVersion: MULTIPLAYER_PROTOCOL_VERSION });
    });
    this.socket.addEventListener("message", event => this.handleMessage(event.data));
    this.socket.addEventListener("close", () => {
      this.socket = null;
      this.setStatus("offline");
    });
    this.socket.addEventListener("error", () => {
      // Il close successivo aggiorna lo stato senza esporre errori di rete all'utente.
    });
  }

  disconnect() {
    this.socket?.close();
    this.socket = null;
    if (this.status !== "offline") this.setStatus("offline");
  }

  send(message) {
    if (this.socket?.readyState !== WebSocket.OPEN) return false;
    this.socket.send(JSON.stringify(message));
    return true;
  }

  handleMessage(rawMessage) {
    let message;
    try {
      message = JSON.parse(rawMessage);
    } catch {
      console.warn("Snapshot multiplayer non valido ignorato");
      return;
    }
    if (message?.type === "snapshot" && Number.isFinite(message.tick)) {
      this.onSnapshot(message);
    }
  }

  /** Invia l'input a cadenza fissa, separata dal frame rate del rendering. */
  update(delta, input) {
    if (this.status !== "connected") return;
    this.inputElapsed += delta;
    if (this.inputElapsed < this.inputInterval) return;
    this.inputElapsed %= this.inputInterval;
    this.send({
      type: "input",
      sequence: ++this.inputSequence,
      clientTime: performance.now(),
      input
    });
  }
}
