// Static site generator for Chakyr. Run: node tools/build.mjs (from project root)
import fs from "node:fs";
import path from "node:path";
import { TYPES, TPL, TRACKS, DEFAULTS, TYPE_TEXT, coverHTML, renderInvitation, invClass, esc } from "../public/assets/invite-core.js";
import { C, UI, CATS, SUPPORT } from "./content.mjs";
import { ILLUS } from "./illus.mjs";
import { PREM_SWATCH } from "../public/assets/invite-premium.js";

const OUT = "public";
const LASTMOD = new Date().toISOString().slice(0, 10);
const V = Date.now().toString(36); // cache-busting for css/js
const O = "__ORIGIN__";             // replaced by functions/_middleware.js with the real domain

const u = (lang, p) => (lang === "ky" ? p : "/ru" + p);
const write = (p, html) => { const f = path.join(OUT, p.endsWith("/") ? p + "index.html" : p); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, html); };

const HORN = '<svg class="orn" viewBox="0 0 40 24" aria-hidden="true"><path d="M20 23C20 13 15 6 9 6C4 6 2 10 3.5 13C5 16 9.5 15.5 9.5 12.5C9.5 10.5 7.5 9.5 6.3 10.6M20 23C20 13 25 6 31 6C36 6 38 10 36.5 13C35 16 30.5 15.5 30.5 12.5C30.5 10.5 32.5 9.5 33.7 10.6M20 23V2M17 5L20 2L23 5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';
const ICON = {
  rsvp: '<path d="M4 12l5 5L20 6"/>',
  list: '<path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01"/>',
  timer: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2.5M9 2h6"/>',
  map: '<path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
  photo: '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-8 8"/>',
  music: '<path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/>',
  lang: '<path d="M4 5h9M8.5 3v2M6 5c1 4 3.5 7 7 8.5M11 5c-1 4-3.5 7-7 8.5M13 21l4-10 4 10M14.5 17.5h5"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16v4zM14 6l4 4"/>',
  phone: '<rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M11 18.5h2"/>',
  link: '<path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1 1M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1-1"/>'
};
const TG_URL = "https://t.me/toigoapp";
const TG_SVG = '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M21.4 4.2 2.9 11.3c-1.3.5-1.2 1.2-.2 1.5l4.7 1.5 1.8 5.6c.2.6.4.8.9.8.4 0 .6-.2.9-.4l2.3-2.2 4.7 3.5c.9.5 1.5.2 1.7-.8l3.1-14.5c.3-1.3-.5-1.9-1.4-1.6zM9.6 14.1l8.3-5.3c.4-.2.7-.1.4.2l-7 6.4-.3 3.1z"/></svg>';
const icon = k => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[k]}</svg>`;

function sampleData(tplId, typeId, lang) {
  const t = TYPE_TEXT[typeId][lang === "ru" ? "ru" : "ky"];
  return { ...DEFAULTS, tpl: tplId, type: typeId, lang, n1: t.n1, n2: t.n2, msg: t.msg, prog: t.prog, age: typeId === "maarake" ? 60 : typeId === "tuulgan" ? 25 : "",
    hosts: lang === "ru" ? "Семья Асановых" : DEFAULTS.hosts,
    venue: lang === "ru" ? "Тойкана «Шумкар»" : DEFAULTS.venue, addr: lang === "ru" ? "Бишкек, проспект Чүй, 150" : DEFAULTS.addr };
}

// ---------- layout ----------
function head(lang, m) {
  const alt = m.alt; // { ky: path, ru: path } or null
  const canonical = O + m.path;
  return `<!doctype html>
<html lang="${C[lang].htmlLang}">
<head>
<meta charset="utf-8">
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-RSYZ3T9W8C"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-RSYZ3T9W8C');
</script>
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${esc(m.title)}</title>
<meta name="description" content="${esc(m.desc)}">
${m.noindex ? '<meta name="robots" content="noindex, follow">' : '<meta name="robots" content="index, follow, max-image-preview:large">'}
<link rel="canonical" href="${canonical}">
${alt ? `<link rel="alternate" hreflang="ky" href="${O}${alt.ky}">
<link rel="alternate" hreflang="ru" href="${O}${alt.ru}">
<link rel="alternate" hreflang="x-default" href="${O}${alt.ky}">` : ""}
<meta name="theme-color" content="#FFFFFF">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Тойго">
<meta property="og:title" content="${esc(m.title)}">
<meta property="og:description" content="${esc(m.desc)}">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${O}${m.og || `/img/og-${lang}.png`}">
<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta property="og:locale" content="${C[lang].ogLocale}">
<meta property="og:locale:alternate" content="${lang === "ky" ? "ru_RU" : "ky_KG"}">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
<link rel="preload" href="/assets/fonts/yeseva-one-cyrillic-400-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/assets/fonts/rubik-cyrillic-400-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/assets/fonts.css?v=${V}">
<link rel="stylesheet" href="/assets/site.css?v=${V}">
<link rel="stylesheet" href="/assets/invite.css?v=${V}">
<script type="importmap">{"imports":{"three":"/assets/vendor/three.module.min.js"}}</script>
${(m.jsonld || []).map(j => `<script type="application/ld+json">${JSON.stringify(j)}</script>`).join("\n")}
</head>`;
}

function header(lang, m) {
  const N = C[lang].nav, home = u(lang, "/");
  const a = h => (m.isHome ? h : home + h);
  return `<a class="skip" href="#main">${lang === "ky" ? "Негизги мазмунга өтүү" : "Перейти к содержимому"}</a>
