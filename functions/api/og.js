// Link-preview image (1200×630 JPEG) for each invitation: drawn in the owner's browser from the real cover
// right after saving, stored here, and used as og:image so WhatsApp/Telegram show a card with the couple's names.
import { json, err, checkKey, dbMissing, allow } from "../../lib/server.js";

const MAX = 700_000;
let ready = false;
export async function ensureOg(env) {
  if (ready) return;
  await env.DB.prepare("CREATE TABLE IF NOT EXISTS og_images (invitation_id INTEGER PRIMARY KEY, bytes BLOB NOT NULL, updated INTEGER NOT NULL)").run();
  ready = true;
}

// Version stamp for the invitation's preview image, or 0 when there is none yet.
export async function ogVersion(env, invitationId) {
  try { await ensureOg(env); const r = await env.DB.prepare("SELECT updated FROM og_images WHERE invitation_id = ?").bind(invitationId).first(); return r ? r.updated : 0; }
  catch { return 0; }
}

export async function deleteOg(env, invitationId) {
  try { await ensureOg(env); await env.DB.prepare("DELETE FROM og_images WHERE invitation_id = ?").bind(invitationId).run(); } catch {}
}

// POST /api/invitations/:slug/og  (header X-Edit-Key, body image/jpeg)
export async function onRequestPost({ request, env, params }) {
  const miss = dbMissing(env); if (miss) return miss;
  if (!(await allow(env, request, "og", 60, 3600))) return err("rate_limited", 429);
  const row = await checkKey(env, params.slug, request.headers.get("x-edit-key") || "");
  if (!row) return err("not_found", 404);
  if ((request.headers.get("content-type") || "").split(";")[0].trim() !== "image/jpeg") return err("bad_type", 415);
  const buf = await request.arrayBuffer();
  if (!buf.byteLength || buf.byteLength > MAX) return err("too_large", 413);
  const h = new Uint8Array(buf.slice(0, 3));
  if (!(h[0] === 0xFF && h[1] === 0xD8 && h[2] === 0xFF)) return err("bad_type", 415);
  await ensureOg(env);
  const now = Date.now();
  await env.DB.prepare("INSERT INTO og_images (invitation_id, bytes, updated) VALUES (?, ?, ?) ON CONFLICT(invitation_id) DO UPDATE SET bytes = excluded.bytes, updated = excluded.updated").bind(row.id, buf, now).run();
  return json({ ok: true, v: now });
}

// GET /og/:slug.jpg → the image (the ?v= stamp in og:image busts caches when it changes)
export async function onRequestGet({ request, env, params, waitUntil }) {
  if (!env.DB) return new Response("Not found", { status: 404 });
  const cache = caches.default;
  const hit = await cache.match(request);
  if (hit) return hit;
  await ensureOg(env);
  const r = await env.DB.prepare("SELECT o.bytes FROM og_images o JOIN invitations i ON i.id = o.invitation_id WHERE i.slug = ?").bind(params.slug).first();
  if (!r) return new Response("Not found", { status: 404 });
  const bytes = r.bytes instanceof ArrayBuffer ? r.bytes : new Uint8Array(r.bytes);
  const res = new Response(bytes, { headers: { "content-type": "image/jpeg", "cache-control": "public, max-age=86400", "x-content-type-options": "nosniff" } });
  waitUntil(cache.put(request, res.clone()));
  return res;
}
