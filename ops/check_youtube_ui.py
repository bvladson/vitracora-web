"""Isolated YouTube UI checks using synthetic feeds, thumbnails, and embed documents.

The production feed and real player are verified separately. No Google API key is used.
"""

import datetime
import json
import re
import sys
from pathlib import Path
from urllib.parse import urlsplit

from playwright.sync_api import sync_playwright

sys.stdout.reconfigure(encoding="utf-8")
ROOT = Path(__file__).parent
OUT = ROOT / "checks-youtube"
OUT.mkdir(exist_ok=True)
BASE = "https://vsbseguranca.com.br"
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 3307
CSP = re.search(
    r'add_header Content-Security-Policy "([^"]+)"',
    (ROOT / "site-youtube/deploy/nginx-vsb-live.conf").read_text(encoding="utf-8"),
).group(1)

TITLES = [
    "Teste de interface 1: diagnóstico e medições em bancada",
    "Teste de interface 2: conexões e alimentação de equipamentos",
    "Teste de interface 3: manutenção em sistemas de telecomunicações",
    "Teste de interface 4: título comprido para verificar o comportamento do card em telas pequenas",
]
VIDEOS = [
    {
        "id": f"VSBTEST000{index + 1}",
        "title": title,
        "thumbnail": f"https://i.ytimg.com/vi/VSBTEST000{index + 1}/hqdefault.jpg",
        "publishedAt": f"2026-09-{14 - index:02}T12:00:00Z",
        "url": f"https://www.youtube.com/watch?v=VSBTEST000{index + 1}",
    }
    for index, title in enumerate(TITLES)
]
FEED = {
    "videos": VIDEOS,
    "channel": {"id": "fixture-channel", "title": "Canal de teste", "url": BASE},
    "updatedAt": "2026-09-15T12:00:00Z",
}
REPORT = {
    "testedAt": datetime.datetime.now(datetime.timezone.utc).isoformat(),
    "mode": "isolated preview with synthetic four-video feed",
    "isolation": [
        "GET /api/youtube/videos uses synthetic fixture responses",
        "youtube-nocookie iframe documents and i.ytimg thumbnails are intercepted",
        "swg-basic.js returns empty JavaScript to exclude unrelated Google surveys",
        "no real player playback, API quota call, lead, or external message is performed",
    ],
    "checks": [],
    "screenshots": [],
    "errors": [],
    "csp": [],
}


def verify(condition, label):
    if not condition:
        raise AssertionError(label)
    REPORT["checks"].append(label)


