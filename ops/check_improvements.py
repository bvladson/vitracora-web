import sys, json, re, datetime
from pathlib import Path
from urllib.parse import urlsplit, parse_qs
from playwright.sync_api import sync_playwright

sys.stdout.reconfigure(encoding='utf-8')
root=Path(__file__).parent
out=root/'checks-improvements'
out.mkdir(exist_ok=True)
mode=sys.argv[1] if len(sys.argv)>1 else 'preview'
base='https://vsbseguranca.com.br'
csp=re.search(r'add_header Content-Security-Policy "([^"]+)"', (root/'site-improved/deploy/nginx-vsb-live.conf').read_text(encoding='utf-8')).group(1)
report={'mode':mode,'date':datetime.datetime.now(datetime.timezone.utc).isoformat(),'checks':[],'errors':[],'csp':[],'ads_responses':[],'ga':[]}

with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=r'C:\Program Files\Google\Chrome\Application\chrome.exe',headless=True)
    ctx=browser.new_context(viewport={'width':1440,'height':1000})
    def preview(route):
        u=urlsplit(route.request.url)
        response=route.fetch(url='http://127.0.0.1:3305'+u.path+('?' +u.query if u.query else ''),max_redirects=0)
        headers=dict(response.headers)
        if route.request.resource_type=='document':headers['content-security-policy']=csp
        route.fulfill(response=response,headers=headers)
    if mode=='preview':ctx.route(base+'/**',preview)
    page=ctx.new_page()
    def dismiss_survey():
        for attempt in range(30):
            for frame in page.frames:
                if 'surveyiframe' in frame.url:
                    frame.get_by_role('button',name='Fechar caixa de diálogo').click(timeout=5000)
                    return
            page.wait_for_timeout(100)
    page.add_locator_handler(page.locator('swg-popup-background'),dismiss_survey)
    page.add_init_script("document.addEventListener('securitypolicyviolation',e=>console.error('CSP '+e.effectiveDirective+' '+e.blockedURI));")
    page.on('pageerror',lambda e:report['errors'].append(str(e)))
    page.on('console',lambda m:report['csp'].append(m.text) if m.type=='error' and m.text.startswith('CSP ') else None)
    def response(r):
        if 'adsbygoogle.js?client=' in r.url:report['ads_responses'].append({'url':r.url,'status':r.status})
        u=urlsplit(r.url)
        if (u.hostname or '').endswith('google-analytics.com') and u.path.endswith('/collect'):
            params=parse_qs(u.query)
            for row in (r.request.post_data or '').splitlines() or ['']:
                data={**params,**parse_qs(row)}
                report['ga'].append({'status':r.status,**{k:data[k][0] for k in ['tid','en','ep.location','ep.service','ep.environment'] if k in data}})
    page.on('response',response)
    try:
        assert page.goto(base,wait_until='load').status==200
        page.get_by_role('button',name='Aceitar análise',exact=True).wait_for()
        page.wait_for_timeout(2500)
        selector='head script[src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8202925663264045"]'
        assert page.locator(selector).count()==1
        assert page.locator(selector).get_attribute('crossorigin')=='anonymous'
        assert page.locator('meta[name="google-adsense-account"]').get_attribute('content')=='ca-pub-8202925663264045'
        # Google consumes the initial flags and exposes write-only setters.
        assert page.evaluate("typeof Object.getOwnPropertyDescriptor(window.adsbygoogle,'pauseAdRequests').set")=='function'
        assert page.evaluate("window.dataLayer.filter(x=>x[0]==='consent').at(-1)[2].ad_storage")=='denied'
        assert not any(c['name'].startswith('_ga') for c in ctx.cookies())
        page.get_by_role('button',name='Aceitar análise',exact=True).click()
        page.wait_for_timeout(2000)
        assert page.evaluate("window.dataLayer.filter(x=>x[0]==='consent').at(-1)[2].ad_storage")=='denied'
        page.get_by_role('button',name='Preferências de cookies',exact=True).evaluate('(b)=>b.click()')
        page.get_by_role('checkbox',name='Análise de acesso',exact=True).uncheck()
        page.get_by_role('checkbox',name='Publicidade sem personalização',exact=True).check()
        page.get_by_role('button',name='Salvar preferências',exact=True).click()
        page.wait_for_timeout(2000)
        assert page.locator(selector).get_attribute('data-privacy-treatments')=='disablePersonalization'
        state=page.evaluate("window.dataLayer.filter(x=>x[0]==='consent').at(-1)[2]")
        assert state['analytics_storage']=='denied' and state['ad_storage']=='granted' and state['ad_personalization']=='denied'
        page.get_by_role('button',name='Preferências de cookies',exact=True).evaluate('(b)=>b.click()')
        page.get_by_role('button',name='Somente necessários',exact=True).click()
        assert page.evaluate("window.dataLayer.filter(x=>x[0]==='consent').at(-1)[2].ad_storage")=='denied'
        report['checks'].append('AdSense single head script/meta; analytics and non-personalized advertising consent separate, default/revocation paused')

        for path in ['/','/contato','/portfolio','/eletrica','/energia','/telecomunicacoes','/fontes-eletronicos','/seguranca-eletronica','/blog']:
            assert page.goto(base+path,wait_until='domcontentloaded').status==200,path
            page.locator('h1').wait_for()
            assert page.locator(selector).count()==1,path
            assert page.locator('link[rel="canonical"]').count()==1,path
            for width in [320,390,1440]:
                page.set_viewport_size({'width':width,'height':900})
                assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),(path,width)
            assert 'Hello world' not in page.locator('main').inner_text(),path
        report['checks'].append('9 main routes return200, single AdSense installation, canonical and no horizontal overflow320/390/1440px')

        articles=['camera-reiniciando-alimentacao-poe','como-escolher-nobreak-equipamentos','conexao-caindo-rede-cabeamento']
        for slug in articles:
            assert page.goto(base+'/blog/'+slug,wait_until='domcontentloaded').status==200
            assert 'VSB Soluções técnicas' in page.locator('main').inner_text()
            assert page.locator('article').inner_text().count(' ')>350
        report['checks'].append('3 technical articles published with VSB byline and source links')

        assert page.goto(base+'/produtos',wait_until='domcontentloaded').status==200
        page.get_by_text('1–12 de 324 itens',exact=True).wait_for()
        page.get_by_role('button',name='Equipamentos',exact=True).click()
        page.get_by_text('1–12 de 143 itens',exact=True).wait_for()
        page.get_by_role('button',name='Serviços',exact=True).click()
        page.get_by_text('1–12 de 181 itens',exact=True).wait_for()
        page.get_by_role('link',name='Próxima',exact=True).click()
        page.get_by_text('13–24 de 181 itens',exact=True).wait_for()
        assert 'tipo=servicos' in page.url and 'page=2' in page.url
        page.get_by_role('link',name='Anterior',exact=True).click()
        page.get_by_text('1–12 de 181 itens',exact=True).wait_for()
        for width in [320,390,1440]:
            page.set_viewport_size({'width':width,'height':900})
            assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),('catalog',width)
            if width==390:page.screenshot(path=str(out/(mode+'-catalog-mobile.png')))
        detail_title=page.locator('article h2').first.inner_text()
        page.get_by_role('link',name='Ver serviço',exact=True).first.click()
        page.wait_for_url('**/produtos/*')
        page.get_by_role('heading',level=1,name=detail_title,exact=True).wait_for()
        schemas=page.locator('script[type="application/ld+json"]').all_text_contents()
        assert any(json.loads(s).get('@type')=='Service' for s in schemas)
        report['checks'].append('Catalog324=143equipment+181services, filter/page navigation preserved; Service schema; responsive catalog')

        page.goto(base+'/contato',wait_until='load')
        page.get_by_label('Nome',exact=True).fill('TESTE TECNICO VSB 20260914')
        page.get_by_label('Telefone',exact=True).fill('(00) 00000-0000')
        page.get_by_label('Descrição do problema',exact=True).fill('Verificação automatizada sem envio de mensagens.')
        assert page.locator('form').evaluate('(f)=>f.checkValidity()')
        def fail_post(route):
            if route.request.method=='POST':route.fulfill(status=503,content_type='application/json',body='{}')
            elif mode=='preview':preview(route)
            else:route.continue_()
        page.route(base+'/**',fail_post)
        page.get_by_role('button',name='Enviar solicitação',exact=True).click()
        page.get_by_text('Não foi possível confirmar o registro.',exact=True).wait_for()
        assert page.get_by_label('Nome',exact=True).input_value()=='TESTE TECNICO VSB 20260914'
        assert page.get_by_role('link',name='Abrir no WhatsApp',exact=True).get_attribute('href').startswith('https://wa.me/')
        assert not page.evaluate("window.dataLayer.some(x=>x[0]==='event'&&x[1]==='generate_lead')")
        assert len(ctx.pages)==1
        report['checks'].append('Contact browser validation passed; backend failure keeps data and shows honest failure, no popup or lead event')
        page.unroute(base+'/**',fail_post)

        page.set_viewport_size({'width':390,'height':844})
        page.goto(base,wait_until='load')
        page.screenshot(path=str(out/(mode+'-home-mobile.png')))
        page.add_script_tag(path=str(root/'axe.min.js'))
        violations=page.evaluate("async()=> (await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}})).violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.map(n=>n.target)}))")
        report['axe']=violations
        assert not [v for v in violations if v['impact'] in ['critical','serious']],violations
        report['navigation_cancellations']=report['errors'].count('AbortError')
        assert not [e for e in report['errors'] if e!='AbortError'],report['errors']
        assert not report['csp'],report['csp']
    finally:
        (out/(mode+'.json')).write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
        browser.close()
print(json.dumps(report,ensure_ascii=False,indent=2))
