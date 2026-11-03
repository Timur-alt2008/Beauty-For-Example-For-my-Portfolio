#!/usr/bin/env python3
"""
Beauty Site Research Runner
===========================

Opens public beauty / spa / salon websites in a real browser (Playwright),
respects robots.txt, scrolls the page like a visitor so lazy content loads,
runs analyzer.js inside the page and stores:

  data/<host>.json          structured report (fonts, colours, layout, motion, components…)
  shots/<host>-desktop.png  1440×900 first screen
  shots/<host>-mobile.png   390×844 first screen

Usage:
  pip install playwright && playwright install chromium
  python3 run.py sites.txt            # one URL per line, # for comments
  python3 run.py https://example.com  # single URL

Rules the tool follows:
  * robots.txt is checked for every URL (user agent below); disallowed pages are skipped
  * no logins, no form submissions, no CAPTCHA solving, no bypassing bot protection
  * one page per site, polite delay between sites
  * images are only screenshotted for private study — never reused on the site
"""
import json
import sys
import time
import urllib.robotparser
from pathlib import Path
from urllib.parse import urlparse

from playwright.sync_api import sync_playwright

HERE = Path(__file__).parent
UA = "BeautyExampleResearchBot/1.0 (+portfolio design research; respects robots.txt)"
ANALYZER = (HERE / "analyzer.js").read_text(encoding="utf-8")
DATA, SHOTS = HERE / "data", HERE / "shots"


def allowed(url: str) -> bool:
    parts = urlparse(url)
    rp = urllib.robotparser.RobotFileParser(f"{parts.scheme}://{parts.netloc}/robots.txt")
    try:
        rp.read()
    except Exception:
        return True  # no robots.txt reachable → treat as allowed
    return rp.can_fetch(UA, url) and rp.can_fetch("*", url)


def scroll_through(page):
    page.evaluate(
        """async () => {
            const step = innerHeight * 0.8;
            for (let y = 0; y < document.body.scrollHeight; y += step) {
                window.scrollTo(0, y);
                await new Promise(r => setTimeout(r, 250));
            }
            window.scrollTo(0, 0);
            await new Promise(r => setTimeout(r, 600));
        }"""
    )


def analyse(url: str, browser):
    host = urlparse(url).netloc.replace("www.", "")
    if not allowed(url):
        print(f"  ✗ robots.txt disallows {url} — skipped")
        return None
    result = {}
    for name, vp, mobile in (("desktop", {"width": 1440, "height": 900}, False), ("mobile", {"width": 390, "height": 844}, True)):
        ctx = browser.new_context(viewport=vp, is_mobile=mobile, has_touch=mobile, user_agent=None if mobile else UA)
        page = ctx.new_page()
        try:
            page.goto(url, wait_until="domcontentloaded", timeout=45000)
            page.wait_for_timeout(2500)
            scroll_through(page)
            page.screenshot(path=str(SHOTS / f"{host}-{name}.png"))
            result[name] = page.evaluate(ANALYZER)
        except Exception as exc:  # timeouts, blocked pages, etc.
            result[name] = {"error": str(exc)[:200]}
        finally:
            ctx.close()
    (DATA / f"{host}.json").write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"  ✓ {host}")
    return result


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)
    arg = sys.argv[1]
    urls = [arg] if arg.startswith("http") else [
        line.strip() for line in Path(arg).read_text().splitlines() if line.strip() and not line.startswith("#")
    ]
    DATA.mkdir(exist_ok=True)
    SHOTS.mkdir(exist_ok=True)
    with sync_playwright() as p:
        browser = p.chromium.launch()
        for url in urls:
            print(f"→ {url}")
            analyse(url, browser)
            time.sleep(2)  # be polite
        browser.close()


if __name__ == "__main__":
    main()
