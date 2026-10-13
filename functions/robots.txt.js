export function onRequestGet({ request }) {
  const origin = new URL(request.url).origin;
  const body = `User-agent: *
Allow: /
Disallow: /api/
Disallow: /manage/
Disallow: /ru/manage/
Disallow: /order/status/
Disallow: /ru/order/status/
Disallow: /admin/

Sitemap: ${origin}/sitemap.xml
`;
  return new Response(body, { headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=3600" } });
}
