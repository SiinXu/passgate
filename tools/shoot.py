import sys, json, asyncio
from playwright.async_api import async_playwright
BASE = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8765"
OUT = sys.argv[2] if len(sys.argv) > 2 else "shots/v2"
LANG = sys.argv[3] if len(sys.argv) > 3 else "zh-CN"
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/usr/bin/google-chrome")
        report = {}
        for page_name, path in [("home", "/"), ("template", "/template.html")]:
            for vp, (w, h) in {"d": (1440, 900), "m": (390, 844)}.items():
                for theme in ["light", "dark"]:
                    ctx = await b.new_context(viewport={"width": w, "height": h}, device_scale_factor=1 if vp == "d" else 2, locale=LANG)
                    await ctx.add_init_script(f"localStorage.setItem('passgate-theme','{theme}');localStorage.setItem('passgate-lang','{LANG}')")
                    pg = await ctx.new_page()
                    errs = []
                    pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
                    pg.on("pageerror", lambda e: errs.append(str(e)))
                    await pg.goto(BASE + path, wait_until="networkidle")
                    await pg.wait_for_timeout(500)
                    if page_name == "template" and vp == "d":
                        await pg.click("[data-expand=open]")
                        await pg.wait_for_timeout(300)
                    m = await pg.evaluate("""() => ({sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth, h: document.documentElement.scrollHeight,
                      lang: document.documentElement.lang, empty: [...document.querySelectorAll('[data-i18n]')].filter(e=>!e.textContent.trim()).map(e=>e.dataset.i18n),
                      discW: (document.querySelector('.disc p')||{}).offsetWidth || null})""")
                    m["errors"] = errs
                    key = f"{page_name}-{vp}-{theme}"
                    report[key] = m
                    await pg.screenshot(path=f"{OUT}/{key}-fold.png")
                    await pg.screenshot(path=f"{OUT}/{key}.png", full_page=True)
                    await ctx.close()
        await b.close()
        print(json.dumps(report, ensure_ascii=False, indent=0))
asyncio.run(main())
