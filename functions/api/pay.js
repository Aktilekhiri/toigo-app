// Toigo — paid access: first invitation free, then a subscription: 100 som / 30 days or 500 som / 365 days (key on 3 devices).
// Payment is automatic through Finik (QR in any Kyrgyz bank app), the same account as diamond.kg and clip4k.app:
// the site creates a payment, the person pays on the Finik page, Finik sends a signed webhook and the key
// is issued (or extended) by itself. Lifetime keys sold earlier keep working without a date.
// Invitations already created keep working and stay editable after the subscription ends;
// the subscription is only needed to create new invitations.
//
//   GET  /api/access?device=&key=   is this device licensed (and until when), free invitations left
//   POST /api/activate              bind a key to this device
//   POST /api/pay                   create a Finik payment (new key, or renew the given key) → { url }
//   POST /api/finik/webhook         Finik reports a payment → key issued / extended
//   GET  /api/order?id=&token=      payment status and key
//   POST /api/tg                    Telegram webhook (admin commands, old receipt buttons)
//   GET  /api/setup?s=SECRET        once: connect the bot webhook
//
// Secrets (Cloudflare → Worker toigo-app → Settings → Variables and Secrets):
//   FINIK_API_KEY, FINIK_PRIVATE_KEY, FINIK_PUBLIC_KEY, FINIK_ACCOUNT_ID — the same as diamond.kg (see finik.js)
//   TG_BOT_TOKEN, TG_ADMIN_CHAT, TG_SECRET — Telegram bot for notifications and admin commands
import { json } from "../../lib/server.js";
import { finikReady, createFinikPayment, readFinikWebhook, PAY_MIN } from "./finik.js";

export const FREE = 1;          // free invitations per device
export const PLANS = { month: { price: 100, days: 30 }, year: { price: 500, days: 365 } };
// Individual invitation: we design and fill in the invitation for the client (1–3 days); includes a month of subscription.
export const CUSTOM = { price: 400, days: 30 };
const CUSTOM_FILES = 5, CUSTOM_FILE_MAX = 4 << 20;
export const PRICE = PLANS.month.price;   // cheapest plan, shown when access is refused
export const DAYS = PLANS.month.days;     // default days for /newkey
const DAY = 864e5;
const MAX_DEVICES = 3;          // devices per key
const IP_FREE_30D = 4;          // free invitations from one IP in 30 days (clearing the browser does not reset it)

const now = () => Date.now();
export const DEV_RE = /^[0-9a-f]{32}$/;
const KEY_RE = /^TOI-[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}$/;
const B32 = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

function randStr(n) {
  const b = new Uint8Array(n); crypto.getRandomValues(b);
  let s = ""; for (const x of b) s += B32[x % B32.length]; return s;
}
const newKey = () => `TOI-${randStr(4)}-${randStr(4)}-${randStr(4)}`;
export const normKey = k => String(k || "").toUpperCase().replace(/[\s_]+/g, "").replace(/^TOI-?(\w{4})-?(\w{4})-?(\w{4})$/, "TOI-$1-$2-$3");
const fmtDate = ms => { const d = new Date(ms + 6 * 3600e3); return `${String(d.getUTCDate()).padStart(2, "0")}.${String(d.getUTCMonth() + 1).padStart(2, "0")}.${d.getUTCFullYear()}`; };   // Bishkek time

