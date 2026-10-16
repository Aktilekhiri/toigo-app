// Toigo — premium collection: six designs with full-screen covers, own SVG art and a closing screen.
// Pure string builders (no DOM), shared by the server and the constructor preview.

import { PHOTO_IDS, PHOTO_TPL, PHOTO_THEME, PHOTO_SWATCH, photoCover, photoOrn, photoFinale, photoOg } from "./invite-photo.js";

export const PREM = new Set(["silk", "nomad", "garden", "kjibek", "aurora", "noir", ...PHOTO_IDS]);
const isPhoto = id => PHOTO_IDS.includes(id);
// Backdrop for the envelope intro: the design's own photo, so the envelope lies in the same scene.
export const envBg = id => (isPhoto(id) ? photoOg(id) : "");

export const PREM_TPL = [
  ...PHOTO_TPL,
  { id: "silk", name: { ky: "Silk & Gold", ru: "Silk & Gold" }, types: ["uylonuu"],
    desc: { ky: "Жибек кездеменин бырыштары, шампань алтыны жана журналдык типографика.", ru: "Складки шёлка, золото шампань и журнальная типографика." } },
  { id: "nomad", name: { ky: "Nomadic Royal", ru: "Nomadic Royal" }, types: ["uylonuu"],
    desc: { ky: "Түнкү Ала-Тоо, асимметриялык курам жана геометриялык оюм-рамка.", ru: "Ночные горы, асимметричная композиция и геометрическая рамка-орнамент." } },
  { id: "garden", name: { ky: "Secret Garden", ru: "Secret Garden" }, types: ["uylonuu"],
    desc: { ky: "Жашыл бак, жарык нурлары жана ботаникалык бутактар.", ru: "Тенистый сад, лучи света и ботанические ветви." } },
  { id: "kjibek", name: { ky: "Кыз Жибек", ru: "Кыз Жибек" }, types: ["kyz"],
    desc: { ky: "Бордо баркыт, алтын сайма жана салтанаттуу арка.", ru: "Бордовый бархат, золотая вышивка и торжественная арка." } },
  { id: "aurora", name: { ky: "Aurora", ru: "Aurora" }, types: ["kyz"],
    desc: { ky: "Назик гүлдөр, бермет жана роза түстөрү, жеңил аба.", ru: "Нежные полупрозрачные цветы, жемчуг и пудровая роза." } },
  { id: "noir", name: { ky: "Emerald Noir", ru: "Emerald Noir" }, types: ["kyz"],
    desc: { ky: "Кара жана зымырыт, чоң тамгалар жана алтын сызыктар.", ru: "Чёрный и изумруд, крупная типографика и золотые линии." } }
];

// Swatches for the design picker in the constructor.
export const PREM_SWATCH = { silk: "linear-gradient(135deg,#FFFCF7,#E3CFA8)", nomad: "linear-gradient(#0C1626,#2A3B5E)", garden: "linear-gradient(135deg,#46695A,#16271F)",
  kjibek: "radial-gradient(circle at 50% 40%,#8B344B,#4C1323)", aurora: "linear-gradient(135deg,#FBF7F3,#E7C9C7)", noir: "linear-gradient(135deg,#101411 45%,#1E5546)", ...PHOTO_SWATCH };

export const PREM_THEME = { silk: "#F7F3EB", nomad: "#142238", garden: "#243D32", kjibek: "#651D32", aurora: "#FBF7F3", noir: "#101411", ...PHOTO_THEME };

// deterministic pseudo-random, so server and browser draw identical art
function rng(seed) { let x = seed; return () => (x = (x * 9301 + 49297) % 233280) / 233280; }
const f1 = n => n.toFixed(1);

