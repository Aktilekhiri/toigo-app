// RSA-SHA256 (PKCS#1 v1.5) signing in the format of Finik's @mancho.devs/authorizer, on WebCrypto.
// Works in Cloudflare Workers and Node 20+ (globalThis.crypto.subtle). No dependencies.

const enc = new TextEncoder();

// ---- canonical string (same rules as Signer.getData) ----
export function canonical({ method, path, headers, query, body }) {
  const host = headers.Host ?? headers.host;
  if (!host) throw new Error("host_required");
  const xkeys = Object.keys(headers).filter(k => k.toLowerCase().startsWith("x-api-")).sort();
  const hdr = [`host:${host}`, ...xkeys.map(k => `${k.toLowerCase()}:${headers[k]}`)].join("&");
  const q = Object.keys(query || {}).sort().map(k => `${encodeURI(decodeURI(k))}=${encodeURI(decodeURI(query[k] ?? ""))}`).join("&");
  let b = "";
  if (body) {
    const sorted = Object.entries(body).sort((a, c) => a[0].localeCompare(c[0])).reduce((o, [k, v]) => (o[k] = v, o), {});
    b = JSON.stringify(sorted);
  }
  const parts = [method.toLowerCase(), decodeURI(path || "")];
  parts.push(hdr);
  if (q) parts.push(q);
  parts.push(b);
  return parts.join("\n");
}

// ---- PEM / DER helpers ----
function pemBody(pem) { return pem.replace(/-----[^-]+-----/g, "").replace(/\\n/g, "").replace(/\s+/g, ""); }
function b64ToBytes(b64) { const s = atob(b64); const u = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); return u; }
export function bytesToB64(buf) { const u = new Uint8Array(buf); let s = ""; for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode(...u.subarray(i, i + 0x8000)); return btoa(s); }
function derLen(n) { if (n < 128) return [n]; const out = []; while (n) { out.unshift(n & 255); n >>= 8; } return [0x80 | out.length, ...out]; }
const tlv = (tag, bytes) => Uint8Array.from([tag, ...derLen(bytes.length), ...bytes]);
const RSA_ALG = Uint8Array.from([0x30, 0x0d, 0x06, 0x09, 0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x01, 0x01, 0x05, 0x00]);
// PKCS#1 "RSA PRIVATE KEY" → PKCS#8; "RSA PUBLIC KEY" → SPKI (WebCrypto only imports the latter forms).
const pkcs1ToPkcs8 = k => tlv(0x30, [...Uint8Array.from([0x02, 0x01, 0x00]), ...RSA_ALG, ...tlv(0x04, k)]);
const pkcs1ToSpki = k => tlv(0x30, [...RSA_ALG, ...tlv(0x03, [0x00, ...k])]);

const ALG = { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" };

export async function importPrivate(pem) {
  let der = b64ToBytes(pemBody(pem));
  if (/BEGIN RSA PRIVATE KEY/.test(pem)) der = pkcs1ToPkcs8(der);
  return crypto.subtle.importKey("pkcs8", der, ALG, false, ["sign"]);
}
export async function importPublic(pem) {
  let der = b64ToBytes(pemBody(pem));
  if (/BEGIN RSA PUBLIC KEY/.test(pem)) der = pkcs1ToSpki(der);
  return crypto.subtle.importKey("spki", der, ALG, false, ["verify"]);
}

export async function sign(privatePem, data) {
  const key = await importPrivate(privatePem);
  return bytesToB64(await crypto.subtle.sign(ALG, key, enc.encode(data)));
}
export async function verify(publicPem, data, signatureB64) {
  try {
    const key = await importPublic(publicPem);
    return await crypto.subtle.verify(ALG, key, b64ToBytes(String(signatureB64 || "").trim()), enc.encode(data));
  } catch { return false; }
}
