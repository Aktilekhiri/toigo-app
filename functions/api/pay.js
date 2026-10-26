// Toigo — paid access: first invitation free, then 500 som once for lifetime access (key on 3 devices).
// Same flow as clip4k.app: QR payment (MBank / O!Bank) → receipt upload → Telegram bot with
// "Выдать ключ" / "Отклонить" buttons → the key appears on the site by itself.
//
//   GET  /api/access?device=&key=   is this device licensed, how many free invitations are left
//   POST /api/activate              bind a key to this device
//   POST /api/order                 send a payment receipt (goes to the admin in Telegram)
//   GET  /api/order?id=&token=      order status; returns the key once approved
//   POST /api/tg                    Telegram webhook (buttons and admin commands)
//   GET  /api/setup?s=SECRET        once: connect the bot webhook
//
// Secrets (Cloudflare → Worker toigo-app → Settings → Variables and Secrets):
//   TG_BOT_TOKEN   bot token from @BotFather (a separate bot, not the clip4k one)
//   TG_ADMIN_CHAT  your chat id (the bot sends it on /start)
//   TG_SECRET      any long random string (protects the webhook and /api/setup)
import { json } from "../../lib/server.js";

export const FREE = 1;          // free invitations per device
export const PRICE = 500;       // som
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

// Tables are created on first use, so nothing has to be run by hand in Cloudflare.
let ready = false;
export async function ensure(env) {
  if (ready) return;
  await env.DB.batch([
    env.DB.prepare("CREATE TABLE IF NOT EXISTS pay_licenses (key TEXT PRIMARY KEY, created INTEGER NOT NULL, order_id TEXT, devices TEXT NOT NULL DEFAULT '[]', note TEXT, revoked INTEGER NOT NULL DEFAULT 0)"),
    env.DB.prepare("CREATE TABLE IF NOT EXISTS pay_orders (id TEXT PRIMARY KEY, token TEXT NOT NULL, created INTEGER NOT NULL, status TEXT NOT NULL DEFAULT 'pending', contact TEXT, device TEXT, ip TEXT, license_key TEXT, tg_msg INTEGER)"),
    env.DB.prepare("CREATE TABLE IF NOT EXISTS pay_free (device TEXT PRIMARY KEY, used INTEGER NOT NULL DEFAULT 0, ip TEXT, last INTEGER)"),
    env.DB.prepare("CREATE TABLE IF NOT EXISTS pay_ipuse (ip TEXT NOT NULL, ts INTEGER NOT NULL, kind TEXT NOT NULL)"),
    env.DB.prepare("CREATE INDEX IF NOT EXISTS pay_ipuse_ip ON pay_ipuse(ip, kind, ts)")
  ]);
  ready = true;
}

export async function ipHash(request, env) {
  const ip = request.headers.get("cf-connecting-ip") || "0";
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode((env.TG_SECRET || "toigo") + ip));
  return [...new Uint8Array(d)].slice(0, 12).map(x => x.toString(16).padStart(2, "0")).join("");
}

async function getLicense(env, key) {
  if (!KEY_RE.test(key)) return null;
  const r = await env.DB.prepare("SELECT key, devices, revoked FROM pay_licenses WHERE key = ?").bind(key).first();
  if (!r || r.revoked) return null;
  return { key: r.key, devices: JSON.parse(r.devices || "[]") };
}

// Is the key valid for this device? Binds a new device when asked and there is room.
export async function licenseFor(env, key, device, bind) {
  const lic = await getLicense(env, key);
  if (!lic) return { ok: false, reason: "badkey" };
  if (lic.devices.includes(device)) return { ok: true };
  if (lic.devices.length >= MAX_DEVICES) return { ok: false, reason: "devices" };
  if (bind) {
    lic.devices.push(device);
    await env.DB.prepare("UPDATE pay_licenses SET devices = ? WHERE key = ?").bind(JSON.stringify(lic.devices), key).run();
  }
  return { ok: true };
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
    return { ok: false, status: r.reason === "devices" ? 409 : 402, error: r.reason };
  }
  if (await freeLeft(env, device) <= 0) return { ok: false, status: 402, error: "pay" };
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

