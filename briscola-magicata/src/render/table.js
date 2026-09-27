import { GLTFLoader } from '../../vendor/GLTFLoader.js';
import * as THREE from '../../vendor/three.module.min.js';

// Scena volutamente minimale: nessuna luce, ombra, foschia o effetto.
export class TableRenderer {
  constructor(element, config) {
    this.el = element;this.models=new Map();this.variants=new Map();this.lastState=null;this.loadModels();
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
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 10), new THREE.MeshStandardMaterial({ color: 0xfb8920, emissive: 0xfb8920, emissiveIntensity: 2 }));
    mesh.castShadow = true;
    this.units.add(mesh);
    this.lasers.push({ mesh, start, end, started: performance.now() });
  }
  async loadModels() {
    const loader=new GLTFLoader();
    const base=new URL('../../assets/models/orbital/',import.meta.url);
    try {
      const manifest=await fetch(new URL('manifest.json',base)).then(r=>r.json());
      await Promise.all(Object.entries(manifest.families).flatMap(([family,files])=>files.map(async(file,i)=>{
        const {scene}=await loader.loadAsync(new URL(file,base).href);
        // Supplied assets use Z as their vertical axis.
        scene.rotation.x=-Math.PI/2;
        const wrapper=new THREE.Group();wrapper.add(scene);
        const bounds=new THREE.Box3().setFromObject(wrapper),size=bounds.getSize(new THREE.Vector3()),center=bounds.getCenter(new THREE.Vector3());
        scene.position.sub(center);
        wrapper.scale.setScalar((family==='citadel'?2.1:family==='drone'?.8:.6)/Math.max(size.x,size.y,size.z));
        const accents={shield:0x0fa7ef,virus:0xbf1014,drone:0xffed9a,radiation:0x4cdd4d,magicata:0xe870e9};
        scene.traverse(mesh=>{if(!mesh.isMesh)return;mesh.castShadow=true;mesh.receiveShadow=true;const materials=Array.isArray(mesh.material)?mesh.material:[mesh.material];materials.forEach(mat=>{if(accents[family]&&mat.color){const hsl={};mat.color.getHSL(hsl);if(hsl.s>.3){mat.color.setHex(accents[family]);if(mat.emissive?.getHex())mat.emissive.setHex(accents[family])}}})});
        this.models.set(`${family}-${i}`,wrapper);
      })));
      if(this.lastState){this.stateSignature=null;this.update(this.lastState)}
    }catch(error){console.error('Caricamento modelli arena:',error)}
  }
  model(family,key,size=4) {
    if(!this.variants.has(key))this.variants.set(key,Math.floor(Math.random()*size));
    const template=this.models.get(`${family}-${this.variants.get(key)}`);
    return template?template.clone(true):new THREE.Group();
  }
  update(state) {
    this.lastState=state;
    const signature=JSON.stringify([state.gameId,state.players.map(p=>[p.shields,p.drones,p.viruses,p.radiation]),state.history[0]?.actionId]);
    if(signature===this.stateSignature)return;
    this.stateSignature=signature;
    if(this.gameId!==state.gameId){this.gameId=state.gameId;this.variants.clear()}
    this.units.clear();this.orbiters=[];this.floaters=[];this.lasers=[];this.impacts=[];
    state.players.forEach((player,index)=>{
      const side=index?5.8:-5.8,direction=index?-1:1;
      const core=this.model('citadel',`core-${index}`,2);core.position.set(side,.8,0);this.units.add(core);
      player.drones.forEach((drone,n)=>{const mesh=this.model('drone',drone.uid);mesh.position.set(side+direction*(1.7+Math.floor(n/5)*.85),.5,-1.5+n%5*.75);this.units.add(mesh)});
      player.shields.forEach((shield,n)=>{const mesh=this.model('shield',shield.uid||`${index}-shield-${shield.name}-${n}`);this.units.add(mesh);this.orbiters.push({mesh,coreX:side,direction,phase:n/Math.max(1,player.shields.length)*Math.PI*2})});
      const floating=(kind,key,n)=>{const mesh=this.model(kind,key);this.units.add(mesh);this.floaters.push({mesh,coreX:side,phase:n*.9,radius:.65+n*.08})};
      player.viruses.forEach((v,n)=>floating('virus',v.uid||`${index}-virus-${v.name}-${n}`,n));
      for(let n=0;n<player.radiation;n++)floating('radiation',player.radiationUnits?.[n]||`${index}-rad-${n}`,n+player.viruses.length);
      const magic=state.history.find(h=>h.playerId===index&&h.type==='magic'&&h.turnId>=state.turnId-1);
      if(magic)floating('magicata',magic.actionId,0);
    });
  }
  tick() {
    const time = performance.now() * 0.00055;
    this.orbiters.forEach(orbiter => {
      const angle = orbiter.phase + time;
      orbiter.mesh.position.set(orbiter.coreX + Math.cos(angle) * 1.16, 0.3, Math.sin(angle) * 1.16);
      // Piastra verticale: la faccia è rivolta verso la corsia dei propri Droni.
      orbiter.mesh.rotation.y=angle;
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
