(function () {
  const LANGS = [
    ["zh-CN", "简体中文"], ["zh-TW", "繁體中文"], ["en", "English"], ["ja", "日本語"], ["ko", "한국어"],
    ["ms", "Bahasa Melayu"], ["vi", "Tiếng Việt"], ["fr", "Français"], ["es", "Español"], ["de", "Deutsch"],
  ];
  const SUPPORTED = LANGS.map((l) => l[0]);
  const dict = {};
  const V = "__V__";
  let current = "en";
  const T0 = Date.now(); // anti-bot: page-load timestamp, sent with forms (server rejects fills under 2.5s)
  const CO = { enabled: false, mode: "test", ready: null };
  const ERR = { invalid_email: "err.invalid_email", required: "err.invalid_email", invalid_plan: "err.invalid_plan", too_fast: "err.too_fast", rate_limited: "err.rate_limited", stale: "err.stale", network: "err.network" };
  const ev = (name, props) => { try { window.ievt && window.ievt(name, props); } catch (_) {} };
  const intFlags = () => { let i = 0; try { const q = new URLSearchParams(location.search).get("internal"); i = q === "1" || (q !== "0" && localStorage.getItem("ievt_internal") === "1") ? 1 : 0; } catch (_) {} let wd = 0; try { wd = navigator.webdriver ? 1 : 0; } catch (_) {} return { internal: i, wd }; };
  const errText = (code) => tr(ERR[code] || "err.server", "Something went wrong. Please try again in a minute.");
  async function postJSON(url, body) {
    let r;
    try { r = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body), credentials: "same-origin" }); }
    catch (_) { return { ok: false, code: "network" }; }
    let d = null; try { d = await r.json(); } catch (_) {}
    return d && typeof d === "object" ? d : { ok: false, code: r.ok ? "server" : "server" };
  }

  function fromTag(tag) {
    const low = String(tag || "").toLowerCase();
    if (!low) return null;
    if (low.startsWith("zh")) return /hant|tw|hk|mo/.test(low) ? "zh-TW" : "zh-CN";
    const base = low.split("-")[0];
    if (base === "in" || base === "id") return null;
    return SUPPORTED.includes(base) ? base : null;
  }
  function fromTz() {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
      if (/Taipei|Hong_Kong|Macau/i.test(tz)) return "zh-TW";
      if (/Shanghai|Chongqing|Harbin|Urumqi/i.test(tz)) return "zh-CN";
      if (/Tokyo/i.test(tz)) return "ja";
      if (/Seoul/i.test(tz)) return "ko";
      if (/Kuala_Lumpur|Kuching/i.test(tz)) return "ms";
      if (/Ho_Chi_Minh|Saigon/i.test(tz)) return "vi";
      if (/Paris/i.test(tz)) return "fr";
      if (/Madrid|Mexico_City|Bogota|Buenos_Aires|Lima|Santiago/i.test(tz)) return "es";
      if (/Berlin|Vienna|Zurich/i.test(tz)) return "de";
    } catch (_) {}
    return null;
  }
  function detectLang() {
    try {
      const saved = localStorage.getItem("passgate-lang");
      if (saved && SUPPORTED.includes(saved)) return saved;
    } catch (_) {}
    const q = new URLSearchParams(location.search).get("lang");
    if (q && SUPPORTED.includes(q)) return q;
    for (const n of [...(navigator.languages || []), navigator.language || ""]) {
      const hit = fromTag(n);
      if (hit) return hit;
    }
    return fromTz() || "en";
  }

  function detectTheme() {
    try {
      const t = localStorage.getItem("passgate-theme");
      if (t === "light" || t === "dark") return t;
    } catch (_) {}
    return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  }

  async function loadDict(lang) {
    if (dict[lang]) return dict[lang];
    const res = await fetch(`/i18n/${lang}.json?v=${V}`);
    dict[lang] = await res.json();
    return dict[lang];
  }

  function apply(lang, d, en) {
    const t = (k) => (d[k] != null ? d[k] : en && en[k] != null ? en[k] : null);
    document.documentElement.lang = lang;
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const v = t(el.getAttribute("data-i18n"));
      if (v != null) el.textContent = v;
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
      const v = t(el.getAttribute("data-i18n-placeholder"));
      if (v != null) el.setAttribute("placeholder", v);
    });
    document.querySelectorAll("[data-i18n-aria]").forEach((el) => {
      const v = t(el.getAttribute("data-i18n-aria"));
      if (v != null) el.setAttribute("aria-label", v);
    });
    const sel = document.getElementById("lang-select");
    if (sel) { sel.value = lang; sel.setAttribute("aria-label", t("lang.label") || "Language"); }
    const title = document.querySelector("title");
    if (title && title.dataset.i18nTitle && t(title.dataset.i18nTitle)) {
      title.textContent = t(title.dataset.i18nTitle) + " · PassGate";
    }
  }

  async function setLang(lang, persist) {
    const [d, en] = await Promise.all([loadDict(lang), lang === "en" ? null : loadDict("en").catch(() => null)]);
    current = lang;
    apply(lang, d, en);
    if (persist) { try { localStorage.setItem("passgate-lang", lang); } catch (_) {} }
  }
  const tr = (k, fb) => (dict[current] && dict[current][k]) || (dict.en && dict.en[k]) || fb;

  function setTheme(theme) {
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem("passgate-theme", theme); } catch (_) {}
  }

  function wireLangSelect() {
    const sel = document.getElementById("lang-select");
    if (!sel) return;
    sel.innerHTML = LANGS.map(([v, n]) => `<option value="${v}" lang="${v}">${n}</option>`).join("");
    sel.addEventListener("change", (e) => setLang(e.target.value, true));
  }

  function wireModal() {
    const modal = document.getElementById("checkout-modal");
    const title = document.getElementById("modal-title");
    const msg = document.getElementById("modal-msg");
    const body = modal ? modal.querySelector('[data-i18n="modal.body"]') : null;
    let last = null;
    const open = (errCode) => {
      if (!modal) return;
      last = document.activeElement;
      if (errCode) {
        if (title) title.textContent = tr("co.error", "Checkout could not open.");
        if (body) body.hidden = true;
        if (msg) { msg.textContent = errCode === "checkout_error" ? tr("err.server", "") : errText(errCode); msg.hidden = false; }
      } else {
        if (title) title.textContent = tr("modal.title", "Checkout coming soon");
        if (body) body.hidden = false;
        if (msg) msg.hidden = true;
      }
      modal.hidden = false; document.getElementById("modal-close")?.focus();
    };
    const close = () => { if (modal) modal.hidden = true; last?.focus?.(); };
    async function start(btn) {
      if (btn.getAttribute("aria-busy") === "true") return;
      const label = btn.textContent;
      btn.setAttribute("aria-busy", "true"); btn.textContent = tr("co.opening", "Opening secure checkout…");
      const d = await postJSON("/api/checkout", { plan: btn.dataset.plan || "template", lang: current, t: T0, ...intFlags() });
      if (d.ok && d.url && /^https:\/\/([a-z0-9-]+\.)*creem\.io\//.test(d.url)) { location.assign(d.url); return; }
      btn.removeAttribute("aria-busy"); btn.textContent = label;
      if (d.code === "checkout_disabled") { CO.enabled = false; open(); return; }
      open(d.code || "server");
    }
    document.querySelectorAll("[data-checkout]").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        e.preventDefault();
        if (CO.ready) await CO.ready;
        // Tracking (fired here, not via data-evt, so convert{goal:checkout} carries the plan): one checkout_click + one convert per click.
        const plan = btn.dataset.plan || "template", p = CO.enabled ? { plan } : { plan, closed: "true" };
        ev("checkout_click", p); ev("convert", { goal: "checkout", ...p });
        if (CO.enabled) start(btn); else open();
      });
    });
    if (!modal) return;
    modal.addEventListener("click", (e) => { if (e.target === modal) close(); });
    document.getElementById("modal-close")?.addEventListener("click", close);
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !modal.hidden) close(); });
  }

  function loadCheckoutStatus() {
    CO.ready = fetch("/api/checkout/status", { credentials: "same-origin" }).then((r) => r.json()).then((d) => {
      CO.enabled = !!(d && d.enabled); CO.mode = (d && d.mode) || "test";
      if (!CO.enabled) return;
      const swap = { "hero.note": "live.note", "soon": "live.soon", "footer.soon": "live.footer" };
      document.querySelectorAll("[data-i18n]").forEach((el) => { const k = el.getAttribute("data-i18n"); if (swap[k]) el.setAttribute("data-i18n", swap[k]); });
      if (CO.mode !== "live") document.querySelectorAll('[data-i18n="live.note"]').forEach((el) => {
        const t = document.createElement(el.tagName === "P" ? "p" : "span"); t.className = el.className + " co-test"; t.setAttribute("data-i18n", "co.test"); el.after(t);
      });
      return setLang(current, false);
    }).catch(() => {});
  }

  function wireForm() {
    const form = document.getElementById("interest-form");
    if (!form) return;
    form.setAttribute("novalidate", "");
    const err = document.getElementById("form-err");
    const ok = document.getElementById("form-ok");
    const btn = form.querySelector('button[type="submit"]');
    const showErr = (code, field) => { ev("form_error", { form: "interest", field: field || "", reason: code }); showMsg(code); };
    const showMsg = (code) => { if (!err) return; err.textContent = errText(code); err.hidden = false; ok?.classList.remove("show"); };
    const EMAIL = /^[^\s@<>()"',;:]{1,64}@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$/;
    const emailEl = form.querySelector("#email");
    if (emailEl) emailEl.addEventListener("focus", () => ev("lead_form_start", { form: "interest" }), { once: true });
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (btn?.getAttribute("aria-busy") === "true") return;
      if (err) err.hidden = true;
      const data = Object.fromEntries(new FormData(form).entries());
      const email = String(data.email || "").trim();
      if (!EMAIL.test(email)) { showErr(email ? "invalid_email" : "required", "email"); form.querySelector("#email")?.focus(); return; }
      const label = btn ? btn.textContent : "";
      if (btn) { btn.setAttribute("aria-busy", "true"); btn.textContent = tr("form.sending", "Sending…"); }
      const d = await postJSON("/api/interest", { email, plan: data.plan, stack: data.stack || "", website: data.website || "", lang: current, t: T0, ...intFlags() });
      if (btn) { btn.removeAttribute("aria-busy"); btn.textContent = label; }
      if (!d.ok) { showErr(d.code || "server", d.code === "invalid_email" ? "email" : d.code === "invalid_plan" ? "plan" : ""); ev("lead_submit", { form: "interest", ok: false, reason: d.code || "server", plan: data.plan }); return; }
      ok?.classList.add("show");
      // lead_submit is the canonical interest event for stats; subscribe{source:interest} kept for /api/passgate funnel.
      // Server also writes both into ev on /api/interest success (reliable even if beacon drops).
      ev("lead_submit", { form: "interest", ok: true, plan: data.plan });
      ev("subscribe", { source: "interest", plan: data.plan });
      form.reset();
    });
  }

  async function wireSuccess() {
    const card = document.querySelector("[data-ok]");
    if (!card) return;
    const q = (a) => card.querySelector(a);
    let d = null;
    try { d = await (await fetch("/api/checkout/verify" + location.search, { credentials: "same-origin" })).json(); } catch (_) {}
    const okv = !!(d && d.verified);
    card.dataset.state = okv ? "ok" : "unverified";
    const title = q("[data-ok-title]"), body = q("[data-ok-body]");
    title.setAttribute("data-i18n", okv ? "ok.title" : "ok.unverified");
    if (!okv) { title.style.fontSize = "1.25rem"; }
    body.hidden = !okv;
    if (okv) {
      const p = new URLSearchParams(location.search);
      const planKey = { template: "tpl.form.plan.t", install: "tpl.form.plan.i", plus: "tpl.form.plan.p" }[d.plan];
      const pe = q("[data-ok-plan]"); if (planKey) pe.setAttribute("data-i18n", planKey); else pe.textContent = "—";
      q("[data-ok-ref]").textContent = p.get("order_id") || p.get("checkout_id") || "—";
      q("[data-ok-meta]").hidden = false;
      q("[data-ok-test]").hidden = d.mode === "live";
      // Funnel ping only. Conversion convert{goal:purchase} is written server-side by the Creem webhook
      // (or by /api/checkout/verify backup). Never fire purchase convert from the client — avoids double-count
      // and keeps test-mode purchases tagged internal/creem_test out of external metrics.
      ev("form_submit", { form: "checkout_success", plan: d.plan || "", mode: d.mode || "", paid: !!d.paid });
    }
    await setLang(current, false);
  }

  function wireCopy() {
    document.querySelectorAll(".code .copy").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const code = btn.closest(".code")?.querySelector("pre")?.innerText || "";
        try { await navigator.clipboard.writeText(code); } catch (_) {
          const ta = document.createElement("textarea"); ta.value = code; document.body.appendChild(ta); ta.select();
          try { document.execCommand("copy"); } catch (_) {} ta.remove();
        }
        btn.textContent = tr("tpl.copied", "Copied");
        btn.classList.add("done");
        setTimeout(() => { btn.textContent = tr("tpl.copy", "Copy"); btn.classList.remove("done"); }, 1600);
      });
    });
    document.querySelectorAll("[data-expand]").forEach((b) => {
      b.addEventListener("click", () => {
        const openAll = b.dataset.expand === "open";
        document.querySelectorAll(".files details").forEach((d) => (d.open = openAll));
      });
    });
  }

  function wireDemo() {
    const root = document.querySelector("[data-demo]");
    if (!root) return;
    const tabs = [...root.querySelectorAll("[data-step]")];
    const panels = [...root.querySelectorAll("[data-panel]")];
    const url = root.querySelector("[data-demo-url]");
    const urls = ["demo.passgate.local / sign-up", "demo.passgate.local / sign-up · passkey", "demo.passgate.local / settings / passkeys"];
    tabs.forEach((t, k) => {
      t.id = "demo-tab-" + k;
      if (panels[k]) { panels[k].id = "demo-panel-" + k; panels[k].setAttribute("role", "tabpanel"); panels[k].setAttribute("aria-labelledby", t.id); t.setAttribute("aria-controls", panels[k].id); }
    });
    let i = 0;
    const go = (n) => {
      i = (n + panels.length) % panels.length;
      tabs.forEach((t, k) => { t.setAttribute("aria-selected", String(k === i)); t.tabIndex = k === i ? 0 : -1; });
      panels.forEach((p, k) => { p.classList.toggle("is-on", k === i); p.toggleAttribute("inert", k !== i); });
      if (url) url.textContent = urls[i];
    };
    tabs.forEach((t, k) => t.addEventListener("click", () => go(k)));
    root.querySelector(".demo-steps")?.addEventListener("keydown", (e) => {
      if (e.key === "ArrowDown" || e.key === "ArrowRight") { e.preventDefault(); go(i + 1); tabs[i].focus(); }
      if (e.key === "ArrowUp" || e.key === "ArrowLeft") { e.preventDefault(); go(i - 1); tabs[i].focus(); }
    });
    root.querySelectorAll("[data-next]").forEach((b) => b.addEventListener("click", () => go(i + 1)));
    root.querySelectorAll("[data-restart]").forEach((b) => b.addEventListener("click", () => go(0)));
    go(0);
  }

  function wireSpecimen() {
    const spec = document.querySelector(".specimen");
    if (!spec) return;
    spec.addEventListener("pointermove", (e) => {
      const r = spec.getBoundingClientRect();
      spec.style.setProperty("--mx", ((e.clientX - r.left) / r.width) * 100 + "%");
      spec.style.setProperty("--my", ((e.clientY - r.top) / r.height) * 100 + "%");
    });
  }

  function wireNav() {
    const nav = document.querySelector(".nav");
    if (!nav) return;
    const onScroll = () => nav.classList.toggle("scrolled", window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  async function boot() {
    setTheme(detectTheme());
    wireLangSelect();
    await setLang(SUPPORTED.includes(window.__pgLang) ? window.__pgLang : detectLang(), false).catch(() => {});
    document.documentElement.classList.remove("i18n-wait");
    document.getElementById("theme-toggle")?.addEventListener("click", () => {
      setTheme(document.documentElement.dataset.theme === "light" ? "dark" : "light");
    });
    loadCheckoutStatus();
    wireModal();
    wireForm();
    wireSuccess();
    wireCopy();
    wireDemo();
    wireSpecimen();
    wireNav();
  }

  boot();
})();
