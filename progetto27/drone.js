import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const WORLD_LAYER = 0;
const DRONE_BODY_LAYER = 1;
const DRONE_BLADES_LAYER = 2;
const MOBILE_LAYOUT_QUERY = "(pointer: coarse) and (max-width: 900px)";

// ============================================================================
// CERCA: SETTAGGI DRONE
// Tutti i valori principali del player sono qui, divisi per argomento.
// ============================================================================
export const DRONE_SETTINGS = {
  // --- Dimensioni e modello 3D ---
  modelUrl: "./DRONE_v2.glb?rev=51", // Percorso e versione cache del GLB usato dal player.
  hitboxRadius: 0.38, // Raggio della sfera fisica del drone.

  // --- Movimento e limiti verticali ---
  flightSpeed: 30, // Velocità in avanti quando si accelera.//15
  flightAcceleration: 50, // 60=0.5 Unità al secondo quadrato per raggiungere la velocità massima.
  flightDeceleration: 40, // 75=0.4 Unità al secondo quadrato per rallentare quando si lascia l'acceleratore.
  spawnHeight: 110, // Quota iniziale sopra il terreno della città.
  groundClearance: 4.5, // Altezza minima consentita sopra il terreno.
  maxAltitude: 140, // Quota massima invisibile del drone.
  pitchLimitRadians: 1.35, // CHIEDERE Limite di salita/discesa; 1.35 radianti sono circa 77°.

  // --- Sensibilità dei controlli ---
  pointerLockSensitivity: 0.0022, // Sensibilità del mouse con puntatore bloccato.
  mouseDragSensitivity: 0.006, // Sensibilità del trascinamento mouse di emergenza.
  mobileLookSensitivity: 0.009, // Sensibilità dello swipe sulla superficie libera del display.
  mobileBankScreenFractionForFullEffect: 0.12, // Frazione del lato corto necessaria per il rollio mobile massimo.

  // --- Camera e mirino ---
  thirdPersonDistance: 2, // Distanza orizzontale della chase camera.
  thirdPersonHeight: 1.25, // Altezza della chase camera sopra il drone.
  firstPersonDesktopCameraZ: 0.1, // Camera PC dietro la curva delle falci, lungo l'asse locale +Z.
  firstPersonMobileCameraZ: 0.1, // Camera mobile più arretrata per contenere le falci nel viewport stretto.
  firstPersonDesktopFov: 85, // Campo visivo PC più naturale e privo dell'effetto pseudo-fisheye.
  firstPersonDesktopZoom: 2, // Zoom manuale PC: 1.0 è neutro, valori maggiori stringono il FOV.
  firstPersonMobileFov: 105, // Campo visivo mobile originale, lasciato invariato.
  firstPersonMobileZoom: 1.4, // Zoom manuale mobile: 1.0 è neutro, valori maggiori stringono il FOV.
  firstPersonLookDistance: 1.4, // Distanza del punto guardato in prima persona.
  crosshairAimDistance: 18, // Distanza usata per proiettare il mirino in terza persona.
  crosshairScreenMargin: 16, // Margine minimo del mirino dai bordi dello schermo.

  // --- Rollio durante le virate ---
  maxTurnBankDegrees: 90, // Rollio massimo sul proprio asse durante una virata forte.
  bankInputPixelsForFullEffect: 45, // Gesto orizzontale necessario per arrivare al massimo.
  bankHoldSeconds: 0.14, // Tempo per cui il rollio resta sostenuto dopo il gesto.
  bankReturnSpeed: 5, // Velocità con cui l'input del rollio torna a zero.
  bankAttackSpeed: 11, // Rapidità con cui il modello entra nella virata.
  bankReleaseSpeed: 4.5, // Morbidezza con cui il modello torna diritto.
  bankWithoutThrottle: 0.6, // Percentuale di rollio quando il drone non accelera.
  bankDirection: -1, // Usa -1 per il verso attuale; cambia in 1 per invertirlo.

  // --- Collisioni e rimbalzo ---
  bounceVelocityDamping: 1, // Quanto rapidamente si esaurisce la spinta del rimbalzo.
  bounceTiltDamping: 10, // Quanto rapidamente sparisce l'inclinazione da impatto.
  bounceMinSpeed: 2, // Spinta minima ricevuta dopo un urto.
  bounceMaxSpeed: 3, // Spinta massima ricevuta dopo un urto.
  bounceEnergy: 0.10, // Percentuale della velocità d'impatto trasformata in rimbalzo.
  maxPhysicsStep: 1 / 120, // Passo massimo della fisica per evitare attraversamenti ad alta velocità.
  collisionTiltMinDegrees: 0.5, // Inclinazione minima visiva causata da un urto.
  collisionTiltExtraDegrees: 1, // Inclinazione aggiuntiva per gli urti più forti.

  // --- Laser ---
  laserColor: 0xffffff, // Colore dei proiettili.
  laserWidth: 0.01, // Larghezza visiva del laser.
  laserLength: 1, // Lunghezza visiva del laser.
  laserHitboxWidth: 0.04, // Larghezza della hitbox del laser.
  laserSpeed: 80, // Velocità del proiettile.
  laserLifetime: 1, // Secondi prima dello scaricamento automatico.
  laserSpawnDistance: 0, // Distanza davanti al drone dove nasce il laser.
  laserTipForwardOffset: 0.15, // Traslazione manuale in avanti dello spawn rispetto alle punte.
  laserSpawnHeight: 0.1, // Piccolo spostamento verticale del punto di sparo.
  laserDebugLogging: true, // Registra in console spawn e primo aggiornamento dei laser.
  laserDebugLogLimit: 40, // Numero massimo di eventi registrati per sessione.
  mobileFireInterval: 0.18, // Intervallo della raffica mobile, in secondi.
  mobileFireThreshold: 0.5 // Distanza minima dello stick per iniziare a sparare.
};

