import sys, shlex, json, tarfile
from pathlib import Path
import paramiko

sys.stdout.reconfigure(encoding='utf-8')
base = Path(__file__).parent
remote = '/opt/vsb-site/source-google-legal-20260911'
image = 'vsb-site:google-legal-20260911'
backup = '/root/vsb-backup-google-legal-20260911'
conf = '/etc/nginx/sites-available/vsbseguranca.com.br'
wp = 'vsb-cms-wordpress-1'
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

def write(path, text, mode=0o644):
    with sftp.open(path, 'w') as f: f.write(text)
    sftp.chmod(path, mode)

CSP = "; ".join([
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://tagmanager.google.com https://news.google.com https://www.gstatic.com https://www.google.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://news.google.com https://www.googletagmanager.com https://tagmanager.google.com",
    "img-src 'self' data: https://cms.vsbseguranca.com.br https://*.google-analytics.com https://*.googletagmanager.com https://www.gstatic.com https://ssl.gstatic.com https://*.googleusercontent.com https://www.google.com https://www.google.com.br https://news.google.com",
    "font-src 'self' data: https://fonts.gstatic.com",
    "connect-src 'self' https://cms.vsbseguranca.com.br https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com https://news.google.com https://news.googleusercontent.com https://www.google.com https://www.google.com.br https://www.gstatic.com https://*.googleapis.com",
    "frame-src https://www.googletagmanager.com https://news.google.com https://accounts.google.com https://www.google.com",
    "frame-ancestors 'self'", "base-uri 'self'", "form-action 'self'", "object-src 'none'"
])

mode = sys.argv[1]
if mode == 'upload':
    with tarfile.open(base/'google-legal-source.tar.gz', 'w:gz') as tar:
        tar.add(base/'site-legal', arcname='.')
    sftp.put(str(base/'google-legal-source.tar.gz'), '/tmp/vsb-google-legal.tar.gz')
    run(f'mkdir -p {remote} && tar -xzf /tmp/vsb-google-legal.tar.gz -C {remote}')
    print(run(f'docker run --rm -v {remote}/src:/app/src {"vsb-site:identity-validation"} bunx prettier --write src'))
elif mode == 'build':
    args = {'VITE_SITE_URL':'https://vsbseguranca.com.br','VITE_PHONE_DISPLAY':'(85) 98629-3430','VITE_PHONE_NUMBER':'+5585986293430','VITE_WHATSAPP_NUMBER':'5585986293430','VITE_CONTACT_EMAIL':'contato@vsbseguranca.com.br','VITE_CMS_URL':'https://cms.vsbseguranca.com.br','VITE_GTM_ID':'GTM-5WZFCV6P'}
    arg = ' '.join('--build-arg '+shlex.quote(k+'='+v) for k,v in args.items())
    run('rm -f /tmp/vsb-google-legal.status')
    command = f'docker build {arg} -t {image} {remote} >/tmp/vsb-google-legal.log 2>&1; echo $? >/tmp/vsb-google-legal.status'
    print(run('nohup sh -c '+shlex.quote(command)+' >/dev/null 2>&1 </dev/null & echo $!'))
elif mode == 'status':
    print(run('tail -25 /tmp/vsb-google-legal.log; if test -f /tmp/vsb-google-legal.status; then cat /tmp/vsb-google-legal.status; else echo RUNNING; fi'))
