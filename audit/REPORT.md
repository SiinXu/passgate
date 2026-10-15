# PassGate web-quality-audit — 2026-10-14

Lighthouse 13.5.0, headless Chrome, live https://passgate.incidental.site/ and /template.html; mobile = default (Moto G-class, slow 4G), desktop = `--preset=desktop`. Raw JSON: `audit/before/`, `audit/after/` (gitignored, kept on the box).

| Page | Before (Perf/A11y/BP/SEO/Agentic) | After (final run) |
|---|---|---|
| home mobile | 91 / 87 / 100 / 100 / 50 | 96 / 100 / 100 / 100 / 100 (first after-run: 99) |
| home desktop | 99 / 87 / 100 / 100 / 50 | 100 / 100 / 100 / 100 / 100 |
| template mobile | 89 / 95 / 100 / 100 / 96 | 97 / 100 / 100 / 100 / 100 (first after-run: 99) |
| template desktop | 98 / 95 / 100 / 100 / 99 | 99 / 100 / 100 / 100 / 100 |

Mobile FCP 2.8 s → 1.5–1.8 s, LCP 2.8 s → 2.0–2.4 s, CLS 0.095 (template) → 0.001.

## Fixed
- A11y/agentic: walkthrough tabs were `ol[role=tablist] > li > button[role=tab]` (aria-required-children/parent, listitem fail) → `div[role=tablist] > button[role=tab]`, panels get `role=tabpanel` + aria-controls/labelledby.
- A11y: heading order on template (h2 → h4) → h3 styled as before.
- A11y: contrast of red "Revoke" in light mock (4.08:1) → #b91c1c.
- Perf: render-blocking Google Fonts (≈1.2 s on mobile) → self-hosted woff2 (latin, latin-ext, vietnamese; OFL), 2 preloads, font-display swap.
- Perf: `app.js` now `defer`; CSS/JS/i18n URLs carry a content hash (`?v=`) and are served `immutable` for a year; fonts immutable.
- CLS: text was injected by JS into empty elements → every `data-i18n` element is pre-filled with English at source, language is detected in `<head>` and the locale JSON is preloaded; non-English visitors get a ≤1.5 s hidden-body guard instead of a flash of English.
- i18n: specimen "Email" label was hard-coded English → translated in 10 locales.

## Not fixed (not ours / by design)
- `cache-insight`: Cloudflare Web Analytics beacon (static.cloudflareinsights.com) 1-day TTL.
- `render-blocking-insight`: styles.css (8 KB, required for first paint).
