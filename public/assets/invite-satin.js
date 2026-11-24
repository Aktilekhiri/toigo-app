// Toigo — "Ак шөкүлө": a kyz uzatuu invitation told as full-screen scenes, like stories
// (cover with the shokulo → poem → "Dear guests" → date and place → programme → RSVP → the hosts).
// Pure string builders shared by the server page and the constructor preview. Styles: invite.css (.inv.st).

export const SATIN_TPL = {
  id: "shokulo", types: ["kyz"], name: { ky: "Ак шөкүлө", ru: "Ак шөкүлө" },
  desc: { ky: "Сторис сыяктуу: ар бир бет толук экранда, атлас, шөкүлө жана кочкор мүйүз оюму.",
          ru: "Как сторис: каждая сцена на весь экран, атлас, шөкүлө и орнамент «кочкор мүйүз»." }
};

const IMG = n => `/img/st/${n}.webp`;
const DEMO = { cover: IMG("cover"), gift: IMG("gift"), fin: IMG("bride") };

// Kyrgyz ornament: one "ram's horn" pair, reused in dividers, bands and the medallion.
const HORN = '<path d="M20 19C20 11 14 5 8 6C3 7 2 13 6 14C9 15 11 11 8 10M20 19C20 11 26 5 32 6C37 7 38 13 34 14C31 15 29 11 32 10"/><path d="M20 1l3 4-3 4-3-4z" class="f"/>';
const DIV = `<svg class="st-div" viewBox="0 0 200 22" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round">
  <g transform="translate(80 1)">${HORN}</g><g transform="translate(30 5) scale(.7)">${HORN}</g><g transform="translate(142 5) scale(.7)">${HORN}</g>
  <path d="M4 15h22M174 15h22"/></g><g fill="currentColor"><path d="M70 12l3 3-3 3-3-3zM130 12l3 3-3 3-3-3z"/></g></svg>`;
const MED = `<svg class="st-med" viewBox="-42 -42 84 84" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
  ${[0, 90, 180, 270].map(a => `<g transform="rotate(${a}) translate(-20 -40)">${HORN}</g>`).join("")}<path d="M0-9L9 0 0 9-9 0z" class="f"/></g></svg>`;

const LBL = {
  ky: { kyz: "Кыз узатуу", dear: "Урматтуу коноктор!", addr: "Дарегибиз:", prog: "Той тартиби", dress: "Дресс-код", cd: "Тойго чейин",
        rsvp: "Келе аласызбы?", hosts: "Сиздерди терең урматтоо менен той ээлери:", contact: "Байланыш",
        inv: n => `Сиздерди ажарлуу кызыбыз <b class="st-scr">${gen(n)}</b> кыз узатуу аземине келип, кадырлуу коногубуз болууга чакырабыз`,
        poem: "Бешиктен бери аялап,\nБир кызды өстүрдүк эркелеп.\nБүгүн анын жаңы жолун\nБаштайбыз ак бата менен.\n\nАта-бабадан калган салт —\nКызды сыйлап узатмак.\nУшул кутман күнүбүздө\nЖаныбызда болуңуз!" },
  ru: { kyz: "Кыз узатуу", dear: "Дорогие гости!", addr: "Наш адрес:", prog: "Программа", dress: "Дресс-код", cd: "До тоя",
        rsvp: "Вы придёте?", hosts: "С глубоким уважением, хозяева тоя:", contact: "Связаться",
        inv: n => `Приглашаем вас на кыз узатуу нашей прекрасной дочери <b class="st-scr">${n}</b> — будьте нашими дорогими гостями`,
        poem: "Мы растили дочь с любовью,\nКак цветок, как свет в окне.\nПровожаем в путь счастливый —\nБудьте рядом в этот день!\n\nПо обычаю старинному\nДочь проводим в новый дом.\nЗа богатым дастарханом\nВаших добрых слов мы ждём." }
};
// Kyrgyz genitive ending by vowel harmony: Айгерим → Айгеримдин, Нурбүбү → Нурбүбүнүн, Бакыт → Бакыттын.
export function gen(name) {
  const s = String(name).trim(), low = s.toLowerCase(), last = low.slice(-1);
  const v = (low.match(/[аыоуэиөүеёюя]/g) || ["а"]).pop();
  const y = "аыяё".includes(v) ? "ы" : "эие".includes(v) ? "и" : "оую".includes(v) ? "у" : "ү";
  const c = "аыоуэиөүеёюя".includes(last) ? "н" : "кпстфхшчщц".includes(last) ? "т" : "д";
  return s ? `${s}${c}${y}н` : s;
}
const L = d => d.lang === "ru" ? LBL.ru : LBL.ky;
const lab = (d, k) => d.lang === "both" ? `${LBL.ky[k]}<span class="alt">${LBL.ru[k]}</span>` : L(d)[k];

function pics(d, photoUrl) {
  const P = (d.photos || []).map(photoUrl);
  return { cover: P[0] || DEMO.cover, gift: P[1] || DEMO.gift, fin: P[2] || DEMO.fin, more: P.slice(3) };
}
const bg = (src, pos = "50% 50%", lazy = true) => `<img class="st-bg" src="${src}" alt="" decoding="async" style="object-position:${pos}"${lazy ? ' loading="lazy"' : ' fetchpriority="high"'}>`;
const date3 = p => p ? `<div class="st-date">${p.dd}<i></i>${p.mm}<i></i>${p.y}</div>` : "";

