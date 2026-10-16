# 2026-10-16: /privacy /terms /refund in 10 locales + legal footer on every page + sitemap entries.
# Patches i18n/*.json in place (like i18n_creem.py). Idempotent.
import json, os, re, sys, html
sys.path.insert(0, os.path.dirname(__file__))
import opencc
from i18n_legal_en import EN
from i18n_legal_zh import ZH
from i18n_legal_jako import JA, KO
from i18n_legal_msvi import MS, VI
from i18n_legal_eu import FR, ES, DE
ROOT = os.path.join(os.path.dirname(__file__), "..")
os.chdir(ROOT)
cc = opencc.OpenCC("s2twp")
fix = {"合並":"合併","數字商品":"數位商品","服務端":"伺服器端","模板":"範本","這臺":"這台","郵箱":"電子郵件信箱","默認":"預設","代碼":"程式碼","項目":"專案","信息":"資訊","數據":"資料"}
def tw(s):
    s = cc.convert(s)
    for a, b in fix.items(): s = s.replace(a, b)
    return s
TW = {k: tw(v) for k, v in ZH.items()}
ALL = {"en":EN,"zh-CN":ZH,"zh-TW":TW,"ja":JA,"ko":KO,"ms":MS,"vi":VI,"fr":FR,"es":ES,"de":DE}
for code, d in ALL.items():
    miss = set(EN) ^ set(d); assert not miss, (code, miss)
HAN = re.compile(r"[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]")
for code in ("en","ko","ms","vi","fr","es","de"):
    bad = [k for k, v in ALL[code].items() if HAN.search(v)]; assert not bad, (code, bad)
for code, d in ALL.items():
    p = f"i18n/{code}.json"; j = json.load(open(p)); j.update(d)
    json.dump(j, open(p, "w"), ensure_ascii=False, indent=1)

PAGES = {
 "privacy": ("pv", [("s1",["p"]),("s2",["l1","l2","l3","l4"]),("s3",["p","p2"]),("s4",["l1","l2","l3","l4"]),("s5",["p"]),("s6",["p"]),("s7",["p"]),("s8",["p"])]),
 "terms":   ("tm", [("s1",["p"]),("s2",["l1","l2","l3","p"]),("s3",["p"]),("s4",["p"]),("s5",["p"]),("s6",["p"]),("s7",["p"])]),
 "refund":  ("rf", [("s1",["p"]),("s2",["l1","l2","l3"]),("s3",["p"]),("s4",["p"]),("s5",["p"])]),
}
LANGS = ["zh-CN","zh-TW","en","ja","ko","ms","vi","fr","es","de"]
BASE = "https://passgate.incidental.site"
FOOTER = '''<footer class="footer">
  <div class="wrap footer-inner">
    <div class="footer-meta">
      <span data-i18n="footer.tag">PassGate · passkey migration pack · independent product</span>
      <span data-i18n="footer.soon">Checkout opening soon · nothing is charged yet</span>
    </div>
    <nav class="footer-links" aria-label="Legal">
      <a href="/privacy" data-i18n="footer.privacy">Privacy</a>
      <a href="/terms" data-i18n="footer.terms">Terms</a>
      <a href="/refund" data-i18n="footer.refund">Refunds</a>
      <a href="mailto:support@incidental.site" data-evt="support_click">support@incidental.site</a>
    </nav>
  </div>
</footer>'''
e = lambda s: html.escape(s, quote=False)
succ = open("success.html").read()
head_start = succ[:succ.index("<title")]
head_start = head_start.replace('<meta name="robots" content="noindex, nofollow">\n', "").replace('<meta name="referrer" content="no-referrer">\n', "")
head_assets = succ[succ.index("</title>")+len("</title>\n"):succ.index("<script>")]
boot = succ[succ.index("<script>"):succ.index("</head>")]
# legal pages take language from ?lang= first (same as template.html), then saved/browser
boot = boot.replace('l=(location.pathname.match(/^\\/success\\/([A-Za-z-]{2,5})/)||[])[1]||null;', 'l=new URLSearchParams(location.search).get("lang");')
assert 'URLSearchParams(location.search).get("lang")' in boot
nav = succ[succ.index('<a class="skip"'):succ.index("<main")]
for page, (pfx, secs) in PAGES.items():
    alt = "".join(f'<link rel="alternate" hreflang="{l}" href="{BASE}/{page}?lang={l}">' for l in LANGS) + f'<link rel="alternate" hreflang="x-default" href="{BASE}/{page}">'
    out = [head_start,
      f'<meta name="description" content="{e(EN[pfx+".lede"])}">\n',
      f'<title data-i18n-title="{pfx}.title">{e(EN[pfx+".title"])} · PassGate</title>\n',
      f'<link rel="canonical" href="{BASE}/{page}">{alt}\n', head_assets, boot, "</head>\n<body>\n", nav,
      '<main id="main" class="wrap legal">\n  <article class="legal-doc">\n',
      f'    <a class="back" href="/" data-i18n="lg.back">{e(EN["lg.back"])}</a>\n',
      f'    <h1 data-i18n="{pfx}.title">{e(EN[pfx+".title"])}</h1>\n',
      f'    <p class="legal-updated" data-i18n="lg.updated">{e(EN["lg.updated"])}</p>\n',
      f'    <p class="legal-lede" data-i18n="{pfx}.lede">{e(EN[pfx+".lede"])}</p>\n']
    for s, items in secs:
        out.append(f'    <section>\n      <h2 data-i18n="{pfx}.{s}.t">{e(EN[f"{pfx}.{s}.t"])}</h2>\n')
        inlist = False
        for it in items:
            k = f"{pfx}.{s}.{it}"
            if it.startswith("l"):
                if not inlist: out.append("      <ul>\n"); inlist = True
                out.append(f'        <li data-i18n="{k}">{e(EN[k])}</li>\n')
            else:
                if inlist: out.append("      </ul>\n"); inlist = False
                out.append(f'      <p data-i18n="{k}">{e(EN[k])}</p>\n')
        if inlist: out.append("      </ul>\n")
        if page == "terms" and s == "s5": out.append('      <p><a href="/refund" data-i18n="footer.refund">Refunds</a></p>\n')
        out.append("    </section>\n")
    out.append(f'    <section class="legal-contact">\n      <h2 data-i18n="lg.contact.t">{e(EN["lg.contact.t"])}</h2>\n      <p data-i18n="lg.contact.d">{e(EN["lg.contact.d"])}</p>\n      <p><a class="btn btn-ghost" href="mailto:support@incidental.site" data-evt="support_click">support@incidental.site</a></p>\n    </section>\n')
    out.append("  </article>\n</main>\n" + FOOTER + '\n<script src="/app.js?v=__V__" defer></script>\n</body>\n</html>\n')
    open(f"{page}.html", "w").write("".join(out))

