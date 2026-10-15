// Toigo — photo collection: eight designs built on Toigo's own generated photographs (public/img/ph).
// Some keep their photo as a backdrop and show the customer's photo in a frame ("inset"),
// others let the customer's photo replace the cover photo ("replace").

export const PHOTO_IDS = ["ivorygold", "bloom", "mountain", "lens", "akjol", "emnight", "nur", "blush"];

export const PHOTO_TPL = [
  { id: "ivorygold", types: ["uylonuu", "nikah", "kyz", "maarake"], name: { ky: "Ivory & Gold", ru: "Ivory & Gold" },
    desc: { ky: "Сүт түстөгү кагаз, ак гүлдөр жана алтын жалатылган тамгалар.", ru: "Бумага цвета слоновой кости, белые цветы и золотое тиснение." } },
  { id: "bloom", types: ["uylonuu", "nikah", "tuulgan", "maarake", "kyz"], name: { ky: "Garden Bloom", ru: "Garden Bloom" },
    desc: { ky: "Жашыл бак, ак гүлдөр жана жарык карточка.", ru: "Зелёный сад, белые цветы и светлая карточка." } },
  { id: "mountain", types: ["uylonuu", "kyz", "nikah", "maarake"], name: { ky: "Mountain Romance", ru: "Mountain Romance" },
    desc: { ky: "Ысык-Көл, алтын саат жана Ала-Тоо.", ru: "Иссык-Куль, золотой час и горы Ала-Тоо." } },
  { id: "lens", types: ["uylonuu", "kyz", "nikah", "tuulgan", "maarake"], name: { ky: "Photo Editorial", ru: "Photo Editorial" },
    desc: { ky: "Чоң сүрөт жана журналдык тамгалар. Өз сүрөтүңүздү коюңуз.", ru: "Большое фото и журнальная типографика. Поставьте своё фото." } },
  { id: "akjol", types: ["kyz"], name: { ky: "Ак жол", ru: "Ак жол" },
    desc: { ky: "Боз үйдүн эшиги, шөкүлө жана бордо-алтын түстөр.", ru: "Дверь юрты, шөкүлө и бордово-золотые тона." } },
  { id: "emnight", types: ["uylonuu", "maarake", "nikah", "tuulgan"], name: { ky: "Midnight Elegance", ru: "Midnight Elegance" },
    desc: { ky: "Шамдар, кечки көл жана кочкул жашыл менен алтын.", ru: "Свечи, вечернее озеро, тёмно-зелёный и золото." } },
  { id: "nur", types: ["nikah"], name: { ky: "Нур", ru: "Нур" },
    desc: { ky: "Ак жибек, фанарлар жана ак гүлдөр. Нике кыюу үчүн.", ru: "Белый шёлк, фонари и белые цветы. Для никаха." } },
  { id: "blush", types: ["tuulgan"], name: { ky: "Blush Party", ru: "Blush Party" },
    desc: { ky: "Шампань шарлар, торт жана назик түстөр.", ru: "Шары цвета шампань, торт и нежные оттенки." } }
];

const IMG = { ivorygold: "floral-ivory", bloom: "botanical", mountain: "issykkul", lens: "bouquet", akjol: "kyz", emnight: "table", nur: "nikah", blush: "birthday" };
const REPLACE = new Set(["lens", "akjol", "emnight", "nur"]);

export const PHOTO_THEME = { ivorygold: "#F6F1E6", bloom: "#DDE3D3", mountain: "#E9D7C2", lens: "#FFFFFF", akjol: "#3F1219", emnight: "#0F2A22", nur: "#F7F3EA", blush: "#F6EDE7" };
export const PHOTO_SWATCH = Object.fromEntries(PHOTO_IDS.map(id => [id, `center/cover url(/img/ph/${IMG[id]}-s.webp)`]));
export const photoOg = id => `/img/ph/${IMG[id]}.webp`;

const LEAF = '<svg viewBox="0 0 120 22" aria-hidden="true"><path d="M4 14C40 2 80 2 116 14" fill="none" stroke="currentColor" stroke-width="1"/><g fill="currentColor"><path d="M34 8c4-5 10-5 13-2-4 4-9 4-13 2zM86 8c-4-5-10-5-13-2 4 4 9 4 13 2z"/><circle cx="60" cy="5" r="2.2"/></g></svg>';
const RULE = '<svg viewBox="0 0 160 12" aria-hidden="true"><path d="M0 6h68M92 6h68" stroke="currentColor" stroke-width=".8"/><path d="M80 1l5 5-5 5-5-5z" fill="none" stroke="currentColor"/></svg>';
const KYAL = '<svg viewBox="0 0 168 16" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="1">' + Array.from({ length: 7 }, (_, i) => `<path d="M${i * 24 + 2} 8l10-6 10 6-10 6z"/>`).join("") + '</g></svg>';
const ORN = { ivorygold: RULE, bloom: LEAF, mountain: RULE, lens: "", akjol: KYAL, emnight: RULE, nur: LEAF, blush: LEAF };