// Tables and new columns are created on first use, so nothing has to be run by hand in Cloudflare.
let ready = false;
export async function ensure(env) {
  if (ready) return;
  await env.DB.batch([
    env.DB.prepare("CREATE TABLE IF NOT EXISTS pay_licenses (key TEXT PRIMARY KEY, created INTEGER NOT NULL, order_id TEXT, devices TEXT NOT NULL DEFAULT '[]', note TEXT, revoked INTEGER NOT NULL DEFAULT 0)"),
    env.DB.prepare("CREATE TABLE IF NOT EXISTS pay_orders (id TEXT PRIMARY KEY, token TEXT NOT NULL, created INTEGER NOT NULL, status TEXT NOT NULL DEFAULT 'pending', contact TEXT, device TEXT, ip TEXT, license_key TEXT, tg_msg INTEGER)"),
    env.DB.prepare("CREATE TABLE IF NOT EXISTS pay_free (device TEXT PRIMARY KEY, used INTEGER NOT NULL DEFAULT 0, ip TEXT, last INTEGER)"),
    env.DB.prepare("CREATE TABLE IF NOT EXISTS pay_ipuse (ip TEXT NOT NULL, ts INTEGER NOT NULL, kind TEXT NOT NULL)"),
    env.DB.prepare("CREATE INDEX IF NOT EXISTS pay_ipuse_ip ON pay_ipuse(ip, kind, ts)"),
    env.DB.prepare("CREATE TABLE IF NOT EXISTS pay_payments (tx_id TEXT PRIMARY KEY, order_id TEXT NOT NULL, amount REAL NOT NULL, created INTEGER NOT NULL)"),
    env.DB.prepare("CREATE TABLE IF NOT EXISTS pay_files (id INTEGER PRIMARY KEY AUTOINCREMENT, order_id TEXT NOT NULL, mime TEXT NOT NULL, bytes BLOB NOT NULL, created INTEGER NOT NULL)")
  ]);
  const cols = async t => (await env.DB.prepare(`PRAGMA table_info(${t})`).all()).results.map(c => c.name);
  const lc = await cols("pay_licenses"), oc = await cols("pay_orders");
  if (!lc.includes("expires")) await env.DB.prepare("ALTER TABLE pay_licenses ADD COLUMN expires INTEGER").run();   // NULL = lifetime
  for (const [c, type] of [["amount", "REAL"], ["method", "TEXT"], ["pay_url", "TEXT"], ["fee", "REAL"], ["renew_key", "TEXT"], ["days", "INTEGER"], ["kind", "TEXT"], ["brief", "TEXT"]])
    if (!oc.includes(c)) await env.DB.prepare(`ALTER TABLE pay_orders ADD COLUMN ${c} ${type}`).run();
  ready = true;
}

export async function ipHash(request, env) {
  const ip = request.headers.get("cf-connecting-ip") || "0";
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode((env.TG_SECRET || "toigo") + ip));
  return [...new Uint8Array(d)].slice(0, 12).map(x => x.toString(16).padStart(2, "0")).join("");
}

async function getLicense(env, key) {
  if (!KEY_RE.test(key)) return null;
  const r = await env.DB.prepare("SELECT key, devices, revoked, expires FROM pay_licenses WHERE key = ?").bind(key).first();
  if (!r || r.revoked) return null;
  return { key: r.key, devices: JSON.parse(r.devices || "[]"), expires: r.expires || null, expired: !!(r.expires && r.expires < now()) };
}

// Is the key valid for this device? Binds a new device when asked and there is room.
export async function licenseFor(env, key, device, bind) {
  const lic = await getLicense(env, key);
  if (!lic) return { ok: false, reason: "badkey" };
  if (lic.expired) return { ok: false, reason: "expired", expires: lic.expires };
  if (lic.devices.includes(device)) return { ok: true, expires: lic.expires };
  if (lic.devices.length >= MAX_DEVICES) return { ok: false, reason: "devices" };
  if (bind) {
    lic.devices.push(device);
    await env.DB.prepare("UPDATE pay_licenses SET devices = ? WHERE key = ?").bind(JSON.stringify(lic.devices), key).run();
  }
  return { ok: true, expires: lic.expires };
}

// New key for 30 days, or extend an existing one (days are added to what is left).
async function grant(env, { key, device, ref, note, days = DAYS }) {
  if (key) {
    const lic = await getLicense(env, key);
    if (lic) {
      if (!lic.expires) return { key, expires: null, renewed: false };
      const expires = Math.max(now(), lic.expires) + days * DAY;
      await env.DB.prepare("UPDATE pay_licenses SET expires = ? WHERE key = ?").bind(expires, key).run();
      return { key, expires, renewed: true };
    }
  }
  const k = newKey(), expires = days ? now() + days * DAY : null;
  await env.DB.prepare("INSERT INTO pay_licenses (key, created, order_id, devices, note, expires) VALUES (?, ?, ?, ?, ?, ?)")
    .bind(k, now(), ref || null, JSON.stringify(device ? [device] : []), String(note || "").slice(0, 100), expires).run();
  return { key: k, expires, renewed: false };
}

