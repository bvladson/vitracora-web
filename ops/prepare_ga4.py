from pathlib import Path
import shutil

base=Path(__file__).parent
target=base/'site-ga4'
if target.exists(): raise SystemExit('site-ga4 already exists; inspect instead of overwriting.')
shutil.copytree(base/'site-legal',target)
p=target/'src/lib/google-integrations.ts'
s=p.read_text(encoding='utf-8').replace('export const GTM_ID = "GTM-5WZFCV6P";', 'export const GTM_ID = "GTM-5WZFCV6P";\nexport const GA4_MEASUREMENT_ID = "G-BP931PJG0R";')
s += '''
// The shared consent defaults run before this configuration. GA4 handles
// page loads and History API navigation; dataLayer-only events stay with GTM.
export const GOOGLE_ANALYTICS_BOOTSTRAP = `
window.dataLayer = window.dataLayer || [];
window.gtag = window.gtag || function(){window.dataLayer.push(arguments);};
window.gtag('js', new Date());
window.gtag('config', '${GA4_MEASUREMENT_ID}');
`;
'''
p.write_text(s,encoding='utf-8')
p=target/'src/routes/__root.tsx'
s=p.read_text(encoding='utf-8').replace('  GTM_ID,\n','  GTM_ID,\n  GA4_MEASUREMENT_ID,\n  GOOGLE_ANALYTICS_BOOTSTRAP,\n',1)
s=s.replace('        <HeadContent />','''        <HeadContent />
        <script
          async
          src={`https://www.googletagmanager.com/gtag/js?id=${GA4_MEASUREMENT_ID}`}
        />
        <script
          id="vsb-google-analytics"
          dangerouslySetInnerHTML={{ __html: GOOGLE_ANALYTICS_BOOTSTRAP }}
        />''',1)
p.write_text(s,encoding='utf-8')
print('Prepared site-ga4 with the direct Google tag G-BP931PJG0R.')