// ============================================================================
// CERCA: CLASSE DRONE
// Questa classe gestisce player, modello, controlli, laser e camera. Per il
// bilanciamento normale modifica DRONE_SETTINGS invece del codice qui sotto.
// ============================================================================
export class DroneController {
  /**
   * @param {object} options Parametri necessari per collegare il drone al gioco.
   * @param {THREE.Scene} options.scene Scena Three.js principale.
   * @param {THREE.Camera} options.camera Camera usata in prima e terza persona.
   * @param {THREE.WebGLRenderer} options.renderer Renderer e canvas dei controlli.
   * @param {import("./terrain.js").TerrainWorld} options.terrain Sistema del terreno.
   * @param {HTMLElement} options.joystick Base del joystick mobile.
   * @param {HTMLElement} options.joystickKnob Pomello visivo del joystick.
   * @param {HTMLElement} options.lookArea Area mobile dedicata alla visuale.
   * @param {HTMLElement} options.crosshair Mirino mostrato sullo schermo.
   * @param {Function} options.onStartRequested Funzione del menu che avvia la partita.
   */
  constructor({
    scene,
    camera,
    renderer,
    terrain,
    joystick,
    joystickKnob,
    lookArea,
    crosshair,
    onStartRequested
  }) {
    this.scene = scene;
    this.camera = camera;
    this.thirdPersonFov = camera.fov;
    this.renderer = renderer;
    this.terrain = terrain;
    this.joystick = joystick;
    this.joystickKnob = joystickKnob;
    this.lookArea = lookArea;
    this.crosshair = crosshair;
    this.onStartRequested = onStartRequested;

    this.started = false;
    this.thirdPersonEnabled = false;
    this.keys = new Set();
    this.yaw = 0;
    this.pitch = 0;
    this.mobileMove = { x: 0, y: 0 };
    this.joystickPointer = null;
    this.lookPointer = null;
    this.lookStartX = 0;
    this.lookStartBankInput = 0;
    this.desktopMouseLooking = false;
    this.desktopThrottleHeld = false;
    this.desktopFireHeld = false;
    this.previousLookX = 0;
    this.previousLookY = 0;
    this.shotCooldown = 0;
    this.decorativeDrone = null;
    this.decorativeDronePlaced = false;
    this.droneBodyMeshes = [];
    this.droneBladeMeshes = [];
    this.laserTipNodes = [];
    this.laserDebugLogCount = 0;
    this.updateFrame = 0;
    this.mobileLayout = matchMedia(MOBILE_LAYOUT_QUERY);

    this.cameraPosition = new THREE.Vector3();
    this.cameraLookTarget = new THREE.Vector3();
    this.cameraFlatForward = new THREE.Vector3();
    this.flightDirection = new THREE.Vector3(0, 0, -1);
    this.bounceVelocity = new THREE.Vector3();
    this.bounceTilt = new THREE.Vector3();
    this.frameStartPosition = new THREE.Vector3();
    this.actualMovement = new THREE.Vector3();
    this.projectedAimPoint = new THREE.Vector3();
    this.movementVelocity = new THREE.Vector3();
    this.localNormalScratch = new THREE.Vector3();
    this.upAxis = new THREE.Vector3(0, 1, 0);
    this.visualFlightPitch = 0;
    this.bankTurnInput = 0;
    this.bankInputHold = 0;
    this.turnBank = 0;

    this.maxTurnBank = THREE.MathUtils.degToRad(DRONE_SETTINGS.maxTurnBankDegrees);
    this.currentFlightSpeed = 0;

    this.camera.layers.enable(WORLD_LAYER);
    this.camera.layers.enable(DRONE_BLADES_LAYER);
    this.syncCameraLayers();

    this.flyer = new THREE.Group();
    this.flyer.rotation.order = "YXZ";
    this.droneVisualPivot = new THREE.Group();
    this.flyer.add(this.droneVisualPivot);
    const safeSpawn = this.terrain.findSafeSpawn(
      DRONE_SETTINGS.hitboxRadius,
      DRONE_SETTINGS.spawnHeight
    );
    this.flyer.position.set(safeSpawn.x, safeSpawn.y, safeSpawn.z);
    this.flyer.userData.hitbox = new THREE.Sphere();
    this.scene.add(this.flyer);

    this.projectiles = [];
    this.laserPool = [];
    this.laserGeometry = new THREE.BoxGeometry(
      DRONE_SETTINGS.laserWidth,
      DRONE_SETTINGS.laserWidth,
      DRONE_SETTINGS.laserLength
    );
    this.laserGeometry.translate(0, 0, DRONE_SETTINGS.laserLength * 0.5);
    this.laserMaterial = new THREE.MeshBasicMaterial({ color: DRONE_SETTINGS.laserColor });
    this.laserForward = new THREE.Vector3(0, 0, 1);
    this.projectileHitboxCenter = new THREE.Vector3();
    this.laserHitboxSize = new THREE.Vector3(
      DRONE_SETTINGS.laserHitboxWidth,
      DRONE_SETTINGS.laserHitboxWidth,
      DRONE_SETTINGS.laserLength
    );

    this.loadModel();
    this.bindInputEvents();
    this.updateHitbox();
  }

