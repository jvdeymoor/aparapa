import assert from 'node:assert/strict';
import {access} from 'node:fs/promises';
import {AUDIO_FILES,GameAudio,actionSound,reverseBuffer,effectGain} from '../src/ui/audio.js';
for(const file of Object.values(AUDIO_FILES))await access(new URL('../assets/audio/samples/'+file,import.meta.url));
for(const [cardId,sound] of [['drone-1','drone'],['virus-1','virus'],['radiazione-1','radiation'],['laser-1','laser'],['scudo-1','shield'],['magicata-1','magic']])assert.equal(actionSound({kind:'play',cardId}),sound);
assert.equal(actionSound({kind:'attack',cardId:'drone-1'}),'attackDrone');
const channels=[new Float32Array([1,2,3]),new Float32Array([4,5,6])];
const reversed=reverseBuffer({createBuffer(count,length,rate){assert.equal(rate,44100);const data=Array.from({length:count},()=>new Float32Array(length));return {getChannelData:i=>data[i]}}},{numberOfChannels:2,length:3,sampleRate:44100,getChannelData:i=>channels[i]});
assert.deepEqual([...reversed.getChannelData(0)],[3,2,1]);assert.deepEqual([...reversed.getChannelData(1)],[6,5,4]);assert.deepEqual([...channels[0]],[1,2,3]);
const audio=new GameAudio(),heard=[];audio.play=key=>heard.push(key);
const state={gameId:'a',nextPresentationId:1,presentationEvents:[{id:1,player:0,kind:'play',cardId:'laser-1'}],phase:'battle'};
audio.observe(state,0);assert.deepEqual(heard,[]);
state.presentationEvents.push({id:2,player:0,kind:'play',cardId:'scudo-1'},{id:3,player:1,kind:'play',cardId:'virus-1'});state.nextPresentationId=3;
audio.observe(state,0);audio.observe(state,0);assert.deepEqual(heard,['shield']);
state.phase='preparation';state.presentationEvents.push({id:4,player:1,kind:'play',cardId:'drone-1'});audio.observe(state,0);assert.deepEqual(heard,['shield','drone']);
state.gameId='b';state.nextPresentationId=4;audio.observe(state,0);assert.equal(heard.length,2);
console.log('audio: assets, type mapping, stereo reverse, no history replay or duplicate polling/opponent sounds: ok');

const levels=new GameAudio();assert.deepEqual(levels.levels,{music:.15,effects:.5});levels.music={volume:.5};levels.setLevel('music',.2);assert.equal(levels.music.volume,.2);levels.setLevel('effects',2);assert.equal(levels.levels.effects,1);levels.setLevel('effects',-1);assert.equal(levels.levels.effects,0);

const buffer=value=>({numberOfChannels:1,getChannelData:()=>new Float32Array([value,-value,value,-value])});
assert(Math.abs(effectGain(buffer(.4))*.4-effectGain(buffer(.1))*.1)<1e-6);
let stopped=0,paused=0,suspended=0;const bg=new GameAudio();bg.music={pause(){paused++}};bg.sources.add({stop(){stopped++}});bg.context={suspend(){suspended++;return Promise.resolve()}};bg.setBackground(true);assert(bg.background);assert.equal(stopped,1);assert.equal(paused,1);assert.equal(suspended,1);let resumed=0;bg.unlock=async()=>resumed++;bg.setBackground(false);assert.equal(resumed,1);
