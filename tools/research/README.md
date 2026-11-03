# Beauty site research tool

A small, real tool for studying how professional beauty / spa / salon websites are built.
It reports structure and design decisions — it does not copy content.

| File | What it does |
|---|---|
| `analyzer.js` | Runs inside a page; returns JSON: tech, booking vendor, typography, colours, navigation, hero media, sections, motion, beauty components, images. |
| `run.py` | Playwright runner: checks robots.txt, scrolls, saves `data/<host>.json` and desktop/mobile screenshots in `shots/`. |
| `run-in-browser.js` | Same analysis for a browser console or browser automation: checks robots.txt first, then runs the analyzer. |
| `sites.txt` | Sites studied in round 1. |
| `data/` | Saved results. |

```bash
pip install playwright && playwright install chromium
python3 run.py sites.txt
```

Rules it follows: robots.txt is respected; one public page per site; polite delay; no logins,
no form submissions, no CAPTCHA solving or bot-protection workarounds; screenshots are for private study only.