<header class="hdr"><div class="wrap">
  <a class="brand" href="${home}" aria-label="Тойго">${HORN}Тойго</a>
  <nav class="nav" aria-label="${lang === "ky" ? "Негизги меню" : "Основное меню"}">
    <a href="${a("#designs")}">${N.designs}</a><a href="${a("#how")}">${N.how}</a><a href="${a("#faq")}">${N.faq}</a><a href="${a("#price")}">${N.support}</a>
  </nav>
  <div class="lang" role="group" aria-label="Тил / Язык">
    <a href="${m.alt ? m.alt.ky : "/"}" hreflang="ky" lang="ky" ${lang === "ky" ? 'aria-current="true"' : ""}>KG</a>
    <a href="${m.alt ? m.alt.ru : "/ru/"}" hreflang="ru" lang="ru" ${lang === "ru" ? 'aria-current="true"' : ""}>RU</a>
  </div>
  <a class="btn btn-p btn-sm" href="${u(lang, "/create/")}">${N.create}</a>
</div></header>`;
}

function priceBlock(lang) {
  const P = C[lang].price;
  return `<section class="sec price" id="price" aria-labelledby="price-h"><div class="wrap prc">
  <div>
    <div class="eyebrow">${HORN}${P.k}</div>
    <h2 id="price-h" style="margin-top:14px">${P.h}</h2>
    <p>${P.p}</p>
    <p class="prc-pay">${P.pay}</p>
  </div>
  <div class="prc-cards">
    <div class="prc-card"><span>${P.free}</span><b>${P.freeP}</b><p class="prc-year"><i>${P.freeNote}</i></p><ul>${P.freeList.map(x => `<li>${x}</li>`).join("")}</ul><a class="btn btn-g" href="${u(lang, "/create/")}#buy">${P.btn}</a></div>
    <div class="prc-card prc-main"><span>${P.per}</span><b>${P.sum}</b>
      <ul>${P.list.map(x => `<li>${x.replace("{n}", TPL.length)}</li>`).join("")}</ul>
      <a class="btn btn-gold" href="${u(lang, "/create/")}#buy">${P.buy}</a></div>
  </div>
  <a class="prc-custom" href="${u(lang, "/custom/")}"><i class="prc-tag">${lang === "ru" ? "Под ключ" : "Даяр кылып беребиз"}</i><span><b>${C[lang].custom.cta}</b>${C[lang].custom.ctaP}</span><em><strong>400 сом</strong><u>${C[lang].custom.ctaBtn} →</u></em></a>
</div></section>`;
}

// Mobile bottom navigation (like diamond.kg): always within thumb reach on phones.
const BN_IC = {
  home: '<path d="M3 11.5 12 4l9 7.5"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>',
  designs: '<rect x="3.5" y="3.5" width="7" height="7" rx="1.8"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.8"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.8"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.8"/>',
  create: '<path d="M12 5v14M5 12h14"/>',
  mine: '<rect x="4" y="3.5" width="16" height="17" rx="2.5"/><path d="M8 8.5h8M8 12.5h8M8 16.5h5"/>',
  price: '<path d="M20.5 12.6 12.6 20.5a2 2 0 0 1-2.8 0l-6.3-6.3a2 2 0 0 1-.6-1.4V5.5a2 2 0 0 1 2-2h7.3a2 2 0 0 1 1.4.6l6.3 6.3a2 2 0 0 1 0 2.8z"/><circle cx="8" cy="8" r="1.4"/>'
};
function bottomNav(lang, m) {
  const N = C[lang].nav, home = u(lang, "/");
  const items = [["home", home], ["designs", home + "#designs"], ["create", u(lang, "/create/")], ["mine", u(lang, "/manage/")], ["price", home + "#price"]];
  return `<nav class="bnav" aria-label="${N.bnLabel}">${items.map(([id, href], i) => `<a class="bn-i${id === "create" ? " bn-c" : ""}${m.nav === id ? " on" : ""}" href="${href}"${m.nav === id ? ' aria-current="page"' : ""}><span class="bn-ic"><svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${BN_IC[id]}</svg></span><span class="bn-tx">${N.bn[i]}</span></a>`).join("")}</nav>`;
}

function footer(lang) {
  const F = C[lang].footer, N = C[lang].nav;
  return `<footer class="ftr"><div class="wrap">
  <div class="cols">
    <div><a class="brand" href="${u(lang, "/")}">${HORN}Тойго</a><p style="margin-top:12px;max-width:36ch">${F.tag}</p></div>
    <div><h3>${F.types}</h3><ul>${CATS.map(c => `<li><a href="${u(lang, `/toi/${c.path}/`)}">${TYPES[c.id][lang]}</a></li>`).join("")}</ul></div>
    <div><h3>${F.site}</h3><ul><li><a href="${u(lang, "/create/")}">${N.create}</a></li><li><a href="${u(lang, "/manage/")}">${N.mine}</a></li><li><a href="${u(lang, "/custom/")}">${N.custom}</a></li><li><a href="${TG_URL}" target="_blank" rel="noopener">${N.tg}</a></li><li><a href="${u(lang, "/")}#faq">${N.faq}</a></li><li><a href="${u(lang, "/")}#price">${N.support}</a></li><li><a href="${u(lang, "/privacy/")}">${F.privacy}</a></li></ul></div>
  </div>
  <div class="copy"><span>© ${new Date().getFullYear()} Тойго. ${F.rights}</span><span><a href="/" lang="ky">Кыргызча</a> · <a href="/ru/" lang="ru">Русский</a></span></div>
