import * as THREE from '../../vendor/three.module.min.js';

// Scena volutamente minimale: nessuna luce, ombra, foschia o effetto.
export class TableRenderer {
  constructor(element, config) {
    this.el = element;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x182234);
    this.target = new THREE.Vector3(0, 0, 0);
    this.camera = new THREE.OrthographicCamera(-8, 8, 4.5, -4.5, 0.1, 50);
    this.camera.position.set(0, 11, 16.5);
    this.camera.lookAt(this.target);
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    element.append(this.renderer.domElement);

    const slab = new THREE.Mesh(new THREE.BoxGeometry(13.8, 0.28, 7.8), new THREE.MeshStandardMaterial({ color: 0x47505b, roughness: 0.82, metalness: 0.12 }));
    slab.position.y = -0.15;
    slab.receiveShadow = true;
    this.scene.add(slab);
    const field = new THREE.Mesh(new THREE.PlaneGeometry(13.8, 7.8), new THREE.MeshStandardMaterial({ color: 0x9aa1aa, roughness: 0.72, metalness: 0.08 }));
    field.rotation.x = -Math.PI / 2;
    field.receiveShadow = true;
    this.scene.add(field);
    const border = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.PlaneGeometry(13.8, 7.8)), new THREE.LineBasicMaterial({ color: 0xd7dde4 }));
    border.rotation.x = -Math.PI / 2;
    border.position.y = 0.01;
    this.scene.add(border);
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.28));
    this.spot = new THREE.SpotLight(0xffffff, 5.5, 28, 0.62, 0.25, 1.3);
    this.spot.position.set(0, 13.8, 0);
    this.spot.castShadow = true;
    this.spot.shadow.mapSize.set(1024, 1024);
    this.spot.target.position.set(0, 0, 0);
    this.scene.add(this.spot, this.spot.target);
    this.units = new THREE.Group();
    this.orbiters = [];
    this.scene.add(this.units);
    this.installPointerControls();
    addEventListener('resize', () => this.resize());
    addEventListener('orientationchange', () => {
      // In orizzontale la vista deve sempre ricominciare centrata e completa.
      requestAnimationFrame(() => { this.resize(); this.resetView(); this.syncTouchMode(); });
    });
    this.resize();
    this.syncTouchMode();
    this.tick();
  }
  isLandscapePhone() { return matchMedia('(pointer:coarse) and (orientation:landscape) and (max-height:600px)').matches; }
  syncTouchMode() { this.renderer.domElement.style.touchAction = this.isLandscapePhone() ? 'auto' : 'none'; }
  resize() {
    const width = this.el.clientWidth, height = this.el.clientHeight || 300, aspect = width / height, vertical = 9;
    this.camera.left = -(vertical * aspect) / 2;
    this.camera.right = (vertical * aspect) / 2;
    this.camera.top = vertical / 2;
    this.camera.bottom = -vertical / 2;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }
  resetView() {
    this.target.set(0, 0, 0);
    this.camera.position.set(0, 11, 16.5);
    this.camera.zoom = 1;
    this.camera.lookAt(this.target);
    this.camera.updateProjectionMatrix();
  }
  pan(horizontal, vertical = 0) {
    this.target.x += horizontal;
    this.target.z += vertical;
    this.camera.position.x = this.target.x;
    this.camera.position.z = this.target.z + 16.5;
    this.camera.lookAt(this.target);
  }
  installPointerControls() {
    const canvas = this.renderer.domElement;
    let origin = null;
    canvas.addEventListener('pointerdown', event => {
      if (this.isLandscapePhone()) return;
      origin = { x: event.clientX, y: event.clientY, target: this.target.clone() };
      canvas.setPointerCapture(event.pointerId);
    });
    canvas.addEventListener('pointermove', event => {
      if (this.isLandscapePhone()) { origin = null; return; }
      if (!origin || !canvas.hasPointerCapture(event.pointerId)) return;
      const scale = 9 / Math.max(1, canvas.clientHeight) / this.camera.zoom;
      this.target.set(origin.target.x - (event.clientX - origin.x) * scale, 0, origin.target.z - (event.clientY - origin.y) * scale);
      this.camera.position.set(this.target.x, 11, this.target.z + 16.5);
      this.camera.lookAt(this.target);
    });
    canvas.addEventListener('pointerup', () => { origin = null; });
  }
  update(state) {
    this.units.clear();
    this.orbiters = [];
    const marker = (x, z, color, size = 0.55) => {
      const mesh = new THREE.Mesh(new THREE.CircleGeometry(size, 16), new THREE.MeshStandardMaterial({ color, roughness: 0.62, metalness: 0.18 }));
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.set(x, 0.03, z);
      mesh.castShadow = true;
      this.units.add(mesh);
    };
    const core = (x, color) => {
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.78, 20, 14), new THREE.MeshStandardMaterial({ color, roughness: 0.38, metalness: 0.32 }));
      mesh.position.set(x, 0.8, 0);
      mesh.castShadow = true;
      this.units.add(mesh);
    };
    const droneCube = (x, z) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.52, 0.52), new THREE.MeshStandardMaterial({ color: 0x59636e, roughness: 0.48, metalness: 0.35 }));
      mesh.position.set(x, 0.28, z);
      mesh.castShadow = true;
      this.units.add(mesh);
    };
    const shieldPlate = (coreX, direction, index, total) => {
      // Faccia quasi pari allo sprite precedente, ma con uno spessore molto ridotto.
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.12, 0.36), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.35, metalness: 0.48 }));
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.units.add(mesh);
      this.orbiters.push({ mesh, coreX, direction, phase: (index / Math.max(1, total)) * Math.PI * 2 });
    };
    state.players.forEach((player, index) => {
      const side = index ? 5.8 : -5.8;
      const direction = index ? -1 : 1;
      core(side, index ? 0xe3485c : 0x238fc3);
      player.drones.forEach((drone, number) => {
        const row = Math.floor(number / 5), column = number % 5;
        droneCube(side + direction * (1.7 + row * 0.72), -1.5 + column * 0.75);
      });
      player.shields.forEach((shield, number) => shieldPlate(side, direction, number, player.shields.length));
    });
  }
  tick() {
    const time = performance.now() * 0.00055;
    this.orbiters.forEach(orbiter => {
      const angle = orbiter.phase + time;
      orbiter.mesh.position.set(orbiter.coreX + Math.cos(angle) * 1.16, 0.3, Math.sin(angle) * 1.16);
      // Piastra verticale: la faccia è rivolta verso la corsia dei propri Droni.
      orbiter.mesh.rotation.set(0, 0, orbiter.direction * Math.PI / 2);
    });
    requestAnimationFrame(() => this.tick());
    this.renderer.render(this.scene, this.camera);
  }
}
