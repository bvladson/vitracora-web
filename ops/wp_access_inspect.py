from pathlib import Path
import sys,shlex,json,re
import paramiko
sys.stdout.reconfigure(encoding='utf-8')
c=paramiko.SSHClient()
c.load_host_keys(str(Path.home()/'.ssh/known_hosts'))
c.connect('203.0.113.10',username='root',key_filename=str(Path.home()/'.ssh/id_ed25519_vps'),timeout=20)
def run(cmd):
    _,out,err=c.exec_command(cmd)
    data=out.read().decode()
    errors=err.read().decode()
    if out.channel.recv_exit_status(): raise RuntimeError(errors)
    return data
sftp=c.open_sftp()
raw=sftp.open('/opt/vsb-cms/.env').read().decode()
entries={line.split('=',1)[0]:line.split('=',1)[1] for line in raw.splitlines() if '=' in line and not line.startswith('#')}
print('ENV_KEYS:',json.dumps(list(entries)))
admin={k:v for k,v in entries.items() if re.search(r'(ADMIN|WP_USER|WP_PASS)',k)}
if admin: print('SAVED_ADMIN:',json.dumps(admin,ensure_ascii=False))
php='require "/var/www/html/wp-load.php"; foreach(get_users(["role"=>"administrator"]) as $u) { echo json_encode(["ID"=>$u->ID,"login"=>$u->user_login,"email"=>$u->user_email,"display"=>$u->display_name]),"\n"; }'
print('ADMIN_USERS:',run('docker exec vsb-cms-wordpress-1 php -r '+shlex.quote(php)))
history=sftp.open('/root/.bash_history').read().decode(errors='replace')
relevant=[line for line in history.splitlines() if re.search(r'vsbadmin|admin_password|admin-pass|user_pass',line,re.I)]
print('MATCHING_HISTORY_LINES:',len(relevant))
for line in relevant:
    for pattern in [r'--admin_password=(?:\"([^\"]+)\"|\x27([^\x27]+)\x27|([^\s]+))',r'--user_pass=(?:\"([^\"]+)\"|\x27([^\x27]+)\x27|([^\s]+))']:
        for match in re.finditer(pattern,line):
            print('SAVED_WORDPRESS_PASSWORD:',next(v for v in match.groups() if v))
c.close()
