// Toigo — interactive parts of an invitation: countdown, music, RSVP, photo zoom.
// Works for the live page and for the constructor preview (mode="preview").

function tick() {
  const now = Date.now();
  document.querySelectorAll(".inv .cd").forEach(cd => {
    const ts = +cd.dataset.ts; if (!ts) return;
    let s = Math.floor((ts - now) / 1000);
    if (s <= 0) {
      if (!cd.classList.contains("over") && cd.closest('[data-mode="live"]')) { cd.classList.add("over"); cd.textContent = cd.dataset.past; }
      s = 0;
    }
    const v = { d: Math.floor(s / 86400), h: Math.floor(s % 86400 / 3600), m: Math.floor(s % 3600 / 60), s: s % 60 };
    cd.querySelectorAll("[data-u]").forEach(b => { b.textContent = v[b.dataset.u]; });
  });
}

// Background music: one shared <audio>, loaded only after the guest taps the music button.
const MUS = { on: false, el: null, file: "" };
function toggleMusic(btn) {
  const file = (btn && btn.dataset.track) || "toi-music-3";
  if (!MUS.el) {
    MUS.el = new Audio();
    MUS.el.loop = true; MUS.el.preload = "auto"; MUS.el.volume = 0.8;
    MUS.el.addEventListener("pause", () => sync(false));
    MUS.el.addEventListener("play", () => sync(true));
  }
  // AAC for Safari/iPhone, Opus for browsers without AAC.
  if (MUS.file !== file) {
    MUS.file = file;
    MUS.el.src = `/assets/audio/${file}.` + (MUS.el.canPlayType('audio/mp4; codecs="mp4a.40.2"') ? "m4a" : "webm");
  }
  if (MUS.el.paused) MUS.el.play().catch(() => sync(false)); else MUS.el.pause();
}
// Constructor: switch the playing track without the guest pressing anything.
export function setTrack(file) {
  if (!MUS.el || MUS.file === file) return;
  const playing = !MUS.el.paused;
  MUS.file = file;
  MUS.el.src = `/assets/audio/${file}.` + (MUS.el.canPlayType('audio/mp4; codecs="mp4a.40.2"') ? "m4a" : "webm");
  if (playing) MUS.el.play().catch(() => sync(false));
}
function sync(on) {
  MUS.on = on;
  document.querySelectorAll(".inv .mus").forEach(b => b.setAttribute("aria-pressed", String(on)));
}
export function stopMusic() { if (MUS.el && !MUS.el.paused) MUS.el.pause(); }
export function musicOn() { return MUS.on; }

