// Toigo — draws the link-preview card (1200×630) from the invitation's real cover and uploads it.
// WhatsApp/Telegram then show the couple's names and date instead of a bare link.
import { coverHTML, invClass } from "/assets/invite-core.js?v=mw878xqj";

const W = 1200, H = 630, CW = 440;

async function snapshotCover(d, photoUrl) {
  const { domToCanvas } = await import("/assets/vendor/modern-screenshot.mjs");
  const host = document.createElement("div");
  host.setAttribute("aria-hidden", "true");
  host.style.cssText = `position:fixed;left:-${W * 3}px;top:0;width:${CW}px;height:${H}px;overflow:hidden;pointer-events:none;z-index:-1`;
  host.innerHTML = `<div class="ogc" style="width:${CW}px;height:${H}px;overflow:hidden;background:#fff"><style>.ogc .inv{width:${CW}px;height:${H}px;overflow:hidden}.ogc .inv .cv{min-height:${H}px!important;height:${H}px!important}.ogc .cue,.ogc .mus,.ogc canvas.fx{display:none!important}.ogc *{animation:none!important;transition:none!important}</style><div class="${invClass(d.tpl, d.type)}" data-lang="${d.lang}">${coverHTML(d, { photoUrl })}</div></div>`;
  document.body.appendChild(host);
  try {
    await document.fonts.ready;
    await Promise.all([...host.querySelectorAll("img")].map(i => (i.loading = "eager", i.decode().catch(() => {}))));
    return await domToCanvas(host.firstElementChild, { width: CW, height: H, scale: 1, backgroundColor: "#ffffff" });
  } finally { host.remove(); }
}

function compose(cover) {
  const c = document.createElement("canvas"); c.width = W; c.height = H;
  const x = c.getContext("2d");
  // Soft blurred backdrop: shrink the cover to a few pixels and stretch it back (works on every browser).
  const tiny = document.createElement("canvas"); tiny.width = 24; tiny.height = 13;
  const t = tiny.getContext("2d"); t.imageSmoothingEnabled = true;
  t.drawImage(cover, 0, cover.height * 0.15, cover.width, cover.width * 13 / 24, 0, 0, 24, 13);
  x.imageSmoothingEnabled = true; x.imageSmoothingQuality = "high";
  x.drawImage(tiny, -40, -40, W + 80, H + 80);
  x.fillStyle = "rgba(255,255,255,.12)"; x.fillRect(0, 0, W, H);
  // The cover itself, centred, with a shadow.
  const left = (W - CW) / 2;
  x.save(); x.shadowColor = "rgba(0,0,0,.35)"; x.shadowBlur = 50; x.fillStyle = "#fff"; x.fillRect(left, 0, CW, H); x.restore();
  x.drawImage(cover, left, 0, CW, H);
  return c;
}

// True when the snapshot came out (nearly) one flat colour, i.e. nothing was drawn.
function looksBlank(cv) {
  const s = document.createElement("canvas"); s.width = 22; s.height = 32;
  const x = s.getContext("2d"); x.drawImage(cv, 0, 0, 22, 32);
  const px = x.getImageData(0, 0, 22, 32).data;
  let n = 0, sum = 0, sq = 0;
  for (let i = 0; i < px.length; i += 4) { const l = px[i] * .3 + px[i + 1] * .59 + px[i + 2] * .11; sum += l; sq += l * l; n++; }
  const mean = sum / n;
  return Math.sqrt(Math.max(0, sq / n - mean * mean)) < 6;
}

// Builds and uploads the card. Never throws: the invitation works the same without it.
export async function makeOgCard(d, slug, key, photoUrl) {
  try {
    const cover = await snapshotCover(d, photoUrl);
    if (looksBlank(cover)) return false; // a failed snapshot (some browsers) is worse than the default card
    const card = compose(cover);
    const blob = await new Promise(ok => card.toBlob(ok, "image/jpeg", 0.86));
    if (!blob) return false;
    const r = await fetch(`/api/invitations/${slug}/og`, { method: "POST", headers: { "content-type": "image/jpeg", "x-edit-key": key }, body: blob });
    return r.ok;
  } catch { return false; }
}
