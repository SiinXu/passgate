(function () {
  const SUPPORTED = ["zh-CN", "en"];
  const dict = { en: null, "zh-CN": null };

  function detectLang() {
    try {
      const saved = localStorage.getItem("passgate-lang");
      if (saved && SUPPORTED.includes(saved)) return saved;
    } catch (_) {}
    const navs = [...(navigator.languages || []), navigator.language || ""].map(String);
    for (const n of navs) {
      const low = n.toLowerCase();
      if (low.startsWith("zh")) return "zh-CN";
      if (low.startsWith("en")) return "en";
    }
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
      if (/Shanghai|Chongqing|Hong_Kong|Taipei|Macau|Urumqi/i.test(tz)) return "zh-CN";
    } catch (_) {}
    return "en";
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

  function apply(lang, d) {
    document.documentElement.lang = lang === "zh-CN" ? "zh-CN" : "en";
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const k = el.getAttribute("data-i18n");
      if (d[k] != null) el.textContent = d[k];
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
      const k = el.getAttribute("data-i18n-placeholder");
      if (d[k] != null) el.setAttribute("placeholder", d[k]);
    });
    document.querySelectorAll("[data-i18n-aria]").forEach((el) => {
      const k = el.getAttribute("data-i18n-aria");
      if (d[k] != null) el.setAttribute("aria-label", d[k]);
    });
    const sel = document.getElementById("lang-select");
    if (sel) sel.value = lang;
    const title = document.querySelector("title");
    if (title && title.dataset.i18nTitle && d[title.dataset.i18nTitle]) {
      title.textContent = d[title.dataset.i18nTitle] + " · PassGate";
    }
  }

  async function setLang(lang) {
    const d = await loadDict(lang);
    apply(lang, d);
    try { localStorage.setItem("passgate-lang", lang); } catch (_) {}
  }

  function setTheme(theme) {
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem("passgate-theme", theme); } catch (_) {}
    const btn = document.getElementById("theme-toggle");
    if (btn) btn.dataset.theme = theme;
  }

  function wireModal() {
    const modal = document.getElementById("checkout-modal");
    if (!modal) return;
    const open = () => { modal.hidden = false; document.getElementById("modal-close")?.focus(); };
    const close = () => { modal.hidden = true; };
    document.querySelectorAll("[data-checkout]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        open();
      });
    });
    modal.addEventListener("click", (e) => { if (e.target === modal) close(); });
    document.getElementById("modal-close")?.addEventListener("click", close);
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
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
      const ok = document.getElementById("form-ok");
      if (ok) ok.classList.add("show");
      form.reset();
    });
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
    const lang = detectLang();
    await setLang(lang);
    document.getElementById("lang-select")?.addEventListener("change", (e) => setLang(e.target.value));
    document.getElementById("theme-toggle")?.addEventListener("click", () => {
      const next = document.documentElement.dataset.theme === "light" ? "dark" : "light";
      setTheme(next);
    });
    wireModal();
    wireForm();
    wireSpecimen();
    wireNav();
  }

  boot();
})();
