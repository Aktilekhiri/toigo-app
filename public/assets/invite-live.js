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

// Small komuz-like plucked melody made with WebAudio (no audio file needed).
const MUS = { on: false, ctx: null, timer: null, step: 0 };
const NOTES = [293.66, 349.23, 392, 440, 523.25, 587.33];
const PAT = [0, 2, 3, 2, 4, 3, 2, 1, 0, 2, 3, 5, 4, 3, 2, 0];
function pluck(f, at, vol = .16) {
  const c = MUS.ctx, o = c.createOscillator(), g = c.createGain(), fl = c.createBiquadFilter();
  o.type = "triangle"; o.frequency.value = f; fl.type = "lowpass"; fl.frequency.value = 2400;
  g.gain.setValueAtTime(.0001, at); g.gain.exponentialRampToValueAtTime(vol, at + .008); g.gain.exponentialRampToValueAtTime(.0001, at + 1.1);
  o.connect(fl).connect(g).connect(c.destination); o.start(at); o.stop(at + 1.2);
}
function toggleMusic() {
  try {
    if (!MUS.ctx) MUS.ctx = new (window.AudioContext || window.webkitAudioContext)();
    MUS.on = !MUS.on;
    if (MUS.on) {
      MUS.ctx.resume();
      MUS.timer = setInterval(() => {
        const t = MUS.ctx.currentTime + .02;
        pluck(NOTES[PAT[MUS.step % PAT.length]], t);
        if (MUS.step % 4 === 0) pluck(NOTES[0] / 2, t, .12);
        MUS.step++;
      }, 290);
    } else clearInterval(MUS.timer);
  } catch (e) { MUS.on = false; }
  document.querySelectorAll(".inv .mus").forEach(b => b.setAttribute("aria-pressed", String(MUS.on)));
}
export function stopMusic() { if (MUS.on) toggleMusic(); }
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