</div></footer>
<script type="module" src="/assets/site.js?v=${V}"></script>`;
}

const page = (lang, m, body) => `${head(lang, m)}
<body>
${header(lang, m)}
<main id="main">
${body}
</main>
${m.noSupport ? "" : priceBlock(lang)}
${footer(lang)}
${bottomNav(lang, m)}
</body>
</html>`;

// ---------- reusable sections ----------
function cards(lang, list, typeHint) {
  const K = C[lang].card;
  return `<div class="grid">${list.map(t => {
    const type = typeHint && t.types.includes(typeHint) ? typeHint : t.types[0];
    const d = sampleData(t.id, type, lang);
    return `<article class="card" data-types="${t.types.join(" ")}">
      <a class="mini" href="${u(lang, `/demo/${t.id}/`)}" aria-label="${esc(t.name[lang])}: ${K.view}"><div class="${invClass(t.id, d.type)}">${coverHTML(d, { mini: true }).replace(/<h1 class="nm"/, '<div class="nm"').replace(/<\/h1>/, "</div>")}</div></a>
      <div class="card-b">
        <h3>${t.name[lang]}</h3>
        <p>${t.desc[lang]}</p>
        <div class="tags">${t.types.map(k => `<span>${TYPES[k][lang]}</span>`).join("")}</div>
        <div class="card-acts"><a class="btn btn-p btn-sm" href="${u(lang, `/create/`)}?tpl=${t.id}${typeHint ? `&amp;type=${typeHint}` : ""}">${K.choose}</a><a class="btn btn-g btn-sm" href="${u(lang, `/demo/${t.id}/`)}">${K.view}</a></div>
      </div></article>`;
  }).join("")}</div>`;
}

function catsRow(lang) {
  return `<ul class="cats">${CATS.map(c => `<li><a href="${u(lang, `/toi/${c.path}/`)}">
    <span class="cat-img" style="--c:${c.c};--cf:${c.cf}">${ILLUS[c.id]}</span>
    <span>${TYPES[c.id][lang]}</span></a></li>`).join("")}</ul>`;
}

function stepsSec(lang) {
  const H = C[lang].home;
  return `<section class="sec" id="how" aria-labelledby="how-h"><div class="wrap">
  <div class="sec-h"><div><div class="k">${H.how_k}</div><h2 id="how-h">${H.how_h}</h2></div></div>
  <ol class="steps">${H.steps.map(s => `<li><h3>${s[0]}</h3><p>${s[1]}</p></li>`).join("")}</ol>
</div></section>`;
}

function faqSec(lang, items) {
  const H = C[lang].home;
  return `<section class="sec" id="faq" aria-labelledby="faq-h"><div class="wrap">
  <div class="sec-h"><div><div class="k">${H.faq_k}</div><h2 id="faq-h">${H.faq_h}</h2></div></div>
  <div class="faq">${items.map((q, i) => `<details${i === 0 ? " open" : ""}><summary>${q[0]}</summary><p>${q[1]}</p></details>`).join("")}</div>
</div></section>`;
}

function bandSec(lang) {
  const H = C[lang].home;
  return `<section class="sec" style="padding-top:0"><div class="wrap"><div class="band">
  <div><h2>${H.band_h}</h2><p>${H.band_p}</p></div>
  <a class="btn btn-p" href="${u(lang, "/create/")}">${C[lang].nav.create}</a>${HORN}
