# PassGate rollback (2026-10-16 Creem work)
Live before this change: worker "passgate" version 502a50ed-a32d-4aa0-9f42-340e70698c37 (deployed 2026-10-15 12:06 ET), no bindings, no secrets.
Rollback: re-upload backups/worker.pre-creem-1016.mjs with metadata {main_module:"worker.js",compatibility_date:"2026-01-01"} (see deploy-v4.js), or roll back to that version id in the Cloudflare dashboard.
D1 tables added (pg_interest, pg_checkouts, pg_products, pg_purchases, pg_webhooks) live in incidental-stats D1 8fa9b2e9-...; they are additive and can be left in place.
