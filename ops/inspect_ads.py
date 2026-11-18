from playwright.sync_api import sync_playwright
from pathlib import Path
from urllib.parse import urlsplit
import re, json
with sync_playwright() as p:
    b=p.chromium.launch(executable_path=r'C:\Program Files\Google\Chrome\Application\chrome.exe',headless=True)
    c=b.new_context()
    csp=re.search(r'add_header Content-Security-Policy "([^"]+)"',Path('site-improved/deploy/nginx-vsb-live.conf').read_text(encoding='utf-8')).group(1)
    def proxy(route):
        u=urlsplit(route.request.url)
        r=route.fetch(url='http://127.0.0.1:3305'+u.path+('?' +u.query if u.query else ''))
        route.fulfill(response=r,headers={**r.headers,'content-security-policy':csp})
    c.route('https://vsbseguranca.com.br/**',proxy)
    page=c.new_page()
    page.on('request',lambda r:print(r.url[:200]) if 'googleads' in r.url or 'googlesyndication' in r.url else None)
    page.goto('https://vsbseguranca.com.br/contato',wait_until='load')
    page.wait_for_timeout(9000)
    print(page.locator('[role="button"]').evaluate_all('(els)=>els.map(e=>e.outerHTML.slice(0,1000))'))
    print([(f.url[:80], f.locator('[aria-label],[title]').evaluate_all('(els)=>els.map(e=>e.outerHTML.slice(0,500))')) for f in page.frames if 'surveyiframe' in f.url])
    print(page.locator('h1').all_text_contents())
    page.screenshot(path='checks-improvements/reader-overlay.png')
    print(json.dumps(page.evaluate("({adsKeys:Object.keys(window.adsbygoogle),pause:window.adsbygoogle.pauseAdRequests,desc:Object.getOwnPropertyDescriptor(window.adsbygoogle,'pauseAdRequests'),npa:window.adsbygoogle.requestNonPersonalizedAds,consent:window.dataLayer.filter(x=>x[0]==='consent').map(x=>Array.from(x))})"),indent=2))
    b.close()
