from pathlib import Path
from playwright.sync_api import sync_playwright
import json
base=Path(__file__).parent
result={'pages':[],'errors':[]}
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=r'C:\Program Files\Google\Chrome\Application\chrome.exe',headless=True)
    page=browser.new_page(viewport={'width':1440,'height':1000})
    page.on('pageerror',lambda e:result['errors'].append(str(e)))
    page.on('console',lambda msg:result['errors'].append(msg.text) if msg.type=='error' else None)
    for route in ['/','/energia','/telecomunicacoes','/produtos','/contato']:
        r=page.goto('https://vsbseguranca.com.br'+route,wait_until='networkidle')
        assert r.status==200
        result['pages'].append({'route':route,'status':r.status,'title':page.title()})
    page.goto('https://vsbseguranca.com.br',wait_until='networkidle')
    assert 'Entender a fundo.' in page.locator('h1').inner_text()
    if page.get_by_role('button',name='Somente necessários').count(): page.get_by_role('button',name='Somente necessários').click()
    assert page.evaluate('document.fonts.check("600 24px Manrope")')
    assert page.locator('.hero-photo img').evaluate('(e)=>e.complete && e.naturalWidth>0')
    page.screenshot(path=str(base/'checks/publicado-desktop.png'),full_page=True)
    page.set_viewport_size({'width':390,'height':844})
    page.screenshot(path=str(base/'checks/publicado-mobile.png'),full_page=True)
    for path in ['/logo-vsb.svg?v=20260911','/fonts/manrope-latin-variable.woff2','/og-vsb-20260911.jpg','/sitemap.xml','/robots.txt']:
        r=page.request.get('https://vsbseguranca.com.br'+path)
        assert r.status==200,(path,r.status)
        if path=='/sitemap.xml':
            assert '/energia' in r.text() and '/telecomunicacoes' in r.text()
    browser.close()
(base/'checks/production.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(result,ensure_ascii=True,indent=2))
assert not result['errors']
