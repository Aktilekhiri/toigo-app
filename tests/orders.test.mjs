// Run: node --test tests/   (no network, no real money: Finik is mocked, keys are generated per run)
import { test } from "node:test";
import assert from "node:assert/strict";
import { generateKeyPairSync } from "node:crypto";
import { makeDB } from "./d1.mjs";
import { canonical, sign, verify } from "../lib/rsa.js";
import { validateOrder } from "../lib/orders.js";
import { queueEmail, sendQueued, retryDue, queueAndSend, MAX_ATTEMPTS } from "../lib/mailer.js";
import { hashPassword, makeSession } from "../lib/admin-auth.js";
import { SERVICES } from "../lib/services.js";
import * as ordersApi from "../functions/api/orders/index.js";
import * as orderApi from "../functions/api/orders/[id].js";
import * as hookApi from "../functions/api/pay/finik.js";
import * as loginApi from "../functions/api/admin/login.js";
import * as adminList from "../functions/api/admin/orders.js";
import * as adminOne from "../functions/api/admin/orders/[id].js";

const pem = () => generateKeyPairSync("rsa", { modulusLength: 2048, publicKeyEncoding: { type: "spki", format: "pem" }, privateKeyEncoding: { type: "pkcs1", format: "pem" } });
const ours = pem(), finik = pem();
const SITE = "https://toigo.app";

function env(extra = {}) {
  const sent = [];
  return {
    DB: makeDB(), SITE_URL: SITE, ADMIN_EMAIL: "admin@example.com", MAIL_FROM: "orders@toigo.app",
    __mailTransport: async m => { sent.push(m); }, sent, ...extra
  };
}
const finikEnv = (calls = [], extra = {}) => env({
  __fetch: mockFinik(calls), PAYMENT_MODE: "finik", FINIK_ENV: "beta", FINIK_API_KEY: "test-key", FINIK_ACCOUNT_ID: "acc-1",
  FINIK_PRIVATE_KEY: ours.privateKey, FINIK_PUBLIC_KEY: finik.publicKey, ...extra
});
let ipn = 0;
const req = (path, { method = "GET", body, headers = {} } = {}) => new Request(SITE + path, {
  method, headers: { "content-type": "application/json", "cf-connecting-ip": `10.0.0.${++ipn % 250}`, ...headers }, body: body === undefined ? undefined : typeof body === "string" ? body : JSON.stringify(body)
});
const call = async (mod, method, request, e, params = {}) => {
  const res = await mod[method === "GET" ? "onRequestGet" : "onRequestPost"]({ request, env: e, params, waitUntil: p => p });
  return { status: res.status, body: await res.json() };
};
const FORM = { service: "custom", name: "Айгерим", contact: "+996 700 123 456", email: "a@example.com", event_type: "uylonuu",
  event_date: "2027-06-12", names: "Айбек & Айзада", message: "Текст", tpl: "silk", consent: true, lang: "ru" };

// Mock Finik "create payment": checks our signature, answers 302 with a payment page.
function mockFinik(calls = []) {
  return async (url, init) => {
    const u = new URL(url), body = JSON.parse(init.body);
    const data = canonical({ method: "POST", path: u.pathname, headers: { Host: u.host, "x-api-key": init.headers["x-api-key"], "x-api-timestamp": init.headers["x-api-timestamp"] }, body });
    calls.push({ url, body, signed: await verify(ours.publicKey, data, init.headers.signature) });
    return new Response(null, { status: 302, headers: { location: `https://qr.finik/pay/${body.PaymentId}` } });
  };
}
// A webhook as Finik would send it, signed with "Finik's" private key.
async function webhook(body, { key = finik.privateKey } = {}) {
  const headers = { Host: "toigo.app", "x-api-timestamp": String(Date.now()) };
  const signature = await sign(key, canonical({ method: "POST", path: "/api/pay/finik", headers, body }));
  return req("/api/pay/finik", { method: "POST", body, headers: { "x-api-timestamp": headers["x-api-timestamp"], signature } });
}
const hook = (paymentId, over = {}) => ({ id: "op_DEBIT", transactionId: over.tx || "tx-1", status: "SUCCEEDED", amount: 790,
  fields: { amount: 790, paymentId }, requestDate: Date.now(), transactionDate: Date.now(), ...over });
const orderRow = (e, id) => e.DB.prepare("SELECT * FROM orders WHERE id = ?").bind(id).first();

test("validation: required fields, consent, contact and e-mail format", () => {
  assert.equal(validateOrder(FORM).ok, true);
  const bad = validateOrder({ ...FORM, name: "", contact: "12", email: "x@", consent: false, service: "gold", event_date: "2001-01-01" });
  assert.deepEqual(Object.keys(bad.errors).sort(), ["consent", "contact", "email", "event_date", "name", "service"]);
  assert.equal(validateOrder({ ...FORM, email: "" }).ok, true, "e-mail is optional");
});

