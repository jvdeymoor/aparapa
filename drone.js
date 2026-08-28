import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

// ============================================================================
// CERCA: SETTAGGI DRONE
// Tutti i valori principali del player sono qui, divisi per argomento.
// ============================================================================
export const DRONE_SETTINGS = {
  // --- Dimensioni e modello 3D ---
  modelUrl: "./DRONE_v2.glb?rev=43", // Percorso e versione cache del GLB usato dal player.
  hitboxRadius: 0.38, // Raggio della sfera fisica del drone.
  firstPersonCameraOffset: 0.18712463414227523, // Distanza dal centro alla camera sul muso.

  // --- Movimento e limiti verticali ---
  flightSpeed: 13, // Velocità in avanti quando si accelera.
  spawnHeight: 110, // Quota iniziale sopra il terreno della città.
  groundClearance: 4.5, // Altezza minima consentita sopra il terreno.
  maxAltitude: 140, // Quota massima invisibile del drone.
  pitchLimitRadians: 1.35, // Limite di salita/discesa; 1.35 radianti sono circa 77°.

  // --- Sensibilità dei controlli ---
  pointerLockSensitivity: 0.0022, // Sensibilità del mouse con puntatore bloccato.
  mouseDragSensitivity: 0.006, // Sensibilità del trascinamento mouse di emergenza.
  mobileLookSensitivity: 0.009, // Sensibilità dello swipe sul lato destro.

  // --- Camera e mirino ---
  thirdPersonDistance: 2, // Distanza orizzontale della chase camera.
  thirdPersonHeight: 1.25, // Altezza della chase camera sopra il drone.
  firstPersonLookDistance: 1.4, // Distanza del punto guardato in prima persona.
  crosshairAimDistance: 18, // Distanza usata per proiettare il mirino in terza persona.
  crosshairScreenMargin: 16, // Margine minimo del mirino dai bordi dello schermo.

  // --- Rollio durante le virate ---
  maxTurnBankDegrees: 50, // Rollio massimo sul proprio asse durante una virata forte.
  bankInputPixelsForFullEffect: 45, // Gesto orizzontale necessario per arrivare al massimo.
  bankHoldSeconds: 0.14, // Tempo per cui il rollio resta sostenuto dopo il gesto.
  bankReturnSpeed: 5, // Velocità con cui l'input del rollio torna a zero.
  bankAttackSpeed: 11, // Rapidità con cui il modello entra nella virata.
  bankReleaseSpeed: 4.5, // Morbidezza con cui il modello torna diritto.
  bankWithoutThrottle: 0.6, // Percentuale di rollio quando il drone non accelera.
  bankDirection: -1, // Usa -1 per il verso attuale; cambia in 1 per invertirlo.

  // --- Collisioni e rimbalzo ---
  bounceVelocityDamping: 3.8, // Quanto rapidamente si esaurisce la spinta del rimbalzo.
  bounceTiltDamping: 5.5, // Quanto rapidamente sparisce l'inclinazione da impatto.
  bounceMinSpeed: 2.8, // Spinta minima ricevuta dopo un urto.
  bounceMaxSpeed: 6.5, // Spinta massima ricevuta dopo un urto.
  bounceEnergy: 0.72, // Percentuale della velocità d'impatto trasformata in rimbalzo.
  collisionTiltMinDegrees: 3, // Inclinazione minima visiva causata da un urto.
  collisionTiltExtraDegrees: 4, // Inclinazione aggiuntiva per gli urti più forti.

  // --- Laser ---
  laserColor: 0xffd45c, // Colore dei proiettili.
  laserWidth: 0.14, // Larghezza visiva del laser.
  laserLength: 1.6, // Lunghezza visiva del laser.
  laserHitboxWidth: 0.22, // Larghezza della hitbox del laser.
  laserSpeed: 42, // Velocità del proiettile.
  laserLifetime: 2.2, // Secondi prima dello scaricamento automatico.
  laserSpawnDistance: 1.35, // Distanza davanti al drone dove nasce il laser.
  laserSpawnHeight: 0.1, // Piccolo spostamento verticale del punto di sparo.
  maxActiveLasers: 32, // Numero massimo di laser contemporanei.
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
    this.mouseLookPointer = null;
    this.previousLookX = 0;
    this.previousLookY = 0;
    this.shotCooldown = 0;
    this.decorativeDrone = null;
    this.decorativeDronePlaced = false;

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

    this.frontTipOffset = DRONE_SETTINGS.firstPersonCameraOffset;
    this.maxTurnBank = THREE.MathUtils.degToRad(DRONE_SETTINGS.maxTurnBankDegrees);

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
    this.laserMaterial = new THREE.MeshBasicMaterial({ color: DRONE_SETTINGS.laserColor });
    this.laserForward = new THREE.Vector3(0, 0, 1);
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

  loadModel() {
    const loader = new GLTFLoader();
    loader.load(
      DRONE_SETTINGS.modelUrl,
      gltf => {
        const droneModel = gltf.scene;
        droneModel.traverse(object => {
          if (!object.isMesh) return;
          object.castShadow = true;
          object.receiveShadow = true;
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
    if (document.pointerLockElement === this.renderer.domElement) {
      document.exitPointerLock?.();
    }
    return this.thirdPersonEnabled;
  }

  toggleThirdPerson() {
    return this.setThirdPersonEnabled(!this.thirdPersonEnabled);
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
      if (document.pointerLockElement !== this.renderer.domElement || !this.started) return;
      this.registerTurnBankInput(event.movementX);
      this.yaw -= event.movementX * DRONE_SETTINGS.pointerLockSensitivity;
      this.pitch -= event.movementY * DRONE_SETTINGS.pointerLockSensitivity;
      this.pitch = THREE.MathUtils.clamp(
        this.pitch,
        -DRONE_SETTINGS.pitchLimitRadians,
        DRONE_SETTINGS.pitchLimitRadians
      );
    });

    this.renderer.domElement.addEventListener("pointerdown", event => {
      if (!this.started || !matchMedia("(pointer: fine)").matches) return;
      if (event.button === 0) this.shootProjectile();
      this.mouseLookPointer = event.pointerId;
      this.previousLookX = event.clientX;
      this.previousLookY = event.clientY;
      this.renderer.domElement.setPointerCapture(event.pointerId);
    });
    this.renderer.domElement.addEventListener("pointermove", event => {
      if (
        !this.started
        || event.pointerId !== this.mouseLookPointer
        || document.pointerLockElement === this.renderer.domElement
      ) return;
      const lookDeltaX = event.clientX - this.previousLookX;
      const lookDeltaY = event.clientY - this.previousLookY;
      this.registerTurnBankInput(lookDeltaX);
      this.yaw -= lookDeltaX * DRONE_SETTINGS.mouseDragSensitivity;
      this.pitch -= lookDeltaY * DRONE_SETTINGS.mouseDragSensitivity;
      this.pitch = THREE.MathUtils.clamp(
        this.pitch,
        -DRONE_SETTINGS.pitchLimitRadians,
        DRONE_SETTINGS.pitchLimitRadians
      );
      this.previousLookX = event.clientX;
      this.previousLookY = event.clientY;
    });
    const stopMouseLooking = event => {
      if (event.pointerId !== this.mouseLookPointer) return;
      this.mouseLookPointer = null;
      if (this.renderer.domElement.hasPointerCapture?.(event.pointerId)) {
        this.renderer.domElement.releasePointerCapture(event.pointerId);
      }
    };
    this.renderer.domElement.addEventListener("pointerup", stopMouseLooking);
    this.renderer.domElement.addEventListener("pointercancel", stopMouseLooking);

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
      this.lookPointer = event.pointerId;
      this.previousLookX = event.clientX;
      this.previousLookY = event.clientY;
      this.lookArea.setPointerCapture(event.pointerId);
    });
    this.lookArea.addEventListener("pointermove", event => {
      if (event.pointerId !== this.lookPointer) return;
      const lookDeltaX = event.clientX - this.previousLookX;
      const lookDeltaY = event.clientY - this.previousLookY;
      this.registerTurnBankInput(lookDeltaX);
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
      if (event.pointerId === this.lookPointer) this.lookPointer = null;
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

  shootProjectile() {
    if (this.projectiles.length >= DRONE_SETTINGS.maxActiveLasers) return;
    const shot = this.acquireLaser();
    shot.position.copy(this.flyer.position).addScaledVector(
      this.flightDirection,
      DRONE_SETTINGS.laserSpawnDistance
    );
    shot.position.y += DRONE_SETTINGS.laserSpawnHeight;
    shot.quaternion.setFromUnitVectors(this.laserForward, this.flightDirection);
    this.projectiles.push({
      mesh: shot,
      velocity: this.flightDirection.clone().multiplyScalar(DRONE_SETTINGS.laserSpeed),
      life: DRONE_SETTINGS.laserLifetime,
      hitbox: new THREE.Box3()
    });
  }

  updateProjectiles(delta) {
    for (let index = this.projectiles.length - 1; index >= 0; index--) {
      const projectile = this.projectiles[index];
      projectile.life -= delta;
      projectile.mesh.position.addScaledVector(projectile.velocity, delta);
      projectile.hitbox.setFromCenterAndSize(projectile.mesh.position, this.laserHitboxSize);
      const hitBuilding = this.terrain.projectileHitsBuilding(
        projectile.hitbox,
        projectile.mesh.position
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
    let throttle = this.keys.has("w") ? 1 : 0;
    const joystickReverse = this.joystickPointer !== null
      && this.mobileMove.y > DRONE_SETTINGS.mobileFireThreshold;
    const stickShooting = this.joystickPointer !== null
      && Math.abs(this.mobileMove.y) > DRONE_SETTINGS.mobileFireThreshold;
    if (this.joystickPointer !== null) throttle = joystickReverse ? 0 : 1;

    this.shotCooldown = Math.max(0, this.shotCooldown - delta);
    if (stickShooting && this.shotCooldown <= 0) {
      this.shootProjectile();
      this.shotCooldown = DRONE_SETTINGS.mobileFireInterval;
    }

    this.flightDirection.set(
      -Math.sin(this.yaw) * Math.cos(this.pitch),
      Math.sin(this.pitch),
      -Math.cos(this.yaw) * Math.cos(this.pitch)
    );
    this.movementVelocity.copy(this.flightDirection).multiplyScalar(
      DRONE_SETTINGS.flightSpeed * throttle
    );
    this.flyer.position.addScaledVector(this.movementVelocity, delta);
    this.flyer.position.addScaledVector(this.bounceVelocity, delta);
    this.bounceVelocity.multiplyScalar(Math.exp(-DRONE_SETTINGS.bounceVelocityDamping * delta));
    this.bounceTilt.multiplyScalar(Math.exp(-DRONE_SETTINGS.bounceTiltDamping * delta));

    const groundHeight = this.terrain.heightAt(this.flyer.position.x, this.flyer.position.z);
    this.flyer.position.y = THREE.MathUtils.clamp(
      this.flyer.position.y,
      groundHeight + DRONE_SETTINGS.groundClearance,
      DRONE_SETTINGS.maxAltitude
    );
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
      this.flyer.position.addScaledVector(this.bounceVelocity, delta);

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

    this.actualMovement.copy(this.flyer.position).sub(this.frameStartPosition);
    let targetVisualPitch = this.pitch;
    if (throttle > 0 && this.actualMovement.lengthSq() > 0.000001) {
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
    if (this.bankInputHold <= 0) {
      this.bankTurnInput = THREE.MathUtils.damp(
        this.bankTurnInput,
        0,
        DRONE_SETTINGS.bankReturnSpeed,
        delta
      );
    }
    const bankStrength = throttle > 0 ? 1 : DRONE_SETTINGS.bankWithoutThrottle;
    const targetBank = DRONE_SETTINGS.bankDirection
      * this.bankTurnInput
      * this.maxTurnBank
      * bankStrength;
    const bankResponse = Math.abs(targetBank) > Math.abs(this.turnBank)
      ? DRONE_SETTINGS.bankAttackSpeed
      : DRONE_SETTINGS.bankReleaseSpeed;
    this.turnBank = THREE.MathUtils.damp(this.turnBank, targetBank, bankResponse, delta);

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
  }

  updateCameraAndCrosshair() {
    if (this.thirdPersonEnabled) {
      this.cameraFlatForward.set(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
      this.cameraPosition.copy(this.flyer.position);
      this.cameraPosition.addScaledVector(
        this.cameraFlatForward,
        -DRONE_SETTINGS.thirdPersonDistance
      );
      this.cameraPosition.y += DRONE_SETTINGS.thirdPersonHeight;
      this.cameraLookTarget.copy(this.flyer.position);
    } else {
      this.cameraPosition
        .set(0, 0, -this.frontTipOffset)
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
    this.move(delta);
    this.updateProjectiles(delta);
    this.updateCameraAndCrosshair();
  }
}
