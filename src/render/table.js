import * as THREE from '../../vendor/three.module.min.js';

// Scena volutamente minimale: nessuna luce, ombra, foschia o effetto.
export class TableRenderer {
  constructor(element, config) {
    this.el = element;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x182234);
    this.target = new THREE.Vector3(0, 0, 0);
    this.camera = new THREE.OrthographicCamera(-8, 8, 4.5, -4.5, 0.1, 50);
    this.camera.position.set(0, 18, 0.01);
    this.camera.lookAt(this.target);
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    element.append(this.renderer.domElement);

    const field = new THREE.Mesh(new THREE.PlaneGeometry(13.8, 7.8), new THREE.MeshBasicMaterial({ color: 0xdde8f5 }));
    field.rotation.x = -Math.PI / 2;
    this.scene.add(field);
    const border = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.PlaneGeometry(13.8, 7.8)), new THREE.LineBasicMaterial({ color: 0x27466d }));
    border.rotation.x = -Math.PI / 2;
    border.position.y = 0.01;
    this.scene.add(border);
    this.units = new THREE.Group();
    this.scene.add(this.units);
    this.installPointerControls();
    addEventListener('resize', () => this.resize());
    this.resize();
    this.tick();
  }
  resize() {
    const width = this.el.clientWidth, height = this.el.clientHeight || 300, aspect = width / height, vertical = 9;
    this.camera.left = -(vertical * aspect) / 2;
    this.camera.right = (vertical * aspect) / 2;
    this.camera.top = vertical / 2;
    this.camera.bottom = -vertical / 2;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }
  installPointerControls() {
    const canvas = this.renderer.domElement;
    canvas.style.touchAction = 'none';
    let origin = null;
    canvas.addEventListener('pointerdown', event => { origin = { x: event.clientX, y: event.clientY, target: this.target.clone() }; canvas.setPointerCapture(event.pointerId); });
    canvas.addEventListener('pointermove', event => {
      if (!origin || !canvas.hasPointerCapture(event.pointerId)) return;
      const scale = 9 / Math.max(1, canvas.clientHeight) / this.camera.zoom;
      this.target.set(origin.target.x - (event.clientX - origin.x) * scale, 0, origin.target.z + (event.clientY - origin.y) * scale);
      this.camera.position.set(this.target.x, 18, this.target.z + 0.01);
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
    state.players.forEach((player, index) => {
      const side = index ? 2.8 : -2.8;
      marker(side, 0, index ? 0xe3485c : 0x238fc3, 0.8);
      player.drones.forEach((drone, number) => marker(side + (index ? -0.9 : 0.9), -1.3 + number * 0.75, 0x7c8797, 0.28));
      player.shields.forEach((shield, number) => marker(side + (index ? -0.8 : 0.8), 1.3 - number * 0.62, 0x5c9ed0, 0.22));
    });
  }
  tick() { requestAnimationFrame(() => this.tick()); this.renderer.render(this.scene, this.camera); }
}
