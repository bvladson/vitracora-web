import sys,json,hashlib
from pathlib import Path
from playwright.sync_api import sync_playwright
base=sys.argv[1] if len(sys.argv)>1 else 'http://127.0.0.1:3302'
root=Path(__file__).parent
out=root/'checks-logo-oficial'
out.mkdir(exist_ok=True)
report={'base':base,'errors':[],'sizes':[]}
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=r'C:\Program Files\Google\Chrome\Application\chrome.exe',headless=True)
    page=browser.new_page(viewport={'width':1440,'height':1000})
    page.on('pageerror',lambda e:report['errors'].append(str(e)))
    page.on('console',lambda msg:report['errors'].append(msg.text) if msg.type=='error' else None)
    response=page.goto(base,wait_until='networkidle')
    assert response.status==200
    if page.get_by_role('button',name='Somente necessários').count():page.get_by_role('button',name='Somente necessários').click()
    for width in [1440,390,320]:
        page.set_viewport_size({'width':width,'height':1000 if width==1440 else 844})
        page.evaluate('window.scrollTo(0,0)')
        page.wait_for_timeout(150)
        dimensions=page.locator('header img,footer img').evaluate_all('(els)=>els.map(e=>({src:e.getAttribute("src"),width:e.clientWidth,height:e.clientHeight,natural:[e.naturalWidth,e.naturalHeight],loaded:e.complete}))')
        for image in dimensions:
            assert image['src']=='/logo-principal-oficial-20260911.png'
            assert image['loaded'] and image['natural']==[2560,736]
            assert abs(image['width']/image['height']-2560/736)<0.06
        assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
        report['sizes'].append({'viewport':width,'logos':dimensions})
        page.screenshot(path=str(out/f'home-{width}.png'))
        page.locator('footer').screenshot(path=str(out/f'footer-{width}.png'))
    page.get_by_role('button',name='Abrir menu',exact=True).click()
    assert page.get_by_role('button',name='Fechar menu',exact=True).is_visible()
    page.keyboard.press('Escape')
    original=(root/'logos-oficiais/principal.png').read_bytes()
    delivered=page.request.get(base+'/logo-principal-oficial-20260911.png').body()
    assert hashlib.sha256(original).digest()==hashlib.sha256(delivered).digest()
    for path in ['/favicon-oficial-32.png','/favicon-oficial-64.png','/apple-touch-icon-oficial.png','/og-vsb-logo-oficial-20260911.jpg']:
        r=page.request.get(base+path)
        assert r.status==200 and r.headers['content-type'].startswith('image/')
    assert page.locator('link[rel="apple-touch-icon"]').get_attribute('href')=='/apple-touch-icon-oficial.png'
    for route in ['/servicos','/fontes-eletronicos','/seguranca-eletronica','/blog']:
        assert page.goto(base+route,wait_until='networkidle').status==200
        assert page.locator('header img').get_attribute('src')=='/logo-principal-oficial-20260911.png'
        assert page.locator('meta[property="og:image"]').get_attribute('content').endswith('/og-vsb-logo-oficial-20260911.jpg')
    assert not report['errors'],report['errors']
    browser.close()
(out/('production.json' if base.startswith('https:') else 'preview.json')).write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(report,ensure_ascii=True,indent=2))
