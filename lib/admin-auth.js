// Admin authentication: one admin, password stored only as a PBKDF2 hash (secret ADMIN_PASSWORD_HASH),
// sessions are short-lived HMAC-signed tokens (secret ADMIN_SESSION_SECRET). Checked on every admin API call.
const enc = new TextEncoder();
const b64 = buf => { let s = ""; for (const c of new Uint8Array(buf)) s += String.fromCharCode(c); return btoa(s); };
const unb64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
const b64url = buf => b64(buf).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

export const SESSION_TTL = 12 * 3600e3;

async function pbkdf2(password, salt, iter) {
  const key = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  return crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations: iter }, key, 256);
}

/** Format: pbkdf2_sha256$<iterations>$<salt b64>$<hash b64>. Workers allow at most 100000 iterations. */
export async function hashPassword(password, iter = 100000) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return `pbkdf2_sha256$${iter}$${b64(salt)}$${b64(await pbkdf2(password, salt, iter))}`;
}

function eq(a, b) {
  if (a.length !== b.length) return false;
  let r = 0; for (let i = 0; i < a.length; i++) r |= a[i] ^ b[i]; return r === 0;
}

export async function checkPassword(stored, password) {
  const p = String(stored || "").split("$");
  if (p.length !== 4 || p[0] !== "pbkdf2_sha256" || typeof password !== "string" || !password) return false;
  const iter = Math.min(100000, +p[1] || 0); if (iter < 10000) return false;
  const got = new Uint8Array(await pbkdf2(password, unb64(p[2]), iter));
  return eq(got, unb64(p[3]));
}

async function hmac(secret, data) {
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return b64url(await crypto.subtle.sign("HMAC", key, enc.encode(data)));
}

export async function makeSession(env, now = Date.now()) {
  const exp = now + SESSION_TTL;
  return `${exp}.${await hmac(env.ADMIN_SESSION_SECRET, `admin:${exp}`)}`;
}

export async function isAdmin(env, request) {
  if (!env.ADMIN_SESSION_SECRET || !env.ADMIN_PASSWORD_HASH) return false;
  const h = request.headers.get("authorization") || "";
  const m = /^Bearer (\d{10,16})\.([A-Za-z0-9_-]{20,})$/.exec(h);
  if (!m || +m[1] < Date.now()) return false;
  const want = await hmac(env.ADMIN_SESSION_SECRET, `admin:${m[1]}`);
  return eq(enc.encode(want), enc.encode(m[2]));
}
