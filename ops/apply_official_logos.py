from pathlib import Path
import shutil, base64, json
from playwright.sync_api import sync_playwright

base=Path(__file__).parent
site=base/'site-logo'
public=site/'public'
shutil.copyfile(base/'logos-oficiais/principal.png',public/'logo-principal-oficial-20260911.png')
shutil.copyfile(base/'logos-oficiais/vertical.png',public/'logo-vertical-oficial-20260911.png')
shutil.copyfile(base/'logos-oficiais/icone.png',public/'icone-oficial-original-20260911.png')
for file in (site/'src').rglob('*'):
    if file.suffix not in ['.ts','.tsx']: continue
    before=file.read_text(encoding='utf-8')
    after=before.replace('/og-vsb-20260911.jpg','/og-vsb-logo-oficial-20260911.jpg').replace('/logo-vsb.svg','/logo-principal-oficial-20260911.png')
    if before!=after: file.write_text(after,encoding='utf-8',newline='\n')

def data(path,mime): return 'data:'+mime+';base64,'+base64.b64encode(path.read_bytes()).decode()
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=r'C:\Program Files\Google\Chrome\Application\chrome.exe',headless=True)
    page=browser.new_page(device_scale_factor=1)
    for size,name in [(32,'favicon-oficial-32.png'),(64,'favicon-oficial-64.png'),(180,'apple-touch-icon-oficial.png')]:
        page.set_viewport_size({'width':size,'height':size})
        page.set_content(f'<html><head><style>html,body{{margin:0;width:100%;height:100%;background:#F5F3EE}}img{{width:100%;height:100%;object-fit:contain}}</style></head><body><img src="{data(base/"logos-oficiais/icone.png","image/png")}" /></body></html>')
        page.locator('img').evaluate('(e)=>e.decode()')
        page.screenshot(path=str(public/name))
    page.set_viewport_size({'width':1200,'height':630})
    html=f'''<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><style>
    @font-face{{font-family:Manrope;src:url({data(public/'fonts/manrope-latin-variable.woff2','font/woff2')})}}
    *{{box-sizing:border-box}}body{{margin:0;width:1200px;height:630px;background:#F5F3EE;color:#123B4A;font-family:Manrope,sans-serif;padding:65px;display:grid;grid-template-columns:510px 1fr;gap:56px;align-items:center}}
    .logo{{width:510px;height:440px;object-fit:contain}}.copy{{border-left:2px solid #C97941;padding-left:42px}}h1{{font-weight:600;font-size:43px;letter-spacing:-1.5px;line-height:1.2;margin:0 0 23px}}p{{font-size:18px;line-height:1.8;margin:0 0 25px}}small{{font-size:15px;color:#536066}}
    </style></head><body><img class="logo" alt="VSB Soluções técnicas" src="{data(base/'logos-oficiais/vertical.png','image/png')}"/><div class="copy"><h1>Entender a fundo.<br>Resolver com técnica.</h1><p>Elétrica · Eletrônica · Energia<br>Telecomunicações<br>Segurança eletrônica</p><small>vsbseguranca.com.br</small></div></body></html>'''
    page.set_content(html)
    page.evaluate('document.fonts.ready')
    page.locator('img').evaluate('(e)=>e.decode()')
    page.screenshot(path=str(public/'og-vsb-logo-oficial-20260911.jpg'),type='jpeg',quality=93)
    browser.close()
print(json.dumps({p.name:p.stat().st_size for p in public.glob('*oficial*')},indent=2))