test("create order: price comes from the server, client amount is ignored; admin is e-mailed once", async () => {
  const e = env();
  const r = await call(ordersApi, "POST", req("/api/orders", { method: "POST", body: { ...FORM, amount: 1, price: 1 } }), e);
  assert.equal(r.status, 201);
  assert.match(r.body.id, /^TG-[A-Z0-9]{6}$/);
  assert.equal(r.body.amount, SERVICES.custom.price);
  assert.equal(r.body.pay_mode, "manual");
  const o = await orderRow(e, r.body.id);
  assert.equal(o.status, "PENDING_PAYMENT");
  assert.equal(o.amount, 790);
  assert.notEqual(o.token_hash, r.body.token, "token is stored hashed");
  assert.equal(e.sent.length, 1);
  assert.match(e.sent[0].subject, /Новый заказ/);
  const p = await call(ordersApi, "POST", req("/api/orders", { method: "POST", body: { ...FORM, service: "premium" } }), e);
  assert.equal(p.body.amount, SERVICES.premium.price);
});

test("create order: invalid form and honeypot are rejected", async () => {
  const e = env();
  const r = await call(ordersApi, "POST", req("/api/orders", { method: "POST", body: { ...FORM, consent: false } }), e);
  assert.equal(r.status, 400); assert.equal(r.body.fields.consent, "required");
  const h = await call(ordersApi, "POST", req("/api/orders", { method: "POST", body: { ...FORM, website: "spam" } }), e);
  assert.equal(h.status, 400);
  assert.equal((await e.DB.prepare("SELECT COUNT(*) n FROM orders").first()).n, 0);
});

