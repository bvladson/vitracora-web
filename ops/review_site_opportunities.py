from pathlib import Path
import json,datetime
from playwright.sync_api import sync_playwright
out=Path(__file__).parent/'review-improvements'
out.mkdir(exist_ok=True)
report={'date':datetime.datetime.now().isoformat(),'pages':[]}
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=r'C:\Program Files\Google\Chrome\Application\chrome.exe',headless=True)
    ctx=browser.new_context(viewport={'width':390,'height':844},device_scale_factor=1,is_mobile=True,has_touch=True)
    page=ctx.new_page()
    page.add_init_script("window.audit={lcp:0,cls:0};new PerformanceObserver(l=>l.getEntries().forEach(e=>window.audit.lcp=e.startTime)).observe({type:'largest-contentful-paint',buffered:true});new PerformanceObserver(l=>l.getEntries().forEach(e=>{if(!e.hadRecentInput)window.audit.cls+=e.value})).observe({type:'layout-shift',buffered:true});")
    for route in ['/','/portfolio','/contato','/blog','/produtos','/eletrica']:
        errors=[]
        listener=lambda e:errors.append(str(e))
        page.on('pageerror',listener)
        response=page.goto('https://vsbseguranca.com.br'+route,wait_until='load')
        page.wait_for_timeout(1000)
        data=page.evaluate('''() => ({
            title:document.title,h1:[...document.querySelectorAll('h1')].map(x=>x.innerText),
            headings:[...document.querySelectorAll('main h2, main h3')].map(x=>x.innerText),
            text:document.querySelector('main')?.innerText,
            images:[...document.querySelectorAll('main img')].map(x=>({alt:x.alt,src:x.currentSrc,loaded:x.complete&&x.naturalWidth>0})),
            overflow:document.documentElement.scrollWidth>innerWidth,
            timing:{...window.audit,ttfb:performance.getEntriesByType('navigation')[0].responseStart},
            canonical:document.querySelector('link[rel="canonical"]')?.href,
            formFields:[...document.querySelectorAll('form input,form textarea,form select')].map(x=>({label:x.closest('label')?.innerText,required:x.required,type:x.type})),
            schemas:[...document.querySelectorAll('script[type="application/ld+json"]')].map(x=>JSON.parse(x.textContent))
        })''')
        data.update({'route':route,'status':response.status,'errors':errors})
        report['pages'].append(data)
        page.screenshot(path=str(out/('home-mobile.png' if route=='/' else route.strip('/')+'-mobile.png')))
        page.remove_listener('pageerror',listener)
    page.set_viewport_size({'width':1440,'height':1000})
    page.goto('https://vsbseguranca.com.br/',wait_until='load')
    page.screenshot(path=str(out/'home-desktop.png'))
    browser.close()
(out/'review.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps([{k:x[k] for k in ['route','status','h1','headings','timing','overflow','errors']} for x in report['pages']],ensure_ascii=True,indent=2))
