import * as THREE from '../../vendor/three.module.min.js';

export function configureArenaModel(root,family){
  const accents={shield:0x0fa7ef,virus:0xbf1014,drone:0x66501a,radiation:0x329b42,magicata:0xe870e9};
  root.traverse(mesh=>{
    if(!mesh.isMesh)return;
    mesh.castShadow=true;mesh.receiveShadow=true;
    for(const material of Array.isArray(mesh.material)?mesh.material:[mesh.material]){
      if(!accents[family]||!material.color)continue;
      const hsl={};material.color.getHSL(hsl);
      // These accents were yellow on drones; neutral metal keeps its original color.
      if(hsl.s>.3){
        material.color.setHex(accents[family]);
        if(material.emissive?.getHex())material.emissive.setHex(family==='drone'?0x080600:family==='radiation'?0x0b3011:accents[family]);
      }
    }
  });
}
export function createArenaSun(){
  const light=new THREE.DirectionalLight(0xfff4df,2.4);
  light.position.set(2,14,2);light.target.position.set(0,-1,0);
  light.castShadow=true;
  light.shadow.mapSize.set(2048,2048);
  Object.assign(light.shadow.camera,{left:-10,right:10,top:8,bottom:-8,near:.1,far:35});
  light.shadow.camera.updateProjectionMatrix();
  light.shadow.bias=-.00015;light.shadow.normalBias=.015;
  return light;
}