</div></div></section>`;
}

const faqLd = items => ({ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: items.map(q => ({ "@type": "Question", name: q[0], acceptedAnswer: { "@type": "Answer", text: q[1] } })) });

// ---------- pages ----------
const PAGES = [];

const PH = (name, alt, w, h, cls = "", lazy = true) => `<img class="${cls}" src="/img/ph/${name}.webp" srcset="/img/ph/${name}-s.webp ${w > h ? 720 : 480}w, /img/ph/${name}.webp ${w}w" sizes="(max-width:700px) 92vw, 46vw" width="${w}" height="${h}" alt="${esc(alt)}"${lazy ? ' loading="lazy"' : ' fetchpriority="high"'} decoding="async">`;
const OTHER = ["sunnot", "tushoo", "maarake", "uy", "sherine", "custom"];

function homePage(lang) {
  const H = C[lang].home, N = C[lang].nav, K = C[lang].cat;
  const alt = { ky: "/", ru: "/ru/" };
  PAGES.push(lang === "ky" ? { ky: "/", ru: "/ru/", freq: "weekly", prio: "1.0" } : null);
  const hero = sampleData("ivorygold", "uylonuu", lang);
  const jsonld = [
    { "@context": "https://schema.org", "@type": "WebSite", name: "Тойго", url: O + "/", inLanguage: ["ky", "ru"] },
    { "@context": "https://schema.org", "@type": "Organization", name: "Тойго", url: O + "/", logo: O + "/icon-512.png" },
    { "@context": "https://schema.org", "@type": "WebApplication", name: "Тойго", url: O + u(lang, "/create/"), applicationCategory: "LifestyleApplication", operatingSystem: "Any",
      inLanguage: lang, description: H.desc, offers: [{ "@type": "Offer", name: C[lang].price.per, price: "150", priceCurrency: "KGS" }, { "@type": "Offer", name: C[lang].price.year, price: "500", priceCurrency: "KGS" }, { "@type": "Offer", name: C[lang].custom.k, price: "400", priceCurrency: "KGS" }] },
    faqLd(C[lang].faq)
  ];
  const cat = id => CATS.find(c => c.id === id);
  const tiles = [["uylonuu", "hero", 1408, 768], ["kyz", "kyz", 768, 1376], ["tuulgan", "birthday", 768, 1376]];
  const chips = [["", H.f_all], ["uylonuu"], ["kyz"], ["tuulgan"], ["other", H.f_other]];
  const body = `
<section class="hero hero2"><div class="wrap">
  <div class="copy">
    <div class="eyebrow">${HORN}${H.eyebrow}</div>
    <h1>${H.h1}</h1>
    <p class="lead">${H.lead}</p>
    <div class="acts"><a class="btn btn-p" href="${u(lang, "/create/")}">${N.create}</a><a class="btn btn-g" href="#designs">${H.btn2}</a><a class="btn btn-tg" href="${TG_URL}" target="_blank" rel="noopener">${TG_SVG}${N.tg}</a></div>
    <div class="facts">${H.facts.map(f => `<div><b>${f[0]}</b><span>${f[1]}</span></div>`).join("")}</div>
  </div>
  <div class="stage" aria-hidden="true">
    <div class="arch arch-ph">${PH("hero", "", 1408, 768, "", false)}</div>
    <div class="phone"><div class="scr" id="heroPhone" data-inv="${esc(JSON.stringify(hero))}"><div class="${invClass(hero.tpl, hero.type)}">${coverHTML(hero, { mini: true }).replace(/<h1 class="nm"/, '<p class="nm"').replace(/<\/h1>/, "</p>")}</div></div></div>
  </div>
</div></section>

<section class="sec paper" aria-labelledby="cats-h"><div class="wrap">
  <div class="sec-h"><div><div class="k">${H.cats_k}</div><h2 id="cats-h">${H.cats_h}</h2></div></div>
  <ul class="tiles">
    ${tiles.map(([id, img, w, h], i) => `<li class="tile${i === 0 ? " big" : ""}"><a href="${u(lang, `/toi/${cat(id).path}/`)}">${PH(img, "", w, h)}<span class="tile-t"><b>${TYPES[id][lang]}</b><em>→</em></span></a></li>`).join("")}
    <li class="tile other"><div class="tile-o">${PH("table", "", 1376, 768)}<span class="tile-t"><b>${H.f_other}</b><span class="tile-links">${OTHER.map(id => `<a href="${u(lang, `/toi/${cat(id).path}/`)}">${TYPES[id][lang]}</a>`).join("")}</span></span></div></li>
  </ul>
</div></section>

<section class="sec" id="designs" aria-labelledby="designs-h"><div class="wrap">
  <div class="sec-h"><div><div class="k">${H.designs_k}</div><h2 id="designs-h">${H.designs_h}</h2><p>${H.designs_p}</p></div></div>
  <div class="chips-f" role="group" aria-label="${H.designs_h}">${chips.map(([id, label], i) => `<button type="button" class="chip-f" data-filter="${id}" aria-pressed="${i === 0}">${label || TYPES[id][lang]}</button>`).join("")}</div>
  ${cards(lang, TPL)}
</div></section>

<section class="sec paper" aria-labelledby="ben-h"><div class="wrap">
  <div class="sec-h"><div><div class="k">${H.ben_k}</div><h2 id="ben-h">${H.ben_h}</h2></div></div>
  <div class="bens">${H.bens.map(f => `<div class="ben">${icon(f[0])}<h3>${f[1]}</h3><p>${f[2].replace("{n}", TPL.length)}</p></div>`).join("")}</div>
  <p class="inc">${H.inc}</p>
</div></section>

${stepsSec(lang)}
${faqSec(lang, C[lang].faq).replace('class="sec"', 'class="sec paper"')}

