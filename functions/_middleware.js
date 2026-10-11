// 1) www.toigo.app → toigo.app (one address for SEO).
// 2) *.pages.dev copies are hidden from search engines, so only the real domain is indexed.
// 3) Fills absolute URLs (canonical, hreflang, og:url, JSON-LD) with the real domain.
export async function onRequest({ request, next }) {
  const url = new URL(request.url);
  if (url.hostname.startsWith("www.")) {
    url.hostname = url.hostname.slice(4);
    return Response.redirect(url.toString(), 301);
  }
  const res = await next();
  const type = res.headers.get("content-type") || "";
  const headers = new Headers(res.headers);
  headers.set("x-content-type-options", "nosniff");
  headers.set("referrer-policy", "strict-origin-when-cross-origin");
  headers.set("permissions-policy", "camera=(), microphone=(), geolocation=()");
  headers.set("x-frame-options", "SAMEORIGIN");
  if (url.hostname.endsWith(".pages.dev")) headers.set("x-robots-tag", "noindex");
  if (!type.includes("text/html")) return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
  const text = (await res.text()).replaceAll("__ORIGIN__", url.origin);
  headers.delete("content-length");
  return new Response(text, { status: res.status, statusText: res.statusText, headers });
}
