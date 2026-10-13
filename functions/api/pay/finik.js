import { json, dbMissing } from "../../../lib/server.js";
import { handleFinikWebhook } from "../../../lib/orders.js";

// POST /api/pay/finik → Finik webhook (signature-checked, idempotent)
export async function onRequestPost({ request, env, waitUntil }) {
  const miss = dbMissing(env); if (miss) return miss;
  const r = await handleFinikWebhook(env, request, waitUntil);
  return json(r.body, r.code);
}
