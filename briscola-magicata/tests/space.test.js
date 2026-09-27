import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.min.js';
import {SpaceBackdrop,FORMATION_DISTANCE,ZOOM_LIMITS} from '../src/render/space.js';
import {TableRenderer} from '../src/render/table.js';
let seed=42;const random=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);
const scene=new THREE.Scene(),space=new SpaceBackdrop(scene,random);
const camera=new THREE.OrthographicCamera(-8,8,4.5,-4.5,.1,50);
camera.position.set(0,11,16.5);camera.lookAt(0,0,0);
assert.equal(FORMATION_DISTANCE,5.8*.7);
assert.equal(space.stars.material.size,1);
assert.equal(space.stars.material.sizeAttenuation,false);
assert(space.asteroids.every(rock=>rock.mesh.receiveShadow&&rock.mesh.position.y<-2));
assert(new Set(space.asteroids.map(rock=>Math.sign(rock.vx))).size===2);
const geometries=space.asteroids.map(rock=>rock.mesh.geometry),children=scene.children.length;
const oldX=space.positions[0];
for(let i=0;i<12000;i++)space.update(.05,camera);
assert.notEqual(space.positions[0],oldX);
assert.equal(scene.children.length,children);
space.asteroids.forEach((rock,i)=>{assert.equal(rock.mesh.geometry,geometries[i]);assert(Math.abs(rock.mesh.position.x)<=24);assert(Math.abs(rock.mesh.position.z)<=17);assert(Number.isFinite(rock.mesh.rotation.y))});
for(let i=0;i<space.positions.length;i+=3){assert(Math.abs(space.positions[i])<=1);assert(Math.abs(space.positions[i+1])<=1)}
const renderer=Object.create(TableRenderer.prototype);renderer.camera=camera;
for(let i=0;i<100;i++)renderer.zoomBy(1);assert.equal(camera.zoom,ZOOM_LIMITS.max);
for(let i=0;i<100;i++)renderer.zoomBy(-1);assert.equal(camera.zoom,ZOOM_LIMITS.min);
console.log('space: formation spacing, zoom bounds, pixel stars, shadow receivers and 10-minute bounded animation: ok');

const {configureArenaModel,createArenaSun}=await import('../src/render/materials.js');
const model=new THREE.Group(),metal=new THREE.MeshStandardMaterial({color:0x555555}),accent=new THREE.MeshStandardMaterial({color:0xffed9a,emissive:0xffed9a});
model.add(new THREE.Mesh(new THREE.BoxGeometry(),metal),new THREE.Mesh(new THREE.BoxGeometry(),accent));
configureArenaModel(model,'drone');assert.equal(metal.color.getHex(),0x555555);assert.equal(accent.color.getHex(),0x66501a);assert.equal(accent.emissive.getHex(),0x080600);model.traverse(o=>{if(o.isMesh)assert(o.castShadow&&o.receiveShadow)});
const sun=createArenaSun();assert(sun.castShadow);assert.equal(sun.shadow.mapSize.x,2048);
scene.updateMatrixWorld(true);
const direction=sun.target.position.clone().sub(sun.position).normalize();
for(const x of [-FORMATION_DISTANCE,FORMATION_DISTANCE]){const ray=new THREE.Raycaster(new THREE.Vector3(x,.8,0),direction);assert(ray.intersectObjects(space.asteroids.slice(0,2).map(r=>r.mesh)).length>0,'citadel shadow ray must land on an asteroid after ten minutes')}
console.log('lighting: shadow casters, receivers below citadels and dark drone accents: ok');
