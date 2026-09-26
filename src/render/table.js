import * as THREE from '../../vendor/three.module.min.js';

// Arena tattica: ortografica per mantenere i due lati simmetrici su ogni schermo.
export class TableRenderer {
  constructor(element, config) {
    this.el = element;
    this.C = config;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#0b1c3e');
    this.camera = new THREE.OrthographicCamera(-8, 8, 4.5, -4.5, 0.1, 50);
    this.camera.position.set(0, 13, 11);
    this.camera.lookAt(0, 0, 0);
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    element.append(this.renderer.domElement);
    const table = new THREE.Mesh(new THREE.BoxGeometry(config.TABLE.WIDTH, 0.35, config.TABLE.HEIGHT), new THREE.MeshBasicMaterial({ color: '#193b78' }));
    table.position.y = -0.25;
    this.scene.add(table);
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
