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

    const slab = new THREE.Mesh(new THREE.BoxGeometry(13.8, 0.28, 7.8), new THREE.MeshStandardMaterial({ color: 0x5a351d, roughness: 0.96, metalness: 0 }));
    slab.position.y = -0.15;
    slab.receiveShadow = true;
    this.scene.add(slab);
    const field = new THREE.Mesh(new THREE.PlaneGeometry(13.8, 7.8), new THREE.MeshStandardMaterial({ color: 0x3f7f3b, roughness: 0.98, metalness: 0 }));
    field.rotation.x = -Math.PI / 2;
    field.receiveShadow = true;
    this.scene.add(field);
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.28));
    this.spot = new THREE.SpotLight(0xffffff, 5.5, 28, 0.62, 0.25, 1.3);
    this.spot.position.set(0, 13.8, 0);
    this.spot.castShadow = true;
    this.spot.shadow.mapSize.set(1024, 1024);
    this.spot.target.position.set(0, 0, 0);
    this.scene.add(this.spot, this.spot.target);
    this.units = new THREE.Group();
    this.orbiters = [];
    this.floaters = [];
    this.lasers = [];
    this.impacts = [];
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
  fireLaser(owner) {
    const start = owner ? 5.1 : -5.1, end = owner ? -5.1 : 5.1;
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 10), new THREE.MeshStandardMaterial({ color: 0xff354c, emissive: 0xff1025, emissiveIntensity: 2 }));
    mesh.castShadow = true;
    this.units.add(mesh);
    this.lasers.push({ mesh, start, end, started: performance.now() });
  }
  update(state) {
    this.units.clear();
    this.orbiters = [];
    this.floaters = [];
    this.lasers = [];
    this.impacts = [];
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
    const floatingEffect = (coreX, index, kind) => {
      const geometry = kind==='virus'?new THREE.ConeGeometry(0.24, 0.5, 4):new THREE.OctahedronGeometry(0.24);
      const material = new THREE.MeshStandardMaterial({ color: kind==='virus'?0xff354c:0xa7ff3e, emissive: kind==='virus'?0x5b0010:0x294d00, emissiveIntensity: 0.7, roughness: 0.35, metalness: 0.25 });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.castShadow = true;
      this.units.add(mesh);
      this.floaters.push({ mesh, coreX, phase:index*.9, radius:.52+index*.08 });
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
      player.viruses.forEach((virus, number) => floatingEffect(side, number, 'virus'));
      for(let number=0;number<player.radiation;number++)floatingEffect(side, number+player.viruses.length, 'radiation');
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
    this.floaters.forEach(floater => {
      const angle=time*1.8+floater.phase;
      floater.mesh.position.set(floater.coreX+Math.cos(angle)*floater.radius,1.45+Math.sin(angle*2)*.16,Math.sin(angle)*floater.radius);
      floater.mesh.rotation.y=angle*2;
    });
    const now=performance.now();
    this.lasers=this.lasers.filter(laser=>{
      const progress=(now-laser.started)/420;
      if(progress>=1){this.units.remove(laser.mesh);const impact=new THREE.Mesh(new THREE.OctahedronGeometry(.5,0),new THREE.MeshStandardMaterial({color:0xffd36a,emissive:0xff5a10,emissiveIntensity:2}));impact.position.set(laser.end,.8,0);this.units.add(impact);this.impacts.push({mesh:impact,until:now+180});return false}
      laser.mesh.position.set(THREE.MathUtils.lerp(laser.start,laser.end,progress),.8,0);
      return true;
    });
    this.impacts=this.impacts.filter(impact=>{if(now>=impact.until){this.units.remove(impact.mesh);return false}const scale=1+(impact.until-now)/180;impact.mesh.scale.setScalar(scale);return true});
    requestAnimationFrame(() => this.tick());
    this.renderer.render(this.scene, this.camera);
  }
}
