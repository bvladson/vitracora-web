import json,sys,datetime
from pathlib import Path
from playwright.sync_api import sync_playwright
sys.stdout.reconfigure(encoding='utf-8')
root=Path(__file__).parent
report={'url':'https://vsbseguranca.com.br','date':datetime.datetime.now(datetime.timezone.utc).isoformat(),'csp':[],'errors':[],'ads':[],'accessibility':[]}
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=r'C:\Program Files\Google\Chrome\Application\chrome.exe',headless=True)
    context=browser.new_context(viewport={'width':390,'height':844})
    context.add_cookies([{'name':n,'value':v,'url':report['url'],'secure':True} for n,v in [('vsb_cookie_consent_v2','rejected'),('vsb_advertising_consent_v1','accepted')]])
    page=context.new_page()
    page.add_init_script("document.addEventListener('securitypolicyviolation',e=>console.error('CSP '+e.effectiveDirective+' '+e.blockedURI.split('?')[0]));")
    page.on('console',lambda m:report['csp'].append(m.text) if m.type=='error' and m.text.startswith('CSP ') else None)
    page.on('pageerror',lambda e:report['errors'].append(str(e)))
    page.on('response',lambda r:report['ads'].append({'status':r.status,'url':r.url}) if 'adsbygoogle.js?client=' in r.url else None)
    try:
        assert page.goto(report['url'],wait_until='load').status==200
        page.wait_for_timeout(6500)
        assert page.locator('head script[src*="adsbygoogle.js?client=ca-pub-8202925663264045"]').count()==1
        assert len(report['ads'])==1 and report['ads'][0]['status']==200
        state=page.evaluate("window.dataLayer.filter(x=>x[0]==='consent').at(-1)[2]")
        assert state['ad_storage']=='granted' and state['analytics_storage']=='denied' and state['ad_personalization']=='denied'
        assert not any(c['name'].startswith('_ga') for c in context.cookies())
        # Audit authored site markup separately from Google's survey modal.
        # Only this second test context suppresses RRM; production is unchanged.
        accessibility_context=browser.new_context(viewport={'width':390,'height':844})
        accessibility_context.add_cookies([{'name':n,'value':v,'url':report['url'],'secure':True} for n,v in [('vsb_cookie_consent_v2','rejected'),('vsb_advertising_consent_v1','rejected')]])
        accessibility_context.route('https://news.google.com/swg/js/v1/swg-basic.js',lambda route:route.fulfill(status=200,content_type='application/javascript',body=''))
        page=accessibility_context.new_page()
        page.goto(report['url'],wait_until='load')
        page.add_script_tag(path=str(root/'axe.min.js'))
        for width in [320,390,1440]:
            page.set_viewport_size({'width':width,'height':900})
            assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
            violations=page.evaluate("async()=> (await axe.run({exclude:[['swg-popup-background'],['.swg-dialog']]},{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}})).violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.map(n=>n.target)}))")
            report['accessibility_scope']='Site markup in isolated context with Google RRM survey disabled for this audit only'
            report['accessibility'].append({'width':width,'violations':violations})
            assert not [v for v in violations if v['impact'] in ['critical','serious']],violations
            page.screenshot(path=str(root/'checks-improvements'/f'public-final-{width}.png'))
        assert not report['csp'] and not report['errors'],report
    finally:
        (root/'checks-improvements/public-browser-final.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
        browser.close()
print(json.dumps(report,ensure_ascii=False,indent=2))
