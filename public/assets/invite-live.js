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
    MUS.el.src = MUS.el.canPlayType('audio/mp4; codecs="mp4a.40.2"') ? "/assets/audio/toi-music.m4a" : "/assets/audio/toi-music.webm";
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
    note: form.elements.note.value.trim(), website: form.elements.website.value
  };
  const btn = form.querySelector('button[type="submit"]'); btn.disabled = true;
  try {
    const r = await fetch(`/api/rsvp/${encodeURIComponent(inv.dataset.slug)}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    if (!r.ok) throw new Error(r.status);
    form.hidden = true; form.nextElementSibling.hidden = false;
    try { localStorage.setItem("toigo-rsvp-" + inv.dataset.slug, "1"); } catch (_) {}
  } catch (e) { err.textContent = err.dataset.fail; }
  finally { btn.disabled = false; }
}

let started = false;
export function startLive() {
  if (started) return; started = true;
  tick(); setInterval(tick, 1000);
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
