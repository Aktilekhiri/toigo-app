// Orders: validation, creation, payment start and the Finik webhook.
// Rules: the price comes only from lib/services.js; an order becomes PAID only from a verified
// webhook (or an explicit admin confirmation for manual bank transfers); webhooks are idempotent.
import { SERVICES, CURRENCY, priceOf, EVENT_TYPES } from "./services.js";
import { TPL } from "../public/assets/invite-core.js";
import { randomId, sha256, same } from "./server.js";
import { finikReady, finikCreatePayment, finikVerifyWebhook } from "./finik.js";
import { queueAndSend } from "./mailer.js";

const str = (v, n) => String(v ?? "").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim().slice(0, n);

/** Validate a public order form. Returns { ok, data } or { ok: false, errors: { field: code } }. */
export function validateOrder(input) {
  const i = input && typeof input === "object" ? input : {};
  const e = {}, d = {};
  d.service = SERVICES[i.service] ? i.service : (e.service = "required", "");
  d.name = str(i.name, 80); if (d.name.length < 2) e.name = "required";
  d.contact = str(i.contact, 40); if (d.contact.replace(/\D/g, "").length < 9) e.contact = "phone";
  d.email = str(i.email, 120).toLowerCase(); if (d.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(d.email)) e.email = "email";
  d.event_type = EVENT_TYPES.includes(i.event_type) ? i.event_type : (e.event_type = "required", "");
  d.event_date = str(i.event_date, 10);
  if (d.event_date) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d.event_date), t = m && Date.UTC(+m[1], +m[2] - 1, +m[3]);
    if (!m || isNaN(t) || t < Date.now() - 2 * 86400e3 || t > Date.now() + 3 * 365 * 86400e3) e.event_date = "date";
  }
  d.names = str(i.names, 200); if (d.names.length < 2) e.names = "required";
  d.message = str(i.message, 2000);
  d.tpl = i.tpl && TPL.some(t => t.id === i.tpl) ? i.tpl : "";
  d.extra = str(i.extra, 1000);
  d.lang = i.lang === "ru" ? "ru" : "ky";
  if (i.consent !== true) e.consent = "required";
  return Object.keys(e).length ? { ok: false, errors: e } : { ok: true, data: d };
}

async function newOrderId(env) {
  const abc = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  for (let n = 0; n < 8; n++) {
    const b = crypto.getRandomValues(new Uint8Array(6));
    const id = "TG-" + [...b].map(x => abc[x % abc.length]).join("");
    if (!(await env.DB.prepare("SELECT 1 FROM orders WHERE id = ?").bind(id).first())) return id;
  }
  throw new Error("id_exhausted");
}

export function siteUrl(env, request) {
  return (env.SITE_URL || (request ? new URL(request.url).origin : "https://toigo.app")).replace(/\/$/, "");
}
export const statusUrl = (site, o, token, lang) => `${site}${lang === "ru" ? "/ru" : ""}/order/status/?o=${o}&t=${token}`;

/** Create an order (PENDING_PAYMENT) and notify the admin. Returns { id, token }. */
export async function createOrder(env, data, waitUntil = p => p) {
  const id = await newOrderId(env), token = randomId(24), now = Date.now();
  const amount = priceOf(data.service);
  await env.DB.prepare(`INSERT INTO orders (id, token_hash, service, amount, currency, lang, name, email, contact, event_type, event_date, names, message, tpl, extra, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING_PAYMENT', ?, ?)`)
    .bind(id, await sha256(token), data.service, amount, CURRENCY, data.lang, data.name, data.email || null, data.contact, data.event_type, data.event_date || null,
      data.names, data.message || null, data.tpl || null, data.extra || null, now, now).run();
  console.log(JSON.stringify({ evt: "order_created", id, service: data.service, amount }));
  await waitUntil(queueAndSend(env, id, "new_order").catch(() => {}));
  return { id, token, amount };
}

export async function orderByToken(env, id, token) {
  if (!/^TG-[A-Z0-9]{6}$/.test(id || "") || !token) return null;
  const o = await env.DB.prepare("SELECT * FROM orders WHERE id = ?").bind(id).first();
  return o && same(o.token_hash, await sha256(token)) ? o : null;
}

/** What the customer may see about their order. */
export function publicView(o, env) {
  return { id: o.id, service: o.service, amount: o.amount, currency: o.currency, status: o.status, created_at: o.created_at, paid_at: o.paid_at,
    result_url: o.status === "COMPLETED" ? o.result_url : null, pay_mode: finikReady(env) ? "finik" : "manual" };
}

