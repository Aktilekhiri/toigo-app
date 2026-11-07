// Toigo — sign in with Google or Telegram. The session token lives in localStorage and goes with API calls.
const LS = {
  get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
  del(k) { try { localStorage.removeItem(k); } catch {} }
};
const LANG = (document.documentElement.lang || "ky").startsWith("ru") ? "ru" : "ky";
const TXT = {
  ky: { h: "Кирүү", p: "Чакыруулар жана жазылуу аккаунтуңузга сакталат, каалаган телефондон ачасыз.", or: "же", out: "Чыгуу", fail: "Кирүү ишке ашкан жок. Кайра аракет кылыңыз.", tgOff: "Telegram аркылуу кирүү азыр жөндөлүүдө.", gOff: "Google аркылуу кирүү азыр жеткиликсиз." },
  ru: { h: "Вход", p: "Приглашения и подписка сохраняются в аккаунте, их видно с любого телефона.", or: "или", out: "Выйти", fail: "Не удалось войти. Попробуйте ещё раз.", tgOff: "Вход через Telegram ещё настраивается.", gOff: "Вход через Google сейчас недоступен." }
}[LANG];

const listeners = new Set();
export const session = () => LS.get("toigo-session") || "";
export const currentUser = () => (session() ? LS.get("toigo-user") : null);
export const authHeaders = () => (session() ? { authorization: "Bearer " + session() } : {});
export const onAuthChange = fn => { listeners.add(fn); return () => listeners.delete(fn); };
const emit = () => listeners.forEach(fn => { try { fn(currentUser()); } catch {} });

export function logout() { LS.del("toigo-session"); LS.del("toigo-user"); emit(); }

let cfgP = null;
const config = () => (cfgP = cfgP || fetch("/api/auth/config").then(r => r.json()).catch(() => ({})));

async function finish(path, body, msgEl) {
  try {
    const r = await fetch(path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...body, key: LS.get("toigo-key") || "" }) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || !j.token) throw 0;
    LS.set("toigo-session", j.token); LS.set("toigo-user", j.user);
    await syncInvites();
    emit();
  } catch { if (msgEl) msgEl.textContent = TXT.fail; }
}

// Pull the account's invitations (with manage keys) into this device's list.
export async function syncInvites() {
  if (!session()) return null;
  try {
    const r = await fetch("/api/auth/me", { headers: authHeaders() });
    if (r.status === 401) { logout(); return null; }
    const j = await r.json();
    const mine = LS.get("toigo-mine") || [], have = new Set(mine.map(x => x.slug));
    for (const v of j.invites || []) {
      if (!v.key || have.has(v.slug)) continue;
      const who = v.n2 ? `${v.n1} & ${v.n2}` : v.n1;
      mine.push({ slug: v.slug, key: v.key, title: v.title ? `${who} — ${v.title}` : who, date: v.date, at: v.at });
    }
    mine.sort((a, b) => (b.at || 0) - (a.at || 0));
    LS.set("toigo-mine", mine.slice(0, 100));
    if (j.user) LS.set("toigo-user", j.user);
    return j;
  } catch { return null; }
}

let gsiP = null;
const loadGsi = () => (gsiP = gsiP || new Promise((ok, no) => {
  if (window.google && google.accounts && google.accounts.id) return ok();
  const s = document.createElement("script"); s.src = "https://accounts.google.com/gsi/client"; s.async = true;
  s.onload = () => ok(); s.onerror = no; document.head.appendChild(s);
}));

// Renders the sign-in box (Google button + Telegram button) into el.
export async function renderLogin(el, opts = {}) {
  el.innerHTML = `<div class="auth-box">${opts.title === false ? "" : `<b class="auth-h">${opts.title || TXT.h}</b>`}<p class="auth-p">${opts.text || TXT.p}</p>
    <div class="auth-btns"><div class="auth-g"></div><span class="auth-or">${TXT.or}</span><div class="auth-tg"></div></div><p class="auth-msg" aria-live="polite"></p></div>`;
  const msg = el.querySelector(".auth-msg"), cfg = await config();
  // Google
  try {
    if (!cfg.google) throw 0;
    await loadGsi();
    google.accounts.id.initialize({ client_id: cfg.google, callback: r => finish("/api/auth/google", { credential: r.credential }, msg), auto_select: false, ux_mode: "popup" });
    google.accounts.id.renderButton(el.querySelector(".auth-g"), { theme: "outline", size: "large", shape: "pill", text: "signin_with", locale: LANG === "ru" ? "ru" : "ky", width: 260 });
  } catch { el.querySelector(".auth-g").innerHTML = `<span class="auth-off">${TXT.gOff}</span>`; }
  // Telegram
  const tg = el.querySelector(".auth-tg");
  if (cfg.tg) {
    window.toigoTgAuth = u => finish("/api/auth/telegram", { user: u }, msg);
    const s = document.createElement("script");
    s.async = true; s.src = "https://telegram.org/js/telegram-widget.js?22";
    s.setAttribute("data-telegram-login", cfg.tg); s.setAttribute("data-size", "large"); s.setAttribute("data-radius", "20");
    s.setAttribute("data-onauth", "toigoTgAuth(user)"); s.setAttribute("data-request-access", "write"); s.setAttribute("data-lang", LANG);
    tg.appendChild(s);
  } else { tg.innerHTML = `<span class="auth-off">${TXT.tgOff}</span>`; el.querySelector(".auth-or").hidden = true; }
}

// Small "Name · Sign out" line.
export function userLine() {
  const u = currentUser(); if (!u) return "";
  const esc = s => String(s || "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  return `<span class="auth-user">${u.picture ? `<img src="${esc(u.picture)}" alt="" referrerpolicy="no-referrer">` : ""}${esc(u.name || u.email)}<button type="button" class="auth-out" data-logout>${TXT.out}</button></span>`;
}
document.addEventListener("click", e => { if (e.target.closest("[data-logout]")) logout(); });