  get isStarted() {
    return this.started;
  }

  get isThirdPerson() {
    return this.thirdPersonEnabled;
  }

  get hasDesktopMouseButtonHeld() {
    return this.desktopThrottleHeld || this.desktopFireHeld;
  }

  /**
   * Restituisce soltanto l'intenzione del giocatore per il futuro server.
   * Posizione, collisioni, danni e proiettili dovranno invece essere calcolati
   * dal server e ritornare al client in uno snapshot autorevole.
   */
  getMultiplayerInput() {
    const joystickActive = this.joystickPointer !== null;
    const joystickReverse = joystickActive
      && this.mobileMove.y > DRONE_SETTINGS.mobileFireThreshold;
    return {
      throttle: joystickActive
        ? !joystickReverse
        : this.keys.has("w") || this.desktopThrottleHeld,
      fire: this.desktopFireHeld || (
        joystickActive && Math.abs(this.mobileMove.y) > DRONE_SETTINGS.mobileFireThreshold
      ),
      yaw: this.yaw,
      pitch: this.pitch,
      bank: this.bankTurnInput
    };
  }

  loadModel() {
    const loader = new GLTFLoader();
    loader.load(
      DRONE_SETTINGS.modelUrl,
      gltf => {
        const droneModel = gltf.scene;
        const bodyNode = droneModel.getObjectByName("DRONE_BODY");
        const bladesNode = droneModel.getObjectByName("DRONE_BLADES");
        this.laserTipNodes = [
          "LASER_TIP_01",
          "LASER_TIP_02",
          "LASER_TIP_03",
          "LASER_TIP_04"
        ].map(name => droneModel.getObjectByName(name)).filter(Boolean);
        droneModel.traverse(object => {
          if (!object.isMesh) return;
          object.castShadow = true;
          object.receiveShadow = true;
        });
        bladesNode?.traverse(object => {
          if (!object.isMesh) return;
          object.layers.set(DRONE_BLADES_LAYER);
          this.droneBladeMeshes.push(object);
        });
        bodyNode?.traverse(object => {
          if (!object.isMesh) return;
          object.layers.set(DRONE_BODY_LAYER);
          this.droneBodyMeshes.push(object);
        });
        if (this.droneBodyMeshes.length === 0 || this.droneBladeMeshes.length === 0) {
          console.error("Il GLB deve contenere le mesh DRONE_BODY e DRONE_BLADES");
        }
        this.scene.traverse(object => {
          if (!object.isLight || !object.shadow?.camera) return;
          object.shadow.camera.layers.enable(DRONE_BODY_LAYER);
          object.shadow.camera.layers.enable(DRONE_BLADES_LAYER);
        });
        // Il file è già centrato, orientato e scalato: qui non servono correzioni.
        this.decorativeDrone = droneModel;
        this.decorativeDrone.visible = false;
        this.droneVisualPivot.add(this.decorativeDrone);
        this.placeModel();
      },
      undefined,
      error => console.error("Impossibile caricare il modello GLB del drone", error)
    );
  }

