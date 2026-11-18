import sys,json,re,datetime
from pathlib import Path
from urllib.parse import urlsplit
from playwright.sync_api import sync_playwright
sys.stdout.reconfigure(encoding='utf-8')
root=Path(__file__).parent
mode=sys.argv[1] if len(sys.argv)>1 else 'preview'
base='https://vsbseguranca.com.br'
csp=re.search(r'add_header Content-Security-Policy "([^"]+)"',(root/'site-youtube/deploy/nginx-vsb-live.conf').read_text(encoding='utf-8')).group(1)
report={'mode':mode,'date':datetime.datetime.now(datetime.timezone.utc).isoformat(),'embed':[],'browserDataApiCalls':[],'errors':[],'csp':[],'checks':[]}
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=r'C:\Program Files\Google\Chrome\Application\chrome.exe',headless=True)
    ctx=browser.new_context(viewport={'width':1440,'height':1000})
    ctx.add_cookies([{'name':n,'value':'rejected','url':base,'secure':True} for n in ['vsb_cookie_consent_v2','vsb_advertising_consent_v1']])
    def proxy(route):
        u=urlsplit(route.request.url)
        r=route.fetch(url='http://127.0.0.1:13307'+u.path+('?' +u.query if u.query else ''),max_redirects=0)
        headers=dict(r.headers)
        if route.request.resource_type=='document':headers['content-security-policy']=csp
        route.fulfill(response=r,headers=headers)
    if mode=='preview':ctx.route(base+'/**',proxy)
    page=ctx.new_page()
    page.add_init_script("if(location.hostname==='vsbseguranca.com.br')document.addEventListener('securitypolicyviolation',e=>console.error('YT_CSP '+e.effectiveDirective+' '+e.blockedURI.split('?')[0]));")
    page.on('console',lambda m:report['csp'].append(m.text) if m.type=='error' and m.text.startswith('YT_CSP ') else None)
    page.on('pageerror',lambda e:report['errors'].append(str(e)))
    page.on('request',lambda r:report['browserDataApiCalls'].append(r.url.split('?')[0]) if '/youtube/v3/' in r.url else None)
    page.on('response',lambda r:report['embed'].append({'url':r.url.split('?')[0],'status':r.status}) if r.request.resource_type=='document' and 'youtube-nocookie.com/embed/' in r.url else None)
    try:
        response=page.goto(base,wait_until='load')
        assert response.status==200
        page.locator('#youtube h3').first.wait_for()
        report['title']=page.title()
        report['canonical']=page.locator('link[rel="canonical"]').get_attribute('href')
        report['featured']=page.locator('#youtube h3').first.inner_text()
        assert report['title']=='VSB | Soluções técnicas em Fortaleza e região'
        assert report['canonical']==base+'/'
        assert page.locator('#youtube').evaluate("e=>e.previousElementSibling.classList.contains('identity-resources')&&e.nextElementSibling.classList.contains('identity-contact')")
        assert page.locator('#youtube iframe').count()==0
        page.locator('#youtube').scroll_into_view_if_needed()
        player=page.locator('#youtube iframe')
        player.wait_for()
        report['playerSrc']=player.get_attribute('src')
        assert player.count()==1 and 'autoplay=0' in report['playerSrc']
        page.wait_for_timeout(6500)
        assert report['embed'] and report['embed'][0]['status']==200,report
        ytframe=next(f for f in page.frames if 'youtube-nocookie.com/embed/' in f.url)
        report['youtubePlayerTitle']=ytframe.title()
        report['youtubePlayerText']=ytframe.locator('body').inner_text()[:700]
        for width in [1440,1366,768,390,360]:
            page.set_viewport_size({'width':width,'height':900})
            rect=player.bounding_box()
            assert rect['x']>=0 and rect['x']+rect['width']<=width+1,(width,rect)
            assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
        assert not report['browserDataApiCalls'] and not report['csp'],report
        assert not [e for e in report['errors'] if e=='Invalid API key' or 'YOUTUBE_API_KEY' in e]
        report['checks']=['Real feed populated the official channel video','Section order and original SEO preserved','One lazy privacy-enhanced iframe without autoplay','Real YouTube embed document returned200','Responsive player fits all five required widths','No YouTube Data API requests in browser and no site CSP violations']
    finally:
        (root/'checks-youtube'/('real-'+mode+'.json')).write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
        browser.close()
print(json.dumps(report,ensure_ascii=False,indent=2))
