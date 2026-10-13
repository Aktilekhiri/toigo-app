import { json, err, readJson, dbMissing } from "../../../../lib/server.js";
import { isAdmin } from "../../../../lib/admin-auth.js";
import { setStatus } from "../../../../lib/orders.js";
import { priceOf, CURRENCY } from "../../../../lib/services.js";
import { queueAndSend } from "../../../../lib/mailer.js";

async function load(env, id) {
  const o = await env.DB.prepare("SELECT * FROM orders WHERE id = ?").bind(id).first();
  if (!o) return null;
  const { results: payments } = await env.DB.prepare("SELECT id, provider, provider_payment_id, provider_tx_id, amount, currency, status, error, created_at, confirmed_at FROM payments WHERE order_id = ? ORDER BY id").bind(id).all();
  const { results: emails } = await env.DB.prepare("SELECT id, kind, status, attempts, last_error, created_at, sent_at FROM email_notifications WHERE order_id = ? ORDER BY id").bind(id).all();
  delete o.token_hash;
  return { order: o, payments: payments || [], emails: emails || [] };
}

// GET /api/admin/orders/:id → order, payments, e-mail log
export async function onRequestGet({ request, env, params }) {
  const miss = dbMissing(env); if (miss) return miss;
  if (!(await isAdmin(env, request))) return err("unauthorized", 401);
  const r = await load(env, params.id);
  return r ? json(r) : err("not_found", 404);
}

// Allowed manual status changes. PAID is never set here: only a verified webhook or confirm_payment does that.
const NEXT = { IN_PROGRESS: ["PAID"], COMPLETED: ["PAID", "IN_PROGRESS"], CANCELLED: ["PENDING_PAYMENT", "PAYMENT_FAILED"] };

// POST /api/admin/orders/:id { action, ... }
export async function onRequestPost({ request, env, params }) {
  const miss = dbMissing(env); if (miss) return miss;
  if (!(await isAdmin(env, request))) return err("unauthorized", 401);
  let b; try { b = await readJson(request, 8 * 1024); } catch { return err("bad_json"); }
  const o = await env.DB.prepare("SELECT * FROM orders WHERE id = ?").bind(params.id).first();
  if (!o) return err("not_found", 404);
  const now = Date.now();
  switch (b && b.action) {
    case "note":
      await env.DB.prepare("UPDATE orders SET note = ?, updated_at = ? WHERE id = ?").bind(String(b.note || "").slice(0, 4000), now, o.id).run();
      break;
    case "result_url": {
      const u = String(b.url || "").trim();
      if (u && !/^https:\/\/[^\s]{4,300}$/.test(u)) return err("bad_url");
      await env.DB.prepare("UPDATE orders SET result_url = ?, updated_at = ? WHERE id = ?").bind(u || null, now, o.id).run();
      break;
    }
    case "status":
      if (!NEXT[b.status] || !NEXT[b.status].includes(o.status)) return err("bad_transition", 409);
      await setStatus(env, o.id, b.status);
      break;
    case "confirm_payment": {
      // Manual bank transfer (MBank / O!Bank) checked by the admin in their bank app.
      if (!["PENDING_PAYMENT", "PAYMENT_FAILED"].includes(o.status)) return err("not_payable", 409);
      if (Number(b.amount) !== priceOf(o.service)) return err("amount_mismatch", 409);
      const ref = String(b.reference || "").trim().slice(0, 120);
      if (ref.length < 3) return err("reference_required");
      await env.DB.prepare("INSERT INTO payments (order_id, provider, provider_payment_id, provider_tx_id, amount, currency, status, error, created_at, confirmed_at) VALUES (?, 'manual', ?, ?, ?, ?, 'SUCCEEDED', ?, ?, ?)")
        .bind(o.id, `${o.id}-manual-${now}`, `manual-${o.id}-${now}`, priceOf(o.service), CURRENCY, ref, now, now).run();
      await setStatus(env, o.id, "PAID", { paid_at: now });
      await queueAndSend(env, o.id, "paid");
      break;
    }
    case "resend":
      if (!["new_order", "paid"].includes(b.kind)) return err("bad_kind");
      if (b.kind === "paid" && !o.paid_at) return err("not_paid", 409);
      await queueAndSend(env, o.id, b.kind, { force: true });
      break;
    default: return err("bad_action");
  }
  return json(await load(env, o.id));
}