<section class="sec final" aria-labelledby="final-h"><div class="wrap">
  <div class="collage" aria-hidden="true">
    <figure class="c1">${PH("stationery", "", 1376, 768)}</figure>
    <figure class="c2">${PH("bouquet", "", 768, 1376)}</figure>
    <figure class="c3">${PH("table", "", 1376, 768)}</figure>
  </div>
  <div class="final-t">
    <div class="eyebrow">${HORN}Тойго</div>
    <h2 id="final-h">${H.final_h}</h2>
    <p class="lead">${H.final_p}</p>
    <div class="acts"><a class="btn btn-p" href="${u(lang, "/create/")}">${N.create}</a><a class="btn btn-g" href="#designs">${H.btn2}</a><a class="btn btn-tg" href="${TG_URL}" target="_blank" rel="noopener">${TG_SVG}${N.tg}</a></div>
  </div>
</div></section>`;
  write(u(lang, "/"), page(lang, { title: H.title, desc: H.desc, path: alt[lang], alt, jsonld, isHome: true, nav: "home" }, body));
}

function catPage(lang, cat) {
  const K = C[lang].cat, T = K[cat.id];
  const p = `/toi/${cat.path}/`, alt = { ky: p, ru: "/ru" + p };
  if (lang === "ky") PAGES.push({ ky: alt.ky, ru: alt.ru, freq: "monthly", prio: "0.8" });
  const list = TPL.filter(t => t.types.includes(cat.id));
  const desc = `${T.h1}. ${K.descTail}`;
  const jsonld = [
    { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
      { "@type": "ListItem", position: 1, name: K.home, item: O + u(lang, "/") },
      { "@type": "ListItem", position: 2, name: TYPES[cat.id][lang], item: O + u(lang, p) }] },
    faqLd(C[lang].faq.slice(0, 4))
  ];
  const body = `
<section class="page-h"><div class="wrap">
  <nav class="crumbs" aria-label="breadcrumbs"><a href="${u(lang, "/")}">${K.home}</a> / ${TYPES[cat.id][lang]}</nav>
  <div class="eyebrow">${HORN}${C[lang].home.eyebrow}</div>
  <h1>${T.h1}</h1>
  <div class="prose">${T.p.map(x => `<p>${x}</p>`).join("")}</div>
  <div class="acts"><a class="btn btn-p" href="${u(lang, "/create/")}?type=${cat.id}">${K.create}</a></div>
</div></section>
<section class="sec" id="designs" aria-labelledby="d-h" style="padding-top:40px"><div class="wrap">
  <div class="sec-h"><h2 id="d-h">${K.designsFor}</h2></div>
  ${cards(lang, list, cat.id)}
</div></section>
${stepsSec(lang).replace('class="sec"', 'class="sec paper"')}
${faqSec(lang, C[lang].faq.slice(0, 4))}
<section class="sec" style="padding-top:0"><div class="wrap">
  <div class="sec-h"><h2>${K.others}</h2></div>
  ${catsRow(lang)}
</div></section>
${bandSec(lang)}`;
  write(u(lang, p), page(lang, { title: T.title, desc, path: alt[lang], alt, jsonld }, body));
}

function payPanel(lang) {
  const S = UI[lang];
  return `<section class="pay" id="pay" hidden aria-labelledby="pay-h">
      <h3 id="pay-h">${S.pay_h}</h3><p>${S.pay_p}</p>
      <div class="plans" role="radiogroup" aria-label="${S.pay_h}">${Object.entries(S.plans).map(([id, [n, pr, per, note]], i) => `<label class="plan"><input type="radio" name="plan" value="${id}" data-price="${pr}"${i === 0 ? " checked" : ""}><span><em>${n}</em><b>${pr}</b><small>${per}</small>${note ? `<i>${note}</i>` : ""}</span></label>`).join("")}</div>
      <ul class="pay-list">${S.pay_list.map(x => `<li>${x}</li>`).join("")}</ul>
      <button type="button" class="btn btn-gold" id="pay-go">${S.pay_go}</button>
      <p class="hint">${S.pay_how}</p>
      <p class="pay-msg" id="pay-msg" aria-live="polite"></p>
      <div class="pay-keybox" id="pay-keybox" hidden><span>${S.pay_keyl}</span> <code class="keyout" id="pay-keyval"></code><p class="hint" id="pay-keynote"></p></div>
      <p class="hint">${C[lang].custom.cta} <a href="${u(lang, "/custom/")}">${C[lang].custom.ctaBtn} — 400 сом</a></p>
      <details class="pay-key"><summary>${S.pay_have}</summary>
        <div class="copyrow"><input id="pay-key" type="text" maxlength="24" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="${S.pay_key_ph}" aria-label="${S.pay_have}"><button type="button" class="btn btn-p btn-sm" id="pay-act">${S.pay_act}</button></div>
      </details>
    </section>`;
}

function createPage(lang) {
  const K = C[lang].create, S = UI[lang];
  const p = "/create/", alt = { ky: p, ru: "/ru" + p };
  if (lang === "ky") PAGES.push({ ky: alt.ky, ru: alt.ru, freq: "monthly", prio: "0.9" });
  const f = (id, label, input, cls = "", hint = "") => `<div class="fld ${cls}" id="w-${id}"><label for="f-${id}"${id === "n1" ? ' id="lab-n1"' : ""}>${label}</label>${input}${hint ? `<span class="hint">${hint}</span>` : ""}</div>`;
  const body = `
