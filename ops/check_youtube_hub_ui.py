"""Isolated regression checks for the VSB YouTube hub.

Run only against an available preview, using an SSH forward to its application
port: ``python check_youtube_hub_ui.py 13308``. Synthetic content is served only
inside the test browser. The real public API/player are verified separately.
"""

import datetime
import json
import re
import sys
from pathlib import Path
from urllib.parse import parse_qs, urlsplit

from playwright.sync_api import sync_playwright

sys.stdout.reconfigure(encoding="utf-8")
ROOT = Path(__file__).parent
OUT = ROOT / "checks-youtube-hub"
OUT.mkdir(exist_ok=True)
BASE = "https://vsbseguranca.com.br"
CHANNEL_URL = "https://www.youtube.com/@vsbseguranca"
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 13308
CSP = re.search(
    r'add_header Content-Security-Policy "([^"]+)"',
    (ROOT / "site-youtube-hub/deploy/nginx-vsb-live.conf").read_text(encoding="utf-8"),
).group(1)

# Class selectors are kept in one place so this script does not impose test-only
# attributes on the production interface.
SHORT_CARD = ".youtube-short-card"
SHORT_TRACK = ".youtube-shorts-track"
VIDEO_CARD = ".youtube-video-card"
MEDIA = ".youtube-thumbnail"
DIALOG = "dialog.youtube-dialog"
CLOSE = 'button[aria-label="Fechar vídeo"]'
SHORT_LINK = ".youtube-short-link"
VIDEO_LINK = ".youtube-video-link"
PREVIOUS = 'button[aria-label="Shorts anteriores"]'
NEXT = 'button[aria-label="Próximos Shorts"]'


def fixture_video(prefix, index, title):
    video_id = f"{prefix}{index:05}"
    assert len(video_id) == 11
    return {
        "id": video_id,
        "title": title,
        "thumbnail": f"https://i.ytimg.com/vi/{video_id}/maxresdefault.jpg",
        "publishedAt": f"2026-09-{16 - index:02}T12:00:00Z",
        "url": f"https://www.youtube.com/watch?v={video_id}",
    }


SHORTS = [
    fixture_video("SHRTST", index, f"Short de teste {index}: diagnóstico técnico em bancada")
    for index in range(1, 9)
]
FULL_VIDEOS = [
    fixture_video(
        "FULLST",
        index,
        "Vídeo completo de teste "
        + str(index)
        + ": diagnóstico, manutenção e medições de um sistema eletrônico",
    )
    for index in range(1, 5)
]
RECENT = fixture_video(
    "RECENT", 1, "Publicação de teste sem playlist: título com #Shorts não define formato"
)
CHANNEL = {
    "id": "UCu99Ykzuw_EWYXdX68K1ong",
    "title": "Canal sintético para testes de interface",
    "url": CHANNEL_URL,
}


def feed(shorts=None, full=None, recent=None):
    shorts = [] if shorts is None else shorts
    full = [] if full is None else full
    recent = [] if recent is None else recent
    return {
        "videos": [*shorts, *full, *recent],
        "shorts": shorts,
        "fullVideos": full,
        "recentVideos": recent,
        "channel": CHANNEL,
        "updatedAt": "2026-09-16T12:00:00Z",
    }


REPORT = {
    "testedAt": datetime.datetime.now(datetime.timezone.utc).isoformat(),
    "mode": "isolated preview with explicit playlist fixtures",
    "previewPort": PORT,
    "viewports": [1920, 1440, 1280, 1024, 768, 430, 390, 375],
    "isolation": [
        "The local preview is served under the production HTTPS origin with its CSP.",
        "The feed uses synthetic Shorts, full-video, uncategorized, empty and error cases.",
        "YouTube embed documents and thumbnail images are intercepted locally.",
        "Only swg-basic.js is replaced with empty JavaScript to exclude unrelated Google surveys.",
        "No real YouTube playback, API quota call, lead or external message is performed.",
        "Section-only screenshots hide unrelated fixed site chrome during capture; behavioral checks use the unmodified page.",
    ],
    "checks": [],
    "screenshots": [],
    "errors": [],
    "csp": [],
    "browserDataApiRequests": [],
    "geometry": [],
}


def verify(condition, label):
    if not condition:
        raise AssertionError(label)
    REPORT["checks"].append(label)


def ratio(rectangle, expected, tolerance=0.015):
    return rectangle and abs(rectangle["width"] / rectangle["height"] - expected) <= tolerance


def capture(page_or_locator, name):
    path = OUT / name
    page_or_locator.screenshot(path=str(path), animations="disabled",
                              style="header.fixed, .skip-link, a.fixed { visibility: hidden !important; }")
    REPORT["screenshots"].append(str(path))


