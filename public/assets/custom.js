// Toigo — individual invitation order: brief + photos → Finik payment (400 som, includes a month of subscription).
import { session, authHeaders, renderLogin, onAuthChange } from "/assets/auth.js?v=mwclvb1t";
const CFG = JSON.parse(document.getElementById("i18n").textContent);
const T = CFG.t, LANG = CFG.lang;
const $ = s => document.querySelector(s);
const store = {
  get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
  del(k) { try { localStorage.removeItem(k); } catch {} }
};
const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const DEVICE = (() => {
  let v = store.get("toigo-dev");
  if (!/^[0-9a-f]{32}$/.test(v || "")) { v = [...crypto.getRandomValues(new Uint8Array(16))].map(x => x.toString(16).padStart(2, "0")).join(""); store.set("toigo-dev", v); }
  return v;
})();
const msg = t => { $("#c-msg").textContent = t || ""; };

// ---------- photos: compressed in the browser, up to 5 ----------
const photos = [];   // { blob, url }
async function compress(file) {
  const MAX = 1600;
  let src;
  try { src = await createImageBitmap(file, { imageOrientation: "from-image" }); }
  catch { src = await new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = URL.createObjectURL(file); }); }
  const w = src.width, h = src.height, k = Math.min(1, MAX / Math.max(w, h));
  const c = document.createElement("canvas"); c.width = Math.round(w * k); c.height = Math.round(h * k);
  c.getContext("2d").drawImage(src, 0, 0, c.width, c.height);
  return await new Promise(ok => c.toBlob(ok, "image/jpeg", 0.82));
}
function thumbs() {
  $("#c-thumbs").innerHTML = photos.map((p, n) => `<div><img src="${p.url}" alt=""><button type="button" data-rm="${n}" aria-label="×">×</button></div>`).join("");
}
$("#c-photos").addEventListener("change", async e => {
  const files = [...e.target.files]; e.target.value = ""; msg("");
  for (const f of files) {
    if (photos.length >= 5) { msg(T.photo_max); break; }
    try { const blob = await compress(f); if (blob.size > 4 << 20) { msg(T.photo_big); continue; } photos.push({ blob, url: URL.createObjectURL(blob) }); }
    catch { msg(T.photo_big); }
    thumbs();
  }
});
$("#c-thumbs").addEventListener("click", e => { const b = e.target.closest("[data-rm]"); if (!b) return; photos.splice(+b.dataset.rm, 1); thumbs(); });

// ---------- send the brief and go to Finik ----------
$("#cform").addEventListener("submit", async e => {
  e.preventDefault(); msg("");
  const fm = e.target, val = n => fm.elements[n].value.trim();
  if (val("names").length < 2) { msg(T.need_names); fm.elements.names.focus(); return; }
  if (val("contact").length < 3) { msg(T.need_contact); fm.elements.contact.focus(); return; }
  if (!session()) { showLogin(); return; }
  const btn = $("#c-send"); btn.disabled = true; msg(T.sending);
  try {
    const fd = new FormData();
    ["type", "ilang", "names", "date", "place", "style", "wishes", "contact"].forEach(n => fd.set(n, val(n)));
    fd.set("device", DEVICE); fd.set("lang", LANG); fd.set("key", store.get("toigo-key") || "");
    photos.forEach((p, i) => fd.append("photos", p.blob, `photo${i}.jpg`));
    const r = await fetch("/api/custom", { method: "POST", headers: authHeaders(), body: fd });
    if (r.status === 401) { btn.disabled = false; showLogin(); return; }
    const j = await r.json().catch(() => ({}));
    if (r.ok && j.url) { store.set("toigo-custom", { id: j.id, token: j.token }); location.href = j.url; return; }
    msg(r.status === 429 ? T.often : r.status === 503 ? T.off : r.status === 413 || r.status === 415 ? T.photo_big : j.error === "contact" ? T.need_contact : j.error === "names" ? T.need_names : T.err);
  } catch { msg(T.err); }
  btn.disabled = false;
});

function showLogin() {
  const b = $("#c-login"); b.hidden = false; msg(T.need_login);
  if (!b.dataset.on) { b.dataset.on = "1"; renderLogin(b, { title: T.login_h, text: T.login_p }); }
  b.scrollIntoView({ behavior: "smooth", block: "center" });
}
onAuthChange(() => { if (session()) { $("#c-login").hidden = true; msg(T.logged); } });

// ---------- return from Finik (?paid=ID&t=TOKEN) ----------
let tries = 0;
function done(text, key) {
  $("#cform").hidden = true; $("#c-done").hidden = false;
  $("#c-dmsg").textContent = text;
  if (key) { $("#c-keybox").hidden = false; $("#c-key").textContent = key; }
  $("#c-done").scrollIntoView({ behavior: "smooth", block: "start" });
}
async function poll() {
  const o = store.get("toigo-custom"); if (!o) return;
  $("#c-done").hidden = false; $("#c-dmsg").textContent = T.wait;
  try {
    const r = await fetch(`/api/order?id=${encodeURIComponent(o.id)}&token=${encodeURIComponent(o.token)}`);
    if (r.status === 404) { store.del("toigo-custom"); $("#c-done").hidden = true; return; }
    const j = await r.json();
    if (j.status === "approved") {
      store.del("toigo-custom");
      // keep a lifetime key if the person already has one; otherwise remember the gift key
      if (j.key && !store.get("toigo-key")) store.set("toigo-key", j.key);
      else if (j.key && store.get("toigo-key") === j.key) store.set("toigo-key", j.key);
      return done(T.ok, j.key);
    }
    if (["expired", "failed", "rejected"].includes(j.status)) { store.del("toigo-custom"); $("#c-dmsg").textContent = T.no; return; }
  } catch {}
  if (++tries < 120) setTimeout(poll, tries < 20 ? 3000 : 10000);
}
(() => {
  const q = new URLSearchParams(location.search), id = q.get("paid"), t = q.get("t");
  if (id && t) { store.set("toigo-custom", { id, token: t }); history.replaceState(null, "", location.pathname + "#order"); }
  if (store.get("toigo-custom")) poll();
})();
