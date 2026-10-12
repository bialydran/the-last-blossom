'use strict';
// ===== Environment, effects and camera =====
function cam(c, x, y, z = 1, r = 0) {
  const sx = FX.shake * vnoise(NOW * 37) * 34, sy = FX.shake * vnoise(NOW * 41 + 9) * 26;
  c.save(); c.translate(W / 2 + sx, H / 2 + sy); c.scale(z, z); c.rotate(r + FX.shake * vnoise(NOW * 23 + 4) * .01); c.translate(-x, -y);
}
function par(c, img, cm, k, dy = 0, alpha = 1) {
  if (alpha <= 0) return;
  c.save(); c.globalAlpha *= alpha;
  const zz = 1 + (cm.z - 1) * k;
  c.translate(W / 2, H / 2); c.scale(zz, zz);
  c.translate(-W / 2 - (cm.x - W / 2) * k, -H / 2 - (cm.y - H / 2) * k + dy);
  c.drawImage(img, -(img.width - W) / 2, 0);
  c.restore();
}
function mist(c, tt, y, alpha, speed = 30, seed = 1, n = 7, hgt = 200) {
  if (alpha <= 0) return;
  c.save(); c.globalAlpha *= alpha;
  const span = W + 1400;
  for (let i = 0; i < n; i++) {
    const w = 700 + hash(i + seed) * 700, h = hgt * (.7 + hash(i * 3 + seed) * .7);
    const x = ((hash(i * 7 + seed) * span + tt * speed * (.6 + hash(i + seed * 2) * .8)) % span + span) % span - 700;
    c.drawImage(A.mist, x - w / 2, y + (hash(i * 11 + seed) - .5) * hgt * .8 - h / 2, w, h);
  }
  c.restore();
}
function storm(c, tt, amt) {
  if (amt <= 0) return;
  c.save();
  const g = c.createLinearGradient(0, 0, 0, H * .78);
  g.addColorStop(0, `rgba(19,17,15,${.82 * amt})`); g.addColorStop(.6, `rgba(19,17,15,${.35 * amt})`); g.addColorStop(1, 'rgba(19,17,15,0)');
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  c.globalAlpha = amt * .55;
  for (let i = 0; i < 9; i++) {
    const w = 900 + hash(i * 5.3) * 700, h = 260 + hash(i * 2.1) * 160, span = W + 1600;
    const x = ((hash(i * 9.1) * span + tt * (25 + hash(i) * 40)) % span) - 800;
    c.drawImage(A.puff, x - w / 2, 40 + hash(i * 3.3) * 260 - h / 2, w, h);
  }
  c.restore();
}
function rain(c, tt, amt, wind = -.3, lenK = 1, col = 'rgba(38,34,31,.34)') {
  if (amt <= 0) return;
  const n = Math.floor(520 * amt), H2 = H + 240, W2 = W + 500;
  c.save(); c.strokeStyle = col; c.lineWidth = 1.7; c.lineCap = 'round'; c.beginPath();
  for (let i = 0; i < n; i++) {
    const sp = 1600 + hash(i * 3.1) * 900, len = (40 + hash(i * 7.7) * 55) * lenK + 3;
    const y = ((hash(i * 1.3) * H2 + tt * sp) % H2) - 120;
    const x = (((hash(i * 5.9) * W2 + wind * y * .4) % W2) + W2) % W2 - 250;
    c.moveTo(x, y); c.lineTo(x + wind * len * .4, y + len);
  }
  c.stroke(); c.restore();
}
function petals(c, tt, n, wind = .6, redK = 0, alpha = 1, seed = 0) {
  c.save(); c.globalAlpha *= alpha;
  const W2 = W + 300;
  for (let i = 0; i < n; i++) {
    const h1 = hash(i * 3.7 + seed), h2 = hash(i * 5.1 + seed), h3 = hash(i * 9.3 + seed);
    const vx = (60 + h2 * 180) * wind, vy = 35 + h3 * 70;
    const x = (((h1 * W2 + tt * vx + Math.sin(tt * 1.3 + i) * 40) % W2) + W2) % W2 - 150;
    const y = (((h2 * H + tt * vy) % (H + 100)) + H + 100) % (H + 100) - 50 + Math.sin(tt * 2 + i * 1.7) * 18;
    const r = 5 + h3 * 7;
    c.save(); c.translate(x, y); c.rotate(tt * (1 + h1 * 3) + i);
    c.fillStyle = i < n * redK ? RED : `rgba(55,50,46,${.45 + h1 * .3})`;
    c.beginPath(); c.ellipse(0, 0, r, r * .45 * (.4 + .6 * Math.abs(Math.sin(tt * 3 + i))), 0, 0, TAU); c.fill();
    c.restore();
  }
  c.restore();
}
function bird(c, x, y, s, ph) {
  const f = Math.sin(ph) * .5;
  brush(c, [[x - s, y - s * f], [x - s * .4, y - s * .15], [x, y]], { w: s * .16, seed: 3, ts: .5, te: .1, res: 8 });
  brush(c, [[x, y], [x + s * .4, y - s * .15], [x + s, y - s * f]], { w: s * .16, seed: 4, ts: .1, te: .5, res: 8 });
}
function grass(c, x0, x1, gy, tt, wind, seed = 1, hgt = 40, col = INK) {
  c.save(); c.fillStyle = col;
  for (let x = x0; x < x1; x += 22) {
    const k = hash(x * .37 + seed); if (k < .45) continue;
    const y = gy(x);
    for (let b = 0; b < 3; b++) {
      const hh = hgt * (.5 + hash(x + b * 3.3 + seed) * .8), sway = (Math.sin(tt * 3 + x * .02 + b) * .4 + wind) * hh * .45;
      const bx = x + b * 6 - 6;
      c.beginPath(); c.moveTo(bx - 2.2, y); c.quadraticCurveTo(bx + sway * .3, y - hh * .6, bx + sway, y - hh); c.quadraticCurveTo(bx + sway * .3 + 1, y - hh * .6, bx + 2.2, y); c.fill();
    }
  }
  c.restore();
}
function house(c, x, y, s, alpha = 1) {
  c.save(); c.globalAlpha *= alpha; c.translate(x, y); c.scale(s, s);
  c.fillStyle = 'rgba(60,55,50,.18)'; c.fillRect(-120, -110, 240, 110);
  brush(c, [[-120, -110], [-120, 0]], { w: 7, color: '#3a3532', seed: 5, ts: .05, te: .1 });
  brush(c, [[120, -110], [120, 0]], { w: 7, color: '#3a3532', seed: 6, ts: .05, te: .1 });
  brush(c, [[-40, -95], [-40, 0]], { w: 4, color: '#5a5450', seed: 7, ts: .05, te: .1 });
  c.fillStyle = 'rgba(30,27,25,.82)'; c.beginPath(); c.moveTo(-175, -100); c.lineTo(-70, -215); c.lineTo(70, -215); c.lineTo(175, -100); c.closePath(); c.fill();
  brush(c, [[-180, -100], [0, -96], [180, -100]], { w: 16, seed: 8, ts: .05, te: .3, dry: .5 });
  brush(c, [[-75, -218], [75, -218]], { w: 14, seed: 9, ts: .1, te: .2 });
  c.restore();
}
function splat(c, i, x, y, sc, alpha = 1, rot = 0) {
  if (alpha <= 0 || sc <= 0) return;
  c.save(); c.globalAlpha *= alpha; c.translate(x, y); c.rotate(rot); c.scale(sc, sc); c.drawImage(A.splat[i % 4], -300, -300); c.restore();
}
// Ink-spirit burst: enemies dissolve into droplets and petals carried away on the wind
function burst(c, x, y, age, seed, k = 1, wind = 1) {
  if (age < 0 || age > 2.2) return;
  splat(c, seed, x, y, k * (.25 + .5 * eo(clamp(age * 5))), clamp(1 - age / 1.1) * .95, seed);
  c.save(); c.fillStyle = INK;
  const tt = (1 - Math.exp(-age * 3)) / 3;
  for (let i = 0; i < 46; i++) {
    const a = hash(i * 1.7 + seed) * TAU, v = (300 + hash(i * 2.3 + seed) * 900) * k;
    const px = x + Math.cos(a) * v * tt + wind * 260 * age * age * k, py = y + Math.sin(a) * v * tt * .8 + 160 * age * age * k;
    const r = (3 + hash(i * 4.1 + seed) * 12) * k * clamp(1 - age / 2.2);
    c.globalAlpha = clamp(1 - age / 2);
    if (i % 5 === 0) { c.save(); c.translate(px, py); c.rotate(age * 5 + i); c.fillStyle = '#3a3532'; c.beginPath(); c.ellipse(0, 0, r * 1.4, r * .6, 0, 0, TAU); c.fill(); c.restore(); }
    else { c.beginPath(); c.arc(px, py, r, 0, TAU); c.fill(); }
  }
  c.restore();
}
function spark(c, x, y, age, k = 1) {
  if (age < 0 || age > .45) return;
  const a = 1 - age / .45, R = 60 + 260 * eo(clamp(age / .3));
  c.save(); c.lineCap = 'round';
  for (let i = 0; i < 14; i++) {
    const an = hash(i * 3.3) * TAU, r0 = R * (.15 + hash(i) * .2), r1 = R * (.6 + hash(i * 7) * .6);
    c.strokeStyle = `rgba(19,17,15,${a})`; c.lineWidth = 7 * k;
    c.beginPath(); c.moveTo(x + Math.cos(an) * r0 * k, y + Math.sin(an) * r0 * k); c.lineTo(x + Math.cos(an) * r1 * k, y + Math.sin(an) * r1 * k); c.stroke();
    c.strokeStyle = `rgba(250,246,236,${a})`; c.lineWidth = 2.5 * k; c.stroke();
  }
  c.globalAlpha = a * .9; c.fillStyle = '#faf6ec'; c.beginPath(); c.arc(x, y, 26 * k * (1 + age * 3), 0, TAU); c.fill();
  c.strokeStyle = `rgba(19,17,15,${a * .6})`; c.lineWidth = 4; c.beginPath(); c.arc(x, y, R * 1.1 * k, 0, TAU); c.stroke();
  c.restore();
}
function arcSlash(c, x, y, r, a0, a1, w, prog, alpha, seed = 2, squash = 1) {
  if (alpha <= 0 || prog <= 0) return;
  const pts = [];
  for (let i = 0; i <= 14; i++) { const a = lerp(a0, a1, i / 14); pts.push([x + Math.cos(a) * r, y + Math.sin(a) * r * squash]); }
  brush(c, pts, { w, prog, alpha, seed, ts: .05, te: .75, dry: .5, rough: .25, res: 50, bristles: 9 });
}
function ghosts(c, fnAt, t0, t1, n = 5) {
  for (let i = 1; i <= n; i++) { const f = fnAt(lerp(t0, t1, i / (n + 1))); f.alpha = .1 + .12 * i / n; drawFigure(c, f); }
}
function caption(c, num, word, alpha) {
  if (alpha <= 0) return;
  c.save(); c.globalAlpha = alpha * .85; c.fillStyle = INK; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.font = `500 30px ${JFONT}`; c.fillText(num, 1830, 92);
  c.font = `600 54px ${JFONT}`; c.fillText(word, 1830, 160);
  c.globalAlpha = alpha * .9; c.drawImage(A.seal, 1812, 205, 36, 36);
  c.restore();
}
function redSun(c, x, y, r, alpha) {
  if (alpha <= 0) return;
  c.save(); c.globalAlpha *= alpha;
  const g = c.createRadialGradient(x, y, r * .6, x, y, r * 1.08);
  g.addColorStop(0, 'rgba(181,41,31,.92)'); g.addColorStop(.85, 'rgba(181,41,31,.85)'); g.addColorStop(1, 'rgba(181,41,31,0)');
  c.fillStyle = g; c.beginPath(); c.arc(x, y, r * 1.08, 0, TAU); c.fill();
  c.restore();
}
function groundLine(c, y, x0, x1, seed, wash = .22) {
  const g = c.createLinearGradient(0, y - 10, 0, y + 260);
  g.addColorStop(0, `rgba(19,17,15,${wash})`); g.addColorStop(1, `rgba(19,17,15,${wash * .15})`);
  c.fillStyle = g; c.fillRect(x0, y - 4, x1 - x0, 1200);
  const pts = []; for (let x = x0; x <= x1; x += 160) pts.push([x, y + vnoise(x * .004 + seed) * 6]);
  brush(c, pts, { w: 13, seed, ts: .02, te: .1, dry: .35, rough: .3, res: 60 });
}
