// Toigo — interactive parts of an invitation: countdown, music, RSVP, photo zoom.
// Works for the live page and for the constructor preview (mode="preview").

function tick() {
  const now = Date.now();
  document.querySelectorAll(".inv .cd").forEach(cd => {
    const ts = +cd.dataset.ts; if (!ts) return;
    let s = Math.floor((ts - now) / 1000);
    if (s <= 0) {
      if (!cd.classList.contains("over") && cd.closest('[data-mode="live"]')) { cd.classList.add("over"); cd.textContent = cd.dataset.past; }
      s = 0;
    }
    const v = { d: Math.floor(s / 86400), h: Math.floor(s % 86400 / 3600), m: Math.floor(s % 3600 / 60), s: s % 60 };
    cd.querySelectorAll("[data-u]").forEach(b => { b.textContent = v[b.dataset.u]; });
  });
}

// Background music: one shared <audio>, loaded only after the guest taps the music button.
const MUS = { on: false, el: null };
function toggleMusic() {
  if (!MUS.el) {
    MUS.el = new Audio();
    // AAC for Safari/iPhone, Opus for browsers without AAC.
    MUS.el.src = MUS.el.canPlayType('audio/mp4; codecs="mp4a.40.2"') ? "/assets/audio/toi-music-3.m4a" : "/assets/audio/toi-music-3.webm";
    MUS.el.loop = true; MUS.el.preload = "auto"; MUS.el.volume = 0.8;
    MUS.el.addEventListener("pause", () => sync(false));
    MUS.el.addEventListener("play", () => sync(true));
  }
  if (MUS.el.paused) MUS.el.play().catch(() => sync(false)); else MUS.el.pause();
}
function sync(on) {
  MUS.on = on;
  document.querySelectorAll(".inv .mus").forEach(b => b.setAttribute("aria-pressed", String(on)));
}
export function stopMusic() { if (MUS.el && !MUS.el.paused) MUS.el.pause(); }
export function musicOn() { return MUS.on; }

