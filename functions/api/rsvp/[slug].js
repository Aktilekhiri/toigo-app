import { json, err, allow, readJson, dbMissing } from "../../../lib/server.js";

// POST /api/rsvp/:slug  → a guest answers
export async function onRequestPost({ request, env, params }) {
  const miss = dbMissing(env); if (miss) return miss;
  if (!(await allow(env, request, "rsvp", 30, 3600))) return err("rate_limited", 429);
  let b; try { b = await readJson(request, 8 * 1024); } catch { return err("bad_json"); }
  if (b.website) return json({ ok: true }); // honeypot: pretend success
  const name = String(b.name || "").trim().slice(0, 60);
  if (!name) return err("name_required");
  const attending = b.attending ? 1 : 0;
  const guests = attending ? Math.min(20, Math.max(1, parseInt(b.guests, 10) || 1)) : 0;
  const note = String(b.note || "").trim().slice(0, 300);
  const inv = await env.DB.prepare("SELECT id FROM invitations WHERE slug = ?").bind(params.slug).first();
  if (!inv) return err("not_found", 404);
  const count = await env.DB.prepare("SELECT COUNT(*) AS n FROM rsvps WHERE invitation_id = ?").bind(inv.id).first();
  if (count.n >= 2000) return err("too_many", 429);
  let guestId = null;
  if (/^[a-z0-9]{5}$/.test(b.g || "")) {
    const g = await env.DB.prepare("SELECT id FROM guests WHERE invitation_id = ? AND code = ?").bind(inv.id, b.g).first();
    if (g) {
      guestId = g.id;
      // One answer per personal link: a new answer replaces the previous one.
      await env.DB.prepare("DELETE FROM rsvps WHERE invitation_id = ? AND guest_id = ?").bind(inv.id, guestId).run();
    }
  }
  await env.DB.prepare("INSERT INTO rsvps (invitation_id, name, attending, guests, note, guest_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)")
    .bind(inv.id, name, attending, guests, note, guestId, Date.now()).run();
  return json({ ok: true }, 201);
}