  placeModel() {
    if (!this.started || !this.decorativeDrone || this.decorativeDronePlaced) return;
    this.decorativeDrone.position.set(0, 0, 0);
    this.decorativeDrone.rotation.set(0, 0, 0);
    this.decorativeDrone.scale.set(1, 1, 1);
    this.decorativeDrone.visible = true;
    this.decorativeDronePlaced = true;
  }

  start() {
    this.started = true;
    this.placeModel();
  }

  setThirdPersonEnabled(enabled) {
    this.thirdPersonEnabled = enabled;
    this.syncCameraLayers();
    if (document.pointerLockElement === this.renderer.domElement) {
      document.exitPointerLock?.();
    }
    return this.thirdPersonEnabled;
  }

  toggleThirdPerson() {
    return this.setThirdPersonEnabled(!this.thirdPersonEnabled);
  }

  syncCameraLayers() {
    this.camera.layers.enable(WORLD_LAYER);
    this.camera.layers.enable(DRONE_BLADES_LAYER);
    if (this.thirdPersonEnabled) this.camera.layers.enable(DRONE_BODY_LAYER);
    else this.camera.layers.disable(DRONE_BODY_LAYER);
  }

  requestPointerLockSafely() {
    if (
      !matchMedia("(pointer: fine)").matches
      || document.pointerLockElement === this.renderer.domElement
    ) return;
    try {
      const request = this.renderer.domElement.requestPointerLock?.();
      request?.catch?.(() => {});
    } catch {
      // Il trascinamento sul canvas resta disponibile quando il browser rifiuta il lock.
    }
  }

  registerTurnBankInput(horizontalDelta) {
    if (Math.abs(horizontalDelta) < 0.01) return;
    if (this.bankTurnInput * horizontalDelta < 0) this.bankTurnInput *= 0.35;
    this.bankTurnInput = THREE.MathUtils.clamp(
      this.bankTurnInput + horizontalDelta / DRONE_SETTINGS.bankInputPixelsForFullEffect,
      -1,
      1
    );
    this.bankInputHold = DRONE_SETTINGS.bankHoldSeconds;
  }

