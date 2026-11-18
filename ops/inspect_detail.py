from playwright.sync_api import sync_playwright
import json,sys
sys.stdout.reconfigure(encoding='utf-8')
with sync_playwright() as p:
    b=p.chromium.launch(executable_path=r'C:\Program Files\Google\Chrome\Application\chrome.exe',headless=True)
    page=b.new_page()
    page.goto('http://127.0.0.1:3305/produtos/adequacao-de-infraestrutura-existente',wait_until='load')
    print(page.locator('h1').all_text_contents())
    print(page.locator('script[type="application/ld+json"]').all_text_contents())
    b.close()