export async function freeLeft(env, device) {
  const r = await env.DB.prepare("SELECT used FROM pay_free WHERE device = ?").bind(device).first();
  return Math.max(0, FREE - (r ? r.used : 0));
}

async function ipCount(env, ip, kind, sinceMs) {
  const r = await env.DB.prepare("SELECT COUNT(*) AS n FROM pay_ipuse WHERE ip = ? AND kind = ? AND ts > ?").bind(ip, kind, now() - sinceMs).first();
  return r ? r.n : 0;
}

// Called by POST /api/invitations before creating. Returns { ok } or { ok:false, status, error }.
export async function canCreate(env, request) {
  await ensure(env);
  const device = request.headers.get("x-device") || "", key = normKey(request.headers.get("x-toigo-key"));
  if (!DEV_RE.test(device)) return { ok: false, status: 400, error: "device" };
  if (key) {
    const r = await licenseFor(env, key, device, true);
    if (r.ok) return { ok: true, licensed: true };
    if (r.reason === "devices") return { ok: false, status: 409, error: "devices" };
    if (r.reason === "badkey") return { ok: false, status: 402, error: "badkey" };
    // expired key: the device may still have its free invitation
    if (await freeLeft(env, device) <= 0) return { ok: false, status: 402, error: "expired", expires: r.expires };
  } else if (await freeLeft(env, device) <= 0) return { ok: false, status: 402, error: "pay" };
  const ip = await ipHash(request, env);
  if (await ipCount(env, ip, "free", 30 * 864e5) >= IP_FREE_30D) return { ok: false, status: 402, error: "pay" };
  return { ok: true, licensed: false, device, ip };
}

// Called after a free invitation was created.
export async function useFree(env, gate) {
  if (gate.licensed) return;
  await env.DB.batch([
    env.DB.prepare("INSERT INTO pay_free (device, used, ip, last) VALUES (?, 1, ?, ?) ON CONFLICT(device) DO UPDATE SET used = used + 1, ip = excluded.ip, last = excluded.last").bind(gate.device, gate.ip, now()),
    env.DB.prepare("INSERT INTO pay_ipuse (ip, ts, kind) VALUES (?, ?, 'free')").bind(gate.ip, now())
  ]);
}

// ---------- Telegram ----------
async function tg(env, method, body) {
  if (!env.TG_BOT_TOKEN) return { ok: false, description: "no token" };
  const init = body instanceof FormData ? { method: "POST", body } : { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) };
  const r = await fetch(`${env.TG_API || "https://api.telegram.org"}/bot${String(env.TG_BOT_TOKEN).trim()}/${method}`, init);   // TG_API is only for tests
  return r.json().catch(() => ({ ok: false }));
}
const isAdmin = (env, chatId) => env.TG_ADMIN_CHAT && String(chatId) === String(env.TG_ADMIN_CHAT).trim();
async function notifyAdmin(env, text) { if (env.TG_ADMIN_CHAT) await tg(env, "sendMessage", { chat_id: String(env.TG_ADMIN_CHAT).trim(), text }).catch(() => {}); }