// ---------- art ----------
const SILK = `<svg class="art-svg" viewBox="0 0 400 800" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs>
<linearGradient id="sk1" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFFCF7"/><stop offset=".5" stop-color="#EBDDC2"/><stop offset="1" stop-color="#F7F3EB"/></linearGradient>
<linearGradient id="sk2" x1="0" y1="0" x2="1" y2=".4"><stop offset="0" stop-color="#E3CFA8"/><stop offset=".45" stop-color="#FFFAF0"/><stop offset="1" stop-color="#D8BF91"/></linearGradient>
<radialGradient id="sk3" cx=".8" cy=".08" r=".6"><stop offset="0" stop-color="#FFF1D2" stop-opacity=".95"/><stop offset="1" stop-color="#FFF1D2" stop-opacity="0"/></radialGradient></defs>
<rect width="400" height="800" fill="#F7F3EB"/>
<path d="M-20 150C110 70 190 300 420 170V-20H-20Z" fill="url(#sk1)"/>
<path d="M-20 205C120 120 210 330 420 225V250C220 360 120 160 -20 250Z" fill="url(#sk2)" opacity=".75"/>
<path d="M-20 640C120 560 250 730 420 620V820H-20Z" fill="url(#sk1)"/>
<path d="M-20 600C140 520 240 690 420 585V610C250 715 130 560 -20 630Z" fill="url(#sk2)" opacity=".7"/>
<path d="M-20 160C110 85 190 305 420 182M-20 652C125 575 250 742 420 634" fill="none" stroke="#fff" stroke-width="2" opacity=".8"/>
<path d="M-20 232C120 150 215 350 420 238M-20 615C140 538 245 708 420 600" fill="none" stroke="#D8BF91" stroke-width=".8" opacity=".7"/>
<rect width="400" height="800" fill="url(#sk3)"/></svg>`;

function mountains() {
  const r = rng(11); let st = "";
  for (let i = 0; i < 46; i++) st += `<circle cx="${f1(r() * 400)}" cy="${f1(r() * 380)}" r="${(0.4 + r() * 1.1).toFixed(2)}" opacity="${(0.3 + r() * 0.6).toFixed(2)}"/>`;
  return `<svg class="art-svg" viewBox="0 0 400 800" preserveAspectRatio="xMidYMax slice" aria-hidden="true"><defs>
<linearGradient id="nm1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0C1626"/><stop offset=".55" stop-color="#142238"/><stop offset="1" stop-color="#2A3B5E"/></linearGradient>
<radialGradient id="nm2" cx=".78" cy=".2" r=".35"><stop offset="0" stop-color="#F2EBDD" stop-opacity=".35"/><stop offset="1" stop-color="#F2EBDD" stop-opacity="0"/></radialGradient>
<linearGradient id="nm3" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F2EBDD" stop-opacity="0"/><stop offset=".55" stop-color="#F2EBDD" stop-opacity=".12"/><stop offset="1" stop-color="#F2EBDD" stop-opacity="0"/></linearGradient></defs>
<rect width="400" height="800" fill="url(#nm1)"/><rect width="400" height="800" fill="url(#nm2)"/>
<g fill="#F2EBDD">${st}</g><circle cx="312" cy="160" r="20" fill="#F2EBDD" opacity=".92"/>
<path d="M0 560L46 520 80 540 130 470 168 505 214 448 262 500 300 478 346 520 400 470V800H0Z" fill="#25385C"/>
<path d="M118 485L130 470 142 482 136 480 130 486 124 480ZM202 462L214 448 226 461 219 458 214 464 208 459ZM292 486L300 478 310 488 304 486 300 490Z" fill="#F2EBDD" opacity=".75"/>
<rect y="440" width="400" height="200" fill="url(#nm3)"/>
<path d="M0 640L70 585 120 612 190 552 252 610 310 575 360 600 400 580V800H0Z" fill="#1A2A47"/>
<path d="M180 563L190 552 200 562 194 560 190 565 185 560Z" fill="#F2EBDD" opacity=".55"/>
<path d="M0 720C90 680 190 730 400 690V800H0Z" fill="#0F1A2E"/></svg>`;
}

