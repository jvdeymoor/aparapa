import {byId} from '../data/cards.js';

// Replace these files in assets/audio/samples/, keeping their names.
export const AUDIO_FILES={music:'ostLoop.mp3',magic:'magicata.wav',touch:'touch.wav',confirm:'conferma.wav',close:'chiudi.wav',card:'carta.wav',drone:'drone.wav',virus:'virus.wav',radiation:'radioattivo.wav',laser:'laser.wav',shield:'scudo.wav',attackDrone:'attacco_drone.wav',attackVirus:'attacco_virus.wav',attackRadiation:'attacco_radioattivo.wav'};
export const AUDIO_LEVELS={music:.15,effects:.25};
const base=new URL('../../assets/audio/samples/',import.meta.url);
// Active-sample RMS matching, peak-limited to avoid clipping and excessive boosts.
export function effectGain(buffer){let sum=0,count=0,peak=0;for(let c=0;c<buffer.numberOfChannels;c++)for(const value of buffer.getChannelData(c)){const level=Math.abs(value);peak=Math.max(peak,level);if(level>.003){sum+=value*value;count++}}return count?Math.min(4,.16/Math.sqrt(sum/count),.95/peak):1}
export function reverseBuffer(context,buffer){
 const reversed=context.createBuffer(buffer.numberOfChannels,buffer.length,buffer.sampleRate);
 for(let channel=0;channel<buffer.numberOfChannels;channel++)reversed.getChannelData(channel).set(buffer.getChannelData(channel).slice().reverse());
 return reversed;
}
export function actionSound(event){
 if(event.kind==='attack')return 'attackDrone';
 const effect=byId(event.cardId)?.effect;
 return ({drone:'drone',virus:'virus',radiation:'radiation',laser:'laser',shield:'shield',magic:'magic'})[effect]||null;
}
export class GameAudio {
 constructor(){this.buffers=new Map();this.music=null;this.context=null;this.muted=false;this.started=false;this.levels={...AUDIO_LEVELS};this.gains=new Set();this.sources=new Set();this.background=typeof document!=='undefined'&&document.hidden;try{const saved=JSON.parse(localStorage.getItem('briscola-audio-levels'));for(const key of Object.keys(this.levels))if(typeof saved?.[key]==='number'&&Number.isFinite(saved[key]))this.levels[key]=Math.max(0,Math.min(1,saved[key]))}catch{}}
 start(){
  if(this.started||typeof Audio==='undefined')return;this.started=true;
  this.music=new Audio(new URL(AUDIO_FILES.music,base).href);this.music.loop=true;this.music.volume=this.levels.music;this.music.preload='auto';
  try{this.muted=localStorage.getItem('briscola-audio-muted')==='true'}catch{}
  void this.unlock();
  window.addEventListener('pointerdown',()=>void this.unlock(),{capture:true});
  window.addEventListener('keydown',()=>void this.unlock(),{capture:true});
  document.addEventListener('visibilitychange',()=>this.setBackground(document.hidden));this.setBackground(document.hidden);
 }
 async unlock(){
  if(this.muted||this.background)return;
  // Call both resume and play within the user gesture, before any fetch/await.
  try{const Context=globalThis.AudioContext||globalThis.webkitAudioContext;if(!this.context&&Context)this.context=new Context();if(this.context&&this.music&&!this.musicSource){this.musicSource=this.context.createMediaElementSource(this.music);this.musicFilter=this.context.createBiquadFilter();this.musicFilter.type='lowpass';this.musicFilter.frequency.value=3500;this.musicFilter.Q.value=.7;this.musicSource.connect(this.musicFilter);this.musicFilter.connect(this.context.destination)}if(this.context?.state==='suspended')void this.context.resume().catch(()=>{});if(this.music?.paused)void this.music.play().catch(()=>{});
   if(this.context&&!this.preloaded){this.preloaded=true;for(const key of Object.keys(AUDIO_FILES).filter(key=>key!=='music'))void this.load(key).catch(()=>{})}
  }catch{/* Audio must never interrupt gameplay. */}
 }
 async load(key,reverse=false){
  const cacheKey=key+(reverse?'-reverse':'');
  if(!this.buffers.has(cacheKey))this.buffers.set(cacheKey,(async()=>{
   if(reverse)return reverseBuffer(this.context,await this.load(key));
   const response=await fetch(new URL(AUDIO_FILES[key],base),{signal:AbortSignal.timeout(8000)});if(!response.ok)throw Error('Audio unavailable');
   return this.context.decodeAudioData(await response.arrayBuffer());
  })().catch(error=>{this.buffers.delete(cacheKey);throw error}));
  return this.buffers.get(cacheKey);
 }
 async play(key,{reverse=false,wait=false}={}){
  if(!key||!AUDIO_FILES[key]||this.muted||this.background)return;
  await this.unlock();if(!this.context||this.context.state!=='running')return;
  try{const buffer=await this.load(key,reverse);if(this.muted||this.background)return;const source=this.context.createBufferSource(),gain=this.context.createGain();source.buffer=buffer;gain.normalization=effectGain(buffer);gain.gain.value=this.levels.effects*gain.normalization;this.gains.add(gain);source.connect(gain);gain.connect(this.context.destination);let finish,timer;const done=new Promise(resolve=>finish=resolve);this.sources.add(source);source.onended=()=>{source.disconnect();gain.disconnect();this.gains.delete(gain);this.sources.delete(source);clearTimeout(timer);finish()};source.start();if(wait){try{await Promise.race([done,new Promise(resolve=>{timer=setTimeout(resolve,Math.ceil(buffer.duration*1000)+500)})])}finally{clearTimeout(timer)}}}catch{/* Missing/unsupported audio is nonfatal. */}
 }
 setBackground(hidden){this.background=hidden;if(hidden){this.music?.pause();for(const source of this.sources)try{source.stop()}catch{};void this.context?.suspend().catch(()=>{})}else void this.unlock()}
 setLevel(key,value){if(!(key in this.levels)||!Number.isFinite(value))return;this.levels[key]=Math.max(0,Math.min(1,value));if(key==='music'&&this.music)this.music.volume=this.levels.music;if(key==='effects')for(const gain of this.gains)gain.gain.value=this.levels.effects*(gain.normalization||1);try{localStorage.setItem('briscola-audio-levels',JSON.stringify(this.levels))}catch{}}
 toggle(){this.muted=!this.muted;try{localStorage.setItem('briscola-audio-muted',String(this.muted))}catch{};if(this.muted)this.music?.pause();else void this.unlock();return this.muted}
 observe(state,localPlayer){
  if(this.gameId!==state.gameId){this.gameId=state.gameId;this.seen=state.nextPresentationId||0;return}
  for(const event of state.presentationEvents||[]){if(event.id<=this.seen)continue;this.seen=event.id;
   // Opponent battle sounds are scheduled by its card animation, not polling.
   if(event.player===localPlayer||state.phase==='preparation')void this.play(actionSound(event));
  }
 }
}
export const gameAudio=new GameAudio();
export function installAudioControls(){
 gameAudio.start();
 // Window capture runs before the controller's document handlers can replace a popup.
 window.addEventListener('click',event=>{
  const button=event.target.closest?.('button');if(!button||button.disabled)return;
  const modal=document.querySelector('#modalRoot .modal'),kind=modal?.dataset.kind;
  if(button.matches('[data-card],[data-unit],[data-deck-info]')){void gameAudio.play('card');return}
  if(button.matches('[data-play-card],[data-unit-use]'))return;
  if(button.id==='closeModal'&&['unit','card-preview','preparation-card','deck-card'].includes(kind))return; // closeAction plays reversed card audio, also for outside taps.
  const closing=button.matches('#closeModal,#closePlayerPanel,#backLobby,#cancelRoom,#resetBtn,#closeNotice');
  const confirming=button.matches('#confirmOnlineDeck,#confirmDeckBuild,#readyPreparation,#startOnlineMatch,#endTurn,#singleChoice,#multiChoice,#createOnline,#joinOnline');
  void gameAudio.play(closing?'close':confirming?'confirm':'touch');
 },true);
}
