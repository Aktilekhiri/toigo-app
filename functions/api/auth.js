// Toigo — accounts: sign in with Google (Google Identity Services) or Telegram (Login Widget).
// A signed session token (no cookies) is kept by the browser and sent as "Authorization: Bearer …".
// The subscription key (TOI-…) and the invitations belong to the account, so they are visible on any phone.
//
//   GET  /api/auth/config        { google: client id, tg: bot username }
//   POST /api/auth/google        { credential, key? } → { token, user }
//   POST /api/auth/telegram      { user: widget fields, key? } → { token, user }
//   GET  /api/auth/me            { user, access, invites }
//   POST /api/auth/link-key      { key } attach an older TOI key to the account
//
// Settings (Cloudflare → Worker toigo-app → Variables): GOOGLE_CLIENT_ID (defaults to the diamond.kg client id),
// SESSION_SECRET (optional; TG_SECRET is used when it is missing), TG_BOT_TOKEN (for Telegram sign-in).
import { json } from "../../lib/server.js";

const DEFAULT_GOOGLE_CLIENT_ID = "518817395915-no7t3fbhk2c29na7p5p6skkgv57cu2f0.apps.googleusercontent.com";
const SESSION_DAYS = 90;
const enc = new TextEncoder();
const now = () => Date.now();
export const googleClientId = env => String(env.GOOGLE_CLIENT_ID || DEFAULT_GOOGLE_CLIENT_ID).trim();
const secret = env => String(env.SESSION_SECRET || env.TG_SECRET || "").trim();

