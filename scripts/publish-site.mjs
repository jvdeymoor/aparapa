import {execFileSync} from 'node:child_process';
import {copyFile, lstat, mkdir, mkdtemp, readFile, rename, rm, writeFile} from 'node:fs/promises';
import {dirname, join, relative, resolve, sep} from 'node:path';
import {fileURLToPath} from 'node:url';

// Pages receives only browser runtime files. Server, tests, credentials and tools
// remain in the sole editable source tree on release-multiplayer.
export async function publishSite(sourceDirectory, siteDirectory) {
  const source=resolve(sourceDirectory),site=resolve(siteDirectory),target=join(site,'briscola-magicata');
  if(source===site||source===target||source.startsWith(target+sep)||site.startsWith(source+sep))throw Error('Source and publication must be separate directories');
  if((await readFile(join(site,'CNAME'),'utf8')).trim()!=='aparapa.com')throw Error('Expected aparapa.com site; refusing to replace an unrelated directory');
  await readFile(join(site,'index.html'));
  const status=await lstat(target).catch(error=>{if(error.code!=='ENOENT')throw error});
  if(status&&!status.isDirectory())throw Error('Publication target must be a real directory');
  const files=execFileSync('git',['-C',source,'ls-files','-z','--','index.html','src','assets','vendor'],{encoding:'utf8'}).split('\0').filter(Boolean);
  for(const required of ['index.html','src/main.js','src/game/engine.js','assets/images/cards/sprite-sheet.png','vendor/three.module.min.js'])if(!files.includes(required))throw Error(`Missing runtime file: ${required}`);
  const stage=await mkdtemp(join(site,'.briscola-publish-'));
  let backup=null;
  try {
    for(const file of files){
      const absolute=resolve(source,file);
      if(relative(source,absolute).startsWith('..'))throw Error('Invalid tracked path');
      // Reject symlinks in the file itself or any parent directory.
      let cursor=absolute;
      while(cursor!==source){if((await lstat(cursor)).isSymbolicLink())throw Error(`Symlinks are not published: ${file}`);cursor=dirname(cursor)}
      if(!(await lstat(absolute)).isFile())throw Error(`Not a regular file: ${file}`);
      await mkdir(dirname(join(stage,file)),{recursive:true});await copyFile(absolute,join(stage,file));
    }
    const html=await readFile(join(stage,'index.html'),'utf8');
    const main=await readFile(join(stage,'src/main.js'),'utf8');
    const version=main.match(/APP_VERSION=['"]([^'"]+)/)?.[1];
    if(!version||html.match(/src=["']src\/main\.js\?v=([^"']+)/)?.[1]!==version.slice(1))throw Error('Visible version and entrypoint cache version must match');
    await writeFile(join(stage,'README.md'),'# Pubblicazione generata automaticamente\n\nNon modificare questi file. La sorgente unica è il ramo `release-multiplayer`\ndel repository `jvdeymoor/aparapa`, cartella locale `/home/f/NEON-WAR`.\nModifica e fai push soltanto lì: il workflow aggiorna questa cartella e GitHub Pages.\n');
    // Finish the complete export before moving the previous generated directory.
    if(status){backup=await mkdtemp(join(site,'.briscola-previous-'));await rename(target,join(backup,'content'))}
    try{await rename(stage,target)}catch(error){if(backup)await rename(join(backup,'content'),target);throw error}
    if(backup)await rm(backup,{recursive:true,force:true});
    return {files:files.length,version};
  }finally{await rm(stage,{recursive:true,force:true})}
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  if(process.argv.length!==4)throw Error('Usage: node scripts/publish-site.mjs SOURCE SITE');
  console.log(await publishSite(process.argv[2],process.argv[3]));
}
