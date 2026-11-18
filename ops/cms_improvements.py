import sys,json,shlex
from pathlib import Path
import paramiko
sys.stdout.reconfigure(encoding='utf-8')
base=Path(__file__).parent
backup='/root/vsb-backup-improvements-20260914'
wp='vsb-cms-wordpress-1'
c=paramiko.SSHClient();c.load_host_keys(str(Path.home()/'.ssh/known_hosts'))
c.connect('203.0.113.10',username='root',key_filename=str(Path.home()/'.ssh/id_ed25519_vps'),timeout=20)
sftp=c.open_sftp()
def run(cmd):
    _,out,err=c.exec_command(cmd)
    data,errors=out.read().decode(),err.read().decode()
    if out.channel.recv_exit_status():raise RuntimeError(data+'\n'+errors)
    return data
mode=sys.argv[1]
if mode=='inspect':
    php="""require '/var/www/html/wp-load.php';
    $result=['posts'=>[],'products'=>[],'portfolio_count'=>wp_count_posts('vsb_portfolio'),'privacy'=>null];
    foreach(get_posts(['post_type'=>'post','post_status'=>['publish','draft'],'numberposts'=>-1]) as $p) $result['posts'][]=['id'=>$p->ID,'slug'=>$p->post_name,'title'=>$p->post_title,'content'=>$p->post_content,'status'=>$p->post_status];
    foreach(get_posts(['post_type'=>'product','post_status'=>'publish','numberposts'=>-1]) as $p) $result['products'][]=['id'=>$p->ID,'name'=>$p->post_title,'slug'=>$p->post_name,'excerpt'=>$p->post_excerpt,'content'=>$p->post_content];
    $p=get_post(get_option('wp_page_for_privacy_policy'));if($p)$result['privacy']=['id'=>$p->ID,'content'=>$p->post_content];
    echo wp_json_encode($result,JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES);"""
    result=run('docker exec '+wp+' php -r '+shlex.quote(php))
    (base/'content-improvements/cms-before.json').write_text(result,encoding='utf-8')
    data=json.loads(result)
    print(json.dumps({'posts':[{'id':p['id'],'slug':p['slug'],'status':p['status']} for p in data['posts']],'products':len(data['products']),'portfolio':data['portfolio_count'],'privacy_id':data['privacy']['id']},ensure_ascii=True,indent=2))
elif mode=='publish':
    run(f'mkdir -p {backup}/cms && chmod 700 {backup}')
    for local,remote in [('articles.json','vsb-articles.json'),('publish.php','vsb-publish-improvements.php')]:
        sftp.put(str(base/'content-improvements'/local),'/tmp/'+remote)
        run(f'docker cp /tmp/{remote} {wp}:/tmp/{remote}')
    print(run(f'docker exec {wp} php -l /tmp/vsb-publish-improvements.php').strip())
    result=run(f'docker exec {wp} php /tmp/vsb-publish-improvements.php')
    run(f'docker cp {wp}:/tmp/vsb-before-improvements-20260914.json {backup}/cms/before.json && chmod 600 {backup}/cms/before.json')
    (base/'content-improvements/cms-published.json').write_text(result,encoding='utf-8')
    print(result)
c.close()
