// GET /media/:id → photo bytes, cached at the edge for a year (ids never change).
export async function onRequestGet({ request, env, params, waitUntil }) {
  if (!/^[a-z0-9]{20}$/.test(params.id || "")) return new Response("Not found", { status: 404 });
  const cache = caches.default;
  const hit = await cache.match(request);
  if (hit) return hit;
  const row = await env.DB.prepare("SELECT mime, bytes FROM photos WHERE id = ?").bind(params.id).first();
  if (!row) return new Response("Not found", { status: 404 });
  const bytes = row.bytes instanceof ArrayBuffer ? row.bytes : new Uint8Array(row.bytes);
  const res = new Response(bytes, { headers: { "content-type": row.mime, "cache-control": "public, max-age=31536000, immutable", "x-content-type-options": "nosniff" } });
  waitUntil(cache.put(request, res.clone()));
  return res;
}
