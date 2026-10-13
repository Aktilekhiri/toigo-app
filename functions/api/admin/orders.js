import { json, err, dbMissing } from "../../../lib/server.js";
import { isAdmin } from "../../../lib/admin-auth.js";
import { ORDER_STATUS } from "../../../lib/services.js";

// GET /api/admin/orders?status=&q= → latest orders (admin only)
export async function onRequestGet({ request, env }) {
  const miss = dbMissing(env); if (miss) return miss;
  if (!(await isAdmin(env, request))) return err("unauthorized", 401);
  const url = new URL(request.url);
  const st = url.searchParams.get("status"), q = (url.searchParams.get("q") || "").trim().slice(0, 60);
  const where = [], vals = [];
  if (ORDER_STATUS.includes(st)) { where.push("status = ?"); vals.push(st); }
  if (q) { where.push("(id LIKE ? OR name LIKE ? OR contact LIKE ? OR email LIKE ?)"); const like = `%${q}%`; vals.push(like.toUpperCase(), like, like, like.toLowerCase()); }
  const sql = `SELECT id, service, amount, currency, name, contact, event_type, event_date, status, created_at, paid_at FROM orders ${where.length ? "WHERE " + where.join(" AND ") : ""} ORDER BY created_at DESC LIMIT 200`;
  const { results } = await env.DB.prepare(sql).bind(...vals).all();
  const { results: counts } = await env.DB.prepare("SELECT status, COUNT(*) AS n FROM orders GROUP BY status").all();
  return json({ orders: results || [], counts: Object.fromEntries((counts || []).map(r => [r.status, r.n])) });
}
