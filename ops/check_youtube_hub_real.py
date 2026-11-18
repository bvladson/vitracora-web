"""Real channel/API/embed check; unrelated Google survey isolated for modal clicks."""
import datetime
import json
import re
import sys
from pathlib import Path
from urllib.parse import urlsplit
from playwright.sync_api import sync_playwright

sys.stdout.reconfigure(encoding='utf-8')
ROOT = Path(__file__).parent
MODE = sys.argv[1] if len(sys.argv) > 1 else 'preview'
PORT = int(sys.argv[2]) if len(sys.argv) > 2 else 13308
BASE = 'https://vsbseguranca.com.br'
CSP = re.search(r'add_header Content-Security-Policy "([^"]+)"', (ROOT/'site-youtube-hub/deploy/nginx-vsb-live.conf').read_text(encoding='utf-8')).group(1)
report = {'mode': MODE, 'testedAt': datetime.datetime.now(datetime.timezone.utc).isoformat(),
          'isolation': 'Only unrelated swg-basic.js survey disabled for modal interaction; real feed, thumbnails and YouTube embed.',
          'embeds': [], 'browserDataApiCalls': [], 'errors': [], 'csp': [], 'checks': []}

def verify(condition, label):
    if not condition: raise AssertionError(label)
    report['checks'].append(label)

with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=r'C:\Program Files\Google\Chrome\Application\chrome.exe', headless=True)
    context = browser.new_context(viewport={'width': 1440, 'height': 1000})
    context.add_cookies([{'name': n, 'value': 'rejected', 'url': BASE, 'secure': True} for n in ['vsb_cookie_consent_v2', 'vsb_advertising_consent_v1']])
    def proxy(route):
        url = urlsplit(route.request.url)
        response = route.fetch(url=f'http://127.0.0.1:{PORT}'+url.path+('?' + url.query if url.query else ''), max_redirects=0)
        headers = dict(response.headers)
        if route.request.resource_type == 'document': headers['content-security-policy'] = CSP
        route.fulfill(response=response, headers=headers)
    if MODE == 'preview': context.route(BASE+'/**', proxy)
    context.route('https://news.google.com/swg/js/v1/swg-basic.js', lambda route: route.fulfill(status=200, content_type='application/javascript', body=''))
    page = context.new_page()
    page.set_default_timeout(20000)
    page.add_init_script("if(location.hostname==='vsbseguranca.com.br')document.addEventListener('securitypolicyviolation',e=>console.error('YT_HUB_CSP '+e.effectiveDirective+' '+e.blockedURI.split('?')[0]));")
    page.on('console', lambda m: report['csp'].append(m.text) if m.type == 'error' and m.text.startswith('YT_HUB_CSP ') else None)
    page.on('pageerror', lambda e: report['errors'].append(str(e)))
    page.on('request', lambda r: report['browserDataApiCalls'].append(r.url.split('?')[0]) if '/youtube/v3/' in r.url else None)
    page.on('response', lambda r: report['embeds'].append({'url': r.url.split('?')[0], 'status': r.status}) if r.request.resource_type == 'document' and 'youtube-nocookie.com/embed/' in r.url else None)
    try:
        verify(page.goto(BASE, wait_until='domcontentloaded').status == 200, 'Homepage HTTP 200')
        card = page.locator('#youtube a[href*="watch?v="]').first
        card.wait_for()
        feed = page.evaluate("async()=>await(await fetch('/api/youtube/videos')).json()")
        report['feed'] = {k: feed[k] for k in ['channel','updatedAt']}
        report['counts'] = {k: len(feed[k]) for k in ['videos','shorts','fullVideos','recentVideos']}
        verify(feed['channel']['id'] == 'UCu99Ykzuw_EWYXdX68K1ong' and len(feed['videos']) > 0, 'Real official-channel metadata available')
        report['title'] = page.title()
        verify(report['title'] == 'VSB | Soluções técnicas em Fortaleza e região', 'Homepage SEO title preserved')
        verify(page.locator('link[rel="canonical"]').get_attribute('href') == BASE+'/', 'Canonical preserved')
        section = page.locator('#youtube')
        verify(section.evaluate("e=>e.previousElementSibling.classList.contains('identity-resources')&&e.nextElementSibling.classList.contains('identity-contact')"), 'Section remains between original resources and contact')
        section.scroll_into_view_if_needed()
        verify(page.locator('iframe[src*="youtube-nocookie"]').count() == 0, 'No YouTube iframe before explicit click, including after scroll')
        for width in [1920,1440,1280,1024,768,430,390,375]:
            page.set_viewport_size({'width':width, 'height':1000})
            verify(page.evaluate('document.documentElement.scrollWidth <= innerWidth'), f'Real content has no page overflow at {width}px')
        page.set_viewport_size({'width':1440, 'height':1000})
        card.scroll_into_view_if_needed()
        page.wait_for_function("() => {const image=document.querySelector('#youtube .youtube-video-card img'); return image && image.complete && image.naturalWidth>0;}")
        verify(True, 'Real YouTube thumbnail loaded successfully')
        section.screenshot(path=str(ROOT/'checks-youtube-hub/real-desktop.png'), style='header.fixed, .skip-link, a.fixed { visibility:hidden !important; }')
        card.click()
        frame = page.locator('dialog[open] iframe')
        frame.wait_for()
        report['playerSrc'] = frame.get_attribute('src')
        verify(page.locator('iframe[src*="youtube-nocookie"]').count() == 1 and 'autoplay=0' in report['playerSrc'], 'Exactly one explicitly requested player without autoplay')
        page.wait_for_timeout(4500)
        verify(bool(report['embeds']) and report['embeds'][0]['status'] == 200, 'Real privacy-enhanced YouTube embed returned HTTP 200')
        yt = next(f for f in page.frames if 'youtube-nocookie.com/embed/' in f.url)
        report['youtubePlayerTitle'] = yt.title()
        report['youtubePlayerText'] = yt.locator('body').inner_text()[:500]
        for width in [1440,768,430,390,375]:
            page.set_viewport_size({'width':width,'height':900})
            box = frame.bounding_box()
            verify(box['x'] >= 0 and box['x']+box['width'] <= width+1, f'Real player fits {width}px')
        page.locator('dialog[open] button').first.click()
        verify(page.locator('iframe[src*="youtube-nocookie"]').count() == 0, 'Closing removes actual player')
        page.set_viewport_size({'width':390,'height':900})
        section.screenshot(path=str(ROOT/'checks-youtube-hub/real-mobile.png'), style='header.fixed, .skip-link, a.fixed { visibility:hidden !important; }')
        verify(not report['browserDataApiCalls'], 'No browser YouTube Data API calls')
        verify(not report['csp'], 'No site CSP violations')
        verify(not report['errors'], 'No uncaught browser JavaScript errors')
    finally:
        (ROOT/f'checks-youtube-hub/real-{MODE}.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
        context.unroute_all(behavior='ignoreErrors')
        browser.close()
print(json.dumps(report,ensure_ascii=False,indent=2))
