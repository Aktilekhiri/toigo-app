// Toigo — orders admin. Every request carries the session token; the server checks it each time.
const D = JSON.parse(document.getElementById("a-data").textContent);
const app = document.getElementById("a-app"), out = document.getElementById("a-logout");
const KEY = "toigo-admin";
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const fmt = ts => ts ? new Date(ts).toLocaleString("ru-RU", { timeZone: "Asia/Bishkek", day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" }) : "—";
const ST = { PENDING_PAYMENT: "Ждёт оплаты", PAID: "Оплачен", PAYMENT_FAILED: "Оплата не прошла", IN_PROGRESS: "В работе", COMPLETED: "Готов", CANCELLED: "Отменён" };
const TONE = { PAID: "ok", IN_PROGRESS: "ok", COMPLETED: "done", PAYMENT_FAILED: "no", CANCELLED: "mute", PENDING_PAYMENT: "wait" };
const PST = { CREATED: "создан, ждёт оплаты", ERROR: "ошибка создания", SUCCEEDED: "оплачен", FAILED: "не прошёл", MISMATCH: "не совпала сумма — проверить" };
const EST = { PENDING: "в очереди", SENT: "отправлено", FAILED: "не отправлено" };
const EERR = { no_transport: "почта ещё не настроена (см. README)" };
const pill = s => `<span class="pill p-${TONE[s] || "wait"}">${esc(ST[s] || s)}</span>`;
const tok = () => { try { const t = JSON.parse(sessionStorage.getItem(KEY) || "null"); return t && t.exp > Date.now() ? t.token : null; } catch { return null; } };
let filter = { status: "", q: "" };

async function api(path, opts = {}) {
  const r = await fetch(path, { ...opts, headers: { "content-type": "application/json", authorization: `Bearer ${tok()}`, ...(opts.headers || {}) }, cache: "no-store" });
  if (r.status === 401) { sessionStorage.removeItem(KEY); login("Сессия закончилась, войдите снова."); throw new Error("401"); }
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error(j.error || "error"), { code: j.error });
  return j;
}

function login(note = "") {
  out.hidden = true;
  app.innerHTML = `<form class="adm-login" id="lf"><h1>Вход</h1>${note ? `<p class="hint">${esc(note)}</p>` : ""}
    <div class="fld"><label for="pw">Пароль администратора</label><input id="pw" type="password" autocomplete="current-password" required></div>
    <button class="btn btn-p" type="submit">Войти</button><p class="form-msg" id="lm" aria-live="polite"></p></form>`;
  document.getElementById("pw").focus();
  document.getElementById("lf").addEventListener("submit", async e => {
    e.preventDefault(); const m = document.getElementById("lm"); m.textContent = "";
    const r = await fetch("/api/admin/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ password: document.getElementById("pw").value }) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) { m.textContent = { bad_password: "Неверный пароль.", rate_limited: "Слишком много попыток. Подождите 15 минут.", admin_not_configured: "Админка не настроена: задайте ADMIN_PASSWORD_HASH и ADMIN_SESSION_SECRET." }[j.error] || "Ошибка входа."; return; }
    sessionStorage.setItem(KEY, JSON.stringify(j)); route();
  });
}

async function list() {
  out.hidden = false;
  app.innerHTML = `<p class="empty">Загружаем…</p>`;
  const p = new URLSearchParams(); if (filter.status) p.set("status", filter.status); if (filter.q) p.set("q", filter.q);
  let j; try { j = await api(`/api/admin/orders?${p}`); } catch (e) { if (e.message !== "401") app.innerHTML = `<p class="form-msg">Не удалось загрузить заказы.</p>`; return; }
  const total = Object.values(j.counts).reduce((a, b) => a + b, 0);
  app.innerHTML = `
    <div class="adm-bar">
      <form id="sf" class="adm-search"><input id="sq" type="search" placeholder="Номер, имя, телефон" value="${esc(filter.q)}" aria-label="Поиск"><button class="btn btn-g btn-sm">Найти</button></form>
      <div class="chips">${[["", `Все · ${total}`], ...Object.keys(ST).map(s => [s, `${ST[s]} · ${j.counts[s] || 0}`])].map(([s, l]) => `<button type="button" class="chip${filter.status === s ? " on" : ""}" data-st="${s}">${esc(l)}</button>`).join("")}</div>
    </div>
    ${j.orders.length ? `<div class="tbl"><table><thead><tr><th>Заказ</th><th>Создан</th><th>Услуга</th><th>Клиент</th><th>Той</th><th>Статус</th></tr></thead><tbody>
      ${j.orders.map(o => `<tr data-id="${esc(o.id)}" tabindex="0"><td><b>${esc(o.id)}</b><br><small>${esc(o.amount)} ${esc(o.currency)}</small></td><td>${fmt(o.created_at)}</td><td>${esc((D.services[o.service] || {}).name || o.service)}</td><td>${esc(o.name)}<br><small>${esc(o.contact)}</small></td><td>${esc(D.types[o.event_type] || o.event_type)}<br><small>${esc(o.event_date || "")}</small></td><td>${pill(o.status)}</td></tr>`).join("")}
    </tbody></table></div>` : `<div class="empty-box"><p>${filter.status || filter.q ? "Под этот фильтр заказов нет." : "Заказов пока нет. Они появятся здесь, как только кто-то оформит заказ на странице услуг."}</p>${filter.status || filter.q ? `<button type="button" class="btn btn-g btn-sm" data-reset>Сбросить фильтр</button>` : ""}</div>`}`;
}

async function detail(id) {
  out.hidden = false;
  let j; try { j = await api(`/api/admin/orders/${id}`); } catch (e) { if (e.message !== "401") app.innerHTML = `<p><a href="#" class="link">← Все заказы</a></p><p class="form-msg">Заказ не найден.</p>`; return; }
  showDetail(j);
}

function showDetail({ order: o, payments, emails }) {
  const unpaid = ["PENDING_PAYMENT", "PAYMENT_FAILED"].includes(o.status);
  const svc = D.services[o.service] || { name: o.service, price: o.amount };
  const wa = o.contact.replace(/\D/g, "");
  const row = (k, v) => v ? `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>` : "";
  const acts = [];
  if (o.status === "PAID") acts.push(`<button class="btn btn-p btn-sm" data-act="status" data-v="IN_PROGRESS">Взять в работу</button>`);
  if (["PAID", "IN_PROGRESS"].includes(o.status)) acts.push(`<button class="btn btn-gold btn-sm" data-act="status" data-v="COMPLETED">Отметить готовым</button>`);
  if (unpaid) acts.push(`<button class="btn btn-g btn-sm" data-act="status" data-v="CANCELLED" data-confirm="Отменить заказ ${esc(o.id)}?">Отменить заказ</button>`);
  app.innerHTML = `
    <p><a href="#" class="link">← Все заказы</a></p>
    <div class="adm-head"><h1>${esc(o.id)}</h1>${pill(o.status)}</div>
    <div class="adm-grid">
      <section class="box"><h2>Заказ</h2><dl class="kv">
        ${row("Услуга", `${svc.name} — ${o.amount} ${o.currency}`)}${row("Создан", fmt(o.created_at))}${row("Оплачен", o.paid_at ? fmt(o.paid_at) : "")}
        ${row("Клиент", o.name)}${row("Контакт", o.contact)}${row("Email", o.email)}${row("Язык", o.lang === "ru" ? "русский" : "кыргызский")}
        ${row("Той", D.types[o.event_type] || o.event_type)}${row("Дата тоя", o.event_date)}${row("Шаблон", o.tpl)}
        ${row("Имена", o.names)}${row("Текст / пожелания", o.message)}${row("Дополнительно", o.extra)}
      </dl>
      <div class="acts">${wa.length >= 9 ? `<a class="btn btn-g btn-sm" href="https://wa.me/${wa}?text=${encodeURIComponent(`Здравствуйте! Это Тойго, по заказу ${o.id}.`)}" target="_blank" rel="noopener">WhatsApp клиенту</a>` : ""}${acts.join("")}</div>
      <p class="form-msg" id="am" aria-live="polite"></p></section>

      <section class="box"><h2>Работа</h2>
        <div class="fld"><label for="ru">Ссылка на готовое приглашение</label><div class="copyrow"><input id="ru" type="url" placeholder="https://toigo.app/i/..." value="${esc(o.result_url || "")}"><button class="btn btn-g btn-sm" data-act="result_url">Сохранить</button></div><span class="hint">Клиент увидит её на странице заказа, когда статус станет «Готов».</span></div>
        <div class="fld"><label for="nt">Внутренняя заметка</label><textarea id="nt" maxlength="4000">${esc(o.note || "")}</textarea><button class="btn btn-g btn-sm" data-act="note" style="align-self:flex-start">Сохранить заметку</button></div>
        ${unpaid ? `<div class="manual-pay"><h3>Подтвердить оплату переводом</h3><p class="hint">Только после того, как увидели деньги в банковском приложении. Введите сумму ещё раз для проверки.</p>
          <div class="row2"><div class="fld"><label for="mp-a">Сумма, сом</label><input id="mp-a" inputmode="numeric" placeholder="${svc.price}"></div><div class="fld"><label for="mp-r">Откуда (банк, время, отправитель)</label><input id="mp-r" maxlength="120" placeholder="MBank, 14:32, Айгерим"></div></div>
          <button class="btn btn-p btn-sm" data-act="confirm_payment">Подтвердить оплату ${svc.price} сом</button></div>` : ""}
      </section>

      <section class="box"><h2>Платежи</h2>${payments.length ? `<div class="tbl"><table><thead><tr><th>Способ</th><th>Сумма</th><th>Статус</th><th>Время</th></tr></thead><tbody>${payments.map(p => `<tr><td>${p.provider === "manual" ? "перевод" : esc(p.provider)}<br><small>${esc(p.provider_payment_id)}</small></td><td>${esc(p.amount)} ${esc(p.currency)}</td><td>${esc(PST[p.status] || p.status)}${p.error ? `<br><small>${esc(p.error)}</small>` : ""}</td><td>${fmt(p.confirmed_at || p.created_at)}</td></tr>`).join("")}</tbody></table></div>` : `<p class="hint">Платежей ещё не было.</p>`}</section>

      <section class="box"><h2>Письма администратору</h2>${emails.length ? `<div class="tbl"><table><thead><tr><th>Письмо</th><th>Статус</th><th>Попыток</th><th>Отправлено</th></tr></thead><tbody>${emails.map(m => `<tr><td>${{ new_order: "Новый заказ", paid: "Оплата", payment_issue: "Проблема с оплатой" }[m.kind] || esc(m.kind)}</td><td>${esc(EST[m.status] || m.status)}${m.last_error ? `<br><small>${esc(EERR[m.last_error] || m.last_error)}</small>` : ""}</td><td>${m.attempts}</td><td>${fmt(m.sent_at)}</td></tr>`).join("")}</tbody></table></div>` : `<p class="hint">Писем не было.</p>`}
        <div class="acts"><button class="btn btn-g btn-sm" data-act="resend" data-v="new_order">Отправить «Новый заказ» ещё раз</button>${o.paid_at ? `<button class="btn btn-g btn-sm" data-act="resend" data-v="paid">Отправить «Оплата» ещё раз</button>` : ""}</div></section>
    </div>`;
  app.dataset.id = o.id;
}

const ERR = { bad_transition: "Такой переход статуса невозможен.", amount_mismatch: "Сумма не совпадает с ценой услуги.", reference_required: "Укажите, откуда пришёл перевод.", not_payable: "Заказ уже оплачен или отменён.", bad_url: "Ссылка должна начинаться с https://", not_paid: "Заказ ещё не оплачен." };

app.addEventListener("click", async e => {
  const st = e.target.closest("[data-st]"); if (st) { filter.status = st.dataset.st; return list(); }
  if (e.target.closest("[data-reset]")) { filter = { status: "", q: "" }; return list(); }
  const tr = e.target.closest("tr[data-id]"); if (tr) { location.hash = tr.dataset.id; return; }
  const b = e.target.closest("[data-act]"); if (!b) return;
  const id = app.dataset.id, a = b.dataset.act, m = document.getElementById("am");
  if (b.dataset.confirm && !confirm(b.dataset.confirm)) return;
  const body = { action: a };
  if (a === "status") body.status = b.dataset.v;
  if (a === "resend") body.kind = b.dataset.v;
  if (a === "note") body.note = document.getElementById("nt").value;
  if (a === "result_url") body.url = document.getElementById("ru").value;
  if (a === "confirm_payment") {
    body.amount = Number(document.getElementById("mp-a").value); body.reference = document.getElementById("mp-r").value;
    if (!confirm(`Подтвердить, что ${body.amount} сом по заказу ${id} получены?`)) return;
  }
  b.disabled = true;
  try { showDetail(await api(`/api/admin/orders/${id}`, { method: "POST", body: JSON.stringify(body) })); const mm = document.getElementById("am"); if (mm) { mm.style.color = "var(--ok)"; mm.textContent = "Сохранено."; } }
  catch (err) { if (err.message !== "401") { b.disabled = false; if (m) m.textContent = ERR[err.code] || "Не получилось. Попробуйте ещё раз."; } }
});
app.addEventListener("keydown", e => { const tr = e.target.closest("tr[data-id]"); if (tr && e.key === "Enter") location.hash = tr.dataset.id; });
app.addEventListener("submit", e => { if (e.target.id === "sf") { e.preventDefault(); filter.q = document.getElementById("sq").value.trim(); list(); } });
out.addEventListener("click", () => { sessionStorage.removeItem(KEY); location.hash = ""; login(); });

function route() {
  if (!tok()) return login();
  const id = location.hash.slice(1);
  /^TG-[A-Z0-9]{6}$/.test(id) ? detail(id) : list();
}
addEventListener("hashchange", route);
route();
