import { json, err, allow, readJson, dbMissing } from "../../../lib/server.js";
import { orderByToken, publicView, startPayment, siteUrl } from "../../../lib/orders.js";

const token = request => request.headers.get("x-order-token") || "";

// GET /api/orders/:id  (header x-order-token) → status for the customer
export async function onRequestGet({ request, env, params }) {
  const miss = dbMissing(env); if (miss) return miss;
  const o = await orderByToken(env, params.id, token(request));
  if (!o) return err("not_found", 404);
  return json(publicView(o, env));
}

// POST /api/orders/:id  { action: "pay" } → (re)start online payment for an unpaid order
export async function onRequestPost({ request, env, params }) {
  const miss = dbMissing(env); if (miss) return miss;
  if (!(await allow(env, request, "pay", 20, 3600))) return err("rate_limited", 429);
  let body; try { body = await readJson(request, 2048); } catch { return err("bad_json"); }
  const t = token(request);
  const o = await orderByToken(env, params.id, t);
  if (!o) return err("not_found", 404);
  if (!body || body.action !== "pay") return err("bad_action");
  const r = await startPayment(env, o, { site: siteUrl(env, request), token: t });
  return r.ok ? json({ pay_url: r.url }) : err(r.error, 409);
}