/** h: { esc, names, ey, p, dot, longD, when } from invite-core */
export function satinCover(d, h, opts = {}) {
  const { esc, p } = h, mini = !!opts.mini;
  const src = mini && !(d.photos && d.photos.length) ? IMG("cover-s") : pics(d, opts.photoUrl || (id => `/media/${id}`)).cover;
  return `<div class="cv st-sc st-cv">${bg(esc(src), "50% 30%", mini)}
    <div class="hc st-in"><h1 class="nm st-scr st-big">${esc(d.n1 || "…")}</h1><div class="ey">${lab(d, "kyz")}</div>
      ${p ? `<div class="st-dot">${h.dot}</div>` : ""}</div>
    ${mini ? "" : '<span class="cue st-cue" aria-hidden="true"></span>'}</div>`;
}

/** x: everything renderInvitation already worked out */
export function renderSatin(d, opts, x) {
  const { T, h, esc, pr, ts, q, phone, waNum, guest, dear, photoUrl, head, rsvpInner, seat } = x;
  const P = pics(d, photoUrl), p = h.p;
  const poem = (d.story || L(d).poem).split(/\n{2,}/).map(s => `<p>${esc(s).replace(/\n/g, "<br>")}</p>`).join(DIV);
  const sc = (cls, inner, img = "") => `<section class="st-sc ${cls}">${img}<div class="st-in">${inner}</div></section>`;
  const satin = bg(IMG("satin"));
  const greet = guest ? `${dear ? `<span>${dear}</span> ` : ""}${esc(guest.name)}${d.lang === "ru" ? "," : "!"}` : lab(d, "dear");
  return `${head}
  ${satinCover(d, h, { photoUrl })}
  ${sc("st-poem", `<div class="st-card">${poem}</div>`, satin)}
  ${sc("st-inv", `<p class="st-scr st-h">${greet}</p><p class="st-txt">${L(d).inv(esc(d.n1 || "…"))}</p>
    ${d.msg ? `<p class="st-msg">${esc(d.msg)}</p>` : ""}`, bg(esc(P.gift), "50% 20%") + MED.replace('class="st-med"', 'class="st-med l"') + MED.replace('class="st-med"', 'class="st-med r"'))}
  ${sc("st-det", `${date3(p)}${d.time ? `<div class="st-time">${esc(d.time)}</div>` : ""}<div class="st-wd">${esc(T.wd(d.date))}</div>${DIV}
    ${(d.venue || d.addr) ? `<p class="st-k">${lab(d, "addr")}</p>${d.venue ? `<p class="st-vn">${esc(d.venue)}</p>` : ""}${d.addr ? `<p class="st-ad">${esc(d.addr)}</p>` : ""}${seat}
    ${q ? `<div class="row2"><a class="ib f" href="https://2gis.kg/search/${q}" target="_blank" rel="noopener">2GIS</a><a class="ib" href="https://www.google.com/maps/search/?api=1&amp;query=${q}" target="_blank" rel="noopener">Google Maps</a></div>` : ""}` : ""}
    ${ts ? `<p class="st-k">${lab(d, "cd")}</p><div class="cd" data-ts="${ts}" data-past="${esc(T.P("past"))}"><div><b data-u="d">0</b><span>${T.P("d")}</span></div><div><b data-u="h">0</b><span>${T.P("h")}</span></div><div><b data-u="m">0</b><span>${T.P("m")}</span></div><div><b data-u="s">0</b><span>${T.P("s")}</span></div></div>` : ""}`,
    bg(IMG("hall")))}
  ${pr.length || d.dress ? sc("st-prog", `<p class="st-scr st-h">${lab(d, "prog")}</p>${pr.length ? `<ol class="st-tl">${pr.map(i => `<li><time>${esc(i.t)}</time><span>${esc(i.x)}</span></li>`).join("")}</ol>` : ""}
    ${d.dress ? `${DIV}<p class="st-k">${lab(d, "dress")}</p><p class="st-txt">${esc(d.dress)}</p>` : ""}`, satin) : ""}
  ${P.more.length ? sc("st-gal", `<div class="gal">${P.more.map(s => `<img src="${esc(s)}" alt="" loading="lazy" decoding="async" data-act="zoom">`).join("")}</div>`, satin) : ""}
  ${sc("st-rsvp", `<p class="st-scr st-h">${lab(d, "rsvp")}</p>${d.dl ? `<div class="sub">${T.deadline(d.dl)}</div>` : ""}<div class="st-form">${rsvpInner}</div>
    ${phone ? `<p class="st-k">${lab(d, "contact")}</p><div class="row2"><a class="ib f" href="https://wa.me/${waNum}" target="_blank" rel="noopener">WhatsApp</a><a class="ib" href="tel:${esc(phone)}">${T.P("call")}</a></div>` : ""}`, satin)}
  ${sc("st-fin", `<p class="st-txt">${lab(d, "hosts")}</p>${DIV}<p class="st-scr st-big st-hosts">${esc(d.hosts || d.n1 || "")}</p>${DIV}${p ? `<div class="st-dot">${h.dot}</div>` : ""}`, bg(esc(P.fin), "50% 25%"))}
  <footer class="ft"><a href="/" target="_blank" rel="noopener">${T.P("made")}</a></footer></div>`;
}
