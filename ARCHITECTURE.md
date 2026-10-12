# PassGate — short architecture

## Stack
Static multi-page site (no framework): `index.html`, `template.html`, `styles.css`, `app.js`, `i18n/{en,zh-CN}.json`.
Served as Cloudflare Worker asset map on `passgate.incidental.site`.

## Pages
1. **/** — Landing per biz-greenfield PassGate A1: hero, why-now, 30s demo placeholder, In/Out, pricing ($49/$299/$499), stack badges, FAQ, disclaimer, dual CTA.
2. **/template.html** — ZIP contents (Next.js WebAuthn, Supabase migration, Clerk notes, CHECKLIST 30, TEST_PLAN, LICENSE) + order form placeholder (email + plan). Creem buttons = 「即将开通收款」 / Coming soon.

## i18n
`data-i18n` keys; `localStorage.lang` override; else `navigator.languages` then timezone heuristic (Asia/Shanghai → zh-CN). zh-CN + en only for v1.

## CTAs
All purchase buttons open a modal: “收款即将开通 / Checkout coming soon” — no fake charge, no Creem link yet. Secondary “Book install” same modal with plan=install.

## DiagramDrop
Separate one-pager at `/workspace/diagramdrop/` — not linked from PassGate; own deploy optional later.
