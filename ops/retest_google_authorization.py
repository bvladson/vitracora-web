import json, re, datetime, concurrent.futures
from urllib.request import Request, urlopen
from urllib.error import HTTPError
from pathlib import Path

out=Path(__file__).parent/'checks-google-legal'/'reteste-autorizacao'
out.mkdir(exist_ok=True)
endpoint='https://news.google.com/swg/_/api/v1/publication/CAow2uPHDA/article?locked=false&contentType=OPEN&visitFrequency=VISIT_FREQUENCY_NEW'
def check(origin):
    req=Request(endpoint,headers={'Origin':origin,'Referer':origin+'/','User-Agent':'Mozilla/5.0','Cache-Control':'no-cache'})
    try:
        r=urlopen(req,timeout=25)
    except HTTPError as e:
        r=e
    status=r.status
    raw=r.read().decode('utf-8','replace')
    result={'origin':origin,'status':status,'allow_origin':r.headers.get('Access-Control-Allow-Origin'),'response_date':r.headers.get('Date')}
    # Do not record or print per-visitor entitlements/tokens returned by Google.
    if status==200:
        payload=json.loads(raw.removeprefix(")]}'").strip())
        result['has_client_config']='clientConfig' in payload
        result['previewEnabled']=payload.get('previewEnabled')
        result['uiPredicates']=payload.get('clientConfig',{}).get('uiPredicates')
    return result
with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
    origins=list(pool.map(check,['https://vsbseguranca.com.br','https://cms.vsbseguranca.com.br','https://www.vsbseguranca.com.br']))
with urlopen('https://www.googletagmanager.com/gtm.js?id=GTM-5WZFCV6P',timeout=25) as r:
    script=r.read().decode()
    gtm={'status':r.status,'empty_tags':bool(re.search(r'"tags"\s*:\s*\[\s*\]',script)),'empty_rules':bool(re.search(r'"rules"\s*:\s*\[\s*\]',script)),'version':None}
    match=re.search(r'"version"\s*:\s*"([^\"]+)"',script)
    if match:gtm['version']=match.group(1)
report={'tested_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'origins':origins,'gtm':gtm}
(out/'google-authorization.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(report,ensure_ascii=True,indent=2))
