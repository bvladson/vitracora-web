from pathlib import Path
from playwright.sync_api import sync_playwright
import shutil
root=Path(__file__).parent/'site'
for p in (root/'src').rglob('*'):
    if p.suffix not in ['.tsx', '.ts']:
        continue
    s=p.read_text(encoding='utf-8')
    s=s.replace('bg-graphite/60', 'bg-secondary/40').replace('/og-vsb.jpg', '/og-vsb-20260911.jpg')
    s=s.replace('src="/logo-vsb.svg"', 'src="/logo-vsb.svg?v=20260911"')
    if p.name=='contato.tsx':
        s=s.replace('"Cerca elétrica",\n                      "Elétrica",', '"Cerca elétrica",')
        s=s.replace('Solicite orçamento para câmeras, portões automáticos, cercas elétricas, fontes, elétrica e bicicletas elétricas.', 'Converse com Neto sobre elétrica, eletrônica, energia, telecomunicações e segurança eletrônica.')
    p.write_text(s,encoding='utf-8')
with sync_playwright() as p:
    b=p.chromium.launch(executable_path=r'C:\Program Files\Google\Chrome\Application\chrome.exe',headless=True)
    page=b.new_page(viewport={'width':1200,'height':630}, device_scale_factor=1)
    page.goto((root/'public/brand/og-vsb.svg').as_uri())
    page.screenshot(path=str(root/'public/og-vsb-20260911.jpg'),type='jpeg',quality=92)
    shutil.copyfile(root/'public/og-vsb-20260911.jpg',root/'public/og-vsb.jpg')
    b.close()
print('Assets and references finalized')