<section class="page-h" style="padding-bottom:8px"><div class="wrap">
  <h1 id="ch1">${K.h1}</h1><p class="lead">${K.p}</p>
</div></section>
<section class="sec" style="padding-top:28px"><div class="wrap build">
  <form class="f" id="form" novalidate>
    <fieldset><legend>${S.lg1}</legend>
      ${f("type", S.l_type, `<select id="f-type" name="type">${Object.keys(TYPES).map(k => `<option value="${k}">${TYPES[k][lang]}</option>`).join("")}</select>`, "w")}
      <div class="fld w"><span class="lbl">${S.l_tpl}</span><div class="tplpick" role="radiogroup" aria-label="${S.l_tpl}">
        ${TPL.map(t => `<label data-types="${t.types.join(" ")}"><input type="radio" name="tpl" value="${t.id}" id="tpl-${t.id}"><span>${PREM_SWATCH[t.id] ? `<i style="background:${PREM_SWATCH[t.id]};border:1px solid rgba(0,0,0,.08)"></i>` : `<i class="t-${t.id}" style="--sw:var(--ib);background:var(--ib);border:1px solid var(--il)"></i>`}${t.name[lang]}</span></label>`).join("")}
      </div></div>
      <div class="fld w"><span class="lbl">${S.l_lang}</span><div class="seg" role="radiogroup" aria-label="${S.l_lang}">
        <label><input type="radio" name="lang" id="il-ky" value="ky"><span>${S.o_ky}</span></label>
        <label><input type="radio" name="lang" id="il-ru" value="ru"><span>${S.o_ru}</span></label>
        <label><input type="radio" name="lang" id="il-both" value="both"><span>${S.o_both}</span></label>
      </div></div>
    </fieldset>
    <fieldset><legend>${S.lg2}</legend>
      ${f("title", S.l_title, `<input id="f-title" name="title" type="text" maxlength="60" autocomplete="off" placeholder="${S.ph_title}">`, "w", S.h_title)}
      ${f("n1", S.n_pair, `<input id="f-n1" name="n1" type="text" maxlength="60" autocomplete="off" required>`)}
      ${f("n2", S.n_bride, `<input id="f-n2" name="n2" type="text" maxlength="60" autocomplete="off">`)}
      ${f("hosts", S.l_hosts, `<input id="f-hosts" name="hosts" type="text" maxlength="120" autocomplete="off" placeholder="${S.ph_hosts}">`, "w")}
    </fieldset>
    <fieldset><legend>${S.lg3}</legend>
      ${f("date", S.l_date, `<input id="f-date" name="date" type="date">`)}
      ${f("time", S.l_time, `<input id="f-time" name="time" type="time">`)}
      ${f("venue", S.l_venue, `<input id="f-venue" name="venue" type="text" maxlength="120" autocomplete="off" placeholder="${S.ph_venue}">`, "w")}
      ${f("addr", S.l_addr, `<input id="f-addr" name="addr" type="text" maxlength="200" autocomplete="off" placeholder="${S.ph_addr}">`, "w", S.h_addr)}
      ${f("age", S.l_age, `<input id="f-age" name="age" type="number" min="1" max="120" inputmode="numeric" placeholder="${S.ph_age}">`, "", S.h_age)}
      ${f("hall", S.l_hall, `<input id="f-hall" name="hall" type="text" maxlength="80" autocomplete="off" placeholder="${S.ph_hall}">`, "w", S.h_hall)}
    </fieldset>
    <fieldset><legend>${S.lg4}</legend>
      ${f("msg", S.l_msg, `<textarea id="f-msg" name="msg" maxlength="1200" rows="5"></textarea><div class="ready" role="group" aria-label="${S.l_ready}"><span>${S.l_ready}</span><button type="button" class="chip-btn" data-ready="0">1</button><button type="button" class="chip-btn" data-ready="1">2</button><button type="button" class="chip-btn" data-ready="2">3</button></div>`, "w")}
      ${f("prog", S.l_prog, `<textarea id="f-prog" name="prog" maxlength="1500" rows="5"></textarea>`, "w", S.h_prog)}
      ${f("dress", S.l_dress, `<input id="f-dress" name="dress" type="text" maxlength="200" autocomplete="off">`, "w", S.h_opt)}
    </fieldset>
    <fieldset><legend>${S.lg5}</legend>
      <div class="fld w"><span class="lbl">${S.l_photos}</span>
        <div class="thumbs" id="thumbs"></div>
        <label class="up" for="f-photos"><span aria-hidden="true">+</span>${S.b_photos}</label>
        <input id="f-photos" type="file" accept="image/*" multiple hidden>
        <span class="hint">${S.h_photos}</span><span class="bad" id="photo-msg" aria-live="polite"></span>
      </div>
      ${f("dl", S.l_dl, `<input id="f-dl" name="dl" type="date">`)}
      ${f("phone", S.l_phone, `<input id="f-phone" name="phone" type="tel" inputmode="tel" maxlength="24" placeholder="+996 700 000 000" autocomplete="tel">`, "", S.h_phone)}
      <div class="fld w"><label class="sw"><input id="f-music" name="music" type="checkbox" checked>${S.l_music}</label><label class="sw"><input id="f-fx" name="fx" type="checkbox" checked>${S.l_fx}</label></div>
      ${f("track", S.l_track, `<select id="f-track" name="track">${TRACKS.map(t => `<option value="${t.id}">${t[lang]}</option>`).join("")}</select>`, "", S.h_track)}
    </fieldset>
    <div class="acc" id="acc" hidden></div>
    <div class="submit-row"><button class="btn btn-p" type="submit" id="save">${S.save}</button><span class="form-msg" id="form-msg" aria-live="polite"></span></div>
    <div id="done" hidden></div>
    ${payPanel(lang)}
  </form>
  <div class="pv" aria-label="${S.preview_note}">
    <div class="phone"><div class="scr" id="preview"></div></div>
    <span class="pv-note">${S.preview_note}</span>
  </div>