function leafBranch(x, y, ang, len, n, color, sc, r) {
  const a = ang * Math.PI / 180, ex = x + Math.cos(a) * len, ey = y + Math.sin(a) * len;
  const bx = x + Math.cos(a) * len * 0.5 + Math.sin(a) * len * 0.12, by = y + Math.sin(a) * len * 0.5 - Math.cos(a) * len * 0.12;
  let g = `<path d="M${f1(x)} ${f1(y)}Q${f1(bx)} ${f1(by)} ${f1(ex)} ${f1(ey)}" fill="none" stroke="${color}" stroke-width="${f1(1.2 * sc)}"/>`;
  for (let i = 1; i <= n; i++) {
    const t = i / (n + 1), px = (1 - t) * (1 - t) * x + 2 * (1 - t) * t * bx + t * t * ex, py = (1 - t) * (1 - t) * y + 2 * (1 - t) * t * by + t * t * ey;
    const side = i % 2 ? 1 : -1, rot = ang + side * (38 + r() * 18), s = sc * (1.05 - t * 0.45) * (0.85 + r() * 0.3);
    g += `<path transform="translate(${f1(px)} ${f1(py)}) rotate(${f1(rot)}) scale(${s.toFixed(2)})" d="M0 0C9 -11 27 -11 38 0C27 11 9 11 0 0Z" fill="${color}"/>`;
  }
  return g;
}
function garden() {
  const r = rng(5);
  const L = (x, y, a, len, n, c, s) => leafBranch(x, y, a, len, n, c, s, r);
  return `<svg class="art-svg" viewBox="0 0 400 800" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs>
<radialGradient id="gd1" cx=".5" cy=".18" r=".85"><stop offset="0" stop-color="#46695A"/><stop offset=".45" stop-color="#2B4739"/><stop offset="1" stop-color="#16271F"/></radialGradient>
<linearGradient id="gd2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF7E2" stop-opacity=".22"/><stop offset="1" stop-color="#FFF7E2" stop-opacity="0"/></linearGradient></defs>
<rect width="400" height="800" fill="url(#gd1)"/>
<path d="M170 -10L120 520H160L205 -10ZM230 -10L250 560H285L262 -10ZM300 -10L380 430H410L330 -10Z" fill="url(#gd2)"/>
<g opacity=".95">${L(-20, 40, 35, 230, 9, "#1D3329", 1.5)}${L(-10, 150, 10, 190, 8, "#355845", 1.15)}${L(420, 20, 150, 240, 9, "#1D3329", 1.5)}${L(420, 130, 175, 170, 7, "#3F6650", 1.05)}</g>
<g opacity=".95">${L(-20, 790, -40, 260, 10, "#1A2E24", 1.6)}${L(-10, 690, -12, 170, 7, "#3F6650", 1.1)}${L(420, 800, -140, 250, 9, "#1A2E24", 1.55)}${L(420, 700, -170, 160, 7, "#355845", 1)}</g>
<g opacity=".35">${L(30, 300, 70, 120, 6, "#A6B19A", .8)}${L(372, 380, 110, 110, 5, "#A6B19A", .75)}</g></svg>`;
}

const HORNP = 'M20 23C20 13 15 6 9 6C4 6 2 10 3.5 13C5 16 9.5 15.5 9.5 12.5C9.5 10.5 7.5 9.5 6.3 10.6M20 23C20 13 25 6 31 6C36 6 38 10 36.5 13C35 16 30.5 15.5 30.5 12.5C30.5 10.5 32.5 9.5 33.7 10.6M20 23V2M17 5L20 2L23 5';
const ARCH = `<svg class="kar" viewBox="0 0 300 480" aria-hidden="true"><g fill="none" stroke="#C3A36B">
<path d="M14 476V160A136 136 0 0 1 286 160V476" stroke-width="1.3"/>
<path d="M26 476V162A124 124 0 0 1 274 162V476" stroke-width="1.6" stroke-dasharray="5 3.5" opacity=".85"/>
<path d="M38 476V164A112 112 0 0 1 262 164V476" stroke-width="2.2" stroke-dasharray="0 7" stroke-linecap="round" opacity=".7"/>
<g transform="translate(110 46) scale(2)" stroke-width=".9" stroke-dasharray="2.4 1.6" stroke-linecap="round"><path d="${HORNP}"/></g>
<g transform="translate(30 476) scale(.9)" stroke-width="1.1"><path d="M0 -10l10 -10 10 10 -10 10z"/><path d="M10 -14l4 4-4 4-4-4z" fill="#C3A36B"/></g>
<g transform="translate(252 476) scale(.9)" stroke-width="1.1"><path d="M0 -10l10 -10 10 10 -10 10z"/><path d="M10 -14l4 4-4 4-4-4z" fill="#C3A36B"/></g></g></svg>`;