  bindInputEvents() {
    addEventListener("keydown", event => {
      if (event.key.toLowerCase() !== "w") return;
      this.keys.add("w");
      event.preventDefault();
    });
    addEventListener("keyup", event => {
      if (event.key.toLowerCase() === "w") this.keys.delete("w");
    });
    addEventListener("mousemove", event => {
      if (!this.started) return;
      const pointerLocked = document.pointerLockElement === this.renderer.domElement;
      if (
        !pointerLocked
        && (!this.desktopMouseLooking || !matchMedia("(pointer: fine)").matches)
      ) return;
      const lookDeltaX = pointerLocked
        ? event.movementX
        : event.clientX - this.previousLookX;
      const lookDeltaY = pointerLocked
        ? event.movementY
        : event.clientY - this.previousLookY;
      this.registerTurnBankInput(lookDeltaX);
      const sensitivity = pointerLocked
        ? DRONE_SETTINGS.pointerLockSensitivity
        : DRONE_SETTINGS.mouseDragSensitivity;
      this.yaw -= lookDeltaX * sensitivity;
      this.pitch -= lookDeltaY * sensitivity;
      this.pitch = THREE.MathUtils.clamp(
        this.pitch,
        -DRONE_SETTINGS.pitchLimitRadians,
        DRONE_SETTINGS.pitchLimitRadians
      );
      this.previousLookX = event.clientX;
      this.previousLookY = event.clientY;
    });

    const setDesktopMouseButton = (button, held) => {
      if (button === 0) this.desktopFireHeld = held;
      if (button === 2) this.desktopThrottleHeld = held;
    };
    const resetDesktopMouseButtons = () => {
      this.desktopFireHeld = false;
      this.desktopThrottleHeld = false;
      this.desktopMouseLooking = false;
    };

    // Sul desktop usiamo gli eventi mouse: Firefox emette mousedown/mouseup per
    // ogni tasto della combinazione, mentre pointerdown/pointerup condividono
    // una sola cattura che può interrompere la virata con destro + sinistro.
    this.renderer.domElement.addEventListener("mousedown", event => {
      if (!this.started || !matchMedia("(pointer: fine)").matches) return;
      if (event.button !== 0 && event.button !== 2) return;
      if (event.button === 2) event.preventDefault();
      setDesktopMouseButton(event.button, true);
      this.desktopMouseLooking = true;
      this.previousLookX = event.clientX;
      this.previousLookY = event.clientY;
    });
    this.renderer.domElement.addEventListener("contextmenu", event => event.preventDefault());
    addEventListener("mouseup", event => {
      setDesktopMouseButton(event.button, false);
      if (!this.hasDesktopMouseButtonHeld) this.desktopMouseLooking = false;
    });
    addEventListener("blur", resetDesktopMouseButtons);

    this.joystick.addEventListener("pointerdown", event => {
      if (!this.started) this.onStartRequested();
      this.joystickPointer = event.pointerId;
      this.joystick.setPointerCapture(event.pointerId);
      this.updateJoystick(event);
    });
    this.joystick.addEventListener("pointermove", event => {
      if (event.pointerId === this.joystickPointer) this.updateJoystick(event);
    });
    this.joystick.addEventListener("pointerup", () => this.resetJoystick());
    this.joystick.addEventListener("pointercancel", () => this.resetJoystick());

    this.lookArea.addEventListener("pointerdown", event => {
      if (!this.started) this.onStartRequested();
      if (this.lookPointer !== null) return;
      this.lookPointer = event.pointerId;
      this.lookStartX = event.clientX;
      this.lookStartBankInput = this.bankTurnInput;
      this.previousLookX = event.clientX;
      this.previousLookY = event.clientY;
      this.lookArea.setPointerCapture(event.pointerId);
    });
    this.lookArea.addEventListener("pointermove", event => {
      if (event.pointerId !== this.lookPointer) return;
      const lookDeltaX = event.clientX - this.previousLookX;
      const lookDeltaY = event.clientY - this.previousLookY;
      const fullBankDistance = Math.max(
        1,
        Math.min(innerWidth, innerHeight)
          * DRONE_SETTINGS.mobileBankScreenFractionForFullEffect
      );
      this.bankTurnInput = THREE.MathUtils.clamp(
        this.lookStartBankInput + (event.clientX - this.lookStartX) / fullBankDistance,
        -1,
        1
      );
      this.bankInputHold = DRONE_SETTINGS.bankHoldSeconds;
      this.yaw -= lookDeltaX * DRONE_SETTINGS.mobileLookSensitivity;
      this.pitch -= lookDeltaY * DRONE_SETTINGS.mobileLookSensitivity;
      this.pitch = THREE.MathUtils.clamp(
        this.pitch,
        -DRONE_SETTINGS.pitchLimitRadians,
        DRONE_SETTINGS.pitchLimitRadians
      );
      this.previousLookX = event.clientX;
      this.previousLookY = event.clientY;
    });
    const stopLooking = event => {
      if (event.pointerId !== this.lookPointer) return;
      this.lookPointer = null;
      this.bankInputHold = 0;
    };
    this.lookArea.addEventListener("pointerup", stopLooking);
    this.lookArea.addEventListener("pointercancel", stopLooking);
  }

  updateJoystick(event) {
    const rect = this.joystick.getBoundingClientRect();
    const radius = rect.width * 0.5;
    let dx = event.clientX - (rect.left + radius);
    let dy = event.clientY - (rect.top + radius);
    const distance = Math.hypot(dx, dy);
    if (distance > radius) {
      dx = dx / distance * radius;
      dy = dy / distance * radius;
    }
    this.mobileMove.x = dx / radius;
    this.mobileMove.y = dy / radius;
    this.joystickKnob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
  }

  resetJoystick() {
    this.joystickPointer = null;
    this.mobileMove.x = 0;
    this.mobileMove.y = 0;
    this.joystickKnob.style.transform = "translate(-50%, -50%)";
  }

  acquireLaser() {
    const mesh = this.laserPool.pop() || new THREE.Mesh(this.laserGeometry, this.laserMaterial);
    mesh.visible = true;
    this.scene.add(mesh);
    return mesh;
  }

  releaseLaser(mesh) {
    mesh.visible = false;
    this.scene.remove(mesh);
    this.laserPool.push(mesh);
  }

  logLaserDebug(label, data) {
    if (!DRONE_SETTINGS.laserDebugLogging) return;
    if (this.laserDebugLogCount >= DRONE_SETTINGS.laserDebugLogLimit) return;
    this.laserDebugLogCount++;
    console.groupCollapsed(`[laser-debug #${this.laserDebugLogCount}] ${label}`);
    console.table(data);
    console.groupEnd();
  }

