'use strict';
// ===== Core: constants, math, brush engine, procedural textures =====
const W = 1920, H = 1080, DURATION = 58, TAU = Math.PI * 2;
const PAPER = '#ece4d3', INK = '#13110f', RED = '#b5291f';
const JFONT = '"Yu Mincho","YuMincho","Hiragino Mincho ProN","Noto Serif JP","MS Mincho",serif';
const EFONT = '"Cormorant Garamond",Garamond,"Times New Roman",serif';
let NOW = 0;
const FX = { shake: 0, flash: 0, flashCol: PAPER, letter: 0 };

const clamp = (x, a = 0, b = 1) => x < a ? a : x > b ? b : x;
const lerp = (a, b, t) => a + (b - a) * t;
const seg = (t, a, b) => clamp((t - a) / (b - a));
const eio = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const eo = t => 1 - Math.pow(1 - t, 3);
const ei = t => t * t * t;
const bell = (t, a, b) => Math.sin(seg(t, a, b) * Math.PI);
const punch = (t, a, k = 4) => t >= a ? Math.exp(-(t - a) * k) : 0;
function rng(seed) { let a = seed >>> 0; return () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function hash(n) { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); }
function vnoise(x) { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return lerp(hash(i), hash(i + 1), u) * 2 - 1; }
function fbm(x, o = 4) { let s = 0, a = .5, f = 1; for (let i = 0; i < o; i++) { s += a * vnoise(x * f + i * 17.31); f *= 2; a *= .5; } return s; }
function makeCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
const add = (a, b, k = 1) => [a[0] + b[0] * k, a[1] + b[1] * k];
const mix2 = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k)];
const dirA = (a, l) => [Math.sin(a) * l, Math.cos(a) * l]; // 0 = down, + = forward
let HASFILTER = false;

// Catmull-Rom resample
function catmull(pts, n) {
  const out = [], m = pts.length, P = i => pts[Math.max(0, Math.min(m - 1, i))];
  const segs = m - 1, per = Math.max(2, Math.ceil(n / segs));
  for (let i = 0; i < segs; i++) {
    const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
    for (let j = 0; j < per; j++) {
      const t = j / per, t2 = t * t, t3 = t2 * t;
      out.push([
        .5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
        .5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)]);
    }
  }
  out.push(pts[m - 1]);
  return out;
}

