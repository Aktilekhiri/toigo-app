// Toigo — photo collection: twelve designs (incl. three watercolors) built on Toigo's own generated photographs (public/img/ph).
// Some keep their photo as a backdrop and show the customer's photo in a frame ("inset"),
// others let the customer's photo replace the cover photo ("replace").

export const PHOTO_IDS = ["ivorygold", "bloom", "mountain", "lens", "akjol", "emnight", "nur", "blush", "muras", "wclake", "wcpeony", "jailoo",
  // 2026-11 collection
  "altyn", "ordo", "akkagaz", "gulzar", "khan", "arka", "anarkyz", "fiesta", "wcblue", "zhyldyz"];

export const PHOTO_TPL = [
  { id: "ivorygold", types: ["uylonuu", "kyz", "maarake"], name: { ky: "Ivory & Gold", ru: "Ivory & Gold" },
    desc: { ky: "Сүт түстөгү кагаз, ак гүлдөр жана алтын жалатылган тамгалар.", ru: "Бумага цвета слоновой кости, белые цветы и золотое тиснение." } },
  { id: "bloom", types: ["uylonuu", "tuulgan", "maarake", "kyz"], name: { ky: "Garden Bloom", ru: "Garden Bloom" },
    desc: { ky: "Жашыл бак, ак гүлдөр жана жарык карточка.", ru: "Зелёный сад, белые цветы и светлая карточка." } },
  { id: "mountain", types: ["uylonuu", "kyz", "maarake"], name: { ky: "Mountain Romance", ru: "Mountain Romance" },
    desc: { ky: "Ысык-Көл, алтын саат жана Ала-Тоо.", ru: "Иссык-Куль, золотой час и горы Ала-Тоо." } },
  { id: "lens", types: ["uylonuu", "kyz", "tuulgan", "maarake"], name: { ky: "Photo Editorial", ru: "Photo Editorial" },
    desc: { ky: "Чоң сүрөт жана журналдык тамгалар. Өз сүрөтүңүздү коюңуз.", ru: "Большое фото и журнальная типографика. Поставьте своё фото." } },
  { id: "akjol", types: ["kyz"], name: { ky: "Ак жол", ru: "Ак жол" },
    desc: { ky: "Боз үйдүн эшиги, шөкүлө жана бордо-алтын түстөр.", ru: "Дверь юрты, шөкүлө и бордово-золотые тона." } },
  { id: "emnight", types: ["uylonuu", "maarake", "tuulgan"], name: { ky: "Midnight Elegance", ru: "Midnight Elegance" },
    desc: { ky: "Кочкул жашыл бархат, ак гүлдөр жана шамдар.", ru: "Тёмно-зелёный бархат, белые цветы и свечи." } },
  { id: "nur", types: ["uylonuu"], name: { ky: "Нур", ru: "Нур" },
    desc: { ky: "Ак жибек, фанарлар жана ак гүлдөр. Нике кыюуга да ылайык.", ru: "Белый шёлк, фонари и белые цветы. Подходит и для никаха." } },
  { id: "blush", types: ["tuulgan"], name: { ky: "Blush Party", ru: "Blush Party" },
    desc: { ky: "Шампань шарлар, торт жана назик түстөр.", ru: "Шары цвета шампань, торт и нежные оттенки." } },
  { id: "muras", types: ["uylonuu", "kyz", "sunnot", "tushoo", "maarake"], name: { ky: "Мурас", ru: "Мурас" },
    desc: { ky: "Ак кийиз, кочкор мүйүз оюм-чийме жана жез табак.", ru: "Белый войлок, орнамент «кочкор мүйүз» и медная чаша." } },
  { id: "wclake", types: ["uylonuu", "maarake", "tuulgan"], name: { ky: "Акварель · Ала-Тоо", ru: "Акварель · Ала-Тоо" },
    desc: { ky: "Акварель тоолор, көк көл жана кызгалдактар.", ru: "Акварельные горы, бирюзовое озеро и маки." } },
  { id: "wcpeony", types: ["kyz", "uylonuu", "tuulgan"], name: { ky: "Акварель · Анар гүл", ru: "Акварель · Гранатовый сад" },
    desc: { ky: "Пиондор, анар гүлдөрү жана бордо-кызгылт түстөр.", ru: "Пионы, цветы граната и бордово-розовые тона." } },
  { id: "jailoo", types: ["sunnot", "tushoo", "maarake", "tuulgan"], name: { ky: "Акварель · Жайлоо", ru: "Акварель · Жайлоо" },
    desc: { ky: "Жайлоо, боз үйлөр, жылкылар жана талаа гүлдөрү.", ru: "Жайлоо, юрты, лошади и полевые цветы." } }
  ,
  // ---------- 2026-11 collection: ten designs on Toigo's own generated artwork ----------
  { id: "altyn", types: ["uylonuu", "maarake"], name: { ky: "Алтын Сарай", ru: "Алтын Сарай" },
    desc: { ky: "Шампань жибек, алтын рамка жана ак орхидеялар. Люкс үйлөнүү той.", ru: "Шампань-шёлк, золотая рамка и белые орхидеи. Люкс-свадьба." } },
  { id: "ordo", types: ["uylonuu", "kyz", "sunnot", "tushoo", "maarake"], name: { ky: "Ордо", ru: "Ордо" },
    desc: { ky: "Ак кийиз жана кызыл шырдак оюму — улуттук стиль заманбап түрдө.", ru: "Белый войлок и красный орнамент шырдака — национальный стиль по-современному." } },
  { id: "akkagaz", types: ["uylonuu", "maarake", "tuulgan"], name: { ky: "Ак кагаз", ru: "Ак кагаз" },
    desc: { ky: "Кол менен жасалган кагаз, бир тал пампас жана таза типографика.", ru: "Бумага ручной работы, веточка пампаса и чистая типографика." } },
  { id: "gulzar", types: ["uylonuu", "kyz", "tuulgan"], name: { ky: "Гүлзар", ru: "Гүлзар" },
    desc: { ky: "Пиондор, ак розалар жана эвкалипт назик кызгылт фондо.", ru: "Пионы, кремовые розы и эвкалипт на нежно-розовом фоне." } },
  { id: "khan", types: ["uylonuu", "kyz", "maarake"], name: { ky: "Хан Сарай", ru: "Хан Сарай" },
    desc: { ky: "Бордо баркыт, алтын барокко рамка жана шам жарыгы.", ru: "Бордовый бархат, золотая барочная рама и свет свечи." } },
  { id: "arka", types: ["uylonuu", "maarake", "tuulgan"], name: { ky: "Арка", ru: "Арка" },
    desc: { ky: "Заманбап европалык стиль: шалфей түстүү арка, күн нуру жана ак розалар.", ru: "Современная европейская эстетика: арка цвета шалфея, солнце и белые розы." } },
  { id: "anarkyz", types: ["kyz"], name: { ky: "Анар кыз", ru: "Анар кыз" },
    desc: { ky: "Ак жибек жоолук, анар жана күмүш шуру — кыз узатууга.", ru: "Белый шёлк, гранаты и серебряные украшения — для кыз узатуу." } },
  { id: "fiesta", types: ["tuulgan", "tushoo"], name: { ky: "Фиеста", ru: "Фиеста" },
    desc: { ky: "Түстүү шарлар, конфетти жана шаңдуу маанай. Туулган күнгө.", ru: "Яркие шары, конфетти и праздничное настроение. Для дня рождения." } },
  { id: "wcblue", types: ["uylonuu", "kyz", "tuulgan", "maarake"], name: { ky: "Акварель · Көгүлтүр", ru: "Акварель · Голубой сад" },
    desc: { ky: "Акварель гортензия, лаванда жана эвкалипт көк-сирень түстөрдө.", ru: "Акварельные гортензии, лаванда и эвкалипт в голубо-сиреневых тонах." } },
  { id: "zhyldyz", types: ["uylonuu", "tuulgan", "maarake"], name: { ky: "Жылдыз", ru: "Жылдыз" },
    desc: { ky: "Кара фон, алтын жарыктар жана учкундар. Кечки салтанатка.", ru: "Чёрный фон, золотые огни и искры. Для вечернего торжества." } }
];

