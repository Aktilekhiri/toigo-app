import { json, err, allow, randomId, dbMissing } from "../../lib/server.js";

const MAX = 1_500_000; // 1.5 MB after in-browser compression
const TYPES = ["image/jpeg", "image/webp", "image/png"];

// POST /api/photos  body: raw image bytes, content-type image/*  → { id }
export async function onRequestPost({ request, env }) {
  const miss = dbMissing(env); if (miss) return miss;
  if (!(await allow(env, request, "photo", 40, 3600))) return err("rate_limited", 429);
  const mime = (request.headers.get("content-type") || "").split(";")[0].trim();
  if (!TYPES.includes(mime)) return err("bad_type", 415);
  const len = +(request.headers.get("content-length") || 0);
  if (len > MAX) return err("too_large", 413);
  const buf = await request.arrayBuffer();
  if (!buf.byteLength || buf.byteLength > MAX) return err("too_large", 413);
  const head = new Uint8Array(buf.slice(0, 12));
  const isJpeg = head[0] === 0xFF && head[1] === 0xD8;
  const isPng = head[0] === 0x89 && head[1] === 0x50;
  const isWebp = head[8] === 0x57 && head[9] === 0x45 && head[10] === 0x42 && head[11] === 0x50;
  if (!(isJpeg || isPng || isWebp)) return err("bad_type", 415);
  const id = randomId(20);
  await env.DB.prepare("INSERT INTO photos (id, invitation_id, mime, bytes, created_at) VALUES (?, NULL, ?, ?, ?)").bind(id, mime, buf, Date.now()).run();
  return json({ id }, 201);
}
