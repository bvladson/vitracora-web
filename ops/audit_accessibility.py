import json,sys
from pathlib import Path
from playwright.sync_api import sync_playwright
base=Path(__file__).parent
reports=[]
with sync_playwright() as p:
    b=p.chromium.launch(executable_path=r'C:\Program Files\Google\Chrome\Application\chrome.exe',headless=True)
    page=b.new_page(viewport={'width':1440,'height':1000})
    for route in ['/','/servicos','/energia','/telecomunicacoes','/produtos','/contato']:
        page.goto('http://127.0.0.1:3301'+route,wait_until='networkidle')
        if page.get_by_role('button',name='Somente necessários').count(): page.get_by_role('button',name='Somente necessários').click()
        page.add_script_tag(path=str(base/'axe.min.js'))
        result=page.evaluate('''async () => {const r=await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}}); return r.violations.map(v=>({id:v.id,impact:v.impact,description:v.description,nodes:v.nodes.map(n=>({html:n.html,target:n.target,summary:n.failureSummary}))}));}''')
        reports.append({'route':route,'violations':result})
        print(json.dumps(reports[-1],ensure_ascii=True),flush=True)
    b.close()
(base/'checks/accessibility.json').write_text(json.dumps(reports,ensure_ascii=False,indent=2),encoding='utf-8')
sys.exit(1 if any(x['violations'] for x in reports) else 0)
