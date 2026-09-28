import assert from 'node:assert/strict';
import {OpponentPresenter} from '../src/ui/opponent-presenter.js';
import {newGame,act,endTurn} from '../src/game/engine.js';
import {CARD_POOL} from '../src/data/cards.js';
import {cardBadges,cardDetails,cardName} from '../src/ui/card-details.js';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const context={window:{}};vm.runInNewContext((await readFile(new URL('../index.html',import.meta.url),'utf8')).match(/<script>([\s\S]*?)<\/script>/)[1],context);const C=context.window.CONFIG;
let s=newGame(C,78,undefined,{prepare:false});s.players[0].hand=['laser-1','drone-1','scudo-1'];s.players[0].energy=30;s.players[1].shields=[{name:'test',amount:1}];s.players[1].drones=[{uid:'target',name:'target',hp:1,dominance:0}];
s=act(s,C,{type:'play',cardId:'laser-1',target:1});
assert.equal(s.presentationEvents[0].cardId,'laser-1');assert.equal(s.presentationEvents[0].kind,'play');
const damage=s.damageHistory[0];assert.equal(damage.sourceName,'Raggio Corto');assert.equal(damage.shieldDamage,1);assert.equal(damage.droneDamage,1);assert.equal(damage.coreDamage,0);assert.equal(damage.amount,2);assert.equal(damage.turnId,1);assert(Number.isFinite(Date.parse(damage.at)));
s.players[1].viruses=[{uid:'v',name:'Worm Rosso',amount:1}];s.players[1].radiation=2;s.players[1].radiationUnits=['r-1-1-0','r-1-1-1'];s.radiationSources={'r-1-1-0':'Polvere Solare'};
s=endTurn(s,C);assert(s.damageHistory.some(e=>e.kind==='virus'&&e.sourceName==='Worm Rosso'));assert(s.damageHistory.some(e=>e.kind==='radiazione'&&e.sourceName==='Polvere Solare'));
let d=newGame(C,79,undefined,{prepare:false});d.players[0].drones=[{uid:'d',name:'Scout K-9',hp:2,attack:1,used:false}];d.players[0].discard=['drone-1'];d=act(d,C,{type:'attack',uid:'d'});assert.equal(d.presentationEvents[0].cardId,'drone-1');assert.equal(d.presentationEvents[0].kind,'attack');
// Events are serialized even when polling delivers multiple moves at once.
const played=[],resolvers=[];let idle=0;
const presenter=new OpponentPresenter(()=>idle++,event=>{played.push(event.id);return new Promise(resolve=>resolvers.push(resolve))});
const state={gameId:'online',nextPresentationId:0,presentationEvents:[],phase:'battle'};presenter.observe(state,0);
const events=[1,2,3].map(id=>({id,player:1,cardId:'drone-1',kind:'play'}));
presenter.observe({...state,nextPresentationId:2,presentationEvents:events.slice(0,2)},0);assert(presenter.busy);assert.deepEqual(played,[1]);
presenter.observe({...state,nextPresentationId:3,presentationEvents:events},0);presenter.observe({...state,nextPresentationId:3,presentationEvents:events},0);assert.equal(presenter.queue.length,2);
for(let i=0;i<3;i++){resolvers.shift()();await new Promise(resolve=>setImmediate(resolve))}
assert.deepEqual(played,[1,2,3]);assert.equal(idle,1);assert(!presenter.busy);
presenter.observe({...state,gameId:'rejoin',nextPresentationId:3,presentationEvents:events},0);assert(!presenter.busy,'rejoin must not replay old turns');
presenter.observe({...state,gameId:'rejoin',nextPresentationId:4,presentationEvents:[{id:4,player:0,cardId:'laser-1',kind:'play'}]},0);assert(!presenter.busy,'own actions are not opponent reveals');
for(const card of CARD_POOL){const badges=cardBadges(card);assert(!badges.includes('NaN'));assert(!cardDetails(card).includes('undefined'));assert(cardName(card.name).includes('textLength='))}
assert(cardBadges(CARD_POOL.find(c=>c.id==='radiazione-3')).includes('icon-integrita'));
console.log('presentation: ordered opponent queue, polling deduplication, own/rejoin filtering, damage attribution and all card values: ok');
let longGame=newGame(C,80,undefined,{prepare:false});longGame.players[1].integrity=10000;
for(let i=0;i<130;i++){longGame.active=0;longGame.movesUsed=0;longGame.players[0].energy=10;longGame.players[0].hand=['laser-1','scudo-1'];longGame=act(longGame,C,{type:'play',cardId:'laser-1',target:1})}
assert.equal(longGame.damageHistory.length,130,'damage report retains every hit beyond visual-event window');assert.equal(longGame.visualEvents.length,120);
const delayed=[];let completed=0;
const cancellable=new OpponentPresenter(()=>completed++,()=>new Promise(resolve=>delayed.push(resolve)));
cancellable.observe(state,0);cancellable.observe({...state,presentationEvents:events.slice(0,1),nextPresentationId:1},0);
cancellable.observe({...state,gameId:'new-game'},0);delayed.shift()();await new Promise(resolve=>setImmediate(resolve));assert.equal(completed,0);assert(!cancellable.busy);
console.log('presentation: complete damage history and game-change cancellation: ok');
// A polling batch must finish each card/sound AND its arena attack before the next card.
const sequence=[],pending=[];
const step=label=>{sequence.push(label);return new Promise(resolve=>pending.push(resolve))};
const battle=new OpponentPresenter(()=>sequence.push('idle'),event=>step('opponent-'+event.id),{local:event=>step('local-'+event.id),damage:event=>step('damage-'+event.id)});
battle.observe({gameId:'sequence',nextPresentationId:0,nextVisualId:0},0);
const batch={gameId:'sequence',nextPresentationId:2,nextVisualId:3,phase:'battle',presentationEvents:[{id:1,player:0,cardId:'laser-1'},{id:2,player:1,cardId:'drone-1'}],visualEvents:[{id:1,afterPresentationId:1},{id:2,afterPresentationId:1},{id:3,afterPresentationId:2}]};
battle.observe(batch,0);battle.observe(batch,0);assert.deepEqual(sequence,['local-1']);
for(const expected of ['damage-1','damage-2','opponent-2','damage-3','idle']){pending.shift()();await new Promise(resolve=>setImmediate(resolve));assert.equal(sequence.at(-1),expected)}
assert(!battle.busy);assert.equal(sequence.length,6);
assert.equal(d.visualEvents[0].afterPresentationId,d.presentationEvents[0].id);
console.log('battle sequence: local and opponent card/sound, corresponding arena damage, automatic damage, deduplication: ok');