function bloom(cx, cy, R, fill, op, rot = 0, stroke = "") {
  let p = "";
  for (let k = 0; k < 6; k++) p += `<ellipse cx="${cx}" cy="${f1(cy - R * 0.52)}" rx="${f1(R * 0.36)}" ry="${f1(R * 0.56)}" transform="rotate(${k * 60 + rot} ${cx} ${cy})"/>`;
  return stroke ? `<g fill="none" stroke="${stroke}" stroke-width="1">${p}<circle cx="${cx}" cy="${cy}" r="${f1(R * 0.14)}"/></g>`
    : `<g fill="${fill}" opacity="${op}">${p}<circle cx="${cx}" cy="${cy}" r="${f1(R * 0.16)}" fill="#D8C09B" opacity=".8"/></g>`;
}
const AURORA = `<svg class="art-svg" viewBox="0 0 400 800" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs>
<linearGradient id="au1" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F6E6E3"/><stop offset=".5" stop-color="#FBF7F3"/><stop offset="1" stop-color="#F3E2DF"/></linearGradient>
<filter id="au2" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3"/></filter></defs>
<rect width="400" height="800" fill="url(#au1)"/>
<g filter="url(#au2)">${bloom(350, 110, 150, "#E7C9C7", .55, 10)}${bloom(40, 690, 140, "#E7C9C7", .5, 25)}</g>
${bloom(330, 120, 96, "#B78389", .16, 40)}${bloom(70, 700, 80, "#B78389", .14, 5)}${bloom(26, 250, 46, "#E7C9C7", .6, 15)}
${bloom(372, 560, 40, "", 0, 20, "#D8C09B")}${bloom(58, 120, 26, "", 0, 0, "#D8C09B")}
<g fill="none" stroke="#D8C09B" stroke-width=".8" opacity=".8"><circle cx="200" cy="400" r="176"/><circle cx="200" cy="400" r="184" stroke-dasharray="2 6"/></g></svg>`;

const NOIR = `<svg class="art-svg" viewBox="0 0 400 800" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
<g fill="none" stroke="#B79A62"><rect x="214" y="70" width="156" height="420" stroke-width=".8" opacity=".55"/><rect x="226" y="82" width="132" height="396" stroke-width=".5" opacity=".3"/>
<circle cx="292" cy="250" r="64" stroke-width=".6" opacity=".4"/><path d="M20 790L392 30" stroke-width=".5" opacity=".25"/></g></svg>`;

const NCORNER = '<svg viewBox="0 0 48 48" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="1.1"><path d="M1 47V1h46"/><path d="M7 47V7h40" opacity=".55"/><path d="M14 1v6M1 14h6"/><path d="M7 1l6 6-6 6-6-6z" transform="translate(0 0)"/></g><path d="M7 4.5l2.5 2.5L7 9.5 4.5 7z" fill="currentColor"/><path d="M22 7c0 5 5 7 7 3s-2-6-4-3" fill="none" stroke="currentColor" stroke-width="1"/></svg>';
const SPRIG2 = '<svg viewBox="0 0 120 30" aria-hidden="true"><path d="M6 22C40 6 80 6 114 22" fill="none" stroke="currentColor" stroke-width="1"/><g fill="currentColor">' +
  [[24, 15, -40], [36, 11, -25], [50, 8, -12], [70, 8, 12], [84, 11, 25], [96, 15, 40]].map(([x, y, a]) => `<path transform="translate(${x} ${y}) rotate(${a - 90}) scale(.32)" d="M0 0C9 -11 27 -11 38 0C27 11 9 11 0 0Z"/>`).join("") + '</g><circle cx="60" cy="8" r="2.4" fill="currentColor"/></svg>';
const DIAM = '<svg viewBox="0 0 120 14" aria-hidden="true"><path d="M0 7h50M70 7h50" stroke="currentColor" stroke-width=".8"/><path d="M60 1l6 6-6 6-6-6z" fill="none" stroke="currentColor"/><circle cx="60" cy="7" r="1.6" fill="currentColor"/></svg>';
const FLOW = '<svg viewBox="0 0 60 60" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="1">' + [0, 60, 120, 180, 240, 300].map(a => `<ellipse cx="30" cy="17" rx="7" ry="12" transform="rotate(${a} 30 30)"/>`).join("") + '</g><circle cx="30" cy="30" r="3" fill="currentColor"/></svg>';
const HORN_S = `<svg viewBox="0 0 40 24" aria-hidden="true"><path d="${HORNP}" fill="none" stroke="currentColor" stroke-width="1.4" stroke-dasharray="2.2 1.4" stroke-linecap="round"/></svg>`;

export function premOrn(tpl) {
  if (isPhoto(tpl)) return photoOrn(tpl);
  const m = { silk: DIAM, nomad: NCORNER.replace('viewBox="0 0 48 48"', 'viewBox="0 0 48 48" class="nc1"'), garden: SPRIG2, kjibek: HORN_S, aurora: FLOW, noir: "" };
  return tpl === "noir" ? '<span class="orn orn-noir" aria-hidden="true"></span>' : `<span class="orn orn-${tpl}" aria-hidden="true">${m[tpl]}</span>`;
}

