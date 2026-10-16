// PassGate server API (2026-10-16). Same-origin endpoints on the passgate worker.
// Bindings: DB (D1 incidental-stats, shared), CREEM_MODE (plain text: "test" | "live"),
// secrets CREEM_API_KEY / CREEM_WEBHOOK_SECRET (optional; checkout stays disabled without the API key),
// optional CREEM_PRODUCT_TEMPLATE / CREEM_PRODUCT_INSTALL / CREEM_PRODUCT_PLUS to pin dashboard products.
const ORIGIN = "https://passgate.incidental.site";
const LANGS = new Set(["zh-CN","zh-TW","en","ja","ko","ms","vi","fr","es","de"]);
const PLANS = {
  template: { price: 4900, name: "PassGate passkey template pack", desc: "Passkey (WebAuthn) template pack: Next.js example, Supabase migration, Clerk notes, 30-item go-live checklist, test plan, commercial license. Digital download." },
  install:  { price: 29900, name: "PassGate passkey install (done for you)", desc: "Fixed-fee passkey (WebAuthn) install into your existing app within a 48-hour delivery window, delivered as a pull request." },
  plus:     { price: 49900, name: "PassGate passkey install + handover notes", desc: "Done-for-you passkey (WebAuthn) install plus written handover notes and a review call. 48-hour delivery window." },
};
const EMAIL_RE = /^[^\s@<>()"',;:]{1,64}@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$/;
const MIN_FILL_MS = 2500, MAX_AGE_MS = 2 * 86400000, WIN = 10 * 60000;
const S = (v, n) => String(v ?? "").replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, n);
const J = (d, s = 200, h = {}) => new Response(JSON.stringify(d), { status: s, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "x-content-type-options": "nosniff", ...h } });
const day = (t = Date.now()) => new Date(t).toISOString().slice(0, 10);
const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
const sha256 = async (s) => hex(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)));
const mode = (env) => (env.CREEM_MODE === "live" ? "live" : "test");
const apiBase = (env) => (mode(env) === "live" ? "https://api.creem.io" : "https://test-api.creem.io");
function sameBytes(a, b) { if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false; let r = 0; for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i); return r === 0; }
function uaFamily(u) { u = S(u, 300); if (!u) return "unknown"; if (/bot|crawl|spider|slurp|headless|lighthouse|preview/i.test(u)) return "bot"; if (/Edg\//.test(u)) return "edge"; if (/OPR\//.test(u)) return "opera"; if (/Chrome\//.test(u)) return "chrome"; if (/Firefox\//.test(u)) return "firefox"; if (/Safari\//.test(u)) return "safari"; return "other"; }
function originOk(req, env) {
  const o = req.headers.get("Origin");
  if (o === ORIGIN) return true;
  if (env.DEV_ORIGIN && o === env.DEV_ORIGIN) return true;
  return false;
}
async function ipHash(req) { return (await sha256("pg|" + day() + "|" + (req.headers.get("CF-Connecting-IP") || "0"))).slice(0, 24); }
async function readJson(req, max = 4000) {
  const ct = req.headers.get("content-type") || "";
  if (!ct.includes("application/json")) throw "content_type";
  const t = await req.text(); if (t.length > max) throw "too_large";
  try { const b = JSON.parse(t || "{}"); if (!b || typeof b !== "object" || Array.isArray(b)) throw 0; return b; } catch { throw "bad_json"; }
}
function checkTiming(t) {
  const now = Date.now(), n = Number(t);
  if (!Number.isFinite(n) || n <= 0) return "stale";
  if (n > now + 60000 || now - n > MAX_AGE_MS) return "stale";
  if (now - n < MIN_FILL_MS) return "too_fast";
  return null;
}
// Client-declared internal traffic (?internal=1 → localStorage ievt_internal, same flag events.js uses) and webdriver.
function flags(b, extra) {
  const r = [];
  if (extra) r.push(extra);
  if (b && (b.internal === 1 || b.internal === "1" || b.internal === true)) r.push("internal_flag");
  if (b && (b.wd === 1 || b.wd === "1" || b.wd === true)) r.push("webdriver");
  return { internal: r.length ? 1 : 0, irule: r.join(",") };
}
let SCHEMA = false;
async function schema(env) {
  if (SCHEMA) return;
  await env.DB.batch([
    env.DB.prepare("CREATE TABLE IF NOT EXISTS pg_interest (id INTEGER PRIMARY KEY AUTOINCREMENT, ts INTEGER NOT NULL, email TEXT NOT NULL, plan TEXT, stack TEXT, lang TEXT, iph TEXT, country TEXT, ua TEXT)"),
    env.DB.prepare("CREATE INDEX IF NOT EXISTS pg_interest_iph ON pg_interest(iph, ts)"),
    env.DB.prepare("CREATE INDEX IF NOT EXISTS pg_interest_email ON pg_interest(email, ts)"),
    env.DB.prepare("CREATE TABLE IF NOT EXISTS pg_products (plan TEXT NOT NULL, mode TEXT NOT NULL, product_id TEXT NOT NULL, price INTEGER, ts INTEGER, PRIMARY KEY(plan, mode))"),
    env.DB.prepare("CREATE TABLE IF NOT EXISTS pg_checkouts (id TEXT PRIMARY KEY, ts INTEGER, plan TEXT, lang TEXT, mode TEXT, request_id TEXT, iph TEXT, country TEXT)"),
    env.DB.prepare("CREATE INDEX IF NOT EXISTS pg_checkouts_iph ON pg_checkouts(iph, ts)"),
    env.DB.prepare("CREATE TABLE IF NOT EXISTS pg_purchases (order_id TEXT PRIMARY KEY, checkout_id TEXT, product_id TEXT, plan TEXT, amount INTEGER, currency TEXT, email TEXT, customer_id TEXT, mode TEXT, status TEXT, lang TEXT, ts INTEGER, updated INTEGER)"),
    env.DB.prepare("CREATE INDEX IF NOT EXISTS pg_purchases_checkout ON pg_purchases(checkout_id)"),
    env.DB.prepare("CREATE TABLE IF NOT EXISTS pg_webhooks (id TEXT PRIMARY KEY, type TEXT, ts INTEGER, mode TEXT, ok INTEGER, note TEXT)"),
  ]);
  // internal flag, same semantics as ev: internal 0/1, irule "" when external, comma list of matched rules otherwise.
  for (const t of ["pg_interest", "pg_checkouts", "pg_purchases"]) for (const c of ["internal INTEGER DEFAULT 0", "irule TEXT DEFAULT ''"]) { try { await env.DB.prepare("ALTER TABLE " + t + " ADD COLUMN " + c).run(); } catch (e) {} }
  SCHEMA = true;
}

// ---------- POST /api/interest ----------
async function interest(req, env) {
  if (req.method !== "POST") return J({ ok: false, code: "method" }, 405);
  if (!originOk(req, env)) return J({ ok: false, code: "origin" }, 403);
  let b; try { b = await readJson(req); } catch (e) { return J({ ok: false, code: "bad_request" }, 400); }
  if (S(b.website, 200)) return J({ ok: true }); // honeypot: pretend success, store nothing
  const tm = checkTiming(b.t); if (tm) return J({ ok: false, code: tm }, tm === "too_fast" ? 429 : 400);
  const email = S(b.email, 254).toLowerCase();
  if (!EMAIL_RE.test(email)) return J({ ok: false, code: "invalid_email" }, 400);
  const plan = PLANS[b.plan] ? b.plan : null; if (!plan) return J({ ok: false, code: "invalid_plan" }, 400);
  const stack = S(b.stack, 120), lang = LANGS.has(b.lang) ? b.lang : "en";
  await schema(env);
  const now = Date.now(), iph = await ipHash(req);
  const ip = await env.DB.prepare("SELECT COUNT(*) n FROM pg_interest WHERE iph=? AND ts>?").bind(iph, now - WIN).first();
  if (ip && ip.n >= 5) return J({ ok: false, code: "rate_limited" }, 429, { "retry-after": "600" });
  const dup = await env.DB.prepare("SELECT id FROM pg_interest WHERE email=? AND plan=? AND ts>?").bind(email, plan, now - WIN).first();
  if (dup) return J({ ok: true, dup: true });
  const f = flags(b, uaFamily(req.headers.get("User-Agent")) === "bot" ? "bot_ua" : "");
  await env.DB.prepare("INSERT INTO pg_interest (ts,email,plan,stack,lang,iph,country,ua,internal,irule) VALUES (?,?,?,?,?,?,?,?,?,?)")
    .bind(now, email, plan, stack, lang, iph, (req.cf && req.cf.country) || "", uaFamily(req.headers.get("User-Agent")), f.internal, f.irule).run();
  return J({ ok: true });
}

// ---------- Creem helpers ----------
async function creem(env, method, path, body, extraHeaders = {}) {
  const r = await fetch(apiBase(env) + path, { method, headers: { "x-api-key": env.CREEM_API_KEY, "content-type": "application/json", ...extraHeaders }, body: body ? JSON.stringify(body) : undefined });
  let d = null; try { d = await r.json(); } catch {}
  if (!r.ok) throw new Error("creem " + path + " " + r.status + " " + JSON.stringify(d).slice(0, 300));
  return d;
}
async function productFor(env, plan) {
  const pinned = env["CREEM_PRODUCT_" + plan.toUpperCase()];
  if (pinned) return pinned;
  const m = mode(env);
  const row = await env.DB.prepare("SELECT product_id FROM pg_products WHERE plan=? AND mode=?").bind(plan, m).first();
  if (row) return row.product_id;
  const p = PLANS[plan];
  const d = await creem(env, "POST", "/v1/products", {
    name: p.name, description: p.desc, price: p.price, currency: "USD", billing_type: "onetime",
    tax_mode: "inclusive", tax_category: plan === "template" ? "digital-goods-service" : "saas",
    default_success_url: ORIGIN + "/success/en",
  }, { "Idempotency-Key": "passgate-" + plan + "-" + m + "-v1" });
  if (!d || !d.id) throw new Error("creem product: no id");
  await env.DB.prepare("INSERT OR REPLACE INTO pg_products (plan,mode,product_id,price,ts) VALUES (?,?,?,?,?)").bind(plan, m, d.id, p.price, Date.now()).run();
  return d.id;
}

// ---------- GET /api/checkout/status ----------
function status(env) { return J({ ok: true, enabled: !!env.CREEM_API_KEY, mode: mode(env) }); }

// ---------- POST /api/checkout ----------
async function checkout(req, env) {
  if (req.method !== "POST") return J({ ok: false, code: "method" }, 405);
  if (!originOk(req, env)) return J({ ok: false, code: "origin" }, 403);
  if (!env.CREEM_API_KEY) return J({ ok: false, code: "checkout_disabled" }, 503);
  let b; try { b = await readJson(req); } catch { return J({ ok: false, code: "bad_request" }, 400); }
  const plan = PLANS[b.plan] ? b.plan : null; if (!plan) return J({ ok: false, code: "invalid_plan" }, 400);
  const lang = LANGS.has(b.lang) ? b.lang : "en";
  const t = Number(b.t); if (!Number.isFinite(t) || t > Date.now() + 60000 || Date.now() - t > MAX_AGE_MS) return J({ ok: false, code: "stale" }, 400);
  if (Date.now() - t < 800) return J({ ok: false, code: "too_fast" }, 429);
  await schema(env);
  const iph = await ipHash(req), now = Date.now();
  const n = await env.DB.prepare("SELECT COUNT(*) n FROM pg_checkouts WHERE iph=? AND ts>?").bind(iph, now - WIN).first();
  if (n && n.n >= 10) return J({ ok: false, code: "rate_limited" }, 429, { "retry-after": "600" });
  const email = S(b.email, 254).toLowerCase();
  try {
    const product_id = await productFor(env, plan);
    const request_id = "pg_" + crypto.randomUUID();
    const f = flags(b, mode(env) === "live" ? "" : "creem_test");
    const body = { product_id, request_id, success_url: ORIGIN + "/success/" + lang, metadata: { plan, lang, site: "passgate", internal: f.irule.includes("internal_flag") || f.irule.includes("webdriver") ? "1" : "0" } };
    if (EMAIL_RE.test(email)) body.customer = { email };
    const d = await creem(env, "POST", "/v1/checkouts", body);
    if (!d || !d.checkout_url) throw new Error("creem checkout: no url");
    await env.DB.prepare("INSERT OR IGNORE INTO pg_checkouts (id,ts,plan,lang,mode,request_id,iph,country,internal,irule) VALUES (?,?,?,?,?,?,?,?,?,?)")
      .bind(S(d.id, 80) || request_id, now, plan, lang, mode(env), request_id, iph, (req.cf && req.cf.country) || "", f.internal, f.irule).run();
    return J({ ok: true, url: d.checkout_url, mode: mode(env) });
  } catch (e) {
    console.error("checkout", String(e && e.message || e));
    return J({ ok: false, code: "checkout_error" }, 502);
  }
}

// ---------- GET /api/checkout/verify?<creem redirect params> ----------
async function verify(req, env) {
  const url = new URL(req.url);
  const pairs = [...url.searchParams.entries()];
  const sig = url.searchParams.get("signature") || "";
  const checkout_id = S(url.searchParams.get("checkout_id"), 80);
  let verified = false;
  if (env.CREEM_API_KEY && sig && checkout_id) {
    const data = pairs.filter(([k, v]) => k !== "signature" && v !== "").map(([k, v]) => k + "=" + v).concat("salt=" + env.CREEM_API_KEY).join("|");
    verified = sameBytes(await sha256(data), sig);
  }
  let plan = null, paid = false;
  if (verified) {
    await schema(env);
    const c = await env.DB.prepare("SELECT plan FROM pg_checkouts WHERE id=?").bind(checkout_id).first();
    const p = await env.DB.prepare("SELECT plan,status FROM pg_purchases WHERE checkout_id=?").bind(checkout_id).first();
    plan = (p && p.plan) || (c && c.plan) || null; paid = !!(p && p.status === "paid");
  }
  return J({ ok: true, verified, plan, paid, mode: mode(env) });
}

// ---------- POST /api/creem/webhook ----------
async function hmacHex(secret, body) {
  const k = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return hex(await crypto.subtle.sign("HMAC", k, new TextEncoder().encode(body)));
}
async function webhook(req, env) {
  if (req.method !== "POST") return J({ ok: false }, 405);
  if (!env.CREEM_WEBHOOK_SECRET) return J({ ok: false, code: "webhook_disabled" }, 503);
  const raw = await req.text();
  if (raw.length > 256000) return J({ ok: false }, 413);
  const sig = (req.headers.get("creem-signature") || "").trim().toLowerCase();
  if (!sig || !sameBytes(await hmacHex(env.CREEM_WEBHOOK_SECRET, raw), sig)) return J({ ok: false, code: "bad_signature" }, 401);
  let ev; try { ev = JSON.parse(raw); } catch { return J({ ok: false, code: "bad_json" }, 400); }
  await schema(env);
  const id = S(ev.id, 80), type = S(ev.eventType, 60), o = ev.object || {}, now = Date.now(), m = mode(env);
  if (!id) return J({ ok: false, code: "no_id" }, 400);
  const seen = await env.DB.prepare("SELECT id FROM pg_webhooks WHERE id=?").bind(id).first();
  if (seen) return J({ ok: true, duplicate: true });
  const res = await handleEvent(env, type, o, now, m);
  await env.DB.prepare("INSERT OR IGNORE INTO pg_webhooks (id,type,ts,mode,ok,note) VALUES (?,?,?,?,1,?)").bind(id, type, now, S(o.mode, 16) || m, S(res.note, 80)).run();
  return J({ ok: true, ...res });
}
async function handleEvent(env, type, o, now, m) {
  if (type === "checkout.completed") {
    const order = o.order || {}, product = o.product || {}, cust = o.customer || {}, md = o.metadata || {};
    if (order.status && order.status !== "paid") return { note: "ignored status " + order.status };
    const plan = PLANS[md.plan] ? md.plan : Object.keys(PLANS).find((k) => PLANS[k].price === product.price) || "unknown";
    const lang = LANGS.has(md.lang) ? md.lang : "";
    const orderId = S(order.id, 80) || S(o.id, 80);
    const test = m !== "live" || /test|sandbox|local/i.test(String(o.mode || ""));
    const rules = [test ? "creem_test" : "", md.internal === "1" ? "internal_flag" : ""].filter(Boolean);
    const internal = rules.length ? 1 : 0, irule = rules.join(",");
    const ins = await env.DB.prepare("INSERT OR IGNORE INTO pg_purchases (order_id,checkout_id,product_id,plan,amount,currency,email,customer_id,mode,status,lang,ts,updated,internal,irule) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)")
      .bind(orderId, S(o.id, 80), S(product.id || order.product, 80), plan, Number(order.amount_paid ?? order.amount) || 0, S(order.currency, 8), S(cust.email, 254).toLowerCase(), S(cust.id || order.customer, 80), S(o.mode, 16) || m, "paid", lang, now, now, internal, irule).run();
    if (ins.meta && ins.meta.changes > 0) {
      const props = JSON.stringify({ goal: "purchase", plan, amount: Number(order.amount_paid ?? order.amount) || 0, currency: S(order.currency, 8), mode: test ? "test" : "live", source: "creem_webhook" });
      await env.DB.prepare("INSERT INTO ev (ts,day,site,event,path,lang,props,country,ua,ref,src,med,camp,internal,irule) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)")
        .bind(now, day(now), "passgate", "convert", "/api/creem/webhook", lang, props, S(cust.country, 4), "server", "creem.io", "", "", "", internal, irule).run();
      return { note: "recorded" };
    }
    return { note: "already recorded" };
  }
  if (type === "refund.created" || type === "dispute.created") {
    const orderId = S((o.order && o.order.id) || (o.transaction && o.transaction.order), 80);
    if (orderId) await env.DB.prepare("UPDATE pg_purchases SET status=?, updated=? WHERE order_id=?").bind(type === "refund.created" ? "refunded" : "disputed", now, orderId).run();
    return { note: type };
  }
  return { note: "ignored " + type };
}

export async function api(req, env, p) {
  try {
    if (p === "/api/interest") return await interest(req, env);
    if (p === "/api/checkout/status") return status(env);
    if (p === "/api/checkout") return await checkout(req, env);
    if (p === "/api/checkout/verify") return await verify(req, env);
    if (p === "/api/creem/webhook") return await webhook(req, env);
    return J({ ok: false, code: "not_found" }, 404);
  } catch (e) {
    console.error("api", p, String(e && e.stack || e));
    return J({ ok: false, code: "server" }, 500);
  }
}
