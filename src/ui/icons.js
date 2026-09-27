const bounds=[0,214,422,630,831,1037,1235,1433,1636];
const names=['SCUDO','VIRUS','DRONE','RADIAZIONE','LASER','MAGICATA','ENERGIA','INTEGRITA'];
const aliases={shield:'SCUDO',virus:'VIRUS',drone:'DRONE',radiation:'RADIAZIONE',energy:'ENERGIA',integrity:'INTEGRITA'};
export function gameIcon(name){
  const key=aliases[name]||name,index=names.indexOf(key);
  if(index<0)return '';
  return `<svg class="game-icon icon-${key.toLowerCase()}" viewBox="${bounds[index]} 0 ${bounds[index+1]-bounds[index]} 246" aria-hidden="true" focusable="false"><image href="assets/icons/icone.png" width="1636" height="246"/></svg>`;
}