const b64u = buf => { let s = ""; new Uint8Array(buf).forEach(b => { s += String.fromCharCode(b); }); return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); };
const unb64u = s => { s = String(s).replace(/-/g, "+").replace(/_/g, "/"); while (s.length % 4) s += "="; return Uint8Array.from(atob(s), c => c.charCodeAt(0)); };
const hex = buf => [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
async function hmac(key, msg, raw) {
  const k = await crypto.subtle.importKey("raw", typeof key === "string" ? enc.encode(key) : key, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", k, enc.encode(msg));
  return raw ? sig : b64u(sig);
}
const same = (a, b) => { if (a.length !== b.length) return false; let r = 0; for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i); return r === 0; };

// ---------- tables ----------
let ready = false;
export async function ensureAuth(env) {
  if (ready) return;
  await env.DB.prepare("CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, provider TEXT NOT NULL, name TEXT NOT NULL DEFAULT '', email TEXT NOT NULL DEFAULT '', picture TEXT NOT NULL DEFAULT '', license_key TEXT, created INTEGER NOT NULL, last_login INTEGER NOT NULL)").run();
  const cols = (await env.DB.prepare("PRAGMA table_info(invitations)").all()).results.map(c => c.name);
  if (!cols.includes("user_id")) await env.DB.prepare("ALTER TABLE invitations ADD COLUMN user_id TEXT").run();
  if (!cols.includes("key_enc")) await env.DB.prepare("ALTER TABLE invitations ADD COLUMN key_enc TEXT").run();
  await env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_inv_user ON invitations(user_id)").run();
  ready = true;
}

// ---------- sessions ----------
async function makeSession(env, uid) {
  const exp = String(now() + SESSION_DAYS * 864e5), body = b64u(enc.encode(uid));
  return ["s1", body, exp, await hmac(secret(env), `toigo:${uid}:${exp}`)].join(".");
}
// Returns the user row or null.
export async function userFromRequest(request, env) {
  if (!secret(env)) return null;
  const t = (request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  const [v, body, exp, sig] = t.split(".");
  if (v !== "s1" || !body || !exp || !sig || Number(exp) < now()) return null;
  let uid; try { uid = new TextDecoder().decode(unb64u(body)); } catch { return null; }
  if (!/^[gt]:[\w-]{3,40}$/.test(uid)) return null;
  if (!same(sig, await hmac(secret(env), `toigo:${uid}:${exp}`))) return null;
  await ensureAuth(env);
  return await env.DB.prepare("SELECT * FROM users WHERE id = ?").bind(uid).first();
}

// ---------- edit keys of invitations, stored encrypted so the owner can see manage links on any device ----------
async function aesKey(env) {
  const raw = await crypto.subtle.digest("SHA-256", enc.encode("inv-key:" + secret(env)));
  return crypto.subtle.importKey("raw", raw, "AES-GCM", false, ["encrypt", "decrypt"]);
}
export async function sealKey(env, key) {
  if (!secret(env)) return null;
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await aesKey(env), enc.encode(key));
  return b64u(iv) + "." + b64u(ct);
}
async function openKey(env, s) {
  try { const [iv, ct] = String(s).split("."); return new TextDecoder().decode(await crypto.subtle.decrypt({ name: "AES-GCM", iv: unb64u(iv) }, await aesKey(env), unb64u(ct))); } catch { return null; }
}

// ---------- Google ----------
let jwks = { at: 0, keys: [] };
async function googleKeys(force) {
  if (!force && jwks.keys.length && now() - jwks.at < 3600e3) return jwks.keys;
  const r = await fetch("https://www.googleapis.com/oauth2/v3/certs"); if (!r.ok) throw new Error("jwks");
  jwks = { at: now(), keys: (await r.json()).keys || [] }; return jwks.keys;
}
async function verifyGoogle(env, idToken) {
  try {
    const [h, p, s] = String(idToken || "").split("."); if (!s) return null;
    const header = JSON.parse(new TextDecoder().decode(unb64u(h))), payload = JSON.parse(new TextDecoder().decode(unb64u(p)));
    if (header.alg !== "RS256" || !header.kid) return null;
    let jwk = (await googleKeys()).find(k => k.kid === header.kid) || (await googleKeys(true)).find(k => k.kid === header.kid);
    if (!jwk) return null;
    const key = await crypto.subtle.importKey("jwk", { kty: jwk.kty, n: jwk.n, e: jwk.e, alg: "RS256", ext: true }, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
    if (!(await crypto.subtle.verify("RSASSA-PKCS1-v1_5", key, unb64u(s), enc.encode(h + "." + p)))) return null;
    if (payload.aud !== googleClientId(env)) return null;
    if (!["https://accounts.google.com", "accounts.google.com"].includes(payload.iss)) return null;
    if (!payload.exp || payload.exp * 1000 < now() || !/^\d{5,40}$/.test(String(payload.sub || ""))) return null;
    return { id: "g:" + payload.sub, name: String(payload.name || "").slice(0, 100), email: String(payload.email || "").slice(0, 200), picture: String(payload.picture || "").slice(0, 500) };
  } catch { return null; }
}

// ---------- Telegram Login Widget ----------
async function verifyTelegram(env, u) {
  if (!env.TG_BOT_TOKEN || !u || typeof u !== "object" || !u.hash || !u.id) return null;
  const fields = Object.keys(u).filter(k => k !== "hash" && u[k] !== undefined && u[k] !== null).sort().map(k => `${k}=${u[k]}`).join("\n");
  const secretKey = await crypto.subtle.digest("SHA-256", enc.encode(String(env.TG_BOT_TOKEN).trim()));
  const sig = hex(await hmac(secretKey, fields, true));
  if (!same(sig, String(u.hash).toLowerCase())) return null;
  if (!u.auth_date || now() / 1000 - Number(u.auth_date) > 86400) return null;
  const name = [u.first_name, u.last_name].filter(Boolean).join(" ") || (u.username ? "@" + u.username : "Telegram");
  return { id: "t:" + String(u.id).replace(/\D/g, ""), name: name.slice(0, 100), email: u.username ? "@" + String(u.username).slice(0, 60) : "", picture: String(u.photo_url || "").slice(0, 500) };
}

let botName = { at: 0, v: "" };
async function telegramBot(env) {
  if (env.TG_BOT_USERNAME) return String(env.TG_BOT_USERNAME).replace(/^@/, "").trim();
  if (!env.TG_BOT_TOKEN) return "";
  if (botName.v && now() - botName.at < 6 * 3600e3) return botName.v;
  try {
    const r = await fetch(`${env.TG_API || "https://api.telegram.org"}/bot${String(env.TG_BOT_TOKEN).trim()}/getMe`).then(r => r.json());
    if (r.ok && r.result && r.result.username) botName = { at: now(), v: r.result.username };
  } catch {}
  return botName.v;
}

async function login(env, prof, oldKey, provider) {
  await ensureAuth(env);
  const t = now();
  await env.DB.prepare(`INSERT INTO users (id, provider, name, email, picture, created, last_login) VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET name = excluded.name, email = CASE WHEN excluded.email != '' THEN excluded.email ELSE users.email END, picture = excluded.picture, last_login = excluded.last_login`)
    .bind(prof.id, provider, prof.name, prof.email, prof.picture, t, t).run();
  if (oldKey) await attachKey(env, prof.id, oldKey).catch(() => {});
  return { token: await makeSession(env, prof.id), user: { name: prof.name, email: prof.email, picture: prof.picture, provider } };
}

// Attach an older TOI key (bought before accounts) to the account, if it is valid and the account has none or a weaker one.
export async function attachKey(env, uid, key) {
  const { normKey, keyInfo } = await import("./pay.js");
  const k = normKey(key), info = await keyInfo(env, k);
  if (!info) return { error: "badkey" };
  const u = await env.DB.prepare("SELECT license_key FROM users WHERE id = ?").bind(uid).first();
  const cur = u && u.license_key ? await keyInfo(env, u.license_key) : null;
  const score = i => !i ? -1 : i.expires === null ? Infinity : i.expires;
  if (score(info) > score(cur)) await env.DB.prepare("UPDATE users SET license_key = ? WHERE id = ?").bind(k, uid).run();
  return { ok: true };
}

export async function handleAuth(request, env, url) {
  await ensureAuth(env);
  const p = url.pathname.replace(/\/$/, "");
  if (p === "/api/auth/config") return json({ google: googleClientId(env), tg: await telegramBot(env) });
  if (!secret(env)) return json({ error: "notready" }, 503);

  if (p === "/api/auth/google" && request.method === "POST") {
    const b = await request.json().catch(() => ({}));
    const prof = await verifyGoogle(env, b.credential);
    if (!prof) return json({ error: "google" }, 401);
    return json(await login(env, prof, b.key, "google"));
  }
  if (p === "/api/auth/telegram" && request.method === "POST") {
    const b = await request.json().catch(() => ({}));
    const prof = await verifyTelegram(env, b.user);
    if (!prof) return json({ error: "telegram" }, 401);
    return json(await login(env, prof, b.key, "telegram"));
  }

  const user = await userFromRequest(request, env);
  if (!user) return json({ error: "login" }, 401);

  if (p === "/api/auth/me" && request.method === "GET") {
    const { keyInfo } = await import("./pay.js");
    const info = user.license_key ? await keyInfo(env, user.license_key) : null;
    const { results } = await env.DB.prepare("SELECT slug, key_enc, data, created_at FROM invitations WHERE user_id = ? ORDER BY created_at DESC LIMIT 100").bind(user.id).all();
    const invites = [];
    for (const r of results) {
      let d = {}; try { d = JSON.parse(r.data); } catch {}
      invites.push({ slug: r.slug, key: r.key_enc ? await openKey(env, r.key_enc) : null, n1: d.n1 || "", n2: d.n2 || "", type: d.type || "", title: d.title || "", date: d.date || "", at: r.created_at });
    }
    return json({
      user: { name: user.name, email: user.email, picture: user.picture, provider: user.provider },
      access: { licensed: !!(info && (info.expires === null || info.expires > now())), expires: info ? info.expires : null, key: user.license_key || null },
      invites
    });
  }
  if (p === "/api/auth/link-key" && request.method === "POST") {
    const b = await request.json().catch(() => ({}));
    const r = await attachKey(env, user.id, b.key);
    return r.ok ? json({ ok: true }) : json({ error: r.error }, 404);
  }
  return json({ error: "not_found" }, 404);
}