async function handleTg(request, env) {
  if (!env.TG_SECRET || request.headers.get("x-telegram-bot-api-secret-token") !== String(env.TG_SECRET).trim()) return new Response("forbidden", { status: 403 });
  const u = await request.json().catch(() => ({}));
  if (u.callback_query) {
    const q = u.callback_query, chat = q.message && q.message.chat && q.message.chat.id;
    if (!isAdmin(env, chat)) { await tg(env, "answerCallbackQuery", { callback_query_id: q.id, text: "Нет доступа" }); return json({ ok: true }); }
    const [act, id] = String(q.data || "").split(":");
    const o = await env.DB.prepare("SELECT * FROM pay_orders WHERE id = ?").bind(id || "").first();
    if (!o) { await tg(env, "answerCallbackQuery", { callback_query_id: q.id, text: "Заказ не найден" }); return json({ ok: true }); }
    let note;
    if (o.status !== "pending") note = o.status === "approved" ? `Уже выдан: ${o.license_key}` : "Уже отклонён";
    else if (act === "ok") {
      const key = newKey();
      await env.DB.batch([
        env.DB.prepare("INSERT INTO pay_licenses (key, created, order_id, devices, note) VALUES (?, ?, ?, ?, ?)").bind(key, now(), id, JSON.stringify(o.device ? [o.device] : []), o.contact || ""),
        env.DB.prepare("UPDATE pay_orders SET status = 'approved', license_key = ? WHERE id = ?").bind(key, id)
      ]);
      note = `✅ Выдан ключ ${key}`;
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
    if (/^\/(start|id)\b/.test(t)) await reply(`Ваш chat id: ${chat}\nВпишите его в секрет TG_ADMIN_CHAT, чтобы получать чеки Тойго.` + (isAdmin(env, chat) ? "\n\nВы администратор. Команды: /newkey [заметка], /stats, /revoke КЛЮЧ" : ""));
    else if (isAdmin(env, chat) && /^\/newkey\b/.test(t)) {
      const key = newKey(), note = t.replace(/^\/newkey\s*/, "").slice(0, 100) || "вручную";
      await env.DB.prepare("INSERT INTO pay_licenses (key, created, devices, note) VALUES (?, ?, '[]', ?)").bind(key, now(), note).run();
      await reply(`Новый ключ: ${key}`);
    } else if (isAdmin(env, chat) && /^\/stats\b/.test(t)) {
      const a = await env.DB.prepare("SELECT (SELECT COUNT(*) FROM pay_licenses WHERE revoked = 0) AS lic, (SELECT COUNT(*) FROM pay_orders WHERE status = 'pending') AS pend, (SELECT COUNT(*) FROM pay_orders WHERE status = 'approved') AS paid, (SELECT COUNT(*) FROM pay_free) AS freedev, (SELECT COUNT(*) FROM invitations) AS inv").first();
      await reply(`Ключей: ${a.lic}\nОплачено заказов: ${a.paid} (≈ ${a.paid * PRICE} сом)\nЖдут проверки: ${a.pend}\nУстройств с бесплатным приглашением: ${a.freedev}\nВсего приглашений: ${a.inv}`);
    } else if (isAdmin(env, chat) && /^\/revoke\b/.test(t)) {
      const key = normKey(t.replace(/^\/revoke\s*/, ""));
      const r = await env.DB.prepare("UPDATE pay_licenses SET revoked = 1 WHERE key = ?").bind(key).run();
      await reply(r.meta.changes ? `Ключ ${key} отключён` : "Ключ не найден");
    }
  }
  return json({ ok: true });
}

// ---------- routes ----------
export async function handle(request, env, url) {
  await ensure(env);
  const p = url.pathname.replace(/\/$/, "");

  if (p === "/api/access" && request.method === "GET") {
    const device = url.searchParams.get("device") || "", key = normKey(url.searchParams.get("key"));
    if (!DEV_RE.test(device)) return json({ error: "device" }, 400);
    const lic = key ? await licenseFor(env, key, device, false) : { ok: false };
    return json({ licensed: lic.ok, keyError: key && !lic.ok ? lic.reason : undefined, freeLeft: await freeLeft(env, device), free: FREE, price: PRICE, payReady: !!(env.TG_BOT_TOKEN && env.TG_ADMIN_CHAT) });
  }

  if (p === "/api/activate" && request.method === "POST") {
    const b = await request.json().catch(() => ({}));
    const device = String(b.device || ""), key = normKey(b.key);
    if (!DEV_RE.test(device)) return json({ error: "device" }, 400);
    const ip = await ipHash(request, env);
    if (await ipCount(env, ip, "activate", 3600e3) >= 20) return json({ error: "often" }, 429);
    await env.DB.prepare("INSERT INTO pay_ipuse (ip, ts, kind) VALUES (?, ?, 'activate')").bind(ip, now()).run();
    const r = await licenseFor(env, key, device, true);
    return r.ok ? json({ ok: true, key }) : json({ error: r.reason }, r.reason === "devices" ? 409 : 404);
  }

  if (p === "/api/order" && request.method === "POST") {
    if (!env.TG_BOT_TOKEN || !env.TG_ADMIN_CHAT) return json({ error: "notready" }, 503);
    const ip = await ipHash(request, env);
    if (await ipCount(env, ip, "order", 3600e3) >= 3) return json({ error: "often" }, 429);
    const fd = await request.formData().catch(() => null);
    const file = fd && fd.get("receipt"), contact = String((fd && fd.get("contact")) || "").trim().slice(0, 80), device = String((fd && fd.get("device")) || "");
    if (!file || typeof file === "string" || !file.size) return json({ error: "receipt" }, 400);
    if (file.size > 8 << 20) return json({ error: "receipt-big" }, 413);
    if (!/^image\//.test(file.type) && file.type !== "application/pdf") return json({ error: "receipt-type" }, 415);
    if (contact.length < 3) return json({ error: "contact" }, 400);
    if (!DEV_RE.test(device)) return json({ error: "device" }, 400);
    const id = randStr(8), token = randStr(24);
    await env.DB.batch([
      env.DB.prepare("INSERT INTO pay_orders (id, token, created, contact, device, ip) VALUES (?, ?, ?, ?, ?, ?)").bind(id, token, now(), contact, device, ip),
      env.DB.prepare("INSERT INTO pay_ipuse (ip, ts, kind) VALUES (?, ?, 'order')").bind(ip, now())
    ]);
    const caption = `🧾 Тойго, заказ ${id}\n💰 ${PRICE} сом, доступ навсегда\n👤 ${contact}\n📱 устройство ${device.slice(0, 8)}…\n\nПроверь поступление денег и нажми кнопку.`;
    const tgf = new FormData();
    tgf.set("chat_id", String(env.TG_ADMIN_CHAT).trim());
    tgf.set("caption", caption);
    tgf.set("reply_markup", JSON.stringify({ inline_keyboard: [[{ text: "✅ Выдать ключ", callback_data: `ok:${id}` }, { text: "❌ Отклонить", callback_data: `no:${id}` }]] }));
    const isImg = /^image\/(jpeg|png|webp)$/.test(file.type);
    tgf.set(isImg ? "photo" : "document", file, file.name || "receipt");
    let r = await tg(env, isImg ? "sendPhoto" : "sendDocument", tgf);
    if (!r.ok && isImg) { tgf.delete("photo"); tgf.set("document", file, file.name || "receipt"); r = await tg(env, "sendDocument", tgf); }
    if (!r.ok) { await env.DB.prepare("DELETE FROM pay_orders WHERE id = ?").bind(id).run(); return json({ error: "tg", detail: String(r.description || "").slice(0, 120) }, 502); }
    await env.DB.prepare("UPDATE pay_orders SET tg_msg = ? WHERE id = ?").bind(r.result.message_id, id).run();
    return json({ id, token });
  }

  if (p === "/api/order" && request.method === "GET") {
    const o = await env.DB.prepare("SELECT status, token, license_key FROM pay_orders WHERE id = ?").bind(url.searchParams.get("id") || "").first();
    if (!o || o.token !== url.searchParams.get("token")) return json({ error: "notfound" }, 404);
    return json({ status: o.status, key: o.status === "approved" ? o.license_key : undefined });
  }

  if (p === "/api/tg" && request.method === "POST") return handleTg(request, env);

  if (p === "/api/setup" && request.method === "GET") {
    if (!env.TG_SECRET || url.searchParams.get("s") !== String(env.TG_SECRET).trim())
      // hint without values: which secrets the site can see
      return json({ error: "forbidden", TG_SECRET: env.TG_SECRET ? "есть, но не совпадает со ссылкой" : "НЕТ", TG_BOT_TOKEN: env.TG_BOT_TOKEN ? "есть" : "НЕТ", TG_ADMIN_CHAT: env.TG_ADMIN_CHAT ? "есть" : "НЕТ" }, 403);
    const hook = await tg(env, "setWebhook", { url: `${url.origin}/api/tg`, secret_token: String(env.TG_SECRET).trim(), allowed_updates: ["message", "callback_query"] });
    const cmds = await tg(env, "setMyCommands", { commands: [{ command: "start", description: "Показать chat id" }, { command: "newkey", description: "Создать ключ вручную" }, { command: "stats", description: "Статистика" }, { command: "revoke", description: "Отключить ключ" }] });
    return json({ webhook: hook, commands: cmds, adminChat: env.TG_ADMIN_CHAT ? "задан" : "НЕ задан — напишите боту /start и впишите chat id в TG_ADMIN_CHAT" });
  }

  return json({ error: "not_found" }, 404);
}
