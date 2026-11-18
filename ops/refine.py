from pathlib import Path
import re

root = Path(__file__).parent / 'site'
css = root / 'src/styles.css'
s = css.read_text(encoding='utf-8')
s = re.sub(r'/\*.*?\*/', '', s, flags=re.S)
s = s.replace('"Inter Variable", Inter, Aptos, "Segoe UI Variable", ui-sans-serif, system-ui, sans-serif;\n\n  --color-background', '"Manrope", "Inter Variable", sans-serif;\n\n  --color-background')
a = s.index(':root {')
b = s.index('@layer base', a)
s = s[:a] + ''':root {
  --radius: 0.375rem;
  --background: #F5F3EE;
  --foreground: #171A1C;
  --card: #FFFFFF;
  --card-foreground: #171A1C;
  --popover: #FFFFFF;
  --popover-foreground: #171A1C;
  --primary: #123B4A;
  --primary-foreground: #FFFFFF;
  --secondary: #E5E7E6;
  --secondary-foreground: #24282B;
  --muted: #E5E7E6;
  --muted-foreground: #536066;
  --accent: #E5E7E6;
  --accent-foreground: #123B4A;
  --destructive: #AA342B;
  --destructive-foreground: #FFFFFF;
  --border: #D6DAD8;
  --input: #788387;
  --ring: #123B4A;
  --cyan-tech: #123B4A;
  --amber-energy: #123B4A;
  --graphite: #171A1C;
  --copper: #C97941;
}

@font-face {
  font-family: "Manrope";
  font-style: normal;
  font-weight: 200 800;
  font-display: swap;
  src: url("/fonts/manrope-latin-variable.woff2") format("woff2");
}

''' + s[b:]
s = s.replace('color-scheme: dark', 'color-scheme: light').replace('font-weight: 680', 'font-weight: 700').replace('font-weight: 620', 'font-weight: 600')
s = s.replace('rgb(0 0 0 / 35%)', 'rgb(18 59 74 / 8%)').replace('rgb(0 0 0 / 40%)', 'rgb(18 59 74 / 10%)').replace('rgb(0 0 0 / 30%)', 'rgb(18 59 74 / 8%)')
s = s.replace('background: linear-gradient(90deg, var(--primary), var(--cyan-tech));', 'background: var(--copper);').replace('box-shadow: 0 0 12px color-mix(in oklab, var(--primary) 55%, transparent);', '')
s = s.replace('  content-visibility: auto;\n  contain-intrinsic-size: auto 720px;', '  scroll-margin-top: 6rem;')
s = re.sub(r'\n\s*\n\s*\n', '\n\n', s)
s += '''
/* VSB · Soluções técnicas — identidade institucional 2026. */
@layer base {
  h1, h2, h3, h4 { color: var(--primary); }
  nav, button, .btn-neon, .btn-ghost-neon { font-family: var(--font-display); }
  a, button { -webkit-tap-highlight-color: transparent; }
  a { text-underline-offset: .25em; }
  button { cursor: pointer; }
  [id] { scroll-margin-top: 6rem; }
}
.identity-container { width: min(1280px, 100%); padding-inline: 32px; margin-inline: auto; }
.identity-eyebrow { display: flex; align-items: center; gap: 12px; font-family: var(--font-display); font-size: 10px; font-weight: 600; letter-spacing: .16em; text-transform: uppercase; color: var(--primary); }
.identity-eyebrow > span { display: inline-block; width: 24px; height: 2px; background: var(--copper); flex-shrink: 0; }
.identity-hero { padding-top: 66px; }
.hero-layout { display: grid; grid-template-columns: 1.12fr 1fr; gap: 56px; align-items: center; }
.hero-copy { padding-bottom: 20px; }
.hero-copy h1 { font-size: clamp(42px, 4.45vw, 66px); font-weight: 600; line-height: 1.09; letter-spacing: -.052em; margin-top: 29px; text-wrap: initial; }
.hero-last { display: block; }
.hero-description { color: var(--muted-foreground); max-width: 450px; font-size: 16px; line-height: 1.85; margin-top: 26px; }
.hero-actions { display: flex; gap: 26px; align-items: center; flex-wrap: wrap; margin-top: 32px; }
.hero-actions .btn-neon { padding: 15px 21px; gap: 22px; border-radius: 3px; }
.identity-text-link { display: inline-flex; align-items: center; gap: 12px; color: var(--primary); font-family: var(--font-display); font-size: 13px; font-weight: 600; min-height: 44px; }
.identity-text-link:hover { text-decoration: underline; }
.identity-text-link svg { flex-shrink: 0; }
.hero-signature { display: flex; align-items: center; gap: 15px; margin-top: 36px; }
.signature-line { height: 32px; width: 2px; background: var(--border); }
.hero-signature p { font-size: 11px; color: var(--muted-foreground); line-height: 1.9; }
.hero-signature strong { color: var(--primary); font-weight: 500; }
.hero-figure { position: relative; margin: 0; }
.hero-photo { aspect-ratio: 1 / 1.025; background: var(--secondary); overflow: hidden; border-radius: 2px; }
.hero-photo img { width: 100%; height: 100%; object-fit: cover; object-position: 43% center; }
.hero-photo-note { display: flex; align-items: center; gap: 16px; background: var(--primary); color: var(--primary-foreground); padding: 20px 24px; font-size: 11px; }
.photo-number { font-family: var(--font-display); font-size: 10px; letter-spacing: .12em; border-right: 1px solid #ffffff33; padding-right: 16px; color: #ffffff; }
.hero-photo-note > svg { margin-left: auto; color: var(--copper); }
.hero-figure figcaption { color: var(--muted-foreground); font-size: 10px; letter-spacing: .02em; margin-top: 8px; text-align: right; }
.expertise-strip { display: flex; align-items: center; justify-content: space-between; gap: 32px; border-top: 1px solid var(--border); margin-top: 48px; padding: 27px 0 30px; }
.expertise-strip > span { color: var(--muted-foreground); font-size: 11px; line-height: 1.8; }
.expertise-strip strong { color: var(--primary); font-weight: 500; }
.expertise-strip p { display: flex; flex-wrap: wrap; align-items: center; gap: 23px; font-family: var(--font-display); font-weight: 500; font-size: 13px; color: var(--primary); }
.expertise-strip i { width: 3px; height: 3px; background: var(--copper); }
.identity-section { padding-block: 104px; }
.identity-areas { background: #FFFFFF; }
.identity-section-heading { display: grid; grid-template-columns: 1.3fr .7fr; gap: 80px; align-items: end; margin-bottom: 55px; }
.identity-section h2, .identity-resources h2 { font-size: clamp(28px, 3vw, 41px); font-weight: 600; line-height: 1.22; letter-spacing: -.035em; margin-top: 22px; }
.identity-section-heading > p { font-size: 14px; line-height: 1.8; color: var(--muted-foreground); max-width: 340px; padding-bottom: 4px; }
.area-list { border-top: 1px solid var(--border); }
.area-row { display: grid; grid-template-columns: 55px 1fr 1.3fr 44px; gap: 26px; align-items: center; padding: 30px 0; border-bottom: 1px solid var(--border); transition: background .2s; }
.area-row:hover { background: var(--background); }
.area-number { font-family: var(--font-display); color: var(--copper); font-size: 26px; font-weight: 600; letter-spacing: -.04em; }
.area-row h3 { font-size: clamp(20px, 2vw, 27px); font-weight: 600; letter-spacing: -.035em; }
.area-row p { font-size: 13px; line-height: 1.8; color: var(--muted-foreground); max-width: 440px; }
.area-detail { display: block; margin-top: 9px; font-size: 10px; font-family: var(--font-display); color: var(--primary); letter-spacing: .015em; }
.area-arrow { width: 42px; height: 42px; display: grid; place-items: center; border: 1px solid var(--border); border-radius: 50%; color: var(--primary); transition: background .2s, color .2s; }
.area-row:hover .area-arrow { color: #fff; background: var(--primary); border-color: var(--primary); }
.area-footnote { display: flex; justify-content: space-between; gap: 40px; align-items: center; margin-top: 28px; }
.area-footnote > p { font-size: 12px; color: var(--muted-foreground); max-width: 630px; }
.area-footnote > a { flex-shrink: 0; }
.neto-section { background: var(--background); }
.neto-layout { display: grid; grid-template-columns: .85fr 1.15fr; gap: 100px; }
.neto-profile { border-left: 1px solid var(--border); padding-left: 38px; display: flex; flex-direction: column; align-items: flex-start; }
.neto-name { font-family: var(--font-display); font-size: clamp(80px, 9vw, 128px); color: var(--primary); font-weight: 600; line-height: 1.2; letter-spacing: -.08em; margin-top: 42px; }
.neto-name > span { color: var(--copper); }
.neto-role { color: var(--primary); font-family: var(--font-display); font-size: 20px; line-height: 1.6; margin-top: 12px; }
.neto-credential { display: flex; align-items: center; gap: 16px; padding-top: 35px; margin-top: 35px; border-top: 1px solid var(--border); color: var(--primary); width: 100%; }
.neto-credential > svg { color: var(--copper); flex-shrink: 0; }
.neto-credential strong, .neto-credential span { display: block; }
.neto-credential strong { font-size: 13px; font-family: var(--font-display); font-weight: 600; }
.neto-credential span { font-size: 11px; color: var(--muted-foreground); margin-top: 3px; }
.neto-copy h2 { margin-top: 0; }
.neto-copy > p { font-size: 14px; line-height: 1.9; color: var(--muted-foreground); margin-top: 22px; }
.neto-principle { padding-left: 22px; border-left: 2px solid var(--copper); margin-block: 28px 24px; }
.neto-principle > span { font-size: 10px; color: var(--muted-foreground); text-transform: uppercase; letter-spacing: .13em; }
.neto-principle p { font-family: var(--font-display); font-size: 20px; color: var(--primary); line-height: 1.5; margin-top: 10px; }
.neto-principle strong { font-weight: 600; }
.method-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 32px; }
.method-grid article { border-top: 1px solid var(--border); padding-top: 22px; }
.method-grid article > span { color: var(--copper); font-size: 25px; font-weight: 600; font-family: var(--font-display); }
.method-grid h3 { font-size: 17px; margin-top: 26px; font-weight: 600; }
.method-grid p { color: var(--muted-foreground); font-size: 13px; line-height: 1.9; margin-top: 13px; }
.identity-resources { padding-block: 75px; border-top: 1px solid var(--border); background: #FFFFFF; }
.resources-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 100px; align-items: center; }
.resource-links > a { display: flex; align-items: center; justify-content: space-between; gap: 24px; padding-block: 21px; border-bottom: 1px solid var(--border); color: var(--primary); }
.resource-links > a:first-child { padding-top: 0; }
.resource-links > a:hover strong { text-decoration: underline; }
.resource-links strong { display: block; font-family: var(--font-display); font-size: 19px; font-weight: 600; }
.resource-links small { display: block; color: var(--muted-foreground); font-size: 12px; margin-top: 5px; }
.identity-contact { background: var(--primary); padding-block: 78px; color: #FFFFFF; }
.contact-layout { display: grid; grid-template-columns: 1.2fr .8fr; gap: 80px; align-items: center; }
.identity-contact .identity-eyebrow { color: #FFFFFF; }
.identity-contact h2 { color: #FFFFFF; font-size: clamp(36px, 4vw, 55px); font-weight: 600; line-height: 1.13; margin-top: 24px; letter-spacing: -.04em; }
.contact-layout > div > p:last-child { color: #DAE2E4; max-width: 370px; font-size: 14px; margin-top: 22px; line-height: 1.8; }
.contact-action { display: flex; flex-direction: column; align-items: flex-start; }
.contact-button { display: inline-flex; align-items: center; gap: 20px; color: var(--primary); background: var(--background); padding: 17px 25px; font-family: var(--font-display); font-size: 15px; font-weight: 600; border-radius: 3px; }
.contact-button:hover { background: #FFFFFF; }
.contact-action > span { font-family: var(--font-display); font-size: 21px; margin-top: 25px; }
.contact-action > p { font-size: 12px; color: #DAE2E4; margin-top: 6px; }
.contact-action > a:last-child { display: inline-flex; align-items: center; gap: 10px; font-size: 12px; text-decoration: underline; margin-top: 13px; min-height: 44px; }
.identity-contact :focus-visible { outline-color: var(--copper); }
@media (max-width: 1100px) {
  .hero-layout { gap: 35px; }
  .hero-copy h1 { font-size: 48px; }
  .hero-actions { gap: 14px; }
  .hero-description { font-size: 14px; }
  .expertise-strip p { gap: 14px; font-size: 11px; }
  .neto-layout, .resources-layout { gap: 55px; }
  .area-row { grid-template-columns: 40px 1fr 1.2fr 40px; gap: 18px; }
}
@media (max-width: 767px) {
  .identity-container { padding-inline: 22px; }
  .identity-hero { padding-top: 36px; }
  .hero-layout { grid-template-columns: 1fr; gap: 30px; }
  .hero-copy { padding-bottom: 0; }
  .hero-copy h1 { font-size: clamp(39px, 7.6vw, 56px); margin-top: 23px; }
  .hero-last { display: inline; }
  .hero-description { font-size: 14px; line-height: 1.8; max-width: 500px; margin-top: 22px; }
  .identity-eyebrow { font-size: 9px; letter-spacing: .115em; gap: 9px; }
  .identity-eyebrow > span { width: 19px; }
  .hero-actions { margin-top: 25px; gap: 8px 22px; }
  .hero-actions .btn-neon { font-size: 13px; padding: 13px 18px; }
  .identity-text-link { font-size: 12px; }
  .hero-signature { margin-top: 22px; }
  .hero-photo { aspect-ratio: 1.35; }
  .hero-photo-note { padding: 16px 18px; font-size: 10px; }
  .expertise-strip { display: block; margin-top: 30px; padding: 24px 0; }
  .expertise-strip > span { display: none; }
  .expertise-strip p { font-size: 11px; gap: 8px 12px; line-height: 2; }
  .identity-section { padding-block: 64px; }
  .identity-section-heading { grid-template-columns: 1fr; gap: 18px; margin-bottom: 30px; }
  .identity-section h2, .identity-resources h2 { font-size: 29px; margin-top: 18px; }
  .identity-section-heading > p { max-width: 500px; font-size: 13px; }
  .area-row { grid-template-columns: 32px 1fr 33px; gap: 12px; padding-block: 24px; align-items: start; }
  .area-number { font-size: 22px; }
  .area-row h3 { font-size: 22px; align-self: center; }
  .area-row > div { grid-column: 2; grid-row: 2; }
  .area-row p { font-size: 12px; }
  .area-arrow { grid-column: 3; grid-row: 1; width: 32px; height: 32px; }
  .area-detail { font-size: 9px; margin-top: 8px; }
  .area-footnote { align-items: start; gap: 10px; flex-direction: column; margin-top: 22px; }
  .area-footnote p { font-size: 11px; }
  .neto-layout { grid-template-columns: 1fr; gap: 40px; }
  .neto-profile { padding-left: 24px; }
  .neto-name { font-size: 84px; margin-top: 20px; }
  .neto-role { font-size: 18px; margin-top: 0; }
  .neto-credential { margin-top: 24px; padding-top: 24px; }
  .neto-copy h2 { margin-top: 0; }
  .neto-copy > p { font-size: 13px; }
  .neto-principle p { font-size: 19px; }
  .method-grid { grid-template-columns: 1fr 1fr; gap: 30px 24px; }
  .method-grid h3 { margin-top: 18px; font-size: 16px; }
  .method-grid p { font-size: 12px; }
  .identity-resources { padding-block: 55px; }
  .resources-layout { grid-template-columns: 1fr; gap: 35px; }
  .resource-links strong { font-size: 18px; }
  .contact-layout { grid-template-columns: 1fr; gap: 34px; }
  .identity-contact { padding-block: 55px; }
  .identity-contact h2 { font-size: 40px; }
}
@media (max-width: 374px) {
  .identity-container { padding-inline: 18px; }
  .hero-copy h1 { font-size: 35px; }
  .hero-actions { gap: 5px; flex-direction: column; align-items: flex-start; }
  .area-row h3 { font-size: 19px; }
  .hero-photo-note { gap: 9px; padding: 14px 12px; }
}
'''
css.write_text(s, encoding='utf-8')