  shootProjectile() {
    const tipNodes = this.laserTipNodes.length > 0 ? this.laserTipNodes : [null];
    const convergencePoint = this.flyer.position.clone().addScaledVector(
      this.flightDirection,
      DRONE_SETTINGS.crosshairAimDistance
    );
    for (let index = 0; index < tipNodes.length; index++) {
      const tipNode = tipNodes[index];
      const start = new THREE.Vector3();
      if (tipNode) {
        tipNode.getWorldPosition(start);
      } else {
        start.copy(this.flyer.position).addScaledVector(
          this.flightDirection,
          DRONE_SETTINGS.laserSpawnDistance
        );
        start.y += DRONE_SETTINGS.laserSpawnHeight;
      }
      const direction = convergencePoint.clone().sub(start).normalize();
      start.addScaledVector(direction, DRONE_SETTINGS.laserTipForwardOffset);
      this.logLaserDebug("spawn", {
        frame: this.updateFrame,
        tip: tipNode?.name ?? "fallback",
        start: start.toArray().map(value => Number(value.toFixed(4))),
        flyer: this.flyer.position.toArray().map(value => Number(value.toFixed(4))),
        camera: this.camera.position.toArray().map(value => Number(value.toFixed(4))),
        markerDistanceFromFlyer: tipNode
          ? start.distanceTo(this.flyer.position).toFixed(4)
          : "fallback",
        markerDistanceFromCamera: tipNode
          ? start.distanceTo(this.camera.position).toFixed(4)
          : "fallback",
        laserTipForwardOffset: DRONE_SETTINGS.laserTipForwardOffset,
        throttle: Number((this.movementVelocity.length() / Math.max(1, DRONE_SETTINGS.flightSpeed)).toFixed(3))
      });
      const shot = this.acquireLaser();
      shot.position.copy(start);
      shot.quaternion.setFromUnitVectors(this.laserForward, direction);
      this.projectiles.push({
        mesh: shot,
        direction: direction.clone(),
        velocity: direction.multiplyScalar(DRONE_SETTINGS.laserSpeed),
        life: DRONE_SETTINGS.laserLifetime,
        debugLogged: false,
        hitbox: new THREE.Box3()
      });
    }
  }

  updateProjectiles(delta) {
    for (let index = this.projectiles.length - 1; index >= 0; index--) {
      const projectile = this.projectiles[index];
      projectile.life -= delta;
      const beforeMove = projectile.mesh.position.clone();
      projectile.mesh.position.addScaledVector(projectile.velocity, delta);
      if (!projectile.debugLogged) {
        projectile.debugLogged = true;
        this.logLaserDebug("primo aggiornamento", {
          frame: this.updateFrame,
          before: beforeMove.toArray().map(value => Number(value.toFixed(4))),
          after: projectile.mesh.position.toArray().map(value => Number(value.toFixed(4))),
          delta: Number(delta.toFixed(5)),
          speed: Number(projectile.velocity.length().toFixed(3)),
          moved: Number(beforeMove.distanceTo(projectile.mesh.position).toFixed(4)),
          distanceFromFlyer: Number(projectile.mesh.position.distanceTo(this.flyer.position).toFixed(4))
        });
      }
      this.projectileHitboxCenter
        .copy(projectile.mesh.position)
        .addScaledVector(projectile.direction, DRONE_SETTINGS.laserLength * 0.5);
      projectile.hitbox.setFromCenterAndSize(this.projectileHitboxCenter, this.laserHitboxSize);
      const hitBuilding = this.terrain.projectileHitsBuilding(
        projectile.hitbox,
        this.projectileHitboxCenter
      );
      if (projectile.life <= 0 || hitBuilding) {
        this.releaseLaser(projectile.mesh);
        this.projectiles.splice(index, 1);
      }
    }
  }

  updateHitbox() {
    this.flyer.userData.hitbox.set(this.flyer.position, DRONE_SETTINGS.hitboxRadius);
  }

