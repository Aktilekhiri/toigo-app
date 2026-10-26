import { clean, baseSlug } from "../../../public/assets/invite-core.js";
import { json, err, randomId, sha256, allow, readJson, dbMissing } from "../../../lib/server.js";
import { canCreate, useFree, PRICE } from "../pay.js";

// POST /api/invitations  → create an invitation. Returns { slug, key }.
export async function onRequestPost({ request, env }) {
  const miss = dbMissing(env); if (miss) return miss;
  if (!(await allow(env, request, "create", 15, 3600))) return err("rate_limited", 429);
  let body; try { body = await readJson(request); } catch { return err("bad_json"); }
  if (body && body.website) return err("bad_request"); // honeypot
  const data = clean(body);
  if (!data.n1) return err("name_required");
  // First invitation per device is free, then lifetime access (500 som, key).
  const gate = await canCreate(env, request);
  if (!gate.ok) return json({ error: gate.error, price: PRICE }, gate.status);

  const base = baseSlug(data);
  let slug = base;
  for (let i = 0; i < 6; i++) {
    const exists = await env.DB.prepare("SELECT 1 FROM invitations WHERE slug = ?").bind(slug).first();
    if (!exists) break;
    slug = `${base}-${randomId(4)}`;
  }
  const key = randomId(24), now = Date.now();
  const res = await env.DB.prepare("INSERT INTO invitations (slug, key_hash, data, created_at, updated_at) VALUES (?, ?, ?, ?, ?)")
    .bind(slug, await sha256(key), JSON.stringify(data), now, now).run();
  const id = res.meta.last_row_id;
  await useFree(env, gate);
  if (data.photos.length) {
    const qs = data.photos.map(() => "?").join(",");
    await env.DB.prepare(`UPDATE photos SET invitation_id = ? WHERE invitation_id IS NULL AND id IN (${qs})`).bind(id, ...data.photos).run();
  }
  // Housekeeping: drop photos uploaded but never used (older than a day) and expired rate-limit rows.
  const day = Date.now() - 86400000, nowSec = Math.floor(Date.now() / 1000);
  await env.DB.batch([
    env.DB.prepare("DELETE FROM photos WHERE invitation_id IS NULL AND created_at < ?").bind(day),
    env.DB.prepare("DELETE FROM rate WHERE reset_at < ?").bind(nowSec)
  ]).catch(() => {});
  return json({ slug, key }, 201);
}
