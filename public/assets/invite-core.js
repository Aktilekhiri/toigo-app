// Toigo — shared invitation renderer.
// Used in the browser (constructor preview) and on the server (/i/:slug).
// Pure functions only: no DOM access here.

export const TYPES = {
  uylonuu: { ky: "Үйлөнүү той", ru: "Свадьба", names: "pair" },
  kyz:     { ky: "Кыз узатуу", ru: "Кыз узатуу", names: "kyz" },
  sunnot:  { ky: "Сүннөт той", ru: "Сүннөт той", names: "child" },
  tushoo:  { ky: "Тушоо кесүү", ru: "Тушоо кесүү", names: "child" },
  maarake: { ky: "Маараке", ru: "Юбилей", names: "jub" },
  tuulgan: { ky: "Туулган күн", ru: "День рождения", names: "bday" }
};

export const TPL = [
  { id: "alatoo",  name: { ky: "Ала-Тоо",   ru: "Ала-Тоо" },   desc: { ky: "Кар баскан тоолор жана түнкү көк асман.", ru: "Снежные горы и ночная синева." }, types: ["uylonuu","kyz","sunnot","tushoo","maarake","tuulgan"] },
  { id: "akkalpak",name: { ky: "Ак калпак", ru: "Ак калпак" }, desc: { ky: "Ак түс жана калпактын кара сайма оюму.", ru: "Белый фон и чёрный узор, как вышивка на калпаке." }, types: ["uylonuu","kyz","sunnot","maarake","tuulgan"] },
  { id: "shyrdak", name: { ky: "Шырдак",    ru: "Шырдак" },    desc: { ky: "Кызыл кийиз жана «кочкор мүйүз» оюму.", ru: "Красный войлок и орнамент «кочкор мүйүз»." }, types: ["uylonuu","kyz","sunnot","tushoo","maarake"] },
  { id: "jibek",   name: { ky: "Жибек",     ru: "Жибек" },     desc: { ky: "Шалфей түсү жана жибек жиптей ичке сызыктар.", ru: "Шалфей и тонкие линии, как шёлковая нить." }, types: ["uylonuu","kyz","maarake","tuulgan"] },
  { id: "anar",    name: { ky: "Анар",      ru: "Анар" },      desc: { ky: "Анар түсү, алтын чекиттер. Кыз узатууга ылайык.", ru: "Гранатовый цвет и золотые точки. Для кыз узатуу." }, types: ["kyz","uylonuu","maarake"] },
  { id: "asman",   name: { ky: "Көк асман", ru: "Көк асман" }, desc: { ky: "Ачык асман жана ак булуттар. Балдар тою үчүн.", ru: "Светлое небо и облака. Для детских тоев." }, types: ["sunnot","tushoo","tuulgan"] }
];

export const IV = {
  ky: { inv: "Сиздерди тоюбузга чакырабыз", cd: "Тойго чейин калды", d: "күн", h: "саат", m: "мүнөт", s: "секунд",
        prog: "Программа", venue: "Той өтүүчү жер", dress: "Дресс-код", gal: "Сүрөттөр", rsvp: "Келе аласызбы?",
        by: "чейин жооп бериңиз", rn: "Аты-жөнүңүз", yes: "Келем", no: "Келе албайм", cnt: "Канча адам",
        note: "Каалоо-тилек", send: "Жооп жөнөтүү", thx: "Рахмат! Жообуңуз той ээлерине жетти.", err: "Атыңызды жазыңыз",
        fail: "Жиберилген жок. Интернетти текшерип, кайра басыңыз.", hosts: "Той ээлери", made: "Тойго аркылуу түзүлдү",
        scroll: "Ылдый жылдырыңыз", music: "Музыка", contact: "Байланыш", call: "Чалуу", preview: "Бул алдын ала көрүү. Жооп чыныгы чакырууда иштейт.",
        past: "Той өттү. Келгениңиздерге рахмат!" },
  ru: { inv: "Приглашаем вас на наш праздник", cd: "До праздника осталось", d: "дней", h: "часов", m: "минут", s: "секунд",
        prog: "Программа", venue: "Место проведения", dress: "Дресс-код", gal: "Фотографии", rsvp: "Вы придёте?",
        by: "ответьте до", rn: "Ваше имя", yes: "Приду", no: "Не смогу", cnt: "Сколько человек",
        note: "Пожелание", send: "Отправить ответ", thx: "Спасибо! Ваш ответ получен.", err: "Укажите имя",
        fail: "Не отправилось. Проверьте интернет и нажмите ещё раз.", hosts: "Хозяева тоя", made: "Сделано в Тойго",
        scroll: "Листайте вниз", music: "Музыка", contact: "Контакты", call: "Позвонить", preview: "Это предпросмотр. Ответы работают в настоящем приглашении.",
        past: "Праздник прошёл. Спасибо, что были с нами!" }
};

