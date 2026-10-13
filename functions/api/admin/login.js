import { json, err, allow, readJson, dbMissing } from "../../../lib/server.js";
import { checkPassword, makeSession, SESSION_TTL } from "../../../lib/admin-auth.js";

// POST /api/admin/login { password } → { token, exp }
export async function onRequestPost({ request, env }) {
  const miss = dbMissing(env); if (miss) return miss;
  if (!env.ADMIN_PASSWORD_HASH || !env.ADMIN_SESSION_SECRET) return err("admin_not_configured", 503);
  if (!(await allow(env, request, "admin-login", 8, 900))) return err("rate_limited", 429);
  let body; try { body = await readJson(request, 1024); } catch { return err("bad_json"); }
  if (!(await checkPassword(env.ADMIN_PASSWORD_HASH, body && body.password))) {
    console.log(JSON.stringify({ evt: "admin_login_failed" }));
    return err("bad_password", 401);
  }
  return json({ token: await makeSession(env), exp: Date.now() + SESSION_TTL });
}