/** Cover for a premium design. h: helpers from invite-core { esc, names, ey, p, dot, longD, when, typeLabel } */
// longest word in the names: the CSS shrinks the font so that word always fits the width
function longest(d) {
  const words = [d.n1, d.type === "uylonuu" ? d.n2 : ""].join(" ").split(/[\s]+/).filter(Boolean).flatMap(w => w.split(/(?<=-)/));
  return Math.max(6, ...words.map(w => w.length));
}

export function premCover(d, h, opts) {
  const { esc, names, ey, p, dot, longD, when, typeLabel } = h;
  const mini = !!opts.mini;
  const photo = !mini && d.photos && d.photos.length && opts.photoUrl ? opts.photoUrl(d.photos[0]) : "";
  const ph = photo ? `<img class="hph" src="${esc(photo)}" alt="" decoding="async" fetchpriority="high">` : "";
  const nl = longest(d);
  const nm = `<h1 class="nm" style="--nl:${nl}">${names}</h1>`;
  const cue = mini ? "" : '<span class="cue" aria-hidden="true"></span>';
  const cls = `cv${photo ? " has-ph" : ""}`;
  const mon = p ? (d.lang === "ru" ? p.mon : p.monKy) : "";
  if (isPhoto(d.tpl)) return photoCover(d, { ...h, nm, cue, photo }, mini);
  switch (d.tpl) {
    case "silk": return `<div class="${cls}"><div class="art">${ph || SILK}</div><div class="hc">
      <div class="ey">${ey}</div>${nm}<div class="ivr"><i></i><b></b><i></i></div><div class="dt">${dot}</div><div class="sub">${when}</div></div>${cue}</div>`;
    case "nomad": return `<div class="${cls}"><div class="art">${ph || mountains()}</div>${["tl", "tr", "bl", "br"].map(c => `<span class="nc ${c}">${NCORNER}</span>`).join("")}<div class="nfr"></div><div class="hc">
      <div class="ey">${ey}</div>${nm}${p ? `<div class="nd"><b>${p.dd}</b><span>${esc(mon)}<br>${p.y}</span><em>${when}</em></div>` : `<div class="sub">${when}</div>`}</div>${cue}</div>`;
    case "garden": return `<div class="${cls}"><div class="art">${ph || garden()}</div><div class="hc">
      <span class="gsp">${SPRIG2}</span><div class="ey">${ey}</div>${nm}<div class="dt">${longD}</div><div class="sub">${when}</div></div>
      <svg class="gedge" viewBox="0 0 400 40" preserveAspectRatio="none" aria-hidden="true"><path d="M0 40V22C60 6 110 30 170 18S300 2 400 20V40Z" fill="#F7F5EE"/></svg>${cue}</div>`;
    case "kjibek": return `<div class="${cls}"><div class="art">${ph}</div><div class="kv"></div>${ARCH}<div class="hc">
      <div class="ey">${ey}</div>${nm}<div class="kdl"><i></i><b></b><i></i></div><div class="dt">${longD}</div><div class="sub">${when}</div></div>${cue}</div>`;
    case "aurora": return `<div class="${cls}"><div class="art">${ph || AURORA}</div><div class="hc">
      <div class="ey">${ey}</div>${nm}<div class="dt"><span>${dot}</span></div><div class="sub">${when}</div></div>${cue}</div>`;
    case "noir": return `<div class="${cls}"><div class="art">${ph}${NOIR}</div><div class="vl" aria-hidden="true">${typeLabel}</div><div class="hc">
      <div class="ey">${dot ? dot.replace(/ · /g, ".") : ""}</div>${nm}<span class="gl"></span><div class="sub">${when}</div></div>${cue}</div>`;
  }
  return "";
}

export function premFinale(d, h) {
  const { names, dot, fin } = h;
  if (isPhoto(d.tpl)) return photoFinale(d, { ...h, nl: longest(d) });
  return `<section class="fin"><span class="fin-o" aria-hidden="true">${{ silk: DIAM, nomad: NCORNER, garden: SPRIG2, kjibek: HORN_S, aurora: FLOW, noir: "" }[d.tpl]}</span><p class="fin-k">${fin}</p><div class="fin-n" style="--nl:${longest(d)}">${names}</div>${dot ? `<div class="fin-d">${dot}</div>` : ""}</section>`;
}
