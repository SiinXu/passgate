# PassGate

Passkey migration pack marketing site — template ($49) or done-for-you install ($299 / $499).

- Live: https://passgate.incidental.site/ · template pack: https://passgate.incidental.site/template.html
- Free sample: https://passgate.incidental.site/samples/CHECKLIST.md
- Locales (10): zh-CN, zh-TW, en, ja, ko, ms, vi, fr, es, de — auto from saved choice → `?lang=` → browser languages → timezone → en
- Checkout: placeholder only — Creem not connected (「即将开通收款」). Interest form is stored in the visitor's localStorage only.
- Design notes: DESIGN_NOTES.md · Architecture: ARCHITECTURE.md

## Edit / build / deploy
- Copy lives in `tools/i18n_*.py` (zh-TW is generated from zh-CN with OpenCC s2twp + fixes). Run `python3 tools/build_i18n.py` to write `i18n/*.json`.
- Screenshots: `python3 tools/shoot.py <base-url> <out-dir> <lang>` (1440 + 390 × light + dark).
- Deploy: `node tools/mk_deploy.mjs` writes `cf_deploy_exec.js`; run it with the Cloudflare MCP `execute` tool. It uploads the `passgate` Worker (custom domain passgate.incidental.site).

Not a security audit. Independent product (not part of always-on-usage).
