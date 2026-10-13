// Toigo — small behaviors shared by site pages.
import { renderInvitation } from "/assets/invite-core.js?v=mv6ab4sw";
import { startLive } from "/assets/invite-live.js?v=mv6ab4sw";

// Copy buttons: <button data-copy="#selector" data-done="Copied">
document.addEventListener("click", async e => {
  const b = e.target.closest("[data-copy]"); if (!b) return;
  const el = document.querySelector(b.dataset.copy); if (!el) return;
  const text = (el.value ?? el.textContent).trim();
  const old = b.textContent;
  try { await navigator.clipboard.writeText(text); b.textContent = b.dataset.done || "✓"; }
  catch { const r = document.createRange(); r.selectNodeContents(el); const s = getSelection(); s.removeAllRanges(); s.addRange(r); }
  setTimeout(() => { b.textContent = old; }, 1600);
});

// Support block: the payment phone stays masked until "show" / "copy" is pressed (kept out of the page HTML).
document.addEventListener("click", async e => {
  const b = e.target.closest("[data-pay]"); if (!b) return;
  const el = document.getElementById("pay-phone"); if (!el) return;
  const n = ["+996", "702", "097", "127"], MASK = "+996 702 \u2022\u2022\u2022 \u2022\u2022\u2022";
  if (b.dataset.pay === "show") {
    const open = el.dataset.open === "1";
    el.textContent = open ? MASK : n.join(" "); el.dataset.open = open ? "0" : "1";
    b.textContent = open ? b.dataset.show : b.dataset.hide; return;
  }
  const old = b.textContent;
  try { await navigator.clipboard.writeText(n.join("")); b.textContent = b.dataset.done || "\u2713"; } catch (_) {}
  setTimeout(() => { b.textContent = old; }, 1600);
});

// Hero: full live invitation inside the phone.
const hp = document.getElementById("heroPhone");
if (hp) {
  try { hp.innerHTML = renderInvitation(JSON.parse(hp.dataset.inv), { mode: "preview", pf: "hero" }); } catch (_) {}
  startLive();
}

// Hero: 3D rings, loaded after the page is ready so the first paint stays fast.
const media = document.getElementById("heroMedia");
if (media) {
  const go = () => import("/assets/rings.js?v=mv6ab4sw").then(m => m.mountRings(media, { shift: getComputedStyle(document.querySelector(".stage .phone")).display !== "none" })).catch(() => {});
  if ("requestIdleCallback" in window) requestIdleCallback(go, { timeout: 1500 }); else setTimeout(go, 300);
}

// WhatsApp buttons (<button data-wa data-wa-text="TG-...">): the number is assembled on click, never stored in the HTML.
document.addEventListener("click", e => {
  const b = e.target.closest("[data-wa]"); if (!b) return;
  const n = ["996", "702", "097", "127"].join("");
  const ru = document.documentElement.lang === "ru";
  const t = b.dataset.waText ? (ru ? `Здравствуйте! Заказ ${b.dataset.waText}` : `Саламатсызбы! Заказ ${b.dataset.waText}`) : (ru ? "Здравствуйте! Вопрос по Тойго" : "Саламатсызбы! Тойго боюнча суроо");
  window.open(`https://wa.me/${n}?text=${encodeURIComponent(t)}`, "_blank", "noopener");
});