export function photoOrn(tpl) {
  return tpl === "lens" ? '<span class="orn orn-lens" aria-hidden="true"></span>' : `<span class="orn orn-${tpl}" aria-hidden="true">${ORN[tpl]}</span>`;
}

const src = (id, mini) => `/img/ph/${IMG[id]}${mini ? "-s" : ""}.webp`;

/** h: helpers from invite-core { esc, names, ey, p, dot, longD, when, nm, cue, photo } */
export function photoCover(d, h, mini) {
  const { esc, ey, p, dot, longD, when, nm, cue, photo } = h;
  const t = d.tpl, own = photo && REPLACE.has(t);
  const bg = `<img class="hph" src="${esc(own ? photo : src(t, mini))}" alt="" decoding="async"${mini ? ' loading="lazy"' : ' fetchpriority="high"'}>`;
  const inset = photo && !REPLACE.has(t) ? `<div class="pin"><img src="${esc(photo)}" alt="" decoding="async"></div>` : "";
  const cls = `cv${own ? " has-ph" : ""}`;
  const mon = p ? (d.lang === "ru" ? p.mon : p.monKy) : "";
  switch (t) {
    case "ivorygold": return `<div class="${cls}"><div class="art">${bg}</div><div class="hc">${inset}
      <div class="ey">${ey}</div>${nm}<span class="orn-i">${RULE}</span><div class="dt">${dot}</div><div class="sub">${when}</div></div>${cue}</div>`;
    case "bloom": return `<div class="${cls}"><div class="art">${bg}</div><div class="hc"><div class="card">${inset}
      <span class="orn-i">${LEAF}</span><div class="ey">${ey}</div>${nm}<div class="dt">${longD}</div><div class="sub">${when}</div></div></div>${cue}</div>`;
    case "mountain": return `<div class="${cls}"><div class="art">${bg}</div><div class="hc">
      <div class="ey">${ey}</div>${nm}<div class="dt">${longD}</div><div class="sub">${when}</div>${inset}</div>${cue}</div>`;
    case "lens": return `<div class="${cls}"><div class="art">${bg}</div><div class="hc">
      <div class="ey">${ey}</div>${nm}${p ? `<div class="ld"><b>${p.dd}</b><span>${esc(mon)}<br>${p.y}</span><em>${when}</em></div>` : `<div class="sub">${when}</div>`}</div>${cue}</div>`;
    case "akjol": return `<div class="${cls}"><div class="art">${bg}</div><div class="hc">
      <span class="orn-i">${KYAL}</span><div class="ey">${ey}</div>${nm}<div class="dt">${longD}</div><div class="sub">${when}</div></div>${cue}</div>`;
    case "emnight": return `<div class="${cls}"><div class="art">${bg}</div><div class="hc">
      <div class="ey">${ey}</div>${nm}<span class="orn-i">${RULE}</span><div class="dt">${dot}</div><div class="sub">${when}</div></div>${cue}</div>`;
    case "nur": return `<div class="${cls}"><div class="art">${bg}</div><div class="hc">
      <span class="orn-i">${LEAF}</span><div class="ey">${ey}</div>${nm}<div class="dt">${longD}</div><div class="sub">${when}</div></div>${cue}</div>`;
    case "blush": return `<div class="${cls}"><div class="art">${bg}</div><div class="hc">${inset}
      <div class="ey">${ey}</div>${nm}<div class="dt"><span>${dot}</span></div><div class="sub">${when}</div></div>${cue}</div>`;
  }
  return "";
}

export function photoFinale(d, h) {
  const { names, dot, fin, nl } = h;
  return `<section class="fin fin-ph"><div class="fin-bg"><img src="${src(d.tpl)}" alt="" loading="lazy" decoding="async"></div><span class="fin-o" aria-hidden="true">${ORN[d.tpl] || ""}</span><p class="fin-k">${fin}</p><div class="fin-n" style="--nl:${nl}">${names}</div>${dot ? `<div class="fin-d">${dot}</div>` : ""}</section>`;
}
