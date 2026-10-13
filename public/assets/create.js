// Toigo — invitation constructor.
import { DEFAULTS, TYPES, TYPE_TEXT, TPL, TRACKS, trackFile, clean, renderInvitation, titleOf, esc } from "/assets/invite-core.js?v=mv6br3vk";
import { startLive, tick, stopMusic, setTrack } from "/assets/invite-live.js?v=mv6br3vk";

const CFG = JSON.parse(document.getElementById("i18n").textContent);
const S = CFG.ui, LANG = CFG.lang;
const $ = s => document.querySelector(s);
const form = $("#form"), preview = $("#preview");

const RU_DEFAULTS = {
  lang: "ru", hosts: "Семья Асановых", venue: "Тойкана «Шумкар»", addr: "Бишкек, проспект Чүй, 150",
  msg: "Дорогие родные и друзья! Мы хотим разделить с вами самый важный день нашей жизни.",
  prog: "17:00 — Встреча гостей\n18:00 — Никах\n19:00 — Начало тоя\n23:00 — Завершение"
};
const store = {
  get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
  del(k) { try { localStorage.removeItem(k); } catch {} }
};

let d = { ...DEFAULTS, ...(LANG === "ru" ? RU_DEFAULTS : {}) };

// Sample texts follow the type and language until the person edits them.
const HOSTS = { ky: DEFAULTS.hosts, ru: RU_DEFAULTS.hosts };
const isSample = (f, v) => !v || Object.values(TYPE_TEXT).some(o => o.ky[f] === v || o.ru[f] === v || (f === "msg" && (o.ky.msgs.includes(v) || o.ru.msgs.includes(v))));
// Best design per toi type; used when the current design does not fit the new type.
const PREF = { uylonuu: "silk", kyz: "kjibek", sunnot: "emerald", tushoo: "steps", maarake: "golden", tuulgan: "pop" };
const fits = (tpl, type) => (TPL.find(t => t.id === tpl) || { types: [] }).types.includes(type);
function applyType(type) {
  const prev = d.type;
  d.type = type;
  if (!fits(d.tpl, type) || d.tpl === PREF[prev]) d.tpl = PREF[type];
  const L = d.lang === "ru" ? "ru" : "ky", t = TYPE_TEXT[type][L];
  ["n1", "n2", "msg", "prog"].forEach(f => { if (isSample(f, d[f])) d[f] = t[f]; });
  if (!d.hosts || Object.values(HOSTS).includes(d.hosts)) d.hosts = HOSTS[L];
}
applyType("uylonuu");
let edit = null;                 // { slug, key } when editing
const local = new Map();         // photo id -> blob URL (just uploaded)
let uploading = 0;

// ---------- start: edit mode, draft, or query params ----------
const hash = location.hash.slice(1);
const m = /^edit=([a-z0-9-]+)\.([a-z0-9]+)$/.exec(hash);
const params = new URLSearchParams(location.search);

async function init() {
  if (m) {
    edit = { slug: m[1], key: m[2] };
    $("#ch1").textContent = S.edit_h1; $("#save").textContent = S.update;
    try {
      const r = await fetch(`/api/invitations/${edit.slug}`, { headers: { "x-edit-key": edit.key } });
      if (!r.ok) throw 0;
      d = clean((await r.json()).data);
    } catch { $("#form-msg").textContent = S.load_fail; edit = null; }
  } else {
    const draft = store.get("toigo-draft-" + LANG);
    if (draft && draft.n1) d = clean({ ...d, ...draft });
    const qt = params.get("type"), qp = params.get("tpl"), qtpl = TPL.find(t => t.id === qp);
    if (TYPES[qt]) applyType(qt);
    else if (qtpl && !qtpl.types.includes(d.type)) applyType(qtpl.types[0]);
    if (qtpl && qtpl.types.includes(d.type)) d.tpl = qp;
    d = clean(d);
  }
  fill(); render();
}

