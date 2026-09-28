// Explicit Pages build: commits made with GITHUB_TOKEN do not trigger it automatically.
// https://docs.github.com/en/rest/pages/pages#request-a-github-pages-build
export async function pagesBuild({repository,token,mode='check',fetchImpl=fetch}) {
  if(!/^[\w.-]+\/[\w.-]+$/.test(repository||'')||!token)throw Error('Repository and GitHub token are required');
  if(!['check','build'].includes(mode))throw Error('Expected check or build mode');
  const url=`https://api.github.com/repos/${repository}/pages`;
  const headers={Authorization:`Bearer ${token}`,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'};
  const config=await fetchImpl(url,{headers});
  if(!config.ok)throw Error(`Cannot read Pages settings (HTTP ${config.status}). Check the workflow pages:write permission.`);
  const pages=await config.json();
  if(pages.build_type!=='legacy'||pages.source?.branch!=='main'||pages.source?.path!=='/'||pages.cname!=='aparapa.com')throw Error('Expected Pages from main / with domain aparapa.com. Publication stopped without changing Pages settings.');
  if(mode==='check')return;
  const result=await fetchImpl(`${url}/builds`,{method:'POST',headers});
  if(!result.ok)throw Error(`Pages build not accepted (HTTP ${result.status}). Re-run the workflow after checking Actions/Pages permissions.`);
  console.log('GitHub Pages build requested for aparapa.com.');
}
if(process.env.BRISCOLA_PAGES_MODE)await pagesBuild({repository:process.env.GITHUB_REPOSITORY,token:process.env.GH_TOKEN,mode:process.env.BRISCOLA_PAGES_MODE});
