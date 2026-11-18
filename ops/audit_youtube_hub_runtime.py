import json,sys,shlex
from pathlib import Path
import paramiko
sys.stdout.reconfigure(encoding='utf-8')
base=Path(__file__).parent
c=paramiko.SSHClient();c.load_host_keys(str(Path.home()/'.ssh/known_hosts'))
c.connect('203.0.113.10',username='root',key_filename=str(Path.home()/'.ssh/id_ed25519_vps'),timeout=20)
def run(command):
    _,out,err=c.exec_command(command)
    data,errors=out.read().decode(),err.read().decode()
    if out.channel.recv_exit_status():raise RuntimeError(data+'\n'+errors)
    return data
name='vsb-site' if 'public' in sys.argv else 'vsb-youtube-hub-preview'
script=r'''
import {readdir,readFile} from 'node:fs/promises';
import {join} from 'node:path';
const key=process.env.YOUTUBE_API_KEY;
if(!key)throw new Error('Key absent from private runtime');
let files=0;const exposed=[];
async function scan(path){for(const f of await readdir(path,{withFileTypes:true})){const name=join(path,f.name);if(f.isDirectory())await scan(name);else{files++;if((await readFile(name)).includes(Buffer.from(key)))exposed.push(name);}}}
await scan('/app/.output/public');
const a=await (await fetch('http://127.0.0.1:3000/api/youtube/videos')).json();
const b=await (await fetch('http://127.0.0.1:3000/api/youtube/videos')).json();
const html=await(await fetch('http://127.0.0.1:3000/')).text();
if(JSON.stringify(a).includes(key)||html.includes(key))exposed.push('Public response');
if(exposed.length)throw new Error('Private credential found in public output');
if(a.updatedAt!==b.updatedAt||!a.videos.length)throw new Error('Cache or feed check failed');
if(!['shorts','fullVideos','recentVideos'].every(k=>Array.isArray(a[k])))throw new Error('New classified feed schema absent');
const grouped=['shorts','fullVideos','recentVideos'].flatMap(k=>a[k].map(v=>v.id));
if(new Set(grouped).size!==grouped.length)throw new Error('Duplicate videos across sections');
console.log(JSON.stringify({publicFilesScanned:files,credentialExposure:false,channel:a.channel.id,videos:a.videos.length,shorts:a.shorts.length,fullVideos:a.fullVideos.length,recentVideos:a.recentVideos.length,disjointCategories:true,cacheUpdatedAt:a.updatedAt,repeatedReadReusesCache:true}));
'''
report=json.loads(run('docker exec '+name+' bun -e '+shlex.quote(script)))
source_script=r'''
import pathlib,json
env=dict(line.split('=',1) for line in pathlib.Path('/root/vsb-youtube-runtime.env').read_text().splitlines() if '=' in line)
key=env['YOUTUBE_API_KEY'].encode();hits=[];count=0
for p in pathlib.Path('/opt/vsb-site/source-youtube-hub-20260916').rglob('*'):
    if p.is_file():
        count+=1
        if key in p.read_bytes():hits.append(str(p))
if hits:raise SystemExit('Credential found in source')
print(json.dumps({'sourceFilesScanned':count,'sourceCredentialExposure':False}))
'''
report.update(json.loads(run('python3 -c '+shlex.quote(source_script))))
report['container']=name
(base/'checks-youtube-hub'/('runtime-public.json' if name=='vsb-site' else 'runtime-preview.json')).write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(report,ensure_ascii=False,indent=2))
c.close()