const MON = {
  ky: ["январь","февраль","март","апрель","май","июнь","июль","август","сентябрь","октябрь","ноябрь","декабрь"],
  ru: ["января","февраля","марта","апреля","мая","июня","июля","августа","сентября","октября","ноября","декабря"]
};
const WD = {
  ky: ["жекшемби","дүйшөмбү","шейшемби","шаршемби","бейшемби","жума","ишемби"],
  ru: ["воскресенье","понедельник","вторник","среда","четверг","пятница","суббота"]
};

export const DEFAULTS = {
  v: 1, type: "uylonuu", tpl: "alatoo", lang: "ky",
  n1: "Айбек", n2: "Айзада", hosts: "Асановдор үй-бүлөсү",
  date: "2027-06-12", time: "17:00", venue: "«Шумкар» той үйү", addr: "Бишкек, Чүй проспектиси, 150",
  msg: "Урматтуу туугандар жана досторубуз! Жашообуздагы эң маанилүү күндү сиздер менен бирге белгилегибиз келет.",
  prog: "17:00 — Конокторду тосуу\n18:00 — Нике кыюу\n19:00 — Той башталат\n23:00 — Коштошуу",
  dress: "", dl: "2027-06-01", phone: "", music: true, photos: []
};

export const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const TR = { а:"a",б:"b",в:"v",г:"g",д:"d",е:"e",ё:"yo",ж:"j",з:"z",и:"i",й:"y",к:"k",л:"l",м:"m",н:"n",ң:"ng",о:"o",ө:"o",п:"p",р:"r",с:"s",т:"t",у:"u",ү:"u",ф:"f",х:"h",ц:"ts",ч:"ch",ш:"sh",щ:"sh",ъ:"",ы:"y",ь:"",э:"e",ю:"yu",я:"ya" };
export const slugify = s => String(s || "").toLowerCase().split("").map(c => TR[c] ?? c).join("").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);

export function baseSlug(d) {
  const p = parseD(d.date);
  const parts = [slugify(d.n1), d.type === "uylonuu" ? slugify(d.n2) : ""].filter(Boolean);
  if (!parts.length) parts.push("toi");
  if (p) parts.push(String(p.y));
  return parts.join("-");
}

// Server-side and client-side cleaning: whitelist fields, clamp lengths.
export function clean(input) {
  const d = {}; const i = input && typeof input === "object" ? input : {};
  const str = (v, n) => String(v ?? "").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").trim().slice(0, n);
  d.v = 1;
  d.type = TYPES[i.type] ? i.type : "uylonuu";
  d.tpl = TPL.some(t => t.id === i.tpl) ? i.tpl : "alatoo";
  d.lang = ["ky", "ru", "both"].includes(i.lang) ? i.lang : "ky";
  d.n1 = str(i.n1, 60); d.n2 = str(i.n2, 60); d.hosts = str(i.hosts, 120);
  d.date = /^\d{4}-\d{2}-\d{2}$/.test(i.date || "") ? i.date : "";
  d.time = /^\d{2}:\d{2}$/.test(i.time || "") ? i.time : "";
  d.dl = /^\d{4}-\d{2}-\d{2}$/.test(i.dl || "") ? i.dl : "";
  d.venue = str(i.venue, 120); d.addr = str(i.addr, 200);
  d.msg = str(i.msg, 1200); d.dress = str(i.dress, 200);
  d.prog = str(i.prog, 1500).split("\n").slice(0, 20).join("\n");
  d.phone = str(i.phone, 24).replace(/[^\d+]/g, "");
  d.music = i.music !== false;
  d.photos = Array.isArray(i.photos) ? i.photos.filter(x => /^[a-z0-9]{20}$/.test(x)).slice(0, 6) : [];
  return d;
}

