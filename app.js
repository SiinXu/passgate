(function () {
  const LANGS = [
    ["zh-CN", "简体中文"], ["zh-TW", "繁體中文"], ["en", "English"], ["ja", "日本語"], ["ko", "한국어"],
    ["ms", "Bahasa Melayu"], ["vi", "Tiếng Việt"], ["fr", "Français"], ["es", "Español"], ["de", "Deutsch"],
  ];
  const SUPPORTED = LANGS.map((l) => l[0]);
  const dict = {};
  let current = "en";

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
    const res = await fetch(`./i18n/${lang}.json`);
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
    if (!modal) return;
    let last = null;
    const open = () => { last = document.activeElement; modal.hidden = false; document.getElementById("modal-close")?.focus(); };
    const close = () => { modal.hidden = true; last?.focus?.(); };
    document.querySelectorAll("[data-checkout]").forEach((btn) => {
      btn.addEventListener("click", (e) => { e.preventDefault(); open(); });
    });
    modal.addEventListener("click", (e) => { if (e.target === modal) close(); });
    document.getElementById("modal-close")?.addEventListener("click", close);
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !modal.hidden) close(); });
  }

  function wireForm() {
    const form = document.getElementById("interest-form");
    if (!form) return;
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(form).entries());
      try {
        const prev = JSON.parse(localStorage.getItem("passgate-interest") || "[]");
        prev.push({ ...data, at: new Date().toISOString() });
        localStorage.setItem("passgate-interest", JSON.stringify(prev));
      } catch (_) {}
      document.getElementById("form-ok")?.classList.add("show");
      form.reset();
    });
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
    await setLang(detectLang(), false);
    document.getElementById("theme-toggle")?.addEventListener("click", () => {
      setTheme(document.documentElement.dataset.theme === "light" ? "dark" : "light");
    });
    wireModal();
    wireForm();
    wireCopy();
    wireDemo();
    wireSpecimen();
    wireNav();
  }

  boot();
})();
