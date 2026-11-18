import sys, json, re, datetime, shlex
from pathlib import Path
from urllib.parse import urlsplit, parse_qs
import paramiko
from playwright.sync_api import sync_playwright

sys.stdout.reconfigure(encoding='utf-8')
root=Path(__file__).parent
base='https://vsbseguranca.com.br'
marker='VSB TESTE AUTOMATIZADO 20260914 1501'
report={'checks':[],'ga':[],'cleanup':[]}
csp=re.search(r'add_header Content-Security-Policy "([^"]+)"',(root/'site-improved/deploy/nginx-vsb-live.conf').read_text(encoding='utf-8')).group(1)
try:
    with sync_playwright() as p:
        b=p.chromium.launch(executable_path=r'C:\Program Files\Google\Chrome\Application\chrome.exe',headless=True)
        ctx=b.new_context(viewport={'width':1280,'height':1000})
        ctx.add_cookies([{'name':n,'value':v,'url':base,'secure':True} for n,v in [('vsb_cookie_consent_v2','accepted'),('vsb_advertising_consent_v1','rejected')]])
        pending=[]
        def proxy(route):
            if route.request.method=='POST':pending.append(route);return
            u=urlsplit(route.request.url)
            r=route.fetch(url='http://127.0.0.1:3305'+u.path+('?' +u.query if u.query else ''))
            headers=dict(r.headers)
            if route.request.resource_type=='document':headers['content-security-policy']=csp
            route.fulfill(response=r,headers=headers)
        ctx.route(base+'/**',proxy)
        page=ctx.new_page()
        def dismiss_survey():
            for attempt in range(30):
                for frame in page.frames:
                    if 'surveyiframe' in frame.url:
                        frame.get_by_role('button',name='Fechar caixa de diálogo').click(timeout=5000)
                        return
                page.wait_for_timeout(100)
        page.add_locator_handler(page.locator('swg-popup-background'),dismiss_survey)
        def ga(r):
            u=urlsplit(r.url)
            if (u.hostname or '').endswith('google-analytics.com') and u.path.endswith('/collect'):
                params=parse_qs(u.query)
                for row in (r.request.post_data or '').splitlines() or ['']:
                    data={**params,**parse_qs(row)}
                    report['ga'].append({'status':r.status,**{k:data[k][0] for k in ['tid','en','ep.location','ep.service','ep.environment'] if k in data}})
        page.on('response',ga)
        page.goto(base+'/contato',wait_until='load')
        page.get_by_label('Nome',exact=True).fill(marker)
        page.get_by_label('Telefone',exact=True).fill('(00) 00000-0000')
        page.get_by_label('Descrição do problema',exact=True).fill('Registro sintético de teste do formulário. Remover automaticamente. Não contatar.')
        page.get_by_role('button',name='Enviar solicitação',exact=True).click()
        page.get_by_role('button',name='Enviando solicitação…',exact=True).wait_for()
        assert page.get_by_role('button',name='Enviando solicitação…',exact=True).is_disabled()
        assert page.get_by_label('Nome',exact=True).is_disabled()
        page.locator('form').evaluate("f=>f.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}))")
        page.wait_for_timeout(300)
        assert len(pending)==1 and page.get_by_text('Solicitação registrada.',exact=True).count()==0
        route=pending.pop()
        u=urlsplit(route.request.url)
        r=route.fetch(url='http://127.0.0.1:3305'+u.path+('?' +u.query if u.query else ''))
        response_body=r.text()
        report['response_status']=r.status
        report['response_serialization']=response_body
        route.fulfill(response=r)
        page.get_by_text('Solicitação registrada.',exact=True).wait_for()
        assert len(ctx.pages)==1
        page.wait_for_timeout(2500)
        lead=page.evaluate("window.dataLayer.filter(x=>x[0]==='event'&&x[1]==='generate_lead').map(x=>Array.from(x))")
        assert len(lead)==1 and lead[0][2]['send_to']=='G-BP931PJG0R'
        assert set(lead[0][2])=={'send_to','page_path','service','environment'}
        if page.locator('swg-popup-background').is_visible():dismiss_survey()
        report['checks'].append('Pending feedback, fields disabled, duplicate submit blocked; real CMS acknowledged saved lead; one lead GA4 command without form personal data')
        assert '"k":["stored"],"v":[{"t":2,"s":2}]' in response_body,response_body
        page.locator('textarea').fill('Segunda tentativa simulada sem gravar no CMS.')
        page.get_by_role('button',name='Enviar solicitação',exact=True).click()
        page.get_by_role('button',name='Enviando solicitação…',exact=True).wait_for()
        page.wait_for_timeout(200)
        assert len(pending)==1
        pending.pop().fulfill(status=200,headers=r.headers,body=response_body.replace('"k":["stored"],"v":[{"t":2,"s":2}]','"k":["stored"],"v":[{"t":2,"s":3}]'))
        page.get_by_text('Não foi possível confirmar o registro.',exact=True).wait_for()
        assert page.get_by_label('Nome',exact=True).input_value()==marker
        assert page.evaluate("window.dataLayer.filter(x=>x[0]==='event'&&x[1]==='generate_lead').length")==1
        report['checks'].append('CMS stored=false shows failure, preserves fields, no extra conversion')
        page.evaluate("document.addEventListener('click',e=>{if(e.target.closest('a[href*=\"wa.me\"]'))e.preventDefault()},true)")
        page.locator('header a[href*="wa.me/"]').first.click()
        page.wait_for_timeout(6000)
        assert len(ctx.pages)==1
        assert page.evaluate("window.dataLayer.filter(x=>x[0]==='event'&&x[1]==='whatsapp_click').length")==1
        assert any(x.get('en')=='generate_lead' and x['status']==204 for x in report['ga'])
        assert any(x.get('en')=='whatsapp_click' and x['status']==204 for x in report['ga'])
        report['checks'].append('Google received generate_lead and whatsapp_click with HTTP204; no WhatsApp or email sent')
        b.close()
finally:
    c=paramiko.SSHClient();c.load_host_keys(str(Path.home()/'.ssh/known_hosts'))
    c.connect('203.0.113.10',username='root',key_filename=str(Path.home()/'.ssh/id_ed25519_vps'),timeout=20)
    php="""require '/var/www/html/wp-load.php';
    $posts=get_posts(['post_type'=>'vsb_lead','post_status'=>'private','numberposts'=>-1,'meta_key'=>'vsb_nome','meta_value'=>'%s']);
    $ids=[];foreach($posts as $post){if(get_post_meta($post->ID,'vsb_telefone',true)==='(00) 00000-0000' && str_contains($post->post_content,'Registro sintético de teste do formulário.')){if(wp_delete_post($post->ID,true))$ids[]=$post->ID;}}
    echo wp_json_encode($ids);"""%marker
    _,stdout,stderr=c.exec_command('docker exec vsb-cms-wordpress-1 php -r '+shlex.quote(php))
    output=stdout.read().decode();errors=stderr.read().decode()
    assert stdout.channel.recv_exit_status()==0,errors
    report['cleanup']=json.loads(output)
    c.close()
    (root/'checks-improvements/contact.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(report,ensure_ascii=False,indent=2))