export function parseD(s) { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || ""); return m ? { y: +m[1], m: +m[2] - 1, d: +m[3] } : null; }
export function longDate(s, lang) { const p = parseD(s); if (!p) return ""; return lang === "ky" ? `${p.y}-ж., ${p.d}-${MON.ky[p.m]}` : `${p.d} ${MON.ru[p.m]} ${p.y}`; }
function weekday(s, lang) { const p = parseD(s); if (!p) return ""; return WD[lang][new Date(Date.UTC(p.y, p.m, p.d)).getUTCDay()]; }
function numDate(s) { const p = parseD(s); if (!p) return ""; return `${String(p.d).padStart(2, "0")} · ${String(p.m + 1).padStart(2, "0")} · ${p.y}`; }

// Bishkek time (UTC+6) — events happen in Kyrgyzstan.
export function eventTs(d) {
  const p = parseD(d.date); if (!p) return 0;
  const [h, mi] = (d.time || "00:00").split(":").map(Number);
  return Date.UTC(p.y, p.m, p.d, (h || 0) - 6, mi || 0);
}

export function titleOf(d, lang) {
  const L = lang === "both" ? "ky" : lang;
  const who = d.type === "uylonuu" ? [d.n1, d.n2].filter(Boolean).join(" & ") : d.n1;
  return `${who || "…"} — ${TYPES[d.type][L]}`;
}

const HORN = '<svg class="orn" aria-hidden="true" viewBox="0 0 40 24"><path d="M20 23C20 13 15 6 9 6C4 6 2 10 3.5 13C5 16 9.5 15.5 9.5 12.5C9.5 10.5 7.5 9.5 6.3 10.6M20 23C20 13 25 6 31 6C36 6 38 10 36.5 13C35 16 30.5 15.5 30.5 12.5C30.5 10.5 32.5 9.5 33.7 10.6M20 23V2M17 5L20 2L23 5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';
const NOTE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18V5l11-2v13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="6" cy="18" r="3" fill="currentColor"/><circle cx="17" cy="16" r="3" fill="currentColor"/></svg>';
const CLOUD = '<path d="M20 45 Q0 45 6 30 Q8 18 26 22 Q32 4 54 10 Q70 0 82 16 Q104 12 104 30 Q118 34 110 45Z" fill="currentColor"/>';

function decor(id, mini) {
  switch (id) {
    case "alatoo": return `<svg class="mtn" viewBox="0 0 340 140" preserveAspectRatio="none" aria-hidden="true">
      <path d="M0 140 L0 96 L48 58 L82 84 L130 30 L170 70 L206 44 L250 86 L290 52 L340 92 L340 140Z" fill="rgba(255,255,255,.06)"/>
      <path d="M118 44 L130 30 L142 42 L136 40 L130 46 L124 40Z M196 52 L206 44 L216 54 L210 52 L205 56Z M280 60 L290 52 L300 62 L294 60 L289 64Z" fill="#EFEBE3" opacity=".85"/>
      <path d="M0 140 L0 116 L60 92 L104 112 L160 82 L214 110 L262 96 L340 120 L340 140Z" fill="rgba(0,0,0,.2)"/></svg>`;
    case "shyrdak": case "akkalpak": { const b = Array(mini ? 6 : 8).fill(HORN).join(""); return `<div class="iband top">${b}</div><div class="iband bot">${b}</div>`; }
    case "jibek": return `<div class="frame"></div>`;
    case "anar": return `<div class="dots"></div><div class="iarch"></div>`;
    case "asman": return `<svg class="cloud c1" viewBox="0 0 120 50" aria-hidden="true">${CLOUD}</svg><svg class="cloud c2" viewBox="0 0 120 50" aria-hidden="true">${CLOUD}</svg>`;
  }
  return "";
}