async function submitRsvp(form) {
  const inv = form.closest(".inv"), err = form.querySelector(".err");
  const name = form.elements.name.value.trim();
  err.textContent = "";
  if (!name) { err.textContent = err.dataset.err; form.elements.name.focus(); return; }
  if (inv.dataset.mode !== "live") { err.textContent = err.dataset.preview; return; }
  const att = form.querySelector('input[name="att"]:checked').value === "1";
  const body = {
    name, attending: att, guests: att ? Math.min(20, Math.max(1, +form.elements.guests.value || 1)) : 0,
    note: form.elements.note.value.trim(), website: form.elements.website.value, g: inv.dataset.guest || ""
  };
  const btn = form.querySelector('button[type="submit"]'); btn.disabled = true;
  try {
    const r = await fetch(`/api/rsvp/${encodeURIComponent(inv.dataset.slug)}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    if (!r.ok) throw new Error(r.status);
    form.hidden = true; form.nextElementSibling.hidden = false;
    try { localStorage.setItem("toigo-rsvp-" + inv.dataset.slug + (inv.dataset.guest ? "-" + inv.dataset.guest : ""), "1"); } catch (_) {}
  } catch (e) { err.textContent = err.dataset.fail; }
  finally { btn.disabled = false; }
}

// ---------- decorative animation per toi type ----------
// uylonuu: blue butterflies + petals · kyz: rose petals · sunnot: gold stars
// tushoo: rising bubbles · maarake: gold sparkles · tuulgan: confetti
const FX = {
  uylonuu: { n: 22, kinds: ["fly", "petal", "petal"], colors: ["#8EC5FF", "#B7DAFF", "#5E9EEA", "#DCEEFF"], dir: 1 },
  kyz:     { n: 24, kinds: ["petal"], colors: ["#F6B3C2", "#EC8AA0", "#F9D5DE", "#E8C27A"], dir: 1 },
  sunnot:  { n: 26, kinds: ["star"], colors: ["#F2C46B", "#FFE3A3", "#FFFFFF"], dir: 1 },
  tushoo:  { n: 18, kinds: ["bubble"], colors: ["#9CCBF0", "#FFFFFF", "#F7C58A"], dir: -1 },
  maarake: { n: 30, kinds: ["spark"], colors: ["#E2BE77", "#FFF0C8", "#C99A4B"], dir: -1 },
  tuulgan: { n: 34, kinds: ["confetti"], colors: ["#FF6B8B", "#FFC94A", "#4CC9F0", "#7BD389", "#B794F6"], dir: 1 }
};
const REDUCE = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
const fxList = new Set();
function newP(cfg, w, h, init) {
  const k = cfg.kinds[Math.floor(Math.random() * cfg.kinds.length)];
  return { k, c: cfg.colors[Math.floor(Math.random() * cfg.colors.length)],
    x: Math.random() * w, y: init ? Math.random() * h : (cfg.dir > 0 ? -20 : h + 20),
    s: k === "fly" ? 9 + Math.random() * 6 : k === "bubble" ? 6 + Math.random() * 10 : k === "spark" || k === "star" ? 1.5 + Math.random() * 2.5 : 5 + Math.random() * 5,
    vy: (0.25 + Math.random() * 0.5) * cfg.dir, vx: (Math.random() - 0.5) * 0.3,
    a: Math.random() * Math.PI * 2, va: (Math.random() - 0.5) * 0.04, ph: Math.random() * 6.28 };
}
function draw(c, p, t) {
  c.save(); c.translate(p.x, p.y); c.rotate(p.a); c.fillStyle = p.c; c.strokeStyle = p.c;
  if (p.k === "petal") { c.globalAlpha = 0.85; c.beginPath(); c.ellipse(0, 0, p.s, p.s * 0.55, 0, 0, 6.283); c.fill(); }
  else if (p.k === "fly") { const f = Math.abs(Math.sin(t * 6 + p.ph)) * 0.8 + 0.2; c.globalAlpha = 0.9;
    for (const sd of [-1, 1]) { c.save(); c.scale(sd * f, 1); c.beginPath(); c.ellipse(p.s * 0.55, -p.s * 0.25, p.s * 0.6, p.s * 0.45, 0.5, 0, 6.283); c.ellipse(p.s * 0.4, p.s * 0.35, p.s * 0.38, p.s * 0.3, -0.4, 0, 6.283); c.fill(); c.restore(); }
    c.globalAlpha = 1; c.fillStyle = "rgba(40,60,90,.6)"; c.fillRect(-0.8, -p.s * 0.5, 1.6, p.s); }
  else if (p.k === "star" || p.k === "spark") { c.globalAlpha = 0.45 + 0.55 * Math.abs(Math.sin(t * 2 + p.ph)); c.beginPath();
    for (let i = 0; i < 4; i++) { c.rotate(Math.PI / 2); c.moveTo(0, 0); c.quadraticCurveTo(p.s * 0.4, p.s * 0.4, 0, p.s * 3); }
    c.fill(); c.beginPath(); c.arc(0, 0, p.s * 0.7, 0, 6.283); c.fill(); }
  else if (p.k === "bubble") { c.globalAlpha = 0.5; c.lineWidth = 1.2; c.beginPath(); c.arc(0, 0, p.s, 0, 6.283); c.stroke(); c.globalAlpha = 0.25; c.fill(); }
  else { c.globalAlpha = 0.9; c.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); }
  c.restore();
}
function mountFx(inv) {
  inv.dataset.fxOn = "1";
  const cfg = FX[inv.dataset.fx]; if (!cfg || REDUCE) return;
  const cv = document.createElement("canvas"); cv.className = "fx"; cv.setAttribute("aria-hidden", "true");
  const live = inv.dataset.mode === "live";
  (live ? inv : inv.querySelector(".cv") || inv).appendChild(cv);
  const e = { inv, cv, cfg, ps: [], w: 0, h: 0, live };
  fxList.add(e);
}
function size(e) {
  const r = e.cv.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
  if (!r.width || !r.height) return false;
  if (Math.abs(r.width - e.w) > 1 || Math.abs(r.height - e.h) > 1) {
    e.w = r.width; e.h = r.height; e.cv.width = e.w * dpr; e.cv.height = e.h * dpr;
    e.cv.getContext("2d").setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = Math.round(e.cfg.n * Math.min(1.6, Math.max(0.6, e.w / 400)));
    e.ps = Array.from({ length: n }, () => newP(e.cfg, e.w, e.h, true));
  }
  return true;
}
let fxRunning = false;
function fxLoop(now) {
  const t = now / 1000;
  for (const e of fxList) {
    if (!e.cv.isConnected) { fxList.delete(e); continue; }
    if (document.hidden || !size(e)) continue;
    const c = e.cv.getContext("2d"); c.clearRect(0, 0, e.w, e.h);
    for (let i = 0; i < e.ps.length; i++) {
      const p = e.ps[i];
      p.y += p.vy; p.x += p.vx + Math.sin(t + p.ph) * 0.35; p.a += p.va;
      if (p.y > e.h + 30 || p.y < -30 || p.x < -30 || p.x > e.w + 30) { e.ps[i] = newP(e.cfg, e.w, e.h, false); continue; }
      draw(c, p, t);
    }
  }
  requestAnimationFrame(fxLoop);
}
function scanFx() {
  document.querySelectorAll(".inv[data-fx]:not([data-fx-on])").forEach(mountFx);
  if (!fxRunning && fxList.size) { fxRunning = true; requestAnimationFrame(fxLoop); }
}

let started = false;
// Envelope: open once per page visit-session; the tap is a user gesture, so music may start here.
function initEnvelope() {
  const env = document.querySelector(".inv .env"); if (!env) return;
  let seen = false; try { seen = sessionStorage.getItem("toigo-env:" + location.pathname) === "1"; } catch (_) {}
  if (seen) { env.remove(); return; }
  document.documentElement.classList.add("env-lock");
}
// ---------- Envelope opening: wax seal bursts into gold dust, the flap opens,
// silk pours out of the envelope and covers the screen, then dissolves into the invitation.
const SILK_VS = "attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}";
const SILK_FS = `precision highp float;
uniform vec2 R;uniform vec4 B;uniform float T,P,D,K;uniform vec3 C0,C1,C2;
float h(vec2 p,float t){p=mat2(.8,-.6,.6,.8)*p;vec2 q=p;q.x+=.45*sin(q.y*1.1+t*.6);q.y+=.2*sin(q.x*.9-t*.45);
 return .6*sin(q.x*1.6+q.y*.35+t*.8)+.3*sin(q.x*2.9-q.y*.6-t*1.05)+.1*sin(q.x*5.1+q.y*1.2+t*1.5);}
vec3 silk(vec2 p,float t){float e=.004;float a=h(p,t);vec2 g=vec2(h(p+vec2(e,0.),t)-a,h(p+vec2(0.,e),t)-a)/e;
 vec3 n=normalize(vec3(-g*.3,1.));vec3 L=normalize(vec3(-.5,.6,.65));float d=clamp(dot(n,L),0.,1.);
 float s=pow(clamp(dot(n,normalize(L+vec3(0.,0.,1.))),0.,1.),14.);
 vec3 sh=K>.5?C0*.5:C0*vec3(.84,.78,.70);vec3 c=mix(sh,C0,smoothstep(.2,.98,d));c=mix(c,C2,.16*smoothstep(.2,-.8,a));return c+C1*s*(K>.5?.5:.22);}
float aa(float v){return clamp(v/(1.6*D)+.5,0.,1.);}
void main(){vec2 f=vec2(gl_FragCoord.x,R.y-gl_FragCoord.y);float x=f.x,y=f.y,W=R.x,H=R.y;
 vec2 p=f/min(W,H)*2.6;float cx=B.x+B.z*.5;
 float r=smoothstep(0.,1.,clamp(P/.72,0.,1.));float xn=(x-cx)/(B.z*.5);
 float top=B.y+B.w*.45-r*(B.y+B.w*.45+H*.35)*(1.-.22*min(xn*xn,4.))+14.*D*sin(x/(40.*D)+T*3.)*(.35+r);
 float hw=B.z*.44*(1.+r*2.6);
 float rx=(x-B.x)/B.z,ry=(y-B.y)/B.w;float pk=step(0.,rx)*step(rx,1.)*step(.56*(1.-abs(2.*rx-1.)),ry)*step(ry,1.04);
 float ob=max(aa(B.x-x),aa(x-B.x-B.z));float aA=aa(y-top)*aa(hw-abs(x-cx))*aa(B.y+B.w-y)*(1.-pk)*(1.-ob*aa(y-B.y-4.*D));
 vec3 cA=silk(p,T)*mix(.8,1.,smoothstep(0.,26.*D,y-top));
 float s=smoothstep(.42,1.,P);
 float fr=-.3*H+s*1.75*H+.07*H*sin(x/W*3.3+T*1.8)+(x-cx)*.28*(1.-s);
 float aF=aa(fr-y)*step(.42,P);vec3 cF=silk(p*1.15+vec2(3.1,1.7),T*1.1)*mix(.84,1.,smoothstep(0.,30.*D,fr-y));
 float sh=(1.-aF)*step(.42,P)*.22*exp(-max(y-fr,0.)/(34.*D));
 vec3 col=cF*aF+cA*aA*(1.-aF);float al=aF+aA*(1.-aF);
 col*= (1.-sh);al=al+sh*(1.-al);gl_FragColor=vec4(col,al);}`;

function rgbOf(str) {
  const c = document.createElement("canvas").getContext("2d"); c.fillStyle = "#000"; c.fillStyle = str || "#fff";
  const v = c.fillStyle; if (v[0] === "#") return [1, 3, 5].map(i => parseInt(v.slice(i, i + 2), 16) / 255);
  return v.match(/[\d.]+/g).slice(0, 3).map(n => +n / 255);
}
const mixc = (a, b, k) => a.map((v, i) => v + (b[i] - v) * k);

function silkLayer(env, box, dur) {
  const cv = document.createElement("canvas"); cv.className = "env-silk";
  const gl = cv.getContext("webgl", { premultipliedAlpha: true, antialias: false }) || cv.getContext("experimental-webgl");
  if (!gl) return null;
  const sh = (t, src) => { const o = gl.createShader(t); gl.shaderSource(o, src); gl.compileShader(o); return gl.getShaderParameter(o, gl.COMPILE_STATUS) ? o : null; };
  const vs = sh(gl.VERTEX_SHADER, SILK_VS), fs = sh(gl.FRAGMENT_SHADER, SILK_FS); if (!vs || !fs) return null;
  const pg = gl.createProgram(); gl.attachShader(pg, vs); gl.attachShader(pg, fs); gl.linkProgram(pg);
  if (!gl.getProgramParameter(pg, gl.LINK_STATUS)) return null;
  gl.useProgram(pg);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const al = gl.getAttribLocation(pg, "a"); gl.enableVertexAttribArray(al); gl.vertexAttribPointer(al, 2, gl.FLOAT, false, 0, 0);
  const U = n => gl.getUniformLocation(pg, n);
  const cs = getComputedStyle(env.closest(".inv"));
  const ib = rgbOf(cs.getPropertyValue("--ib").trim()), ia = rgbOf(cs.getPropertyValue("--ia").trim());
  const lum = .3 * ib[0] + .59 * ib[1] + .11 * ib[2], dark = lum < .45;
  const c0 = dark ? mixc(ib, [1, 1, 1], .1).map(v => Math.min(v * 1.7, 1)) : mixc(ib, [1, 1, 1], .4), c1 = dark ? mixc(ia, [1, 1, 1], .3) : [1, 1, 1], c2 = dark ? mixc(ib, [0, 0, 0], .3) : mixc(ia, [1, 1, 1], .25);
  gl.uniform3fv(U("C0"), c0); gl.uniform3fv(U("C1"), c1); gl.uniform3fv(U("C2"), c2); gl.uniform1f(U("K"), dark ? 1 : 0);
  const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  const size = () => { cv.width = Math.round(innerWidth * dpr); cv.height = Math.round(innerHeight * dpr); gl.viewport(0, 0, cv.width, cv.height); };
  size(); env.appendChild(cv);
  const t0 = performance.now(); let raf = 0, stop = false;
  const frame = now => {
    if (stop) return;
    if (cv.width !== Math.round(innerWidth * dpr)) size();
    const b = box.getBoundingClientRect(), t = (now - t0) / 1000;
    gl.uniform2f(U("R"), cv.width, cv.height); gl.uniform1f(U("D"), dpr);
    gl.uniform4f(U("B"), b.left * dpr, b.top * dpr, b.width * dpr, b.height * dpr);
    gl.uniform1f(U("T"), t + 1.3); gl.uniform1f(U("P"), Math.min(t / dur, 1.2));
    gl.drawArrays(gl.TRIANGLES, 0, 3); raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);
  return () => { stop = true; cancelAnimationFrame(raf); };
}

function sealDust(env) {
  const seal = env.querySelector(".env-seal"), box = env.querySelector(".env-box");
  if (!seal || !box || !seal.animate) return;
  const sr = seal.getBoundingClientRect(), br = box.getBoundingClientRect();
  const x0 = sr.left - br.left + sr.width / 2, y0 = sr.top - br.top + sr.height / 2;
  for (let i = 0; i < 34; i++) {
    const p = document.createElement("i"); p.className = "env-dust";
    const a = Math.random() * Math.PI * 2, r = 30 + Math.random() * 120, sz = 2 + Math.random() * 4;
    p.style.cssText = `left:${x0}px;top:${y0}px;width:${sz}px;height:${sz}px`;
    box.appendChild(p);
    p.animate([{ transform: "translate(-50%,-50%) scale(1)", opacity: 1 },
      { transform: `translate(calc(-50% + ${Math.cos(a) * r}px),calc(-50% + ${Math.sin(a) * r - 30 - Math.random() * 40}px)) scale(.3)`, opacity: 0 }],
      { duration: 900 + Math.random() * 700, easing: "cubic-bezier(.15,.7,.3,1)", fill: "forwards" });
  }
}

function openEnvelope(env) {
  if (env.classList.contains("open")) return;
  try { sessionStorage.setItem("toigo-env:" + location.pathname, "1"); } catch (_) {}
  const inv = env.closest(".inv");
  const mb = inv.querySelector("[data-act=music]");
  if (mb && mb.getAttribute("aria-pressed") !== "true") toggleMusic(mb);
  const done = () => { env.remove(); document.documentElement.classList.remove("env-lock"); };
  if (REDUCE) { env.classList.add("open"); setTimeout(done, 350); return; }
  sealDust(env);
  env.classList.add("open");
  let stopSilk = null;
  setTimeout(() => { stopSilk = silkLayer(env, env.querySelector(".env-box"), 2.3); if (stopSilk) env.classList.add("silk"); else env.classList.add("plain"); }, 850);
  setTimeout(() => {
    if (!stopSilk) return; // plain CSS fallback handles its own fade
    env.classList.add("covered"); inv.classList.add("reveal");
    setTimeout(() => env.classList.add("gone"), 150);
    setTimeout(() => { stopSilk(); done(); }, 1250);
  }, 850 + 2350);
  setTimeout(() => { if (!stopSilk) done(); }, 2850);
}

export function startLive() {
  if (started) return; started = true;
  initEnvelope();
  document.addEventListener("keydown", e => { const env = e.target.closest && e.target.closest(".inv .env"); if (env && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); openEnvelope(env); } });
  tick(); setInterval(tick, 1000);
  scanFx(); setInterval(scanFx, 400);
  document.addEventListener("click", e => {
    { const env = e.target.closest(".inv .env"); if (env) { openEnvelope(env); return; } }
    { const mb = e.target.closest(".inv [data-act=music]"); if (mb) { toggleMusic(mb); return; } }
    const z = e.target.closest(".inv [data-act=zoom]");
    if (z) {
      const lb = document.createElement("div"); lb.className = "lb"; lb.tabIndex = -1;
      lb.innerHTML = `<img src="${z.src}" alt="">`;
      const close = () => lb.remove();
      lb.addEventListener("click", close); lb.addEventListener("keydown", ev => { if (ev.key === "Escape") close(); });
      document.body.appendChild(lb); lb.focus(); return;
    }
    const lb = e.target.closest(".lb"); if (lb) lb.remove();
  });
  document.addEventListener("change", e => {
    if (e.target.matches('.inv input[name="att"]')) {
      const f = e.target.closest("form"); const yes = f.querySelector('input[name="att"]:checked').value === "1";
      f.querySelector(".cntw").hidden = !yes;
    }
  });
  document.addEventListener("submit", e => { const f = e.target.closest(".inv form.rsvp"); if (f) { e.preventDefault(); submitRsvp(f); } });
}
export { tick };
