import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdtemp,mkdir,readFile,writeFile,rm,symlink,access} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {publishSite} from '../scripts/publish-site.mjs';
import {pagesBuild} from '../scripts/pages-build.mjs';
import {waitForRender} from '../scripts/wait-render.mjs';
const temp=await mkdtemp(join(tmpdir(),'briscola-publishing-test-'));
const source=join(temp,'source'),site=join(temp,'site');
async function put(root,path,data){await mkdir(join(root,path,'..'),{recursive:true});await writeFile(join(root,path),data)}
try{
 await mkdir(source);await mkdir(site);
 execFileSync('git',['init','--quiet',source]);
 const runtime={'index.html':'<script src="src/main.js?v=1.5.1"></script>','src/main.js':"const APP_VERSION='v1.5.1';",'src/game/engine.js':'export const rule=1;','assets/images/cards/sprite-sheet.png':'image-data','vendor/three.module.min.js':'library'};
 for(const [file,data] of Object.entries(runtime))await put(source,file,data);
 for(const file of ['server.js','tests/private-test.js','.env','node_modules/no.js'])await put(source,file,'not for browser');
 execFileSync('git',['-C',source,'add','index.html','src','assets','vendor','server.js','tests']);
 await put(source,'src/untracked.js','must not publish untracked files');
 await put(site,'index.html','home unchanged');await put(site,'CNAME','aparapa.com');await put(site,'another-game/index.html','another game');
 await put(site,'briscola-magicata/server.js','old redundant server');await put(site,'briscola-magicata/old.js','obsolete');
 assert.deepEqual(await publishSite(source,site),{files:5,version:'v1.5.1'});
 for(const [file,data] of Object.entries(runtime))assert.equal(await readFile(join(site,'briscola-magicata',file),'utf8'),data);
 for(const file of ['server.js','old.js','.env','tests/private-test.js','node_modules/no.js','src/untracked.js'])await assert.rejects(access(join(site,'briscola-magicata',file)));
 assert.equal(await readFile(join(site,'index.html'),'utf8'),'home unchanged');assert.equal(await readFile(join(site,'another-game/index.html'),'utf8'),'another game');assert.equal(await readFile(join(site,'CNAME'),'utf8'),'aparapa.com');
 await publishSite(source,site); // Idempotent repeated publication.
 await put(source,'index.html','<script src="src/main.js?v=1.5.10"></script>');
 await assert.rejects(publishSite(source,site),/version/);assert.equal(await readFile(join(site,'briscola-magicata/index.html'),'utf8'),runtime['index.html']);
 await put(source,'index.html',runtime['index.html']);
 await symlink(join(source,'.env'),join(source,'assets/leak'));execFileSync('git',['-C',source,'add','assets/leak']);
 await assert.rejects(publishSite(source,site),/Symlinks/);assert.equal(await readFile(join(site,'index.html'),'utf8'),'home unchanged');
 await assert.rejects(publishSite(source,source),/separate/);
 await put(site,'CNAME','another.example');await assert.rejects(publishSite(source,site),/aparapa.com/);
}finally{await rm(temp,{recursive:true,force:true})}
const calls=[];
const configuration={build_type:'legacy',source:{branch:'main',path:'/'},cname:'aparapa.com'};
const mock=async(url,options)=>{calls.push([url,options.method||'GET']);return {ok:true,json:async()=>configuration}};
await pagesBuild({repository:'jvdeymoor/aparapa',token:'test-only',fetchImpl:mock,mode:'check'});assert.equal(calls.length,1);
await pagesBuild({repository:'jvdeymoor/aparapa',token:'test-only',fetchImpl:mock,mode:'build'});assert.deepEqual(calls.at(-1),['https://api.github.com/repos/jvdeymoor/aparapa/pages/builds','POST']);
await assert.rejects(pagesBuild({repository:'jvdeymoor/aparapa',token:'test-only',fetchImpl:async()=>({ok:true,json:async()=>({...configuration,cname:'wrong.example'})}),mode:'build'}),/Expected Pages/);
const sha='a'.repeat(40);let count=0;
await waitForRender({commit:sha,attempts:2,pause:async()=>{},fetchImpl:async()=>({ok:true,json:async()=>({ok:true,commit:++count===2?sha:'old'})})});assert.equal(count,2);
await assert.rejects(waitForRender({commit:sha,attempts:1,fetchImpl:async()=>({ok:false})}),/not deployed/);
console.log('publishing: isolated static export, idempotence, site preservation, failure safety, explicit Pages build and Render ordering: ok');