function mk(lang) {
  const both = lang === "both";
  return {
    L: k => both ? `${IV.ky[k]}<span class="alt">${IV.ru[k]}</span>` : IV[lang][k],
    P: k => both ? `${IV.ky[k]} / ${IV.ru[k]}` : IV[lang][k],
    type: t => { const o = TYPES[t]; return both ? (o.ky === o.ru ? o.ky : `${o.ky}<span class="alt">${o.ru}</span>`) : o[lang]; },
    date: s => both ? `${longDate(s, "ky")}<span class="alt">${longDate(s, "ru")}</span>` : longDate(s, lang),
    wd: s => both ? `${weekday(s, "ky")} / ${weekday(s, "ru")}` : weekday(s, lang),
    deadline: s => {
      if (!s) return "";
      if (both) return `${longDate(s, "ky")} ${IV.ky.by}<span class="alt">${IV.ru.by.replace(/^./, c => c.toUpperCase())} ${longDate(s, "ru")}</span>`;
      return lang === "ky" ? `${longDate(s, "ky")} ${IV.ky.by}` : `${IV.ru.by.replace(/^./, c => c.toUpperCase())} ${longDate(s, "ru")}`;
    }
  };
}

function names(d) {
  const a = esc(d.n1 || "…"); if (d.type !== "uylonuu") return a;
  return `${a}<span class="amp">&amp;</span>${esc(d.n2 || "…")}`;
}

export function coverHTML(d, opts = {}) {
  const T = mk(d.lang), mini = !!opts.mini;
  return `<div class="cv">${decor(d.tpl, mini)}
    <div class="ey">${T.type(d.type)}</div>
    ${["alatoo", "asman", "anar", "jibek"].includes(d.tpl) ? HORN : ""}
    <h1 class="nm">${names(d)}</h1>
    <div class="dt">${numDate(d.date)}</div>
    <div class="sub">${esc(T.wd(d.date))}${d.time ? " · " + esc(d.time) : ""}</div>
    ${mini ? "" : `<div class="scroll-cue">${T.P("scroll")} ↓</div>`}
  </div>`;
}

export function parseProg(s) {
  return String(s || "").split("\n").map(l => l.trim()).filter(Boolean).map(l => {
    const m = /^(\d{1,2}[:.]\d{2})\s*[—–-]?\s*(.*)$/.exec(l);
    return m ? { t: m[1].replace(".", ":"), x: m[2] } : { t: "", x: l };
  });
}

/**
 * opts: { mode: "preview" | "live", slug, photoUrl(id), pf (id prefix) }
 */