</div></section>
<script type="application/json" id="i18n">${JSON.stringify({ lang, ui: S, home: u(lang, "/"), manage: u(lang, "/manage/") })}</script>
<script type="module" src="/assets/create.js?v=${V}"></script>`;
  write(u(lang, p), page(lang, { title: K.title, desc: K.desc, path: alt[lang], alt, noSupport: true, nav: "create" }, body));
}

function managePage(lang) {
  const K = C[lang].manage;
  const p = "/manage/", alt = { ky: p, ru: "/ru" + p };
  const body = `
<section class="page-h" style="padding-bottom:0"><div class="wrap"><h1 id="mh1">${K.h1}</h1></div></section>
<section class="sec" style="padding-top:28px"><div class="wrap" id="app"><p class="empty">${UI[lang].loading}</p></div></section>
<script type="application/json" id="i18n">${JSON.stringify({ lang, ui: UI[lang], create: u(lang, "/create/") })}</script>
<script type="module" src="/assets/manage.js?v=${V}"></script>`;
  write(u(lang, p), page(lang, { title: K.title, desc: K.title, path: alt[lang], alt, noindex: true, nav: "mine" }, body));
}

function demoPage(lang, t) {
  const K = C[lang].demo;
  const p = `/demo/${t.id}/`, alt = { ky: p, ru: "/ru" + p };
  const d = sampleData(t.id, t.types[0], lang);
  const html = `${head(lang, { title: `${t.name[lang]} ${K.title}`, desc: t.desc[lang], path: alt[lang], alt, noindex: true, og: `/img/og-${t.id}.png` })}
<body class="inv-page">
<div style="position:sticky;top:0;z-index:20;display:flex;gap:8px;justify-content:center;padding:10px 12px calc(10px);padding-top:calc(10px + env(safe-area-inset-top,0px));background:rgba(255,255,255,.94);border-bottom:1px solid #E6E5E1">
  <a class="btn btn-g btn-sm" href="${u(lang, "/")}#designs">← ${K.back}</a>
  <a class="btn btn-p btn-sm" href="${u(lang, "/create/")}?tpl=${t.id}">${K.use}</a>
</div>
${renderInvitation(d, { mode: "preview", pf: "demo" })}
<script type="module">import { startLive } from "/assets/invite-live.js?v=${V}"; startLive();</script>
</body></html>`;
  write(u(lang, p), html);
}

function customPage(lang) {
  const K = C[lang].custom, S = UI[lang];
  const p = "/custom/", alt = { ky: p, ru: "/ru" + p };
  if (lang === "ky") PAGES.push({ ky: alt.ky, ru: alt.ru, freq: "monthly", prio: "0.8" });
  const f = (id, label, input, cls = "", hint = "") => `<div class="fld ${cls}"><label for="c-${id}">${label}</label>${input}${hint ? `<span class="hint">${hint}</span>` : ""}</div>`;
  const body = `
<section class="page-h"><div class="wrap cu-top">
  <div>
    <div class="eyebrow">${HORN}${K.k}</div>
    <h1>${K.h1}</h1><p class="lead">${K.lead}</p>
    <ol class="cu-steps">${K.steps.map(([h, t]) => `<li><b>${h}</b><span>${t}</span></li>`).join("")}</ol>
  </div>
  <div class="prc-card prc-main cu-card"><span>${K.k}</span><b>${K.price}</b><p class="prc-year"><i>${K.priceNote}</i></p>
    <ul>${K.inc.map(x => `<li>${x}</li>`).join("")}</ul><a class="btn btn-gold" href="#order">${K.btn}</a></div>
