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

## v3 (2026-10-16) — server-side interest form + Creem checkout (test mode)
Source: `server/api.mjs` (inlined into worker.mjs by `tools/mk_deploy.mjs`; deploy snippet `deploy-creem.js`). Rollback: `backups/ROLLBACK.md`.
Bindings: `DB` = D1 incidental-stats (8fa9b2e9…), `CREEM_MODE`="test" (plain text), `keep_bindings: ["secret_text"]` so secrets survive redeploys.
Secrets (not set yet → checkout + webhook disabled gracefully): `CREEM_API_KEY`, `CREEM_WEBHOOK_SECRET`; optional `CREEM_PRODUCT_TEMPLATE|INSTALL|PLUS` to pin dashboard products (otherwise products are created via API on first checkout, Idempotency-Key `passgate-<plan>-<mode>-v1`, cached in `pg_products`).
Endpoints (same origin; POSTs require Origin=https://passgate.incidental.site and JSON):
- `POST /api/interest` {email, plan, stack, lang, t, website} → `pg_interest`. t = page-load timestamp (reject <2.5s or >48h), honeypot `website`, 5 per IP-hash per 10 min, same email+plan deduped for 10 min. Error codes → localized `err.*` keys.
- `GET /api/checkout/status` → {enabled, mode}. Client swaps "coming soon" copy to `live.*` when enabled; otherwise buttons open the old modal.
- `POST /api/checkout` {plan, lang, t} → creates Creem checkout (test-api.creem.io unless CREEM_MODE=live), success_url `/success/<lang>`, metadata {plan, lang, site}; row in `pg_checkouts`; 10 per IP-hash per 10 min.
- `GET /api/checkout/verify?<redirect params>` → verifies Creem redirect signature (sha256 of `k=v|…|salt=<api key>`).
- `POST /api/creem/webhook` → HMAC-SHA256(raw body, CREEM_WEBHOOK_SECRET) vs `creem-signature`; idempotent via `pg_webhooks`/`pg_purchases`; `checkout.completed` (paid) → `pg_purchases` + `ev` row site=passgate event=convert props.goal=purchase (test mode: internal=1, irule=creem_test); `refund.created`/`dispute.created` update status.
Pages: `/success/<lang>` (noindex, no-referrer) shows verified / unverified / test-mode states in 10 locales.