// Expressive brush stroke: tapered, rough-edged body + "flying white" dry streaks + splatter
function brush(c, pts, o = {}) {
  const prog = o.prog === undefined ? 1 : o.prog, from = o.from || 0;
  if (prog <= 0 || from >= 1 || pts.length < 2) return;
  const w = o.w || 10, ts = o.ts === undefined ? .22 : o.ts, te = o.te === undefined ? .4 : o.te;
  const P = catmull(pts, o.res || 28), n = P.length;
  const L = [0];
  for (let i = 1; i < n; i++) L[i] = L[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]);
  const total = L[n - 1] || 1e-6, endL = total * prog, startL = total * from;
  const R = rng(o.seed || 1), ph = R() * 100, rough = o.rough === undefined ? .16 : o.rough;
  const left = [], right = [], mids = [], widths = [], us = [];
  for (let i = 0; i < n; i++) {
    if (L[i] < startL && i < n - 1 && L[i + 1] < startL) continue;
    const u = L[i] / total;
    const a = P[Math.max(0, i - 1)], b = P[Math.min(n - 1, i + 1)];
    let dx = b[0] - a[0], dy = b[1] - a[1]; const d = Math.hypot(dx, dy) || 1; dx /= d; dy /= d;
    let ww = o.wf ? w * o.wf(u) : w * Math.pow(clamp(u / ts + .1), .55) * Math.pow(clamp((1 - u) / te + .03), .75);
    ww *= .5 * (1 + rough * vnoise(u * 11 + ph) + rough * .5 * vnoise(u * 37 + ph * 2));
    left.push([P[i][0] - dy * ww, P[i][1] + dx * ww]); right.push([P[i][0] + dy * ww, P[i][1] - dx * ww]);
    mids.push(P[i]); widths.push(ww); us.push([u, dx, dy]);
    if (L[i] > endL) break;
  }
  if (left.length < 2) return;
  c.save();
  if (o.alpha !== undefined) c.globalAlpha *= o.alpha;
  c.fillStyle = o.color || INK;
  if (o.bleed) { c.shadowColor = o.bleedCol || 'rgba(19,17,15,.55)'; c.shadowBlur = o.bleed; }
  c.beginPath(); c.moveTo(left[0][0], left[0][1]);
  for (let i = 1; i < left.length; i++) c.lineTo(left[i][0], left[i][1]);
  for (let i = right.length - 1; i >= 0; i--) c.lineTo(right[i][0], right[i][1]);
  c.closePath(); c.fill();
  c.shadowBlur = 0;
  if (o.dry) { // hihaku: paper-coloured scratches through the tail of the stroke
    c.strokeStyle = o.paper || PAPER; c.lineCap = 'round';
    const k = o.bristles || 7, baseA = c.globalAlpha;
    for (let b = 0; b < k; b++) {
      const off = (R() * 2 - 1) * .8, lw = w * (.03 + R() * .05), thr = .1 + R() * .5, sp = R() * 50;
      c.lineWidth = lw; c.globalAlpha = baseA * (.5 + R() * .5);
      c.beginPath(); let pen = false;
      for (let i = 0; i < mids.length; i++) {
        const u = us[i][0];
        const on = u > 1 - o.dry && vnoise(u * 18 + sp) > -thr + (1 - u) * .8;
        const x = mids[i][0] + us[i][2] * widths[i] * off, y = mids[i][1] - us[i][1] * widths[i] * off;
        if (on) { if (!pen) { c.moveTo(x, y); pen = true; } else c.lineTo(x, y); } else pen = false;
      }
      c.stroke();
    }
    c.globalAlpha = baseA;
  }
  if (o.splat) {
    c.fillStyle = o.color || INK;
    const last = mids[mids.length - 1];
    for (let i = 0; i < o.splat; i++) {
      const a = R() * TAU, r = w * (.3 + R() * 1.6), rr = w * (.02 + R() * .09);
      c.beginPath(); c.arc(last[0] + Math.cos(a) * r, last[1] + Math.sin(a) * r, rr, 0, TAU); c.fill();
    }
  }
  c.restore();
}

function blob(c, x, y, r, col, seed = 1, rough = .08, sy = 1) {
  c.fillStyle = col; c.beginPath();
  for (let i = 0; i <= 20; i++) {
    const a = i / 20 * TAU, rr = r * (1 + rough * vnoise(a * 2 + seed * 7.3));
    i ? c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr * sy) : c.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr * sy);
  }
  c.fill();
}

function enso(c, x, y, r, w, prog, seed = 3, from = 0, alpha = 1) {
  const pts = []; const a0 = -1.9, sweep = TAU * .92;
  for (let i = 0; i <= 24; i++) { const a = a0 + sweep * i / 24, rr = r * (1 + .025 * Math.sin(a * 3 + seed)); pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr]); }
  brush(c, pts, { w, prog, from, seed, ts: .04, te: .55, dry: .5, rough: .22, res: 90, bleed: 6, alpha, bristles: 10 });
}

function drawBlossom(c, x, y, r, rot = 0, alpha = 1, outline = true) {
  if (alpha <= 0) return;
  c.save(); c.translate(x, y); c.rotate(rot); c.globalAlpha *= alpha;
  for (let i = 0; i < 5; i++) {
    const a = i / 5 * TAU - Math.PI / 2;
    c.save(); c.rotate(a); c.fillStyle = i % 2 ? '#a8231a' : RED;
    c.beginPath(); c.moveTo(0, 0);
    c.bezierCurveTo(r * .55, -r * .45, r * 1.05, -r * .3, r * 1.0, 0);
    c.bezierCurveTo(r * 1.05, r * .3, r * .55, r * .45, 0, 0); c.fill();
    if (outline && r > 12) { c.strokeStyle = 'rgba(40,10,8,.55)'; c.lineWidth = r * .03; c.stroke(); }
    c.restore();
  }
  c.fillStyle = '#2a0c08';
  if (r > 12) {
    c.strokeStyle = 'rgba(30,10,6,.8)'; c.lineWidth = r * .025;
    for (let i = 0; i < 9; i++) { const a = i / 9 * TAU; c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(a) * r * .38, Math.sin(a) * r * .38); c.stroke(); c.beginPath(); c.arc(Math.cos(a) * r * .4, Math.sin(a) * r * .4, r * .035, 0, TAU); c.fill(); }
  }
  c.beginPath(); c.arc(0, 0, r * .16, 0, TAU); c.fill();
  c.restore();
}

