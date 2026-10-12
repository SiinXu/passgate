# PassGate — DESIGN_NOTES

**Design Read:** B2B SaaS / indie-devtools landing for technical buyers who need WebAuthn fast — craft trust language (not AI purple), leaning toward Aceternity dark-stage specimens + shadcn Blocks restraint + Hover hard-shadow CTAs.

**Dials:** VARIANCE 7 · MOTION 5 · DENSITY 4  
**Mode:** Persuade (marketing) with Operate-grade clarity on In/Out and pricing.

**Anti-slop (taste-skill / frontend-design / impeccable):** No purple-blue mesh hero, no glass blobs, no Inter+slate default kit, no identical triple feature cards, no ALL-CAPS eyebrow spam, no Anthropic terracotta cream. One accent, one hero specimen, motion only on user action + one load beat.

---

## References (actual Read of ui-hub/previews)

### 1. Aceternity UI — `/workspace/ui-hub/previews/ui-aceternity-com.webp`
- **Library:** Aceternity UI  
- **Borrow:** Near-black stage `#0a0a0a` with faint grid; **white floating specimen cards** (auth/signup forms) as the hero object; soft card shadow `0 20px 50px rgba(0,0,0,.45)`; radius ~14–16px on specimens.  
- **Hex:** stage `#0a0a0a`, card `#ffffff`, ink `#0a0a0a`, muted `#71717a`, accent spark blue ~`#3b82f6` (we will substitute emerald).  
- **Motion:** spotlight / cursor-follow on stage (subtle).  
- **Fonts:** Clean grotesque display (we map → Space Grotesk).

### 2. Magic UI — `/workspace/ui-hub/previews/magicui-design.webp`
- **Library:** Magic UI  
- **Borrow:** Light grid “blueprint” mat `#f4f4f5` lines on `#ffffff`; centered stack with generous air; stack badge line under title.  
- **Hex:** bg `#ffffff`, grid `#e4e4e7`, text `#09090b`, sub `#71717a`.  
- **Radius:** minimal on light surfaces (~8px).  
- **Shadow:** almost none — depth via border `1px #e4e4e7`.  
- **Motion:** none on cover (static product truth).  
- **Use:** light theme tokens + template pack page calm.

### 3. Cult UI — `/workspace/ui-hub/previews/www-cult-ui-com.webp`
- **Library:** Cult UI  
- **Borrow:** Typographic hero dominance; cool gray paper `#e8e8ec`; huge single statement; CLI line as mono footer cue.  
- **Hex:** paper `#e8e8ec`–`#f4f4f5`, ink `#18181b`.  
- **Radius:** near 0 on editorial plane.  
- **Fonts:** Heavy sans display; mono CLI.  
- **Motion:** none — confidence through type.

### 4. Hover.dev — `/workspace/ui-hub/previews/www-hover-dev.webp`
- **Library:** Hover.dev  
- **Borrow:** Split hero (copy | specimen grid); **hard offset shadow** on primary CTA `4px 4px 0 #0a0a0a`; pill trust badge with hairline border; purple used there — **we refuse purple**, keep the shadow grammar.  
- **Hex (adapted):** CTA fill = emerald `#10b981`, text `#052e1c`, hard shadow `#052e1c`.  
- **Radius:** buttons ~8–10px; cards ~12px.  
- **Motion:** hover lift 1–2px with shadow stay (spring-ish).

### 5. React Bits Metallic Paint — `/workspace/ui-hub/previews/reactbits-dev-animations-metallic-paint.webp`
- **Library:** React Bits  
- **Borrow:** Chrome / mercury key motif for “passkey”; dark fabric stage; mono pixel-ish label for technical product name.  
- **Hex:** black `#050505`, chrome highlights `#e8e8e8` / `#9ca3af`.  
- **Radius:** specimen frame ~20–24px.  
- **Shadow:** soft vignette, not glow-for-glow.  
- **Motion:** chrome light-sweep across key glyph (CSS gradient animation, 6–8s, paused under `prefers-reduced-motion`).

