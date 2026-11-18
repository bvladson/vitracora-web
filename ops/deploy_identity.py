import sys, json, tarfile, shlex, time
from pathlib import Path
import paramiko
sys.stdout.reconfigure(encoding='utf-8')

BASE = Path(__file__).parent
REMOTE = '/opt/vsb-site/source-identity-20260911'
IMAGE = 'vsb-site:identity-20260911'
client = paramiko.SSHClient()
client.load_host_keys(str(Path.home()/'.ssh/known_hosts'))
client.connect('203.0.113.10', username='root', key_filename=str(Path.home()/'.ssh/id_ed25519_vps'), timeout=20)

def run(cmd):
    _, stdout, stderr = client.exec_command(cmd)
    result = stdout.read().decode()
    errors = stderr.read().decode()
    status = stdout.channel.recv_exit_status()
    if status:
        raise RuntimeError(f'Command failed ({status}): {cmd}\n{result}\n{errors}')
    return result

mode = sys.argv[1]
if mode == 'upload':
    with tarfile.open(BASE/'identity-source.tar.gz', 'w:gz') as tar:
        tar.add(BASE/'site', arcname='.', filter=lambda info: None if '/node_modules/' in info.name or '/.output/' in info.name else info)
    run('mkdir -p ' + REMOTE)
    sftp = client.open_sftp()
    sftp.put(str(BASE/'identity-source.tar.gz'), '/tmp/vsb-identity-20260911.tar.gz')
    run('tar -xzf /tmp/vsb-identity-20260911.tar.gz -C ' + REMOTE)
    print('Source uploaded to ' + REMOTE)
elif mode == 'build':
    build_args = {
      'VITE_SITE_URL': 'https://vsbseguranca.com.br',
      'VITE_PHONE_DISPLAY': '(85) 98629-3430',
      'VITE_PHONE_NUMBER': '+5585986293430',
      'VITE_WHATSAPP_NUMBER': '5585986293430',
      'VITE_CONTACT_EMAIL': 'contato@vsbseguranca.com.br',
      'VITE_CMS_URL': 'https://cms.vsbseguranca.com.br',
    }
    args = ' '.join('--build-arg ' + shlex.quote(k+'='+v) for k,v in build_args.items())
    command = f'cd {REMOTE} && docker build {args} -t {IMAGE} . > /tmp/vsb-identity-build.log 2>&1; echo $? > /tmp/vsb-identity-build.status'
    run('rm -f /tmp/vsb-identity-build.status')
    print(run('nohup sh -c ' + shlex.quote(command) + ' >/dev/null 2>&1 < /dev/null & echo $!'))
elif mode == 'status':
    print(run('tail -55 /tmp/vsb-identity-build.log; if test -f /tmp/vsb-identity-build.status; then cat /tmp/vsb-identity-build.status; else echo RUNNING; fi'))
elif mode == 'format':
    command = f'docker run --rm -v {REMOTE}:/app -w /app oven/bun:1.2.22-alpine sh -c "bun install --frozen-lockfile && bunx prettier --write src" > /tmp/vsb-identity-format.log 2>&1; echo $? > /tmp/vsb-identity-format.status'
    run('rm -f /tmp/vsb-identity-format.status')
    print(run('nohup sh -c ' + shlex.quote(command) + ' >/dev/null 2>&1 < /dev/null & echo $!'))
elif mode == 'format-status':
    print(run('tail -15 /tmp/vsb-identity-format.log; if test -f /tmp/vsb-identity-format.status; then cat /tmp/vsb-identity-format.status; else echo RUNNING; fi'))
elif mode == 'preview':
    print(run(f'docker run -d --name vsb-identity-preview --restart unless-stopped -p 127.0.0.1:3001:3000 {IMAGE}'))
elif mode == 'patch-catalog':
    client.open_sftp().put(str(BASE/'site/src/routes/produtos.tsx'), REMOTE+'/src/routes/produtos.tsx')
    print(run(f'docker run --rm -v {REMOTE}:/app -w /app oven/bun:1.2.22-alpine bunx prettier --write src/routes/produtos.tsx'))
elif mode == 'refresh-preview':
    # Preserve runtime configuration without exposing its contents locally.
    current=json.loads(run('docker inspect vsb-site'))[0]
    runtime='/root/vsb-identity-20260911-runtime.env'
    sftp=client.open_sftp()
    with sftp.open(runtime,'w') as f:
        f.write('\n'.join(current['Config']['Env'])+'\n')
    sftp.chmod(runtime,0o600)
    run('docker rm -f vsb-identity-preview')
    print(run(f'docker run -d --name vsb-identity-preview --restart unless-stopped --log-driver json-file --log-opt max-size=10m --log-opt max-file=3 --env-file {runtime} -p 127.0.0.1:3001:3000 {IMAGE}'))
    print('Runtime configuration preserved; leads token present:',any(x.startswith('VSB_LEADS_TOKEN=') and len(x)>16 for x in current['Config']['Env']))
elif mode == 'publish':
    backup='/root/vsb-backup-identity-20260911'
    config='/etc/nginx/sites-available/vsbseguranca.com.br'
    health=run('curl -fsS http://127.0.0.1:3001/')
    assert 'Entender a fundo.' in health and 'bench-institutional' in health
    run(f'mkdir -p {backup} && chmod 700 {backup}')
    run(f'docker inspect vsb-site > {backup}/container-before.json && chmod 600 {backup}/container-before.json')
    run(f'cp -p {config} {backup}/nginx-before.conf')
    run(f'tar -czf {backup}/source-before.tar.gz -C /opt/vsb-site/source-v14 .')
    sftp=client.open_sftp()
    with sftp.open(config) as f: old=f.read().decode()
    assert old.count('proxy_pass http://127.0.0.1:3000;')==4
    new=old.replace('proxy_pass http://127.0.0.1:3000;', 'proxy_pass http://127.0.0.1:3001;').replace('container Node na 3000','container Node na 3001')
    with sftp.open(config+'.identity-new','w') as f: f.write(new)
    sftp.chmod(config+'.identity-new',0o644)
    run(f'mv {config}.identity-new {config}')
    try:
        run('nginx -t')
        run('systemctl reload nginx')
        response=run('curl -fsS https://vsbseguranca.com.br/')
        assert 'Entender a fundo.' in response
    except Exception:
        run(f'cp -p {backup}/nginx-before.conf {config} && nginx -t && systemctl reload nginx')
        raise
    run('docker rename vsb-site vsb-site-before-identity-20260911')
    run('docker rename vsb-identity-preview vsb-site')
    rollback=f'''#!/bin/sh
set -eu
cp -p {backup}/nginx-before.conf {config}
nginx -t
systemctl reload nginx
docker rename vsb-site vsb-site-identity-20260911
docker rename vsb-site-before-identity-20260911 vsb-site
'''
    with sftp.open(backup+'/rollback.sh','w') as f: f.write(rollback)
    sftp.chmod(backup+'/rollback.sh',0o700)
    print('Published at https://vsbseguranca.com.br/; backup: '+backup)
    print(run("docker ps --format '{{.Names}} {{.Image}} {{.Ports}}'"))
elif mode == 'read':
    print(run(sys.argv[2]))
elif mode == 'download':
    run(f'tar --exclude=node_modules --exclude=.output -czf /tmp/vsb-identity-validated.tar.gz -C {REMOTE} .')
    client.open_sftp().get('/tmp/vsb-identity-validated.tar.gz', str(BASE/'identity-validated.tar.gz'))
    print('Validated source downloaded')
client.close()
