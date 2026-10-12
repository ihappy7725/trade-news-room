/* 3D 무역 맵 (three.js)
   화면을 꽉 채우는 해안 마을 디오라마: 설산과 초록 언덕, 갈라지는 강과 나무다리, 바위 절벽, 알록달록한 집,
   단풍 덤불과 꽃, 반짝이는 바다와 해안 거품, 큰 등대. 그 위에 무역 장소 21곳이 있어요.
   장소를 누르면 app.js가 아래 설명 카드로 스크롤해요. WebGL이 안 되면 index.html의 그림 지도(SVG)가 보여요. */
import * as THREE from "./vendor/three.module.min.js";

const wrap = document.getElementById("mapWrap");
const pins = document.getElementById("pins");
const reduceMotion = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

function webglOK() {
  try { const c = document.createElement("canvas"); return !!(c.getContext("webgl2") || c.getContext("webgl")); }
  catch (e) { return false; }
}
if (wrap && webglOK()) {
  const fontWait = document.fonts && document.fonts.load
    ? Promise.race([document.fonts.load('40px "Noonnu Basic Gothic"'), new Promise((r) => setTimeout(r, 1500))])
    : Promise.resolve();
  fontWait.catch(() => {}).then(() => {
    try { init(); } catch (e) { console.warn("3D map unavailable, using illustrated map", e); wrap.classList.remove("is-3d"); }
  });
}

