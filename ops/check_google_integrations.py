import sys, json, ast
from pathlib import Path
from urllib.parse import urlsplit
from playwright.sync_api import sync_playwright

root = Path(__file__).parent
out = root/'checks-google-legal'
out.mkdir(exist_ok=True)
mode = sys.argv[1] if len(sys.argv)>1 else 'preview'
base = 'https://vsbseguranca.com.br'
source = ast.parse((root/'deploy_google_legal.py').read_text(encoding='utf-8'))
csp = next('; '.join(ast.literal_eval(n.value.args[0])) for n in source.body if isinstance(n, ast.Assign) and any(isinstance(t,ast.Name) and t.id=='CSP' for t in n.targets))
report = {'mode':mode, 'responses':[], 'console':[], 'pageerrors':[], 'failures':[], 'checks':[]}

with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=r'C:\Program Files\Google\Chrome\Application\chrome.exe', headless=True)
    def route_preview(route):
        u = urlsplit(route.request.url)
        response = route.fetch(url='http://127.0.0.1:3303'+u.path+('?' + u.query if u.query else ''), max_redirects=0)
        headers = dict(response.headers)
        if route.request.resource_type=='document': headers['content-security-policy'] = csp
        route.fulfill(response=response, headers=headers)
    context = browser.new_context(viewport={'width':1440,'height':1000})
    if mode=='preview': context.route(base+'/**', route_preview)
    page = context.new_page()
    page.on('console',lambda m:report['console'].append({'type':m.type,'text':m.text}) if m.type in ['error','warning'] else None)
    page.on('pageerror', lambda e:report['pageerrors'].append(str(e)))
    page.on('requestfailed', lambda r:report['failures'].append({'url':r.url,'error':r.failure}))
    page.on('response', lambda r:report['responses'].append({'url':r.url,'status':r.status}) if urlsplit(r.url).hostname not in ['vsbseguranca.com.br','cms.vsbseguranca.com.br'] else None)
    page.add_init_script("window.vsbCsp=[];document.addEventListener('securitypolicyviolation',e=>window.vsbCsp.push({blocked:e.blockedURI,directive:e.effectiveDirective}));")
    try:
        response = page.goto(base+'/',wait_until='load')
        assert response.status==200
        page.get_by_role('button',name='Aceitar análise',exact=True).wait_for()
        page.wait_for_timeout(4000)
        html = response.text()
        assert 'GTM-5WZFCV6P' in html and 'CAow2uPHDA:openaccess' in html
        assert page.locator('head #vsb-gtm-bootstrap').count()==1
        assert page.locator('head #vsb-reader-revenue').count()==1
        assert page.evaluate("document.body.firstElementChild.tagName==='NOSCRIPT'")
        commands = lambda: page.evaluate("(window.dataLayer||[]).map(x=>x[0]?Array.from(x):x)")
        initial = commands()
        assert initial[0][0:2]==['consent','default'] and initial[0][2]['analytics_storage']=='denied'
        assert next(i for i,x in enumerate(initial) if isinstance(x,dict) and x.get('event')=='gtm.js')>0
        assert not page.evaluate("localStorage.getItem('vsb_attribution')")
        report['checks'].append('HTML placement and default consent before GTM')
        page.get_by_role('button',name='Aceitar análise',exact=True).click()
        accepted = commands()
        updates = [x for x in accepted if isinstance(x,list) and x[0:2]==['consent','update']]
        assert updates[-1][2]['analytics_storage']=='granted'
        assert updates[-1][2]['ad_storage']=='denied'
        assert page.evaluate("localStorage.getItem('vsb_attribution')")
        count = sum(isinstance(x,dict) and x.get('event')=='page_view' for x in accepted)
        page.get_by_role('button',name='Preferências de cookies',exact=True).click()
        page.get_by_role('button',name='Aceitar análise',exact=True).click()
        assert sum(isinstance(x,dict) and x.get('event')=='page_view' for x in commands())==count
        report['checks'].append('Accept analytics with ads denied; repeated accept does not duplicate page_view')
        page.locator('footer a[href="/eletrica"]').first.click()
        page.wait_for_url(base+'/eletrica')
        page.wait_for_timeout(1000)
        assert sum(isinstance(x,dict) and x.get('event')=='page_view' and x.get('path')=='/eletrica' for x in commands())==1
        assert page.locator('script[src*="googletagmanager.com/gtm.js"]').count()==1
        assert page.locator('script[src*="swg-basic.js"]').count()==1
        assert len([r for r in report['responses'] if 'googletagmanager.com/gtm.js?' in r['url']])==1
        report['checks'].append('SPA navigation preserves a single GTM and Reader script')
        page.get_by_role('button',name='Preferências de cookies',exact=True).click()
        page.get_by_role('button',name='Somente necessários',exact=True).click()
        assert [x for x in commands() if isinstance(x,list) and x[0:2]==['consent','update']][-1][2]['analytics_storage']=='denied'
        assert not page.evaluate("localStorage.getItem('vsb_attribution')")
        report['checks'].append('Revocation updates Google and removes local attribution')
        assert page.locator('footer a[href="https://cms.vsbseguranca.com.br/politica-de-privacidade/"]').count()==1
        assert page.locator('footer a[href="https://cms.vsbseguranca.com.br/termos-de-servico/"]').count()==1
        for width in [1440,390,320]:
            page.set_viewport_size({'width':width,'height':900})
            assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
            page.screenshot(path=str(out/f'google-{mode}-{width}.png'))
        report['checks'].append('Legal footer links and layouts at 1440, 390 and 320 pixels')
        report['csp'] = page.evaluate('window.vsbCsp')
        report['dataLayer'] = commands()
        report['googleRuntime'] = page.evaluate("({gtm:!!window.google_tag_manager?.['GTM-5WZFCV6P'], reader:typeof self.SWG_BASIC, frames:[...document.querySelectorAll('iframe')].map(x=>x.src)})")
        assert report['googleRuntime']['gtm']
        assert any('swg-basic.js' in r['url'] and r['status']==200 for r in report['responses'])
        assert not report['csp'], report['csp']
        report['readerConfigurationErrors'] = [e for e in report['pageerrors'] if 'publisher or domain is not configured' in e]
        assert not [e for e in report['pageerrors'] if e not in report['readerConfigurationErrors']], report['pageerrors']
    finally:
        if not page.is_closed():
            report['csp'] = page.evaluate('window.vsbCsp')
        (out/f'google-{mode}.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
        browser.close()
print(json.dumps(report,ensure_ascii=True,indent=2))
