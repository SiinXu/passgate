# PassGate — short architecture

## Stack
Static multi-page site (no framework): `index.html`, `template.html`, `styles.css`, `app.js`, `i18n/<10 locales>.json`, `samples/CHECKLIST.md`.
Served as Cloudflare Worker asset map on `passgate.incidental.site`.

## Pages
1. **/** — Landing per biz-greenfield PassGate A1: hero, why-now, 30s demo placeholder, In/Out, pricing ($49/$299/$499), stack badges, FAQ, disclaimer, dual CTA.
2. **/template.html** — ZIP contents (Next.js WebAuthn, Supabase migration, Clerk notes, CHECKLIST 30, TEST_PLAN, LICENSE) + order form placeholder (email + plan). Creem buttons = 「即将开通收款」 / Coming soon.

## i18n
`data-i18n` keys; `localStorage.passgate-lang` override → `?lang=` → `navigator.languages` → timezone heuristic → en. 10 locales (zh-CN, zh-TW, en, ja, ko, ms, vi, fr, es, de); missing keys fall back to en.

## CTAs
All purchase buttons open a modal: “收款即将开通 / Checkout coming soon” — no fake charge, no Creem link yet. Secondary “Book install” same modal with plan=install.

## DiagramDrop
Separate one-pager at `/workspace/diagramdrop/` — not linked from PassGate; own deploy optional later.

## v2 (2026-10-14, review fixes)
- Home: interactive 3-step walkthrough (tabs + simulated screens, clearly labelled simulated); disclaimer capped at 72ch; footer fully translated; featured badge says "Recommended" (no unbacked "most booked" claim).
- Template page: 6 expandable file entries (purpose, bullets, real code excerpt with copy button, HTML-rendered illustrative screen / test matrix); version + date strip; big "stored only in this browser" notice; compatibility table; license can/cannot summary; delivery & refunds; FAQ; changelog; free CHECKLIST.md sample; sticky form + at-a-glance side.
