import sys,shlex,json,tarfile
from pathlib import Path
import paramiko
sys.stdout.reconfigure(encoding='utf-8')
base=Path(__file__).parent
remote='/opt/vsb-site/source-ga4-20260911'
image='vsb-site:ga4-20260911'
backup='/root/vsb-backup-ga4-20260911'
conf='/etc/nginx/sites-available/vsbseguranca.com.br'
c=paramiko.SSHClient()
c.load_host_keys(str(Path.home()/'.ssh/known_hosts'))
c.connect('203.0.113.10',username='root',key_filename=str(Path.home()/'.ssh/id_ed25519_vps'),timeout=20)
sftp=c.open_sftp()
def run(cmd):
    _,out,err=c.exec_command(cmd)
    data,errors=out.read().decode(),err.read().decode()
    if out.channel.recv_exit_status(): raise RuntimeError(data+'\n'+errors)
    return data
def write(path,data,mode=0o644):
    with sftp.open(path,'w') as f:f.write(data)
    sftp.chmod(path,mode)
mode=sys.argv[1]
if mode=='upload':
    with tarfile.open(base/'ga4-source.tar.gz','w:gz') as tar:tar.add(base/'site-ga4',arcname='.')
    sftp.put(str(base/'ga4-source.tar.gz'),'/tmp/vsb-ga4-source.tar.gz')
    run(f'mkdir -p {remote} && tar -xzf /tmp/vsb-ga4-source.tar.gz -C {remote}')
    print(run(f'docker run --rm -v {remote}/src:/app/src vsb-site:identity-validation bunx prettier --write src/lib/google-integrations.ts src/routes/__root.tsx'))
elif mode=='build':
    args={'VITE_SITE_URL':'https://vsbseguranca.com.br','VITE_PHONE_DISPLAY':'(85) 98629-3430','VITE_PHONE_NUMBER':'+5585986293430','VITE_WHATSAPP_NUMBER':'5585986293430','VITE_CONTACT_EMAIL':'contato@vsbseguranca.com.br','VITE_CMS_URL':'https://cms.vsbseguranca.com.br','VITE_GTM_ID':'GTM-5WZFCV6P','VITE_GA_MEASUREMENT_ID':'G-BP931PJG0R'}
    arg=' '.join('--build-arg '+shlex.quote(k+'='+v) for k,v in args.items())
    run('rm -f /tmp/vsb-ga4.status')
    command=f'docker build {arg} -t {image} {remote} >/tmp/vsb-ga4.log 2>&1; echo $? >/tmp/vsb-ga4.status'
    print(run('nohup sh -c '+shlex.quote(command)+' >/dev/null 2>&1 </dev/null & echo $!'))
elif mode=='status':
    print(run('tail -18 /tmp/vsb-ga4.log; if test -f /tmp/vsb-ga4.status; then cat /tmp/vsb-ga4.status; else echo RUNNING; fi'))
elif mode=='preview':
    env=json.loads(run('docker inspect vsb-site'))[0]['Config']['Env']
    envfile='/root/vsb-ga4-runtime.env'
    write(envfile,'\n'.join(env)+'\n',0o600)
    print(run(f'docker run -d --name vsb-ga4-preview --restart unless-stopped --log-driver json-file --log-opt max-size=10m --log-opt max-file=3 --env-file {envfile} -p 127.0.0.1:3004:3000 {image}'))
elif mode=='publish':
    html=run('curl -fsS http://127.0.0.1:3004/')
    assert 'G-BP931PJG0R' in html and 'GTM-5WZFCV6P' in html and 'CAow2uPHDA:openaccess' in html
    old=sftp.open(conf).read().decode()
    assert old.count('proxy_pass http://127.0.0.1:3003;')==4
    run(f'mkdir -p {backup} && chmod 700 {backup} && cp -p {conf} {backup}/nginx-before.conf && docker inspect vsb-site > {backup}/container-before.json && chmod 600 {backup}/container-before.json')
    new=old.replace('proxy_pass http://127.0.0.1:3003;','proxy_pass http://127.0.0.1:3004;').replace('container Node na 3003','container Node na 3004')
    write(conf+'.ga4-new',new)
    run(f'mv {conf}.ga4-new {conf}')
    try:
        run('nginx -t && systemctl reload nginx')
        assert 'G-BP931PJG0R' in run('curl -fsS https://vsbseguranca.com.br/')
    except Exception:
        run(f'cp -p {backup}/nginx-before.conf {conf} && nginx -t && systemctl reload nginx')
        raise
    run('docker rename vsb-site vsb-site-before-ga4-20260911 && docker rename vsb-ga4-preview vsb-site')
    run(f'ln -sfn {remote} /opt/vsb-site/current')
    for filename in ['nginx-vsbseguranca.conf','nginx-vsb-live.conf']:
        write(remote+'/deploy/'+filename,new)
    write(backup+'/rollback-site.sh',f'''#!/bin/sh
set -eu
cp -p {backup}/nginx-before.conf {conf}
nginx -t
systemctl reload nginx
docker rename vsb-site vsb-site-ga4-20260911
docker rename vsb-site-before-ga4-20260911 vsb-site
ln -sfn /opt/vsb-site/source-google-legal-20260911 /opt/vsb-site/current
''',0o700)
    print('Published direct GA4 tag; backup: '+backup)
elif mode=='download':
    run(f'tar -czf /tmp/vsb-ga4-validated.tar.gz -C {remote} .')
    sftp.get('/tmp/vsb-ga4-validated.tar.gz',str(base/'ga4-validated.tar.gz'))
    with tarfile.open(base/'ga4-validated.tar.gz') as tar:tar.extractall(base/'site-ga4',filter='data')
    print('Validated source synchronized.')
elif mode=='document':
    sftp.put(str(base/'GOOGLE_ANALYTICS_4.md'),remote+'/GOOGLE_ANALYTICS_4.md')
    print('Deployment documentation saved.')
c.close()
