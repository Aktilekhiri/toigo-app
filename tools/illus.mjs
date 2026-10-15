// Toigo — vector illustrations for the toi types (own artwork, no photos).
// Each one fills a circle (viewBox 120×120); gradient ids are prefixed so several can live on one page.

const gold = id => `<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FBE9B7"/><stop offset=".45" stop-color="#D9AE5C"/><stop offset=".7" stop-color="#A97A2C"/><stop offset="1" stop-color="#F3D58E"/></linearGradient>`;
const bg = (id, a, b) => `<radialGradient id="${id}" cx=".5" cy=".38" r=".75"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></radialGradient>`;
const spark = (x, y, s = 1, c = "#fff", o = .9) => `<path d="M${x} ${y - 4 * s}Q${x + .6 * s} ${y - .6 * s} ${x + 4 * s} ${y}Q${x + .6 * s} ${y + .6 * s} ${x} ${y + 4 * s}Q${x - .6 * s} ${y + .6 * s} ${x - 4 * s} ${y}Q${x - .6 * s} ${y - .6 * s} ${x} ${y - 4 * s}Z" fill="${c}" opacity="${o}"/>`;
const svg = (body, label) => `<svg class="il" viewBox="0 0 120 120" role="img" aria-label="${label}">${body}</svg>`;