// ---------- form <-> data ----------
const TEXT = ["n1", "n2", "hosts", "date", "time", "venue", "addr", "hall", "age", "msg", "prog", "dress", "dl", "phone"];
function fill() {
  form.elements.type.value = d.type;
  const tpl = form.querySelector(`input[name=tpl][value="${d.tpl}"]`); if (tpl) tpl.checked = true;
  const lg = form.querySelector(`input[name=lang][value="${d.lang}"]`); if (lg) lg.checked = true;
  TEXT.forEach(k => { form.elements[k].value = d[k] || ""; });
  form.elements.music.checked = d.music;
  form.elements.track.value = d.track || "komuz";
  $("#w-track").hidden = !d.music;
  form.elements.fx.checked = d.fx !== false;
  names(); thumbs();
}
function tplFilter() {
  let first = null, ok = false;
  form.querySelectorAll(".tplpick label[data-types]").forEach(l => {
    const on = l.dataset.types.split(" ").includes(d.type);
    l.hidden = !on;
    if (on) { first = first || l.querySelector("input").value; if (l.querySelector("input").value === d.tpl) ok = true; }
  });
  if (!ok && first) { d.tpl = PREF[d.type] && fits(PREF[d.type], d.type) ? PREF[d.type] : first; const r = form.querySelector(`input[name=tpl][value="${d.tpl}"]`); if (r) r.checked = true; }
}
function names() {
  $("#w-age").hidden = !(d.type === "maarake" || d.type === "tuulgan");
  tplFilter();
  const map = { pair: S.n_pair, kyz: S.n_kyz, child: S.n_child, jub: S.n_jub, bday: S.n_bday };
  const pair = d.type === "uylonuu";
  $("#lab-n1").textContent = map[TYPES[d.type].names];
  $("#w-n2").hidden = !pair;
  $("#w-n1").classList.toggle("w", !pair);
}
const photoUrl = id => local.get(id) || `/media/${id}`;

function render() {
  const st = preview.scrollTop;
  const keep = {}; ["rn", "rc", "rt"].forEach(k => { const i = document.getElementById(`pv-${k}`); if (i) keep[k] = i.value; });
  const musicWasOn = preview.querySelector('.mus[aria-pressed="true"]');
  preview.innerHTML = renderInvitation(d, { mode: "preview", pf: "pv", photoUrl });
  preview.scrollTop = st;
  Object.entries(keep).forEach(([k, v]) => { const i = document.getElementById(`pv-${k}`); if (i) i.value = v; });
  if (musicWasOn) { const b = preview.querySelector(".mus"); if (b) b.setAttribute("aria-pressed", "true"); else stopMusic(); }
  tick();
}

let draftT = null;
function changed() {
  render();
  if (!edit) { clearTimeout(draftT); draftT = setTimeout(() => store.set("toigo-draft-" + LANG, d), 400); }
}

form.addEventListener("click", e => {
  const b = e.target.closest("[data-ready]"); if (!b) return;
  const L = d.lang === "ru" ? "ru" : "ky";
  d.msg = TYPE_TEXT[d.type][L].msgs[+b.dataset.ready];
  form.elements.msg.value = d.msg; changed();
});
form.addEventListener("input", e => {
  const t = e.target;
  if (TEXT.includes(t.name)) { d[t.name] = t.value; if (t.name === "n1") $("#w-n1").classList.remove("err"); changed(); }
});
form.addEventListener("change", e => {
  const t = e.target;
  if (t.name === "type") { applyType(t.value); fill(); changed(); }
  else if (t.name === "tpl") { d.tpl = t.value; changed(); }
  else if (t.name === "lang") { d.lang = t.value; applyType(d.type); fill(); changed(); }
  else if (t.name === "fx") { d.fx = t.checked; changed(); }
  else if (t.name === "music") { d.music = t.checked; $("#w-track").hidden = !d.music; if (!d.music) stopMusic(); changed(); }
  else if (t.name === "track") { d.track = t.value; setTrack(trackFile(d.track)); changed(); }
});

