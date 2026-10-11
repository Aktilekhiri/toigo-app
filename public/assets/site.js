// Toigo — small behaviors shared by site pages.
import { renderInvitation } from "/assets/invite-core.js?v=mv4exbii";
import { startLive } from "/assets/invite-live.js?v=mv4exbii";

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

// Hero: full live invitation inside the phone.
const hp = document.getElementById("heroPhone");
if (hp) {
  try { hp.innerHTML = renderInvitation(JSON.parse(hp.dataset.inv), { mode: "preview", pf: "hero" }); } catch (_) {}
  startLive();
}

// Hero: 3D rings, loaded after the page is ready so the first paint stays fast.
const media = document.getElementById("heroMedia");
if (media) {
  const go = () => import("/assets/rings.js?v=mv4exbii").then(m => m.mountRings(media, { shift: getComputedStyle(document.querySelector(".stage .phone")).display !== "none" })).catch(() => {});
  if ("requestIdleCallback" in window) requestIdleCallback(go, { timeout: 1500 }); else setTimeout(go, 300);
}