async function handleTg(request, env) {
  if (!env.TG_SECRET || request.headers.get("x-telegram-bot-api-secret-token") !== String(env.TG_SECRET).trim()) return new Response("forbidden", { status: 403 });
  const u = await request.json().catch(() => ({}));
  if (u.callback_query) {
    // Buttons on old receipt messages (before Finik).
    const q = u.callback_query, chat = q.message && q.message.chat && q.message.chat.id;
    if (!isAdmin(env, chat)) { await tg(env, "answerCallbackQuery", { callback_query_id: q.id, text: "Нет доступа" }); return json({ ok: true }); }
    const [act, id] = String(q.data || "").split(":");
    const o = await env.DB.prepare("SELECT * FROM pay_orders WHERE id = ?").bind(id || "").first();
    if (!o) { await tg(env, "answerCallbackQuery", { callback_query_id: q.id, text: "Заказ не найден" }); return json({ ok: true }); }
    let note;
    if (o.status !== "pending") note = o.status === "approved" ? `Уже выдан: ${o.license_key}` : "Уже отклонён";
    else if (act === "ok") {
      const g = await grant(env, { device: o.device, ref: id, note: o.contact || "чек" });
      await env.DB.prepare("UPDATE pay_orders SET status = 'approved', license_key = ? WHERE id = ?").bind(g.key, id).run();
      note = `✅ Выдан ключ ${g.key} до ${fmtDate(g.expires)}`;
    } else if (act === "no") {
      await env.DB.prepare("UPDATE pay_orders SET status = 'rejected' WHERE id = ?").bind(id).run();
      note = "❌ Отклонено";
    }
    await tg(env, "answerCallbackQuery", { callback_query_id: q.id, text: note || "" });
    if (note && q.message) {
      const cap = (q.message.caption || q.message.text || "") + "\n\n" + note;
      const m = { chat_id: chat, message_id: q.message.message_id, reply_markup: { inline_keyboard: [] } };
      if (q.message.photo || q.message.document) await tg(env, "editMessageCaption", { ...m, caption: cap });
      else await tg(env, "editMessageText", { ...m, text: cap });
    }
    return json({ ok: true });
  }
  const msg = u.message;
  if (msg && msg.text) {
    const chat = msg.chat.id, t = msg.text.trim();
    const reply = text => tg(env, "sendMessage", { chat_id: chat, text });
    if (/^\/(start|id)\b/.test(t)) await reply(`Ваш chat id: ${chat}\nВпишите его в секрет TG_ADMIN_CHAT, чтобы получать уведомления Тойго.` + (isAdmin(env, chat) ? "\n\nВы администратор. Команды:\n/newkey [дни] заметка — ключ вручную (0 дней = навсегда, по умолчанию 30)\n/stats — статистика\n/revoke КЛЮЧ — отключить ключ" : ""));
    else if (isAdmin(env, chat) && /^\/newkey\b/.test(t)) {
      const m = /^\/newkey\s+(\d{1,4})\b\s*(.*)$/.exec(t), days = m ? +m[1] : DAYS, note = (m ? m[2] : t.replace(/^\/newkey\s*/, "")).slice(0, 100) || "вручную";
      const g = await grant(env, { note, days });
      await reply(`Новый ключ: ${g.key}\n${g.expires ? "Действует до " + fmtDate(g.expires) : "Навсегда"}`);
    } else if (isAdmin(env, chat) && /^\/stats\b/.test(t)) {
      const since = now() - 30 * DAY;
      const a = await env.DB.prepare(`SELECT
        (SELECT COUNT(*) FROM pay_licenses WHERE revoked = 0 AND expires > ?) AS subs,
        (SELECT COUNT(*) FROM pay_licenses WHERE revoked = 0 AND expires IS NULL) AS forever,
        (SELECT COUNT(*) FROM pay_orders WHERE method = 'finik' AND status = 'approved' AND created > ?) AS paid30,
        (SELECT COALESCE(SUM(amount - COALESCE(fee, 0)), 0) FROM pay_orders WHERE method = 'finik' AND status = 'approved' AND created > ?) AS net30,
        (SELECT COUNT(*) FROM pay_orders WHERE method = 'finik' AND status = 'approved') AS paidAll,
        (SELECT COALESCE(SUM(amount - COALESCE(fee, 0)), 0) FROM pay_orders WHERE method = 'finik' AND status = 'approved') AS netAll,
        (SELECT COUNT(*) FROM pay_orders WHERE kind = 'custom' AND status = 'approved' AND created > ?) AS custom30,
        (SELECT COUNT(*) FROM pay_free) AS freedev, (SELECT COUNT(*) FROM invitations) AS inv,
        (SELECT COUNT(*) FROM invitations WHERE created_at > ?) AS inv30`).bind(now(), since, since, since, since).first();
      await reply(`Активных подписок: ${a.subs}\nКлючей навсегда: ${a.forever}\n\nОплат Finik за 30 дней: ${a.paid30} (на счёт ≈ ${Math.round(a.net30)} сом после 2%)\nИндивидуальных приглашений за 30 дней: ${a.custom30}\nВсего оплат Finik: ${a.paidAll} (≈ ${Math.round(a.netAll)} сом)\n\nПриглашений: ${a.inv} (за 30 дней ${a.inv30})\nУстройств с бесплатным приглашением: ${a.freedev}`);
    } else if (isAdmin(env, chat) && /^\/revoke\b/.test(t)) {
      const key = normKey(t.replace(/^\/revoke\s*/, ""));
      const r = await env.DB.prepare("UPDATE pay_licenses SET revoked = 1 WHERE key = ?").bind(key).run();
      await reply(r.meta.changes ? `Ключ ${key} отключён` : "Ключ не найден");
    }
  }
  return json({ ok: true });
}