### 6. Animata — `/workspace/ui-hub/previews/animata-design.webp`
- **Library:** Animata  
- **Borrow:** Flat geometric progression icons (clover → grid → chevrons → arrow) for **4-step “how it works”** without numbered AI markers unless sequential — here the flow *is* sequential. Mustard is too loud for security; we keep the **icon grammar**, recolor to ink/emerald.  
- **Hex (adapted):** icons `#fafafa` on `#0a0a0a` or emerald strokes.  
- **Motion:** staggered fade-in on scroll (one sequence only).

### 7. shadcn Blocks — `/workspace/ui-hub/previews/lib-ui-shadcn-com-blocks.webp`
- **Library:** shadcn/ui Blocks  
- **Borrow:** Black solid + outline dual CTA; pill “New” badge; dashboard-in-browser chrome for demo placeholder; hairline tabs.  
- **Hex:** `#ffffff` / `#09090b` / border `#e4e4e7`; radius buttons pill-ish 999 for badge, 8 for cards.  
- **Shadow:** soft `0 1px 2px rgba(0,0,0,.05)`.  
- **Fonts:** Geist-like → Space Grotesk / IBM Plex Sans.

### 8. Originkit — `/workspace/ui-hub/previews/originkit-dev.webp`
- **Library:** Originkit  
- **Borrow:** Dark bento of equal-radius cards for pricing + FAQ density; avoid particle aurora fills — use quiet mats.  
- **Hex:** stage `#000`, card `#111`, orange brand there → we skip orange.  
- **Radius:** ~16px uniform.  
- **Motion:** card border-beam only on featured $299 plan.

### 9. Beautiful UI — `/workspace/ui-hub/previews/beautiful-ui-five-vercel-app.webp`
- **Library:** Beautiful UI  
- **Borrow:** Numbered mono labels `01` only for true sequences (demo steps); charcoal mats `#0d0d0d`; blue accent → remap to emerald.  
- **Radius:** 10–12px.  
- **Motion:** pixel-grid / shimmer only inside demo placeholder (loading theatre).

### 10. Motion.dev — `/workspace/ui-hub/previews/lib-motion-dev.webp`
- **Library:** Motion  
- **Borrow:** High-contrast panel-on-panel; tight radius 2–4px technical feel for FAQ/code blocks; spring on expand.  
- **Hex:** black/white/yellow there — we take **contrast discipline**, not yellow fill.  
- **Motion:** spring accordion; `>` affordance on CTAs.

---

## PassGate token system

| Token | Dark | Light |
|------|------|-------|
| `--bg` | `#07080a` | `#f6f6f4` |
| `--surface` | `#101218` | `#ffffff` |
| `--mat` | `#161922` | `#ececea` |
| `--ink` | `#f4f4f5` | `#0a0a0a` |
| `--muted` | `#9ca3af` | `#5c5c56` |
| `--line` | `rgba(244,244,245,.10)` | `rgba(10,10,10,.10)` |
| `--accent` | `#34d399` (emerald) | `#059669` |
| `--accent-ink` | `#052e1c` | `#ffffff` |
| `--danger` | `#f87171` | `#dc2626` |
| `--chrome` | `#c7cdd8` | `#6b7280` |

**Radius scale:** 6 (chip) · 10 (button/input) · 14 (card) · 20 (specimen)  
**Shadow:** hard CTA `4px 4px 0 color-mix(in oklab, var(--ink) 85%, transparent)`; float `0 24px 60px rgba(0,0,0,.4)`  
**Type:** Display **Space Grotesk** 600–700; UI **IBM Plex Sans** 400–600; Mono **IBM Plex Mono** 11–13.  
**Motion vocabulary:** chrome-sweep (key), hard-shadow press, border-beam (featured price), spring FAQ, spotlight on specimen (pointer). Respect `prefers-reduced-motion`.

## Layout concept
```
[nav: mark | links | lang | theme | CTA]
[hero 7/5: copy+dual CTA | passkey specimen card]
[why-now: 3 tight reasons — not equal marketing fluff]
[demo: browser chrome + 30s placeholder]
[scope: In | Out two columns]
[pricing: 3 cards, $299 featured beam]
[stacks badges]
[FAQ accordion]
[disclaimer + final CTA]
[footer]
```
Template page: ZIP tree + order form placeholder (no live Creem).

## Non-goals
Purple AI mesh, Instrument Serif, paper-orange Carbon, fake payment success, claiming security audit.
