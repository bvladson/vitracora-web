import sys,shlex,json,tarfile
from pathlib import Path
import paramiko
sys.stdout.reconfigure(encoding='utf-8')
base=Path(__file__).parent
remote='/opt/vsb-site/source-logo-oficial-20260911'
image='vsb-site:logo-oficial-20260911'
c=paramiko.SSHClient()
c.load_host_keys(str(Path.home()/'.ssh/known_hosts'))
c.connect('203.0.113.10',username='root',key_filename=str(Path.home()/'.ssh/id_ed25519_vps'),timeout=20)
def run(cmd):
    _,out,err=c.exec_command(cmd)
    data=out.read().decode()
    errors=err.read().decode()
    if out.channel.recv_exit_status(): raise RuntimeError(data+'\n'+errors)
    return data
def background(command):
    print(run('nohup sh -c '+shlex.quote(command)+' >/dev/null 2>&1 </dev/null & echo $!'))
mode=sys.argv[1]
if mode=='upload':
    with tarfile.open(base/'logos-source.tar.gz','w:gz') as tar: tar.add(base/'site-logo',arcname='.')
    sftp=c.open_sftp()
    sftp.put(str(base/'logos-source.tar.gz'),'/tmp/vsb-logo-oficial.tar.gz')
    run(f'mkdir -p {remote} && tar -xzf /tmp/vsb-logo-oficial.tar.gz -C {remote}')
    print(run(f'docker run --rm -v {remote}/src:/app/src vsb-site:identity-validation bunx prettier --write src'))
elif mode=='build':
    args={'VITE_SITE_URL':'https://vsbseguranca.com.br','VITE_PHONE_DISPLAY':'(85) 98629-3430','VITE_PHONE_NUMBER':'+5585986293430','VITE_WHATSAPP_NUMBER':'5585986293430','VITE_CONTACT_EMAIL':'contato@vsbseguranca.com.br','VITE_CMS_URL':'https://cms.vsbseguranca.com.br'}
    arg=' '.join('--build-arg '+shlex.quote(k+'='+v) for k,v in args.items())
    run('rm -f /tmp/vsb-logo-oficial.status')
    background(f'docker build {arg} -t {image} {remote} >/tmp/vsb-logo-oficial.log 2>&1; echo $? >/tmp/vsb-logo-oficial.status')
elif mode=='status':
    print(run('tail -15 /tmp/vsb-logo-oficial.log; if test -f /tmp/vsb-logo-oficial.status; then cat /tmp/vsb-logo-oficial.status; else echo RUNNING; fi'))
elif mode=='preview':
    env=json.loads(run('docker inspect vsb-site'))[0]['Config']['Env']
    envfile='/root/vsb-logo-oficial-runtime.env'
    sftp=c.open_sftp()
    with sftp.open(envfile,'w') as f: f.write('\n'.join(env)+'\n')
    sftp.chmod(envfile,0o600)
    print(run(f'docker run -d --name vsb-logo-preview --restart unless-stopped --log-driver json-file --log-opt max-size=10m --log-opt max-file=3 --env-file {envfile} -p 127.0.0.1:3002:3000 {image}'))
elif mode=='publish':
    conf='/etc/nginx/sites-available/vsbseguranca.com.br'
    backup='/root/vsb-backup-logo-oficial-20260911'
    assert 'logo-principal-oficial-20260911.png' in run('curl -fsS http://127.0.0.1:3002/')
    sftp=c.open_sftp()
    old=sftp.open(conf).read().decode()
    assert old.count('proxy_pass http://127.0.0.1:3001;')==4
    run(f'mkdir -p {backup} && chmod 700 {backup} && cp -p {conf} {backup}/nginx-before.conf && docker inspect vsb-site > {backup}/container-before.json && chmod 600 {backup}/container-before.json')
    new=old.replace('proxy_pass http://127.0.0.1:3001;','proxy_pass http://127.0.0.1:3002;').replace('container Node na 3001','container Node na 3002')
    with sftp.open(conf+'.official-new','w') as f:f.write(new)
    sftp.chmod(conf+'.official-new',0o644)
    run(f'mv {conf}.official-new {conf}')
    try:
        run('nginx -t && systemctl reload nginx')
        assert 'logo-principal-oficial-20260911.png' in run('curl -fsS https://vsbseguranca.com.br/')
    except Exception:
        run(f'cp -p {backup}/nginx-before.conf {conf} && nginx -t && systemctl reload nginx')
        raise
    run('docker rename vsb-site vsb-site-before-logo-oficial-20260911 && docker rename vsb-logo-preview vsb-site')
    run(f'ln -sfn {remote} /opt/vsb-site/current')
    rollback=f'''#!/bin/sh
set -eu
cp -p {backup}/nginx-before.conf {conf}
nginx -t
systemctl reload nginx
docker rename vsb-site vsb-site-logo-oficial-20260911
docker rename vsb-site-before-logo-oficial-20260911 vsb-site
ln -sfn /opt/vsb-site/source-identity-20260911 /opt/vsb-site/current
'''
    with sftp.open(backup+'/rollback.sh','w') as f:f.write(rollback)
    sftp.chmod(backup+'/rollback.sh',0o700)
    print('Published: https://vsbseguranca.com.br/; backup: '+backup)
elif mode=='download':
    run(f'tar -czf /tmp/vsb-logo-oficial-validated.tar.gz -C {remote} .')
    c.open_sftp().get('/tmp/vsb-logo-oficial-validated.tar.gz',str(base/'logos-validated.tar.gz'))
    print('Validated source downloaded')
c.close()
