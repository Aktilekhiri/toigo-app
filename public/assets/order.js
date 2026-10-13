// Toigo — order form: live total, field checks, submit → payment page or order status.
const I = JSON.parse(document.getElementById("i18n").textContent);
const T = I.t, form = document.getElementById("order");
const $ = s => document.querySelector(s);
const msg = $("#o-msg"), btn = $("#o-submit");

// Preselect service from ?s=premium, template from ?tpl=, event type from ?type=
const q = new URLSearchParams(location.search);
const pre = form.querySelector(`input[name=service][value="${q.get("s")}"]`); if (pre) pre.checked = true;
if (q.get("tpl") && form.elements.tpl.querySelector(`option[value="${q.get("tpl")}"]`)) form.elements.tpl.value = q.get("tpl");
if (q.get("type") && form.elements.event_type.querySelector(`option[value="${q.get("type")}"]`)) form.elements.event_type.value = q.get("type");
const today = new Date(); form.elements.event_date.min = new Date(today.getTime() - 86400e3).toISOString().slice(0, 10);

function total() {
  const s = form.querySelector("input[name=service]:checked");
  $("#o-total").textContent = `${I.prices[s ? s.value : "custom"]} ${I.som}`;
}
form.addEventListener("change", e => { if (e.target.name === "service") total(); });
total();

// Draft: keep what was typed if the page is reloaded (this browser only).
const DK = "toigo-order-draft";
try { const d = JSON.parse(sessionStorage.getItem(DK) || "null"); if (d) for (const [k, v] of Object.entries(d)) { const el = form.elements[k]; if (el && el.type !== "radio" && el.type !== "checkbox" && !el.value) el.value = v; } } catch (_) {}
form.addEventListener("input", () => { try { const d = {}; for (const el of form.elements) if (el.name && el.type !== "radio" && el.type !== "checkbox" && el.name !== "website") d[el.name] = el.value; sessionStorage.setItem(DK, JSON.stringify(d)); } catch (_) {} });

function setErr(name, code) {
  const box = document.getElementById(`e-${name}`), w = document.getElementById(`w-${name}`);
  if (box) box.textContent = code ? (T.err[code] || T.err.required) : "";
  if (w) w.classList.toggle("err", !!code);
}
function check() {
  const v = Object.fromEntries(new FormData(form));
  const e = {};
  if (!v.service) e.service = "required";
  if ((v.name || "").trim().length < 2) e.name = "required";
  if ((v.contact || "").replace(/\D/g, "").length < 9) e.contact = "phone";
  if (v.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.email.trim())) e.email = "email";
  if ((v.names || "").trim().length < 2) e.names = "required";
  if (!form.elements.consent.checked) e.consent = "consent";
  ["service", "name", "contact", "email", "names", "consent", "event_date"].forEach(k => setErr(k, e[k]));
  return e;
}
// Clear a field's error as soon as it is fixed; check on blur.
form.addEventListener("input", e => { if (e.target.name) setErr(e.target.name, ""); if (!form.querySelector(".fld.err")) msg.textContent = ""; });
form.addEventListener("change", e => { if (e.target.name === "consent" && e.target.checked) setErr("consent", ""); if (!form.querySelector(".fld.err")) msg.textContent = ""; });

form.addEventListener("submit", async ev => {
  ev.preventDefault();
  msg.textContent = "";
  const e = check();
  if (Object.keys(e).length) { msg.textContent = T.err.form; const f = form.querySelector(".err input, .err select, .err textarea"); if (f) f.focus(); return; }
  const v = Object.fromEntries(new FormData(form));
  const body = { ...v, consent: form.elements.consent.checked, lang: I.lang };
  btn.disabled = true; const label = btn.textContent; btn.textContent = T.sending;
  try {
    const r = await fetch("/api/orders", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) {
      if (j.fields) { Object.entries(j.fields).forEach(([k, c]) => setErr(k, c === "required" && k === "consent" ? "consent" : c)); msg.textContent = T.err.form; }
      else msg.textContent = T.err[j.error] || T.err.server;
      return;
    }
    try { sessionStorage.removeItem(DK); localStorage.setItem("toigo-last-order", j.status_url); } catch (_) {}
    location.href = j.pay_url || j.status_url;
  } catch (_) { msg.textContent = T.err.network; }
  finally { btn.disabled = false; btn.textContent = label; }
});