function init() {
  /* ================= stage ================= */
  const stage = document.createElement("div");
  stage.className = "map3d";
  stage.setAttribute("role", "img");
  stage.setAttribute("aria-label", "3D 무역 맵: 설산 아래 강이 흐르는 해안 마을. 물류·운송, 생산·원자재, 통관·정책, 금융·보험, 거래·시장 분야의 무역 장소 21곳이 있어요. 드래그해서 돌려 볼 수 있어요.");
  wrap.insertBefore(stage, wrap.firstChild);
  stage.appendChild(pins);
  const hint = document.createElement("p");
  hint.className = "map3d-hint"; hint.textContent = "드래그해서 돌려 보고, 건물을 눌러 보세요";
  stage.appendChild(hint);

  const small = Math.min(window.innerWidth, window.innerHeight) < 700;
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, small ? 1.5 : 1.75));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  stage.insertBefore(renderer.domElement, pins);
  wrap.classList.add("is-3d");

  const HAZE = 0xa8d4dc;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(HAZE);
  scene.fog = new THREE.Fog(HAZE, 120, 260);
  const camera = new THREE.PerspectiveCamera(32, 2, 1, 700);

  /* ================= light ================= */
  scene.add(new THREE.HemisphereLight(0xeef7ff, 0x6f8a58, 1.15));
  const sun = new THREE.DirectionalLight(0xfff0d6, 2.5);
  sun.position.set(55, 85, -35);
  sun.castShadow = true;
  sun.shadow.mapSize.set(small ? 1024 : 2048, small ? 1024 : 2048);
  Object.assign(sun.shadow.camera, { left: -80, right: 80, top: 66, bottom: -66, near: 20, far: 280 });
  sun.shadow.bias = -0.0005; sun.shadow.normalBias = 0.05;
  scene.add(sun);
  const fill = new THREE.DirectionalLight(0xffe6c8, 0.7); fill.position.set(-50, 35, 70); scene.add(fill);

  /* ================= helpers ================= */
  let seed = 23; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
  const smooth = (a, b, t) => { const x = Math.min(1, Math.max(0, (t - a) / (b - a))); return x * x * (3 - 2 * x); };
  const hash = (x, z) => { const s = Math.sin(x * 127.1 + z * 311.7) * 43758.5453; return s - Math.floor(s); };
  function vnoise(x, z) {
    const xi = Math.floor(x), zi = Math.floor(z), xf = x - xi, zf = z - zi, u = xf * xf * (3 - 2 * xf), v = zf * zf * (3 - 2 * zf);
    const a = hash(xi, zi), b = hash(xi + 1, zi), c = hash(xi, zi + 1), d = hash(xi + 1, zi + 1);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }
  const fbm = (x, z) => vnoise(x, z) * 0.55 + vnoise(x * 2.1, z * 2.1) * 0.28 + vnoise(x * 4.3, z * 4.3) * 0.17;

  function canvasTex(size, draw, repeat) {
    const cv = document.createElement("canvas"); cv.width = cv.height = size;
    draw(cv.getContext("2d"), size);
    const t = new THREE.CanvasTexture(cv);
    t.wrapS = t.wrapT = THREE.RepeatWrapping; if (repeat) t.repeat.set(repeat, repeat);
    t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
    return t;
  }
  const grainTex = canvasTex(256, (g, s) => {
    g.fillStyle = "#fff"; g.fillRect(0, 0, s, s);
    for (let i = 0; i < 7000; i++) { const v = 215 + Math.floor(rnd() * 40); g.fillStyle = `rgb(${v},${v},${v})`; g.fillRect(rnd() * s, rnd() * s, 1 + rnd() * 1.6, 1 + rnd() * 1.6); }
  });
  const woolTex = canvasTex(256, (g, s) => {
    g.fillStyle = "#f6f3ec"; g.fillRect(0, 0, s, s); g.lineWidth = 2;
    for (let i = 0; i < 1400; i++) { const v = 196 + Math.floor(rnd() * 50); g.strokeStyle = `rgb(${v},${v - 3},${v - 8})`; g.beginPath(); g.arc(rnd() * s, rnd() * s, 2 + rnd() * 3.5, rnd() * 6, rnd() * 6 + 3.5); g.stroke(); }
  });
  // 물결 노멀맵: 햇빛에 반짝이는 바다
  const waveNormal = (() => {
    const N = 256, cv = document.createElement("canvas"); cv.width = cv.height = N;
    const g = cv.getContext("2d"), img = g.createImageData(N, N), hgt = new Float32Array(N * N);
    const waves = []; for (let k = 0; k < 9; k++) waves.push([(Math.floor(rnd() * 7) - 3) || 1, Math.floor(rnd() * 9) + 2, rnd() * 6.28, 0.6 + rnd()]);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { let v = 0; for (const [fx, fy, ph, a] of waves) v += a * Math.sin(((x * fx + y * fy) / N) * Math.PI * 2 + ph); hgt[y * N + x] = v; }
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const dx = hgt[y * N + ((x + 1) % N)] - hgt[y * N + ((x - 1 + N) % N)], dy = hgt[((y + 1) % N) * N + x] - hgt[((y - 1 + N) % N) * N + x];
      const nx = -dx * 0.35, ny = -dy * 0.35, l = Math.hypot(nx, ny, 1), i = (y * N + x) * 4;
      img.data[i] = (nx / l * 0.5 + 0.5) * 255; img.data[i + 1] = (ny / l * 0.5 + 0.5) * 255; img.data[i + 2] = (1 / l * 0.5 + 0.5) * 255; img.data[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(60, 60); return t;
  })();

  const matCache = new Map();
  function M(color, o) {
    if (!o) { if (!matCache.has(color)) matCache.set(color, new THREE.MeshStandardMaterial({ color, roughness: 0.85 })); return matCache.get(color); }
    return new THREE.MeshStandardMaterial(Object.assign({ color, roughness: 0.85 }, o));
  }
  const mesh = (geo, mat, cast = true) => { const m = new THREE.Mesh(geo, mat); m.castShadow = cast; m.receiveShadow = true; return m; };
  const box = (w, h, d, color, o) => mesh(new THREE.BoxGeometry(w, h, d), M(color, o));
  const cyl = (rt, rb, h, color, seg = 12, o) => mesh(new THREE.CylinderGeometry(rt, rb, h, seg), M(color, o));
  const sph = (r, color, o) => mesh(new THREE.SphereGeometry(r, 16, 12), M(color, o));
  function prism(w, h, d, color, o) {
    const s = new THREE.Shape(); s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.lineTo(0, h); s.closePath();
    const g = new THREE.ExtrudeGeometry(s, { depth: d, bevelEnabled: false }); g.translate(0, 0, -d / 2);
    return mesh(g, M(color, o));
  }
  const woolMat = M(0xf7f4ee, { map: woolTex, bumpMap: woolTex, bumpScale: 0.6, roughness: 1 });
  const woolGeo = (() => {
    const g = new THREE.IcosahedronGeometry(1, 3), p = g.attributes.position, v = new THREE.Vector3();
    for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); v.multiplyScalar(1 + 0.07 * Math.sin(v.x * 9 + v.y * 4) * Math.cos(v.z * 8 - v.y * 5) + 0.04 * Math.sin(v.x * 17 + v.z * 13)); p.setXYZ(i, v.x, v.y, v.z); }
    g.computeVertexNormals(); return g;
  })();
  const wool = (r) => { const m = mesh(woolGeo, woolMat); m.scale.setScalar(r); return m; };

  /* ================= land shape ================= */
  const supEll = (x, z, cx, cz, rx, rz, p) => (1 - Math.pow(Math.pow(Math.abs(x - cx) / rx, p) + Math.pow(Math.abs(z - cz) / rz, p), 1 / p)) * Math.min(rx, rz);
  const RIVER = [[-2, -21], [1, -14], [-1, -6], [2, 2], [-2, 9], [-6, 15], [-10, 22], [-13, 30], [-15, 42]];
  const BRANCH = [[-1, -6], [4, -3], [10, 0]];
  function distSeg(px, pz, ax, az, bx, bz) {
    const dx = bx - ax, dz = bz - az, t = Math.max(0, Math.min(1, ((px - ax) * dx + (pz - az) * dz) / (dx * dx + dz * dz)));
    return [Math.hypot(ax + dx * t - px, az + dz * t - pz), t];
  }
  function riverD(x, z, line, w0, w1) {
    let best = 1e9, along = 0;
    for (let i = 0; i < line.length - 1; i++) { const [d, t] = distSeg(x, z, line[i][0], line[i][1], line[i + 1][0], line[i + 1][1]); if (d < best) { best = d; along = (i + t) / (line.length - 1); } }
    return best - (w0 + (w1 - w0) * along);
  }
  function landD(x, z) {
    const wob = 0.7 * Math.sin(x * 0.31 + z * 0.17) + 0.45 * Math.sin(z * 0.47 - x * 0.29) + 0.8 * (fbm(x * 0.12, z * 0.12) - 0.5);
    const back = Math.min(-15 + 2.5 * Math.sin(x * 0.09) - z, 70 - Math.abs(x), z + 58);
    let L = Math.max(back,
      supEll(x, z, -32, 6, 30, 27, 3),       // 본토
      supEll(x, z, 6, 20, 15, 9, 2.4),        // 섬 A
      supEll(x, z, 35, 2, 13.5, 10, 2.4),     // 섬 B (항구)
      supEll(x, z, 13, -6, 9, 6.5, 2.2),      // 섬 C (반도체)
      supEll(x, z, 33, 25, 9.5, 6.5, 2.3),    // 곶 D (등대)
      supEll(x, z, -5, 35, 2.6, 2.3, 2),
      supEll(x, z, 60, -3, 3, 2.6, 2)) + wob;
    if (z > -22) L = Math.min(L, riverD(x, z, RIVER, 1.15, 2.6) * 1.4);
    if (z > -10) L = Math.min(L, riverD(x, z, BRANCH, 1.2, 1.8) * 1.4);
    L = Math.min(L, 0.6 - supEll(x, z, 60, -18, 10, 6, 2));
    return L;
  }
  const PEAKS = [
    [-48, -38, 20, 15], [-27, -42, 24, 16], [-5, -39, 21, 14], [17, -42, 25, 16], [39, -38, 20, 14], [-62, -31, 15, 11], [58, -32, 14, 10],
    [-36, -26, 9, 9], [6, -27, 8, 8.5], [28, -27, 8, 8], [-55, -21, 6, 6.5]
  ];
  function H(x, z) {
    const L = landD(x, z);
    if (L <= 0) return -2.6 + Math.max(-2, L * 0.2);
    let h = 1.5 * smooth(0, 0.85, L) - 0.9 * (1 - smooth(0, 0.85, L));
    h += (0.5 + 1.5 * fbm(x * 0.07 + 3, z * 0.07)) * smooth(1, 7, L) * 0.85;
    let m = 0, sum = 0;
    for (const [px, pz, A, R] of PEAKS) {
      const dx = x - px, dz = (z - pz) * 1.2, r = Math.hypot(dx, dz);
      if (r >= R) continue;
      const th = Math.atan2(dz, dx), f = 1 - r / R;
      const rib = 1 - 0.13 * Math.abs(Math.sin(th * 4 + px * 0.3 + r * 0.12)) * smooth(0.05, 0.5, 1 - f);
      const hg = A * Math.pow(f, 1.3) * rib; sum += hg; if (hg > m) m = hg;
    }
    m = m + 0.28 * (sum - m);
    if (m > 0) m *= 0.94 + 0.12 * (fbm(x * 0.35, z * 0.35) - 0.5);
    return h + m * smooth(-8, -16, z) * smooth(0.5, 3, L);
  }
  const ground = (x, z) => Math.max(1.3, H(x, z));

  /* ================= terrain ================= */
  {
    const g = new THREE.PlaneGeometry(156, 112, small ? 220 : 300, small ? 158 : 216);
    g.rotateX(-Math.PI / 2); g.translate(0, 0, -6);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) p.setY(i, H(p.getX(i), p.getZ(i)));
    g.computeVertexNormals();
    const n = g.attributes.normal, cols = new Float32Array(p.count * 3), c = new THREE.Color();
    const C = (h) => new THREE.Color(h);
    const grassA = C(0x8cc152), grassB = C(0x69a843), grassC = C(0xa9cf5f), dirt = C(0xb39b6e),
      slate = C(0x47505c), slate2 = C(0x5f6874), sand = C(0xd6c79c), stone = C(0xa7a9a2), snow = C(0xf3f5f5), snowB = C(0xdfe5e8);
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i), ny = n.getY(i), nz = fbm(x * 0.25, z * 0.25), n2 = fbm(x * 0.9 + 7, z * 0.9);
      if (y < 0.6) c.copy(slate).lerp(slate2, nz);
      else if (ny < 0.66 && y < 5) c.copy(slate2).lerp(slate, n2);
      else if (y < 1.25) c.copy(sand).lerp(grassB, smooth(0.6, 1.25, y));
      else {
        const snowLine = 11 + nz * 5 - (1 - ny) * 3;
        if (y > snowLine) c.copy(snow).lerp(snowB, nz * 0.6 + (1 - ny) * 0.5);
        else if (y > snowLine - 3) c.copy(grassC).lerp(stone, smooth(snowLine - 3, snowLine, y)).lerp(snow, smooth(snowLine - 1.4, snowLine, y) * 0.6);
        else { c.copy(grassA).lerp(grassB, nz).lerp(grassC, smooth(0.62, 0.85, n2) * 0.7); if (n2 < 0.22) c.lerp(dirt, 0.35); }
      }
      cols[i * 3] = c.r; cols[i * 3 + 1] = c.g; cols[i * 3 + 2] = c.b;
    }
    g.setAttribute("color", new THREE.BufferAttribute(cols, 3));
    const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 30, uv.getY(i) * 22);
    scene.add(mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, map: grainTex, bumpMap: grainTex, bumpScale: 0.6, roughness: 1 }), true));
  }

  /* ================= sea ================= */
  const water = mesh(new THREE.PlaneGeometry(900, 700), new THREE.MeshStandardMaterial({ color: 0x2b80b4, roughness: 0.16, metalness: 0.25, normalMap: waveNormal, normalScale: new THREE.Vector2(0.45, 0.45) }), false);
  water.rotation.x = -Math.PI / 2; water.position.y = 0.02; scene.add(water);
  // 얕은 바다(청록) + 해안 거품
  const coast = (() => {
    const Wc = small ? 360 : 480, Hc = Math.round(Wc * 112 / 156), cv = document.createElement("canvas"); cv.width = Wc; cv.height = Hc;
    const g = cv.getContext("2d"), img = g.createImageData(Wc, Hc);
    for (let py = 0; py < Hc; py++) for (let px = 0; px < Wc; px++) {
      const x = -78 + (px + 0.5) / Wc * 156, z = -62 + (py + 0.5) / Hc * 112, L = landD(x, z), i = (py * Wc + px) * 4;
      if (L > 0.3) { img.data[i + 3] = 0; continue; }
      const shallow = smooth(-7, 0, L), foam = smooth(-1.3, -0.15, L) * (0.55 + 0.45 * vnoise(x * 1.7, z * 1.7));
      img.data[i] = 74 + 181 * foam; img.data[i + 1] = 196 + 59 * foam; img.data[i + 2] = 205 + 50 * foam;
      img.data[i + 3] = Math.min(255, (shallow * 0.62 + foam * 0.5) * 255);
    }
    g.putImageData(img, 0, 0);
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(156, 112), new THREE.MeshStandardMaterial({ map: t, transparent: true, depthWrite: false, roughness: 0.4 }));
    m.rotation.x = -Math.PI / 2; m.position.set(0, 0.08, -6); m.receiveShadow = true; scene.add(m); return m;
  })();

  /* ================= roads, bridges, railway ================= */
  const WOOD = 0x8a5a3a, WOOD_D = 0x5f3d29;
  function sampleLine(pts, step) {
    const curve = new THREE.CatmullRomCurve3(pts.map(([x, z]) => new THREE.Vector3(x, 0, z)), false, "catmullrom", 0.4);
    const n = Math.ceil(curve.getLength() / step), out = [];
    for (let i = 0; i <= n; i++) out.push(curve.getPointAt(i / n));
    return out;
  }
  const roadMats = { road: M(0x8e9396, { roughness: 0.95 }), path: M(0xe2d5b3, { map: grainTex, roughness: 1 }) };
  const ROADPTS = [];
  function pathWithBridges(pts, width, kind) {
    const s = sampleLine(pts, 0.5), wet = s.map((p) => H(p.x, p.z) < 1.0), ys = new Array(s.length);
    let i = 0;
    while (i < s.length) {
      if (!wet[i]) { ys[i] = H(s[i].x, s[i].z) + 0.1; i++; continue; }
      let j = i; while (j < s.length && wet[j]) j++;
      const a = Math.max(0, i - 1), b = Math.min(s.length - 1, j), n = b - a;
      const ya = H(s[a].x, s[a].z) + 0.12, yb = H(s[b].x, s[b].z) + 0.12;
      for (let k = a + 1; k < b; k++) { const t = (k - a) / n; ys[k] = ya + (yb - ya) * t + Math.sin(Math.PI * t) * Math.min(1.6, 0.5 + n * 0.06); }
      const by = []; for (let k = a; k <= b; k++) by.push(k === a ? ya : k === b ? yb : ys[k]);
      bridge(s.slice(a, b + 1), by, width + 0.6);
      i = j;
    }
    const pos = [], idx = []; let run = [];
    const flush = () => {
      if (run.length > 1) {
        const base = pos.length / 3;
        run.forEach((k, r) => {
          const p = s[k], q = s[Math.min(k + 1, s.length - 1)], o = s[Math.max(k - 1, 0)];
          const dx = q.x - o.x, dz = q.z - o.z, l = Math.hypot(dx, dz) || 1, nx = -dz / l * width / 2, nz = dx / l * width / 2;
          pos.push(p.x + nx, H(p.x + nx, p.z + nz) + 0.11, p.z + nz, p.x - nx, H(p.x - nx, p.z - nz) + 0.11, p.z - nz);
          if (r > 0) { const v = base + r * 2; idx.push(v - 2, v - 1, v, v - 1, v + 1, v); }
        });
      }
      run = [];
    };
    s.forEach((p, k) => { if (wet[k]) flush(); else run.push(k); }); flush();
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
    scene.add(mesh(g, roadMats[kind || "path"], false));
    s.forEach((p, k) => { if (k % 3 === 0) ROADPTS.push([p.x, p.z, width / 2 + 0.9]); });
    return s.map((p, k) => new THREE.Vector3(p.x, ys[k], p.z));
  }
  function bridge(points, ys, w) {
    const g = new THREE.Group(), plankMat = M(WOOD, { map: grainTex }), railMat = M(WOOD_D);
    for (let k = 0; k < points.length - 1; k++) {
      const p = points[k], q = points[k + 1], y0 = ys[k], y1 = ys[k + 1];
      const len = Math.hypot(q.x - p.x, q.z - p.z, y1 - y0);
      const plank = new THREE.Mesh(new THREE.BoxGeometry(len * 0.92, 0.16, w), plankMat); plank.castShadow = plank.receiveShadow = true;
      plank.position.set((p.x + q.x) / 2, (y0 + y1) / 2, (p.z + q.z) / 2);
      plank.rotation.order = "YZX"; plank.rotation.y = -Math.atan2(q.z - p.z, q.x - p.x); plank.rotation.z = Math.atan2(y1 - y0, Math.hypot(q.x - p.x, q.z - p.z));
      g.add(plank);
      if (k % 2 === 0) [-1, 1].forEach((sd) => {
        const dx = q.x - p.x, dz = q.z - p.z, l = Math.hypot(dx, dz) || 1;
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.75, 0.14), railMat); post.castShadow = true;
        post.position.set(p.x - dz / l * (w / 2) * sd, y0 + 0.42, p.z + dx / l * (w / 2) * sd); g.add(post);
      });
    }
    [-1, 1].forEach((sd) => {
      const pts = points.map((p, k) => {
        const q = points[Math.min(k + 1, points.length - 1)], o = points[Math.max(k - 1, 0)], dx = q.x - o.x, dz = q.z - o.z, l = Math.hypot(dx, dz) || 1;
        return new THREE.Vector3(p.x - dz / l * (w / 2) * sd, ys[k] + 0.78, p.z + dx / l * (w / 2) * sd);
      });
      const rail = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), pts.length * 2, 0.07, 5, false), railMat); rail.castShadow = true; g.add(rail);
    });
    scene.add(g);
  }
  // 창고 → 섬 A → 섬 B 항구 (트럭·자동차가 다니는 큰길)
  const truckPath = pathWithBridges([[-38, 25], [-32, 19], [-23, 14], [-14, 12], [-7, 16], [-2, 14], [5, 13.5], [12, 14], [18, 13], [23, 9], [29, 5], [37, 3], [42, 3]], 1.8, "road");
  pathWithBridges([[-37, -5], [-28, -6.5], [-20, -7.5], [-12, -8], [-5, -8], [3, -8.5], [8, -8.5], [13, -9.8]], 1.4, "road");
  pathWithBridges([[-20, -7.5], [-17, 4], [-14, 12]], 1.2);
  pathWithBridges([[-43, 9.5], [-36, 11], [-30, 13], [-25, 15.5]], 1.1);
  pathWithBridges([[23, 9], [26, 15], [30, 21], [32.5, 24]], 1.2);
  pathWithBridges([[3, 21], [3, 23.3]], 1.0);

  const railPts = sampleLine([[-50, -10], [-55, -3], [-56, 6], [-52, 14], [-45, 18], [-40, 18.4]], 0.6).map((p) => new THREE.Vector3(p.x, ground(p.x, p.z) + 0.12, p.z));
  const railCurve = new THREE.CatmullRomCurve3(railPts);
  {
    const n = Math.floor(railCurve.getLength() / 0.7);
    const sl = new THREE.InstancedMesh(new THREE.BoxGeometry(0.28, 0.1, 1.7), M(0x6b4b35), n), mtx = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0), t3 = new THREE.Vector3(), one = new THREE.Vector3(1, 1, 1);
    for (let i = 0; i < n; i++) { const p = railCurve.getPointAt(i / n), tg = railCurve.getTangentAt(i / n, t3); q.setFromAxisAngle(up, Math.atan2(-tg.z, tg.x)); sl.setMatrixAt(i, mtx.compose(p, q, one)); }
    sl.receiveShadow = true; scene.add(sl);
    [-0.55, 0.55].forEach((off) => {
      const pts = railPts.map((p, k) => { const a = railPts[Math.max(0, k - 1)], b = railPts[Math.min(railPts.length - 1, k + 1)], dx = b.x - a.x, dz = b.z - a.z, l = Math.hypot(dx, dz) || 1; return new THREE.Vector3(p.x - dz / l * off, p.y + 0.1, p.z + dx / l * off); });
      scene.add(mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), pts.length * 2, 0.06, 4, false), M(0x8a8f96, { metalness: 0.6, roughness: 0.4 }), false));
    });
    railPts.forEach((p, k) => { if (k % 3 === 0) ROADPTS.push([p.x, p.z, 1.8]); });
  }

  /* ================= fields ================= */
  const FIELD = [["#b9623a", "#d58b4b"], ["#4f8a36", "#6ea648"], ["#d6a23f", "#e8c06a"], ["#a7c95c", "#86b34a"], ["#c94f45", "#e07a55"], ["#8b5a3c", "#a8774f"]];
  const FIELDS = [[-51, 0.5, 5, 4.5, 0.2], [-41, 0, 6, 4, 0.25], [-51, 9, 5, 4.5, 0.1], [-39, 6.5, 5, 3.5, 0.15], [-33, 3, 4.5, 3.5, 0.2], [-46, -4.5, 5, 3, 0.05], [-30, 27, 5, 3.5, 0.1], [-17, 22, 4.5, 3.5, -0.1], [16, 26, 4, 3, -0.2]];
  FIELDS.forEach(([cx, cz, w, d, rot], k) => {
    const [c1, c2] = FIELD[k % FIELD.length];
    const tex = canvasTex(64, (g, s) => { g.fillStyle = c1; g.fillRect(0, 0, s, s); g.fillStyle = c2; for (let y = 0; y < s; y += 8) g.fillRect(0, y, s, 4); });
    tex.repeat.set(1, d / 1.4);
    const g = new THREE.PlaneGeometry(w, d, 8, 8); g.rotateX(-Math.PI / 2); g.rotateY(rot);
    const p = g.attributes.position; for (let i = 0; i < p.count; i++) p.setY(i, H(p.getX(i) + cx, p.getZ(i) + cz) + 0.1);
    g.translate(cx, 0, cz); g.computeVertexNormals();
    scene.add(mesh(g, M(0xffffff, { map: tex, bumpMap: tex, bumpScale: 1, roughness: 1 }), false));
  });

  /* ================= houses ================= */
  const WALLS = [0xb8323a, 0x7a2430, 0x5f8fb8, 0x8fb6c9, 0x6f9f6a, 0x9a7bb5, 0xece6d8, 0x3c5a7a, 0xd9a441, 0x5e7f5c];
  const ROOFS = [0x3f4548, 0x55595d, 0xa8342f, 0x2f3a44, 0x6a4c3b, 0x30473a];
  const trimMat = M(0xf7f5ef), glassMat = M(0xbfe0ee, { emissive: 0x6aa6c8, emissiveIntensity: 0.18, roughness: 0.3 });
  const HOUSES = [];
  function house(x, z, rot = 0, s = 1, opts = {}) {
    const g = new THREE.Group();
    const w = (opts.w || 2.8 + rnd() * 1.4) * s, d = (opts.d || 2.3 + rnd() * 0.9) * s, two = opts.two != null ? opts.two : rnd() > 0.55;
    const hh = (two ? 2.7 : 1.7) * s * (0.9 + rnd() * 0.2);
    const wall = box(w, hh, d, opts.wall || pick(WALLS)); wall.position.y = hh / 2; g.add(wall);
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => { const t = mesh(new THREE.BoxGeometry(0.14 * s, hh, 0.14 * s), trimMat); t.position.set(sx * w / 2, hh / 2, sz * d / 2); g.add(t); });
    const roof = prism(w + 0.5 * s, 1.35 * s, d + 0.55 * s, opts.roof || pick(ROOFS)); roof.position.y = hh; g.add(roof);
    const fascia = mesh(new THREE.BoxGeometry(w + 0.55 * s, 0.12, d + 0.6 * s), trimMat); fascia.position.y = hh + 0.03; g.add(fascia);
    (two ? [hh * 0.32, hh * 0.72] : [hh * 0.55]).forEach((wy) => [-0.28, 0.28].forEach((wx) => {
      const fr = mesh(new THREE.BoxGeometry(0.62 * s, 0.56 * s, 0.05), trimMat); fr.position.set(w * wx, wy, d / 2 + 0.02); g.add(fr);
      const gl = mesh(new THREE.BoxGeometry(0.46 * s, 0.4 * s, 0.06), glassMat); gl.position.set(w * wx, wy, d / 2 + 0.03); g.add(gl);
    }));
    const door = box(0.55 * s, 0.95 * s, 0.07, 0x3c2a20); door.position.set(0, 0.48 * s, d / 2 + 0.03); g.add(door);
    if (rnd() > 0.4) { const ch = box(0.42 * s, 1.1 * s, 0.42 * s, 0x8f8a82); ch.position.set(w * 0.28, hh + 0.85 * s, -d * 0.12); g.add(ch); }
    g.position.set(x, ground(x, z) - 0.05, z); g.rotation.y = rot; scene.add(g);
    HOUSES.push([x, z, Math.max(w, d) * 0.8]);
    return g;
  }
  [[-27, -1, 0.2], [-21, 1, -0.3], [-9, 1, 0.1, 0.9], [-30, -14, 0.1, 0.9], [-8, 5, -0.2, 0.9], [-24, 5, 0.3, 0.9], [-15, 6, 0.1, 0.9], [-33, -3, 0.2, 0.9],
    [-44, 13, -0.2, 0.9], [-29, 10, 0.1, 0.9], [-57, 13, 0.4, 0.85], [-19, 18, -0.1, 0.9], [-34, 27, 0.2, 0.9], [-20, 27, 0.4, 0.85],
    [17, 18, -0.4, 0.9], [-3, 20, 0.2, 0.85], [20, 21, 0.3, 0.85], [29, 9, -0.2, 0.9], [22, 6, 0.3, 0.85],
    [26, 24, 0.2, 0.9], [36, 21.5, -0.3, 0.85], [-44, -12, 0.2, 0.8], [-12, 15, 0.3, 0.8], [-36, 16, 0.2, 0.85]]
    .forEach(([x, z, r, s]) => house(x, z, r, s || 1));

  /* ================= labels & small figures ================= */
  function signTex(text, bg, fg) {
    const cv = document.createElement("canvas"); cv.width = 512; cv.height = 128;
    const g = cv.getContext("2d");
    g.fillStyle = bg; g.beginPath(); if (g.roundRect) g.roundRect(4, 4, 504, 120, 22); else g.rect(4, 4, 504, 120); g.fill();
    g.fillStyle = fg; g.textAlign = "center"; g.textBaseline = "middle";
    g.font = '58px "Noonnu Basic Gothic","Apple SD Gothic Neo","Malgun Gothic",sans-serif'; g.fillText(text, 256, 68);
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
  }
  const sign = (text, bg, fg, w) => new THREE.Mesh(new THREE.PlaneGeometry(w, w / 4), new THREE.MeshStandardMaterial({ map: signTex(text, bg, fg), roughness: 0.9 }));
  function bubbleSprite(text) {
    const cv = document.createElement("canvas"); cv.width = 256; cv.height = 150;
    const g = cv.getContext("2d");
    g.fillStyle = "#fff"; g.strokeStyle = "#3a3a33"; g.lineWidth = 6;
    g.beginPath(); if (g.roundRect) g.roundRect(8, 8, 240, 100, 34); else g.rect(8, 8, 240, 100); g.fill(); g.stroke();
    g.beginPath(); g.moveTo(108, 104); g.lineTo(128, 140); g.lineTo(148, 104); g.closePath(); g.fill(); g.stroke(); g.fillRect(104, 96, 48, 12);
    g.fillStyle = "#2b2f2a"; g.textAlign = "center"; g.textBaseline = "middle"; g.font = '52px "Noonnu Basic Gothic",sans-serif'; g.fillText(text, 128, 60);
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace;
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthWrite: false })); sp.scale.set(3, 1.75, 1); return sp;
  }
  function person(color) {
    const g = new THREE.Group();
    const body = mesh(new THREE.CapsuleGeometry(0.3, 0.5, 3, 8), M(color)); body.position.y = 0.68; g.add(body);
    const head = sph(0.28, 0xffdcbf); head.position.y = 1.4; g.add(head);
    const hair = mesh(new THREE.SphereGeometry(0.3, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2.2), M(0x3a3330)); hair.position.y = 1.45; g.add(hair);
    g.scale.setScalar(1.1); return g;
  }
  const flags = [];
  function flagPole(h, color, s = 1) {
    const g = new THREE.Group(); const pole = cyl(0.06, 0.06, h, 0xd9d9d4, 6); pole.position.y = h / 2; g.add(pole);
    const fg = new THREE.PlaneGeometry(1.4 * s, 0.85 * s, 8, 2); fg.translate(0.7 * s, 0, 0);
    const f = mesh(fg, M(color, { side: THREE.DoubleSide })); f.position.y = h - 0.5 * s; g.add(f);
    flags.push({ f, base: Float32Array.from(fg.attributes.position.array), w: 1.4 * s }); return g;
  }

  /* ================= trade spots (21) ================= */
  const spots = {}, AVOID = [];
  const avoid = (x, z, r) => AVOID.push([x, z, r]);
  function spot(id, group, anchor, ringAt) {
    group.traverse((o) => { if (o.isMesh || o.isSprite) o.userData.spot = id; });
    spots[id] = { group, anchor, ringAt: ringAt || anchor, scale: 1 };
    if (!group.parent) scene.add(group);
    return group;
  }
  const at = (X, Z, rot = 0) => { const g = new THREE.Group(); g.position.set(X, ground(X, Z), Z); g.rotation.y = rot; return g; };
  const anchorAt = (X, Z, h) => () => new THREE.Vector3(X, ground(X, Z) + h, Z);
  const PAL = [0xb5533c, 0x3f8a8c, 0xd8a23a, 0x3b5a7a, 0x5f8f4a, 0xc9714a, 0xd9534a, 0x8c6bc8];

  // ---------- 생산·원자재 ----------
  const smoke = [];
  { // 배터리 소재 공장
    const X = -37, Z = -9.5, g = at(X, Z, 0.15); avoid(X, Z, 7);
    const body = box(8, 3.2, 5, 0xe9e1d0); body.position.y = 1.6; g.add(body);
    for (let i = 0; i < 4; i++) { const r = prism(2, 1.4, 5.2, 0x6f97b8); r.position.set(-3 + i * 2, 3.2, 0); g.add(r); }
    for (let i = 0; i < 3; i++) { const w = mesh(new THREE.BoxGeometry(1.3, 0.9, 0.08), glassMat); w.position.set(-2.4 + i * 2.2, 1.9, 2.52); g.add(w); }
    const sg = sign("배터리 소재", "#4f8a3a", "#ffffff", 3.4); sg.position.set(-0.4, 0.75, 2.55); g.add(sg);
    [[2.6, 6.2], [3.8, 5.2]].forEach(([cx, h]) => {
      const ch = cyl(0.36, 0.5, h, 0xc85a45); ch.position.set(cx, h / 2 + 0.6, -1.4); g.add(ch);
      const band = cyl(0.42, 0.42, 0.45, 0xf2f2ee); band.position.set(cx, h * 0.72, -1.4); g.add(band);
      for (let k = 0; k < 3; k++) { const s = wool(0.55); s.userData.base = new THREE.Vector3(cx, h + 1, -1.4); s.userData.phase = k / 3 + cx * 0.13; g.add(s); smoke.push(s); }
    });
    const w1 = person(0xf2b134); w1.position.set(5, 0, 2.2); g.add(w1);
    spot("factory", g, anchorAt(X, Z, 9.5));
  }
  { // 반도체 공장
    const X = 13, Z = -5.5, g = at(X, Z, -0.05); avoid(X, Z, 7.5);
    const main = box(10, 2.6, 6, 0xf4f6f8); main.position.y = 1.3; g.add(main);
    const band = box(10.05, 0.7, 6.05, 0x3a78c2, { emissive: 0x1d4f8a, emissiveIntensity: 0.25, roughness: 0.3 }); band.position.y = 1.9; g.add(band);
    const top = box(6, 1.4, 4, 0xe9edf1); top.position.set(-1.5, 3.3, -0.4); g.add(top);
    for (let i = 0; i < 3; i++) { const hv = box(1, 0.6, 1, 0xbfc6cc); hv.position.set(-3.6 + i * 1.5, 4.3, -0.6); g.add(hv); }
    [[4, -1.6], [4.9, -0.1]].forEach(([tx, tz]) => { const tk = cyl(0.6, 0.6, 3.2, 0xdfe7ee, 16); tk.position.set(tx, 1.6, tz); g.add(tk); const cp = sph(0.6, 0xdfe7ee); cp.position.set(tx, 3.2, tz); g.add(cp); });
    const sg = sign("SEMICON 반도체", "#1f4f8f", "#ffffff", 4.2); sg.position.set(-1.5, 1.0, 3.04); g.add(sg);
    const w1 = person(0xffffff); w1.position.set(3.5, 0, 3.5); g.add(w1);
    spot("fab", g, anchorAt(X, Z, 7.5));
  }
  let dumpTruck;
  { // 핵심광물 광산
    const X = -52, Z = -14, g = at(X, Z, 0.3); avoid(X, Z, 7);
    const mound = mesh(new THREE.DodecahedronGeometry(3.6, 1), M(0x7a6f62, { flatShading: true, roughness: 1 })); mound.position.set(0, 0.6, -3.6); mound.scale.set(1.3, 0.85, 0.9); g.add(mound);
    const pg = new THREE.CylinderGeometry(1.5, 1.5, 1.4, 16, 1, false, 0, Math.PI); pg.rotateX(Math.PI / 2); pg.rotateZ(Math.PI / 2);
    const portal = mesh(pg, M(0x1f1c19)); portal.position.set(0, 0.05, -1); g.add(portal);
    const frame = mesh(new THREE.TorusGeometry(1.62, 0.2, 6, 18, Math.PI), M(0x7a5233)); frame.position.set(0, 0.05, -0.3); g.add(frame);
    [[2.6, 1.2, 0x3d3d42], [4.0, 0.9, 0xd9823a], [1.3, 0.8, 0x3f9a9a]].forEach(([dx, r, c], i) => { const heap = mesh(new THREE.ConeGeometry(r * 1.4, r * 1.6, 9), M(c, { roughness: 1 })); heap.position.set(dx, r * 0.8, 1.6 + i * 0.7); g.add(heap); });
    const conv = box(0.6, 0.2, 5, 0x4b4f55); conv.position.set(-2.4, 1.4, 1.2); conv.rotation.x = -0.3; g.add(conv);
    [-0.6, 2.6].forEach((lz) => { const l = box(0.15, 1.5, 0.15, 0x6b6f75); l.position.set(-2.4, 0.75, lz); g.add(l); });
    dumpTruck = new THREE.Group();
    const bed = box(1.8, 0.8, 1.3, 0xe0a43a); bed.position.set(-0.3, 0.9, 0); bed.rotation.z = 0.12; dumpTruck.add(bed);
    const cab = box(0.8, 0.9, 1.2, 0xe0a43a); cab.position.set(0.95, 0.85, 0); dumpTruck.add(cab);
    [[-0.8, 0.6], [-0.8, -0.6], [0.9, 0.6], [0.9, -0.6]].forEach(([dx, dz]) => { const wh = cyl(0.3, 0.3, 0.2, 0x2b2f2a, 10); wh.rotation.x = Math.PI / 2; wh.position.set(dx, 0.3, dz); dumpTruck.add(wh); });
    dumpTruck.position.set(3.4, 0, -1); g.add(dumpTruck);
    const sg = sign("핵심광물", "#5b4a3a", "#ffffff", 2.6); sg.position.set(0, 2.2, -0.15); g.add(sg);
    spot("mine", g, anchorAt(X, Z, 7));
  }
  { // 농장
    const X = -46, Z = 4, g = at(X, Z, 0.2); avoid(X, Z, 5.5);
    const barn = box(4, 2.6, 3, 0xb23a32); barn.position.y = 1.3; g.add(barn);
    const r1 = prism(4.4, 1.8, 3.3, 0x4a4f53); r1.position.y = 2.6; g.add(r1);
    const doorB = box(1.4, 1.8, 0.06, 0xf7f5ef); doorB.position.set(0, 0.9, 1.53); g.add(doorB);
    const xx = box(0.12, 1.9, 0.07, 0xb23a32); xx.position.set(0, 0.9, 1.57); xx.rotation.z = 0.66; g.add(xx);
    const silo = cyl(0.9, 0.9, 4.6, 0xd7dbd7, 16); silo.position.set(3.2, 2.3, -0.4); g.add(silo);
    const dome = mesh(new THREE.SphereGeometry(0.92, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), M(0x9aa3a8)); dome.position.set(3.2, 4.6, -0.4); g.add(dome);
    for (let i = 0; i < 4; i++) { const hb = cyl(0.42, 0.42, 0.6, 0xe1c26a, 12); hb.rotation.z = Math.PI / 2; hb.position.set(-2.6 + (i % 2) * 0.9, 0.42 + Math.floor(i / 2) * 0.8, 2.4); g.add(hb); }
    const tr = new THREE.Group(); const tb = box(1.3, 0.7, 0.8, 0x3f8a3a); tb.position.y = 0.75; tr.add(tb); const tc = box(0.6, 0.6, 0.7, 0x3f8a3a); tc.position.set(-0.3, 1.35, 0); tr.add(tc);
    const bw = cyl(0.45, 0.45, 0.25, 0x2b2f2a, 12); bw.rotation.x = Math.PI / 2; bw.position.set(-0.4, 0.45, 0.5); tr.add(bw); const bw2 = bw.clone(); bw2.position.z = -0.5; tr.add(bw2);
    tr.position.set(1.6, 0, 2.8); tr.rotation.y = 0.6; g.add(tr);
    spot("farm", g, anchorAt(X, Z, 7.2));
  }
  { // LNG 터미널
    const X = -55, Z = 22, g = at(X, Z, 0.1); avoid(X, Z, 6.5);
    [[-1.6, -1.4], [1.8, -1.2], [0, 2]].forEach(([tx, tz]) => {
      const tk = sph(1.55, 0xf4f4f0, { roughness: 0.5 }); tk.position.set(tx, 2.2, tz); g.add(tk);
      for (let k = 0; k < 4; k++) { const l = cyl(0.08, 0.08, 1.2, 0x9aa0a6, 6); l.position.set(tx + Math.cos(k * 1.57) * 1.1, 0.6, tz + Math.sin(k * 1.57) * 1.1); g.add(l); }
    });
    const pipe = box(6, 0.2, 0.2, 0xb5bcc2); pipe.position.set(0.5, 1.1, 0.2); g.add(pipe);
    const flare = cyl(0.12, 0.16, 4.5, 0xc85a45, 8); flare.position.set(-3.2, 2.25, 1.6); g.add(flare);
    const sg = sign("LNG", "#2a6f9a", "#ffffff", 2); sg.position.set(0, 4.1, 2); sg.rotation.x = -0.3; g.add(sg);
    spot("lng", g, anchorAt(X, Z, 7));
  }
  { // 수산물 시장
    const X = 3, Z = 25.5, g = at(X, Z, -0.1); avoid(X, Z, 4.5);
    const hall = box(5.2, 2, 3.2, 0xf2efe6); hall.position.y = 1; g.add(hall);
    const roof = prism(5.8, 1.3, 3.8, 0x2f6fa8); roof.position.y = 2; g.add(roof);
    const stripes = canvasTex(64, (c, s) => { for (let i = 0; i < 8; i++) { c.fillStyle = i % 2 ? "#ffffff" : "#d9534a"; c.fillRect(i * 8, 0, 8, s); } });
    const awn = mesh(new THREE.BoxGeometry(5.2, 0.12, 1.2), M(0xffffff, { map: stripes })); awn.position.set(0, 1.6, 2.1); awn.rotation.x = 0.25; g.add(awn);
    for (let i = 0; i < 4; i++) { const cr = box(0.8, 0.4, 0.6, 0x3f86c8); cr.position.set(-1.8 + i * 1.2, 0.2, 2.6); g.add(cr); const fsh = box(0.6, 0.08, 0.4, 0xcfd8dc, { metalness: 0.5, roughness: 0.3 }); fsh.position.set(-1.8 + i * 1.2, 0.44, 2.6); g.add(fsh); }
    const sg = sign("수산물 시장", "#2f6fa8", "#ffffff", 2.8); sg.position.set(0, 1.35, 1.62); g.add(sg);
    const w1 = person(0xe9874a); w1.position.set(1.9, 0, 3.2); g.add(w1);
    spot("fish", g, anchorAt(X, Z, 5.8));
  }
  // ---------- 통관·정책 ----------
  { // 세관
    const X = 26, Z = 0, g = at(X, Z, 0.15); avoid(X, Z, 5);
    const b = box(5.4, 2.9, 3.8, 0xe6eef3); b.position.y = 1.45; g.add(b);
    const roof = prism(6, 1.5, 4.3, 0x3f6f9a); roof.position.y = 2.9; g.add(roof);
    const sg = sign("세관 CUSTOMS", "#2f5d8a", "#ffffff", 3.6); sg.position.set(0, 2.2, 1.93); g.add(sg);
    const door = box(1.2, 1.6, 0.08, 0x5f6f7a); door.position.set(0, 0.8, 1.93); g.add(door);
    const fp = flagPole(5.2, 0xd9534a); fp.position.set(3.3, 0, 1.6); g.add(fp);
    const crate = box(1.2, 0.8, 0.9, 0xb98348); crate.position.set(-3.6, 0.4, 2.4); g.add(crate);
    const insp = person(0x2f5d8a); insp.position.set(-2.4, 0, 2.8); insp.rotation.y = -1.3; g.add(insp);
    spot("customs", g, anchorAt(X, Z, 6.8));
  }
  { // 통상 정부청사
    const X = -23, Z = -12.5, g = at(X, Z, 0.05); avoid(X, Z, 6);
    const base = box(8.4, 0.5, 5.6, 0xd8d2c4); base.position.y = 0.25; g.add(base);
    const b = box(7.6, 3, 4.2, 0xf5f2ea); b.position.set(0, 2, -0.3); g.add(b);
    for (let i = 0; i < 6; i++) { const c = cyl(0.2, 0.22, 3, 0xffffff, 12); c.position.set(-3.1 + i * 1.24, 2, 2.1); g.add(c); }
    const ent = box(8, 0.35, 4.9, 0xe7e1d2); ent.position.set(0, 3.67, 0); g.add(ent);
    const drum = cyl(1.4, 1.4, 0.9, 0xf5f2ea, 24); drum.position.set(0, 4.3, -0.3); g.add(drum);
    const dome = mesh(new THREE.SphereGeometry(1.45, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), M(0x4f8f8a, { roughness: 0.5, metalness: 0.2 })); dome.position.set(0, 4.75, -0.3); g.add(dome);
    [[-3, 0x2f5d8a], [0, 0xd9534a], [3, 0x3f8a3a]].forEach(([fx, c]) => { const fp = flagPole(4.4, c, 0.8); fp.position.set(fx, 0.5, 3.2); g.add(fp); });
    const sg = sign("통상 정책", "#2b3a4a", "#ffffff", 2.8); sg.position.set(0, 3.67, 2.47); g.add(sg);
    spot("ministry", g, anchorAt(X, Z, 8.5));
  }
  // ---------- 금융·보험 ----------
  { // 은행
    const X = -14, Z = -3.5, g = at(X, Z, 0.1); avoid(X, Z, 4.5);
    const base = box(6, 0.4, 4.6, 0xd9d1bd); base.position.y = 0.2; g.add(base);
    const b = box(5.2, 2.8, 3.4, 0xf2ecdc); b.position.set(0, 1.8, -0.3); g.add(b);
    for (let i = 0; i < 4; i++) { const c = cyl(0.22, 0.24, 2.8, 0xffffff, 12); c.position.set(-1.95 + i * 1.3, 1.8, 1.7); g.add(c); }
    const top = box(5.8, 0.35, 4.2, 0xe4dbc4); top.position.set(0, 3.37, 0); g.add(top);
    const ped = prism(5.8, 1.3, 4.2, 0xf2ecdc); ped.position.y = 3.55; g.add(ped);
    const sg = sign("BANK  ₩ $", "#e2b24a", "#2b2f2a", 2.6); sg.position.set(0, 3.95, 2.12); g.add(sg);
    spot("bank", g, anchorAt(X, Z, 7.5));
  }
  { // 적하보험
    const X = -6.5, Z = -12.5, g = at(X, Z, -0.1); avoid(X, Z, 4);
    const b = box(3.6, 5.4, 3.2, 0x5fa6a8, { roughness: 0.35, metalness: 0.15 }); b.position.y = 2.7; g.add(b);
    for (let i = 1; i < 4; i++) { const fl = box(3.68, 0.12, 3.28, 0xf2f2ee); fl.position.y = i * 1.35; g.add(fl); }
    const umb = mesh(new THREE.ConeGeometry(1.3, 0.7, 12), M(0xe9874a)); umb.position.set(0, 6.2, 0); g.add(umb);
    const stick = cyl(0.05, 0.05, 0.9, 0x3a3a33, 6); stick.position.set(0, 5.7, 0); g.add(stick);
    const sg = sign("적하보험", "#e9874a", "#ffffff", 2.4); sg.position.set(0, 0.8, 1.62); g.add(sg);
    spot("insurance", g, anchorAt(X, Z, 8.6));
  }
  // ---------- 거래·시장 ----------
  { // 무역사무소
    const X = 3, Z = 18, g = at(X, Z, -0.1); avoid(X, Z, 4.8);
    const b = box(5.6, 3, 4, 0xf3e3c3); b.position.y = 1.5; g.add(b);
    const roof = prism(6.3, 1.8, 4.6, 0xc9714a); roof.position.y = 3; g.add(roof);
    const win = box(3.4, 1.3, 0.08, 0xfff1c2, { emissive: 0xffd27a, emissiveIntensity: 0.45 }); win.position.set(-0.4, 1.8, 2.02); g.add(win);
    const sg = sign("TRADE OFFICE", "#3d7a35", "#ffffff", 3.6); sg.position.set(0, 3.05, 2.32); sg.rotation.x = -0.15; g.add(sg);
    const desk = box(1.8, 0.1, 0.9, 0xa97448); desk.position.set(1.2, 0.85, 3.1); g.add(desk);
    for (let i = 0; i < 3; i++) { const p = box(0.45, 0.04 + i * 0.07, 0.6, i === 2 ? 0xfff2b3 : 0xffffff); p.position.set(1.6 - i * 0.06, 0.95 + i * 0.04, 3.1); p.rotation.y = i * 0.25; g.add(p); }
    const clerk = person(0x3f86c8); clerk.position.set(1.2, 0, 4.1); clerk.rotation.y = Math.PI; g.add(clerk);
    spot("office", g, anchorAt(X, Z, 7));
  }
  const bubbles = [];
  { // 바이어 · 셀러
    const X = 12, Z = 21.5, g = at(X, Z); avoid(X, Z, 3.6);
    const deck = cyl(2.4, 2.5, 0.2, 0xd8c69c, 12); deck.position.y = 0.1; g.add(deck);
    const table = cyl(1, 1, 0.1, 0xffffff, 18); table.position.y = 0.9; g.add(table);
    const pole = cyl(0.06, 0.06, 2.9, 0x6e6758, 6); pole.position.y = 1.5; g.add(pole);
    const umb = mesh(new THREE.ConeGeometry(2.2, 0.85, 10), M(0xe9874a)); umb.position.y = 3.1; g.add(umb);
    const b1p = person(0x4f9a45); b1p.position.set(-1.5, 0, 0); b1p.rotation.y = Math.PI / 2; g.add(b1p);
    const b2p = person(0x8c6bc8); b2p.position.set(1.5, 0, 0); b2p.rotation.y = -Math.PI / 2; g.add(b2p);
    const s1 = bubbleSprite("$9.8?"); s1.position.set(-2.1, 3.9, 0.3); g.add(s1);
    const s2 = bubbleSprite("OK!"); s2.position.set(2.1, 3.9, 0.3); g.add(s2);
    bubbles.push(s1, s2);
    spot("deal", g, anchorAt(X, Z, 6.2));
  }
  { // 무역박람회
    const X = -26, Z = 20, g = at(X, Z, 0.1); avoid(X, Z, 6);
    const hall = box(8, 2.2, 4.6, 0xffffff); hall.position.y = 1.1; g.add(hall);
    [-2.7, 0, 2.7].forEach((tx) => { const pk = mesh(new THREE.ConeGeometry(1.9, 2, 4), M(0xffffff)); pk.rotation.y = Math.PI / 4; pk.position.set(tx, 3.2, 0); g.add(pk); const tip = flagPole(1.2, pick([0xd9534a, 0x3f86c8, 0xe0a43a]), 0.5); tip.position.set(tx, 4.1, 0); g.add(tip); });
    const sg = sign("TRADE FAIR 박람회", "#d9534a", "#ffffff", 4.6); sg.position.set(0, 1.5, 2.32); g.add(sg);
    for (let i = 0; i < 12; i++) { const tr = mesh(new THREE.ConeGeometry(0.22, 0.45, 3), M(PAL[i % PAL.length])); tr.rotation.x = Math.PI; tr.position.set(-4 + i * 0.73, 2.35 - Math.sin(i / 11 * Math.PI) * 0.25, 2.6); g.add(tr); }
    for (let i = 0; i < 3; i++) { const bt = box(1.2, 0.9, 0.8, PAL[i + 2]); bt.position.set(-2.5 + i * 2.5, 0.45, 3.6); g.add(bt); }
    [0x3f86c8, 0xd9534a, 0x4f9a45].forEach((c, i) => { const p = person(c); p.position.set(-1.8 + i * 1.6, 0, 4.6); g.add(p); });
    spot("expo", g, anchorAt(X, Z, 7));
  }
  const parcels = [];
  { // 전자상거래 물류센터
    const X = 34, Z = -4.5, g = at(X, Z, 0.05); avoid(X, Z, 5.5);
    const b = box(8, 2.8, 4.6, 0xe3e6e8); b.position.y = 1.4; g.add(b);
    const stripe = box(8.05, 0.5, 4.65, 0xe9823c); stripe.position.y = 2.4; g.add(stripe);
    for (let i = 0; i < 3; i++) { const dk = box(1.3, 1.5, 0.06, 0x7d868c); dk.position.set(-2.6 + i * 2.6, 0.75, 2.33); g.add(dk); }
    const sg = sign("e-커머스 센터", "#e9823c", "#ffffff", 3.4); sg.position.set(0, 3.25, 2.33); g.add(sg);
    const conv = box(5, 0.2, 0.7, 0x4b4f55); conv.position.set(0, 0.7, 3.4); g.add(conv);
    for (let i = 0; i < 5; i++) { const pc = box(0.45, 0.35, 0.45, 0xc99a5e); pc.position.set(-2.2 + i, 0.98, 3.4); g.add(pc); parcels.push(pc); }
    [[-2.8, 5.2], [0.4, 5.4]].forEach(([vx, vz]) => { const vv = new THREE.Group(); const vb = box(1.9, 1.1, 1, 0xf7f7f4); vb.position.y = 0.75; vv.add(vb); const vs = box(1.92, 0.25, 1.02, 0xe9823c); vs.position.y = 0.75; vv.add(vs); vv.position.set(vx, 0, vz); g.add(vv); });
    spot("ecommerce", g, anchorAt(X, Z, 6.5));
  }
  // ---------- 물류·운송 ----------
  const vehicles = [];
  function mkVehicle(body, cabC) {
    const vv = new THREE.Group();
    const tr = box(2.6, 1.15, 1.2, body); tr.position.set(-0.45, 0.95, 0); vv.add(tr);
    const cab = box(1, 1, 1.2, cabC); cab.position.set(1.4, 0.88, 0); vv.add(cab);
    [[-1.2, 0.6], [-1.2, -0.6], [1.4, 0.6], [1.4, -0.6]].forEach(([dx, dz]) => { const wh = cyl(0.28, 0.28, 0.2, 0x2b2f2a, 12); wh.rotation.x = Math.PI / 2; wh.position.set(dx, 0.3, dz); vv.add(wh); });
    vv.scale.setScalar(0.8); scene.add(vv); vehicles.push(vv); return vv;
  }
  { // 창고
    const X = -41, Z = 21.5, g = at(X, Z, 0.2); avoid(X, Z, 5.2);
    const b = box(7, 2.2, 4.6, 0xc4d3de); b.position.y = 1.1; g.add(b);
    const rg = new THREE.CylinderGeometry(2.3, 2.3, 7, 16, 1, false, 0, Math.PI); rg.rotateZ(Math.PI / 2); rg.rotateX(Math.PI / 2);
    const roof = mesh(rg, M(0x93abbd)); roof.position.y = 2.2; roof.scale.set(1, 0.62, 1); g.add(roof);
    const door = box(3, 1.8, 0.08, 0x7e95a6); door.position.set(0, 0.9, 2.32); g.add(door);
    [[4.2, 0.4, 1.6, 0xb98348], [4.2, 1.15, 1.6, 0xd8a868], [5.1, 0.4, 0.7, 0xb98348]].forEach(([dx, dy, dz, c]) => { const k = box(0.8, 0.75, 0.8, c); k.position.set(dx, dy, dz); g.add(k); });
    spot("warehouse", g, anchorAt(X, Z, 6.5));
  }
  mkVehicle(0x3f78b0, 0xd9534a); mkVehicle(0xe9e4d8, 0xe0a43a); mkVehicle(0x5f8f4a, 0xf2f2ee);
  const hanging = [];
  { // 항만: 부두, 컨테이너, 크레인
    const g = new THREE.Group();
    const pier = box(10, 2.8, 17, 0xbdb7a8, { map: grainTex }); pier.position.set(46.5, -0.1, 2.5); g.add(pier);
    const pierTop = box(10, 0.12, 17, 0xd3cdbf); pierTop.position.set(46.5, 1.36, 2.5); g.add(pierTop);
    for (let i = 0; i < 6; i++) { const bo = cyl(0.16, 0.2, 0.4, 0xe0a43a, 8); bo.position.set(51.3, 1.6, -5 + i * 3); g.add(bo); }
    const inst = new THREE.InstancedMesh(new THREE.BoxGeometry(2.2, 0.95, 0.95), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.7 }), 60);
    inst.castShadow = inst.receiveShadow = true;
    let k = 0; const mtx = new THREE.Matrix4(), col = new THREE.Color();
    for (let r = 0; r < 3; r++) for (let c = 0; c < 6; c++) {
      const hgt = 1 + Math.floor(rnd() * 3);
      for (let l = 0; l < hgt && k < 60; l++) { mtx.makeTranslation(42.8 + r * 2.4, 1.9 + l * 0.97, -5.3 + c * 1.05); inst.setMatrixAt(k, mtx); inst.setColorAt(k, col.setHex(pick(PAL))); k++; }
    }
    inst.count = k; g.add(inst);
    [-3.6, 0.6].forEach((cz, i) => {
      const yel = 0xe0a43a;
      [[48, cz - 1.2], [48, cz + 1.2], [51, cz - 1.2], [51, cz + 1.2]].forEach(([lx, lz]) => { const l = box(0.32, 7.5, 0.32, yel); l.position.set(lx, 5.1, lz); g.add(l); });
      [cz - 1.2, cz + 1.2].forEach((bz) => { const beam2 = box(11, 0.55, 0.55, yel); beam2.position.set(52.5, 8.9, bz); g.add(beam2); });
      const cabin = box(1.2, 1, 1.8, 0xf4f1ea); cabin.position.set(50, 8.1, cz); g.add(cabin);
      const cable = cyl(0.03, 0.03, 3, 0x3a3a33, 4); cable.position.set(55.5 - i * 1.5, 7.2, cz); g.add(cable);
      const hc = box(2.2, 0.95, 0.95, PAL[i + 1]); hc.position.set(55.5 - i * 1.5, 5.4, cz); g.add(hc);
      hanging.push({ c: hc, cable, base: 5.4, phase: i * 2 });
    });
    const w1 = person(0xe9874a); w1.position.set(44, 1.4, 1.5); g.add(w1);
    spot("crane", g, () => new THREE.Vector3(49.5, 13, -1.5), () => new THREE.Vector3(48, 1.5, -1.5));
  }
  let roroShip;
  { // 자동차 운반선 + 수출 차량 주차장
    const g = new THREE.Group();
    const carsInst = new THREE.InstancedMesh(new THREE.BoxGeometry(1.1, 0.5, 0.55), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.35, metalness: 0.2 }), 40);
    carsInst.castShadow = true; let k = 0; const mtx = new THREE.Matrix4(), col = new THREE.Color();
    for (let r = 0; r < 5; r++) for (let c = 0; c < 8; c++) { mtx.makeTranslation(42.6 + c * 1.25, 1.66, 5 + r * 0.95); carsInst.setMatrixAt(k, mtx); carsInst.setColorAt(k, col.setHex(pick([0xf5f5f5, 0x2b2f35, 0xb8323a, 0x3f78b0, 0xa9b0b6, 0xe9e4d8]))); k++; }
    g.add(carsInst);
    const sh = new THREE.Group();
    const hull = box(13, 2.4, 3.6, 0x2f4f6e); hull.position.y = 0.6; sh.add(hull);
    const red = box(13.05, 0.5, 3.65, 0xb5533c); red.position.y = -0.4; sh.add(red);
    const deckH = box(12, 3.6, 3.4, 0xf2f2ee); deckH.position.set(-0.3, 3.6, 0); sh.add(deckH);
    const stripe = box(12.05, 0.35, 3.45, 0x3f78b0); stripe.position.set(-0.3, 4.8, 0); sh.add(stripe);
    const bridgeR = box(1.6, 1, 3.3, 0xf2f2ee); bridgeR.position.set(5, 5.9, 0); sh.add(bridgeR);
    const ramp = box(2.6, 0.12, 1.6, 0x6b6f75); ramp.position.set(-7.4, 1.3, -1.3); ramp.rotation.z = 0.35; sh.add(ramp);
    const sg = sign("CAR CARRIER", "#2f4f6e", "#ffffff", 4.4); sg.position.set(-0.3, 3.6, 1.72); sh.add(sg);
    sh.position.set(46, 0.3, 14.6); g.add(sh);
    scene.add(g); roroShip = sh;
    spot("roro", g, () => new THREE.Vector3(46, 9.5, 14.6), () => new THREE.Vector3(46, 0.4, 14.6));
  }
  const ship = new THREE.Group();
  { // 컨테이너선
    const s = new THREE.Shape(); s.moveTo(-5, -1.45); s.lineTo(3.4, -1.45); s.quadraticCurveTo(5.8, -0.5, 6.2, 0); s.quadraticCurveTo(5.8, 0.5, 3.4, 1.45); s.lineTo(-5, 1.45); s.closePath();
    const hg = new THREE.ExtrudeGeometry(s, { depth: 1.6, bevelEnabled: false }); hg.rotateX(-Math.PI / 2);
    const hull = mesh(hg, M(0x23415e)); hull.position.y = -0.55; ship.add(hull);
    const red = mesh(hg.clone(), M(0xb5533c)); red.scale.set(1.01, 0.3, 1.01); red.position.y = -0.7; ship.add(red);
    const deck = box(8.8, 0.12, 2.8, 0x9aa7b0); deck.position.set(-0.4, 1.1, 0); ship.add(deck);
    for (let x = 0; x < 4; x++) for (let z = 0; z < 2; z++) for (let l = 0; l < 2; l++) {
      if (l === 1 && (x + z) % 3 === 0) continue;
      const c = box(1.65, 0.78, 1.2, PAL[(x * 3 + z + l * 2) % PAL.length]); c.position.set(-2.4 + x * 1.7, 1.55 + l * 0.8, -0.63 + z * 1.27); ship.add(c);
    }
    const bridgeB = box(1.3, 2.1, 2.4, 0xf4f1ea); bridgeB.position.set(-4.2, 2.15, 0); ship.add(bridgeB);
    const funnel = cyl(0.32, 0.4, 1.1, 0xb5533c, 10); funnel.position.set(-4.5, 3.7, 0); ship.add(funnel);
    const wake = mesh(new THREE.PlaneGeometry(8, 2.4), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.55, depthWrite: false }), false);
    wake.rotation.x = -Math.PI / 2; wake.position.set(-9, -0.45, 0); ship.add(wake);
    ship.scale.setScalar(1.15);
  }
  const route = new THREE.CatmullRomCurve3([[57, -1], [65, 6], [68, 18], [63, 30], [54, 35], [52, 25], [55, 12]].map(([x, z]) => new THREE.Vector3(x, 0, z)), true, "catmullrom", 0.5);
  spot("ship", ship, () => ship.position.clone().add(new THREE.Vector3(0, 6.5, 0)), () => ship.position);
  const train = new THREE.Group(), wagons = [];
  { // 화물열차
    const loco = new THREE.Group();
    const lb = box(2.8, 1.5, 1.4, 0xc23a32); lb.position.y = 1.1; loco.add(lb);
    const lc = box(1, 0.6, 1.42, 0x2b2f35); lc.position.set(0.9, 2.1, 0); loco.add(lc);
    const lw = box(0.06, 0.4, 1.1, 0xbfe0ee); lw.position.set(1.42, 1.5, 0); loco.add(lw);
    train.add(loco); wagons.push(loco);
    for (let i = 0; i < 4; i++) {
      const w = new THREE.Group(); const fl = box(2.8, 0.3, 1.3, 0x3a3e44); fl.position.y = 0.5; w.add(fl);
      const ct = box(2.6, 1.05, 1.2, PAL[(i * 3 + 1) % PAL.length]); ct.position.y = 1.18; w.add(ct);
      train.add(w); wagons.push(w);
    }
  }
  spot("train", train, () => wagons[0].position.clone().add(new THREE.Vector3(0, 5.5, 0)), () => wagons[0].position);
  let beam;
  { // 등대 (곶 D) + 등대지기 집
    const X = 36.5, Z = 28, g = at(X, Z); avoid(X, Z, 3.6);
    g.position.y = ground(X, Z) - 0.1;
    const base = cyl(1.6, 1.8, 0.8, 0x9a9c98, 16); base.position.y = 0.4; g.add(base);
    const tower = cyl(1.0, 1.35, 7.5, 0xc0302b, 20); tower.position.y = 4.55; g.add(tower);
    const white = cyl(1.08, 1.15, 1.7, 0xf6f4ee, 20); white.position.y = 6.2; g.add(white);
    for (let i = 0; i < 3; i++) { const wn = cyl(0.12, 0.12, 0.08, 0x2b2f35, 8); wn.rotation.x = Math.PI / 2; wn.position.set(0, 2.4 + i * 1.8, 1.25 - i * 0.07); g.add(wn); }
    const gal = cyl(1.55, 1.55, 0.2, 0xc0302b, 20); gal.position.y = 8.4; g.add(gal);
    const rail = mesh(new THREE.TorusGeometry(1.5, 0.05, 6, 32), M(0xc0302b)); rail.rotation.x = Math.PI / 2; rail.position.y = 8.95; g.add(rail);
    const lamp = cyl(0.8, 0.8, 1.2, 0xfff3b0, 16, { emissive: 0xffd34d, emissiveIntensity: 1.2, roughness: 0.2 }); lamp.position.y = 9.1; g.add(lamp);
    const cap = mesh(new THREE.SphereGeometry(0.95, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), M(0x1f2328)); cap.position.y = 9.7; g.add(cap);
    const spike = cyl(0.04, 0.08, 0.6, 0x1f2328, 6); spike.position.y = 10.8; g.add(spike);
    const bg = new THREE.ConeGeometry(2.2, 16, 18, 1, true); bg.translate(0, -8, 0); bg.rotateZ(Math.PI / 2);
    beam = mesh(bg, new THREE.MeshBasicMaterial({ color: 0xfff3b0, transparent: true, opacity: 0.18, depthWrite: false, side: THREE.DoubleSide }), false);
    beam.position.y = 9.1; g.add(beam);
    scene.add(g);
    house(31.5, 26, 0.5, 1.05, { wall: 0xb8323a, roof: 0xa8342f, two: true });
    spot("lighthouse", g, () => new THREE.Vector3(X, g.position.y + 13, Z), () => new THREE.Vector3(X, g.position.y, Z));
  }
  const plane = new THREE.Group();
  { // 화물기
    const f = cyl(0.62, 0.45, 6.6, 0xf6f4ee, 14); f.rotation.z = Math.PI / 2; plane.add(f);
    const nose = sph(0.62, 0xf6f4ee); nose.position.x = 3.3; nose.scale.set(1.3, 1, 1); plane.add(nose);
    const wing = box(1.7, 0.12, 8.4, 0xdfe6ea); wing.position.x = 0.3; plane.add(wing);
    const tail = box(1.2, 1.5, 0.12, 0x3f78b0); tail.position.set(-3, 0.9, 0); plane.add(tail);
    const stab = box(0.9, 0.1, 3, 0xdfe6ea); stab.position.set(-3, 0.25, 0); plane.add(stab);
    [-2, 2].forEach((z) => { const e = cyl(0.25, 0.25, 1, 0x3f78b0, 10); e.rotation.z = Math.PI / 2; e.position.set(0.7, -0.3, z); plane.add(e); });
    plane.rotation.order = "YXZ";
  }
  spot("plane", plane, () => plane.position.clone().add(new THREE.Vector3(0, 3, 0)), () => null);

  /* ================= trees, bushes, flowers, rocks ================= */
  const BLOCK = AVOID.concat(ROADPTS, HOUSES);
  function freeSpot(x, z, minH, maxH, edge) {
    const y = H(x, z); if (y < minH || y > maxH || landD(x, z) < edge) return false;
    for (let i = 0; i < BLOCK.length; i++) { const b = BLOCK[i], dx = x - b[0], dz = z - b[1]; if (dx * dx + dz * dz < b[2] * b[2]) return false; }
    for (let i = 0; i < FIELDS.length; i++) { const f = FIELDS[i]; if (Math.abs(x - f[0]) < f[2] / 2 + 0.4 && Math.abs(z - f[1]) < f[3] / 2 + 0.4) return false; }
    return true;
  }
  {
    const trees = { pine: [], round: [], autumn: [], cotton: [] };
    [[-44, -18], [-28, -18], [-12, -20], [4, -19], [22, -18], [40, -17], [-58, -12], [-61, 0], [-8, 9], [-48, 28], [17, 12], [42, -12], [-3, -25], [-20, -21], [24, 28], [-36, 7], [-60, 20]].forEach(([cx, cz]) => {
      for (let k = 0; k < 15; k++) { const x = cx + (rnd() - 0.5) * 9, z = cz + (rnd() - 0.5) * 6; if (freeSpot(x, z, 1.4, 12, 1.4)) trees.pine.push([x, z, 0.75 + rnd() * 0.6]); }
    });
    for (let i = 0; i < 1600 && trees.round.length + trees.autumn.length < 180; i++) {
      const x = -64 + rnd() * 122, z = -16 + rnd() * 46;
      if (freeSpot(x, z, 1.3, 6, 1.4)) (rnd() < 0.32 ? trees.autumn : trees.round).push([x, z, 0.65 + rnd() * 0.5]);
    }
    [[-31, 7], [-7, 23], [20, 9.5], [-5, 35], [-50, 27]].forEach(([x, z]) => { if (H(x, z) > 1) trees.cotton.push([x, z, 1.1 + rnd() * 0.3]); });
    const mtx = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), ps = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0), col = new THREE.Color();
    const inst = (geo, mat, list, fn, colors) => {
      if (!list.length) return;
      const m = new THREE.InstancedMesh(geo, mat, list.length); m.castShadow = true; m.receiveShadow = true;
      list.forEach((t, i) => { fn(t, ps, sc); q.setFromAxisAngle(up, hash(t[0], t[1]) * 6.28); m.setMatrixAt(i, mtx.compose(ps, q, sc)); if (colors) m.setColorAt(i, col.setHex(colors[Math.floor(hash(t[1], t[0]) * colors.length)])); });
      scene.add(m);
    };
    const all = trees.round.concat(trees.pine, trees.autumn, trees.cotton);
    inst(new THREE.CylinderGeometry(0.16, 0.22, 1.4, 6), M(0x6e4a30), all, ([x, z, s], p, sc2) => { p.set(x, H(x, z) + 0.6 * s, z); sc2.set(s, s, s); });
    const roundG = new THREE.IcosahedronGeometry(1.05, 2);
    inst(roundG, new THREE.MeshStandardMaterial({ color: 0xffffff, map: grainTex, roughness: 0.95 }), trees.round, ([x, z, s], p, sc2) => { p.set(x, H(x, z) + 1.85 * s, z); sc2.set(s, s * 1.05, s); }, [0x3f7d34, 0x4c8a3a, 0x5a9a42, 0x36702f]);
    inst(roundG, new THREE.MeshStandardMaterial({ color: 0xffffff, map: grainTex, roughness: 0.95 }), trees.autumn, ([x, z, s], p, sc2) => { p.set(x, H(x, z) + 1.85 * s, z); sc2.set(s, s * 1.05, s); }, [0xd9452f, 0xe56a2c, 0xf0a33a, 0xc23a3a, 0xe8b53e]);
    const pineG = (() => {
      const parts = [[0.95, 1.9, 0.95], [0.75, 1.6, 1.85], [0.5, 1.3, 2.65]].map(([r, h, y]) => { const c = new THREE.ConeGeometry(r, h, 9); c.translate(0, y, 0); return c.toNonIndexed(); });
      const g = new THREE.BufferGeometry(), pos = [], nor = [];
      parts.forEach((x) => { pos.push(...x.attributes.position.array); nor.push(...x.attributes.normal.array); });
      g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3)); return g;
    })();
    inst(pineG, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 }), trees.pine, ([x, z, s], p, sc2) => { p.set(x, H(x, z) + 0.9 * s, z); sc2.set(s, s * 1.15, s); }, [0x2c5e3a, 0x356b3f, 0x2f6a3a, 0x3d7a45]);
    inst(woolGeo, woolMat, trees.cotton, ([x, z, s], p, sc2) => { p.set(x, H(x, z) + 2.2 * s, z); sc2.set(s * 1.25, s * 1.1, s * 1.25); });

    const bushes = [];
    for (let i = 0; i < 4000 && bushes.length < (small ? 220 : 380); i++) {
      const x = -64 + rnd() * 124, z = -18 + rnd() * 50;
      if (freeSpot(x, z, 1.3, 7, 0.9)) bushes.push([x, z, 0.35 + rnd() * 0.45]);
    }
    inst(new THREE.IcosahedronGeometry(1, 1), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9, flatShading: true }), bushes,
      ([x, z, s], p, sc2) => { p.set(x, H(x, z) + s * 0.55, z); sc2.set(s * 1.2, s, s * 1.2); }, [0xd9452f, 0xe0602f, 0xf0a33a, 0xc23a3a, 0x7fb04a, 0x5f9a3e, 0xe8b53e]);
    const flowers = [];
    for (let i = 0; i < 9000 && flowers.length < (small ? 900 : 1800); i++) {
      const x = -64 + rnd() * 124, z = -18 + rnd() * 50;
      if (freeSpot(x, z, 1.3, 9, 0.7)) flowers.push([x, z, 0.1 + rnd() * 0.07]);
    }
    const fm = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 6, 4), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8 }), Math.max(1, flowers.length));
    flowers.forEach(([x, z, s], i) => { fm.setMatrixAt(i, mtx.compose(ps.set(x, H(x, z) + 0.12, z), q.identity(), sc.set(s, s, s))); fm.setColorAt(i, col.setHex([0xff8fb1, 0xffe066, 0xffffff, 0xb48cff, 0xff6b6b, 0xffa94d][i % 6])); });
    fm.count = flowers.length; scene.add(fm);
    const rocks = [];
    for (let i = 0; i < 14000 && rocks.length < (small ? 200 : 340); i++) {
      const x = -68 + rnd() * 136, z = -18 + rnd() * 56, L = landD(x, z);
      if (L > -1.0 && L < 0.9 && !AVOID.some(([ax, az, r]) => (x - ax) ** 2 + (z - az) ** 2 < r * r) && !(x > 40 && x < 53 && z > -7 && z < 18)) rocks.push([x, z, 0.4 + rnd() * 0.85]);
    }
    inst(new THREE.DodecahedronGeometry(1, 0), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.95, flatShading: true }), rocks,
      ([x, z, s], p, sc2) => { p.set(x, Math.max(-0.4, H(x, z)) - s * 0.25, z); sc2.set(s * 1.2, s * 0.85, s); }, [0x5a6470, 0x707a86, 0x4f5864, 0x838c96]);
  }
  [[-24, 37, 1.6], [16, 34, 1.2], [44, 40, 1.8], [72, 28, 1.4], [-40, 38, 1.3], [66, -9, 1.5]].forEach(([x, z, s]) => {
    const r = mesh(new THREE.DodecahedronGeometry(s, 0), M(0x6e7884, { flatShading: true })); r.position.set(x, 0.1, z); r.scale.set(1.3, 0.55, 1); scene.add(r);
  });
  { // 가로등
    const lamps = truckPath.filter((p, i) => i % 14 === 7 && p.y > 1.2);
    const pm = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.06, 0.08, 2.2, 6), M(0x2f3437), lamps.length), lm = new THREE.InstancedMesh(new THREE.SphereGeometry(0.22, 8, 6), M(0xfff1c2, { emissive: 0xffd27a, emissiveIntensity: 0.8 }), lamps.length);
    const mtx = new THREE.Matrix4();
    lamps.forEach((p, i) => { pm.setMatrixAt(i, mtx.makeTranslation(p.x + 1.3, p.y + 1.1, p.z + 0.4)); lm.setMatrixAt(i, mtx.makeTranslation(p.x + 1.3, p.y + 2.25, p.z + 0.4)); });
    pm.castShadow = true; scene.add(pm); scene.add(lm);
  }

  /* ================= life ================= */
  const clouds = [];
  [[-52, 26, -36], [-18, 30, -48], [22, 28, -44], [56, 25, -30], [-2, 32, -58]].forEach(([x, y, z], i) => {
    const g = new THREE.Group(); const n = 2 + (i % 3);
    for (let k = 0; k < n; k++) { const b = wool(1.5 + rnd() * 1.3); b.position.set(k * 2.3 - n, rnd() * 1.3, (rnd() - 0.5) * 2); b.castShadow = false; g.add(b); }
    g.position.set(x, y, z); g.userData = { speed: 0.4 + rnd() * 0.5, y }; scene.add(g); clouds.push(g);
  });
  const boats = [];
  [[-1, 31, 0.3], [8, 33, 2.1], [24, 33.5, 1], [-30, 36, 0.4], [60, -12, 2.4], [-7, 30, 1.6]].forEach(([x, z, r], i) => {
    const g = new THREE.Group();
    const hb = box(2.2, 0.5, 0.9, i % 2 ? 0x3f78b0 : 0xc9714a); hb.position.y = 0.15; g.add(hb);
    if (i % 3 !== 2) { const mast = cyl(0.05, 0.05, 2.2, 0x6e4a30, 5); mast.position.y = 1.3; g.add(mast); const sail = mesh(new THREE.ConeGeometry(0.8, 2, 3), M(0xf6f4ee)); sail.position.set(0.1, 1.5, 0); sail.scale.set(1, 1, 0.15); g.add(sail); }
    else { const cabn = box(0.8, 0.6, 0.7, 0xf6f4ee); cabn.position.set(-0.3, 0.7, 0); g.add(cabn); }
    g.position.set(x, 0, z); g.rotation.y = r; scene.add(g); boats.push(g);
  });
  {
    const tanker = new THREE.Group(); const th = box(9, 1.6, 2.6, 0x2a3f55); th.position.y = 0.3; tanker.add(th);
    for (let i = 0; i < 3; i++) { const dm = mesh(new THREE.SphereGeometry(0.95, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), M(0xf4f4f0)); dm.position.set(-2.5 + i * 2.2, 1.1, 0); tanker.add(dm); }
    const tb = box(1.2, 1.4, 2.2, 0xf4f4f0); tb.position.set(3.6, 1.6, 0); tanker.add(tb);
    tanker.position.set(-63, 0, 27); tanker.rotation.y = 0.5; scene.add(tanker); boats.push(tanker);
  }
  [[-44, 10], [-41, 11.5], [-50, 6.5], [-31, 24], [14, 25], [-37, 3]].forEach(([x, z]) => {
    const g = new THREE.Group(); const body = wool(0.6); body.scale.set(0.75, 0.55, 0.55); body.position.y = 0.6; g.add(body);
    const head = sph(0.21, 0x3a332e); head.position.set(0.56, 0.72, 0); g.add(head);
    g.position.set(x, ground(x, z), z); g.rotation.y = rnd() * 6.28; scene.add(g);
  });
  const gulls = [];
  for (let i = 0; i < 6; i++) {
    const g = new THREE.Group(); const wl = box(0.9, 0.05, 0.25, 0xf7f7f4), wr = box(0.9, 0.05, 0.25, 0xf7f7f4);
    wl.position.x = -0.42; wr.position.x = 0.42; g.add(wl); g.add(wr); g.userData = { wl, wr, r: 6 + i * 2.2, h: 12 + i, p: i * 1.1, cx: i < 3 ? 46 : 34, cz: i < 3 ? 2 : 26 };
    scene.add(g); gulls.push(g);
  }

  /* ================= selection ring ================= */
  const ring = mesh(new THREE.TorusGeometry(3.2, 0.2, 8, 48), new THREE.MeshBasicMaterial({ color: 0xffb347, transparent: true, opacity: 0.95 }), false);
  ring.rotation.x = -Math.PI / 2; ring.visible = false; scene.add(ring);

  /* ================= interaction ================= */
  let hovered = null, selected = null, filterCat = "all";
  const CAT = {}; (window.SPOTS || []).forEach((s) => { CAT[s.id] = s.cat; });
  const ray = new THREE.Raycaster(), ptr = new THREE.Vector2();
  const spotMeshes = []; Object.values(spots).forEach((s) => s.group.traverse((o) => { if (o.isMesh || o.isSprite) spotMeshes.push(o); }));
  const el = renderer.domElement;
  function pickSpot(e) {
    const r = el.getBoundingClientRect();
    ptr.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ptr, camera);
    const hit = ray.intersectObjects(spotMeshes, false)[0];
    return hit ? hit.object.userData.spot : null;
  }
  let yaw = 0, yawGoal = 0, dragging = false, moved = 0, lastX = 0, idle = 0;
  el.style.touchAction = "pan-y"; el.style.cursor = "grab";
  el.addEventListener("pointerdown", (e) => { dragging = true; moved = 0; lastX = e.clientX; wake(); });
  window.addEventListener("pointerup", () => { if (dragging) { dragging = false; el.style.cursor = hovered ? "pointer" : "grab"; } });
  el.addEventListener("pointermove", (e) => {
    if (dragging) { const dx = e.clientX - lastX; lastX = e.clientX; moved += Math.abs(dx); yawGoal = Math.max(-0.65, Math.min(0.65, yawGoal - dx * 0.004)); idle = 0; el.style.cursor = "grabbing"; }
    else if (e.pointerType === "mouse") { const hh = pickSpot(e); if (hh !== hovered) { hovered = hh; el.style.cursor = hh ? "pointer" : "grab"; } }
    wake();
  });
  el.addEventListener("pointerleave", () => { if (!dragging) hovered = null; });
  el.addEventListener("click", (e) => { if (moved > 6) return; const id = pickSpot(e); if (id) window.dispatchEvent(new CustomEvent("trademap:select", { detail: id })); });
  window.TradeMap3D = {
    highlight(id, on) { hovered = on ? id : (hovered === id ? null : hovered); wake(); },
    select(id) { selected = id; wake(); },
    filter(cat) { filterCat = cat || "all"; wake(); }
  };

  /* ================= size & pins ================= */
  let W = 0, Hh = 0;
  // 지도 위에 떠 있는 제목 상자 아래쪽 영역에 지도가 꽉 차게 맞춰요 (상자와 장소 이름표가 겹치지 않게)
  const heroHead = document.querySelector(".hero-head");
  let padTop = 0;
  function resize() {
    W = stage.clientWidth; Hh = stage.clientHeight; if (!W || !Hh) return;
    padTop = 0;
    if (heroHead && getComputedStyle(heroHead).position === "absolute") {
      const b = heroHead.getBoundingClientRect().bottom - stage.getBoundingClientRect().top;
      padTop = Math.max(0, Math.min(Hh * 0.4, b + 8));
    }
    renderer.setSize(W, Hh, false);
    const effH = Hh - padTop;
    camera.aspect = W / effH;
    if (padTop > 0) camera.setViewOffset(W, effH, 0, -padTop, W, Hh); else camera.clearViewOffset();
    camera.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(() => { resize(); wake(); });
  ro.observe(stage); if (heroHead) ro.observe(heroHead);
  resize();
  const v = new THREE.Vector3();
  function placePins() {
    for (const p of pins.querySelectorAll(".pin")) {
      const s = spots[p.dataset.spot]; if (!s) continue;
      v.copy(s.anchor()); v.project(camera);
      const px = ((v.x + 1) / 2) * W, py = ((1 - v.y) / 2) * Hh;
      const off = v.z > 1 || Math.abs(v.x) > 1.02 || py < padTop + 30 || v.y < -1.05;
      p.style.visibility = off ? "hidden" : "";
      p.style.left = px + "px"; p.style.top = py + "px";
      p.style.zIndex = String(Math.round((1 - v.z) * 1000));
    }
  }

  /* ================= animate ================= */
  let running = false, visible = true, last = performance.now(), t = 0, still = 0;
  const target = new THREE.Vector3();
  function wake() { still = 0; if (!running && visible && !document.hidden) { running = true; last = performance.now(); requestAnimationFrame(frame); } }
  new IntersectionObserver((es) => { visible = es[0].isIntersecting; if (visible) wake(); }).observe(stage);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) wake(); });
  const truckCurve = new THREE.CatmullRomCurve3(truckPath), tq = new THREE.Vector3(), tp = new THREE.Vector3();
  const railLen = railCurve.getLength();
  const tanFov = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  function placeOn(curve, u, obj, flip) {
    curve.getPointAt(Math.min(1, Math.max(0, u)), tp); curve.getTangentAt(Math.min(1, Math.max(0, u)), tq);
    obj.position.copy(tp); obj.rotation.y = Math.atan2(-tq.z, tq.x) + (flip ? Math.PI : 0);
  }

  function frame(now) {
    if (!visible || document.hidden) { running = false; return; }
    const dt = Math.max(0, Math.min(0.05, (now - last) / 1000)); last = now;
    if (!reduceMotion) t += dt;
    idle += dt;

    // 화면을 꽉 채우는 비스듬한 시점 (화면 비율에 따라 보이는 폭을 맞춰요)
    const a = camera.aspect, narrow = a < 1.15, k = smooth(1.15, 2.1, a);
    const width = narrow ? 72 : 122 + 30 * k;
    const dist = Math.max(60, Math.min(230, width / (2 * tanFov * a)));
    const elev = narrow ? 0.8 : 0.72 - 0.04 * k;
    if (!dragging && idle > 4 && !reduceMotion) yawGoal += (Math.sin(t * 0.05) * 0.1 - yawGoal) * 0.01;
    yaw += (yawGoal - yaw) * 0.08;
    if (narrow) target.set(13, 0, 0); else target.set(1 - 4 * k, 0, 0.5 - k);
    camera.position.set(target.x + Math.sin(yaw) * Math.cos(elev) * dist, Math.sin(elev) * dist, target.z + Math.cos(yaw) * Math.cos(elev) * dist);
    camera.lookAt(target);
    scene.fog.near = dist * 1.15; scene.fog.far = dist * 2.6;

    waveNormal.offset.set(t * 0.006, t * 0.009);
    coast.material.opacity = 0.88 + Math.sin(t * 1.4) * 0.12;
    const u = (((t / 85) % 1) + 1) % 1, sp = route.getPointAt(u), tg = route.getTangentAt(u);
    ship.position.set(sp.x, 0.3 + Math.sin(t * 1.5) * 0.12, sp.z); ship.rotation.y = Math.atan2(-tg.z, tg.x); ship.rotation.z = Math.sin(t * 1.2) * 0.03;
    roroShip.position.y = 0.3 + Math.sin(t * 1.1) * 0.08;
    const pa = t * 0.09; plane.position.set(2 + Math.cos(pa) * 54, 26 + Math.sin(pa * 2) * 1.5, -8 + Math.sin(pa) * 30);
    plane.rotation.set(-0.2, Math.atan2(-(Math.cos(pa) * 30), -Math.sin(pa) * 54), 0);
    vehicles.forEach((c, i) => { const uu = ((t * (0.01 + i * 0.004) + i * 0.37) % 1), ping = uu < 0.5 ? uu * 2 : 2 - uu * 2; placeOn(truckCurve, 0.01 + ping * 0.98, c, uu >= 0.5); });
    const head = 14 + ((Math.sin(t * 0.06) + 1) / 2) * (railLen - 15);
    wagons.forEach((w, i) => { placeOn(railCurve, (head - i * 3) / railLen, w, false); w.position.y += 0.05; });
    dumpTruck.position.x = 3.4 + Math.sin(t * 0.4) * 1.2;
    smoke.forEach((s) => { const p = (t * 0.18 + s.userData.phase) % 1; s.position.copy(s.userData.base).add(tq.set(p * 2.2, p * 4.5, -p * 0.8)); s.scale.setScalar(0.35 + p * 0.9); });
    bubbles.forEach((b, i) => { b.position.y = 3.9 + Math.sin(t * 2 + i * 1.6) * 0.12; b.material.opacity = 0.7 + 0.3 * Math.abs(Math.sin(t * 0.8 + i * 1.6)); });
    flags.forEach((f, j) => { const fp = f.f.geometry.attributes.position; for (let i = 0; i < fp.count; i++) fp.setZ(i, Math.sin(f.base[i * 3] * 3 - t * 5 - j) * 0.12 * (f.base[i * 3] / f.w)); fp.needsUpdate = true; });
    hanging.forEach((hg) => { const yy = hg.base + Math.sin(t * 0.6 + hg.phase) * 1.4; hg.c.position.y = yy; hg.cable.scale.y = (8.7 - yy) / 3; hg.cable.position.y = (8.7 + yy) / 2; });
    parcels.forEach((pc, i) => { pc.position.x = -2.4 + ((t * 0.6 + i) % 5); });
    beam.rotation.y = t * 0.9;
    clouds.forEach((c, i) => { c.position.x += c.userData.speed * dt; c.position.y = c.userData.y + Math.sin(t * 0.5 + i) * 0.4; if (c.position.x > 90) c.position.x = -90; });
    boats.forEach((b, i) => { b.position.y = Math.sin(t * 1.3 + i) * 0.12; b.rotation.z = Math.sin(t * 1.1 + i * 2) * 0.05; });
    gulls.forEach((gl) => { const d = gl.userData, ang = t * 0.5 + d.p; gl.position.set(d.cx + Math.cos(ang) * d.r, d.h + Math.sin(t * 2 + d.p) * 0.4, d.cz + Math.sin(ang) * d.r * 0.6); gl.rotation.y = -ang; const f = Math.sin(t * 8 + d.p) * 0.45; d.wl.rotation.z = f; d.wr.rotation.z = -f; });
    for (const [id, s] of Object.entries(spots)) {
      const inCat = filterCat !== "all" && CAT[id] === filterCat;
      const goal = id === hovered ? 1.08 : id === selected ? 1.05 : inCat ? 1 + 0.05 * (0.5 + 0.5 * Math.sin(t * 4)) : 1;
      s.scale += (goal - s.scale) * 0.18;
      if (!["ship", "plane", "crane", "roro", "train"].includes(id)) s.group.scale.setScalar(s.scale);
    }
    const rs = selected && spots[selected] && spots[selected].ringAt();
    if (rs) {
      ring.visible = true;
      const gy = ["ship", "roro"].includes(selected) ? 0.4 : selected === "crane" ? 1.5 : selected === "train" ? rs.y : Math.max(rs.y, ground(rs.x, rs.z));
      ring.position.set(rs.x, gy + 0.25, rs.z);
      ring.scale.setScalar((["crane", "roro"].includes(selected) ? 2.4 : selected === "ship" ? 2 : 1.5) * (1 + Math.sin(now / 300) * 0.05));
    } else ring.visible = false;

    renderer.render(scene, camera);
    placePins();
    if (reduceMotion) { still++; if (still > 30) { running = false; return; } }
    requestAnimationFrame(frame);
  }
  wake();
  window.dispatchEvent(new CustomEvent("trademap:ready"));
}