def assert_dialog_open(page, video, viewport_label):
    dialog = page.locator(DIALOG)
    dialog.wait_for(state="visible")
    iframe = dialog.locator("iframe")
    iframe.wait_for()
    source = urlsplit(iframe.get_attribute("src"))
    verify(
        page.locator("iframe[src*='youtube-nocookie.com']").count() == 1,
        f"{viewport_label}: exactly one YouTube player mounts after the click",
    )
    verify(
        source.hostname == "www.youtube-nocookie.com"
        and source.path.endswith("/" + video["id"])
        and parse_qs(source.query).get("autoplay", ["0"]) == ["0"],
        f"{viewport_label}: requested video uses the privacy-enhanced player without autoplay",
    )
    verify(
        iframe.get_attribute("title")
        and iframe.get_attribute("referrerpolicy") == "strict-origin-when-cross-origin"
        and iframe.get_attribute("allowfullscreen") is not None,
        f"{viewport_label}: player includes a title, referrer policy and fullscreen support",
    )
    verify(
        dialog.get_by_role("heading", name=video["title"], exact=True).count() == 1,
        f"{viewport_label}: video title remains semantic HTML in the modal",
    )
    verify(
        dialog.evaluate("element => element.contains(document.activeElement)"),
        f"{viewport_label}: opening the modal moves keyboard focus inside",
    )
    verify(
        page.evaluate("getComputedStyle(document.body).overflow === 'hidden'"),
        f"{viewport_label}: background scrolling is locked while the modal is open",
    )
    bounds = dialog.bounding_box()
    viewport = page.viewport_size
    verify(
        bounds
        and bounds["x"] >= -1
        and bounds["y"] >= -1
        and bounds["x"] + bounds["width"] <= viewport["width"] + 1
        and bounds["y"] + bounds["height"] <= viewport["height"] + 1,
        f"{viewport_label}: modal fits inside the viewport",
    )
    frame_bounds = iframe.bounding_box()
    verify(
        frame_bounds["width"] >= 200 and frame_bounds["height"] >= 200,
        f"{viewport_label}: embedded player preserves the 200 by 200 minimum",
    )
    return dialog


