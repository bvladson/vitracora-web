import json, re, sys
from pathlib import Path
from urllib.request import Request, urlopen
from concurrent.futures import ThreadPoolExecutor
sys.stdout.reconfigure(encoding='utf-8')
base='https://vsbseguranca.com.br'
urls=[base+'/',base+'/ads.txt',base+'/robots.txt',base+'/sitemap.xml',base+'/produtos',base+'/blog',base+'/contato','https://cms.vsbseguranca.com.br/termos-de-servico/','https://cms.vsbseguranca.com.br/politica-de-privacidade/']
def check(url):
    with urlopen(Request(url,headers={'User-Agent':'Mozilla/5.0 (compatible; Mediapartners-Google)'}),timeout=25) as r:
        body=r.read().decode('utf-8')
        result={'url':url,'status':r.status,'content_type':r.headers.get('content-type')}
        assert r.status==200
        if url==base+'/ads.txt':assert body.strip()=='google.com, pub-8202925663264045, DIRECT, f08c47fec0942fa0'
        elif url==base+'/robots.txt':assert 'Allow: /' in body and 'Disallow: /\n' not in body
        elif url==base+'/sitemap.xml':
            assert all(s in body for s in ['camera-reiniciando-alimentacao-poe','como-escolher-nobreak-equipamentos','conexao-caindo-rede-cabeamento'])
            assert 'hello-world' not in body
        elif url.startswith(base):
            head=body.split('</head>')[0]
            result['ads_script_count']=len(re.findall(r'<script[^>]+src="https://pagead2\.googlesyndication\.com/pagead/js/adsbygoogle\.js\?client=ca-pub-8202925663264045"',head))
            assert result['ads_script_count']==1
            assert 'google-adsense-account' in head
            assert all(s in head for s in ['GTM-5WZFCV6P','G-BP931PJG0R','CAow2uPHDA:openaccess'])
            assert 'https://pagead2.googlesyndication.com' in r.headers.get('content-security-policy','')
        else:
            assert '<script' not in body
            if 'politica-de-privacidade' in url:
                assert 'AdSense' in body and 'vsb_advertising_consent_v1' in body
        return result
with ThreadPoolExecutor(max_workers=5) as pool:result=list(pool.map(check,urls))
Path('checks-improvements/public-http.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(result,ensure_ascii=False,indent=2))
