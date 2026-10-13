// Finik acquiring (https://www.finik.kg/documentation/web-sdk/) — create a QR payment and verify webhooks.
// Requests are signed with our RSA private key; webhooks are verified with Finik's public key.
import { canonical, sign, verify } from "./rsa.js";

const BASE = { beta: "https://beta.api.acquiring.averspay.kg", prod: "https://api.acquiring.averspay.kg" };

export function finikReady(env) {
  return env.PAYMENT_MODE === "finik" && !!(env.FINIK_API_KEY && env.FINIK_ACCOUNT_ID && env.FINIK_PRIVATE_KEY && env.FINIK_PUBLIC_KEY);
}
const base = env => (env.FINIK_ENV === "prod" ? BASE.prod : BASE.beta);

/**
 * Create a payment. Returns { ok: true, url } with the hosted payment page, or { ok: false, error }.
 * paymentId must be unique per attempt (max 36 chars); amount is in KGS, computed on our server.
 */
export async function finikCreatePayment(env, { paymentId, amount, redirectUrl, webhookUrl, title, lang }, fetchImpl = fetch) {
  const url = new URL("/v1/payment", base(env));
  const headers = { Host: url.host, "x-api-key": env.FINIK_API_KEY, "x-api-timestamp": String(Date.now()) };
  const body = {
    Amount: amount,
    CardType: "FINIK_QR",
    PaymentId: paymentId,
    RedirectUrl: redirectUrl,
    Lang: lang === "ru" ? "ru" : "ky",
    Data: { accountId: env.FINIK_ACCOUNT_ID, name_en: title.slice(0, 60), webhookUrl }
  };
  const data = canonical({ method: "POST", path: url.pathname, headers, body });
  const signature = await sign(env.FINIK_PRIVATE_KEY, data);
  const sorted = JSON.parse(data.slice(data.lastIndexOf("\n") + 1)); // the exact body that was signed
  let res;
  try {
    res = await fetchImpl(url.toString(), {
      method: "POST", redirect: "manual",
      headers: { "content-type": "application/json", "x-api-key": headers["x-api-key"], "x-api-timestamp": headers["x-api-timestamp"], signature },
      body: JSON.stringify(sorted)
    });
  } catch (e) { return { ok: false, error: "network" }; }
  const loc = res.headers.get("location");
  if (res.status >= 300 && res.status < 400 && loc) return { ok: true, url: loc };
  // Some gateways answer 200 with JSON instead of a redirect.
  if (res.ok) {
    const j = await res.json().catch(() => null);
    const link = j && (j.paymentUrl || j.url || j.redirectUrl || j.Location);
    if (link) return { ok: true, url: link };
  }
  return { ok: false, error: `http_${res.status}` };
}

/**
 * Verify a Finik webhook. `raw` is the request body text. Returns the parsed body when the
 * signature is valid, otherwise null. Host is our own host (Finik signs the URL it calls).
 */
export async function finikVerifyWebhook(env, request, raw) {
  const sig = request.headers.get("signature");
  if (!sig || !env.FINIK_PUBLIC_KEY) return null;
  let body; try { body = JSON.parse(raw); } catch { return null; }
  const url = new URL(request.url);
  const headers = { Host: request.headers.get("host") || url.host };
  for (const [k, v] of request.headers) if (k.toLowerCase().startsWith("x-api-")) headers[k.toLowerCase()] = v;
  const query = Object.fromEntries(url.searchParams);
  const data = canonical({ method: request.method, path: url.pathname, headers, query, body });
  return (await verify(env.FINIK_PUBLIC_KEY, data, sig)) ? body : null;
}