  move(delta) {
    if (!this.started) return;
    this.frameStartPosition.copy(this.flyer.position);
    let throttle = this.keys.has("w") || this.desktopThrottleHeld ? 1 : 0;
    const joystickReverse = this.joystickPointer !== null
      && this.mobileMove.y > DRONE_SETTINGS.mobileFireThreshold;
    const stickShooting = this.joystickPointer !== null
      && Math.abs(this.mobileMove.y) > DRONE_SETTINGS.mobileFireThreshold;
    const desktopShooting = this.desktopFireHeld;
    if (this.joystickPointer !== null) throttle = joystickReverse ? 0 : 1;

    this.shotCooldown = Math.max(0, this.shotCooldown - delta);
    const shouldShoot = (stickShooting || desktopShooting) && this.shotCooldown <= 0;

    this.flightDirection.set(
      -Math.sin(this.yaw) * Math.cos(this.pitch),
      Math.sin(this.pitch),
      -Math.cos(this.yaw) * Math.cos(this.pitch)
    );
    const targetFlightSpeed = DRONE_SETTINGS.flightSpeed * throttle;
    const speedChange = (targetFlightSpeed > this.currentFlightSpeed
      ? DRONE_SETTINGS.flightAcceleration
      : DRONE_SETTINGS.flightDeceleration) * delta;
    this.currentFlightSpeed = targetFlightSpeed > this.currentFlightSpeed
      ? Math.min(targetFlightSpeed, this.currentFlightSpeed + speedChange)
      : Math.max(targetFlightSpeed, this.currentFlightSpeed - speedChange);
    this.movementVelocity.copy(this.flightDirection).multiplyScalar(this.currentFlightSpeed);
    const physicsSteps = Math.max(1, Math.ceil(delta / DRONE_SETTINGS.maxPhysicsStep));
    const physicsDelta = delta / physicsSteps;
    let verticalLimitHit = false;
    for (let step = 0; step < physicsSteps; step++) {
      this.flyer.position.addScaledVector(this.movementVelocity, physicsDelta);
      this.flyer.position.addScaledVector(this.bounceVelocity, physicsDelta);
      this.bounceVelocity.multiplyScalar(Math.exp(-DRONE_SETTINGS.bounceVelocityDamping * physicsDelta));
      this.bounceTilt.multiplyScalar(Math.exp(-DRONE_SETTINGS.bounceTiltDamping * physicsDelta));

      const groundHeight = this.terrain.heightAt(this.flyer.position.x, this.flyer.position.z);
      const unclampedY = this.flyer.position.y;
      const clampedY = THREE.MathUtils.clamp(
        this.flyer.position.y,
        groundHeight + DRONE_SETTINGS.groundClearance,
        DRONE_SETTINGS.maxAltitude
      );
      verticalLimitHit ||= Math.abs(clampedY - unclampedY) > 0.000001;
      this.flyer.position.y = clampedY;
      this.terrain.enforceWorldBoundary(
        this.flyer.position,
        this.bounceVelocity,
        DRONE_SETTINGS.hitboxRadius
      );
      this.terrain.syncAround(this.flyer.position);
      this.updateHitbox();

      const collision = this.terrain.findBuildingCollision(
        this.flyer.userData.hitbox,
        this.flyer.position
      );
      if (collision) {
        this.flyer.position.addScaledVector(collision.normal, collision.penetration + 0.001);
        const incomingVelocity = this.movementVelocity.clone().add(this.bounceVelocity);
        const impactSpeed = Math.max(0, -incomingVelocity.dot(collision.normal));
        const reboundSpeed = Math.min(
          DRONE_SETTINGS.bounceMaxSpeed,
          Math.max(DRONE_SETTINGS.bounceMinSpeed, impactSpeed * DRONE_SETTINGS.bounceEnergy)
        );
        this.bounceVelocity.copy(collision.normal).multiplyScalar(reboundSpeed);
        this.flyer.position.addScaledVector(this.bounceVelocity, physicsDelta);

        this.localNormalScratch.copy(collision.normal).applyAxisAngle(this.upAxis, -this.yaw);
        const normalizedImpact = THREE.MathUtils.clamp(
          impactSpeed / Math.max(1, this.movementVelocity.length()),
          0,
          1
        );
        const tilt = THREE.MathUtils.degToRad(
          DRONE_SETTINGS.collisionTiltMinDegrees
          + normalizedImpact * DRONE_SETTINGS.collisionTiltExtraDegrees
        );
        const verticalRatio = THREE.MathUtils.clamp(
          Math.abs(this.movementVelocity.y) / Math.max(1, this.movementVelocity.length()),
          0,
          1
        );
        this.bounceTilt.y = THREE.MathUtils.clamp(this.localNormalScratch.x * tilt, -tilt, tilt);
        this.bounceTilt.x = -Math.sign(this.movementVelocity.y) * tilt * verticalRatio;
        this.updateHitbox();
      }
    }

    this.actualMovement.copy(this.flyer.position).sub(this.frameStartPosition);
    let targetVisualPitch = this.pitch;
    if (!verticalLimitHit && throttle > 0 && this.actualMovement.lengthSq() > 0.000001) {
      targetVisualPitch = Math.atan2(
        this.actualMovement.y,
        Math.hypot(this.actualMovement.x, this.actualMovement.z)
      );
    }
    this.visualFlightPitch = THREE.MathUtils.damp(
      this.visualFlightPitch,
      targetVisualPitch,
      10,
      delta
    );

    this.bankInputHold = Math.max(0, this.bankInputHold - delta);
    if (this.bankInputHold <= 0 && this.lookPointer === null) {
      this.bankTurnInput = THREE.MathUtils.damp(
        this.bankTurnInput,
        0,
        DRONE_SETTINGS.bankReturnSpeed,
        delta
      );
    }
    const bankStrength = this.lookPointer !== null
      ? 1
      : throttle > 0
        ? 1
        : DRONE_SETTINGS.bankWithoutThrottle;
    const targetBank = DRONE_SETTINGS.bankDirection
      * this.bankTurnInput
      * this.maxTurnBank
      * bankStrength;
    const bankResponse = Math.abs(targetBank) > Math.abs(this.turnBank)
      ? DRONE_SETTINGS.bankAttackSpeed
      : DRONE_SETTINGS.bankReleaseSpeed;
    this.turnBank = this.lookPointer !== null
      ? targetBank
      : THREE.MathUtils.damp(this.turnBank, targetBank, bankResponse, delta);

    this.flyer.rotation.set(
      this.pitch + this.bounceTilt.x,
      this.yaw + this.bounceTilt.y,
      this.bounceTilt.z
    );
    this.droneVisualPivot.rotation.set(
      this.visualFlightPitch - this.pitch,
      0,
      this.turnBank
    );

    // Lo spawn avviene dopo fisica e assetto: marker e drone appartengono allo
    // stesso stato che verrà renderizzato in questo frame.
    if (shouldShoot) {
      this.shootProjectile();
      this.shotCooldown = DRONE_SETTINGS.mobileFireInterval;
    }
  }

