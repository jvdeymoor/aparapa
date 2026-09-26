import * as THREE from '../../vendor/three.module.min.js';

// Arena tattica: ortografica per mantenere i due lati simmetrici su ogni schermo.
export class TableRenderer {
  constructor(element, config) {
    this.el = element;
    this.C = config;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#245fa8');
    this.camera = new THREE.OrthographicCamera(-8, 8, 4.5, -4.5, 0.1, 50);
    this.target = new THREE.Vector3(0, 0, 0);
    this.camera.position.set(0, 13, 11);
    this.camera.lookAt(this.target);
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    element.append(this.renderer.domElement);
    const table = new THREE.Mesh(new THREE.BoxGeometry(config.TABLE.WIDTH, 0.35, config.TABLE.HEIGHT), new THREE.MeshBasicMaterial({ color: 0x65b7ff, side: THREE.DoubleSide }));
    table.position.y = -0.25;
    this.scene.add(table);
    const grid = new THREE.GridHelper(config.TABLE.WIDTH - 0.5, 12, 0xd9f4ff, 0x316bb4);
    grid.position.y = -0.06;
    this.scene.add(grid);
    this.installTouchControls();
    this.group = new THREE.Group();
    this.scene.add(this.group);
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
  installTouchControls() {
    const canvas = this.renderer.domElement, pointers = new Map();
    let start = null;
    canvas.style.touchAction = 'none';
    const snapshot = () => [...pointers.values()].map(p => new THREE.Vector2(p.x, p.y));
    canvas.addEventListener('pointerdown', event => {
      canvas.setPointerCapture(event.pointerId);
      pointers.set(event.pointerId, event);
      start = { points: snapshot(), zoom: this.camera.zoom, target: this.target.clone() };
    });
    canvas.addEventListener('pointermove', event => {
      if (!pointers.has(event.pointerId) || !start) return;
      pointers.set(event.pointerId, event);
      const points = snapshot();
      if (points.length === 2 && start.points.length === 2) {
        const before = start.points[0].distanceTo(start.points[1]), now = points[0].distanceTo(points[1]);
        this.camera.zoom = THREE.MathUtils.clamp(start.zoom * now / before, 0.7, 2.4);
        this.camera.updateProjectionMatrix();
      } else if (points.length === 1 && start.points.length === 1) {
        const delta = points[0].clone().sub(start.points[0]), scale = 9 / Math.max(1, canvas.clientHeight) / this.camera.zoom;
        this.target.set(start.target.x - delta.x * scale, 0, start.target.z + delta.y * scale);
        this.camera.position.set(this.target.x, 13, this.target.z + 11);
        this.camera.lookAt(this.target);
      }
    });
    const finish = event => { pointers.delete(event.pointerId); start = pointers.size ? { points: snapshot(), zoom: this.camera.zoom, target: this.target.clone() } : null; };
    canvas.addEventListener('pointerup', finish);
    canvas.addEventListener('pointercancel', finish);
  }
  update(state) {
    this.group.clear();
    const add = (x, z, color, scale = 1) => {
      const unit = new THREE.Mesh(new THREE.CylinderGeometry(0.42 * scale, 0.55 * scale, 0.18, 6), new THREE.MeshBasicMaterial({ color }));
      unit.position.set(x, 0, z);
      this.group.add(unit);
    };
    state.players.forEach((player, index) => {
      const side = index ? 2.7 : -2.7;
      add(side, 0, index ? 0xff354c : 0x37e9ff, 1.4);
      player.drones.forEach((drone, number) => add(side + (index ? -0.8 : 0.8), -0.9 + number * 0.7, 0xf6c84b, 0.55));
      player.shields.forEach((shield, number) => add(side + (index ? -0.7 : 0.7), 0.9 - number * 0.55, 0x54d6ff, 0.4));
    });
  }
  tick() { requestAnimationFrame(() => this.tick()); this.renderer.render(this.scene, this.camera); }
}