elif mode == 'cms':
    run(f'mkdir -p {backup}/legal-files /tmp/vsb-legal-stage/assets && chmod 700 {backup}')
    for name in ['vsb-legal-pages.php', 'template.php', 'install.php', 'content.json']:
        sftp.put(str(base/'legal-pages'/name), '/tmp/vsb-legal-stage/'+name)
    assets = {
        'legal-v1.css': base/'legal-pages/legal-v1.css',
        'logo-principal-oficial-20260911.png': base/'site-legal/public/logo-principal-oficial-20260911.png',
        'favicon-oficial-32.png': base/'site-legal/public/favicon-oficial-32.png',
        'manrope-latin-variable.woff2': base/'site-legal/public/fonts/manrope-latin-variable.woff2',
        'inter-latin-variable.woff2': base/'site-legal/public/fonts/inter-latin-variable.woff2',
    }
    for name,path in assets.items(): sftp.put(str(path), '/tmp/vsb-legal-stage/assets/'+name)
    for name in ['vsb-legal-pages.php', 'template.php', 'install.php']:
        run(f'docker cp /tmp/vsb-legal-stage/{name} {wp}:/tmp/vsb-legal-{name}')
        print(run(f'docker exec {wp} php -l /tmp/vsb-legal-{name}').strip())
    # Preserve existing plugin files if this deployment is retried.
    run(f'docker exec {wp} sh -c '+shlex.quote('if [ -f /var/www/html/wp-content/mu-plugins/vsb-legal-pages.php ]; then tar -czf /tmp/vsb-legal-plugin-before.tgz -C /var/www/html/wp-content/mu-plugins vsb-legal-pages.php vsb-legal-pages; fi'))
    run(f'if docker exec {wp} test -f /tmp/vsb-legal-plugin-before.tgz; then docker cp {wp}:/tmp/vsb-legal-plugin-before.tgz {backup}/legal-files/; fi')
    run(f'docker exec {wp} mkdir -p /var/www/html/wp-content/mu-plugins/vsb-legal-pages /var/www/html/wp-content/uploads/vsb-legal-assets')
    run(f'docker cp /tmp/vsb-legal-stage/assets/. {wp}:/var/www/html/wp-content/uploads/vsb-legal-assets/')
    run(f'docker cp /tmp/vsb-legal-stage/template.php {wp}:/var/www/html/wp-content/mu-plugins/vsb-legal-pages/template.php')
    run(f'docker cp /tmp/vsb-legal-stage/vsb-legal-pages.php {wp}:/var/www/html/wp-content/mu-plugins/vsb-legal-pages.php')
    run(f'docker exec {wp} chown -R www-data:www-data /var/www/html/wp-content/mu-plugins/vsb-legal-pages /var/www/html/wp-content/mu-plugins/vsb-legal-pages.php /var/www/html/wp-content/uploads/vsb-legal-assets')
    run(f'docker cp /tmp/vsb-legal-stage/content.json {wp}:/tmp/vsb-legal-content.json')
    result = run(f'docker exec {wp} php /tmp/vsb-legal-install.php')
    run(f'docker cp {wp}:/tmp/vsb-legal-before.json {backup}/legal-files/pages-before.json && chmod 600 {backup}/legal-files/pages-before.json')
    write(backup+'/legal-files/published.json', result, 0o600)
    print(result)
elif mode == 'preview':
    env = json.loads(run('docker inspect vsb-site'))[0]['Config']['Env']
    envfile = '/root/vsb-google-legal-runtime.env'
    write(envfile, '\n'.join(env)+'\n', 0o600)
    print(run(f'docker run -d --name vsb-google-legal-preview --restart unless-stopped --log-driver json-file --log-opt max-size=10m --log-opt max-file=3 --env-file {envfile} -p 127.0.0.1:3003:3000 {image}'))
elif mode == 'publish':
    import re
    html = run('curl -fsS http://127.0.0.1:3003/')
    assert 'GTM-5WZFCV6P' in html and 'CAow2uPHDA:openaccess' in html
    for slug in ['termos-de-servico', 'politica-de-privacidade']:
        assert '<article class="legal-content"' in run(f'curl -fsS https://cms.vsbseguranca.com.br/{slug}/')
    old = sftp.open(conf).read().decode()
    assert old.count('proxy_pass http://127.0.0.1:3002;') == 4
    run(f'mkdir -p {backup} && chmod 700 {backup} && cp -p {conf} {backup}/nginx-before.conf && docker inspect vsb-site > {backup}/container-before.json && chmod 600 {backup}/container-before.json')
    new = old.replace('proxy_pass http://127.0.0.1:3002;', 'proxy_pass http://127.0.0.1:3003;').replace('container Node na 3002','container Node na 3003')
    new, count = re.subn(r'add_header Content-Security-Policy "[^"]+" always;', 'add_header Content-Security-Policy "'+CSP+'" always;', new)
    assert count == 1
    write(conf+'.google-new', new)
    run(f'mv {conf}.google-new {conf}')
    try:
        run('nginx -t && systemctl reload nginx')
        assert 'GTM-5WZFCV6P' in run('curl -fsS https://vsbseguranca.com.br/')
    except Exception:
        run(f'cp -p {backup}/nginx-before.conf {conf} && nginx -t && systemctl reload nginx')
        raise
    run('docker rename vsb-site vsb-site-before-google-legal-20260911 && docker rename vsb-google-legal-preview vsb-site')
    run(f'ln -sfn {remote} /opt/vsb-site/current')
    write(backup+'/rollback-site.sh', f'''#!/bin/sh
set -eu
cp -p {backup}/nginx-before.conf {conf}
nginx -t
systemctl reload nginx
docker rename vsb-site vsb-site-google-legal-20260911
docker rename vsb-site-before-google-legal-20260911 vsb-site
ln -sfn /opt/vsb-site/source-logo-oficial-20260911 /opt/vsb-site/current
''', 0o700)
    write(remote+'/deploy/nginx-vsb-live.conf', new)
    (base/'site-legal/deploy/nginx-vsb-live.conf').write_text(new, encoding='utf-8')
    print('Site published. Backup: '+backup)
elif mode == 'download':
    run(f'tar -czf /tmp/vsb-google-legal-validated.tar.gz -C {remote} .')
    sftp.get('/tmp/vsb-google-legal-validated.tar.gz', str(base/'google-legal-validated.tar.gz'))
    with tarfile.open(base/'google-legal-validated.tar.gz') as tar:
        tar.extractall(base/'site-legal', filter='data')
    print('Validated source synchronized.')
c.close()