</div></section>
<section class="sec" id="order" style="padding-top:12px"><div class="wrap cu-wrap">
  <form class="f" id="cform" novalidate>
    <fieldset><legend>${K.form_h}</legend>
      ${f("type", K.l_type, `<select id="c-type" name="type">${Object.keys(TYPES).map(k => `<option value="${k}">${TYPES[k][lang]}</option>`).join("")}</select>`)}
      ${f("ilang", K.l_lang, `<select id="c-ilang" name="ilang"><option value="ky">${S.o_ky}</option><option value="ru"${lang === "ru" ? " selected" : ""}>${S.o_ru}</option><option value="both">${S.o_both}</option></select>`)}
      ${f("names", K.l_names, `<input id="c-names" name="names" type="text" maxlength="160" autocomplete="off" placeholder="${K.ph_names}" required>`, "w")}
      ${f("date", K.l_date, `<input id="c-date" name="date" type="date">`)}
      ${f("place", K.l_place, `<input id="c-place" name="place" type="text" maxlength="200" autocomplete="off" placeholder="${K.ph_place}">`)}
      ${f("style", K.l_style, `<input id="c-style" name="style" type="text" maxlength="300" autocomplete="off" placeholder="${K.ph_style}">`, "w")}
      ${f("wishes", K.l_wishes, `<textarea id="c-wishes" name="wishes" maxlength="2000" rows="4" placeholder="${K.ph_wishes}"></textarea>`, "w", K.h_wishes)}
      <div class="fld w"><span class="lbl">${K.l_photos}</span><div class="thumbs" id="c-thumbs"></div>
        <label class="up" for="c-photos"><span aria-hidden="true">+</span>${K.b_photos}</label><input id="c-photos" type="file" accept="image/*" multiple hidden>
        <span class="hint">${K.h_photos}</span></div>
      ${f("contact", K.l_contact, `<input id="c-contact" name="contact" type="text" maxlength="80" autocomplete="tel" placeholder="${K.ph_contact}" required>`, "w")}
    </fieldset>
    <p class="hint cu-note">${K.note}</p>
    <div class="acc login" id="c-login" hidden></div>
    <div class="submit-row"><button class="btn btn-gold" type="submit" id="c-send">${K.btn}</button><span class="form-msg" id="c-msg" aria-live="polite"></span></div>
    <p class="hint">${K.how}</p>
  </form>
  <div class="pay cu-done" id="c-done" hidden><p class="pay-msg" id="c-dmsg"></p><div class="pay-keybox" id="c-keybox" hidden><span>${K.keyl}</span> <code class="keyout" id="c-key"></code><p class="hint">${K.keyh}</p></div></div>
</div></section>
<script type="application/json" id="i18n">${JSON.stringify({ lang, t: K })}</script>
<script type="module" src="/assets/custom.js?v=${V}"></script>`;
  write(u(lang, p), page(lang, { title: K.title, desc: K.desc, path: alt[lang], alt, noSupport: true, nav: "custom" }, body));
}

function privacyPage(lang) {
  const K = C[lang].privacy;
  const p = "/privacy/", alt = { ky: p, ru: "/ru" + p };
  if (lang === "ky") PAGES.push({ ky: alt.ky, ru: alt.ru, freq: "yearly", prio: "0.3" });
  const body = `
<section class="page-h"><div class="wrap">
  <h1>${K.h1}</h1>
  <p class="crumbs">${K.updated}: ${LASTMOD}</p>
  <div class="prose">${K.items.map(i => `<h2 style="font-size:24px;margin-top:14px">${i[0]}</h2><p>${i[1]}</p>`).join("")}</div>
</div></section>`;
  write(u(lang, p), page(lang, { title: K.title, desc: K.items[0][1], path: alt[lang], alt, noSupport: true }, body));
}

function notFound() {
  const K = C.ky.notfound, R = C.ru.notfound;
  write("404.html", `${head("ky", { title: K.title, desc: K.p, path: "/404", alt: null, noindex: true })}
<body>${header("ky", { alt: null })}
<main id="main"><section class="page-h"><div class="wrap" style="text-align:center;padding-block:60px">
${HORN.replace('class="orn"', 'class="orn" style="width:80px;height:48px;margin:0 auto"')}
<h1 style="margin:20px auto 12px">${K.h1}</h1><p class="lead" style="margin:0 auto">${K.p}<br>${R.p}</p>
<div class="acts" style="justify-content:center"><a class="btn btn-p" href="/">${K.home}</a><a class="btn btn-g" href="/ru/">${R.home}</a></div>
</div></section></main>${footer("ky")}</body></html>`);
}

for (const lang of ["ky", "ru"]) {
  homePage(lang);
  CATS.forEach(c => catPage(lang, c));
  createPage(lang);
  managePage(lang);
  TPL.forEach(t => demoPage(lang, t));
  customPage(lang);
  privacyPage(lang);
}
notFound();

// Stamp every module import with the build version, so browsers never mix old and new files.
for (const f of fs.readdirSync(path.join(OUT, "assets"))) {
  if (!f.endsWith(".js")) continue;
  const p = path.join(OUT, "assets", f);
  const src = fs.readFileSync(p, "utf8");
  const out = src.replace(/(["'])(\/assets\/[a-z-]+\.js)(\?v=[a-z0-9]+)?\1/g, (m, q, file) => `${q}${file}?v=${V}${q}`);
  if (out !== src) fs.writeFileSync(p, out);
}

fs.writeFileSync("lib/pages.js", `// Generated by tools/build.mjs — public pages for the sitemap.
export const LASTMOD = "${LASTMOD}";
export const VERSION = "${V}";
export const PAGES = ${JSON.stringify(PAGES.filter(Boolean), null, 2)};
`);
console.log("built", PAGES.filter(Boolean).length, "page pairs, v", V);