/** Start (or restart) online payment for an unpaid order. Returns { ok, url } or { ok: false, error }. */
export async function startPayment(env, o, { site, token }, fetchImpl) {
  if (!["PENDING_PAYMENT", "PAYMENT_FAILED"].includes(o.status)) return { ok: false, error: "not_payable" };
  if (!finikReady(env)) return { ok: false, error: "manual_mode" };
  const n = (await env.DB.prepare("SELECT COUNT(*) AS n FROM payments WHERE order_id = ?").bind(o.id).first()).n;
  if (n >= 10) return { ok: false, error: "too_many_attempts" };
  const paymentId = `${o.id}-${n + 1}`, now = Date.now();
  const amount = priceOf(o.service); // recompute, never trust stored or client values
  await env.DB.prepare("INSERT INTO payments (order_id, provider, provider_payment_id, amount, currency, status, created_at) VALUES (?, 'finik', ?, ?, ?, 'CREATED', ?)")
    .bind(o.id, paymentId, amount, CURRENCY, now).run();
  const r = await finikCreatePayment(env, {
    paymentId, amount, title: `Toigo order ${o.id}`, lang: o.lang,
    redirectUrl: statusUrl(site, o.id, token, o.lang) + "&ret=1",
    webhookUrl: `${site}/api/pay/finik`
  }, fetchImpl || env.__fetch || fetch);
  await env.DB.prepare("UPDATE payments SET status = ?, pay_url = ?, error = ? WHERE provider_payment_id = ?")
    .bind(r.ok ? "CREATED" : "ERROR", r.ok ? r.url : null, r.ok ? null : r.error, paymentId).run();
  if (r.ok && o.status === "PAYMENT_FAILED") await setStatus(env, o.id, "PENDING_PAYMENT");
  console.log(JSON.stringify({ evt: "payment_start", order: o.id, paymentId, ok: r.ok, error: r.error || null }));
  return r;
}

export async function setStatus(env, id, status, extra = {}) {
  const sets = ["status = ?", "updated_at = ?"], vals = [status, Date.now()];
  for (const [k, v] of Object.entries(extra)) { sets.push(`${k} = ?`); vals.push(v); }
  await env.DB.prepare(`UPDATE orders SET ${sets.join(", ")} WHERE id = ?`).bind(...vals, id).run();
}

const SUCCESS = new Set(["success", "succeeded", "successful", "paid", "completed"]);
const FAIL = new Set(["failed", "failure", "error", "declined", "canceled", "cancelled", "rejected"]);

/**
 * Handle a Finik webhook. Always answers 200 for authentic notifications we have recorded,
 * so Finik stops retrying; 401 for a bad signature; 400 for unusable data.
 */
export async function handleFinikWebhook(env, request, waitUntil = p => p) {
  const raw = await request.text();
  if (raw.length > 32 * 1024) return { code: 400, body: { error: "too_large" } };
  const body = await finikVerifyWebhook(env, request, raw);
  if (!body) { console.log(JSON.stringify({ evt: "webhook_bad_signature" })); return { code: 401, body: { error: "bad_signature" } }; }

  const fields = body.fields || {};
  const paymentId = String(fields.paymentId || fields.PaymentId || body.paymentId || "");
  const txId = String(body.transactionId || body.id || "");
  const st = String(body.status || "").toLowerCase();
  const amount = Number(body.amount ?? fields.amount);
  const currency = String(body.currency || fields.currency || CURRENCY).toUpperCase();
  if (!paymentId || !txId) return { code: 400, body: { error: "missing_ids" } };

  const pay = await env.DB.prepare("SELECT * FROM payments WHERE provider = 'finik' AND provider_payment_id = ?").bind(paymentId).first();
  if (!pay) { console.log(JSON.stringify({ evt: "webhook_unknown_payment", paymentId })); return { code: 200, body: { ok: true, ignored: "unknown_payment" } }; }

  // Idempotency: this exact transaction was already processed.
  const seen = await env.DB.prepare("SELECT id, status FROM payments WHERE provider = 'finik' AND provider_tx_id = ?").bind(txId).first();
  if (seen || pay.status === "SUCCEEDED") return { code: 200, body: { ok: true, duplicate: true } };

  const o = await env.DB.prepare("SELECT * FROM orders WHERE id = ?").bind(pay.order_id).first();
  const now = Date.now();

  if (FAIL.has(st)) {
    await env.DB.prepare("UPDATE payments SET status = 'FAILED', provider_tx_id = ?, confirmed_at = ? WHERE id = ?").bind(txId, now, pay.id).run();
    if (o && o.status === "PENDING_PAYMENT") await setStatus(env, o.id, "PAYMENT_FAILED");
    return { code: 200, body: { ok: true, status: "failed" } };
  }
  if (!SUCCESS.has(st)) return { code: 200, body: { ok: true, ignored: "status" } };

  const expected = priceOf(o ? o.service : "");
  if (!o || amount !== expected || amount !== pay.amount || currency !== CURRENCY) {
    await env.DB.prepare("UPDATE payments SET status = 'MISMATCH', provider_tx_id = ?, error = ?, confirmed_at = ? WHERE id = ?")
      .bind(txId, `amount ${amount} ${currency}, expected ${expected} ${CURRENCY}`, now, pay.id).run();
    console.log(JSON.stringify({ evt: "webhook_mismatch", order: pay.order_id, amount, currency }));
    if (o) await waitUntil(queueAndSend(env, o.id, "payment_issue").catch(() => {}));
    return { code: 200, body: { ok: true, status: "mismatch" } };
  }

  await env.DB.prepare("UPDATE payments SET status = 'SUCCEEDED', provider_tx_id = ?, confirmed_at = ? WHERE id = ?").bind(txId, now, pay.id).run();
  if (["PENDING_PAYMENT", "PAYMENT_FAILED"].includes(o.status)) {
    await setStatus(env, o.id, "PAID", { paid_at: now });
    console.log(JSON.stringify({ evt: "order_paid", order: o.id, amount }));
    await waitUntil(queueAndSend(env, o.id, "paid").catch(() => {}));
  } else {
    // Paid again although already paid / cancelled: keep the order as it is, tell the admin.
    await waitUntil(queueAndSend(env, o.id, "payment_issue").catch(() => {}));
  }
  return { code: 200, body: { ok: true, status: "paid" } };
}
