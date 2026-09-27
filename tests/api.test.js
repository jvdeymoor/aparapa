// Run with a temporary in-memory server: PORT=3011 node server.js
import assert from 'node:assert/strict';
import {DEFAULT_DECK_COUNTS} from '../src/data/cards.js';
import {availableActions} from '../src/game/engine.js';
const base=process.env.TEST_API_URL||'http://127.0.0.1:3011';
const C={RULES:{MOVES_PER_TURN:2}};
async function request(path,session,body){const response=await fetch(base+path,{method:body?'POST':'GET',headers:{'content-type':'application/json',...(session?{authorization:`Bearer ${session.accessToken}`}:{})},...(body?{body:JSON.stringify(body)}:{})});return {status:response.status,data:await response.json()}}
const first=(await request('/api/games',null,{deckCounts:DEFAULT_DECK_COUNTS})).data;
const route=`/api/games/${first.code}`;
try{
 assert((await request(route,first)).data.waiting);
 const second=(await request(route+'/join',null,{deckCounts:DEFAULT_DECK_COUNTS})).data;
 let state=(await request(route,first)).data.state;
 assert(state.players[1].hand.every(id=>id==='hidden'));
 assert.equal((await request(route+'/action',second,{action:{type:'play',cardId:'laser-1',target:0}})).status,409);
 const initialTurn=state.turnId;
 for(let i=0;i<2&&state.active===0;i++){
  const action=availableActions(state,C)[0];assert(action);
  const result=await request(route+'/action',first,{action});assert.equal(result.status,200);state=result.data.state;
 }
 assert(state.turnId>initialTurn,'API must advance turn automatically');
 const secondView=(await request(route,second)).data.state;
 assert(secondView.players[0].hand.every(id=>id==='hidden'));
 assert.equal(secondView.turnId,state.turnId);
 for(const asset of ['/assets/images/cards/sprite-sheet.png','/vendor/GLTFLoader.js','/assets/models/orbital/drone_01.glb'])assert.equal((await fetch(base+asset)).status,200);
}finally{assert.equal((await request(route+'/leave',first,{})).status,200);assert.equal((await request(route,first)).status,410)}
console.log('api: room, join, privacy, automatic turn, assets and leave: ok');
