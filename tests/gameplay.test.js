import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {newGame,act,endTurn,autoPlay,availableActions,legal,cardCost} from '../src/game/engine.js';
import {CARD_POOL} from '../src/data/cards.js';
import {SPRITE_NAMES,spriteStyle} from '../src/data/art.js';
import {GLTFLoader} from '../vendor/GLTFLoader.js';
const C={RULES:{CORE_INTEGRITY:20,STARTING_HAND:5,MAX_HAND:8,MOVES_PER_TURN:2,START_ENERGY:3,START_MAX_ENERGY:3,ENERGY_EVERY_TURNS:3,ABSOLUTE_MAX_ENERGY:7,BRISCOLA_EVERY_ROUNDS:5,DOMINION_THRESHOLD:10,DOMINION_TURNS_TO_WIN:3,DRAW_PER_TURN:1}};
function fixture(){const s=newGame(C,42);s.players[0].hand=['scudo-1','scudo-2','laser-1'];return s}
let s=fixture();s=act(s,C,{type:'play',cardId:'scudo-1'});assert.equal(s.active,0);s=act(s,C,{type:'play',cardId:'scudo-2'});assert.equal(s.active,1,'second action ends turn');
s=fixture();s.players[0].hand=['laser-1','magicata-2'];s=act(s,C,{type:'play',cardId:'laser-1',target:1});assert.equal(s.active,1,'no affordable actions ends turn early');
s=fixture();s.players[0].hand=['laser-1'];s.players[0].drones=[{uid:'own',attack:2,hp:2,used:false}];s=act(s,C,{type:'play',cardId:'laser-1',target:1});assert.equal(s.active,0,'drone attack keeps the turn playable');assert(availableActions(s,C).some(a=>a.type==='attack'));
s=fixture();s.players[0].hand=['laser-4','scudo-1'];s.players[0].energy=9;s.players[1].directives=[];s.players[1].shields=[{amount:1}];s.players[1].drones=[{uid:'victim',name:'Scout',hp:2,dominance:1}];s.players[1].dominance=1;const original=JSON.stringify(s);const hit=act(s,C,{type:'play',cardId:'laser-4',target:1});assert.equal(JSON.stringify(s),original);assert.equal(hit.players[1].integrity,18);assert.equal(hit.players[1].drones.length,0);assert.equal(hit.players[1].dominance,0);
s=fixture();s.players[0].energy=9;s.players[0].hand=['laser-4','laser-3'];s=act(s,C,{type:'play',cardId:'laser-4',target:1});assert.equal(s.players[1].integrity,17);assert.equal(s.players[1].directives[0].active,false);assert.equal(s.players[0].directives[0].active,true);s=act(s,C,{type:'play',cardId:'laser-3',target:1});assert.equal(s.players[1].integrity,13,'interception applies only to first strong laser');
s=fixture();s.players[1].radiation=1;s.players[1].viruses=[{name:'Worm',amount:2}];s.players[1].drones=[{name:'Defender',hp:4,dominance:0}];s=endTurn(s,C);assert.equal(s.players[1].drones[0].hp,1);assert.equal(s.players[1].integrity,20);
s=fixture();s.players[1].integrity=1;s.players[1].radiation=1;s.players[1].dominance=10;s.players[1].dominionStreak=2;s=endTurn(s,C);assert.equal(s.winner,0,'lethal damage must not be overwritten by dominion');assert.equal(endTurn(s,C),s);
s=fixture();s.temp.reducedMoves[0]=-1;s=act(s,C,{type:'play',cardId:'scudo-1'});assert.equal(s.active,1);assert.equal(s.temp.reducedMoves[0],0,'move penalty lasts one turn');
assert.equal(legal(fixture(),C,{type:'fake'}),'Azione sconosciuta');
for(let seed=1;seed<=50;seed++){let game=newGame(C,seed),steps=0;while(game.winner===null&&steps++<1000)game=autoPlay(game,C);assert.notEqual(game.winner,null,`CPU game ${seed} must finish`);assert(game.players.every(p=>p.integrity>=0&&p.dominance>=0&&p.drones.every(d=>d.hp>0)))}
s=fixture();s.briscola.name='SOVRACCARICO';const laser=CARD_POOL.find(c=>c.id==='laser-1');assert.equal(cardCost(s,laser),1);
assert.equal(SPRITE_NAMES.length,67);assert.equal(new Set(SPRITE_NAMES).size,67);for(const card of CARD_POOL)assert(SPRITE_NAMES.includes(card.name),card.name);assert.equal(spriteStyle('hidden'),'background-position:100% 100%');assert.equal(SPRITE_NAMES.indexOf('Falso Positivo'),16);assert.equal(SPRITE_NAMES.indexOf('Corvo'),29);
const manifest=JSON.parse(await readFile(new URL('../assets/models/orbital/manifest.json',import.meta.url)));
let loaded=0;for(const files of Object.values(manifest.families))for(const file of files){const bytes=await readFile(new URL('../assets/models/orbital/'+file,import.meta.url));const gltf=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');let meshes=0;gltf.scene.traverse(o=>{if(o.isMesh){meshes++;assert(o.material)}});assert(meshes>0,file);loaded++}assert.equal(loaded,22);
console.log('gameplay: automatic turns, damage, CPU (50 games), sprites and 22 GLB models: ok');