// Paid individual invitation: send the brief and photos to the admin, then drop the photos from the database.
const TYPE_RU = { uylonuu: "Свадьба", kyz: "Кыз узатуу", sunnot: "Сүннөт той", tushoo: "Тушоо кесүү", maarake: "Юбилей", tuulgan: "День рождения" };
const LANG_RU = { ky: "кыргызский", ru: "русский", both: "два языка" };
async function notifyCustom(env, o, g, paid, fee) {
  let b = {}; try { b = JSON.parse(o.brief || "{}"); } catch (_) {}
  const lines = [
    `🎨 Тойго: ИНДИВИДУАЛЬНОЕ приглашение, оплачено ${paid} сом (Finik)`, `Заказ ${o.id} · сделать за 1–3 дня`,
    `👤 Связь: ${b.contact || o.contact || "—"}`, `🎉 Той: ${TYPE_RU[b.type] || b.type || "—"}`, `💍 Имена: ${b.names || "—"}`,
    b.date && `📅 Дата: ${b.date}`, b.place && `📍 Место: ${b.place}`, b.lang && `🌐 Язык: ${LANG_RU[b.lang] || b.lang}`,
    b.style && `🎨 Стиль, цвета: ${b.style}`, b.wishes && `📝 Пожелания: ${b.wishes}`,
    `🔑 Ключ клиента (месяц подписки): ${g.key}${g.expires ? " до " + fmtDate(g.expires) : ""}`, `Комиссия ≈ ${fee} сом`
  ].filter(Boolean);
  await notifyAdmin(env, lines.join("\n").slice(0, 4000));
  const { results } = await env.DB.prepare("SELECT id, mime, bytes FROM pay_files WHERE order_id = ? ORDER BY id").bind(o.id).all();
  if (results.length && env.TG_ADMIN_CHAT) {
    const fd = new FormData(); fd.set("chat_id", String(env.TG_ADMIN_CHAT).trim());
    fd.set("media", JSON.stringify(results.map((f, i) => ({ type: "photo", media: `attach://p${i}`, ...(i === 0 ? { caption: `Фото к заказу ${o.id}` } : {}) }))));
    results.forEach((f, i) => fd.set(`p${i}`, new Blob([new Uint8Array(f.bytes)], { type: f.mime }), `p${i}.jpg`));
    const r = await tg(env, results.length > 1 ? "sendMediaGroup" : "sendPhoto", results.length > 1 ? fd : (() => { const f1 = new FormData(); f1.set("chat_id", String(env.TG_ADMIN_CHAT).trim()); f1.set("caption", `Фото к заказу ${o.id}`); f1.set("photo", new Blob([new Uint8Array(results[0].bytes)], { type: results[0].mime }), "p0.jpg"); return f1; })()).catch(() => ({ ok: false }));
    if (r.ok) await env.DB.prepare("DELETE FROM pay_files WHERE order_id = ?").bind(o.id).run();
  }
}

