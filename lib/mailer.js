// Order e-mails to the admin, with a small queue in D1:
//  - one row per (order, kind) → the same notification is never sent twice (dedupe_key is UNIQUE);
//  - failed sends are retried by the cron trigger with backoff, at most MAX_ATTEMPTS times;
//  - a mail failure never touches the order or the payment.
// Transports, first available wins: env.MAILER (Cloudflare send_email binding) → env.RESEND_API_KEY → none.
import { SERVICES } from "./services.js";

export const MAX_ATTEMPTS = 5;
const KINDS = new Set(["new_order", "paid", "payment_issue"]);

export async function queueEmail(env, orderId, kind, { force = false } = {}) {
  if (!KINDS.has(kind)) throw new Error("bad_kind");
  const key = force ? `${orderId}:${kind}:r${Date.now()}` : `${orderId}:${kind}`;
  const now = Date.now();
  const r = await env.DB.prepare("INSERT OR IGNORE INTO email_notifications (order_id, kind, dedupe_key, status, attempts, next_at, created_at) VALUES (?, ?, ?, 'PENDING', 0, ?, ?)")
    .bind(orderId, kind, key, now, now).run();
  if (!r.meta || !r.meta.changes) return null; // already queued/sent
  return r.meta.last_row_id;
}

/** Send one queued e-mail now. Never throws. Returns the new status. */
export async function sendQueued(env, id) {
  const row = await env.DB.prepare("SELECT * FROM email_notifications WHERE id = ?").bind(id).first();
  if (!row || row.status !== "PENDING") return row ? row.status : null; // SENT or FAILED: nothing to do
  const order = await env.DB.prepare("SELECT * FROM orders WHERE id = ?").bind(row.order_id).first();
  const tr = transport(env);
  let status = "PENDING", error = null;
  if (!order) { status = "FAILED"; error = "order_missing"; }
  else if (!tr) { error = "no_transport"; }
  else {
    try { await tr(render(env, row.kind, order)); status = "SENT"; }
    catch (e) { error = String(e && (e.code || e.message) || "send_failed").slice(0, 200); }
  }
  const attempts = row.attempts + (tr ? 1 : 0);
  if (status !== "SENT" && attempts >= MAX_ATTEMPTS) status = "FAILED";
  const next = Date.now() + Math.min(6 * 3600e3, 60e3 * 2 ** attempts);
  await env.DB.prepare("UPDATE email_notifications SET status = ?, attempts = ?, last_error = ?, next_at = ?, sent_at = ? WHERE id = ?")
    .bind(status, attempts, error, next, status === "SENT" ? Date.now() : null, id).run();
  console.log(JSON.stringify({ evt: "email", id, kind: row.kind, order: row.order_id, status, error }));
  return status;
}

export async function queueAndSend(env, orderId, kind, opts) {
  const id = await queueEmail(env, orderId, kind, opts);
  return id ? sendQueued(env, id) : "DUPLICATE";
}

/** Cron: retry e-mails whose time has come. */
export async function retryDue(env, limit = 20) {
  const { results } = await env.DB.prepare("SELECT id FROM email_notifications WHERE status = 'PENDING' AND next_at <= ? ORDER BY id LIMIT ?").bind(Date.now(), limit).all();
  for (const r of results || []) await sendQueued(env, r.id);
  return (results || []).length;
}

// ---------- rendering (admin e-mails are in Russian) ----------
const STATUS_RU = { PENDING_PAYMENT: "ожидает оплаты", PAID: "оплачен", PAYMENT_FAILED: "оплата не прошла", CANCELLED: "отменён", IN_PROGRESS: "в работе", COMPLETED: "выполнен" };
const fmtTime = ts => new Date(ts).toLocaleString("ru-RU", { timeZone: "Asia/Bishkek" }) + " (Бишкек)";

export function render(env, kind, o) {
  const svc = SERVICES[o.service] ? SERVICES[o.service].name.ru : o.service;
  const site = (env.SITE_URL || "https://toigo.app").replace(/\/$/, "");
  const head = {
    new_order: `Новый заказ ${o.id} — ${svc}, ${o.amount} ${o.currency}`,
    paid: `Оплата подтверждена: ${o.id} — ${o.amount} ${o.currency}`,
    payment_issue: `Проверьте оплату заказа ${o.id}`
  }[kind];
  const lines = [
    head, "",
    `Номер заказа: ${o.id}`,
    `Создан: ${fmtTime(o.created_at)}`,
    `Услуга: ${svc}`,
    `Сумма: ${o.amount} ${o.currency}`,
    `Статус заказа: ${STATUS_RU[o.status] || o.status}`,
    `Статус оплаты: ${o.paid_at ? "оплачено " + fmtTime(o.paid_at) : "не оплачено"}`,
    "",
    `Клиент: ${o.name}`,
    `Контакт: ${o.contact}`,
    o.email ? `Email: ${o.email}` : null,
    `Тип тоя: ${o.event_type}`,
    o.event_date ? `Дата тоя: ${o.event_date}` : null,
    o.tpl ? `Шаблон: ${o.tpl}` : null,
    `Имена в приглашении: ${o.names}`,
    o.message ? `Текст / пожелания: ${o.message}` : null,
    o.extra ? `Дополнительно: ${o.extra}` : null,
    "",
    kind === "payment_issue" ? "Пришло уведомление об оплате, которое не совпало с заказом (сумма, валюта или повторная оплата). Заказ НЕ отмечен как оплаченный автоматически — проверьте в кабинете Finik." : null,
    `Админка: ${site}/admin/#${o.id}`
  ].filter(x => x !== null);
  return { subject: head, text: lines.join("\n") };
}

// ---------- transports ----------
function transport(env) {
  if (typeof env.__mailTransport === "function") return env.__mailTransport; // tests
  const to = env.ADMIN_EMAIL, from = env.MAIL_FROM;
  if (env.MAILER && to && from) return msg => sendViaBinding(env.MAILER, from, to, msg);
  if (env.RESEND_API_KEY && to && from) return msg => sendViaResend(env.RESEND_API_KEY, from, to, msg);
  return null;
}

const b64 = s => { const u = new TextEncoder().encode(s); let x = ""; for (const c of u) x += String.fromCharCode(c); return btoa(x); };
export function mime(from, to, { subject, text }) {
  const body = b64(text).replace(/.{76}/g, "$&\r\n");
  return [
    `From: Тойго <${from}>`.replace("Тойго", `=?UTF-8?B?${b64("Тойго")}?=`),
    `To: <${to}>`,
    `Subject: =?UTF-8?B?${b64(subject)}?=`,
    `Date: ${new Date().toUTCString()}`,
    `Message-ID: <${crypto.randomUUID()}@${from.split("@")[1]}>`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
    "", body
  ].join("\r\n");
}

async function sendViaBinding(binding, from, to, msg) {
  const { EmailMessage } = await import("cloudflare:email");
  await binding.send(new EmailMessage(from, to, mime(from, to, msg)));
}

async function sendViaResend(key, from, to, msg) {
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify({ from: `Тойго <${from}>`, to: [to], subject: msg.subject, text: msg.text })
  });
  if (!r.ok) throw new Error(`resend_${r.status}`);
}
