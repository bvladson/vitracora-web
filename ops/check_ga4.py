import sys,json,datetime,re
from pathlib import Path
from urllib.parse import urlsplit,parse_qs
from playwright.sync_api import sync_playwright

root=Path(__file__).parent
out=root/'checks-ga4'
out.mkdir(exist_ok=True)
mode=sys.argv[1] if len(sys.argv)>1 else 'preview'
base='https://vsbseguranca.com.br'
ga='G-BP931PJG0R'
conf=(root/'site-legal/deploy/nginx-vsb-live.conf').read_text(encoding='utf-8')
csp=re.search(r'add_header Content-Security-Policy "([^"]+)"',conf).group(1)
report={'mode':mode,'tested_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'checks':[],'contexts':[]}

with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=r'C:\Program Files\Google\Chrome\Application\chrome.exe',headless=True)
    def route_preview(route):
        u=urlsplit(route.request.url)
        response=route.fetch(url='http://127.0.0.1:3304'+u.path+('?' + u.query if u.query else ''),max_redirects=0)
        headers=dict(response.headers)
        if route.request.resource_type=='document': headers['content-security-policy']=csp
        route.fulfill(response=response,headers=headers)
    def capture_ga(response,result):
        u=urlsplit(response.url)
        if not (u.hostname or '').endswith('google-analytics.com') or not u.path.endswith('/collect'):return
        baseparams=parse_qs(u.query)
        post=response.request.post_data or ''
        for row in post.splitlines() or ['']:
            params={**baseparams,**parse_qs(row)}
            # Record event metadata only: no client identifiers or session tokens.
            result['ga'].append({'status':response.status,**{k:params[k][0] for k in ['tid','en','dl','dr','gcs','gcd','npa'] if k in params}})
    def new_context(consent):
        ctx=browser.new_context(viewport={'width':1440,'height':1000})
        if mode=='preview':ctx.route(base+'/**',route_preview)
        if consent:ctx.add_cookies([{'name':'vsb_cookie_consent_v2','value':consent,'url':base,'secure':True}])
        result={'consent':consent,'ga':[],'errors':[],'loaded_scripts':[]}
        report['contexts'].append(result)
        page=ctx.new_page()
        page.add_init_script("window.vsbCsp=[];document.addEventListener('securitypolicyviolation',e=>window.vsbCsp.push({blocked:e.blockedURI,directive:e.effectiveDirective}));")
        page.on('response',lambda r:capture_ga(r,result))
        page.on('response',lambda r:result['loaded_scripts'].append({'url':r.url,'status':r.status}) if r.request.resource_type=='script' and 'googletagmanager.com/' in r.url else None)
        page.on('pageerror',lambda e:result['errors'].append(str(e)))
        page.on('console',lambda m:result['errors'].append(m.text) if m.type=='error' else None)
        return ctx,page,result
    try:
        ctx,page,r=new_context('accepted')
        assert page.goto(base,wait_until='load').status==200
        page.wait_for_timeout(3500)
        commands=page.evaluate("window.dataLayer.filter(x=>x[0]).map(x=>Array.from(x))")
        assert commands[0][0:2]==['consent','default'] and commands[0][2]['analytics_storage']=='granted'
        configs=[x for x in commands if x[0:2]==['config',ga]]
        assert len(configs)==1
        assert page.locator('head #vsb-google-analytics').count()==1
        for path in ['/eletrica','/energia']:
            page.locator(f'footer a[href="{path}"]').first.click()
            page.wait_for_url(base+path)
            page.wait_for_timeout(3000)
        assert page.locator(f'script[src="https://www.googletagmanager.com/gtag/js?id={ga}"]').count()==1
        # Google can load its own cx=c runtime. Count the installed URL exactly;
        # the collected page_view assertions below detect actual duplication.
        assert len([x for x in r['loaded_scripts'] if x['url']==f'https://www.googletagmanager.com/gtag/js?id={ga}'])==1
        assert page.evaluate("window.dataLayer.filter(x=>x[0]==='config'&&x[1]==='G-BP931PJG0R').length")==1
        views=[x for x in r['ga'] if x.get('tid')==ga and x.get('en')=='page_view']
        for path in ['/','/eletrica','/energia']:
            assert len([x for x in views if urlsplit(x.get('dl','')).path==path])==1,views
        assert all(200<=x['status']<300 for x in r['ga'])
        r['cookie_names']=[x['name'] for x in ctx.cookies() if x['domain'].endswith('vsbseguranca.com.br')]
        assert '_ga' in r['cookie_names']
        r['csp']=page.evaluate('window.vsbCsp')
        assert not r['csp'] and not r['errors'],r
        report['checks'].append('Direct GA4 installed once; consent precedes config; Google accepts exactly one page_view per tested route')
        ctx.close()

        ctx,page,r=new_context(None)
        page.goto(base,wait_until='load')
        page.get_by_role('button',name='Aceitar análise',exact=True).wait_for()
        page.wait_for_timeout(3000)
        assert page.evaluate("window.dataLayer[0][2].analytics_storage")=='denied'
        assert not any(x['name'].startswith('_ga') for x in ctx.cookies())
        r['before_accept']=len(r['ga'])
        page.get_by_role('button',name='Aceitar análise',exact=True).click()
        page.wait_for_timeout(3000)
        assert page.evaluate("window.dataLayer.filter(x=>x[0]==='consent'&&x[1]==='update').at(-1)[2].analytics_storage")=='granted'
        assert any(x['name']=='_ga' for x in ctx.cookies())
        page.get_by_role('button',name='Preferências de cookies',exact=True).click()
        page.get_by_role('button',name='Somente necessários',exact=True).click()
        assert page.evaluate("window.dataLayer.filter(x=>x[0]==='consent'&&x[1]==='update').at(-1)[2].analytics_storage")=='denied'
        for width in [390,1440]:
            page.set_viewport_size({'width':width,'height':900})
            assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
            page.screenshot(path=str(out/f'{mode}-{width}.png'))
        r['csp']=page.evaluate('window.vsbCsp')
        assert not r['csp'] and not r['errors'],r
        report['checks'].append('No GA cookies before consent; acceptance and revocation reach Google; responsive layout unaffected')
        ctx.close()
    finally:
        (out/f'{mode}.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
        browser.close()
print(json.dumps(report,ensure_ascii=True,indent=2))
