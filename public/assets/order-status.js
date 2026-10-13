// Toigo — order status page: /order/status/?o=TG-XXXXXX&t=<token>[&ret=1 after the payment page]
const I = JSON.parse(document.getElementById("i18n").textContent);
const T = I.t, app = document.getElementById("s-app");
const q = new URLSearchParams(location.search);
const id = q.get("o") || "", token = q.get("t") || "", returned = q.get("ret") === "1";
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const fmt = ts => ts ? new Date(ts).toLocaleString(I.lang === "ru" ? "ru-RU" : "ky-KG", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" }) : "";

let polls = 0, timer = null;

async function load() {
  if (!/^TG-[A-Z0-9]{6}$/.test(id) || !token) return notFound();
  let r;
  try { r = await fetch(`/api/orders/${id}`, { headers: { "x-order-token": token }, cache: "no-store" }); }
  catch (_) { app.innerHTML = `<p class="form-msg">${esc(T.pay_err)}</p>`; return; }
  if (!r.ok) return notFound();
  const o = await r.json();
  try { localStorage.setItem("toigo-last-order", location.pathname + `?o=${id}&t=${token}`); } catch (_) {}
  render(o);
  // Back from the payment page but the bank has not confirmed yet: poll for up to ~3 minutes.
  const waiting = returned && ["PENDING_PAYMENT"].includes(o.status) && o.pay_mode === "finik";
  clearTimeout(timer);
  if (waiting && polls < 45) { polls++; timer = setTimeout(load, 4000); }
}

function notFound() { app.innerHTML = `<p class="empty">${esc(T.not_found)}</p>`; }

function render(o) {
  document.getElementById("s-id").textContent = o.id;
  const key = returned && o.status === "PENDING_PAYMENT" && o.pay_mode === "finik" && polls < 45 ? "CHECKING" : o.status;
  const [h, p] = T.st[key] || [o.status, ""];
  const tone = { PAID: "ok", IN_PROGRESS: "ok", COMPLETED: "ok", PAYMENT_FAILED: "no", CANCELLED: "no" }[o.status] || "wait";
  const unpaid = ["PENDING_PAYMENT", "PAYMENT_FAILED"].includes(o.status);
  const acts = [];
  if (unpaid && o.pay_mode === "finik") acts.push(`<button class="btn btn-gold" type="button" data-pay-now>${esc(o.status === "PAYMENT_FAILED" ? T.retry : T.pay)}</button>`);
  if (o.status === "COMPLETED" && o.result_url) acts.push(`<a class="btn btn-p" href="${esc(o.result_url)}" target="_blank" rel="noopener">${esc(T.open)}</a>`);
  acts.push(`<button class="btn btn-g" type="button" data-wa data-wa-text="${esc(o.id)}">${esc(T.wa)}</button>`);
  app.innerHTML = `
    <div class="st-card st-${tone}">
      <div class="st-badge">${key === "CHECKING" ? '<span class="spin" aria-hidden="true"></span>' : ""}${esc(h)}</div>
      <p>${esc(p)}</p>
      <dl class="st-dl">
        <div><dt>${esc(T.order_no)}</dt><dd><b>${esc(o.id)}</b></dd></div>
        <div><dt>${esc(T.service)}</dt><dd>${esc(I.services[o.service] || o.service)}</dd></div>
        <div><dt>${esc(T.amount)}</dt><dd>${esc(o.amount)} ${esc(I.som)}</dd></div>
        <div><dt>${esc(T.created)}</dt><dd>${esc(fmt(o.created_at))}</dd></div>
      </dl>
      <div class="acts">${acts.join("")}</div>
      <p class="pay-msg form-msg" aria-live="polite"></p>
    </div>
    <p class="hint-save">${esc(T.save)}</p>`;
  if (unpaid && o.pay_mode === "manual") {
    const m = document.getElementById("s-manual").content.cloneNode(true);
    m.querySelector("[data-manual-text]").textContent = T.manual_p.replace("{amount}", o.amount).replace("{id}", o.id);
    app.querySelector(".st-card").after(m);
  }
}

app.addEventListener("click", async e => {
  const b = e.target.closest("[data-pay-now]"); if (!b) return;
  const out = app.querySelector(".pay-msg"); out.textContent = ""; b.disabled = true;
  try {
    const r = await fetch(`/api/orders/${id}`, { method: "POST", headers: { "content-type": "application/json", "x-order-token": token }, body: JSON.stringify({ action: "pay" }) });
    const j = await r.json().catch(() => ({}));
    if (r.ok && j.pay_url) { location.href = j.pay_url; return; }
    out.textContent = T.pay_err;
  } catch (_) { out.textContent = T.pay_err; }
  b.disabled = false;
});

load();
