import json,sys,time
from pathlib import Path
from playwright.sync_api import sync_playwright

base=sys.argv[1] if len(sys.argv)>1 else 'http://127.0.0.1:3301'
out=Path(__file__).parent/'checks'
out.mkdir(exist_ok=True)
report={'base':base,'pages':[],'failures':[]}
routes=['/','/servicos','/energia','/telecomunicacoes','/eletrica','/fontes-eletronicos','/seguranca-eletronica','/portoes-automaticos','/bicicletas-eletricas','/condominios-empresas','/produtos','/portfolio','/blog','/contato','/privacidade']
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=r'C:\Program Files\Google\Chrome\Application\chrome.exe',headless=True)
    context=browser.new_context(viewport={'width':1440,'height':1000},device_scale_factor=1)
    errors=[]
    page=context.new_page()
    page.on('pageerror',lambda e: errors.append(str(e)))
    for route in routes:
        response=page.goto(base+route,wait_until='networkidle',timeout=60000)
        page.evaluate('document.fonts.ready')
        if page.get_by_role('button',name='Somente necessários').count():
            page.get_by_role('button',name='Somente necessários').click()
        summary={'route':route,'status':response.status,'h1':page.locator('h1').all_text_contents(),'title':page.title()}
        for width in ([1440,1024,768,390,320] if route=='/' else [1440,390]):
            page.set_viewport_size({'width':width,'height':1000 if width>600 else 844})
            page.wait_for_timeout(200)
            dims=page.evaluate('({w:innerWidth,scroll:document.documentElement.scrollWidth,body:document.body.scrollWidth})')
            if max(dims['scroll'],dims['body'])>width:
                report['failures'].append({'route':route,'width':width,'overflow':dims})
            if route in ['/','/servicos','/contato','/energia','/telecomunicacoes'] and width in [1440,390]:
                name=(route.strip('/') or 'home')+'-'+str(width)
                page.screenshot(path=str(out/(name+'.png')),full_page=True)
                if route=='/': page.screenshot(path=str(out/(name+'-viewport.png')))
        if response.status!=200: report['failures'].append(summary)
        if len(summary['h1'])!=1: report['failures'].append({'route':route,'h1_count':len(summary['h1'])})
        report['pages'].append(summary)
        print(json.dumps(summary,ensure_ascii=True),flush=True)
    page.goto(base,wait_until='networkidle')
    page.set_viewport_size({'width':390,'height':844})
    page.get_by_role('button',name='Abrir menu',exact=True).click()
    assert page.get_by_role('button',name='Fechar menu',exact=True).get_attribute('aria-expanded')=='true'
    page.keyboard.press('Escape')
    assert page.get_by_role('button',name='Abrir menu',exact=True).get_attribute('aria-expanded')=='false'
    page.get_by_role('button',name='Abrir menu',exact=True).click()
    page.locator('#menu-principal-mobile').get_by_role('button').first.click()
    page.locator('#menu-principal-mobile').get_by_role('link',name='Telecomunicações',exact=True).click()
    page.wait_for_url('**/telecomunicacoes')
    assert page.get_by_role('button',name='Abrir menu',exact=True).is_visible()
    page.set_viewport_size({'width':1440,'height':1000})
    page.get_by_role('button',name='Áreas de atuação',exact=True).click()
    assert page.locator('#mega-menu-servicos').is_visible()
    menu_bounds=page.locator('#mega-menu-servicos').bounding_box()
    if menu_bounds['x']<0 or menu_bounds['x']+menu_bounds['width']>1440: report['failures'].append({'desktop_menu_bounds':menu_bounds})
    page.keyboard.press('Escape')
    assert not page.locator('#mega-menu-servicos').count()
    page.goto(base+'/contato',wait_until='networkidle')
    options=page.locator('select').first.locator('option').all_text_contents()
    assert len(options)==len(set(options)),options
    for area in ['Elétrica','Eletrônica','Energia','Telecomunicações','Segurança eletrônica']: assert area in options
    assert not page.locator('form').evaluate('(f)=>f.checkValidity()')
    page.goto(base,wait_until='networkidle')
    fonts=page.evaluate('({heading:getComputedStyle(document.querySelector("h1")).fontFamily,body:getComputedStyle(document.body).fontFamily,background:getComputedStyle(document.body).backgroundColor,manrope:document.fonts.check("600 24px Manrope")})')
    report['fonts']=fonts
    assert fonts['manrope'] and fonts['background']=='rgb(245, 243, 238)'
    whatsapp=page.locator('a[href*="wa.me/"]').evaluate_all('(els)=>els.map(e=>e.href)')
    assert whatsapp and all('wa.me/5585986293430?' in u for u in whatsapp)
    assert all('Ol' in u and 'Neto' in u for u in whatsapp)
    report['whatsapp_links']=len(whatsapp)
    page.get_by_role('button',name='Preferências de cookies',exact=True).click()
    assert page.get_by_role('button',name='Somente necessários').is_visible()
    page.get_by_role('button',name='Somente necessários').click()
    page.reload(wait_until='networkidle')
    assert not page.get_by_role('button',name='Somente necessários').count()
    report['browser_errors']=errors
    report['failures']+=errors
    browser.close()
(out/'report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(report,ensure_ascii=True,indent=2))
sys.exit(1 if report['failures'] else 0)
