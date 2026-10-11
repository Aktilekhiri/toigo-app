import { PAGES, LASTMOD } from "../lib/pages.js";

// Sitemap with hreflang pairs (Kyrgyz + Russian) for every public page.
export function onRequestGet({ request }) {
  const o = new URL(request.url).origin;
  const urls = PAGES.flatMap(p => [p.ky, p.ru].map(loc => `  <url>
    <loc>${o}${loc}</loc>
    <lastmod>${LASTMOD}</lastmod>
    <changefreq>${p.freq}</changefreq>
    <priority>${p.prio}</priority>
    <xhtml:link rel="alternate" hreflang="ky" href="${o}${p.ky}"/>
    <xhtml:link rel="alternate" hreflang="ru" href="${o}${p.ru}"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="${o}${p.ky}"/>
  </url>`)).join("\n");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls}
</urlset>`;
  return new Response(xml, { headers: { "content-type": "application/xml; charset=utf-8", "cache-control": "public, max-age=3600" } });
}