  updateCameraAndCrosshair() {
    const mobileFirstPerson = this.mobileLayout.matches;
    const targetFov = this.thirdPersonEnabled
      ? this.thirdPersonFov
      : mobileFirstPerson
        ? DRONE_SETTINGS.firstPersonMobileFov
          / Math.max(0.1, DRONE_SETTINGS.firstPersonMobileZoom)
        : DRONE_SETTINGS.firstPersonDesktopFov
          / Math.max(0.1, DRONE_SETTINGS.firstPersonDesktopZoom);
    if (this.camera.fov !== targetFov) {
      this.camera.fov = targetFov;
      this.camera.updateProjectionMatrix();
    }
    if (this.thirdPersonEnabled) {
      // In terza persona la camera resta dietro alla direzione reale di volo,
      // quindi accompagna anche il pitch quando il drone sale o scende.
      this.cameraFlatForward.copy(this.flightDirection);
      this.cameraPosition.copy(this.flyer.position);
      this.cameraPosition.addScaledVector(
        this.cameraFlatForward,
        -DRONE_SETTINGS.thirdPersonDistance
      );
      this.cameraPosition.y += DRONE_SETTINGS.thirdPersonHeight;
      this.cameraLookTarget.copy(this.flyer.position);
    } else {
      const cameraLocalZ = mobileFirstPerson
        ? DRONE_SETTINGS.firstPersonMobileCameraZ
        : DRONE_SETTINGS.firstPersonDesktopCameraZ;
      this.cameraPosition
        .set(0, 0, cameraLocalZ)
        .applyQuaternion(this.flyer.quaternion)
        .add(this.flyer.position);
      this.cameraLookTarget
        .copy(this.cameraPosition)
        .addScaledVector(this.flightDirection, DRONE_SETTINGS.firstPersonLookDistance);
    }
    this.camera.position.copy(this.cameraPosition);
    this.camera.lookAt(this.cameraLookTarget);
    this.camera.updateMatrixWorld();
    this.updateCrosshair();
  }

  updateCrosshair() {
    if (!this.thirdPersonEnabled) {
      this.crosshair.style.left = "50%";
      this.crosshair.style.top = "50%";
      return;
    }
    this.projectedAimPoint
      .copy(this.flyer.position)
      .addScaledVector(this.flightDirection, DRONE_SETTINGS.crosshairAimDistance)
      .project(this.camera);
    const screenX = (this.projectedAimPoint.x * 0.5 + 0.5) * innerWidth;
    const screenY = (-this.projectedAimPoint.y * 0.5 + 0.5) * innerHeight;
    const margin = DRONE_SETTINGS.crosshairScreenMargin;
    this.crosshair.style.left = `${THREE.MathUtils.clamp(screenX, margin, innerWidth - margin)}px`;
    this.crosshair.style.top = `${THREE.MathUtils.clamp(screenY, margin, innerHeight - margin)}px`;
  }

  /** Aggiorna movimento, proiettili e camera una volta per frame. */
  update(delta) {
    this.updateFrame++;
    this.updateProjectiles(delta);
    this.move(delta);
    this.updateCameraAndCrosshair();
  }
}
