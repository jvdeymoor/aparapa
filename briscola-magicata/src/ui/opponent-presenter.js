import {byId} from '../data/cards.js';
import {spriteStyle} from '../data/art.js';
import {cardName} from './card-details.js';
// IDs are authoritative; repeated polls and unrelated redraws cannot replay cards.
export class OpponentPresenter {
 constructor(onIdle,animate=animateCard){this.onIdle=onIdle;this.animate=animate;this.queue=[];this.busy=false;this.generation=0;this.controller=null}
 observe(state,localPlayer){
  if(this.gameId!==state.gameId){this.reset();this.gameId=state.gameId;this.seen=state.nextPresentationId||0;return}
  for(const event of state.presentationEvents||[]){if(event.id<=this.seen)continue;this.seen=event.id;if(event.player!==localPlayer&&byId(event.cardId)&&state.phase!=='preparation')this.queue.push(event)}
  if(!this.busy&&this.queue.length){this.busy=true;void this.drain(this.generation)}
 }
 reset(){this.generation++;this.controller?.abort();this.queue=[];this.busy=false}
 async drain(generation){
  while(this.queue.length&&generation===this.generation){const event=this.queue.shift();this.controller=new AbortController();try{await this.animate(event,this.controller.signal)}catch(error){if(error.name!=='AbortError')console.warn('Animazione carta:',error)}}
  if(generation===this.generation){this.busy=false;this.controller=null;this.onIdle()}
 }
}
async function animateCard(event,signal){
 const card=byId(event.cardId);if(!card||signal.aborted)return;
 const player=document.querySelectorAll('#mobileStatus .mobile-player')[event.player];
 const box=player?.getBoundingClientRect();
 const hand=document.querySelector('#hand .card-back')?.getBoundingClientRect()||document.querySelector('#hand')?.getBoundingClientRect();
 const width=Math.min(240,innerWidth*.35,innerHeight*.32),height=width*187/120;
 const center={x:(innerWidth-width)/2,y:(innerHeight-height)/2};
 const point=rect=>rect&&rect.bottom>0&&rect.top<innerHeight?{x:rect.left+rect.width/2-width/2,y:rect.top+rect.height/2-height/2}:{x:center.x,y:innerHeight-height*.35};
 const from=point(event.kind==='attack'?box:hand),to=point(box);
 const layer=document.createElement('div');layer.className='opponent-reveal';layer.setAttribute('role','status');layer.setAttribute('aria-label',`${event.kind==='attack'?'Attacco':'Carta giocata'}: ${card.name}`);
 layer.innerHTML=`<div class="reveal-card"><div class="reveal-face reveal-back card-art" style="${spriteStyle('hidden')}"></div><div class="reveal-face reveal-front card-art" style="${spriteStyle(card.name)}">${cardName(card.name)}</div></div>`;
 Object.assign(layer.style,{left:`${center.x}px`,top:`${center.y}px`,width:`${width}px`,height:`${height}px`});document.body.append(layer);
 const inner=layer.firstElementChild;const active=new Set();
 const abort=()=>{for(const animation of active)animation.cancel();layer.remove()};signal.addEventListener('abort',abort,{once:true});
 const run=async(el,frames,options)=>{if(signal.aborted)throw new DOMException('Aborted','AbortError');const animation=el.animate(frames,{fill:'forwards',...options});active.add(animation);try{await animation.finished}finally{active.delete(animation)}};
 const offset=p=>`translate(${p.x-center.x}px,${p.y-center.y}px)`;
 try{
  inner.style.transform=event.kind==='attack'?'rotateY(180deg)':'rotateY(0deg)';
  await run(layer,[{transform:`${offset(from)} scale(.55)`,opacity:1},{transform:'translate(0,0) scale(1)',opacity:1}],{duration:800,easing:'ease-out'});
  if(event.kind!=='attack')await run(inner,[{transform:'rotateY(0deg)'},{transform:'rotateY(180deg)'}],{duration:500,easing:'ease-in-out'});
  await run(layer,[{opacity:1},{opacity:1}],{duration:event.kind==='attack'?1200:1800});
  await run(layer,event.kind==='attack'?[{opacity:1},{opacity:0}]:[{transform:'translate(0,0) scale(1)',opacity:1},{transform:`${offset(to)} scale(.05)`,opacity:0}],{duration:event.kind==='attack'?600:800,easing:'ease-in'});
 }finally{signal.removeEventListener('abort',abort);layer.remove()}
}
