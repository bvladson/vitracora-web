import sys,json,shlex
from pathlib import Path
import paramiko
sys.stdout.reconfigure(encoding='utf-8')
c=paramiko.SSHClient();c.load_host_keys(str(Path.home()/'.ssh/known_hosts'))
c.connect('203.0.113.10',username='root',key_filename=str(Path.home()/'.ssh/id_ed25519_vps'),timeout=20)
php='''require '/var/www/html/wp-load.php';
require_once ABSPATH.'wp-admin/includes/plugin.php';
$result=['home'=>get_option('home'),'siteurl'=>get_option('siteurl'),'blogname'=>get_option('blogname'),'permalink_structure'=>get_option('permalink_structure'),'privacy_page'=>get_option('wp_page_for_privacy_policy'),'theme'=>get_option('stylesheet'),'active_plugins'=>get_option('active_plugins'),'mu_plugins'=>array_keys(get_mu_plugins()),'pages'=>[]];
foreach(get_posts(['post_type'=>'page','post_status'=>'any','numberposts'=>-1]) as $p) $result['pages'][]=['ID'=>$p->ID,'title'=>$p->post_title,'slug'=>$p->post_name,'status'=>$p->post_status];
echo json_encode($result,JSON_PRETTY_PRINT|JSON_UNESCAPED_UNICODE);'''
_,out,err=c.exec_command('docker exec vsb-cms-wordpress-1 php -r '+shlex.quote(php))
print(out.read().decode());print(err.read().decode())
c.close()
