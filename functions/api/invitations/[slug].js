import { clean } from "../../../public/assets/invite-core.js";
import { json, err, readJson, checkKey, dbMissing, allow, randomId } from "../../../lib/server.js";

const keyOf = request => request.headers.get("x-edit-key") || "";

// GET /api/invitations/:slug  (header X-Edit-Key) → data, guests, views
export async function onRequestGet({ request, env, params }) {
  const miss = dbMissing(env); if (miss) return miss;
  if (!(await allow(env, request, "manage", 120, 3600))) return err("rate_limited", 429);
  const row = await checkKey(env, params.slug, keyOf(request));
  if (!row) return err("not_found", 404);
  const { results } = await env.DB.prepare("SELECT id, name, attending, guests, note, guest_id, created_at FROM rsvps WHERE invitation_id = ? ORDER BY created_at DESC").bind(row.id).all();
  const inv = await env.DB.prepare("SELECT id, code, name, phone, opens, opened_at, created_at FROM guests WHERE invitation_id = ? ORDER BY id").bind(row.id).all();
  return json({ slug: row.slug, data: JSON.parse(row.data), views: row.views, created_at: row.created_at, updated_at: row.updated_at, guests: results, invitees: inv.results });
}

// PUT /api/invitations/:slug  → update data
export async function onRequestPut({ request, env, params }) {
  const miss = dbMissing(env); if (miss) return miss;
  const row = await checkKey(env, params.slug, keyOf(request));
  if (!row) return err("not_found", 404);
  let body; try { body = await readJson(request); } catch { return err("bad_json"); }
  const data = clean(body);
  if (!data.n1) return err("name_required");
  await env.DB.prepare("UPDATE invitations SET data = ?, updated_at = ? WHERE id = ?").bind(JSON.stringify(data), Date.now(), row.id).run();
  if (data.photos.length) {
    const qs = data.photos.map(() => "?").join(",");
    await env.DB.prepare(`UPDATE photos SET invitation_id = ? WHERE invitation_id IS NULL AND id IN (${qs})`).bind(row.id, ...data.photos).run();
  }
  // Remove photos no longer used by this invitation.
  const keep = data.photos.length ? data.photos : ["-"];
  await env.DB.prepare(`DELETE FROM photos WHERE invitation_id = ? AND id NOT IN (${keep.map(() => "?").join(",")})`).bind(row.id, ...keep).run();
  return json({ ok: true, slug: row.slug });
}

// DELETE /api/invitations/:slug  → delete invitation, answers and photos
export async function onRequestDelete({ request, env, params }) {
  const miss = dbMissing(env); if (miss) return miss;
  const row = await checkKey(env, params.slug, keyOf(request));
  if (!row) return err("not_found", 404);
  await env.DB.batch([
    env.DB.prepare("DELETE FROM rsvps WHERE invitation_id = ?").bind(row.id),
    env.DB.prepare("DELETE FROM photos WHERE invitation_id = ?").bind(row.id),
    env.DB.prepare("DELETE FROM guests WHERE invitation_id = ?").bind(row.id),
    env.DB.prepare("DELETE FROM invitations WHERE id = ?").bind(row.id)
  ]);
  return json({ ok: true });
}

// DELETE /api/invitations/:slug?rsvp=ID  is handled through POST to keep it simple
export async function onRequestPost({ request, env, params }) {
  const miss = dbMissing(env); if (miss) return miss;
  const row = await checkKey(env, params.slug, keyOf(request));
  if (!row) return err("not_found", 404);
  let body; try { body = await readJson(request); } catch { return err("bad_json"); }
  if (body && body.action === "delete_rsvp" && Number.isInteger(body.id)) {
    await env.DB.prepare("DELETE FROM rsvps WHERE id = ? AND invitation_id = ?").bind(body.id, row.id).run();
    return json({ ok: true });
  }
  // Personal links: up to 500 named guests per invitation.
  if (body && body.action === "add_guests" && Array.isArray(body.guests)) {
    const have = await env.DB.prepare("SELECT COUNT(*) AS n FROM guests WHERE invitation_id = ?").bind(row.id).first();
    const list = body.guests.map(g => ({ name: String(g.name || "").replace(/\s+/g, " ").trim().slice(0, 80), phone: String(g.phone || "").replace(/[^\d+]/g, "").slice(0, 16) }))
      .filter(g => g.name).slice(0, Math.max(0, 500 - have.n));
    if (!list.length) return err(have.n >= 500 ? "too_many" : "name_required");
    const now = Date.now();
    await env.DB.batch(list.map(g => env.DB.prepare("INSERT INTO guests (invitation_id, code, name, phone, created_at) VALUES (?, ?, ?, ?, ?)").bind(row.id, randomId(5), g.name, g.phone || null, now)));
    return json({ ok: true, added: list.length });
  }
  if (body && body.action === "delete_guest" && Number.isInteger(body.id)) {
    await env.DB.batch([
      env.DB.prepare("UPDATE rsvps SET guest_id = NULL WHERE guest_id = ? AND invitation_id = ?").bind(body.id, row.id),
      env.DB.prepare("DELETE FROM guests WHERE id = ? AND invitation_id = ?").bind(body.id, row.id)
    ]);
    return json({ ok: true });
  }
  return err("bad_request");
}
