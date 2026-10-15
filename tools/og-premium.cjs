// OG images (1200×630) for the premium designs, rendered from the real covers.
// Needs the local dev server: wrangler dev --port 8787. Run: node tools/og-premium.cjs
const { chromium } = require("playwright");
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1200, height: 630 }, reducedMotion: "reduce" });
  for (const [tpl, type] of [["ivorygold", "uylonuu"], ["bloom", "uylonuu"], ["mountain", "uylonuu"], ["lens", "uylonuu"], ["akjol", "kyz"], ["emnight", "uylonuu"], ["nur", "nikah"], ["blush", "tuulgan"], ["silk", "uylonuu"], ["nomad", "uylonuu"], ["garden", "uylonuu"], ["kjibek", "kyz"], ["aurora", "kyz"], ["noir", "kyz"]]) {
    await p.goto("http://127.0.0.1:8787/404.html");
    await p.setContent(`<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="http://127.0.0.1:8787/assets/fonts.css"><link rel="stylesheet" href="http://127.0.0.1:8787/assets/invite.css">
      <style>body{margin:0;width:1200px;height:630px;overflow:hidden;position:relative}#bg{position:absolute;inset:-60px;filter:blur(28px) saturate(1.1);opacity:.9}#bg .inv{width:1320px;height:750px}#r{position:absolute;left:50%;top:0;width:440px;height:630px;transform:translateX(-50%);box-shadow:0 0 60px rgba(0,0,0,.35)}#r .inv{width:440px;height:630px}.inv.pr .cv{min-height:630px;height:630px}#bg .inv.pr .cv{min-height:750px;height:750px}.inv .cue{display:none}</style></head><body><div id="bg"></div><div id="r"></div>
      <script type="module">import { DEFAULTS, TYPE_TEXT, coverHTML, invClass } from "http://127.0.0.1:8787/assets/invite-core.js";
      const t = TYPE_TEXT["${type}"].ky; const d = { ...DEFAULTS, tpl: "${tpl}", type: "${type}", n1: t.n1, n2: t.n2, age: "${type}" === "tuulgan" ? 25 : "" };
      const html = '<div class="' + invClass(d.tpl, d.type) + '">' + coverHTML(d, { mini: true }) + '</div>';
      document.getElementById("r").innerHTML = html; const bg = document.getElementById("bg"); bg.innerHTML = html; bg.querySelectorAll(".hc").forEach(e => e.remove());
      document.fonts.ready.then(() => document.body.dataset.ok = 1);</script></body></html>`);
    await p.waitForSelector("body[data-ok]", { state: "attached" }); await p.waitForTimeout(300);
    await p.screenshot({ path: require("path").join(__dirname, `../public/img/og-${tpl}.png`) });
  }
  await b.close();
})();
