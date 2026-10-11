// Shared helpers for Cloudflare Pages Functions.

export const json = (data, status = 200, extra = {}) =>
  new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...extra } });

export const err = (code, status = 400) => json({ error: code }, status);

export function randomId(n = 20) {
  const abc = "abcdefghijkmnopqrstuvwxyz23456789";
  const b = crypto.getRandomValues(new Uint8Array(n));
  let s = ""; for (const x of b) s += abc[x % abc.length]; return s;
}

export async function sha256(s) {
  const h = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(h)].map(b => b.toString(16).padStart(2, "0")).join("");
}

// Constant-time-ish comparison for hex hashes.
export function same(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
  let r = 0; for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i); return r === 0;
}

// Simple fixed-window rate limit stored in D1. Returns true when allowed.
export async function allow(env, request, bucket, limit, windowSec) {
  const ip = request.headers.get("cf-connecting-ip") || "0";
  const k = `${bucket}:${ip}`, now = Math.floor(Date.now() / 1000);
  const row = await env.DB.prepare("SELECT n, reset_at FROM rate WHERE k = ?").bind(k).first();
  if (!row || row.reset_at <= now) {
    await env.DB.prepare("INSERT INTO rate (k, n, reset_at) VALUES (?, 1, ?) ON CONFLICT(k) DO UPDATE SET n = 1, reset_at = excluded.reset_at").bind(k, now + windowSec).run();
    return true;
  }
  if (row.n >= limit) return false;
  await env.DB.prepare("UPDATE rate SET n = n + 1 WHERE k = ?").bind(k).run();
  return true;
}

export async function readJson(request, max = 64 * 1024) {
  const len = +(request.headers.get("content-length") || 0);
  if (len > max) throw new Error("too_large");
  const text = await request.text();
  if (text.length > max) throw new Error("too_large");
  return JSON.parse(text);
}

export async function checkKey(env, slug, key) {
  if (!slug || !key) return null;
  const row = await env.DB.prepare("SELECT id, slug, key_hash, data, views, created_at, updated_at FROM invitations WHERE slug = ?").bind(slug).first();
  if (!row) return null;
  return same(row.key_hash, await sha256(key)) ? row : null;
}

export function dbMissing(env) {
  return !env.DB ? err("db_not_bound", 500) : null;
}