export function renderInvitation(d, opts = {}) {
  const T = mk(d.lang), pf = opts.pf || "inv";
  const photoUrl = opts.photoUrl || (id => `/media/${id}`);
  const pr = parseProg(d.prog);
  const q = encodeURIComponent(d.addr || d.venue || "");
  const ts = eventTs(d);
  const phone = d.phone && d.phone.replace(/\D/g, "").length >= 9 ? d.phone : "";
  const waNum = phone.replace(/\D/g, "");
  return `<div class="inv t-${d.tpl}" data-mode="${opts.mode || "preview"}" data-slug="${esc(opts.slug || "")}" data-lang="${d.lang}">
  ${d.music ? `<button type="button" class="mus" data-act="music" aria-pressed="false" aria-label="${T.P("music")}">${NOTE}</button>` : ""}
  ${coverHTML(d)}
  <section class="blk">${HORN}<h2>${T.L("inv")}</h2>${d.msg ? `<p class="msg">${esc(d.msg)}</p>` : ""}
    ${d.hosts ? `<div class="hosts">${T.P("hosts")}<b>${esc(d.hosts)}</b></div>` : ""}</section>
  ${ts ? `<section class="blk"><h2>${T.L("cd")}</h2>
    <div class="cd" data-ts="${ts}" data-past="${esc(T.P("past"))}"><div><b data-u="d">0</b><span>${T.P("d")}</span></div><div><b data-u="h">0</b><span>${T.P("h")}</span></div><div><b data-u="m">0</b><span>${T.P("m")}</span></div><div><b data-u="s">0</b><span>${T.P("s")}</span></div></div>
    ${d.date ? `<div class="sub">${T.date(d.date)}</div>` : ""}</section>` : ""}
  ${pr.length ? `<section class="blk"><h2>${T.L("prog")}</h2><ul class="prog">${pr.map(i => `<li><time>${esc(i.t)}</time><span>${esc(i.x)}</span></li>`).join("")}</ul></section>` : ""}
  ${(d.venue || d.addr) ? `<section class="blk"><h2>${T.L("venue")}</h2>${d.venue ? `<div class="vn">${esc(d.venue)}</div>` : ""}${d.addr ? `<div class="ad">${esc(d.addr)}</div>` : ""}
    ${q ? `<div class="row2"><a class="ib f" href="https://2gis.kg/search/${q}" target="_blank" rel="noopener">2GIS</a><a class="ib" href="https://www.google.com/maps/search/?api=1&amp;query=${q}" target="_blank" rel="noopener">Google Maps</a></div>` : ""}</section>` : ""}
  ${d.dress ? `<section class="blk"><h2>${T.L("dress")}</h2><p class="msg">${esc(d.dress)}</p></section>` : ""}
  ${d.photos && d.photos.length ? `<section class="blk"><h2>${T.L("gal")}</h2><div class="gal">${d.photos.map(p => `<img src="${esc(photoUrl(p))}" alt="" loading="lazy" decoding="async" data-act="zoom">`).join("")}</div></section>` : ""}
  <section class="blk"><h2>${T.L("rsvp")}</h2>${d.dl ? `<div class="sub">${T.deadline(d.dl)}</div>` : ""}
    <form class="rsvp" data-pf="${pf}" novalidate>
      <label for="${pf}-rn">${T.P("rn")}</label><input type="text" id="${pf}-rn" name="name" autocomplete="name" maxlength="60" required>
      <div class="yn" role="radiogroup"><label><input type="radio" name="att" id="${pf}-y" value="1" checked><span>${T.P("yes")}</span></label><label><input type="radio" name="att" id="${pf}-n" value="0"><span>${T.P("no")}</span></label></div>
      <div class="cntw"><label for="${pf}-rc">${T.P("cnt")}</label><input type="number" id="${pf}-rc" name="guests" min="1" max="20" value="1" inputmode="numeric"></div>
      <label for="${pf}-rt">${T.P("note")}</label><textarea id="${pf}-rt" name="note" maxlength="300"></textarea>
      <input type="text" name="website" class="hp" tabindex="-1" autocomplete="off" aria-hidden="true">
      <div class="err" aria-live="polite" data-err="${esc(T.P("err"))}" data-fail="${esc(T.P("fail"))}" data-preview="${esc(T.P("preview"))}"></div>
      <button class="ib f" type="submit">${T.P("send")}</button>
    </form>
    <div class="thx" hidden>${T.L("thx")}</div>
  </section>
  ${phone ? `<section class="blk"><h2>${T.L("contact")}</h2><div class="row2"><a class="ib f" href="https://wa.me/${waNum}" target="_blank" rel="noopener">WhatsApp</a><a class="ib" href="tel:${esc(phone)}">${T.P("call")}</a></div><div class="sub">${esc(phone)}</div></section>` : ""}
  <footer class="ft"><a href="/" target="_blank" rel="noopener">${T.P("made")}</a></footer></div>`;
}
