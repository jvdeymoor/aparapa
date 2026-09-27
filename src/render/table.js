import {configureArenaModel,createArenaSun} from './materials.js';
import { SpaceBackdrop, FORMATION_DISTANCE, ZOOM_LIMITS } from './space.js';
import { GLTFLoader } from '../../vendor/GLTFLoader.js';
import * as THREE from '../../vendor/three.module.min.js';

// Orbital scene with a reusable procedural space background.
export class TableRenderer {
  constructor(element, config) {
    this.el = element;this.models=new Map();this.variants=new Map();this.lastState=null;this.loadModels();
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x02040b);
    this.target = new THREE.Vector3(0, 0, 0);
    this.camera = new THREE.OrthographicCamera(-8, 8, 4.5, -4.5, 0.1, 50);
    this.camera.position.set(0, 11, 16.5);
    this.camera.lookAt(this.target);
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    element.append(this.renderer.domElement);

    this.space = new SpaceBackdrop(this.scene);
    this.scene.add(new THREE.AmbientLight(0xffffff, .3));
    this.sun=createArenaSun();
    this.scene.add(this.sun,this.sun.target);
    this.units = new THREE.Group();
    this.orbiters = [];
    this.floaters = [];
    this.lasers = [];
    this.impacts = [];
    this.effects=new THREE.Group();this.scene.add(this.units,this.effects);this.effectQueue=[];this.unitMeshes=new Map();
    this.installPointerControls();
    addEventListener('resize', () => this.resize());
    this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(element);
    addEventListener('orientationchange', () => {
      // In orizzontale la vista deve sempre ricominciare centrata e completa.
      requestAnimationFrame(() => { this.resize(); this.resetView(); this.syncTouchMode(); });
    });
    this.resize();
    this.syncTouchMode();
    this.tick();
  }
  isLandscapePhone() { return matchMedia('(pointer:coarse) and (orientation:landscape) and (max-height:600px)').matches; }
  syncTouchMode() { this.renderer.domElement.style.touchAction = 'none'; }
  resize() {
    const width = this.el.clientWidth, height = this.el.clientHeight || 300, aspect = width / height, vertical = Math.max(9, 12 / aspect);
    this.camera.left = -(vertical * aspect) / 2;
    this.camera.right = (vertical * aspect) / 2;
    this.camera.top = vertical / 2;
    this.camera.bottom = -vertical / 2;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }
  behindView(player=0) {
    this.cameraMode="behind";const side=player?1:-1;
    this.target.set(-side*FORMATION_DISTANCE,.8,0);
    this.camera.position.set(side*(FORMATION_DISTANCE+5),5.8,0);
    this.camera.zoom=1;this.camera.lookAt(this.target);this.camera.updateProjectionMatrix();
  }
  resetView() {
    this.cameraMode="standard";
    this.target.set(0, 0, 0);
    this.camera.position.set(0, 11, 16.5);
    this.camera.zoom = 1;
    this.camera.lookAt(this.target);
    this.camera.updateProjectionMatrix();
  }
  zoomBy(direction) {
    this.camera.zoom = THREE.MathUtils.clamp(this.camera.zoom + direction * ZOOM_LIMITS.step, ZOOM_LIMITS.min, ZOOM_LIMITS.max);
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

      origin = { x: event.clientX, y: event.clientY, target: this.target.clone(), camera: this.camera.position.clone() };
      canvas.setPointerCapture(event.pointerId);
    });
    canvas.addEventListener('pointermove', event => {

      if (!origin || !canvas.hasPointerCapture(event.pointerId)) return;
      const scale = (this.camera.top - this.camera.bottom) / Math.max(1, canvas.clientHeight) / this.camera.zoom;
      const sensitivity=this.cameraMode==='behind'?.5:1;
      const right=new THREE.Vector3().setFromMatrixColumn(this.camera.matrixWorld,0);
      const up=new THREE.Vector3().setFromMatrixColumn(this.camera.matrixWorld,1);
      const delta=right.multiplyScalar(-(event.clientX-origin.x)*scale*sensitivity).add(up.multiplyScalar((event.clientY-origin.y)*scale*sensitivity));
      this.target.copy(origin.target).add(delta);this.camera.position.copy(origin.camera).add(delta);
      this.camera.lookAt(this.target);
    });
    canvas.addEventListener('pointerup', () => { origin = null; });
  }
  collectDamage(state) {
    const events=state.visualEvents||[];
    if(this.eventGame!==state.gameId){this.eventGame=state.gameId;this.seenVisual=state.nextVisualId||0;this.effectQueue=[];this.effects.clear();this.lasers=[];this.impacts=[];return}
    for(const event of events)if(event.id>this.seenVisual){
      const source=this.unitMeshes.get(event.sourceUid);
      this.effectQueue.push({...event,start:source?.position.clone(),model:source?.clone(true)});
      this.seenVisual=event.id;
    }
  }
  startDamage(event,now) {
    const target=new THREE.Vector3((event.target?1:-1)*FORMATION_DISTANCE,.8,0);
    const family=event.kind==='virus'?'virus':event.kind==='radiazione'?'radiation':null;
    const color=family==='virus'?0xff345d:family?0x66bd65:event.kind==='drone'?0x8bdcff:0xffa340;
    const mesh=family?(event.model||this.model(family,family==='radiation'?radiationBatch(event.sourceUid):event.sourceUid)):
      new THREE.Mesh(new THREE.SphereGeometry(.09,8,6),new THREE.MeshBasicMaterial({color}));
    const start=event.start|| (family?target.clone().add(new THREE.Vector3(.5,2,0)):new THREE.Vector3((event.owner?1:-1)*FORMATION_DISTANCE,.8,0));
    if(event.kind==='esaurimento del mazzo')start.copy(target).add(new THREE.Vector3(0,2,0));
    mesh.position.copy(start);this.effects.add(mesh);
    this.lasers.push({mesh,start,end:target,started:now,color,owned:!family});
  }
  advanceEffects(now) {
    if(!this.lasers.length&&this.effectQueue.length)this.startDamage(this.effectQueue.shift(),now);
    this.lasers=this.lasers.filter(effect=>{
      const t=Math.min(1,(now-effect.started)/550);effect.mesh.position.lerpVectors(effect.start,effect.end,t);
      if(t<1)return true;
      this.effects.remove(effect.mesh);if(effect.owned){effect.mesh.geometry.dispose();effect.mesh.material.dispose()}
      const mesh=new THREE.Mesh(new THREE.OctahedronGeometry(.24),new THREE.MeshBasicMaterial({color:effect.color,transparent:true,opacity:.8}));
      mesh.position.copy(effect.end);this.effects.add(mesh);this.impacts.push({mesh,until:now+220});return false;
    });
    this.impacts=this.impacts.filter(effect=>{const remaining=(effect.until-now)/220;if(remaining<=0){this.effects.remove(effect.mesh);effect.mesh.geometry.dispose();effect.mesh.material.dispose();return false}effect.mesh.scale.setScalar(1+(1-remaining)*2);effect.mesh.material.opacity=remaining;return true});
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
        configureArenaModel(scene,family);
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
    this.collectDamage(state);
    this.lastState=state;
    const signature=JSON.stringify([state.gameId,state.players.map(p=>[p.shields,p.drones,p.viruses,p.radiation]),state.history[0]?.actionId]);
    if(signature===this.stateSignature)return;
    this.stateSignature=signature;
    if(this.gameId!==state.gameId){this.gameId=state.gameId;this.variants.clear()}
    this.units.clear();this.orbiters=[];this.floaters=[];this.unitMeshes.clear();
    state.players.forEach((player,index)=>{
      const side=index?FORMATION_DISTANCE:-FORMATION_DISTANCE,direction=index?-1:1;
      const core=this.model('citadel',`core-${index}`,2);core.position.set(side,.8,0);this.units.add(core);
      player.drones.forEach((drone,n)=>{const mesh=this.model('drone',drone.uid);mesh.position.set(side+direction*(1.7+Math.floor(n/5)*.85),.5,-1.5+n%5*.75);this.units.add(mesh);this.unitMeshes.set(drone.uid,mesh)});
      player.shields.forEach((shield,n)=>{const mesh=this.model('shield',shield.uid||`${index}-shield-${shield.name}-${n}`);this.units.add(mesh);this.orbiters.push({mesh,coreX:side,direction,phase:n/Math.max(1,player.shields.length)*Math.PI*2})});
      const floating=(kind,key,n)=>{const mesh=this.model(kind,kind==='radiation'?radiationBatch(key):key);mesh.position.set(side,kind==='radiation'?2.8:1.45,0);this.units.add(mesh);this.unitMeshes.set(key,mesh);this.floaters.push({mesh,kind,coreX:side,phase:n*.9,radius:.65+n*.08})};
      player.viruses.forEach((v,n)=>floating('virus',v.uid||`${index}-virus-${v.name}-${n}`,n));
      for(let n=0;n<player.radiation;n++)floating('radiation',player.radiationUnits?.[n]||`${index}-rad-${n}`,n+player.viruses.length);
      const magic=state.history.find(h=>h.playerId===index&&h.type==='magic'&&h.turnId>=state.turnId-1);
      if(magic)floating('magicata',magic.actionId,0);
    });
  }
  tick() {
    const frameTime = performance.now();
    const dt = Math.min(.05, Math.max(0, (frameTime - (this.lastFrame ?? frameTime)) / 1000));
    this.lastFrame = frameTime;
    this.space.update(dt, this.camera);
    const time = frameTime * 0.00055;
    this.orbiters.forEach(orbiter => {
      const angle = orbiter.phase + time;
      orbiter.mesh.position.set(orbiter.coreX + Math.cos(angle) * 1.16, 0.3, Math.sin(angle) * 1.16);
      // Piastra verticale: la faccia è rivolta verso la corsia dei propri Droni.
      orbiter.mesh.rotation.y=angle;
    });
    this.floaters.forEach(floater => {
      if(floater.kind==='radiation'){const t=time*.35+floater.phase;floater.mesh.position.set(floater.coreX+Math.cos(floater.phase)*floater.radius+Math.sin(t)*.15,2.8+Math.sin(t*1.3)*.12,Math.sin(floater.phase)*floater.radius+Math.cos(t)*.12);floater.mesh.rotation.set(Math.sin(t)*.06,Math.sin(t*.7)*.12,0);return}
      const angle=time*1.8+floater.phase;
      floater.mesh.position.set(floater.coreX+Math.cos(angle)*floater.radius,1.45+Math.sin(angle*2)*.16,Math.sin(angle)*floater.radius);
      floater.mesh.rotation.y=angle*2;
    });
    this.advanceEffects(frameTime);
    requestAnimationFrame(() => this.tick());
    this.renderer.render(this.scene, this.camera);
  }
}

export const radiationBatch=key=>String(key||"legacy").replace(/^(r-\d+-\d+)-\d+$/,"$1");
