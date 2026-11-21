// Toigo — "The Art of Toi": an editorial, magazine-style invitation with its own section layout
// (cover → story → countdown band → destination → celebration → RSVP → final photograph).
// Pure string builders shared by the server page and the constructor preview. Styles: invite.css (.inv.ed).

export const ART_TPL = {
  id: "art", types: ["uylonuu", "maarake"], name: { ky: "The Art of Toi", ru: "The Art of Toi" },
  desc: { ky: "Журналдык стиль: чоң кинематографиялык сүрөттөр, «Биздин тарых» жана асимметриялык галерея.",
          ru: "Журнальная эстетика: большие кинематографичные фото, «Наша история» и асимметричная галерея." }
};

// Toigo's own editorial photographs, used where the couple has not uploaded theirs.
const IMG = n => `/img/art/${n}.webp`;
const DEMO = { cover: IMG("cover"), story: [IMG("couple"), IMG("hands"), IMG("bride")], finale: IMG("finale") };
const PROPS = { venue: IMG("venue"), table: IMG("table"), silk: IMG("silk"), hands: IMG("hands") };

const LBL = {
  ky: { invited: "Сиз чакырылдыңыз", story: "Биздин тарых", celebration: "Салтанат", venue: "Той өтүүчү жер", date: "Күнү", time: "Башталышы",
        cd: "Тойго чейин", rsvp: "Келе аласызбы?", fin: "Сиздерди чын жүрөктөн күтөбүз", thanks: "Бул күндү биз менен бөлүшкөнүңүз үчүн рахмат.", scroll: "Ылдый",
        dress: "Дресс-код", contact: "Байланыш",
        story0: "Биздин окуябыз жөнөкөй башталган: бир жылмаюу, бир сүйлөшүү жана кайра-кайра кездешкибиз келген күндөр. Ошол күндөрдөн бери биз бирге күлүп, бирге кыялданып, бир үй-бүлө болууну чечтик. Эми өмүрүбүздүн эң маанилүү күнүндө сиздер жаныбызда болушуңузду каалайбыз." },
  ru: { invited: "Вы приглашены", story: "Наша история", celebration: "Торжество", venue: "Место проведения", date: "Дата", time: "Начало",
        cd: "До торжества", rsvp: "Вы придёте?", fin: "Ждём вас всем сердцем", thanks: "Спасибо, что разделите этот день с нами.", scroll: "Листайте",
        dress: "Дресс-код", contact: "Связаться",
        story0: "Наша история началась просто: одна улыбка, один разговор и дни, когда хотелось встречаться снова и снова. С тех пор мы смеёмся вместе, мечтаем вместе и решили стать одной семьёй. В самый важный день нашей жизни мы хотим, чтобы вы были рядом." }
};
const lab = (d, k) => d.lang === "both" ? `${LBL.ky[k]}<span class="alt">${LBL.ru[k]}</span>` : (LBL[d.lang] || LBL.ky)[k];
const story0 = d => d.lang === "ru" ? LBL.ru.story0 : LBL.ky.story0;

function pics(d, photoUrl) {
  const P = (d.photos || []).map(photoUrl);
  if (!P.length) return { cover: DEMO.cover, story: DEMO.story, finale: DEMO.finale, own: false };
  // the couple's own photos first; gaps are filled with still lifes, never with other people's faces
  return { cover: P[0], story: [P[1] || PROPS.hands, P[2] || PROPS.silk, P[3] || PROPS.table], finale: P[4] || P[0], own: true };
}
const img = (src, cls, alt = "", lazy = true) => `<img class="${cls}" src="${src}" alt="${alt}" decoding="async"${lazy ? ' loading="lazy"' : ' fetchpriority="high"'}>`;

/** h: { esc, names, ey, p, dot, longD, when } from invite-core */
export function artCover(d, h, opts = {}) {
  const { esc, ey, p, when } = h, mini = !!opts.mini;
  const photoUrl = opts.photoUrl || (id => `/media/${id}`);
  const src = mini && !(d.photos && d.photos.length) ? IMG("cover-s") : pics(d, photoUrl).cover;
  const pair = d.n2 && !["kyz", "tuulgan", "sunnot", "tushoo"].includes(d.type);
  const mon = p ? (d.lang === "ru" ? p.mon : p.monKy) : "";
  return `<div class="cv ed-cv"><div class="ed-ph">${img(esc(src), "hph", "", mini)}</div>
    <div class="ed-top"><span>${lab(d, "invited")}</span></div>
    <div class="hc ed-hc"><div class="ey">${ey}</div>
      <h1 class="nm ed-nm"><span>${esc(d.n1 || "…")}</span>${pair ? `<i class="amp">&amp;</i><span>${esc(d.n2)}</span>` : ""}</h1>
      ${p ? `<div class="ed-dt"><b>${p.dd}</b><span>${esc(mon)}<br>${p.y}</span><em>${when}</em></div>` : `<div class="sub">${when}</div>`}</div>
    ${mini ? "" : `<span class="cue ed-cue" aria-hidden="true">${lab(d, "scroll")}</span>`}</div>`;
}