test("Finik: payment is created with a valid signature and server-side amount", async () => {
  const calls = [], e = finikEnv(calls);
  const r = await call(ordersApi, "POST", req("/api/orders", { method: "POST", body: { ...FORM, service: "premium", amount: 1 } }), e);
  assert.equal(r.status, 201);
  assert.equal(r.body.pay_mode, "finik");
  assert.match(r.body.pay_url, /^https:\/\/qr\.finik\//);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].signed, true, "request signature verifies with our public key");
  assert.equal(calls[0].body.Amount, 1490);
  assert.equal(calls[0].body.CardType, "FINIK_QR");
  assert.equal(calls[0].body.PaymentId, `${r.body.id}-1`);
  assert.equal(calls[0].body.Data.webhookUrl, SITE + "/api/pay/finik");
  assert.match(calls[0].body.RedirectUrl, /\/ru\/order\/status\/\?o=TG-/);
  assert.match(calls[0].url, /^https:\/\/beta\.api\.acquiring\.averspay\.kg\/v1\/payment$/);
});

async function paidSetup() {
  const e = finikEnv();
  const { createOrder, startPayment } = await import("../lib/orders.js");
  const { data } = validateOrder(FORM);
  const { id, token } = await createOrder(e, data);
  await startPayment(e, await orderRow(e, id), { site: SITE, token });
  return { e, id, token, paymentId: `${id}-1` };
}

test("webhook: valid signature → PAID, admin gets the payment e-mail", async () => {
  const { e, id, paymentId } = await paidSetup();
  const r = await call(hookApi, "POST", await webhook(hook(paymentId)), e);
  assert.equal(r.status, 200); assert.equal(r.body.status, "paid");
  const o = await orderRow(e, id);
  assert.equal(o.status, "PAID"); assert.ok(o.paid_at);
  assert.equal(e.sent.filter(m => /Оплата подтверждена/.test(m.subject)).length, 1);
});

test("webhook: bad signature → 401, order stays unpaid", async () => {
  const { e, id, paymentId } = await paidSetup();
  const forged = await webhook(hook(paymentId), { key: ours.privateKey }); // signed with the wrong key
  const r = await call(hookApi, "POST", forged, e);
  assert.equal(r.status, 401);
  const noSig = req("/api/pay/finik", { method: "POST", body: hook(paymentId) });
  assert.equal((await call(hookApi, "POST", noSig, e)).status, 401);
  // body changed after signing
  const good = await webhook(hook(paymentId));
  const tampered = new Request(good.url, { method: "POST", headers: good.headers, body: JSON.stringify({ ...hook(paymentId), amount: 1 }) });
  assert.equal((await call(hookApi, "POST", tampered, e)).status, 401);
  assert.equal((await orderRow(e, id)).status, "PENDING_PAYMENT");
});

test("webhook: repeated notification is idempotent", async () => {
  const { e, id, paymentId } = await paidSetup();
  await call(hookApi, "POST", await webhook(hook(paymentId)), e);
  const again = await call(hookApi, "POST", await webhook(hook(paymentId)), e);
  assert.equal(again.status, 200); assert.equal(again.body.duplicate, true);
  assert.equal(e.sent.filter(m => /Оплата подтверждена/.test(m.subject)).length, 1);
  assert.equal((await e.DB.prepare("SELECT COUNT(*) n FROM payments WHERE status = 'SUCCEEDED'").first()).n, 1);
  assert.equal((await orderRow(e, id)).status, "PAID");
});

test("webhook: amount or currency mismatch never marks the order paid", async () => {
  for (const over of [{ amount: 10, fields: undefined }, { currency: "USD" }]) {
    const { e, id, paymentId } = await paidSetup();
    const body = hook(paymentId, over); if (!over.fields) body.fields = { paymentId, amount: body.amount };
    const r = await call(hookApi, "POST", await webhook(body), e);
    assert.equal(r.body.status, "mismatch");
    assert.equal((await orderRow(e, id)).status, "PENDING_PAYMENT");
    assert.equal((await e.DB.prepare("SELECT status FROM payments WHERE provider_payment_id = ?").bind(paymentId).first()).status, "MISMATCH");
    assert.equal(e.sent.filter(m => /Проверьте оплату/.test(m.subject)).length, 1);
  }
});

test("failed payment: order becomes PAYMENT_FAILED and can be paid again", async () => {
  const { e, id, token, paymentId } = await paidSetup();
  const r = await call(hookApi, "POST", await webhook(hook(paymentId, { status: "FAILED", tx: "tx-f" })), e);
  assert.equal(r.body.status, "failed");
  assert.equal((await orderRow(e, id)).status, "PAYMENT_FAILED");
  const { startPayment } = await import("../lib/orders.js");
  const again = await startPayment(e, await orderRow(e, id), { site: SITE, token });
  assert.equal(again.ok, true);
  assert.equal((await orderRow(e, id)).status, "PENDING_PAYMENT");
  await call(hookApi, "POST", await webhook(hook(`${id}-2`, { tx: "tx-2" })), e);
  assert.equal((await orderRow(e, id)).status, "PAID");
});

test("public API cannot mark an order paid", async () => {
  const e = env();
  const c = await call(ordersApi, "POST", req("/api/orders", { method: "POST", body: FORM }), e);
  const h = { "x-order-token": c.body.token };
  for (const body of [{ status: "PAID" }, { action: "paid" }, { action: "confirm_payment", amount: 790, reference: "x" }]) {
    const r = await call(orderApi, "POST", req(`/api/orders/${c.body.id}`, { method: "POST", body, headers: h }), e, { id: c.body.id });
    assert.notEqual(r.status, 200);
  }
  const pay = await call(orderApi, "POST", req(`/api/orders/${c.body.id}`, { method: "POST", body: { action: "pay" }, headers: h }), e, { id: c.body.id });
  assert.equal(pay.status, 409, "manual mode: no online payment, no status change");
  const wrong = await call(orderApi, "GET", req(`/api/orders/${c.body.id}`, { headers: { "x-order-token": "nope" } }), e, { id: c.body.id });
  assert.equal(wrong.status, 404);
  const ok = await call(orderApi, "GET", req(`/api/orders/${c.body.id}`, { headers: h }), e, { id: c.body.id });
  assert.equal(ok.body.status, "PENDING_PAYMENT");
  assert.equal(ok.body.token_hash, undefined); assert.equal(ok.body.contact, undefined);
});

test("e-mail queue: retries with backoff, never sends the same notification twice, gives up after max attempts", async () => {
  const e = env(); let fail = 1; const sent = [];
  e.__mailTransport = async m => { if (fail-- > 0) throw new Error("smtp down"); sent.push(m); };
  await e.DB.prepare("INSERT INTO orders (id, token_hash, service, amount, currency, lang, name, contact, event_type, names, status, created_at, updated_at) VALUES ('TG-AAAAAA','x','custom',790,'KGS','ru','A','+996700000000','kyz','A','PENDING_PAYMENT',1,1)").run();
  assert.equal(await queueAndSend(e, "TG-AAAAAA", "new_order"), "PENDING");
  assert.equal(await queueAndSend(e, "TG-AAAAAA", "new_order"), "DUPLICATE");
  await e.DB.prepare("UPDATE email_notifications SET next_at = 0").run();
  assert.equal(await retryDue(e), 1);
  assert.equal(sent.length, 1);
  assert.equal(await retryDue(e), 0, "nothing left to send");
  // permanent failure
  e.__mailTransport = async () => { throw new Error("down"); };
  const id = await queueEmail(e, "TG-AAAAAA", "paid");
  for (let i = 0; i < MAX_ATTEMPTS + 2; i++) { await sendQueued(e, id); }
  const row = await e.DB.prepare("SELECT status, attempts FROM email_notifications WHERE id = ?").bind(id).first();
  assert.equal(row.status, "FAILED"); assert.equal(row.attempts, MAX_ATTEMPTS);
  assert.equal((await orderRow(e, "TG-AAAAAA")).status, "PENDING_PAYMENT", "mail failure does not touch the order");
});

test("admin: no access without a valid session; login works; manual payment needs the exact amount", async () => {
  const e = env({ ADMIN_PASSWORD_HASH: await hashPassword("correct horse battery", 20000), ADMIN_SESSION_SECRET: "s".repeat(40) });
  const c = await call(ordersApi, "POST", req("/api/orders", { method: "POST", body: FORM }), e);
  for (const h of [{}, { authorization: "Bearer 123.abc" }, { authorization: `Bearer ${Date.now() + 1e6}.${"A".repeat(43)}` }]) {
    assert.equal((await call(adminList, "GET", req("/api/admin/orders", { headers: h }), e)).status, 401);
    assert.equal((await call(adminOne, "POST", req(`/api/admin/orders/${c.body.id}`, { method: "POST", headers: h, body: { action: "confirm_payment", amount: 790, reference: "x" } }), e, { id: c.body.id })).status, 401);
  }
  const expired = await makeSession(e, Date.now() - 13 * 3600e3);
  assert.equal((await call(adminList, "GET", req("/api/admin/orders", { headers: { authorization: `Bearer ${expired}` } }), e)).status, 401);
  assert.equal((await call(loginApi, "POST", req("/api/admin/login", { method: "POST", body: { password: "wrong" } }), e)).status, 401);
  const lg = await call(loginApi, "POST", req("/api/admin/login", { method: "POST", body: { password: "correct horse battery" } }), e);
  assert.equal(lg.status, 200);
  const H = { authorization: `Bearer ${lg.body.token}` };
  const list = await call(adminList, "GET", req("/api/admin/orders", { headers: H }), e);
  assert.equal(list.body.orders.length, 1);
  const act = body => call(adminOne, "POST", req(`/api/admin/orders/${c.body.id}`, { method: "POST", headers: H, body }), e, { id: c.body.id });
  assert.equal((await act({ action: "status", status: "PAID" })).status, 409, "PAID is not a manual status");
  assert.equal((await act({ action: "status", status: "IN_PROGRESS" })).status, 409, "unpaid order cannot go to work");
  assert.equal((await act({ action: "confirm_payment", amount: 100, reference: "MBank 12:00" })).status, 409);
  const ok = await act({ action: "confirm_payment", amount: 790, reference: "MBank 12:00" });
  assert.equal(ok.body.order.status, "PAID");
  assert.equal((await act({ action: "status", status: "IN_PROGRESS" })).body.order.status, "IN_PROGRESS");
  assert.equal((await act({ action: "note", note: "позвонить" })).body.order.note, "позвонить");
  assert.equal((await act({ action: "status", status: "COMPLETED" })).body.order.status, "COMPLETED");
  assert.equal((await act({ action: "status", status: "CANCELLED" })).status, 409, "paid orders are not cancelled here");
  const before = e.sent.length;
  await act({ action: "resend", kind: "paid" });
  assert.equal(e.sent.length, before + 1, "admin can resend on purpose");
});

test("e-mail: MIME message is valid UTF-8 with an encoded subject, no secrets in it", async () => {
  const { mime, render } = await import("../lib/mailer.js");
  const o = { id: "TG-ABCDEF", service: "premium", amount: 1490, currency: "KGS", status: "PAID", created_at: Date.now(), paid_at: Date.now(), name: "Айгерим", contact: "+996700123456", event_type: "kyz", names: "Айзада" };
  const msg = render({ SITE_URL: "https://toigo.app" }, "paid", o);
  assert.match(msg.subject, /TG-ABCDEF/); assert.match(msg.text, /\/admin\/#TG-ABCDEF/);
  const raw = mime("orders@toigo.app", "admin@example.com", msg);
  assert.match(raw, /^From: =\?UTF-8\?B\?/); assert.match(raw, /\r\nSubject: =\?UTF-8\?B\?/);
  const body = raw.split("\r\n\r\n")[1].replace(/\r\n/g, "");
  assert.equal(Buffer.from(body, "base64").toString("utf8"), msg.text);
});
