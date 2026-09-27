import assert from 'node:assert/strict';
import {newGame,act,legal,endTurn,settleTurn,isPreparing,readyPreparation,autoPrepare,autoPlay,PREPARATION_WARNING} from '../src/game/engine.js';
const C={RULES:{CORE_INTEGRITY:20,STARTING_HAND:5,MAX_HAND:8,MOVES_PER_TURN:2,START_ENERGY:3,START_MAX_ENERGY:3,ENERGY_EVERY_TURNS:3,ABSOLUTE_MAX_ENERGY:7,BRISCOLA_EVERY_ROUNDS:5,DOMINION_THRESHOLD:10,DOMINION_TURNS_TO_WIN:3,DRAW_PER_TURN:1}};
function fixture(){const s=newGame(C,42);for(const p of s.players){p.hand=['scudo-1','scudo-3','laser-1','virus-1','radiazione-1'];p.openingHand=[...p.hand]}return s}
let s=fixture();assert(isPreparing(s));assert.equal(settleTurn(s,C),s);assert.throws(()=>endTurn(s,C),/INIZIA/);
assert.equal(legal(s,C,{type:'attack',uid:'whatever'},0),PREPARATION_WARNING);
assert.equal(legal(s,C,{type:'play',cardId:'laser-1',target:1},0),PREPARATION_WARNING);
const original=JSON.stringify(s);s=act(s,C,{type:'play',cardId:'scudo-1'},1);assert.equal(s.players[1].shields.length,1);assert.equal(s.players[1].energy,2);assert.equal(s.preparation.movesUsed[1],1);assert.equal(s.active,0);assert.notEqual(JSON.stringify(s),original);
s=act(s,C,{type:'play',cardId:'scudo-3'},1);assert.equal(s.preparation.movesUsed[1],2);assert.equal(s.players[1].energy,1);assert.throws(()=>act(s,C,{type:'play',cardId:'virus-1',target:0},1),/Mosse/);
s=act(s,C,{type:'play',cardId:'virus-1',target:1},0);s=act(s,C,{type:'play',cardId:'radiazione-1',target:1},0);assert(s.players.every(p=>p.integrity===20));assert(isPreparing(s));
s=readyPreparation(s,C,0);assert(isPreparing(s));assert.equal(s.preparation.ready[0],true);assert.throws(()=>act(s,C,{type:'play',cardId:'scudo-1'},0),/INIZIA/);assert.equal(readyPreparation(s,C,0),s);
s=readyPreparation(s,C,1);assert.equal(s.phase,'battle');assert.equal(s.turnId,3);assert.equal(s.active,0);assert.equal(s.movesUsed,0);assert.equal(s.players[0].energy,s.players[0].maxEnergy);assert.equal(s.players[1].viruses.length,1,'delayed effects await owner turn');s=endTurn(s,C);assert.equal(s.players[1].viruses.length,0);assert.equal(s.players[1].radiation,1);
s=fixture();for(const p of s.players){p.hand=['laser-1','laser-2','laser-3','laser-4','laser-5'];p.openingHand=[...p.hand]}s=readyPreparation(s,C,0);s=readyPreparation(s,C,1);assert.equal(s.phase,'battle','no usable opening cards must not deadlock');
s=fixture();s.players[0].hand=['magicata-1'];s.players[0].openingHand=['magicata-1'];s=act(s,C,{type:'play',cardId:'magicata-1'},0);const drawn=s.players[0].hand[0];assert(legal(s,C,{type:'play',cardId:drawn,target:1},0));assert(s.players[0].openingHand.length===1);
for(let seed=1;seed<=50;seed++){let game=newGame(C,seed);game=autoPrepare(game,C,1);assert(isPreparing(game));assert(game.players.every(p=>p.integrity===20));game=autoPrepare(game,C,0);let steps=0;while(game.winner===null&&steps++<1000)game=autoPlay(game,C);assert.notEqual(game.winner,null)}
console.log('preparation: independent budgets, attack block, delayed damage, two ready confirmations, empty options and 50 complete games: ok');