/** x: everything renderInvitation already worked out (T, helpers, form markup …) */
export function renderArt(d, opts, x) {
  const { T, h, esc, pr, ts, q, phone, waNum, guest, dear, photoUrl, head, rsvpInner, seat } = x;
  const P = pics(d, photoUrl);
  const story = (d.story || story0(d)).split(/\n{2,}/).map(s => `<p>${esc(s)}</p>`).join("");
  const hdr = (no, k, plain) => `<header class="ed-h"><span class="ed-no">${no}</span><h2>${plain || lab(d, k)}</h2></header>`;
  let n = 0; const no = () => String(++n).padStart(2, "0");
  return `${head}
  ${artCover(d, h, { photoUrl })}
  <section class="ed-sec ed-story">${hdr(no(), "story")}
    ${guest ? `<p class="to">${dear ? `<span>${dear}</span>` : ""}<b>${esc(guest.name)}${d.lang === "ru" ? "," : "!"}</b></p>` : ""}
    <p class="ed-lead">${T.TT(d.type, "inv")}</p>
    <div class="ed-grid"><figure class="g1">${img(esc(P.story[0]), "", "")}</figure><figure class="g2">${img(esc(P.story[1]), "", "")}</figure><figure class="g3">${img(esc(P.story[2]), "", "")}</figure></div>
    <div class="ed-text">${story}</div>
    ${d.msg ? `<p class="msg">${esc(d.msg)}</p>` : ""}
    ${d.hosts ? `<div class="hosts">${T.P("hosts")}<b>${esc(d.hosts)}</b></div>` : ""}</section>
  ${ts ? `<section class="ed-band"><p class="ed-k">${lab(d, "cd")}</p>
    <div class="cd" data-ts="${ts}" data-past="${esc(T.P("past"))}"><div><b data-u="d">0</b><span>${T.P("d")}</span></div><div><b data-u="h">0</b><span>${T.P("h")}</span></div><div><b data-u="m">0</b><span>${T.P("m")}</span></div><div><b data-u="s">0</b><span>${T.P("s")}</span></div></div></section>` : ""}
  ${(d.venue || d.addr) ? `<section class="ed-sec ed-dest">${hdr(no(), "venue")}
    <figure class="ed-wide">${img(PROPS.venue, "", "")}</figure>
    <div class="ed-card">${d.venue ? `<h3 class="vn">${esc(d.venue)}</h3>` : ""}${d.addr ? `<p class="ad">${esc(d.addr)}</p>` : ""}${seat}
      <dl>${d.date ? `<div><dt>${lab(d, "date")}</dt><dd>${h.longD}</dd></div>` : ""}${d.time ? `<div><dt>${lab(d, "time")}</dt><dd>${esc(d.time)}</dd></div>` : ""}</dl>
      ${q ? `<div class="row2"><a class="ib f" href="https://2gis.kg/search/${q}" target="_blank" rel="noopener">2GIS</a><a class="ib" href="https://www.google.com/maps/search/?api=1&amp;query=${q}" target="_blank" rel="noopener">Google Maps</a></div>` : ""}</div></section>` : ""}
  ${pr.length || d.dress ? `<section class="ed-sec ed-cel">${hdr(no(), "celebration")}
    <div class="ed-cel-in">${pr.length ? `<ol class="ed-tl">${pr.map(i => `<li><time>${esc(i.t)}</time><span>${esc(i.x)}</span></li>`).join("")}</ol>` : ""}
      <div class="ed-pair"><figure>${img(PROPS.table, "", "")}</figure><figure>${img(PROPS.silk, "", "")}</figure></div></div>
    ${d.dress ? `<div class="ed-dress"><span class="ed-k">${lab(d, "dress")}</span><p>${esc(d.dress)}</p></div>` : ""}</section>` : ""}
  <section class="ed-sec ed-rsvp">${hdr(no(), "rsvp")}${d.dl ? `<div class="sub">${T.deadline(d.dl)}</div>` : ""}${rsvpInner}
    ${phone ? `<div class="ed-contact"><span class="ed-k">${lab(d, "contact")}</span><div class="row2"><a class="ib f" href="https://wa.me/${waNum}" target="_blank" rel="noopener">WhatsApp</a><a class="ib" href="tel:${esc(phone)}">${T.P("call")}</a></div></div>` : ""}</section>
  <section class="ed-fin"><figure>${img(esc(P.finale), "", "")}</figure>
    <div class="ed-fin-t"><p class="ed-k">${lab(d, "fin")}</p><div class="nm">${h.names}</div><p class="ed-thx">${lab(d, "thanks")}</p>${h.dot ? `<span class="ed-d">${h.dot}</span>` : ""}</div></section>
  <footer class="ft"><a href="/" target="_blank" rel="noopener">${T.P("made")}</a></footer></div>`;
}
