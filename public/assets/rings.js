// Toigo — hero 3D scene: two interlocked gold wedding rings, one with a diamond,
// floating in warm light with drifting golden sparkles.
import * as THREE from "three";
import { RoomEnvironment } from "/assets/vendor/RoomEnvironment.js";

export function mountRings(host, opts = {}) {
  const shift = !!opts.shift;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
  } catch (e) { return false; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.35;
  renderer.domElement.className = "rings-canvas";
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.03).texture;

  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  camera.position.set(0, 0, 8.2);

  // Warm key light and a cool rim so the metal reads as metal.
  const key = new THREE.DirectionalLight(0xffe6b8, 3.2); key.position.set(3, 4, 5); scene.add(key);
  const rim = new THREE.DirectionalLight(0xb9d4ff, 1.2); rim.position.set(-4, -1, -3); scene.add(rim);
  scene.add(new THREE.AmbientLight(0xffffff, 0.15));

  // Comfort-fit band: a rounded profile revolved around the ring axis.
  function band(R, width, thick, color) {
    const pts = [], n = 48;
    for (let i = 0; i <= n; i++) {
      const a = (i / n) * Math.PI * 2;
      const c = Math.cos(a), s = Math.sin(a);
      const x = R + thick / 2 + (thick / 2) * Math.sign(c) * Math.pow(Math.abs(c), 0.7);
      const y = (width / 2) * Math.sign(s) * Math.pow(Math.abs(s), 0.55);
      pts.push(new THREE.Vector2(x, y));
    }
    const geo = new THREE.LatheGeometry(pts, 160);
    geo.computeVertexNormals();
    const mat = new THREE.MeshPhysicalMaterial({ color, metalness: 1, roughness: 0.14, clearcoat: 0.6, clearcoatRoughness: 0.08, envMapIntensity: 1.25 });
    return new THREE.Mesh(geo, mat);
  }

  // Brilliant-cut style stone: crown + pavilion with flat facets.
  function diamond() {
    const g = new THREE.Group();
    const mat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff, metalness: 0, roughness: 0, transmission: 1, thickness: 0.6, ior: 2.42,
      iridescence: 0.55, iridescenceIOR: 1.6, envMapIntensity: 3.2, flatShading: true, specularIntensity: 1
    });
    const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.21, 0.09, 16, 1), mat);
    crown.position.y = 0.045;
    const pav = new THREE.Mesh(new THREE.ConeGeometry(0.21, 0.24, 16, 1), mat);
    pav.rotation.x = Math.PI; pav.position.y = -0.12;
    g.add(crown, pav);
    return g;
  }

  const GOLD = 0xffd27a, GOLD2 = 0xf0b85a;
  const pair = new THREE.Group();

  // Ring 1 (engagement): lies in XY plane, centre left, diamond on top.
  const r1 = new THREE.Group();
  const R1 = 1, T1 = 0.15;
  r1.add(band(R1, 0.3, T1, GOLD));
  const setting = new THREE.Group();
  const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.08, 0.14, 24), new THREE.MeshPhysicalMaterial({ color: GOLD, metalness: 1, roughness: 0.18 }));
  cup.position.y = 0.02; setting.add(cup);
  const prongMat = new THREE.MeshPhysicalMaterial({ color: GOLD, metalness: 1, roughness: 0.2 });
  for (let k = 0; k < 4; k++) {
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.024, 0.3, 8), prongMat);
    const a = Math.PI / 4 + k * Math.PI / 2;
    p.position.set(Math.cos(a) * 0.17, 0.14, Math.sin(a) * 0.17);
    p.rotation.z = -Math.cos(a) * 0.18; p.rotation.x = Math.sin(a) * 0.18;
    setting.add(p);
  }
  const stone = diamond(); stone.position.y = 0.3; setting.add(stone);
  // place setting at local -Z of the band, pointing outward, then stand ring up
  setting.rotation.x = -Math.PI / 2;
  setting.position.set(0, 0, -(R1 + T1 - 0.02));
  r1.add(setting);
  r1.rotation.x = Math.PI / 2;
  r1.position.set(-0.5, 0, 0);
  pair.add(r1);

  // Ring 2 (wedding band): lies in XZ plane, centre right — interlocks with ring 1.
  const r2 = band(1.06, 0.36, 0.16, GOLD2);
  r2.position.set(0.52, 0, 0);
  pair.add(r2);

  pair.rotation.set(0.42, -0.5, -0.22);
  const holder = new THREE.Group(); holder.add(pair); scene.add(holder);
  if (shift) { holder.position.set(0.42, 0.55, 0); holder.scale.setScalar(0.78); }

  // Golden sparkles (soft round sprites drifting upward).
  function softDot() {
    const c = document.createElement("canvas"); c.width = c.height = 64;
    const x = c.getContext("2d"), g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, "rgba(255,236,190,1)"); g.addColorStop(0.25, "rgba(255,214,140,.55)"); g.addColorStop(1, "rgba(255,200,120,0)");
    x.fillStyle = g; x.fillRect(0, 0, 64, 64);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  }
  const N = 140, pos = new Float32Array(N * 3), speed = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 9; pos[i * 3 + 1] = (Math.random() - 0.5) * 9; pos[i * 3 + 2] = -1.5 - Math.random() * 4;
    speed[i] = 0.08 + Math.random() * 0.22;
  }
  const pg = new THREE.BufferGeometry(); pg.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const dots = new THREE.Points(pg, new THREE.PointsMaterial({ size: 0.16, map: softDot(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.85, sizeAttenuation: true }));
  scene.add(dots);

  // Diamond glint: a four-point star that flashes now and then.
  function starTex() {
    const c = document.createElement("canvas"); c.width = c.height = 128;
    const x = c.getContext("2d"); x.translate(64, 64);
    const g = x.createRadialGradient(0, 0, 0, 0, 0, 64); g.addColorStop(0, "rgba(255,255,255,1)"); g.addColorStop(0.15, "rgba(255,250,235,.6)"); g.addColorStop(1, "rgba(255,240,210,0)");
    x.fillStyle = g;
    for (let k = 0; k < 2; k++) { x.save(); x.rotate(k * Math.PI / 2); x.scale(1, 0.06); x.beginPath(); x.arc(0, 0, 64, 0, Math.PI * 2); x.fill(); x.restore(); }
    x.beginPath(); x.arc(0, 0, 10, 0, Math.PI * 2); x.fill();
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  }
  const glint = new THREE.Sprite(new THREE.SpriteMaterial({ map: starTex(), transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending, opacity: 0 }));
  glint.scale.set(0.9, 0.9, 1);
  scene.add(glint);
  const wp = new THREE.Vector3();

  // Sizing
  function resize() {
    const w = host.clientWidth, h = host.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.position.z = w / h < 0.8 ? 9.6 : 8.2; // keep rings inside on narrow screens
    camera.updateProjectionMatrix();
  }
  resize();
  new ResizeObserver(resize).observe(host);

  // Pointer parallax
  const target = { x: 0, y: 0 }, cur = { x: 0, y: 0 };
  host.addEventListener("pointermove", e => {
    const r = host.getBoundingClientRect();
    target.x = ((e.clientX - r.left) / r.width - 0.5) * 2;
    target.y = ((e.clientY - r.top) / r.height - 0.5) * 2;
  });
  host.addEventListener("pointerleave", () => { target.x = 0; target.y = 0; });

  let visible = true, running = false, last = performance.now(), t = 0;
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now; t += dt;
    cur.x += (target.x - cur.x) * 0.05; cur.y += (target.y - cur.y) * 0.05;
    pair.rotation.y = -0.5 + t * 0.32 + cur.x * 0.25;
    pair.rotation.x = 0.42 + Math.sin(t * 0.5) * 0.08 + cur.y * 0.15;
    pair.position.y = Math.sin(t * 0.9) * 0.08;
    for (let i = 0; i < N; i++) {
      pos[i * 3 + 1] += speed[i] * dt;
      pos[i * 3] += Math.sin(t * 0.6 + i) * 0.002;
      if (pos[i * 3 + 1] > 4.5) pos[i * 3 + 1] = -4.5;
    }
    pg.attributes.position.needsUpdate = true;
    stone.getWorldPosition(wp); glint.position.copy(wp);
    const phase = (t % 3.2) / 3.2; // flash every ~3 s
    const f = phase < 0.18 ? Math.sin((phase / 0.18) * Math.PI) : 0;
    glint.material.opacity = f; glint.material.rotation = t * 0.8; glint.scale.setScalar(0.5 + f * 0.7);
    renderer.render(scene, camera);
    if (running) requestAnimationFrame(frame);
  }
  function play() { if (running || reduce) return; running = true; last = performance.now(); requestAnimationFrame(frame); }
  function pause() { running = false; }

  if (reduce) { t = 1.2; frame(performance.now()); }
  else {
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; visible && !document.hidden ? play() : pause(); }).observe(host);
    document.addEventListener("visibilitychange", () => { document.hidden ? pause() : visible && play(); });
    play();
  }
  host.classList.add("has-3d");
  return true;
}
