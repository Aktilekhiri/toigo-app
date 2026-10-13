import { json, err, allow, readJson, dbMissing } from "../../../lib/server.js";
import { validateOrder, createOrder, startPayment, siteUrl, statusUrl } from "../../../lib/orders.js";
import { finikReady } from "../../../lib/finik.js";

// POST /api/orders → create an order. The price is computed on the server from lib/services.js.
export async function onRequestPost({ request, env, waitUntil }) {
  const miss = dbMissing(env); if (miss) return miss;
  if (!(await allow(env, request, "order", 6, 3600))) return err("rate_limited", 429);
  let body; try { body = await readJson(request, 16 * 1024); } catch { return err("bad_json"); }
  if (body && body.website) return err("bad_request"); // honeypot
  const v = validateOrder(body);
  if (!v.ok) return json({ error: "invalid", fields: v.errors }, 400);
  const site = siteUrl(env, request);
  const o = await createOrder(env, v.data, waitUntil);
  const out = { id: o.id, token: o.token, amount: o.amount, status_url: statusUrl("", o.id, o.token, v.data.lang), pay_mode: finikReady(env) ? "finik" : "manual" };
  if (finikReady(env)) {
    const row = await env.DB.prepare("SELECT * FROM orders WHERE id = ?").bind(o.id).first();
    const r = await startPayment(env, row, { site, token: o.token });
    if (r.ok) out.pay_url = r.url; else out.pay_error = r.error;
  }
  return json(out, 201);
}
