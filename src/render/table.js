import * as THREE from '../../vendor/three.module.min.js';

// Scena volutamente minimale: nessuna luce, ombra, foschia o effetto.
export class TableRenderer {
  constructor(element, config) {
    this.el = element;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x182234);
    this.target = new THREE.Vector3(0, 0, 0);
    this.camera = new THREE.OrthographicCamera(-8, 8, 4.5, -4.5, 0.1, 50);
    this.camera.position.set(0, 11, 10);
    this.camera.lookAt(this.target);
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    element.append(this.renderer.domElement);

    const slab = new THREE.Mesh(new THREE.BoxGeometry(13.8, 0.28, 7.8), new THREE.MeshBasicMaterial({ color: 0x47505b }));
    slab.position.y = -0.15;
    this.scene.add(slab);
    const field = new THREE.Mesh(new THREE.PlaneGeometry(13.8, 7.8), new THREE.MeshBasicMaterial({ color: 0x9aa1aa }));
    field.rotation.x = -Math.PI / 2;
    this.scene.add(field);
    const border = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.PlaneGeometry(13.8, 7.8)), new THREE.LineBasicMaterial({ color: 0xd7dde4 }));
    border.rotation.x = -Math.PI / 2;
    border.position.y = 0.01;
    this.scene.add(border);
    this.units = new THREE.Group();
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
    this.camera.position.set(0, 11, 10);
    this.camera.zoom = 1;
    this.camera.lookAt(this.target);
    this.camera.updateProjectionMatrix();
  }
  pan(horizontal, vertical = 0) {
    this.target.x += horizontal;
    this.target.z += vertical;
    this.camera.position.x = this.target.x;
    this.camera.position.z = this.target.z + 10;
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
      this.camera.position.set(this.target.x, 11, this.target.z + 10);
      this.camera.lookAt(this.target);
    });
    canvas.addEventListener('pointerup', () => { origin = null; });
  }
  update(state) {
    this.units.clear();
    const marker = (x, z, color, size = 0.55) => {
      const mesh = new THREE.Mesh(new THREE.CircleGeometry(size, 16), new THREE.MeshBasicMaterial({ color }));
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.set(x, 0.03, z);
      this.units.add(mesh);
    };
    const core = (x, color) => {
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.78, 20, 14), new THREE.MeshBasicMaterial({ color }));
      mesh.position.set(x, 0.8, 0);
      this.units.add(mesh);
    };
    state.players.forEach((player, index) => {
      const side = index ? 5.8 : -5.8;
      const direction = index ? -1 : 1;
      core(side, index ? 0xe3485c : 0x238fc3);
      player.drones.forEach((drone, number) => {
        const row = Math.floor(number / 5), column = number % 5;
        marker(side + direction * (1.2 + row * 0.72), -1.5 + column * 0.75, 0x59636e, 0.28);
      });
      player.shields.forEach((shield, number) => {
        const row = Math.floor(number / 5), column = number % 5;
        marker(side + direction * (0.85 + row * 0.5), -1.25 + column * 0.63, 0x77aee0, 0.22);
      });
    });
  }
  tick() { requestAnimationFrame(() => this.tick()); this.renderer.render(this.scene, this.camera); }
}