# Secondary pages share the light surfaces and updated institutional name.
for p in (root / 'src/routes').glob('*.tsx'):
    if p.name in {'servicos.tsx', 'energia.tsx', 'telecomunicacoes.tsx', 'index.tsx'}:
        continue
    t = p.read_text(encoding='utf-8').replace('VSB Segurança', 'VSB Soluções técnicas')
    t = t.replace('bg-graphite/60', 'bg-secondary/40').replace('bg-graphite', 'bg-secondary/40')
    t = t.replace('border-[#25d366]/45 bg-[#25d366]/10', 'border-primary/30 bg-primary/5').replace('text-[#5ee58d]', 'text-primary').replace('hover:bg-[#25d366] hover:text-[#062e17]', 'hover:bg-primary hover:text-primary-foreground')
    if p.name == '__root.tsx':
        t = t.replace('VSB — Segurança, Energia e Tecnologia', 'VSB · Soluções técnicas').replace('#0B1110', '#123B4A')
        t = t.replace('Instalação e manutenção de câmeras CFTV, portões automáticos, cercas elétricas, controle de acesso, fontes eletrônicas e bicicletas elétricas. Atendimento residencial, condominial e empresarial.', 'Elétrica, eletrônica, energia, telecomunicações e segurança eletrônica. Diagnóstico, instalação e manutenção com a experiência prática de Neto em Fortaleza e região metropolitana.')
        t = t.replace('Proteção que você vê. Tranquilidade que você sente. Câmeras, portões, cercas, fontes e bikes elétricas.', 'Conhecimento técnico para entender e resolver. Elétrica, eletrônica, energia, telecomunicações e segurança eletrônica.')
        t = t.replace('href: "/favicon.svg"', 'href: "/favicon.svg?v=20260911"')
        t = t.replace('absoluteUrl("/og-vsb.jpg")', 'absoluteUrl("/og-vsb-20260911.jpg")')
        t = t.replace('{ rel: "stylesheet", href: appCss },', '{ rel: "stylesheet", href: appCss },\n      { rel: "preload", as: "font", type: "font/woff2", href: "/fonts/manrope-latin-variable.woff2", crossOrigin: "anonymous" },')
    if p.name == 'contato.tsx':
        t = t.replace('servico: "Segurança eletrônica"', 'servico: "Diagnóstico técnico"')
        t = t.replace('"Segurança eletrônica",', '"Diagnóstico técnico",\n                      "Elétrica",\n                      "Eletrônica",\n                      "Energia",\n                      "Telecomunicações",\n                      "Segurança eletrônica",')
    p.write_text(t, encoding='utf-8')

cookie = root / 'src/components/site/CookieConsent.tsx'
t = cookie.read_text(encoding='utf-8').replace('rgba(0,0,0,.4)', 'rgba(18,59,74,.10)').replace('border border-border px-4', 'border border-input px-4')
cookie.write_text(t, encoding='utf-8')

# Keep illustrative imagery consistent on all pages using the older bench.
for p in (root / 'src/routes').glob('*.tsx'):
    t = p.read_text(encoding='utf-8')
    t = t.replace('@/assets/bench-electronics.webp', '@/assets/bench-institutional.webp')
    p.write_text(t, encoding='utf-8')
