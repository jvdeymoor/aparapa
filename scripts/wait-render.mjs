export async function waitForRender({commit,url='https://aparapa.onrender.com/api/health',attempts=60,fetchImpl=fetch,pause=ms=>new Promise(resolve=>setTimeout(resolve,ms))}) {
  if(!/^[a-f0-9]{40}$/.test(commit||''))throw Error('A full source commit SHA is required');
  for(let attempt=0;attempt<attempts;attempt++){
    try{const response=await fetchImpl(url,{signal:AbortSignal.timeout(15000),cache:'no-store'});if(response.ok){const health=await response.json();if(health.ok&&health.commit===commit){console.log('Render is serving the source commit.');return}}}catch{/* Deployment or cold start: retry without exposing response bodies. */}
    if(attempt+1<attempts)await pause(15000);
  }
  throw Error('Render has not deployed the expected commit. Check its release-multiplayer branch and automatic deploys, then re-run this workflow. Pages was not modified.');
}
if(process.env.BRISCOLA_WAIT_RENDER==='1')await waitForRender({commit:process.env.SOURCE_SHA});
