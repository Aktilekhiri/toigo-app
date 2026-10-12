// Toigo — Cloudflare Worker entry. Routes API and invitation pages to the handlers in /functions,
// serves everything else from /public (static assets), and applies site-wide headers.
import * as invitations from "../functions/api/invitations/index.js";
import * as invitation from "../functions/api/invitations/[slug].js";
import * as rsvp from "../functions/api/rsvp/[slug].js";
import * as photos from "../functions/api/photos.js";
import * as media from "../functions/media/[id].js";
import * as invPage from "../functions/i/[slug].js";
import * as sitemap from "../functions/sitemap.xml.js";
import * as robots from "../functions/robots.txt.js";

const ROUTES = [
  [/^\/api\/invitations\/?$/, invitations, []],
  [/^\/api\/invitations\/([a-z0-9-]+)\/?$/, invitation, ["slug"]],
  [/^\/api\/rsvp\/([a-z0-9-]+)\/?$/, rsvp, ["slug"]],
  [/^\/api\/photos\/?$/, photos, []],
  [/^\/media\/([a-z0-9]+)$/, media, ["id"]],
  [/^\/i\/([a-z0-9-]+)\/?$/, invPage, ["slug"]],
  [/^\/i\/([a-z0-9-]+)\/([a-z0-9]{5})\/?$/, invPage, ["slug", "code"]],
  [/^\/sitemap\.xml$/, sitemap, []],
  [/^\/robots\.txt$/, robots, []]
];

const METHOD = { GET: "onRequestGet", HEAD: "onRequestGet", POST: "onRequestPost", PUT: "onRequestPut", DELETE: "onRequestDelete" };

async function route(request, env, ctx) {
  const url = new URL(request.url);
  for (const [re, mod, names] of ROUTES) {
    const m = re.exec(url.pathname);
    if (!m) continue;
    const fn = mod[METHOD[request.method]];
    if (!fn) return new Response("Method not allowed", { status: 405 });
    const params = Object.fromEntries(names.map((n, i) => [n, m[i + 1]]));
    return fn({ request, env, params, waitUntil: p => ctx.waitUntil(p) });
  }
  return env.ASSETS.fetch(request);
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    // One address for SEO: www.toigo.app → toigo.app
    if (url.hostname.startsWith("www.")) {
      url.hostname = url.hostname.slice(4);
      return Response.redirect(url.toString(), 301);
    }
    let res;
    try { res = await route(request, env, ctx); }
    catch (e) { console.error(e); res = new Response(JSON.stringify({ error: "server_error" }), { status: 500, headers: { "content-type": "application/json" } }); }

    const headers = new Headers(res.headers);
    headers.set("x-content-type-options", "nosniff");
    headers.set("referrer-policy", "strict-origin-when-cross-origin");
    headers.set("permissions-policy", "camera=(), microphone=(), geolocation=()");
    headers.set("x-frame-options", "SAMEORIGIN");
    // Hide technical copies (*.workers.dev, *.pages.dev) from search engines.
    if (/\.(workers|pages)\.dev$/.test(url.hostname)) headers.set("x-robots-tag", "noindex");
    if (url.pathname.startsWith("/manage/") || url.pathname.startsWith("/ru/manage/")) headers.set("x-robots-tag", "noindex");

    const type = headers.get("content-type") || "";
    if (!type.includes("text/html") || request.method === "HEAD") return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
    // Fill absolute URLs (canonical, hreflang, og:url, JSON-LD) with the real domain.
    const text = (await res.text()).replaceAll("__ORIGIN__", url.origin);
    headers.delete("content-length");
    headers.delete("etag");
    return new Response(text, { status: res.status, statusText: res.statusText, headers });
  }
};