def assert_dialog_closed(page, trigger, label):
    page.locator(DIALOG).wait_for(state="hidden")
    verify(
        page.locator("iframe[src*='youtube-nocookie.com']").count() == 0,
        f"{label}: closing the modal removes the player",
    )
    verify(
        page.evaluate("getComputedStyle(document.body).overflow !== 'hidden'"),
        f"{label}: closing the modal restores page scrolling",
    )
    verify(
        trigger.evaluate("element => document.activeElement === element"),
        f"{label}: closing the modal returns focus to its trigger",
    )


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
    case = {"status": 200, "feed": feed(SHORTS, FULL_VIDEOS), "badImages": False}

    def preview(route):
        parsed = urlsplit(route.request.url)
        if parsed.path == "/api/youtube/videos":
            route.fulfill(
                status=case["status"],
                content_type="application/json",
                body=json.dumps(case["feed"]),
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
        if case["badImages"]:
            route.fulfill(status=200, content_type="image/jpeg", body=b"fixture-invalid-image")
            return
        video_id = route.request.url.split("/vi/")[-1].split("/")[0]
        short = video_id.startswith("SHRTST")
        width, height = (360, 640) if short else (640, 360)
        svg = (
            f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}">'
            f'<rect width="{width}" height="{height}" fill="#244E5B"/>'
            f'<path d="M30 {height-55}H{width-30}M30 55H{width-30}" stroke="#E5E7E6" opacity=".4"/>'
            f'<text x="{width/2}" y="{height/2-15}" text-anchor="middle" fill="#F5F3EE" '
            f'font-size="20" font-family="sans-serif">Imagem de teste</text>'
            f'<text x="{width/2}" y="{height/2+20}" text-anchor="middle" fill="#F5F3EE" '
            f'font-size="16" font-family="sans-serif">{video_id}</text></svg>'
        )
        route.fulfill(status=200, content_type="image/svg+xml", body=svg)

    def embed(route):
        route.fulfill(
            status=200,
            content_type="text/html",
            body=(
                '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Player de teste</title>'
                '<style>body{margin:0;background:#171A1C;color:#F5F3EE;display:grid;'
                'place-items:center;height:100vh;font:16px sans-serif}'
                'button{padding:12px;background:#F5F3EE;color:#171A1C}</style></head>'
                '<body><main>Player isolado — sem reprodução '
                '<button type="button">Controle de teste</button></main></body></html>'
            ),
        )

    def install_routes(target_context):
        target_context.route(BASE + "/**", preview)
        target_context.route("https://www.youtube-nocookie.com/**", embed)
        target_context.route("https://i.ytimg.com/**", thumbnail)
        target_context.route(
            "https://news.google.com/swg/js/v1/swg-basic.js",
            lambda route: route.fulfill(
                status=200, content_type="application/javascript", body=""
            ),
        )

    install_routes(context)
    page = context.new_page()
    page.set_default_timeout(15_000)
    page.add_init_script(
        "document.addEventListener('securitypolicyviolation', e => "
        "console.error('YOUTUBE_HUB_CSP '+e.effectiveDirective+' '+e.blockedURI));"
    )
    page.on("pageerror", lambda error: REPORT["errors"].append(str(error)))
    page.on(
        "console",
        lambda message: REPORT["csp"].append(message.text)
        if message.type == "error" and message.text.startswith("YOUTUBE_HUB_CSP")
        else None,
    )
    page.on(
        "request",
        lambda request: REPORT["browserDataApiRequests"].append(request.url.split("?")[0])
        if "googleapis.com/youtube/v3" in request.url
        else None,
    )

    try:
        verify(page.goto(BASE, wait_until="domcontentloaded").status == 200, "Preview responds 200")
        section = page.locator("#youtube")
        section.locator(SHORT_LINK).first.wait_for()
        verify(
            section.evaluate(
                "e => e.previousElementSibling.classList.contains('identity-resources')"
                " && e.nextElementSibling.classList.contains('identity-contact')"
            ),
            "YouTube section stays between the existing resources and contact sections",
        )
        verify(
            section.locator(SHORT_CARD).count() == 8
            and section.locator(VIDEO_CARD).count() == 4,
            "Explicit playlist fixture displays eight Shorts and four full videos",
        )
        verify(
            page.locator("iframe[src*='youtube-nocookie.com']").count() == 0,
            "No YouTube iframe is created before the section approaches the viewport",
        )
        section.scroll_into_view_if_needed()
        verify(
            page.locator("iframe[src*='youtube-nocookie.com']").count() == 0,
            "Scrolling into the section still creates no YouTube iframe",
        )
        verify(
            section.get_by_role("heading", name="Shorts", exact=True).count() == 1
            and section.get_by_role("heading", name="Vídeos completos", exact=True).count() == 1,
            "Shorts and full videos have separate semantic headings",
        )
        verify(
            section.locator(SHORT_CARD).get_by_role("heading", name=SHORTS[0]["title"], exact=True).count() == 1
            and section.locator(VIDEO_CARD).get_by_role("heading", name=FULL_VIDEOS[0]["title"], exact=True).count() == 1,
            "Card titles are readable HTML rather than text embedded in thumbnails",
        )
        track = section.locator(SHORT_TRACK)
        verify(
            track.evaluate("element => getComputedStyle(element).scrollSnapType.includes('x')"),
            "Shorts use native horizontal CSS scroll snapping",
        )
        verify(
            track.evaluate("element => element.scrollWidth > element.clientWidth"),
            "The Shorts strip scrolls independently inside the page",
        )
        page.emulate_media(reduced_motion="reduce")
        next_button = section.locator(NEXT)
        previous_button = section.locator(PREVIOUS)
        verify(previous_button.is_disabled(), "Previous Shorts control is disabled at the beginning")
        next_button.focus()
        next_button.press("Enter")
        page.wait_for_function(
            "selector => document.querySelector(selector).scrollLeft > 0", arg=SHORT_TRACK
        )
        verify(True, "Keyboard Enter on the next control advances the Shorts strip")
        previous_button.click()
        page.wait_for_function(
            "selector => document.querySelector(selector).scrollLeft < 1", arg=SHORT_TRACK
        )
        verify(True, "Previous control returns the Shorts strip to its beginning")

        # The native horizontal area must also be reachable without pointer controls.
        last_short = section.locator(f'{SHORT_LINK}[href="{SHORTS[-1]["url"]}"]')
        last_short.focus()
        verify(
            track.evaluate("element => element.scrollLeft > 0")
            and last_short.evaluate("element => element === document.activeElement"),
            "Keyboard focus on a later Short scrolls that card into view",
        )

        trigger = section.locator(f'{SHORT_LINK}[href="{SHORTS[0]["url"]}"]')
        trigger.click()
        dialog = assert_dialog_open(page, SHORTS[0], "Desktop Short")
        dialog.locator(CLOSE).press("Shift+Tab")
        verify(dialog.locator(".youtube-dialog-caption a").evaluate("e => e === document.activeElement"), "Shift+Tab from close wraps to the final modal link")
        page.keyboard.press("Tab")
        verify(dialog.locator(CLOSE).evaluate("e => e === document.activeElement"), "Tab from the final modal link wraps to close")
        for index in range(12):
            page.keyboard.press("Tab")
            verify(
                dialog.evaluate("element => element.contains(document.activeElement)"),
                f"Modal keyboard focus remains inside after Tab {index + 1}",
            )
        dialog.locator(CLOSE).click()
        assert_dialog_closed(page, trigger, "Close button")

        full_trigger = section.locator(f'{VIDEO_LINK}[href="{FULL_VIDEOS[0]["url"]}"]')
        full_trigger.focus()
        full_trigger.press("Enter")
        dialog = assert_dialog_open(page, FULL_VIDEOS[0], "Desktop full video")
        dialog.locator(CLOSE).focus()
        page.keyboard.press("Escape")
        assert_dialog_closed(page, full_trigger, "Escape key")

        full_trigger.click()
        dialog = assert_dialog_open(page, FULL_VIDEOS[0], "Backdrop check")
        # The fixed overlay has generous surrounding space at this desktop viewport.
        page.mouse.click(4, 4)
        assert_dialog_closed(page, full_trigger, "Backdrop click")

        for width in REPORT["viewports"]:
            height = 1000 if width >= 1024 else 900 if width == 768 else 844
            page.set_viewport_size({"width": width, "height": height})
            track.evaluate("element => element.scrollLeft = 0")
            section.scroll_into_view_if_needed()
            verify(
                page.evaluate("document.documentElement.scrollWidth <= innerWidth"),
                f"No page horizontal overflow at {width}px",
            )
            geometry = section.evaluate(
                "(element, trackSelector) => ({viewport:innerWidth,"
                "outside:[...element.querySelectorAll('*')].filter(node => {"
                "if (node.closest(trackSelector) && !node.matches(trackSelector)) return false;"
                "const rect=node.getBoundingClientRect();"
                "const style=getComputedStyle(node);"
                "return style.visibility !== 'hidden' && rect.width>0 &&"
                "(rect.left < -1 || rect.right > innerWidth+1);"
                "}).map(node => node.tagName+'.'+node.className),"
                "track:(() => {const node=element.querySelector(trackSelector);"
                "return {clientWidth:node.clientWidth,scrollWidth:node.scrollWidth};})()})",
                SHORT_TRACK,
            )
            REPORT["geometry"].append(geometry)
            verify(
                not geometry["outside"],
                f"All visible hub content stays within {width}px except the intended inner carousel",
            )
            short_media = section.locator(SHORT_CARD).first.locator(MEDIA)
            full_media = section.locator(VIDEO_CARD).first.locator(MEDIA)
            verify(ratio(short_media.bounding_box(), 9 / 16), f"Shorts preserve 9:16 at {width}px")
            verify(ratio(full_media.bounding_box(), 16 / 9), f"Full-video thumbnails preserve 16:9 at {width}px")
            verify(
                section.locator(f"{SHORT_CARD} img, {VIDEO_CARD} img").evaluate_all(
                    "images => images.every(image => getComputedStyle(image).objectFit === 'cover')"
                ),
                f"Thumbnails use cover cropping without distortion at {width}px",
            )
            if width in [1440, 390]:
                capture(section, f"ui-fixture-{width}.png")
            full_trigger.click()
            dialog = assert_dialog_open(page, FULL_VIDEOS[0], f"{width}px modal")
            if width in [1440, 390]:
                capture(page, f"ui-modal-{width}.png")
            dialog.locator(CLOSE).click()
            assert_dialog_closed(page, full_trigger, f"{width}px close")

        page.set_viewport_size({"width": 1440, "height": 1000})
        page.add_script_tag(path=str(ROOT / "axe.min.js"))
        REPORT["axeSection"] = page.evaluate(
            "async () => (await axe.run(document.querySelector('#youtube'),"
            "{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}})).violations"
            ".map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))}))"
        )
        verify(not REPORT["axeSection"], "The populated hub passes axe WCAG A/AA checks")
        full_trigger.click()
        assert_dialog_open(page, FULL_VIDEOS[0], "Accessibility modal")
        REPORT["axeDialog"] = page.evaluate(
            "async selector => (await axe.run(document.querySelector(selector),"
            "{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']},"
            "rules:{'frame-tested':{enabled:false}}})).violations"
            ".map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))}))",
            DIALOG,
        )
        verify(not REPORT["axeDialog"], "The open video modal passes axe WCAG A/AA checks")
        page.locator(DIALOG).locator(CLOSE).click()

        for status, payload, label in [
            (200, feed(recent=[RECENT]), "uncategorized single publication"),
            (200, feed(), "empty feed"),
            (503, feed(), "failed endpoint"),
        ]:
            case.update(status=status, feed=payload, badImages=False)
            page.goto(BASE, wait_until="domcontentloaded")
            section = page.locator("#youtube")
            section.scroll_into_view_if_needed()
            if payload["recentVideos"]:
                section.get_by_role("heading", name=RECENT["title"], exact=True).wait_for()
                verify(
                    section.locator(SHORT_CARD).count() == 0,
                    "An unclassified title containing #Shorts is not placed in the Shorts strip",
                )
                verify(
                    section.get_by_role("heading", name="Últimas publicações", exact=True).count() == 1,
                    "Unclassified uploads use a neutral recent-publications heading",
                )
                verify(
                    section.locator(f'a[href="{RECENT["url"]}"]').count() == 1,
                    "The uncategorized publication appears once, without duplicated cards",
                )
                capture(section, "ui-uncategorized.png")
            else:
                section.locator("[aria-busy='true']").wait_for(state="hidden")
                verify(
                    section.locator(SHORT_CARD).count() == 0
                    and section.locator(VIDEO_CARD).count() == 0,
                    f"{label}: no fabricated or broken video cards",
                )
                verify(
                    not re.search(r"API|503|undefined|NaN|quota|playlist ID", section.inner_text()),
                    f"{label}: fallback avoids technical error details",
                )
            verify(
                page.locator("iframe[src*='youtube-nocookie.com']").count() == 0,
                f"{label}: fallback does not create a player automatically",
            )
            links = section.locator(f'a[href="{CHANNEL_URL}"]')
            verify(
                links.count() >= 1
                and links.evaluate_all(
                    "links => links.every(link => link.target === '_blank' && "
                    "link.relList.contains('noopener') && link.relList.contains('noreferrer'))"
                ),
                f"{label}: direct channel links remain available and secure",
            )

        case.update(status=200, feed=feed(SHORTS[:1], FULL_VIDEOS[:1]), badImages=True)
        page.goto(BASE, wait_until="domcontentloaded")
        section = page.locator("#youtube")
        section.locator(SHORT_LINK).wait_for()
        section.scroll_into_view_if_needed()
        page.wait_for_function(
            "selector => [...document.querySelectorAll(selector+' img')].every(image => "
            "image.complete && (image.naturalWidth > 0 || getComputedStyle(image).display === 'none' || "
            "getComputedStyle(image).visibility === 'hidden'))",
            arg="#youtube",
        )
        verify(
            section.get_by_role("heading", name=SHORTS[0]["title"], exact=True).count() == 1
            and section.get_by_role("heading", name=FULL_VIDEOS[0]["title"], exact=True).count() == 1,
            "Failed thumbnails preserve the card titles and accessible triggers",
        )
        trigger = section.locator(f'{SHORT_LINK}[href="{SHORTS[0]["url"]}"]')
        trigger.click()
        assert_dialog_open(page, SHORTS[0], "Unavailable thumbnail")
        page.locator(DIALOG).locator(CLOSE).click()
        assert_dialog_closed(page, trigger, "Unavailable thumbnail close")
        capture(section, "ui-thumbnails-unavailable.png")

        no_js_context = browser.new_context(java_script_enabled=False)
        install_routes(no_js_context)
        no_js_page = no_js_context.new_page()
        no_js_page.goto(BASE, wait_until="domcontentloaded")
        verify(
            no_js_page.locator(f'#youtube a[href="{CHANNEL_URL}"]').count() >= 1,
            "The server-rendered section retains a direct channel link without JavaScript",
        )
        no_js_context.unroute_all(behavior="ignoreErrors")
        no_js_context.close()

        verify(not REPORT["browserDataApiRequests"], "The browser makes no YouTube Data API requests")
        verify(not REPORT["errors"], "No unhandled browser JavaScript errors")
        verify(not REPORT["csp"], "No CSP violations in the isolated browser checks")
        REPORT["result"] = "PASS"
    except Exception as error:
        REPORT["result"] = "FAIL"
        REPORT["failure"] = str(error)
        try:
            capture(page, "ui-failure.png")
        except Exception:
            pass
        raise
    finally:
        (OUT / "ui.json").write_text(
            json.dumps(REPORT, ensure_ascii=False, indent=2), encoding="utf-8"
        )
        context.unroute_all(behavior="ignoreErrors")
        browser.close()

print(json.dumps(REPORT, ensure_ascii=False, indent=2))
