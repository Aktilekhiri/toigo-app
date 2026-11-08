import { renderInvitation, titleOf, longDate, TYPES, esc } from "../../public/assets/invite-core.js";
import { VERSION } from "../../lib/pages.js";
import { PREM_THEME } from "../../public/assets/invite-premium.js";
import { ogVersion } from "../api/og.js";

const notFound = origin => new Response(`<!doctype html><html lang="ky"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Чакыруу табылган жок</title>
<style>body{font-family:system-ui,sans-serif;display:grid;place-items:center;min-height:100vh;margin:0;padding:16px;text-align:center;color:#16191D;background:#fff}a{color:#16191D}</style></head>
<body><div><h1 style="font-weight:500">Чакыруу табылган жок</h1><p>Приглашение не найдено. Шилтемени текшериңиз / Проверьте ссылку.</p><p><a href="${origin}/">Тойго</a></p></div></body></html>`,
  { status: 404, headers: { "content-type": "text/html; charset=utf-8" } });

export async function onRequestGet({ request, env, params, waitUntil }) {
  const url = new URL(request.url), origin = url.origin;
  if (!env.DB) return new Response("Database is not connected (binding DB).", { status: 500 });
  const row = await env.DB.prepare("SELECT id, slug, data FROM invitations WHERE slug = ?").bind(params.slug).first();
  if (!row) return notFound(origin);
  waitUntil(env.DB.prepare("UPDATE invitations SET views = views + 1 WHERE id = ?").bind(row.id).run());

  // Personal link /i/<slug>/<code>: greet the guest by name and prefill the answer form.
  let guest = null;
  if (params.code) {
    guest = await env.DB.prepare("SELECT id, code, name, seat FROM guests WHERE invitation_id = ? AND code = ?").bind(row.id, params.code).first();
    if (!guest) return Response.redirect(`${origin}/i/${row.slug}`, 302);
    waitUntil(env.DB.prepare("UPDATE guests SET opens = opens + 1, opened_at = COALESCE(opened_at, ?) WHERE id = ?").bind(Date.now(), guest.id).run());
  }

  const d = JSON.parse(row.data);
  const lang = d.lang === "ru" ? "ru" : "ky";
  const title = guest ? (lang === "ky" ? `${guest.name}, сизди чакырабыз — ${titleOf(d, d.lang)}` : `${guest.name}, приглашаем вас — ${titleOf(d, d.lang)}`) : titleOf(d, d.lang);
  const descParts = [longDate(d.date, lang), d.time, d.venue].filter(Boolean);
  const desc = (lang === "ky" ? "Сиздерди тоюбузга чакырабыз. " : "Приглашаем вас на наш праздник. ") + descParts.join(" · ");
  // Preview card: the image drawn from this invitation's own cover; older invitations fall back to their
  // first photo or the Toigo card (never the design sample, which shows example names).
  const ogV = await ogVersion(env, row.id);
  const ogImage = ogV ? `${origin}/og/${row.slug}.jpg?v=${ogV}` : d.photos && d.photos.length ? `${origin}/media/${d.photos[0]}` : `${origin}/img/og-${lang}.png`;
  const pageUrl = `${origin}/i/${row.slug}${guest ? "/" + guest.code : ""}`;
  // Opening screen: one tap opens the invitation full screen (where the browser allows it) and starts the music.
  const ky = lang === "ky";
  const spType = d.type === "custom" && d.title ? d.title : (TYPES[d.type] ? TYPES[d.type][ky ? "ky" : "ru"] : "");
  const spNames = d.n2 ? `${esc(d.n1)}<span class="sp-amp">&amp;</span>${esc(d.n2)}` : esc(d.n1);
  const splash = `<div class="sp" role="dialog" aria-modal="true" aria-label="${esc(title)}">
  <div class="sp-in">${guest ? `<p class="sp-g">${ky ? "Урматтуу" : "Дорогой гость"} ${esc(guest.name)}!</p>` : ""}
    <p class="sp-ey">${esc(spType)}</p>
    <p class="sp-nm">${spNames}</p>
    ${d.date ? `<p class="sp-dt">${esc(longDate(d.date, lang))}</p>` : ""}
    <button type="button" class="sp-go" data-act="open">${ky ? "Чакырууну ачуу" : "Открыть приглашение"}</button>
    ${d.music ? `<p class="sp-mu">♪ ${ky ? "музыка менен" : "с музыкой"}</p>` : ""}
  </div></div>
  <button type="button" class="sp-x" data-act="exitfs" hidden aria-label="${ky ? "Толук экрандан чыгуу" : "Выйти из полноэкранного режима"}">×</button>`;
  const body = renderInvitation(d, { mode: "live", slug: row.slug, pf: "g", guest }).replace(/(<div class="inv[^"]*"[^>]*>)/, `$1${splash}`);
  const themeColor = { ivory: "#FAF7F0", anarp: "#6E1735", emerald: "#124B40", steps: "#DCEEF8", golden: "#171717", pop: "#FFF9F3", heritage: "#842E3A", botanical: "#FFFFFF", midnight: "#0B1428", editorial: "#FFFFFF", alatoo: "#1D2742", akkalpak: "#FFFFFF", shyrdak: "#7E2A20", jibek: "#E3E8DF", anar: "#5B1626", asman: "#DCEAF4", ...PREM_THEME }[d.tpl] || "#FFFFFF";

  const html = `<!doctype html>
<html lang="${lang === "ky" ? "ky" : "ru"}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta name="robots" content="noindex, nofollow">
<meta name="theme-color" content="${themeColor}">
<link rel="canonical" href="${pageUrl}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Тойго">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${pageUrl}">
<meta property="og:image" content="${ogImage}">${ogV ? `\n<meta property="og:image:width" content="1200">\n<meta property="og:image:height" content="630">` : ""}
<meta property="og:locale" content="${lang === "ky" ? "ky_KG" : "ru_RU"}">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="/assets/fonts.css?v=${VERSION}">
<link rel="stylesheet" href="/assets/invite.css?v=${VERSION}">
</head>
<body class="inv-page sp-wait">
${body}
<script type="module">
import { startLive } from "/assets/invite-live.js?v=${VERSION}";
startLive();
try { if (localStorage.getItem("toigo-rsvp-${row.slug}${guest ? "-" + guest.code : ""}")) { const f = document.querySelector(".inv form.rsvp"); if (f) { f.hidden = true; f.nextElementSibling.hidden = false; } } } catch (e) {}
</script>
</body>
</html>`;
  return new Response(html, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-cache", "x-robots-tag": "noindex" } });
}
