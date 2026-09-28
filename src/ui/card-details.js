import {gameIcon} from './icons.js';
export const escapeText=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function cardValues(card,state){
 const bonus=state?.briscola?.name;
 return {damage:card.effect==='radiation'?1:card.effect==='drone'?card.attack+(bonus==='GUERRA DEI DRONI'?1:0):card.amount+(card.effect==='laser'&&bonus==='TURBOLENZA'?1:0),protection:card.amount+(card.effect==='shield'&&bonus==='FENDITURA'?1:0),life:card.effect==='drone'?card.hp:card.amount+(bonus==='TEMPESTA SOLARE'?1:0)};
}
export function cardBadges(card,state){
 const v=cardValues(card,state),primary=card.effect==='shield'?v.protection:card.effect==='magic'?'':v.damage;
 return `<span class="card-stats"><span>${gameIcon(card.category)}${primary}</span>${['drone','radiation'].includes(card.effect)?`<span>${gameIcon('INTEGRITA')}${v.life}</span>`:''}</span>`;
}
export function cardName(name){
 const width=Math.max(40,[...name].length*14.4);
 return `<b class="card-name"><svg viewBox="0 0 ${width} 28" preserveAspectRatio="xMinYMid meet" role="img" aria-label="${escapeText(name)}"><text x="0" y="23" font-family="monospace" font-size="24" textLength="${width}" lengthAdjust="spacingAndGlyphs">${escapeText(name)}</text></svg></b>`;
}
export function cardDetails(card,state){
 const v=cardValues(card,state),row=(icon,value,label)=>`<li>${gameIcon(icon)}<strong>${value}</strong><span>${label}</span></li>`;
 let rows='',explanation='';
 if(card.effect==='shield'){rows=row('SCUDO',v.protection,'Protezione');explanation='Assorbe i danni prima dei droni e del nucleo.'}
 if(card.effect==='drone'){rows=row('DRONE',v.damage,'Danni per attacco')+row('INTEGRITA',v.life,'Integrità')+(card.dominance?row('DRONE',card.dominance,'Dominio'): '');explanation='Rimane in campo. Può attaccare una volta per turno, spendendo una mossa; l’attacco non costa altra energia.'}
 if(card.effect==='radiation'){rows=row('RADIAZIONE',1,'Danno a inizio turno')+row('INTEGRITA',v.life,'Cariche radioattive');explanation='Installa queste cariche sull’avversario. A ogni inizio del suo turno si risolve una carica, poi viene rimossa. Il cuore indica il numero di cariche, non punti vita.'}
 if(card.effect==='virus'){rows=row('VIRUS',v.damage,'Danni alla prossima attivazione');explanation='Si installa sull’avversario e si risolve all’inizio del suo prossimo turno, poi scompare.'}
 if(card.effect==='laser'){rows=row('LASER',v.damage,'Danni immediati');explanation='Colpisce subito: prima gli scudi, poi i droni, infine il nucleo. Intercettazione può ridurre di 2 il primo laser da almeno 4 danni.'}
 if(card.effect==='magic'){rows=row('MAGICATA','', 'Effetto speciale');explanation=card.description}
 return `<ul class="card-facts">${rows}</ul><p>${escapeText(explanation)}</p>`;
}
export function controlIcon(kind){
 const path=kind==='book'?'<path d="M12 5C8 2 4 3 2 4v15c3-1 6-1 10 2 4-3 7-3 10-2V4c-2-1-6-2-10 1Zm0 0v16"/>':'<path d="m12 2 2 6 6-4-2 7 5 2-6 3 2 6-7-4-6 4 1-7-6-3 7-2-2-6 6 3Z"/>';
 return `<svg class="control-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round">${path}</svg>`;
}