// ---------- photos ----------
function thumbs() {
  $("#thumbs").innerHTML = d.photos.map((id, n) => `<div><img src="${esc(photoUrl(id))}" alt=""><button type="button" data-rm="${n}" aria-label="${S.del}">×</button></div>`).join("")
    + Array(uploading).fill(`<div class="busy">${S.uploading}</div>`).join("");
}
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
$("#f-photos").addEventListener("change", async e => {
  const msg = $("#photo-msg"); msg.textContent = "";
  let files = [...e.target.files]; e.target.value = "";
  const room = 6 - d.photos.length - uploading;
  if (files.length > room) { msg.textContent = S.photo_max; files = files.slice(0, Math.max(0, room)); }
  await Promise.all(files.map(async f => {
    uploading++; thumbs();
    try {
      const blob = await compress(f);
      const r = await fetch("/api/photos", { method: "POST", headers: { "content-type": "image/jpeg" }, body: blob });
      if (!r.ok) throw 0;
      const { id } = await r.json();
      local.set(id, URL.createObjectURL(blob));
      d.photos.push(id);
    } catch { msg.textContent = S.photo_fail; }
    finally { uploading--; thumbs(); changed(); }
  }));
});
$("#thumbs").addEventListener("click", e => {
  const b = e.target.closest("[data-rm]"); if (!b) return;
  d.photos.splice(+b.dataset.rm, 1); thumbs(); changed();
});

// ---------- save ----------
form.addEventListener("submit", async e => {
  e.preventDefault();
  const msg = $("#form-msg"), btn = $("#save");
  msg.textContent = "";
  d = clean(d);
  if (!d.n1) { $("#w-n1").classList.add("err"); msg.textContent = S.need_name; form.elements.n1.focus(); return; }
  if (uploading) { msg.textContent = S.photo_wait; return; }
  btn.disabled = true; const label = btn.textContent; btn.textContent = S.saving;
  try {
    const r = await fetch(edit ? `/api/invitations/${edit.slug}` : "/api/invitations", {
      method: edit ? "PUT" : "POST",
      headers: { "content-type": "application/json", ...(edit ? { "x-edit-key": edit.key } : {}) },
      body: JSON.stringify(d)
    });
    if (r.status === 429) { msg.textContent = S.rate; return; }
    if (!r.ok) throw 0;
    const res = await r.json();
    const slug = res.slug, key = edit ? edit.key : res.key;
    const mine = (store.get("toigo-mine") || []).filter(x => x.slug !== slug);
    mine.unshift({ slug, key, title: titleOf(d, d.lang), date: d.date, at: Date.now() });
    store.set("toigo-mine", mine.slice(0, 30));
    if (!edit) { store.del("toigo-draft-" + LANG); edit = { slug, key }; history.replaceState(null, "", `#edit=${slug}.${key}`); }
    btn.textContent = S.update;
    done(slug, key);
  } catch { msg.textContent = S.net; }
  finally { btn.disabled = false; if (btn.textContent === S.saving) btn.textContent = label; }
});

function done(slug, key) {
  const link = `${location.origin}/i/${slug}`;
  const manage = `${location.origin}${CFG.manage}#${slug}.${key}`;
  const text = `${S.share_text} ${titleOf(d, d.lang)}\n${link}`;
  const box = $("#done");
  box.className = "done"; box.hidden = false;
  box.innerHTML = `<h3>${S.done_h}</h3>
    <p>${S.done_p}</p>
    <div class="copyrow"><input id="out-link" type="text" readonly value="${esc(link)}" aria-label="${S.link}"><button type="button" class="btn btn-p btn-sm" data-copy="#out-link" data-done="${S.copied}">${S.copy}</button></div>
    <div class="copyrow">
      <a class="btn btn-gold btn-sm" href="https://wa.me/?text=${encodeURIComponent(text)}" target="_blank" rel="noopener">${S.wa}</a>
      <a class="btn btn-g btn-sm" href="https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(S.share_text)}" target="_blank" rel="noopener">${S.tg}</a>
      <a class="btn btn-g btn-sm" href="${esc(link)}" target="_blank" rel="noopener">${S.open}</a>
    </div>
    <div class="warn"><b>${S.manage_h}.</b> ${S.manage_warn}</div>
    <div class="copyrow"><input id="out-manage" type="text" readonly value="${esc(manage)}" aria-label="${S.manage_h}"><button type="button" class="btn btn-g btn-sm" data-copy="#out-manage" data-done="${S.copied}">${S.copy}</button></div>
    <a class="btn btn-p btn-sm" style="align-self:flex-start" href="${esc(manage)}">${S.manage_open}</a>`;
  box.scrollIntoView({ behavior: "smooth", block: "start" });
}

startLive();
init();
