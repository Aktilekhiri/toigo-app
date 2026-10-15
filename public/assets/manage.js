// Toigo — host page: guest answers, edit link, delete.
import { titleOf, esc } from "/assets/invite-core.js?v=mv920jox";

const CFG = JSON.parse(document.getElementById("i18n").textContent);
const S = CFG.ui, LANG = CFG.lang;
const app = document.getElementById("app");
const store = {
  get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }
};
const fmt = ts => new Date(ts).toLocaleString(LANG === "ky" ? "ky-KG" : "ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
const toast = t => { const el = document.createElement("div"); el.className = "toast"; el.setAttribute("role", "status"); el.textContent = t; document.body.appendChild(el); setTimeout(() => el.remove(), 2200); };

const m = /^([a-z0-9-]+)\.([a-z0-9]+)$/.exec(location.hash.slice(1));

function list() {
  const mine = store.get("toigo-mine") || [];
  app.innerHTML = mine.length
    ? `<div class="mine">${mine.map(x => `<a href="#${esc(x.slug)}.${esc(x.key)}"><span><b>${esc(x.title)}</b><br><small style="color:var(--muted)">/i/${esc(x.slug)}</small></span><span aria-hidden="true">→</span></a>`).join("")}</div>
       <p style="margin-top:20px"><a class="btn btn-p" href="${CFG.create}">${S.m_create}</a></p>`
    : `<div class="empty"><p>${S.m_none}</p><p style="margin-top:8px">${S.m_hint}</p><p style="margin-top:20px"><a class="btn btn-p" href="${CFG.create}">${S.m_create}</a></p></div>`;
}

async function load(slug, key) {
  app.innerHTML = `<p class="empty">${S.loading}</p>`;
  let res;
  try {
    const r = await fetch(`/api/invitations/${slug}`, { headers: { "x-edit-key": key } });
    if (r.status === 404) { app.innerHTML = `<div class="empty"><p>${S.bad_link}</p><p style="margin-top:20px"><a class="btn btn-p" href="${CFG.create}">${S.m_create}</a></p></div>`; return; }
    if (!r.ok) throw 0;
    res = await r.json();
  } catch { app.innerHTML = `<div class="empty"><p>${S.net}</p><p style="margin-top:16px"><button class="btn btn-g" type="button" id="retry">${S.refresh}</button></p></div>`; document.getElementById("retry").onclick = () => load(slug, key); return; }

  const d = res.data, g = res.guests, invitees = res.invitees || [];
  const answerOf = id => g.find(x => x.guest_id === id);
  const title = titleOf(d, d.lang);
  document.getElementById("mh1").textContent = title;
  const mine = (store.get("toigo-mine") || []).filter(x => x.slug !== slug);
  mine.unshift({ slug, key, title, date: d.date, at: Date.now() }); store.set("toigo-mine", mine.slice(0, 30));

  const yes = g.filter(x => x.attending), no = g.filter(x => !x.attending);
  const people = yes.reduce((a, x) => a + (x.guests || 1), 0);
  const link = `${location.origin}/i/${slug}`;
  const share = `https://wa.me/?text=${encodeURIComponent(`${S.share_text} ${title}\n${link}`)}`;

  app.innerHTML = `
  <div class="copyrow" style="margin-bottom:16px"><input id="m-link" type="text" readonly value="${esc(link)}" aria-label="${S.link}"><button type="button" class="btn btn-p btn-sm" data-copy="#m-link" data-done="${S.copied}">${S.copy}</button></div>
  <div class="toolbar">
    <a class="btn btn-g btn-sm" href="${esc(link)}" target="_blank" rel="noopener">${S.open}</a>
    <a class="btn btn-g btn-sm" href="${CFG.create}#edit=${slug}.${key}">${S.edit}</a>
    <a class="btn btn-gold btn-sm" href="${share}" target="_blank" rel="noopener">${S.wa}</a>
    <button type="button" class="btn btn-g btn-sm" id="refresh">${S.refresh}</button>
    ${g.length ? `<button type="button" class="btn btn-g btn-sm" id="csv">${S.csv}</button>` : ""}
  </div>
  <div class="stats">
    <div class="stat"><b>${yes.length}</b><span>${S.yes}</span></div>
    <div class="stat"><b>${no.length}</b><span>${S.no}</span></div>
    <div class="stat"><b>${people}</b><span>${S.total}</span></div>
    <div class="stat"><b>${res.views}</b><span>${S.views}</span></div>
  </div>
  <section class="invitees" aria-labelledby="inv-h">
    <h2 id="inv-h" style="font-size:26px;margin:8px 0 8px">${S.inv_h}</h2>
    <p style="color:var(--muted);max-width:62ch;margin:0 0 16px">${S.inv_p}</p>
    <div class="fld" style="max-width:640px"><label for="inv-add">${S.inv_add_l}</label><textarea id="inv-add" rows="4" placeholder="Актилек Казиев Кубанычбекович, +996 702 000 000"></textarea><span class="hint">${S.inv_add_h}</span></div>
    <div class="submit-row" style="margin:10px 0 18px"><button type="button" class="btn btn-p btn-sm" id="inv-add-btn">${S.inv_add}</button><span class="form-msg" id="inv-msg" aria-live="polite"></span></div>
    <div class="tbl">${invitees.length ? `<table><thead><tr><th>${S.inv_th}</th><th>${S.inv_seat}</th><th>${S.inv_st}</th><th></th></tr></thead><tbody>
      ${invitees.map(x => { const a = answerOf(x.id); const st = a ? `<span class="pill ${a.attending ? "y" : "x"}">${a.attending ? S.inv_yes : S.inv_no}${a.attending && a.guests > 1 ? " · " + a.guests : ""}</span>` : x.opens ? `<span class="pill o">${S.inv_open}</span>` : `<span class="pill s">${S.inv_sent}</span>`;
        const url = `${location.origin}/i/${slug}/${x.code}`;
        const text = S.inv_text.replace("{name}", x.name).replace("{title}", title) + "\n" + url;
        const wa = `https://wa.me/${(x.phone || "").replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;
        return `<tr><td>${esc(x.name)}${x.phone ? `<br><small style="color:var(--muted)">${esc(x.phone)}</small>` : ""}</td><td><input class="seat-in" type="text" maxlength="40" value="${esc(x.seat || "")}" placeholder="${S.inv_seat_ph}" data-seat="${x.id}" aria-label="${S.inv_seat}: ${esc(x.name)}"></td><td>${st}</td>
          <td style="white-space:nowrap"><a class="btn btn-gold btn-sm" href="${esc(wa)}" target="_blank" rel="noopener">${S.inv_send}</a>
          <button type="button" class="btn btn-g btn-sm" data-cp="${esc(url)}">${S.inv_copy}</button>
          <button type="button" class="x-btn" data-delg="${x.id}" aria-label="${S.del} ${esc(x.name)}">${S.del}</button></td></tr>`; }).join("")}
    </tbody></table>` : `<p class="empty">${S.inv_none}</p>`}</div>
  </section>
  <h2 style="font-size:26px;margin:32px 0 14px">${S.answers}</h2>
  <div class="tbl">${g.length ? `<table><thead><tr><th>${S.th_name}</th><th>${S.th_status}</th><th>${S.th_count}</th><th>${S.th_note}</th><th>${S.th_date}</th><th></th></tr></thead><tbody>
    ${g.map(x => `<tr><td>${esc(x.name)}</td><td><span class="pill ${x.attending ? "y" : "x"}">${x.attending ? S.yes : S.no}</span></td><td class="n">${x.attending ? x.guests : "—"}</td><td>${esc(x.note) || "—"}</td><td class="n">${fmt(x.created_at)}</td><td><button type="button" class="x-btn" data-del="${x.id}">${S.del}</button></td></tr>`).join("")}
  </tbody></table>` : `<p class="empty">${S.no_answers}</p>`}</div>
  <div style="margin-top:40px" id="danger"><button type="button" class="btn btn-g btn-sm" id="delinv" style="color:var(--no)">${S.del_inv}</button></div>`;

  document.getElementById("refresh").onclick = () => load(slug, key);
  const post = body => fetch(`/api/invitations/${slug}`, { method: "POST", headers: { "content-type": "application/json", "x-edit-key": key }, body: JSON.stringify(body) }).catch(() => null);
  document.getElementById("inv-add-btn").onclick = async e => {
    const btn = e.currentTarget, msg = document.getElementById("inv-msg");
    const lines = document.getElementById("inv-add").value.split("\n").map(l => l.trim()).filter(Boolean);
    if (!lines.length) { msg.textContent = S.need_name; return; }
    const isPhone = v => /^\+?[\d\s()-]{7,}$/.test(v);
    const guests = lines.map(l => {
      const parts = l.split(/[,;]/).map(x => x.trim()).filter(Boolean);
      const g = { name: parts.shift() || "" };
      for (const v of parts) { if (!g.phone && isPhone(v)) g.phone = v; else g.seat = g.seat ? g.seat + ", " + v : v; }
      return g;
    });
    btn.disabled = true;
    const r = await post({ action: "add_guests", guests });
    btn.disabled = false;
    if (r && r.ok) { toast(S.inv_added); load(slug, key); }
    else msg.textContent = r && r.status === 400 ? S.inv_max : S.net;
  };
  app.querySelectorAll("[data-cp]").forEach(b => b.onclick = async () => {
    try { await navigator.clipboard.writeText(b.dataset.cp); toast(S.copied); } catch { prompt("", b.dataset.cp); }
  });
  app.querySelectorAll("[data-seat]").forEach(inp => {
    let saved = inp.value;
    const save = async () => {
      if (inp.value.trim() === saved.trim()) return;
      const r = await post({ action: "set_seat", id: +inp.dataset.seat, seat: inp.value });
      if (r && r.ok) { saved = inp.value; toast(S.inv_saved); } else toast(S.net);
    };
    inp.addEventListener("blur", save);
    inp.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); inp.blur(); } });
  });
  app.querySelectorAll("[data-delg]").forEach(b => b.onclick = async () => {
    b.disabled = true;
    const r = await post({ action: "delete_guest", id: +b.dataset.delg });
    if (r && r.ok) load(slug, key); else { b.disabled = false; toast(S.net); }
  });
  const csv = document.getElementById("csv");
  if (csv) csv.onclick = () => {
    const rows = [[S.th_name, S.th_status, S.th_count, S.th_note, S.th_date], ...g.map(x => [x.name, x.attending ? S.yes : S.no, x.attending ? x.guests : 0, x.note || "", new Date(x.created_at).toISOString()])];
    const body = "﻿" + rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(";")).join("\r\n");
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([body], { type: "text/csv;charset=utf-8" })); a.download = `${slug}-guests.csv`; a.click();
  };
  app.querySelectorAll("[data-del]").forEach(b => b.onclick = async () => {
    b.disabled = true;
    const r = await fetch(`/api/invitations/${slug}`, { method: "POST", headers: { "content-type": "application/json", "x-edit-key": key }, body: JSON.stringify({ action: "delete_rsvp", id: +b.dataset.del }) }).catch(() => null);
    if (r && r.ok) load(slug, key); else { b.disabled = false; toast(S.net); }
  });
  document.getElementById("delinv").onclick = () => {
    const box = document.getElementById("danger");
    box.innerHTML = `<div class="confirm"><p>${S.del_confirm}</p><div class="toolbar" style="margin:0"><button type="button" class="btn btn-sm" style="background:var(--no);color:#fff" id="delyes">${S.del_yes}</button><button type="button" class="btn btn-g btn-sm" id="delno">${S.cancel}</button></div></div>`;
    document.getElementById("delno").onclick = () => load(slug, key);
    document.getElementById("delyes").onclick = async () => {
      const r = await fetch(`/api/invitations/${slug}`, { method: "DELETE", headers: { "x-edit-key": key } }).catch(() => null);
      if (r && r.ok) {
        store.set("toigo-mine", (store.get("toigo-mine") || []).filter(x => x.slug !== slug));
        history.replaceState(null, "", location.pathname); toast(S.deleted); list();
        document.getElementById("mh1").textContent = document.title.split("|")[0].trim();
      } else toast(S.net);
    };
  };
}

function route() {
  const mm = /^([a-z0-9-]+)\.([a-z0-9]+)$/.exec(location.hash.slice(1));
  if (mm) load(mm[1], mm[2]); else list();
}
addEventListener("hashchange", route);
route();