# footer on existing pages
for f in ("index.html", "template.html", "success.html"):
    s = open(f).read()
    s2 = re.sub(r'<footer class="footer">.*?</footer>', FOOTER.replace("\\", "\\\\"), s, count=1, flags=re.S)
    if f == "success.html": s2 = s2.replace('<span data-i18n="footer.soon">Checkout opening soon · nothing is charged yet</span>', '<span data-i18n="live.footer">Payments handled by Creem, our merchant of record</span>')
    open(f, "w").write(s2)

# sitemaps
for f in os.listdir("."):
    m = re.match(r"sitemap-(.+)\.xml$", f)
    if not m: continue
    s = open(f).read(); l = m.group(1)
    for page in PAGES:
        loc = f"{BASE}/{page}" + ("" if l == "default" else f"?lang={l}")
        if f"<loc>{loc}</loc>" not in s:
            s = s.replace("</urlset>", f"<url><loc>{loc}</loc><lastmod>2026-10-16</lastmod></url>\n</urlset>")
    open(f, "w").write(s)

CSS = '''
/* legal pages (2026-10-16) */
.legal { padding: 40px 0 72px; }
.legal-doc { max-width: 46rem; }
.legal-doc a.back { color: var(--muted); text-decoration: none; font-size: 13.5px; }
.legal-doc a.back:hover { color: var(--ink); }
.legal-doc h1 { font-family: var(--font-display); font-size: clamp(2rem, 4vw, 2.6rem); letter-spacing: -0.04em; margin: 14px 0 6px; }
.legal-updated { color: var(--muted); font-size: 13px; margin: 0 0 18px; }
.legal-lede { font-size: 1.06rem; margin: 0 0 8px; }
.legal-doc section { padding-top: 26px; border-top: 1px solid var(--line); margin-top: 26px; }
.legal-doc h2 { font-family: var(--font-display); font-size: 1.2rem; letter-spacing: -0.02em; margin: 0 0 10px; }
.legal-doc p, .legal-doc li { color: var(--muted); line-height: 1.65; }
.legal-doc p { margin: 0 0 12px; }
.legal-doc ul { margin: 0 0 12px; padding-left: 1.2em; }
.legal-doc li { margin-bottom: 6px; }
.legal-doc section a:not(.btn) { color: var(--accent); }
.footer-meta { display: flex; flex-direction: column; gap: 4px; }
.footer-links { display: flex; flex-wrap: wrap; gap: 6px 18px; align-items: center; }
.footer-links a { color: var(--muted); text-decoration: none; }
.footer-links a:hover, .footer-links a:focus-visible { color: var(--ink); text-decoration: underline; }
'''
css = open("styles.css").read()
if "/* legal pages (2026-10-16) */" not in css: open("styles.css", "a").write(CSS)
print("ok")