const IMG = { ivorygold: "floral-ivory", bloom: "botanical", mountain: "issykkul", lens: "bride", akjol: "kyz", emnight: "emerald", nur: "nikah", blush: "birthday", muras: "heritage", wclake: "wc-lake", wcpeony: "wc-peony", jailoo: "wc-jailoo",
  altyn: "nx-altyn", ordo: "nx-ordo", akkagaz: "nx-akkagaz", gulzar: "nx-gulzar", khan: "nx-khan", arka: "nx-arka", anarkyz: "nx-anarkyz", fiesta: "nx-fiesta", wcblue: "nx-wcblue", zhyldyz: "nx-zhyldyz" };
const REPLACE = new Set(["lens", "akjol", "nur"]);

export const PHOTO_THEME = { ivorygold: "#F6F1E6", bloom: "#DDE3D3", mountain: "#E9D7C2", lens: "#FFFFFF", akjol: "#3F1219", emnight: "#0F2A22", nur: "#F7F3EA", blush: "#F6EDE7", muras: "#F3EDE1", wclake: "#FBF8F1", wcpeony: "#FBF8F2", jailoo: "#F4F6EC",
  altyn: "#F4EDE0", ordo: "#EFE7DA", akkagaz: "#E7E3DC", gulzar: "#F7E4E1", khan: "#3B0A12", arka: "#B7BCAB", anarkyz: "#F7F3EE", fiesta: "#FCD9C6", wcblue: "#FAFAF8", zhyldyz: "#06080F" };
export const PHOTO_SWATCH = Object.fromEntries(PHOTO_IDS.map(id => [id, `center/cover url(/img/ph/${IMG[id]}-s.webp)`]));
export const photoOg = id => `/img/ph/${IMG[id]}.webp`;

