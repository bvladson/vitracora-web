from pathlib import Path
import paramiko
base = Path(__file__).parent
remote = '/opt/vsb-site/source-google-legal-20260911'
c = paramiko.SSHClient()
c.load_host_keys(str(Path.home()/'.ssh/known_hosts'))
c.connect('203.0.113.10',username='root',key_filename=str(Path.home()/'.ssh/id_ed25519_vps'),timeout=20)
sftp=c.open_sftp()
conf = (base/'site-legal/deploy/nginx-vsb-live.conf').read_bytes()
(base/'site-legal/deploy/nginx-vsbseguranca.conf').write_bytes(conf)
sftp.put(str(base/'site-legal/deploy/nginx-vsbseguranca.conf'),remote+'/deploy/nginx-vsbseguranca.conf')
sftp.put(str(base/'GOOGLE_E_PAGINAS_LEGAIS.md'),remote+'/GOOGLE_E_PAGINAS_LEGAIS.md')
_,out,err=c.exec_command("nginx -t && docker inspect --format '{{.Config.Image}} {{.State.Status}}' vsb-site && readlink -f /opt/vsb-site/current")
print(out.read().decode()); print(err.read().decode())
assert out.channel.recv_exit_status()==0
c.close()