// ===== Procedural assets =====
const A = {};
function makePaper() {
  const c = makeCanvas(W, H), g = c.getContext('2d');
  g.fillStyle = PAPER; g.fillRect(0, 0, W, H);
  const id = g.getImageData(0, 0, W, H), d = id.data, R = rng(7);
  for (let i = 0; i < d.length; i += 4) { const n = (R() - .5) * 12; d[i] += n; d[i + 1] += n; d[i + 2] += n * 1.15; }
  g.putImageData(id, 0, 0);
  for (let i = 0; i < 70; i++) {
    const x = R() * W, y = R() * H, r = 60 + R() * 260, gr = g.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, `rgba(${R() < .5 ? '150,125,90' : '255,252,240'},${.03 + R() * .04})`); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2);
  }
  g.lineCap = 'round';
  for (let i = 0; i < 1400; i++) {
    const x = R() * W, y = R() * H, l = 6 + R() * 40, a = R() * TAU;
    g.strokeStyle = R() < .6 ? `rgba(120,100,70,${.05 + R() * .08})` : `rgba(255,253,245,${.2 + R() * .3})`;
    g.lineWidth = .5 + R() * 1.2; g.beginPath(); g.moveTo(x, y);
    g.quadraticCurveTo(x + Math.cos(a + 1) * l * .5, y + Math.sin(a + 1) * l * .5, x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
  }
  return c;
}
function makeGrain() {
  const c = makeCanvas(512, 512), g = c.getContext('2d'), R = rng(99);
  const id = g.createImageData(512, 512), d = id.data;
  for (let i = 0; i < d.length; i += 4) {
    const v = R();
    if (v < .06) { d[i] = 236; d[i + 1] = 228; d[i + 2] = 211; d[i + 3] = 10 + R() * 26; }
    else if (v < .1) { d[i] = 20; d[i + 1] = 18; d[i + 2] = 15; d[i + 3] = R() * 14; }
  }
  g.putImageData(id, 0, 0);
  g.lineCap = 'round';
  for (let i = 0; i < 260; i++) {
    const x = R() * 512, y = R() * 512, l = 4 + R() * 26, a = R() * TAU;
    g.strokeStyle = `rgba(236,228,211,${.08 + R() * .14})`; g.lineWidth = .6 + R();
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
  }
  return c;
}
function makeVignette() {
  const c = makeCanvas(W, H), g = c.getContext('2d');
  const vg = g.createRadialGradient(W / 2, H / 2, H * .35, W / 2, H / 2, H * 1.05);
  vg.addColorStop(0, 'rgba(40,30,18,0)'); vg.addColorStop(1, 'rgba(40,30,18,.42)');
  g.fillStyle = vg; g.fillRect(0, 0, W, H);
  return c;
}
function makeSoft(r, rgb, a0 = 1) {
  const c = makeCanvas(r * 2, r * 2), g = c.getContext('2d'), gr = g.createRadialGradient(r, r, 0, r, r, r);
  gr.addColorStop(0, `rgba(${rgb},${a0})`); gr.addColorStop(.55, `rgba(${rgb},${a0 * .55})`); gr.addColorStop(1, `rgba(${rgb},0)`);
  g.fillStyle = gr; g.fillRect(0, 0, r * 2, r * 2); return c;
}
// Layered sumi-e mountain range: overlapping graded washes + dry ridge strokes + texture strokes
function makeRange(seed, o) {
  const width = o.width || 2800, c = makeCanvas(width, H), g = c.getContext('2d'), R = rng(seed);
  const tone = o.tone;
  for (let i = 0; i < o.count; i++) {
    const cx = (i + .5) / o.count * width + (R() - .5) * width / o.count * .9;
    const ph = o.hMin + R() * (o.hMax - o.hMin), hw = ph * o.slope * (.75 + R() * .6), base = o.base + R() * o.baseJ;
    const ax = cx + (R() - .5) * hw * .5, pts = [], N = 36;
    for (let j = 0; j <= N; j++) {
      const x = lerp(cx - hw, cx + hw, j / N);
      const dd = x < ax ? (ax - x) / (ax - (cx - hw)) : (x - ax) / ((cx + hw) - ax);
      const prof = Math.pow(1 - clamp(dd), 1.25) * (1 - .25 * Math.pow(clamp(dd), 3));
      pts.push([x, base - ph * prof + fbm(j * .23 + i * 5.1 + seed, 4) * ph * .1 * (1 - dd * .5)]);
    }
    const gr = g.createLinearGradient(0, base - ph, 0, base + ph * .25);
    gr.addColorStop(0, `rgba(${tone},${o.a})`); gr.addColorStop(.55, `rgba(${tone},${o.a * .35})`); gr.addColorStop(1, `rgba(${tone},0)`);
    g.fillStyle = gr; g.beginPath(); g.moveTo(pts[0][0], pts[0][1]);
    for (const p of pts) g.lineTo(p[0], p[1]);
    g.lineTo(cx + hw, H); g.lineTo(cx - hw, H); g.closePath(); g.fill();
    const k = Math.round(N / 2);
    brush(g, pts.slice(0, k + 1), { w: o.lw * (.7 + R() * .6), color: `rgba(${tone},${o.la})`, seed: seed + i, ts: .05, te: .1, dry: .5, rough: .3, res: 40 });
    brush(g, pts.slice(k), { w: o.lw * (.6 + R() * .6), color: `rgba(${tone},${o.la})`, seed: seed + i + 50, ts: .1, te: .5, dry: .6, rough: .3, res: 40 });
    for (let s = 0; s < o.cun; s++) { // texture strokes down the slopes
      const j = 2 + Math.floor(R() * (N - 4)), p = pts[j], side = j < N / 2 ? -1 : 1, l = ph * (.12 + R() * .25);
      brush(g, [p, [p[0] + side * l * .35 + (R() - .5) * 10, p[1] + l * .6], [p[0] + side * l * .3, p[1] + l]], { w: o.lw * (.35 + R() * .5), color: `rgba(${tone},${o.la * .55})`, seed: seed * 3 + s, ts: .1, te: .8, dry: .7, rough: .35, res: 12 });
    }
  }
  g.filter = 'none';
  g.globalCompositeOperation = 'destination-out';
  const fade = g.createLinearGradient(0, o.base - 40, 0, o.base + 140);
  fade.addColorStop(0, 'rgba(0,0,0,0)'); fade.addColorStop(1, 'rgba(0,0,0,1)');
  g.fillStyle = fade; g.fillRect(0, 0, width, H);
  return c;
}
// Cherry tree painted once; trunk base at (700,1150) in its own canvas
function makeTree(seed) {
  const c = makeCanvas(1400, 1200), g = c.getContext('2d'), R = rng(seed), tips = [];
  function grow(x, y, ang, len, w, depth) {
    const pts = [[x, y]]; let cx = x, cy = y, a = ang;
    for (let i = 0; i < 3; i++) { a += (R() - .5) * .55; cx += Math.sin(a) * len / 3; cy -= Math.cos(a) * len / 3; pts.push([cx, cy]); }
    brush(g, pts, { w, color: depth < 2 ? INK : '#24201d', seed: seed * 7 + depth * 31 + Math.floor(R() * 999), wf: depth < 5 ? u => 1 - .4 * u : u => (1 - .4 * u) * (1 - .85 * u), dry: depth < 2 ? .7 : .35, rough: .12, res: 18, bristles: 9 });
    if (depth < 5) {
      const k = depth < 1 ? 2 : (R() < .45 ? 3 : 2);
      for (let j = 0; j < k; j++) grow(cx, cy, a + (j - (k - 1) / 2) * (.75 + R() * .3) + (R() - .5) * .3, len * (.62 + R() * .16), w * .6, depth + 1);
    } else tips.push([cx, cy]);
  }
  grow(700, 1150, -.12, 420, 78, 0);
  for (const t of tips) for (let i = 0; i < 9; i++) {
    const x = t[0] + (R() - .5) * 120, y = t[1] + (R() - .5) * 80, r = 6 + R() * 14;
    g.fillStyle = `rgba(70,62,58,${.12 + R() * .2})`; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
    if (R() < .35) { g.strokeStyle = 'rgba(30,26,24,.55)'; g.lineWidth = 1.4; g.beginPath(); g.arc(x, y, r * .8, 0, TAU); g.stroke(); }
  }
  return c;
}
function makeSplat(seed) {
  const c = makeCanvas(600, 600), g = c.getContext('2d'), R = rng(seed);
  g.fillStyle = INK;
  for (let i = 0; i < 26; i++) { const a = R() * TAU, d = R() * 70; g.beginPath(); g.arc(300 + Math.cos(a) * d, 300 + Math.sin(a) * d, 18 + R() * 46, 0, TAU); g.fill(); }
  for (let i = 0; i < 16; i++) {
    const a = R() * TAU, l = 120 + R() * 170;
    brush(g, [[300 + Math.cos(a) * 40, 300 + Math.sin(a) * 40], [300 + Math.cos(a + .05) * l * .6, 300 + Math.sin(a + .05) * l * .6], [300 + Math.cos(a) * l, 300 + Math.sin(a) * l]], { w: 14 + R() * 26, seed: seed + i, ts: .05, te: .85, rough: .3 });
  }
  for (let i = 0; i < 50; i++) { const a = R() * TAU, d = 140 + R() * 150; g.beginPath(); g.arc(300 + Math.cos(a) * d, 300 + Math.sin(a) * d, 2 + R() * 11, 0, TAU); g.fill(); }
  return c;
}
function makeSeal(text, size, fontScale = .62) {
  const c = makeCanvas(size, size), g = c.getContext('2d'), R = rng(text.charCodeAt(0));
  g.fillStyle = RED; g.beginPath();
  const m = size * .06, pts = [[m, m], [size - m, m], [size - m, size - m], [m, size - m]];
  g.moveTo(m, m);
  for (let s = 0; s < 4; s++) { const a = pts[s], b = pts[(s + 1) % 4]; for (let i = 1; i <= 10; i++) { const k = i / 10; g.lineTo(lerp(a[0], b[0], k) + (R() - .5) * size * .025, lerp(a[1], b[1], k) + (R() - .5) * size * .025); } }
  g.fill();
  g.globalCompositeOperation = 'destination-out';
  g.fillStyle = '#000'; g.font = `700 ${Math.round(size * fontScale)}px ${JFONT}`; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(text, size / 2, size / 2 + size * .03);
  g.lineWidth = size * .035; g.strokeStyle = '#000'; g.strokeRect(size * .14, size * .14, size * .72, size * .72);
  for (let i = 0; i < 90; i++) { g.beginPath(); g.arc(R() * size, R() * size, R() * size * .018, 0, TAU); g.fill(); }
  return c;
}
function initAssets() {
  const tctx = document.createElement('canvas').getContext('2d');
  HASFILTER = typeof tctx.filter === 'string';
  A.paper = makePaper(); A.grain = makeGrain(); A.vign = makeVignette();
  A.mist = makeSoft(256, '236,228,211', .95); A.puff = makeSoft(256, '19,17,15', .75);
  A.far = makeRange(11, { count: 9, hMin: 160, hMax: 330, slope: 1.1, base: 560, baseJ: 60, tone: '120,114,108', a: .55, lw: 9, la: .45, cun: 3 });
  A.mid = makeRange(23, { count: 7, hMin: 180, hMax: 380, slope: .95, base: 700, baseJ: 50, tone: '70,64,60', a: .7, lw: 13, la: .7, cun: 6 });
  A.near = makeRange(37, { count: 5, hMin: 140, hMax: 260, slope: 1.6, base: 860, baseJ: 40, tone: '35,31,28', a: .8, lw: 18, la: .9, cun: 8 });
  A.tree = makeTree(5);
  A.splat = [makeSplat(1), makeSplat(2), makeSplat(3), makeSplat(4)];
  A.seal = makeSeal('侍', 160); A.sealEnd = makeSeal('終', 260, .7);
}
