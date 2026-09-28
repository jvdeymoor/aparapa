// Run with a temporary in-memory server: PORT=3011 node server.js
import assert from 'node:assert/strict';
import {DEFAULT_DECK_COUNTS} from '../src/data/cards.js';
import {availableActions} from '../src/game/engine.js';
const base=process.env.TEST_API_URL||'http://127.0.0.1:3011';
const C={RULES:{MOVES_PER_TURN:2}};
const health=await fetch(base+'/api/health').then(response=>response.json());assert.equal(health.ok,true);assert(health.commit===null||/^[a-f0-9]{40}$/.test(health.commit));
for(const [file,mime] of [['ostLoop.mp3','audio/mpeg'],['carta.wav','audio/wav']]){const response=await fetch(base+'/assets/audio/samples/'+file);assert.equal(response.status,200);assert(response.headers.get('content-type').includes(mime));}
async function request(path,session,body){const response=await fetch(base+path,{method:body?'POST':'GET',headers:{'content-type':'application/json',...(session?{authorization:`Bearer ${session.accessToken}`}:{})},...(body?{body:JSON.stringify(body)}:{})});return {status:response.status,data:await response.json()}}
const first=(await request('/api/games',null,{deckCounts:DEFAULT_DECK_COUNTS})).data;
const route=`/api/games/${first.code}`;
try{
 assert((await request(route,first)).data.waiting);
 const second=(await request(route+'/join',null,{deckCounts:DEFAULT_DECK_COUNTS})).data;
 let state=(await request(route,first)).data.state;
 assert(state.players[1].hand.every(id=>id==='hidden'));
 assert.equal(state.phase,'preparation');assert(state.players[1].openingHand.every(id=>id==='hidden'));
 assert.equal((await request(route+'/end-turn',first,{})).status,400);
 assert.equal((await request(route+'/action',second,{action:{type:'attack',uid:'x'}})).status,400);
 const sessions=[first,second];
 const preparations=await Promise.all(sessions.map(async(session,actor)=>{const view=(await request(route,session)).data.state;const action=availableActions(view,C,actor)[0];return action?request(route+'/action',session,{action}):null}));
 for(const result of preparations)if(result)assert.equal(result.status,200);
 state=(await request(route,first)).data.state;preparations.forEach((result,i)=>{if(result)assert.equal(state.preparation.movesUsed[i],1)});
 const confirmations=await Promise.all(sessions.map(session=>request(route+'/ready',session,{})));assert(confirmations.every(r=>r.status===200));
 state=(await request(route,first)).data.state;assert.equal(state.phase,'battle');assert(state.preparation.ready.every(Boolean));assert.equal(state.turnId,3);
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
 assert(secondView.presentationEvents.length>0);
 for(const event of secondView.presentationEvents)assert(secondView.players[event.player].discard.includes(event.cardId),'only already played cards may be revealed');
 for(const event of secondView.damageHistory||[])assert(event.at&&event.turnId&&event.amount>=0);
 for(const asset of ['/assets/images/cards/sprite-sheet.png','/vendor/GLTFLoader.js','/assets/models/orbital/drone_01.glb'])assert.equal((await fetch(base+asset)).status,200);
}finally{assert.equal((await request(route+'/leave',first,{})).status,200);assert.equal((await request(route,first)).status,410)}
console.log('api: room, preparation privacy, concurrent opening actions/readiness, automatic turn, assets and leave: ok');
