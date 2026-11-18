"""Configure a supplied key only on the VPS. Never print it or write it locally."""
import sys,json,shlex
from pathlib import Path
import paramiko
sys.stdout.reconfigure(encoding='utf-8')
c=paramiko.SSHClient();c.load_host_keys(str(Path.home()/'.ssh/known_hosts'))
c.connect('203.0.113.10',username='root',key_filename=str(Path.home()/'.ssh/id_ed25519_vps'),timeout=20)
def run(command):
    _,out,err=c.exec_command(command)
    data,errors=out.read().decode(),err.read().decode()
    if out.channel.recv_exit_status():raise RuntimeError('Remote operation failed')
    return data
runtime='/root/vsb-youtube-runtime.env'
if sys.argv[1]=='configure':
    key=sys.stdin.read().strip()
    if not key or '\n' in key:raise RuntimeError('A single API key is required via stdin')
    env=json.loads(run('docker inspect vsb-site'))[0]['Config']['Env']
    env=[v for v in env if not v.startswith('YOUTUBE_API_KEY=')]
    env.append('YOUTUBE_API_KEY='+key)
    with c.open_sftp() as s:
        with s.open(runtime,'w') as f:f.write('\n'.join(env)+'\n')
        s.chmod(runtime,0o600)
    print('YouTube key configured in root-only VPS runtime file; existing settings preserved.')
elif sys.argv[1]=='verify':
    code=r'''
import json,urllib.request,urllib.parse,urllib.error,pathlib
env=dict(line.split('=',1) for line in pathlib.Path('/root/vsb-youtube-runtime.env').read_text().splitlines() if '=' in line)
def call(endpoint,**params):
    url='https://www.googleapis.com/youtube/v3/'+endpoint+'?'+urllib.parse.urlencode(params)
    try:
        with urllib.request.urlopen(urllib.request.Request(url,headers={'X-Goog-Api-Key':env['YOUTUBE_API_KEY']}),timeout=15) as response:return json.load(response)
    except urllib.error.HTTPError as error:
        body=json.load(error).get('error',{})
        print(json.dumps({'status':error.code,'reasons':[e.get('reason') for e in body.get('errors',[])],'details':[e.get('reason') for e in body.get('details',[]) if e.get('reason')]}));raise SystemExit(2)
channels=call('channels',part='snippet,contentDetails',forHandle='@vsbseguranca')
items=channels.get('items',[])
if len(items)!=1:print(json.dumps({'error':'Channel not found'}));raise SystemExit(2)
ch=items[0];uploads=ch['contentDetails']['relatedPlaylists']['uploads']
items=call('playlistItems',part='snippet,contentDetails',playlistId=uploads,maxResults=8)['items']
ids=[i['contentDetails']['videoId'] for i in items]
videos=call('videos',part='snippet,status',id=','.join(ids)).get('items',[])
result={'channelId':ch['id'],'handle':ch['snippet'].get('customUrl'),'channelTitle':ch['snippet']['title'],'uploadsPlaylistId':uploads,'videos':[{'id':v['id'],'title':v['snippet']['title'],'channelId':v['snippet']['channelId'],'publishedAt':v['snippet']['publishedAt'],'embeddable':v['status']['embeddable'],'privacyStatus':v['status']['privacyStatus'],'thumbnails':v['snippet']['thumbnails']} for v in videos]}
print(json.dumps(result,ensure_ascii=False))
'''
    _,out,err=c.exec_command('python3 -c '+shlex.quote(code))
    result=out.read().decode();status=out.channel.recv_exit_status()
    if result:
        folder=Path(__file__).parent/'checks-youtube';folder.mkdir(exist_ok=True)
        (folder/'api-verification.json').write_text(result,encoding='utf-8')
        print(result)
    if status:sys.exit(status)
c.close()