async function submitRsvp(form) {
  const inv = form.closest(".inv"), err = form.querySelector(".err");
  const name = form.elements.name.value.trim();
  err.textContent = "";
  if (!name) { err.textContent = err.dataset.err; form.elements.name.focus(); return; }
  if (inv.dataset.mode !== "live") { err.textContent = err.dataset.preview; return; }
  const att = form.querySelector('input[name="att"]:checked').value === "1";
  const body = {
    name, attending: att, guests: att ? Math.min(20, Math.max(1, +form.elements.guests.value || 1)) : 0,
    note: form.elements.note.value.trim(), website: form.elements.website.value, g: inv.dataset.guest || ""
  };
  const btn = form.querySelector('button[type="submit"]'); btn.disabled = true;
  try {
    const r = await fetch(`/api/rsvp/${encodeURIComponent(inv.dataset.slug)}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    if (!r.ok) throw new Error(r.status);
    form.hidden = true; form.nextElementSibling.hidden = false;
    try { localStorage.setItem("toigo-rsvp-" + inv.dataset.slug + (inv.dataset.guest ? "-" + inv.dataset.guest : ""), "1"); } catch (_) {}
  } catch (e) { err.textContent = err.dataset.fail; }
  finally { btn.disabled = false; }
}

// ---------- decorative animation per toi type ----------
// uylonuu: blue butterflies + petals · kyz: rose petals · sunnot: gold stars
// tushoo: rising bubbles · maarake: gold sparkles · tuulgan: confetti
const FX = {
  uylonuu: { n: 22, kinds: ["fly", "petal", "petal"], colors: ["#8EC5FF", "#B7DAFF", "#5E9EEA", "#DCEEFF"], dir: 1 },
  kyz:     { n: 24, kinds: ["petal"], colors: ["#F6B3C2", "#EC8AA0", "#F9D5DE", "#E8C27A"], dir: 1 },
  sunnot:  { n: 26, kinds: ["star"], colors: ["#F2C46B", "#FFE3A3", "#FFFFFF"], dir: 1 },
  tushoo:  { n: 18, kinds: ["bubble"], colors: ["#9CCBF0", "#FFFFFF", "#F7C58A"], dir: -1 },
  maarake: { n: 30, kinds: ["spark"], colors: ["#E2BE77", "#FFF0C8", "#C99A4B"], dir: -1 },
  tuulgan: { n: 34, kinds: ["confetti"], colors: ["#FF6B8B", "#FFC94A", "#4CC9F0", "#7BD389", "#B794F6"], dir: 1 }
};
const REDUCE = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
const fxList = new Set();
function newP(cfg, w, h, init) {
  const k = cfg.kinds[Math.floor(Math.random() * cfg.kinds.length)];
  return { k, c: cfg.colors[Math.floor(Math.random() * cfg.colors.length)],
    x: Math.random() * w, y: init ? Math.random() * h : (cfg.dir > 0 ? -20 : h + 20),
    s: k === "fly" ? 9 + Math.random() * 6 : k === "bubble" ? 6 + Math.random() * 10 : k === "spark" || k === "star" ? 1.5 + Math.random() * 2.5 : 5 + Math.random() * 5,
    vy: (0.25 + Math.random() * 0.5) * cfg.dir, vx: (Math.random() - 0.5) * 0.3,
    a: Math.random() * Math.PI * 2, va: (Math.random() - 0.5) * 0.04, ph: Math.random() * 6.28 };
}
function draw(c, p, t) {
  c.save(); c.translate(p.x, p.y); c.rotate(p.a); c.fillStyle = p.c; c.strokeStyle = p.c;
  if (p.k === "petal") { c.globalAlpha = 0.85; c.beginPath(); c.ellipse(0, 0, p.s, p.s * 0.55, 0, 0, 6.283); c.fill(); }
  else if (p.k === "fly") { const f = Math.abs(Math.sin(t * 6 + p.ph)) * 0.8 + 0.2; c.globalAlpha = 0.9;
    for (const sd of [-1, 1]) { c.save(); c.scale(sd * f, 1); c.beginPath(); c.ellipse(p.s * 0.55, -p.s * 0.25, p.s * 0.6, p.s * 0.45, 0.5, 0, 6.283); c.ellipse(p.s * 0.4, p.s * 0.35, p.s * 0.38, p.s * 0.3, -0.4, 0, 6.283); c.fill(); c.restore(); }
    c.globalAlpha = 1; c.fillStyle = "rgba(40,60,90,.6)"; c.fillRect(-0.8, -p.s * 0.5, 1.6, p.s); }
  else if (p.k === "star" || p.k === "spark") { c.globalAlpha = 0.45 + 0.55 * Math.abs(Math.sin(t * 2 + p.ph)); c.beginPath();
    for (let i = 0; i < 4; i++) { c.rotate(Math.PI / 2); c.moveTo(0, 0); c.quadraticCurveTo(p.s * 0.4, p.s * 0.4, 0, p.s * 3); }
    c.fill(); c.beginPath(); c.arc(0, 0, p.s * 0.7, 0, 6.283); c.fill(); }
  else if (p.k === "bubble") { c.globalAlpha = 0.5; c.lineWidth = 1.2; c.beginPath(); c.arc(0, 0, p.s, 0, 6.283); c.stroke(); c.globalAlpha = 0.25; c.fill(); }
  else { c.globalAlpha = 0.9; c.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); }
  c.restore();
}
function mountFx(inv) {
  inv.dataset.fxOn = "1";
  const cfg = FX[inv.dataset.fx]; if (!cfg || REDUCE) return;
  const cv = document.createElement("canvas"); cv.className = "fx"; cv.setAttribute("aria-hidden", "true");
  const live = inv.dataset.mode === "live";
  (live ? inv : inv.querySelector(".cv") || inv).appendChild(cv);
  const e = { inv, cv, cfg, ps: [], w: 0, h: 0, live };
  fxList.add(e);
}
function size(e) {
  const r = e.cv.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
  if (!r.width || !r.height) return false;
  if (Math.abs(r.width - e.w) > 1 || Math.abs(r.height - e.h) > 1) {
    e.w = r.width; e.h = r.height; e.cv.width = e.w * dpr; e.cv.height = e.h * dpr;
    e.cv.getContext("2d").setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = Math.round(e.cfg.n * Math.min(1.6, Math.max(0.6, e.w / 400)));
    e.ps = Array.from({ length: n }, () => newP(e.cfg, e.w, e.h, true));
  }
  return true;
}
let fxRunning = false;
function fxLoop(now) {
  const t = now / 1000;
  for (const e of fxList) {
    if (!e.cv.isConnected) { fxList.delete(e); continue; }
    if (document.hidden || !size(e)) continue;
    const c = e.cv.getContext("2d"); c.clearRect(0, 0, e.w, e.h);
    for (let i = 0; i < e.ps.length; i++) {
      const p = e.ps[i];
      p.y += p.vy; p.x += p.vx + Math.sin(t + p.ph) * 0.35; p.a += p.va;
      if (p.y > e.h + 30 || p.y < -30 || p.x < -30 || p.x > e.w + 30) { e.ps[i] = newP(e.cfg, e.w, e.h, false); continue; }
      draw(c, p, t);
    }
  }
  requestAnimationFrame(fxLoop);
}
function scanFx() {
  document.querySelectorAll(".inv[data-fx]:not([data-fx-on])").forEach(mountFx);
  if (!fxRunning && fxList.size) { fxRunning = true; requestAnimationFrame(fxLoop); }
}

let started = false;
export function startLive() {
  if (started) return; started = true;
  tick(); setInterval(tick, 1000);
  scanFx(); setInterval(scanFx, 400);
  document.addEventListener("click", e => {
    if (e.target.closest(".inv [data-act=music]")) { toggleMusic(); return; }
    const z = e.target.closest(".inv [data-act=zoom]");
    if (z) {
      const lb = document.createElement("div"); lb.className = "lb"; lb.tabIndex = -1;
      lb.innerHTML = `<img src="${z.src}" alt="">`;
      const close = () => lb.remove();
      lb.addEventListener("click", close); lb.addEventListener("keydown", ev => { if (ev.key === "Escape") close(); });
      document.body.appendChild(lb); lb.focus(); return;
    }
    const lb = e.target.closest(".lb"); if (lb) lb.remove();
  });
  document.addEventListener("change", e => {
    if (e.target.matches('.inv input[name="att"]')) {
      const f = e.target.closest("form"); const yes = f.querySelector('input[name="att"]:checked').value === "1";
      f.querySelector(".cntw").hidden = !yes;
    }
  });
  document.addEventListener("submit", e => { const f = e.target.closest(".inv form.rsvp"); if (f) { e.preventDefault(); submitRsvp(f); } });
}
export { tick };