export const ILLUS = {
  // Wedding: two interlocked gold rings with a diamond.
  uylonuu: svg(`<defs>${bg("u-bg", "#34467A", "#121A31")}${gold("u-g")}
    <linearGradient id="u-d" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#B9D7F2"/></linearGradient></defs>
    <rect width="120" height="120" fill="url(#u-bg)"/>
    <ellipse cx="60" cy="94" rx="34" ry="5" fill="#000" opacity=".25"/>
    <circle cx="72" cy="68" r="19" fill="none" stroke="url(#u-g)" stroke-width="6.5"/>
    <circle cx="48" cy="68" r="19" fill="none" stroke="url(#u-g)" stroke-width="6.5"/>
    <path d="M56.4 57.1A19 19 0 0 1 65.5 50.1" fill="none" stroke="url(#u-g)" stroke-width="6.5"/>
    <circle cx="48" cy="68" r="19" fill="none" stroke="#fff" stroke-width="1.2" opacity=".35" stroke-dasharray="14 105" stroke-dashoffset="-70"/>
    <path d="M41 44l4-5h6l4 5-7 8z" fill="url(#u-d)" stroke="#fff" stroke-width=".8"/>
    <path d="M41 44h14M45 39l3 13M51 39l-3 13" stroke="#8FB5DA" stroke-width=".6" fill="none"/>
    ${spark(36, 34, 1.3)}${spark(86, 40, 1)}${spark(90, 88, .8, "#F3D58E")}${spark(28, 86, .7, "#F3D58E")}${spark(61, 26, .7)}`, "Шакектер"),

  // Kyz uzatuu: the bride's shökülö (tall headdress) with a white veil and owl feathers.
  kyz: svg(`<defs>${bg("k-bg", "#8E2A42", "#3B0C18")}${gold("k-g")}
    <linearGradient id="k-c" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#D9C9AE"/><stop offset=".4" stop-color="#FFFBF2"/><stop offset="1" stop-color="#CDBB9C"/></linearGradient>
    <clipPath id="k-cl"><path d="M41 92L53 32Q60 23 67 32L79 92Z"/></clipPath></defs>
    <rect width="120" height="120" fill="url(#k-bg)"/>
    <path d="M53 36C40 52 32 80 27 112H42C44 92 48 70 56 50Z" fill="#fff" opacity=".42"/>
    <path d="M67 36C80 52 88 80 93 112H78C76 92 72 70 64 50Z" fill="#fff" opacity=".42"/>
    <path d="M41 92L53 32Q60 23 67 32L79 92Z" fill="url(#k-c)"/>
    <g clip-path="url(#k-cl)">
      <rect x="30" y="80" width="60" height="7" fill="url(#k-g)"/><rect x="30" y="58" width="60" height="4" fill="url(#k-g)"/><rect x="30" y="42" width="60" height="3" fill="url(#k-g)"/>
      <path d="M60 64l5 6-5 6-5-6z" fill="#B3263C"/><circle cx="50" cy="70" r="1.8" fill="#B3263C"/><circle cx="70" cy="70" r="1.8" fill="#B3263C"/><path d="M60 47l3 4-3 4-3-4z" fill="#B3263C"/>
    </g>
    <ellipse cx="60" cy="92" rx="21" ry="4.5" fill="url(#k-g)"/>
    <path d="M41 93l-4 12M79 93l4 12M47 95l-2 10M73 95l2 10" stroke="#E8C27A" stroke-width="1"/>
    <circle cx="37" cy="106" r="2" fill="url(#k-g)"/><circle cx="83" cy="106" r="2" fill="url(#k-g)"/><circle cx="45" cy="106" r="1.6" fill="url(#k-g)"/><circle cx="75" cy="106" r="1.6" fill="url(#k-g)"/>
    <g fill="#F7F1E4" stroke="#B9A88A" stroke-width=".5"><ellipse cx="56" cy="17" rx="3" ry="9" transform="rotate(-22 56 17)"/><ellipse cx="64" cy="17" rx="3" ry="9" transform="rotate(22 64 17)"/><ellipse cx="60" cy="15" rx="3.2" ry="10"/></g>
    <g fill="#5A4636"><circle cx="52.7" cy="9.5" r="1.4"/><circle cx="67.3" cy="9.5" r="1.4"/><circle cx="60" cy="5.5" r="1.4"/></g>
    ${spark(30, 40, 1)}${spark(92, 48, .8)}${spark(88, 24, .6, "#F3D58E")}`, "Шөкүлө"),

  // Sünnöt: the boy's ak kalpak with a black split brim and gold embroidery.
  sunnot: svg(`<defs>${bg("s-bg", "#A8452F", "#561811")}${gold("s-g")}
    <linearGradient id="s-w" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#D8D1C4"/><stop offset=".45" stop-color="#FFFFFF"/><stop offset="1" stop-color="#C9C0B0"/></linearGradient></defs>
    <rect width="120" height="120" fill="url(#s-bg)"/>
    <ellipse cx="60" cy="98" rx="34" ry="5" fill="#000" opacity=".25"/>
    <path d="M33 86C32 60 42 30 60 22C78 30 88 60 87 86Z" fill="url(#s-w)"/>
    <path d="M60 22C56 44 55 66 56 86M60 22C66 44 70 66 72 86M60 22C50 40 44 62 42 86" fill="none" stroke="#2B2B2B" stroke-width=".9" stroke-dasharray="2.2 1.6" opacity=".75"/>
    <path d="M28 80Q44 75 58 79L56 96Q42 93 28 96Z" fill="#1C1C1E"/>
    <path d="M92 80Q76 75 62 79L64 96Q78 93 92 96Z" fill="#1C1C1E"/>
    <g fill="none" stroke="url(#s-g)" stroke-width="1.2" stroke-linecap="round">
      <path d="M35 88c3-5 9-5 9 0c0 3-4 3-4 1M51 88c-3-5-9-5-9 0"/>
      <path d="M85 88c-3-5-9-5-9 0c0 3 4 3 4 1M69 88c3-5 9-5 9 0"/>
    </g>
    <path d="M60 22l-2-6h4z" fill="#1C1C1E"/><circle cx="60" cy="15" r="3" fill="#1C1C1E"/>
    ${spark(28, 40, 1.1)}${spark(94, 50, .8, "#F3D58E")}${spark(88, 24, .7)}`, "Ак калпак"),

  // Tushoo kesuu: little boots tied with the black-and-white ala jip cord, and scissors.
  tushoo: svg(`<defs>${bg("t-bg", "#F4FAFE", "#B9D6EC")}
    <linearGradient id="t-r" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E35A45"/><stop offset="1" stop-color="#A42C24"/></linearGradient>
    <linearGradient id="t-s" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".5" stop-color="#AEB8C2"/><stop offset="1" stop-color="#E9EEF2"/></linearGradient></defs>
    <rect width="120" height="120" fill="url(#t-bg)"/>
    <ellipse cx="60" cy="97" rx="38" ry="4.5" fill="#5C7E99" opacity=".25"/>
    <path d="M26 66V88Q26 95 34 95H52Q57 95 57 91Q57 87 49 85L41 82V66Z" fill="url(#t-r)"/>
    <path d="M64 66V88Q64 95 72 95H90Q95 95 95 91Q95 87 87 85L79 82V66Z" fill="url(#t-r)"/>
    <rect x="24.5" y="62" width="18" height="7" rx="2" fill="#fff"/><rect x="62.5" y="62" width="18" height="7" rx="2" fill="#fff"/>
    <path d="M30 89h4M36 89h4M68 89h4M74 89h4" stroke="#F3C766" stroke-width="1.6" stroke-linecap="round"/>
    <path d="M34 75C46 60 58 90 72 75" fill="none" stroke="#fff" stroke-width="4.6" stroke-linecap="round"/>
    <path d="M34 75C46 60 58 90 72 75" fill="none" stroke="#1C1C1E" stroke-width="4.6" stroke-dasharray="3.2 3.2"/>
    <path d="M58 41L71 64L67.5 64.5L58.5 47Z" fill="url(#t-s)" stroke="#7E8A96" stroke-width=".5"/>
    <path d="M62 41L49 64L52.5 64.5L61.5 47Z" fill="url(#t-s)" stroke="#7E8A96" stroke-width=".5"/>
    <path d="M54.5 33L60 44L65.5 33" fill="none" stroke="#B85A1A" stroke-width="2.8" stroke-linecap="round"/>
    <circle cx="52" cy="27.5" r="5.5" fill="none" stroke="#B85A1A" stroke-width="2.8"/><circle cx="68" cy="27.5" r="5.5" fill="none" stroke="#B85A1A" stroke-width="2.8"/>
    <circle cx="60" cy="44" r="1.5" fill="#5C6670"/>
    ${spark(24, 34, 1, "#F3C766")}${spark(97, 48, .8, "#E35A45", .8)}${spark(90, 22, .7, "#F3C766")}`, "Ала жип жана кайчы"),

  // Maarake: a festive boz üy (yurt) with a tündük and ornamented band.
  maarake: svg(`<defs>${bg("m-bg", "#F6F8F3", "#C6D1BE")}${gold("m-g")}
    <linearGradient id="m-w" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#E4DACA"/><stop offset=".45" stop-color="#FFFCF5"/><stop offset="1" stop-color="#D8CCB8"/></linearGradient></defs>
    <rect width="120" height="120" fill="url(#m-bg)"/>
    <ellipse cx="60" cy="94" rx="42" ry="5" fill="#5E6B55" opacity=".25"/>
    <rect x="25" y="62" width="70" height="30" fill="url(#m-w)"/>
    <path d="M20 64Q60 26 100 64Z" fill="url(#m-w)"/>
    <path d="M20 64Q60 26 100 64" fill="none" stroke="#C9BBA4" stroke-width="1"/>
    <path d="M40 46L46 63M60 36V63M80 46L74 63" stroke="#C9BBA4" stroke-width=".9"/>
    <rect x="25" y="64" width="70" height="6" fill="#8C5E43"/>
    <path d="M25 67l3.5-2.5 3.5 2.5 3.5-2.5 3.5 2.5 3.5-2.5 3.5 2.5 3.5-2.5 3.5 2.5 3.5-2.5 3.5 2.5 3.5-2.5 3.5 2.5 3.5-2.5 3.5 2.5 3.5-2.5 3.5 2.5 3.5-2.5 3.5 2.5 3.5-2.5 3.5 2.5" fill="none" stroke="#F3E3C3" stroke-width=".9"/>
    <path d="M51 92V78Q51 72 60 72Q69 72 69 78V92Z" fill="#B4472F"/>
    <path d="M60 75v14M54 82h12" stroke="url(#m-g)" stroke-width="1.2"/>
    <ellipse cx="60" cy="35" rx="8" ry="3.2" fill="#8C5E43"/><path d="M53 35h14M60 32v6M55 33l10 4M65 33l-10 4" stroke="#F3E3C3" stroke-width=".7"/>
    <path d="M18 30Q38 42 60 30Q82 42 102 30" fill="none" stroke="#8C5E43" stroke-width=".7" opacity=".7"/>
    <path d="M24 32l3 6 3-5zM36 36l3 6 3-5.5zM50 34l3 6 3-5.5zM64 34l3 6 3-5.5zM78 36l3 6 3-5.5zM90 32l3 6 3-5z" fill="#C2543B"/>
    ${spark(106, 54, .9, "#D9AE5C")}${spark(14, 54, .7, "#D9AE5C")}`, "Боз үй"),

  // Tuulgan kün: a two-tier cake with candles and two balloons.
  tuulgan: svg(`<defs>${bg("b-bg", "#30363F", "#0C0E11")}${gold("b-g")}
    <linearGradient id="b-c" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#E9C7B4"/><stop offset=".45" stop-color="#FCEDE3"/><stop offset="1" stop-color="#DDB6A2"/></linearGradient>
    <radialGradient id="b-f" cx=".5" cy=".6" r=".5"><stop offset="0" stop-color="#FFF6C9"/><stop offset=".5" stop-color="#FFC94D" stop-opacity=".7"/><stop offset="1" stop-color="#FF9F2E" stop-opacity="0"/></radialGradient>
    <radialGradient id="b-b1" cx=".35" cy=".3" r=".7"><stop offset="0" stop-color="#FBE9B7"/><stop offset="1" stop-color="#B8862F"/></radialGradient>
    <radialGradient id="b-b2" cx=".35" cy=".3" r=".7"><stop offset="0" stop-color="#F08A8A"/><stop offset="1" stop-color="#A3253A"/></radialGradient></defs>
    <rect width="120" height="120" fill="url(#b-bg)"/>
    <path d="M22 44q2 14-2 30M98 40q-3 14 1 28" fill="none" stroke="#8D8D8D" stroke-width=".6"/>
    <ellipse cx="22" cy="32" rx="8" ry="10" fill="url(#b-b1)"/><ellipse cx="98" cy="29" rx="7" ry="9" fill="url(#b-b2)"/>
    <ellipse cx="60" cy="96" rx="36" ry="5" fill="url(#b-g)"/>
    <rect x="30" y="72" width="60" height="23" rx="3" fill="url(#b-c)"/>
    <path d="M30 76Q30 72 34 72H86Q90 72 90 76V78Q86 82 83 78Q79 84 75 78Q71 83 66 78Q62 84 57 78Q53 83 48 78Q44 84 40 78Q36 82 30 79Z" fill="#fff"/>
    <rect x="30" y="86" width="60" height="2.4" fill="url(#b-g)"/>
    <rect x="40" y="54" width="40" height="18" rx="3" fill="url(#b-c)"/>
    <path d="M40 58Q40 54 44 54H76Q80 54 80 58V59Q77 63 74 59Q70 64 66 59Q62 64 58 59Q54 64 50 59Q46 63 40 60Z" fill="#fff"/>
    <rect x="40" y="66" width="40" height="2" fill="url(#b-g)"/>
    <g fill="#fff"><rect x="47" y="42" width="3.2" height="12" rx="1"/><rect x="58.4" y="38" width="3.2" height="16" rx="1"/><rect x="69.8" y="42" width="3.2" height="12" rx="1"/></g>
    <g stroke="#D9AE5C" stroke-width="1"><path d="M47 46l3.2-2M47 50l3.2-2M58.4 42l3.2-2M58.4 46l3.2-2M58.4 50l3.2-2M69.8 46l3.2-2M69.8 50l3.2-2"/></g>
    <circle cx="48.6" cy="37" r="6" fill="url(#b-f)"/><circle cx="60" cy="33" r="6" fill="url(#b-f)"/><circle cx="71.4" cy="37" r="6" fill="url(#b-f)"/>
    <g fill="#FFE17A"><path d="M48.6 34q2 2.5 0 5q-2-2.5 0-5z"/><path d="M60 30q2 2.5 0 5q-2-2.5 0-5z"/><path d="M71.4 34q2 2.5 0 5q-2-2.5 0-5z"/></g>
    ${spark(34, 18, .8, "#F3D58E")}${spark(84, 52, .6)}${spark(16, 64, .7)}${spark(104, 74, .7, "#F3D58E")}`, "Торт")
};