const LEAF = '<svg viewBox="0 0 120 22" aria-hidden="true"><path d="M4 14C40 2 80 2 116 14" fill="none" stroke="currentColor" stroke-width="1"/><g fill="currentColor"><path d="M34 8c4-5 10-5 13-2-4 4-9 4-13 2zM86 8c-4-5-10-5-13-2 4 4 9 4 13 2z"/><circle cx="60" cy="5" r="2.2"/></g></svg>';
const RULE = '<svg viewBox="0 0 160 12" aria-hidden="true"><path d="M0 6h68M92 6h68" stroke="currentColor" stroke-width=".8"/><path d="M80 1l5 5-5 5-5-5z" fill="none" stroke="currentColor"/></svg>';
const KYAL = '<svg viewBox="0 0 168 16" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="1">' + Array.from({ length: 7 }, (_, i) => `<path d="M${i * 24 + 2} 8l10-6 10 6-10 6z"/>`).join("") + '</g></svg>';
const SPRIG = '<img src="/img/ph/wc-sprig.webp" alt="" loading="lazy" decoding="async">';
const ORN = { ivorygold: RULE, bloom: LEAF, mountain: RULE, lens: "", akjol: KYAL, emnight: RULE, nur: LEAF, blush: LEAF, muras: KYAL, wclake: SPRIG, wcpeony: SPRIG, jailoo: SPRIG,
  altyn: RULE, ordo: KYAL, akkagaz: "", gulzar: LEAF, khan: RULE, arka: "", anarkyz: LEAF, fiesta: "", wcblue: LEAF, zhyldyz: RULE };

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
    case "emnight": return `<div class="${cls}"><div class="art">${bg}</div><div class="hc">${inset}
      <div class="ey">${ey}</div>${nm}<span class="orn-i">${RULE}</span><div class="dt">${dot}</div><div class="sub">${when}</div></div>${cue}</div>`;
    case "nur": return `<div class="${cls}"><div class="art">${bg}</div><div class="hc">
      <span class="orn-i">${LEAF}</span><div class="ey">${ey}</div>${nm}<div class="dt">${longD}</div><div class="sub">${when}</div></div>${cue}</div>`;
    case "blush": return `<div class="${cls}"><div class="art">${bg}</div><div class="hc">${inset}
      <div class="ey">${ey}</div>${nm}<div class="dt"><span>${dot}</span></div><div class="sub">${when}</div></div>${cue}</div>`;
    case "muras": return `<div class="${cls}"><div class="art">${bg}</div><div class="hc">${inset}
      <div class="ey">${ey}</div>${nm}<span class="orn-i">${KYAL}</span><div class="dt">${longD}</div><div class="sub">${when}</div></div>${cue}</div>`;
    // 2026-11 collection: one structure, each design styled in invite.css (.cv.nx)
    case "altyn": case "khan": case "zhyldyz": return `<div class="${cls} nx"><div class="art">${bg}</div><div class="hc">${inset}
      <div class="ey">${ey}</div>${nm}<span class="orn-i">${RULE}</span><div class="dt">${dot}</div><div class="sub">${when}</div></div>${cue}</div>`;
    case "ordo": return `<div class="${cls} nx"><div class="art">${bg}</div><div class="hc">${inset}
      <div class="ey">${ey}</div>${nm}<span class="orn-i">${KYAL}</span>${p ? `<div class="dbox"><span>${p.dd}</span><span>${esc(mon)}</span><span>${p.y}</span></div>` : ""}<div class="sub">${when}</div></div>${cue}</div>`;
    case "akkagaz": case "arka": return `<div class="${cls} nx"><div class="art">${bg}</div><div class="hc">${inset}
      <div class="ey">${ey}</div>${nm}<span class="ln" aria-hidden="true"></span><div class="dt">${dot}</div><div class="sub">${when}</div></div>${cue}</div>`;
    case "gulzar": case "anarkyz": case "wcblue": return `<div class="${cls} nx"><div class="art">${bg}</div><div class="hc">${inset}
      <div class="ey">${ey}</div>${nm}<span class="orn-i">${LEAF}</span><div class="dt">${longD}</div><div class="sub">${when}</div></div>${cue}</div>`;
    case "fiesta": return `<div class="${cls} nx"><div class="art">${bg}</div><div class="hc">${inset}
      <div class="ey">${ey}</div>${nm}<div class="dt"><span>${dot}</span></div><div class="sub">${when}</div></div>${cue}</div>`;
    case "wclake": case "wcpeony": case "jailoo": return `<div class="${cls} wc"><div class="art">${bg}</div><div class="hc">${inset}
      <div class="ey">${ey}</div>${nm}<div class="dt">${longD}</div><div class="sub">${when}</div></div>${cue}</div>`;
  }
  return "";
}

export function photoFinale(d, h) {
  const { names, dot, fin, nl } = h;
  return `<section class="fin fin-ph"><div class="fin-bg"><img src="${src(d.tpl)}" alt="" loading="lazy" decoding="async"></div><span class="fin-o" aria-hidden="true">${ORN[d.tpl] || ""}</span><p class="fin-k">${fin}</p><div class="fin-n" style="--nl:${nl}">${names}</div>${dot ? `<div class="fin-d">${dot}</div>` : ""}</section>`;
}