// ---------- routes ----------
export async function handle(request, env, url) {
  await ensure(env);
  const p = url.pathname.replace(/\/$/, "");

  if (p === "/api/access" && request.method === "GET") {
    const device = url.searchParams.get("device") || "", key = normKey(url.searchParams.get("key"));
    if (!DEV_RE.test(device)) return json({ error: "device" }, 400);
    const lic = key ? await licenseFor(env, key, device, false) : { ok: false };
    return json({ licensed: lic.ok, expires: lic.expires || null, keyError: key && !lic.ok ? lic.reason : undefined, freeLeft: await freeLeft(env, device), free: FREE, plans: PLANS, custom: CUSTOM, pay: finikReady(env) });
  }

  if (p === "/api/activate" && request.method === "POST") {
    const b = await request.json().catch(() => ({}));
    const device = String(b.device || ""), key = normKey(b.key);
    if (!DEV_RE.test(device)) return json({ error: "device" }, 400);
    const ip = await ipHash(request, env);
    if (await ipCount(env, ip, "activate", 3600e3) >= 20) return json({ error: "often" }, 429);
    await env.DB.prepare("INSERT INTO pay_ipuse (ip, ts, kind) VALUES (?, ?, 'activate')").bind(ip, now()).run();
    const r = await licenseFor(env, key, device, true);
    if (r.ok) return json({ ok: true, key, expires: r.expires || null });
    if (r.reason === "expired") return json({ error: "expired", key, expires: r.expires }, 402);
    return json({ error: r.reason }, r.reason === "devices" ? 409 : 404);
  }

  // Subscription payment through Finik: a new key (no key given) or renewal of the given key
  if (p === "/api/pay" && request.method === "POST") {
    if (!finikReady(env)) return json({ error: "notready" }, 503);
    const b = await request.json().catch(() => ({}));
    const device = String(b.device || ""), key = b.key ? normKey(b.key) : "", lang = b.lang === "ru" ? "ru" : "ky";
    const planId = PLANS[b.plan] ? b.plan : "month", plan = PLANS[planId];
    if (!DEV_RE.test(device)) return json({ error: "device" }, 400);
    let renew = null;
    if (key) {
      const lic = await getLicense(env, key);
      if (!lic) return json({ error: "badkey" }, 404);
      if (!lic.expires) return json({ error: "lifetime" }, 409);
      renew = key;
    }
    const ip = await ipHash(request, env);
    if (await ipCount(env, ip, "pay", 3600e3) >= 10) return json({ error: "often" }, 429);
    const id = "TG" + randStr(10), token = randStr(24);
    await env.DB.batch([
      env.DB.prepare("INSERT INTO pay_orders (id, token, created, status, device, ip, amount, method, renew_key, days) VALUES (?, ?, ?, 'pending', ?, ?, ?, 'finik', ?, ?)").bind(id, token, now(), device, ip, plan.price, renew, plan.days),
      env.DB.prepare("INSERT INTO pay_ipuse (ip, ts, kind) VALUES (?, ?, 'pay')").bind(ip, now())
    ]);
    const back = `${url.origin}${lang === "ru" ? "/ru" : ""}/create/?paid=${id}&t=${token}#buy`;
    const r = await createFinikPayment(env, { id, amount: plan.price, description: `Тойго — ${renew ? "продление" : "подписка"} на ${planId === "year" ? "1 год" : plan.days + " дней"}` }, back, `${url.origin}/api/finik/webhook`);
    if (r.error) {
      await env.DB.prepare("UPDATE pay_orders SET status = 'failed' WHERE id = ?").bind(id).run();
      console.error("finik create", r.error);
      return json({ error: "finik", detail: r.error }, 502);
    }
    await env.DB.prepare("UPDATE pay_orders SET pay_url = ? WHERE id = ?").bind(r.url, id).run();
    return json({ id, token, url: r.url });
  }

  // Individual invitation: brief + up to 5 photos, then Finik payment of 400 som (includes a month of subscription)
  if (p === "/api/custom" && request.method === "POST") {
    if (!finikReady(env)) return json({ error: "notready" }, 503);
    const ip = await ipHash(request, env);
    if (await ipCount(env, ip, "custom", 3600e3) >= 5) return json({ error: "often" }, 429);
    const fd = await request.formData().catch(() => null);
    if (!fd) return json({ error: "form" }, 400);
    const g = k => String(fd.get(k) || "").trim();
    const device = g("device"), lang = g("lang") === "ru" ? "ru" : "ky", key = g("key") ? normKey(g("key")) : "";
    if (!DEV_RE.test(device)) return json({ error: "device" }, 400);
    const brief = { type: g("type").slice(0, 30), names: g("names").slice(0, 160), date: g("date").slice(0, 20), place: g("place").slice(0, 200), style: g("style").slice(0, 300), wishes: g("wishes").slice(0, 2000), contact: g("contact").slice(0, 80), lang: g("ilang").slice(0, 10) };
    if (brief.contact.length < 3) return json({ error: "contact" }, 400);
    if (brief.names.length < 2) return json({ error: "names" }, 400);
    const files = fd.getAll("photos").filter(f => f && typeof f !== "string" && f.size).slice(0, CUSTOM_FILES);
    for (const f of files) {
      if (!/^image\/(jpeg|png|webp)$/.test(f.type)) return json({ error: "photo-type" }, 415);
      if (f.size > CUSTOM_FILE_MAX) return json({ error: "photo-big" }, 413);
    }
    let renew = null;
    if (key) { const lic = await getLicense(env, key); if (lic && lic.expires) renew = key; }
    const id = "TC" + randStr(10), token = randStr(24);
    const fileRows = await Promise.all(files.map(async f => env.DB.prepare("INSERT INTO pay_files (order_id, mime, bytes, created) VALUES (?, ?, ?, ?)").bind(id, f.type, new Uint8Array(await f.arrayBuffer()), now())));
    await env.DB.batch([
      env.DB.prepare("INSERT INTO pay_orders (id, token, created, status, contact, device, ip, amount, method, renew_key, days, kind, brief) VALUES (?, ?, ?, 'pending', ?, ?, ?, ?, 'finik', ?, ?, 'custom', ?)").bind(id, token, now(), brief.contact, device, ip, CUSTOM.price, renew, CUSTOM.days, JSON.stringify(brief)),
      env.DB.prepare("INSERT INTO pay_ipuse (ip, ts, kind) VALUES (?, ?, 'custom')").bind(ip, now()),
      ...fileRows
    ]);
    // Unpaid briefs' photos are removed after two days.
    await env.DB.prepare("DELETE FROM pay_files WHERE created < ? AND order_id IN (SELECT id FROM pay_orders WHERE status != 'approved')").bind(now() - 2 * DAY).run().catch(() => {});
    const back = `${url.origin}${lang === "ru" ? "/ru" : ""}/custom/?paid=${id}&t=${token}#order`;
    const r = await createFinikPayment(env, { id, amount: CUSTOM.price, description: "Тойго — индивидуальное приглашение" }, back, `${url.origin}/api/finik/webhook`);
    if (r.error) {
      await env.DB.prepare("UPDATE pay_orders SET status = 'failed' WHERE id = ?").bind(id).run();
      console.error("finik create", r.error);
      return json({ error: "finik", detail: r.error }, 502);
    }
    await env.DB.prepare("UPDATE pay_orders SET pay_url = ? WHERE id = ?").bind(r.url, id).run();
    return json({ id, token, url: r.url });
  }

  // Finik sends a signed notification after the payment
  if (p === "/api/finik/webhook" && request.method === "POST") {
    if (!env.FINIK_PUBLIC_KEY) return new Response("off", { status: 503 });
    const w = await readFinikWebhook(env, request);
    if (w.bad) { console.log("finik webhook:", w.bad); return new Response("bad " + w.bad, { status: w.bad === "json" ? 400 : 401 }); }
    const body = w.body, st = String(body.status || "").toLowerCase();
    if (!["success", "succeeded"].includes(st)) return new Response("ignored");
    const f = body.fields || {}, id = String(f.paymentId || "").slice(0, 20), tx = String(body.transactionId || body.id || ""), paid = Number(body.amount) || 0;
    if (!id || !tx) return new Response("no ids");
    const ins = await env.DB.prepare("INSERT OR IGNORE INTO pay_payments (tx_id, order_id, amount, created) VALUES (?, ?, ?, ?)").bind(tx, id, paid, now()).run();
    if (!ins.meta.changes) return new Response("duplicate");
    const o = await env.DB.prepare("SELECT * FROM pay_orders WHERE id = ?").bind(id).first();
    if (!o) { await notifyAdmin(env, `⚠️ Тойго/Finik: оплата ${paid} сом по неизвестному заказу ${id} (транзакция ${tx}). Проверьте в кабинете Finik.`); return new Response("ok"); }
    if (paid + 0.001 < (o.amount || PRICE)) { await notifyAdmin(env, `⚠️ Тойго/Finik: заказ ${id} оплачен не полностью: ${paid} из ${o.amount} сом. Ключ НЕ выдан.`); return new Response("ok"); }
    if (o.status === "approved") return new Response("ok");
    const g = await grant(env, { key: o.renew_key, device: o.device, ref: id, note: "finik " + id, days: o.days || DAYS });
    const fee = Math.round(paid * Number(env.FINIK_FEE_PCT || 0.02) * 100) / 100;
    await env.DB.prepare("UPDATE pay_orders SET status = 'approved', license_key = ?, fee = ? WHERE id = ?").bind(g.key, fee, id).run();
    if (o.kind === "custom") await notifyCustom(env, o, g, paid, fee);
    else await notifyAdmin(env, `💳 Тойго: оплата ${paid} сом (Finik)\n${g.renewed ? "🔁 Продление" : "🆕 Новая подписка"} (${(o.days || DAYS) >= 365 ? "год" : "месяц"}): ${g.key}\nДействует ${g.expires ? "до " + fmtDate(g.expires) : "навсегда"}\nКомиссия ≈ ${fee} сом`);
    return new Response("ok");
  }

  if (p === "/api/order" && request.method === "GET") {
    const o = await env.DB.prepare("SELECT status, token, license_key, created, method FROM pay_orders WHERE id = ?").bind(url.searchParams.get("id") || "").first();
    if (!o || o.token !== url.searchParams.get("token")) return json({ error: "notfound" }, 404);
    let status = o.status, expires = null;
    if (status === "pending" && o.method === "finik" && o.created < now() - (PAY_MIN + 5) * 60e3) status = "expired";
    if (status === "approved" && o.license_key) { const l = await getLicense(env, o.license_key); expires = l ? l.expires : null; }
    return json({ status, key: status === "approved" ? o.license_key : undefined, expires });
  }

  if (p === "/api/tg" && request.method === "POST") return handleTg(request, env);

  if (p === "/api/setup" && request.method === "GET") {
    if (!env.TG_SECRET || url.searchParams.get("s") !== String(env.TG_SECRET).trim())
      // hint without values: which secrets the site can see
      return json({ error: "forbidden", TG_SECRET: env.TG_SECRET ? "есть, но не совпадает со ссылкой" : "НЕТ", TG_BOT_TOKEN: env.TG_BOT_TOKEN ? "есть" : "НЕТ", TG_ADMIN_CHAT: env.TG_ADMIN_CHAT ? "есть" : "НЕТ", FINIK: finikReady(env) ? "есть" : "НЕТ" }, 403);
    const hook = await tg(env, "setWebhook", { url: `${url.origin}/api/tg`, secret_token: String(env.TG_SECRET).trim(), allowed_updates: ["message", "callback_query"] });
    const cmds = await tg(env, "setMyCommands", { commands: [{ command: "start", description: "Показать chat id" }, { command: "newkey", description: "Ключ вручную: /newkey [дни] заметка" }, { command: "stats", description: "Статистика" }, { command: "revoke", description: "Отключить ключ" }] });
    return json({ webhook: hook, commands: cmds, adminChat: env.TG_ADMIN_CHAT ? "задан" : "НЕ задан — напишите боту /start и впишите chat id в TG_ADMIN_CHAT", finik: finikReady(env) ? "подключён" : "НЕТ ключей Finik" });
  }

  return json({ error: "not_found" }, 404);
}