with sync_playwright() as playwright:
    browser = playwright.chromium.launch(
        executable_path=r"C:\Program Files\Google\Chrome\Application\chrome.exe",
        headless=True,
    )
    context = browser.new_context(viewport={"width": 1440, "height": 1000})
    context.add_cookies(
        [
            {"name": name, "value": "rejected", "url": BASE, "secure": True}
            for name in ["vsb_cookie_consent_v2", "vsb_advertising_consent_v1"]
        ]
    )
    case = {"status": 200, "videos": VIDEOS}

    def preview(route):
        parsed = urlsplit(route.request.url)
        if parsed.path == "/api/youtube/videos":
            route.fulfill(
                status=case["status"],
                content_type="application/json",
                body=json.dumps({**FEED, "videos": case["videos"]}),
            )
            return
        response = route.fetch(
            url=f"http://127.0.0.1:{PORT}{parsed.path}"
            + ("?" + parsed.query if parsed.query else ""),
            max_redirects=0,
        )
        headers = dict(response.headers)
        if route.request.resource_type == "document":
            headers["content-security-policy"] = CSP
        route.fulfill(response=response, headers=headers)

    def thumbnail(route):
        match = re.search(r"VSBTEST000(\d)", route.request.url)
        label = match.group(1) if match else "?"
        svg = (
            '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360">'
            '<rect width="640" height="360" fill="#E5E7E6"/>'
            '<path d="M40 300H600M40 60H600" stroke="#C97941"/>'
            '<text x="320" y="185" text-anchor="middle" fill="#123B4A" '
            f'font-size="30" font-family="sans-serif">Thumbnail de teste {label}</text></svg>'
        )
        route.fulfill(status=200, content_type="image/svg+xml", body=svg)

    def embed(route):
        route.fulfill(
            status=200,
            content_type="text/html",
            body=(
                '<!doctype html><html lang="pt-BR"><head><title>Player de teste</title>'
                '<style>body{margin:0;background:#171A1C;color:#F5F3EE;display:grid;'
                'place-items:center;height:100vh;font:16px sans-serif}</style></head>'
                '<body><main>Player isolado de teste — sem reprodução</main></body></html>'
            ),
        )

    context.route(BASE + "/**", preview)
    context.route("https://www.youtube-nocookie.com/**", embed)
    context.route("https://i.ytimg.com/**", thumbnail)
    context.route(
        "https://news.google.com/swg/js/v1/swg-basic.js",
        lambda route: route.fulfill(status=200, content_type="application/javascript", body=""),
    )
    page = context.new_page()
    page.set_default_timeout(15_000)
    page.add_init_script(
        "document.addEventListener('securitypolicyviolation', e => "
        "console.error('YOUTUBE_UI_CSP '+e.effectiveDirective+' '+e.blockedURI));"
    )
    page.on("pageerror", lambda error: REPORT["errors"].append(str(error)))
    page.on(
        "console",
        lambda message: REPORT["csp"].append(message.text)
        if message.type == "error" and message.text.startswith("YOUTUBE_UI_CSP")
        else None,
    )

    try:
        verify(page.goto(BASE, wait_until="domcontentloaded").status == 200, "Preview responds 200")
        section = page.locator("#youtube")
        section.get_by_role("heading", level=3, name=TITLES[0], exact=True).wait_for()
        verify(
            section.evaluate(
                "e => e.previousElementSibling.classList.contains('identity-resources')"
                " && e.nextElementSibling.classList.contains('identity-contact')"
            ),
            "YouTube section is exactly between existing resources and contact sections",
        )
        verify(section.locator("iframe").count() == 0, "Iframe absent before approaching section")
        verify(section.locator(".youtube-video-card").count() == 3, "Four-video feed yields three cards")
        section.scroll_into_view_if_needed()
        frame = section.locator("iframe")
        frame.wait_for()
        verify(frame.count() == 1, "Only one iframe mounts near the viewport")
        verify(
            "VSBTEST0001" in frame.get_attribute("src") and "autoplay=0" in frame.get_attribute("src"),
            "Latest video is selected without autoplay",
        )
        verify(
            frame.get_attribute("loading") == "lazy"
            and frame.get_attribute("referrerpolicy") == "strict-origin-when-cross-origin"
            and frame.get_attribute("allowfullscreen") is not None,
            "Player has lazy loading, safe referrer policy, and fullscreen",
        )

        for index in [1, 2, 3, 0]:
            button = section.get_by_role("button", name=f"Selecionar vídeo: {TITLES[index]}", exact=True)
            button.click()
            page.wait_for_function(
                "id => document.querySelector('#youtube iframe').src.includes(id)",
                arg=VIDEOS[index]["id"],
            )
            verify(
                section.locator("iframe").count() == 1
                and section.locator(".youtube-video-card").count() == 3,
                f"Selection {index + 1}: one player and three alternate cards",
            )
            verify(
                page.evaluate("document.activeElement.textContent") == TITLES[index],
                f"Selection {index + 1}: focus moves to selected player heading",
            )

        page.emulate_media(reduced_motion="reduce")
        button = section.get_by_role("button", name=f"Selecionar vídeo: {TITLES[1]}", exact=True)
        button.focus()
        button.press("Enter")
        page.wait_for_function(
            "document.querySelector('#youtube iframe').src.includes('VSBTEST0002')"
        )
        verify(
            page.evaluate("document.activeElement.textContent") == TITLES[1],
            "Keyboard Enter selects video and focuses heading with reduced motion enabled",
        )

        card_title = section.locator(".youtube-video-card").get_by_role(
            "heading", name=TITLES[2], exact=True
        )
        card_title.scroll_into_view_if_needed()
        title_box = card_title.bounding_box()
        page.mouse.click(title_box["x"] + 10, title_box["y"] + title_box["height"] / 2)
        page.wait_for_function(
            "document.querySelector('#youtube iframe').src.includes('VSBTEST0003')"
        )
        verify(True, "Clicking the visible card title also selects the video")

        for width in [1440, 1366, 768, 390, 360]:
            page.set_viewport_size({"width": width, "height": 1000 if width > 768 else 844})
            section.scroll_into_view_if_needed()
            verify(
                page.evaluate("document.documentElement.scrollWidth <= innerWidth"),
                f"No document horizontal overflow at {width}px",
            )
            geometry = section.evaluate(
                "e => ({width:innerWidth, outside:[...e.querySelectorAll('*')]"
                ".filter(x=>{const r=x.getBoundingClientRect();return r.width>0&&(r.left < -1||r.right>innerWidth+1)})"
                ".map(x=>x.tagName+'.'+x.className),"
                "frame: (()=>{const r=e.querySelector('iframe').getBoundingClientRect();"
                "return {width:r.width,height:r.height}})()})"
            )
            REPORT.setdefault("geometry", []).append({"viewport": width, **geometry})
            if geometry["outside"]:
                section.screenshot(path=str(OUT / f"ui-overflow-{width}.png"), animations="disabled")
            verify(not geometry["outside"], f"All YouTube content remains inside viewport at {width}px")
            verify(
                geometry["frame"]["width"] >= 200 and geometry["frame"]["height"] >= 200,
                f"Player preserves YouTube minimum dimensions at {width}px",
            )
            if width in [1440, 390]:
                shot = OUT / f"ui-fixture-{width}.png"
                section.screenshot(path=str(shot), animations="disabled")
                REPORT["screenshots"].append(str(shot))

        page.add_script_tag(path=str(ROOT / "axe.min.js"))
        REPORT["axe"] = page.evaluate(
            "async () => (await axe.run(document.querySelector('#youtube'),"
            "{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']},"
            "rules:{'frame-tested':{enabled:false}}})).violations"
            ".map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.map(n=>n.target)}))"
        )
        verify(not REPORT["axe"], "YouTube section passes axe WCAG A/AA checks with fixture feed")

        for status, videos, label in [
            (200, VIDEOS[:1], "single real-sized feed"),
            (200, [], "empty feed"),
            (503, [], "failed endpoint"),
        ]:
            case.update(status=status, videos=videos)
            page.goto(BASE, wait_until="domcontentloaded")
            section = page.locator("#youtube")
            if videos:
                section.get_by_role("heading", name=TITLES[0], exact=True).wait_for()
                section.scroll_into_view_if_needed()
                section.locator("iframe").wait_for()
                verify(
                    section.locator("iframe").count() == 1
                    and section.locator(".youtube-video-card").count() == 0,
                    "Single-video feed shows one player and zero fabricated cards",
                )
            else:
                section.get_by_text("Confira nossos conteúdos no YouTube.", exact=True).wait_for()
                verify(
                    section.locator("iframe").count() == 0
                    and section.locator(".youtube-video-card").count() == 0,
                    f"{label}: friendly fallback without broken player/cards",
                )
            channel_link = section.get_by_role("link", name="Ver canal completo no YouTube", exact=True)
            verify(
                channel_link.get_attribute("href") == "https://www.youtube.com/@vsbseguranca"
                and channel_link.get_attribute("target") == "_blank"
                and set(channel_link.get_attribute("rel").split()) == {"noopener", "noreferrer"},
                f"{label}: channel link remains available and secure",
            )

        verify(not REPORT["errors"], "No unhandled page errors")
        verify(not REPORT["csp"], "No CSP violations in isolated UI contexts")
        REPORT["result"] = "PASS"
    except Exception as error:
        REPORT["result"] = "FAIL"
        REPORT["failure"] = str(error)
        raise
    finally:
        (OUT / "ui-fixtures.json").write_text(
            json.dumps(REPORT, ensure_ascii=False, indent=2), encoding="utf-8"
        )
        browser.close()

print(json.dumps(REPORT, ensure_ascii=False, indent=2))
