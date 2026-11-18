import sys,json,shlex,re,tarfile
from pathlib import Path
import paramiko

sys.stdout.reconfigure(encoding='utf-8')
base=Path(__file__).parent
remote='/opt/vsb-site/source-youtube-20260915'
image='vsb-site:youtube-20260915'
backup='/root/vsb-backup-youtube-20260915'
conf='/etc/nginx/sites-available/vsbseguranca.com.br'
runtime='/root/vsb-youtube-runtime.env'
cache='/opt/vsb-site/youtube-cache'
c=paramiko.SSHClient();c.load_host_keys(str(Path.home()/'.ssh/known_hosts'))
c.connect('203.0.113.10',username='root',key_filename=str(Path.home()/'.ssh/id_ed25519_vps'),timeout=20)
sftp=c.open_sftp()
def run(command):
    _,out,err=c.exec_command(command)
    data,errors=out.read().decode(),err.read().decode()
    if out.channel.recv_exit_status():raise RuntimeError(data+'\n'+errors)
    return data
def write(path,data,mode=0o644):
    with sftp.open(path,'w') as f:f.write(data)
    sftp.chmod(path,mode)
def nginx(old):
    for directive,host in [('frame-src','https://www.youtube-nocookie.com'),('img-src','https://i.ytimg.com')]:
        old=re.sub(r'(?<![-\w])'+directive+r' ([^;]+);',lambda m:directive+' '+m.group(1).rstrip()+(' '+host if host not in m.group(1).split() else '')+';',old)
    return old.replace('proxy_pass http://127.0.0.1:3006;','proxy_pass http://127.0.0.1:3007;').replace('container Node na 3006','container Node na 3007')

mode=sys.argv[1]
if mode=='upload':
    def clean(info):
        parts=Path(info.name).parts
        return None if any(p in {'node_modules','.output','.git','.cache','.env'} or (p.startswith('.env.') and p!='.env.example') for p in parts) else info
    with tarfile.open(base/'youtube-source.tar.gz','w:gz') as tar:tar.add(base/'site-youtube',arcname='.',filter=clean)
    sftp.put(str(base/'youtube-source.tar.gz'),'/tmp/vsb-youtube-source.tar.gz')
    run(f'mkdir -p {remote} && tar -xzf /tmp/vsb-youtube-source.tar.gz -C {remote}')
    config=nginx(sftp.open(conf).read().decode())
    for name in ['nginx-vsb-live.conf','nginx-vsbseguranca.conf']:
        (base/'site-youtube/deploy'/name).write_text(config,encoding='utf-8')
        write(remote+'/deploy/'+name,config)
    print('YouTube source uploaded; no runtime secrets included.')
elif mode=='build':
    args={'VITE_SITE_URL':'https://vsbseguranca.com.br','VITE_PHONE_DISPLAY':'(85) 98629-3430','VITE_PHONE_NUMBER':'+5585986293430','VITE_WHATSAPP_NUMBER':'5585986293430','VITE_CONTACT_EMAIL':'contato@vsbseguranca.com.br','VITE_CMS_URL':'https://cms.vsbseguranca.com.br','VITE_GTM_ID':'GTM-5WZFCV6P','VITE_GA_MEASUREMENT_ID':'G-BP931PJG0R'}
    flags=' '.join('--build-arg '+shlex.quote(k+'='+v) for k,v in args.items())
    run('rm -f /tmp/vsb-youtube.status')
    command=f'docker build {flags} -t {image} {remote} >/tmp/vsb-youtube.log 2>&1; echo $? >/tmp/vsb-youtube.status'
    print(run('nohup sh -c '+shlex.quote(command)+' >/dev/null 2>&1 </dev/null & echo $!'))
elif mode=='status':
    print(run('tail -35 /tmp/vsb-youtube.log; if test -f /tmp/vsb-youtube.status; then cat /tmp/vsb-youtube.status; else echo RUNNING; fi'))
elif mode=='preview':
    run(f'test -s {runtime} && chmod 600 {runtime} && mkdir -p {cache} && chown 1000:1000 {cache} && chmod 700 {cache}')
    print(run(f'docker run -d --name vsb-youtube-preview --restart unless-stopped --log-driver json-file --log-opt max-size=10m --log-opt max-file=3 --env-file {runtime} -v {cache}:/app/data/youtube -p 127.0.0.1:3007:3000 {image}'))
    feed=json.loads(run('curl -fsS http://127.0.0.1:3007/api/youtube/videos'))
    assert feed['channel']['id']=='UCu99Ykzuw_EWYXdX68K1ong' and feed['videos']
    print(json.dumps({'channel':feed['channel'],'videos':len(feed['videos']),'updatedAt':feed['updatedAt']},ensure_ascii=False))
elif mode=='refresh-preview':
    run('docker rm -f vsb-youtube-preview')
    print(run(f'docker run -d --name vsb-youtube-preview --restart unless-stopped --log-driver json-file --log-opt max-size=10m --log-opt max-file=3 --env-file {runtime} -v {cache}:/app/data/youtube -p 127.0.0.1:3007:3000 {image}'))
elif mode=='publish':
    html=run('curl -fsS http://127.0.0.1:3007/')
    assert html.index('Técnica na prática')<html.index('id="youtube"')<html.index('Vamos conversar')
    feed=json.loads(run('curl -fsS http://127.0.0.1:3007/api/youtube/videos'))
    assert feed['channel']['id']=='UCu99Ykzuw_EWYXdX68K1ong' and feed['videos']
    old=sftp.open(conf).read().decode()
    assert old.count('proxy_pass http://127.0.0.1:3006;')==4
    run(f'mkdir -p {backup} && chmod 700 {backup} && cp -p {conf} {backup}/nginx-before.conf && docker inspect vsb-site > {backup}/container-before.json && chmod 600 {backup}/container-before.json')
    new=nginx(old)
    write(conf+'.youtube-new',new)
    run(f'mv {conf}.youtube-new {conf}')
    try:
        run('nginx -t && systemctl reload nginx')
        assert 'id="youtube"' in run('curl -fsS https://vsbseguranca.com.br/')
        assert json.loads(run('curl -fsS https://vsbseguranca.com.br/api/youtube/videos'))['videos']
    except Exception:
        run(f'cp -p {backup}/nginx-before.conf {conf} && nginx -t && systemctl reload nginx')
        raise
    run('docker rename vsb-site vsb-site-before-youtube-20260915 && docker rename vsb-youtube-preview vsb-site')
    run(f'ln -sfn {remote} /opt/vsb-site/current')
    for name in ['nginx-vsb-live.conf','nginx-vsbseguranca.conf']:
        write(remote+'/deploy/'+name,new)
        (base/'site-youtube/deploy'/name).write_text(new,encoding='utf-8')
    write(backup+'/rollback-site.sh',f'''#!/bin/sh
set -eu
cp -p {backup}/nginx-before.conf {conf}
nginx -t
systemctl reload nginx
docker rename vsb-site vsb-site-youtube-20260915
docker rename vsb-site-before-youtube-20260915 vsb-site
ln -sfn /opt/vsb-site/source-improvements-20260914-final /opt/vsb-site/current
''',0o700)
    print('YouTube published; previous site preserved; backup '+backup)
elif mode=='document':
    sftp.put(str(base/'site-youtube/YOUTUBE.md'),remote+'/YOUTUBE.md')
    print('Production documentation synchronized.')
c.close()
