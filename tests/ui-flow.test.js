// Controller smoke test with a minimal DOM; browser layout is deliberately not simulated.
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import * as engine from '../src/game/engine.js';
import * as cards from '../src/data/cards.js';
import {spriteStyle} from '../src/data/art.js';
import {LocalGameAdapter} from '../src/storage/adapter.js';
const elements=new Map(),timers=new Map(),storage=new Map();let timerId=0,reloaded=false;
class Element {
 constructor(){this.style={};this.dataset={};this.scrollTop=0;this.value='';this.classList={remove(){},add(){},toggle(){}};this.html=''}
 set innerHTML(html){this.html=html;if(this===elements.get('#modalRoot')){for(const key of [...elements.keys()])if(['#singleChoice','#multiChoice','#closeModal','#backLobby','.modal','#modalRoot .modal','#confirmOnlineDeck','#onlineDeckTotal'].includes(key))elements.delete(key)}
 for(const match of html.matchAll(/id="([^"]+)"/g))elements.set('#'+match[1],new Element());
 for(const match of html.matchAll(/data-online-category="([^"]+)"[^>]*value="([^"]+)"/g)){const el=new Element();el.value=match[2];elements.set(`[data-online-category="${match[1]}"]`,el)}
 const kind=html.match(/class="modal" data-kind="([^"]+)"/);if(kind){const el=new Element();el.dataset.kind=kind[1];elements.set('.modal',el);elements.set('#modalRoot .modal',el)}
 }
 get innerHTML(){return this.html}
 insertAdjacentHTML(_,html){for(const match of html.matchAll(/id="([^"]+)"/g))elements.set('#'+match[1],new Element())}
 addEventListener(){} append(){} remove(){} querySelector(){return null}
}
const document={head:new Element(),body:new Element(),addEventListener(){},createElement:()=>new Element(),querySelector(selector){if(elements.has(selector))return elements.get(selector);if(['#closeModal','#backLobby','.modal','#modalRoot .modal'].includes(selector))return null;const el=new Element();elements.set(selector,el);return el},querySelectorAll(selector){if(selector==='[data-online-category]')return [...elements].filter(([k])=>k.startsWith('[data-online-category=')).map(([,v])=>v);return []}};
globalThis.localStorage={getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)};
const html=await readFile(new URL('../index.html',import.meta.url),'utf8');const config={window:{}};vm.runInNewContext(html.match(/<script>([\s\S]*?)<\/script>/)[1],config);
const context=vm.createContext({...engine,...cards,spriteStyle,LocalGameAdapter,document,window:config.window,localStorage,location:{href:'http://localhost/',pathname:'/',search:'',replace(){reloaded=true}},URL,URLSearchParams,console,matchMedia:()=>({matches:false}),innerWidth:1280,innerHeight:800,MutationObserver:class{observe(){}},TableRenderer:class{update(){}resetView(){}},setTimeout:(fn,ms)=>{const id=++timerId;timers.set(id,{fn,ms});return id},clearTimeout:id=>timers.delete(id),setInterval:()=>0,clearInterval(){},confirm:()=>true,alert:message=>{throw Error(message)}});
let code=await readFile(new URL('../src/main.js',import.meta.url),'utf8');code=code.replace(/^import[^\n]+\n/gm,'');vm.runInContext(code,context);
while([...timers.values()].some(t=>t.ms===0)){for(const [id,t] of [...timers])if(t.ms===0){timers.delete(id);t.fn()}}
const get=selector=>document.querySelector(selector),run=code=>vm.runInContext(code,context);
assert(get('#modalRoot').innerHTML.includes('SINGLEPLAYER'));assert(!get('#modalRoot').innerHTML.includes('id="closeModal"'));
get('#singleChoice').onclick();assert(get('#modalRoot').innerHTML.includes('INIZIA PARTITA'));await get('#confirmOnlineDeck').onclick();assert.equal(run('singleplayer'),true);assert.equal(run('paused'),false);assert.equal(get('#modalRoot').innerHTML,'');assert.equal(get('#onlineButton').textContent,'SINGLEPLAYER');
run('s=endTurn(s,C);render()');assert.equal(run('s.active'),1);assert([...timers.values()].some(t=>t.ms===850));run('openOnlineLobby()');assert(![...timers.values()].some(t=>t.ms===850));assert(get('#modalRoot').innerHTML.includes('CONTINUA A GIOCARE'));get('#singleChoice').onclick();assert([...timers.values()].some(t=>t.ms===850));
run("openCardPreview('laser-1')");assert(get('#modalRoot').innerHTML.includes('preview-art'));assert(!get('#modalRoot').innerHTML.includes('class="close"'));get('#closeModal').onclick();assert.equal(get('#modalRoot').innerHTML,'');
run('s.winner=0;render()');assert(get('#modalRoot').innerHTML.includes('VITTORIA'));get('#closeModal').onclick();assert(reloaded);assert.equal(storage.size,0);
console.log('ui controller: initial lobby, deck, singleplayer, CPU pause/resume, card modal and endgame reset: ok');
