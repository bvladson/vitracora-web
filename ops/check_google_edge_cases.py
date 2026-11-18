import json
from pathlib import Path
from playwright.sync_api import sync_playwright
root = Path(__file__).parent
out = root/'checks-google-legal'
base = 'https://vsbseguranca.com.br'
report = {'checks':[], 'redirects':[]}
with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=r'C:\Program Files\Google\Chrome\Application\chrome.exe',headless=True)
    legacy = browser.new_context()
    legacy.add_cookies([{'name':'vsb_cookie_consent','value':'accepted','url':base,'secure':True}])
    page = legacy.new_page()
    page.goto(base,wait_until='load')
    page.get_by_role('button',name='Aceitar análise',exact=True).wait_for()
    assert page.evaluate("window.dataLayer[0][2].analytics_storage")=='denied'
    report['checks'].append('Legacy consent does not silently authorize the new Google purpose')
    legacy.close()
    accepted = browser.new_context()
    accepted.add_cookies([{'name':'vsb_cookie_consent_v2','value':'accepted','url':base,'secure':True}])
    page = accepted.new_page()
    page.add_init_script("Storage.prototype.removeItem=function(){throw new DOMException('Storage blocked','SecurityError')}")
    page.goto(base,wait_until='load')
    page.get_by_role('button',name='Preferências de cookies',exact=True).wait_for()
    assert page.evaluate("window.dataLayer[0][2].analytics_storage")=='granted'
    page.get_by_role('button',name='Preferências de cookies',exact=True).click()
    page.get_by_role('button',name='Somente necessários',exact=True).click()
    assert page.evaluate("window.dataLayer.filter(x=>x[0]==='consent'&&x[1]==='update').at(-1)[2].analytics_storage")=='denied'
    assert page.evaluate("document.cookie.includes('vsb_cookie_consent_v2=rejected')")
    report['checks'].append('Returning acceptance is restored; revocation succeeds even if localStorage throws')
    accepted.close()
    nojs = browser.new_context(java_script_enabled=False)
    page = nojs.new_page()
    r = page.goto(base,wait_until='load')
    assert r.status==200 and page.locator('h1').is_visible()
    assert page.locator('body > noscript > iframe').get_attribute('src')=='https://www.googletagmanager.com/ns.html?id=GTM-5WZFCV6P'
    report['checks'].append('Server-rendered site and GTM noscript are present with JavaScript disabled')
    for path,slug in [('/privacidade','politica-de-privacidade'),('/termos-de-servico','termos-de-servico'),('/pagina/politica-de-privacidade','politica-de-privacidade'),('/pagina/termos-de-servico','termos-de-servico')]:
        r=page.request.get(base+path,max_redirects=0)
        assert r.status==301,(path,r.status)
        assert r.headers['location']==f'https://cms.vsbseguranca.com.br/{slug}/'
        report['redirects'].append({'from':base+path,'to':r.headers['location'],'status':r.status})
    sitemap=page.request.get(base+'/sitemap.xml').text()
    assert '/pagina/politica-de-privacidade' not in sitemap and '/pagina/termos-de-servico' not in sitemap
    report['checks'].append('Legal aliases redirect permanently and are excluded from the main sitemap')
    browser.close()
(out/'google-edge-cases.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(report,ensure_ascii=True,indent=2))
