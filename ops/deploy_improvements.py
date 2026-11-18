import sys, shlex, json, tarfile, re
from pathlib import Path
import paramiko

sys.stdout.reconfigure(encoding='utf-8')
base = Path(__file__).parent
remote = '/opt/vsb-site/source-improvements-20260914'
image = 'vsb-site:improvements-20260914'
backup = '/root/vsb-backup-improvements-20260914'
final = '--final' in sys.argv
old_port, port = (3005, 3006) if final else (3004, 3005)
preview_name = 'vsb-improvements-final-preview' if final else 'vsb-improvements-preview'
previous_name = 'vsb-site-before-improvements-final-20260914' if final else 'vsb-site-before-improvements-20260914'
previous_source = remote if final else '/opt/vsb-site/source-ga4-20260911'
if final:
    remote += '-final'
    image += '-final'
    backup += '-final'
conf = '/etc/nginx/sites-available/vsbseguranca.com.br'
c = paramiko.SSHClient()
c.load_host_keys(str(Path.home()/'.ssh/known_hosts'))
c.connect('203.0.113.10', username='root', key_filename=str(Path.home()/'.ssh/id_ed25519_vps'), timeout=20)
sftp = c.open_sftp()

def run(cmd):
    _, out, err = c.exec_command(cmd)
    data, errors = out.read().decode(), err.read().decode()
    if out.channel.recv_exit_status():
        raise RuntimeError(data+'\n'+errors)
    return data

def write(path, data, mode=0o644):
    with sftp.open(path, 'w') as f:
        f.write(data)
    sftp.chmod(path, mode)

def nginx_config(old):
    additions = {
        'script-src': ['https://pagead2.googlesyndication.com', 'https://ep2.adtrafficquality.google'],
        'connect-src': ['https://pagead2.googlesyndication.com', 'https://googleads.g.doubleclick.net', 'https://csi.gstatic.com', 'https://ep1.adtrafficquality.google'],
        'frame-src': ['https://googleads.g.doubleclick.net', 'https://tpc.googlesyndication.com', 'https://ep2.adtrafficquality.google'],
        'img-src': ['https://pagead2.googlesyndication.com', 'https://googleads.g.doubleclick.net', 'https://tpc.googlesyndication.com', 'https://ep1.adtrafficquality.google'],
    }
    for directive, hosts in additions.items():
        old = re.sub(r'(?<![-\w])'+directive+r' ([^;]+);', lambda m: directive+' '+m.group(1)+' '+ ' '.join(h for h in hosts if h not in m.group(1).split())+';', old)
    return old.replace(f'proxy_pass http://127.0.0.1:{old_port};', f'proxy_pass http://127.0.0.1:{port};').replace(f'container Node na {old_port}', f'container Node na {port}')

mode = sys.argv[1]
if mode == 'upload':
    with tarfile.open(base/'improvements-source.tar.gz', 'w:gz') as tar:
        tar.add(base/'site-improved', arcname='.', filter=lambda info: None if any(p in {'node_modules', '.output', '.git', '.env'} for p in Path(info.name).parts) else info)
    sftp.put(str(base/'improvements-source.tar.gz'), '/tmp/vsb-improvements-source.tar.gz')
    run(f'mkdir -p {remote} && tar -xzf /tmp/vsb-improvements-source.tar.gz -C {remote}')
    new = nginx_config(sftp.open(conf).read().decode())
    for filename in ['nginx-vsbseguranca.conf', 'nginx-vsb-live.conf']:
        (base/'site-improved/deploy'/filename).write_text(new, encoding='utf-8')
        write(remote+'/deploy/'+filename, new)
    print('Source uploaded; preview CSP saved locally.')
elif mode == 'build':
    args = {'VITE_SITE_URL':'https://vsbseguranca.com.br','VITE_PHONE_DISPLAY':'(85) 98629-3430','VITE_PHONE_NUMBER':'+5585986293430','VITE_WHATSAPP_NUMBER':'5585986293430','VITE_CONTACT_EMAIL':'contato@vsbseguranca.com.br','VITE_CMS_URL':'https://cms.vsbseguranca.com.br','VITE_GTM_ID':'GTM-5WZFCV6P','VITE_GA_MEASUREMENT_ID':'G-BP931PJG0R'}
    arg = ' '.join('--build-arg '+shlex.quote(k+'='+v) for k,v in args.items())
    run('rm -f /tmp/vsb-improvements.status')
    command = f'docker build {arg} -t {image} {remote} >/tmp/vsb-improvements.log 2>&1; echo $? >/tmp/vsb-improvements.status'
    print(run('nohup sh -c '+shlex.quote(command)+' >/dev/null 2>&1 </dev/null & echo $!'))
elif mode == 'status':
    print(run('tail -30 /tmp/vsb-improvements.log; if test -f /tmp/vsb-improvements.status; then cat /tmp/vsb-improvements.status; else echo RUNNING; fi'))
elif mode == 'preview':
    env = json.loads(run('docker inspect vsb-site'))[0]['Config']['Env']
    envfile = '/root/vsb-improvements-runtime.env'
    write(envfile, '\n'.join(env)+'\n', 0o600)
    print(run(f'docker run -d --name {preview_name} --restart unless-stopped --log-driver json-file --log-opt max-size=10m --log-opt max-file=3 --env-file {envfile} -p 127.0.0.1:{port}:3000 {image}'))
elif mode == 'publish':
    html = run(f'curl -fsS http://127.0.0.1:{port}/')
    assert all(s in html for s in ['ca-pub-8202925663264045', 'G-BP931PJG0R', 'GTM-5WZFCV6P', 'CAow2uPHDA:openaccess'])
    assert run(f'curl -fsS http://127.0.0.1:{port}/ads.txt').strip() == 'google.com, pub-8202925663264045, DIRECT, f08c47fec0942fa0'
    old = sftp.open(conf).read().decode()
    assert old.count(f'proxy_pass http://127.0.0.1:{old_port};') == 4
    run(f'mkdir -p {backup} && chmod 700 {backup} && cp -p {conf} {backup}/nginx-before.conf && docker inspect vsb-site > {backup}/container-before.json && chmod 600 {backup}/container-before.json')
    new = nginx_config(old)
    write(conf+'.improvements-new', new)
    run(f'mv {conf}.improvements-new {conf}')
    try:
        run('nginx -t && systemctl reload nginx')
        assert 'ca-pub-8202925663264045' in run('curl -fsS https://vsbseguranca.com.br/')
    except Exception:
        run(f'cp -p {backup}/nginx-before.conf {conf} && nginx -t && systemctl reload nginx')
        raise
    run(f'docker rename vsb-site {previous_name} && docker rename {preview_name} vsb-site')
    run(f'ln -sfn {remote} /opt/vsb-site/current')
    for filename in ['nginx-vsbseguranca.conf', 'nginx-vsb-live.conf']:
        write(remote+'/deploy/'+filename, new)
        (base/'site-improved/deploy'/filename).write_text(new, encoding='utf-8')
    write(backup+'/rollback-site.sh', f'''#!/bin/sh
set -eu
cp -p {backup}/nginx-before.conf {conf}
nginx -t
systemctl reload nginx
docker rename vsb-site vsb-site-improvements-20260914{'-final' if final else ''}
docker rename {previous_name} vsb-site
ln -sfn {previous_source} /opt/vsb-site/current
''', 0o700)
    print('Published improvements and AdSense; backup: '+backup)
elif mode == 'document':
    sftp.put(str(base/'MELHORIAS_E_ADSENSE.md'), remote+'/MELHORIAS_E_ADSENSE.md')
    print('Documentation saved.')
c.close()
