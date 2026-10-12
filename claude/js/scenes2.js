'use strict';
// ===== Scenes II: battle, the warlord, the fallen blossom, the single stroke, return =====
function rainAt(t) {
  if (t < 25.5) return 0;
  if (t < 40) return clamp(seg(t, 25.5, 28) * .55 + seg(t, 29, 31.5) * .45);
  if (t < 45) return t < 41.5 ? .9 : 0;
  if (t < 49.5) return .9 * (1 - seg(t, 47.5, 49.3));
  return 0;
}
function stormBg(c, cm, amt, dy = 0) {
  par(c, A.far, cm, .12, -40 + dy); par(c, A.mid, cm, .3, dy);
  storm(c, NOW, amt);
  mist(c, NOW, 640 + dy, .7, 30, 14);
}
const center = (f, J) => toWorld(f, J, add(J.hip, J.td, .16));
function cutLine(c, f, J, prog, alpha = 1, ang = .45) {
  if (prog <= 0) return;
  const m = center(f, J), r = f.s * .32;
  brush(c, [[m[0] - Math.cos(ang) * r, m[1] - Math.sin(ang) * r], [m[0] + Math.cos(ang) * r, m[1] + Math.sin(ang) * r]], { w: f.s * .028, color: PAPER, prog, alpha, ts: .15, te: .5, seed: 5 });
}

// --- 4: Battle (24–30.5s)
function heroS4(u) {
  let x = 700, face = 1, P = pose('iai');
  if (u >= 1.3 && u < 1.42) { x = lerp(700, 1250, eo(seg(u, 1.3, 1.42))); P = pose('follow'); }
  else if (u >= 1.42 && u < 2.7) { x = 1250; P = mixP(pose('follow'), pose('guard'), eio(seg(u, 1.9, 2.3))); }
  else if (u >= 2.7 && u < 3.95) { x = 1250; P = mixP(pose('guard'), pose('upcut'), eo(seg(u, 2.7, 2.8))); if (u > 3.2) P = mixP(pose('upcut'), pose('guard'), eio(seg(u, 3.2, 3.7))); }
  else if (u >= 3.95) { x = 1250; face = -1; P = mixP(pose('follow'), pose('chiburi'), eio(seg(u, 4.4, 4.9))); if (u > 5.5) P = mixP(P, pose('guard'), eio(seg(u, 5.5, 6.1))); }
  return { x, y: 880, s: 400, face, kind: 'hero', hat: true, blossom: true, wind: -.6 * face, seed: 1, pose: P };
}
function gruntS4(i, u) {
  let x, P, lift = 0, face = -1;
  if (i === 0) { x = u < 1.3 ? lerp(1650, 1010, seg(u, 0, 1.3)) : 1010; P = u < 1.3 ? walkP(pose('spear'), u * 9, 1.4) : pose('spear', { lean: .05, head: .3 }); }
  else if (i === 1) {
    x = lerp(1950, 1440, seg(u, .3, 2.25)); P = walkP(pose('spear'), u * 9 + 2, 1.4);
    if (u >= 2.25) { x = lerp(1440, 1400, eo(seg(u, 2.25, 2.45))); P = pose('spear', { lean: .5, aF: 1.4, fF: 1.55, tF: 1.0, sF: .1, tB: -.9, sB: -1.3 }); }
  } else {
    face = 1; x = lerp(-150, 820, seg(u, 1.6, 3.2)); P = walkP(pose('spear', { swA: -.2 }), u * 9 + 4, 1.4);
    if (u >= 3.2) { const k = seg(u, 3.2, 4.0); x = lerp(820, 1120, k); lift = Math.sin(Math.min(k, 1) * Math.PI * .85) * 330; P = pose('spearUp'); }
  }
  return { x, y: 880, s: 340, face, kind: 'grunt', seed: 30 + i, wind: .6, lift, pose: P };
}
const DEATH4 = [1.33, 2.72, 3.98];
function sceneBattle(c, lt) {
  const u = lt;
  const cm = { x: 1000 + 220 * eo(seg(u, 1.2, 1.8)), y: 600, z: 1.02 + .16 * punch(u, 1.3, 3) + .12 * punch(u, 2.7, 3) + .15 * punch(u, 3.95, 3) + u * .01 };
  FX.shake = .7 * punch(u, 1.3, 6) + .5 * punch(u, 2.45, 7) + .45 * punch(u, 2.72, 6) + .7 * punch(u, 3.98, 6);
  FX.flash = .55 * punch(u, 1.3, 16) + .45 * punch(u, 3.95, 16);
  stormBg(c, cm, .78);
  cam(c, cm.x, cm.y, cm.z);
  groundLine(c, 880, -400, 2600, 21, .3);
  const hero = heroS4(u);
  // grunts
  for (let i = 0; i < 3; i++) {
    const g = gruntS4(i, u), d = DEATH4[i], J = geo(g);
    if (u > d + .35) { const m = center(g, J); burst(c, m[0], m[1] - (g.lift || 0) * 0, u - d - .35, i + 1, 1.1, -hero.face); g.alpha = 1 - seg(u, d + .35, d + .75); }
    if (i === 2 && u < 1.6) continue;
    if (g.alpha === undefined || g.alpha > 0) { drawFigure(c, g); cutLine(c, g, J, seg(u, d, d + .12), 1, i === 1 ? -.9 : .45); }
  }
  // dash smear & ghosts
  if (u > 1.3 && u < 1.9) {
    const a = 1 - seg(u, 1.42, 1.9);
    brush(c, [[680, 880 - 230], [980, 880 - 250], [1240, 880 - 240]], { w: 70, alpha: a * .8, seed: 8, ts: .6, te: .1, dry: .8, prog: seg(u, 1.3, 1.42), bristles: 12 });
    for (let i = 1; i <= 4; i++) { const f = heroS4(lerp(1.3, 1.42, i / 5)); f.alpha = a * .14 * i; drawFigure(c, f); }
  }
  drawFigure(c, hero);
  const Jh = geo(hero), tip = toWorld(hero, Jh, Jh.tip);
  spark(c, tip[0] - 60, tip[1] + 20, u - 2.45, 1);
  arcSlash(c, 1250 + 60, 880 - 230, 250, 1.1, -1.7, 46, eo(seg(u, 2.7, 2.82)), 1 - seg(u, 2.95, 3.5), 12);
  arcSlash(c, 1250, 880 - 220, 300, -.4, -.4 - TAU * .93, 40, eo(seg(u, 3.92, 4.1)), 1 - seg(u, 4.25, 4.9), 13, .55);
  if (u > 4.75) for (let i = 0; i < 16; i++) { const p = seg(u, 4.75 + i * .012, 4.85 + i * .012); if (p > 0) blob(c, 1180 - i * 26 - hash(i) * 10, 882 + hash(i * 3) * 6, (4 + hash(i * 7) * 7) * p, INK, i); }
  c.restore();
  rain(c, NOW, rainAt(NOW), -.35);
  petals(c, NOW * 1.4, 10, 1.2, 0, .7, 11);
}

// --- 5: The warlord (30.5–40s)
function heroS5(v) {
  let x = 820, P = pose('guard'), rot = 0;
  if (v >= 2.0 && v < 2.4) { const k = eio(seg(v, 2.0, 2.4)); x = lerp(820, 1000, k); P = mixP(pose('guard'), pose('block'), k); }
  else if (v >= 2.4 && v < 3.3) { x = lerp(1000, 960, seg(v, 2.4, 3.3)); P = pose('block'); }
  else if (v >= 3.3 && v < 3.8) { x = 960; P = mixP(pose('block'), pose('duck'), eo(seg(v, 3.3, 3.45))); }
  else if (v >= 3.8) { const k = eo(seg(v, 3.8, 4.35)); x = lerp(960, 640, k); P = mixP(pose('duck'), pose('knocked'), eo(seg(v, 3.8, 4.4))); rot = -Math.sin(seg(v, 3.8, 4.4) * Math.PI) * .3; }
  return { x, y: 900, s: 420, face: 1, kind: 'hero', hat: v < 3.42, wind: -.9, seed: 1, rot, pose: P, blossom: v < 4.4 };
}
function lordS5(v) {
  let x = 1260, P = pose('strike');
  if (v < 2.0) { x = lerp(1760, 1450, seg(v, 0, 2.0)); P = walkP(pose('lowblade'), (1760 - x) / (560 * STRIDE) * TAU, .75); }
  else if (v < 2.4) { const k = seg(v, 2.0, 2.4); x = lerp(1450, 1260, eio(k)); P = k < .5 ? mixP(pose('lowblade'), pose('raised'), eio(k * 2)) : mixP(pose('raised'), pose('strike'), eio(k * 2 - 1)); }
  else if (v < 3.3) { x = lerp(1260, 1220, seg(v, 2.4, 3.3)); }
  else if (v < 3.8) { x = 1220; P = mixP(pose('strike'), pose('sweep'), eo(seg(v, 3.3, 3.45))); }
  else if (v < 4.8) { x = lerp(1220, 1180, eo(seg(v, 3.8, 4.1))); P = mixP(pose('strike', { lean: .55 }), pose('lowblade'), eio(seg(v, 4.0, 4.8))); }
  else if (v < 8.0) { x = lerp(1180, 980, seg(v, 4.8, 8.0)); P = walkP(pose('lowblade'), (1180 - x) / (560 * STRIDE) * TAU, .6); }
  else { x = 980; P = mixP(pose('lowblade'), pose('raised'), eio(seg(v, 8.0, 9.2))); }
  return { x, y: 900, s: 560, face: -1, kind: 'lord', wind: -.9, seed: 40, pose: P };
}
function hatHalf(c, x, y, s, rot, side) {
  c.save(); c.translate(x, y); c.rotate(rot); c.scale(s, s); c.fillStyle = INK; c.beginPath();
  if (side < 0) { c.moveTo(-.2, .005); c.quadraticCurveTo(-.07, -.06, 0, -.1); c.lineTo(.0, .02); }
  else { c.moveTo(0, -.1); c.quadraticCurveTo(.07, -.06, .21, .018); c.lineTo(0, .02); }
  c.closePath(); c.fill(); c.restore();
}
function sceneWarlord(c, lt) {
  const v = lt;
  const cm = { x: lerp(1150, 1000, eio(seg(v, 4.5, 9.5))), y: lerp(560, 520, seg(v, 5, 9.5)), z: (v < 4.5 ? .97 : lerp(.97, 1.2, eio(seg(v, 4.5, 9.5)))) + .2 * punch(v, 2.4, 2.5) + .08 * punch(v, 3.8, 4) };
  FX.shake = 1.0 * punch(v, 2.4, 5) + .3 * bell(v, 2.4, 3.3) * .4 + .7 * punch(v, 3.8, 5) + .2 * punch(v, 7.2, 3);
  FX.flash = .7 * punch(v, 2.4, 14) + .9 * punch(v, 7.2, 6) + .5 * punch(v, 7.45, 9);
  stormBg(c, cm, .85 - .5 * punch(v, 7.2, 4));
  cam(c, cm.x, cm.y, cm.z, v > 5 ? -.02 * seg(v, 5, 9) : 0);
  groundLine(c, 900, -400, 2600, 31, .32);
  // puddle glints
  c.save(); c.strokeStyle = 'rgba(236,228,211,.35)'; c.lineWidth = 3;
  for (let i = 0; i < 14; i++) { const x = hash(i * 3.3) * 2200 - 200, y = 925 + hash(i * 5.1) * 120, l = 40 + hash(i) * 120; c.beginPath(); c.moveTo(x, y); c.lineTo(x + l, y); c.stroke(); }
  c.restore();
  const hero = heroS5(v), lord = lordS5(v);
  drawFigure(c, lord);
  drawFigure(c, hero);
  const Jh = geo(hero), Jl = geo(lord);
  const hTip = toWorld(hero, Jh, add(Jh.hF, Jh.sd, .3));
  spark(c, hTip[0], hTip[1], v - 2.4, 1.4);
  if (v > 2.5 && v < 3.3) spark(c, hTip[0] + 10, hTip[1] - 5, (v - 2.5) % .3, .5);
  if (v > 3.3 && v < 3.7) arcSlash(c, 1150, 900 - 410, 320, -2.4, -.9, 40, eo(seg(v, 3.3, 3.42)), 1 - seg(v, 3.45, 3.7), 21, .35);
  if (v >= 3.42 && v < 5.5) { // the kasa is cut in two
    const k = v - 3.42, h0 = toWorld(heroS5(3.42), geo(heroS5(3.42)), geo(heroS5(3.42)).head);
    hatHalf(c, h0[0] - 140 * k, h0[1] - 420 * k + 520 * k * k, 420, -k * 5, -1);
    hatHalf(c, h0[0] + 120 * k + 40, h0[1] - 560 * k + 620 * k * k, 420, k * 7, 1);
  }
  if (v > 3.8) splat(c, 2, 900, 900 - 260, .45 * eo(seg(v, 3.8, 3.95)), 1 - seg(v, 4.0, 4.8), 1);
  // the blossom falls
  const b0 = toWorld(heroS5(4.39), geo(heroS5(4.39)), geo(heroS5(4.39)).obiF);
  if (v >= 4.4) {
    const p = seg(v, 4.4, 6.8), x = b0[0] + 70 * p + Math.sin(p * 9) * 30 * (1 - p), y = lerp(b0[1], 896, p < 1 ? 1 - Math.pow(1 - p, 1.4) : 1);
    drawBlossom(c, x, y, 13, Math.sin(p * 7) * 1.5, 1, false);
  }
  c.restore();
  rain(c, NOW, rainAt(NOW), -.4);
  if (v > 7.2 && v < 7.6) { c.save(); c.globalAlpha = .9 * (1 - seg(v, 7.2, 7.6)); brush(c, [[1300, 0], [1240, 160], [1290, 260], [1200, 420]], { w: 9, color: PAPER, seed: 33, ts: .1, te: .8 }); c.restore(); }
  caption(c, '四', '嵐', bell(v, 0, 2.2));
}

// --- 6: Transformation (40–45s)
function sceneAwaken(c, lt) {
  const w = lt;
  if (w < 1.7) {
    const fz = Math.min(w, 1.5), z = 1 + w * .05;
    cam(c, 960, 600, z);
    const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, 'rgba(19,17,15,.5)'); g.addColorStop(1, 'rgba(19,17,15,.22)');
    c.fillStyle = g; c.fillRect(-200, -200, W + 400, H + 400);
    c.fillStyle = 'rgba(19,17,15,.5)'; c.beginPath(); c.ellipse(960, 660, 760, 250, 0, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(236,228,211,.25)'; c.lineWidth = 4;
    for (let i = 0; i < 9; i++) { const y = 520 + i * 30, x = 500 + hash(i) * 600; c.beginPath(); c.moveTo(x, y); c.lineTo(x + 200 + hash(i * 3) * 300, y); c.stroke(); }
    for (let i = 0; i < 9; i++) {
      const b = (i * .37 + hash(i) * .6) % 1.4, age = fz - b;
      if (age < 0) continue;
      const x = 560 + hash(i * 4.4) * 800, y = 560 + hash(i * 2.2) * 200, r = age * 320;
      c.strokeStyle = `rgba(236,228,211,${.55 * clamp(1 - age / 1.2)})`; c.lineWidth = 3;
      c.beginPath(); c.ellipse(x, y, r, r * .3, 0, 0, TAU); c.stroke();
      c.beginPath(); c.ellipse(x, y, r * .6, r * .18, 0, 0, TAU); c.stroke();
    }
    const by = 640 + Math.sin(fz * 3) * 4;
    c.save(); c.translate(960, by + 70); c.scale(1, -.45); drawBlossom(c, 0, 0, 100, .3, .25); c.restore();
    drawBlossom(c, 960, by, 100, .3 + fz * .05, 1);
    c.restore();
    rain(c, 40 + fz, .9, -.3, w > 1.5 ? .25 : 1, 'rgba(236,228,211,.45)');
    FX.letter = .6;
    return;
  }
  const w2 = w - 1.7;
  const cm = { x: 960, y: 560, z: lerp(1.08, 1.0, eio(seg(w2, 0, 3.3))) };
  par(c, A.far, cm, .1, -40, lerp(.8, .3, seg(w2, 0, 1.5)));
  storm(c, 41.5, lerp(.8, .08, eo(seg(w2, 0, 1.6))));
  cam(c, cm.x, cm.y, cm.z);
  redSun(c, 960, 520, 210, seg(w2, .9, 2.0));
  enso(c, 960, 600, 360, 56, eio(seg(w2, .3, 1.8)), 17);
  groundLine(c, 900, -300, 2300, 44, lerp(.3, .12, seg(w2, 0, 1.5)));
  const P = mixP(pose('kneel', { head: .4 }), pose('iai'), eio(seg(w2, 2.0, 2.9)));
  drawFigure(c, { x: 930, y: 900, s: 430, face: 1, kind: 'hero', seed: 1, wind: -.6 * seg(w2, 1.6, 2.6), blossom: true, pose: P });
  for (let i = 0; i < 16; i++) {
    const a = i * .7 + w2 * (1.2 + hash(i) * .6), rr = 220 + hash(i * 3) * 220, y = 900 - ((w2 * (120 + hash(i * 5) * 120) + i * 40) % 700);
    c.save(); c.globalAlpha = seg(w2, .6 + i * .05, 1.2 + i * .05) * (1 - seg(w2, 3.0, 3.3)); c.translate(930 + Math.cos(a) * rr, y); c.rotate(a * 2);
    c.fillStyle = RED; c.beginPath(); c.ellipse(0, 0, 9, 4, 0, 0, TAU); c.fill(); c.restore();
  }
  c.restore();
  rain(c, 41.5, .9 * (1 - seg(w2, 0, 1.2)), -.3, .15, 'rgba(38,34,31,.5)');
  caption(c, '五', '心', bell(w2, .4, 3.0));
}

// --- 7: Climax — one stroke (45–49.5s)
function sceneStroke(c, lt) {
  const k = lt;
  if (k < .6) {
    const cm = { x: 1100, y: 560, z: 1 + k * .08 };
    stormBg(c, cm, .9); redSun(c, 960, 420, 170, .25);
    cam(c, cm.x, cm.y, cm.z);
    groundLine(c, 900, -400, 2600, 51, .32);
    const x = lerp(1600, 1180, seg(k, 0, .6));
    drawFigure(c, { x, y: 900, s: 560, face: -1, kind: 'lord', seed: 40, wind: -1, pose: walkP(pose('raised', { lean: .2 }), k * 9, 1.3) });
    drawFigure(c, { x: 760, y: 900, s: 420, face: 1, kind: 'hero', seed: 1, wind: -.9, blossom: true, pose: pose('iai') });
    c.restore();
    rain(c, NOW, .9, -.4);
    return;
  }
  if (k < 1.05) {
    FX.shake = .5 * punch(k, .62, 5);
    brush(c, [[-200, 580], [600, 540], [1300, 556], [2150, 520]], { w: 190, prog: eio(seg(k, .62, .86)), seed: 61, ts: .03, te: .35, dry: .5, splat: 40, bleed: 14, bristles: 14, rough: .25, res: 80 });
    return;
  }
  const cm = { x: 1150, y: 560, z: 1.0 + (k - 1.05) * .02 };
  stormBg(c, cm, lerp(.9, .3, seg(k, 3.0, 4.4)));
  redSun(c, 960, 420, 170, .25 + .5 * seg(k, 3.0, 4.4));
  brush(c, [[-200, 580], [600, 540], [1300, 556], [2150, 520]], { w: 190, seed: 61, ts: .03, te: .35, dry: .5, alpha: .9 * (1 - eo(seg(k, 1.05, 1.9))), rough: .25, res: 80 });
  cam(c, cm.x, cm.y, cm.z);
  groundLine(c, 900, -400, 2600, 51, .3);
  const lord = { x: 1000, y: 900, s: 560, face: -1, kind: 'lord', seed: 40, wind: .4, pose: pose('strike'), crack: seg(k, 2.0, 2.35), hornless: k > 2.5, alpha: 1 - seg(k, 2.6, 3.2) };
  const Jl = geo(lord);
  if (lord.alpha > 0) { drawFigure(c, lord); cutLine(c, lord, Jl, seg(k, 1.05, 1.15), 1, .08); }
  if (k > 2.5) for (let i = 0; i < 2; i++) {
    const q = k - 2.5, hp = toWorld(lord, Jl, Jl.head), x = hp[0] + (i ? 60 : -40) * q * 3, y = hp[1] - 150 + 200 * q + 900 * q * q;
    if (y < 900) brush(c, [[x, y], [x + 30, y - 50], [x + 10, y - 90]], { w: 12, seed: 70 + i, ts: .1, te: .8, alpha: 1 - seg(q, .6, .9) });
  }
  const m = center(lord, Jl); burst(c, m[0], m[1], k - 2.6, 3, 1.7, 1.6);
  if (k > 2.6) petals(c, (k - 2.6) * 2 + 3, 30, 2.5, .15, clamp(1 - (k - 2.6) / 1.8), 40);
  let P = pose('follow');
  if (k > 3.2) P = mixP(pose('follow'), pose('chiburi'), eio(seg(k, 3.2, 3.55)));
  if (k > 3.75) P = mixP(pose('chiburi'), pose('stand', { hilt: 1, head: .2 }), eio(seg(k, 3.75, 4.3)));
  drawFigure(c, { x: 1450, y: 900, s: 420, face: 1, kind: 'hero', seed: 1, wind: -.5, blossom: true, pose: P });
  c.restore();
  const rt = k < 2.0 ? 46.05 : 46.05 + (k - 2.0);
  rain(c, rt, rainAt(NOW), -.4, k < 2.0 ? .2 : 1);
  FX.flash = .9 * punch(k, 1.05, 8);
}

// --- 8: Resolution (49.5–58s)
function sceneReturn(c, lt) {
  const r = lt;
  if (r < 4.2) {
    const cm = { x: 960, y: 560, z: lerp(1.04, 1.1, seg(r, 0, 4.2)) };
    par(c, A.far, cm, .1, -40, .75);
    redSun(c, 1420, 360, 110, .9 * seg(r, 0, 1.5));
    mist(c, r + 60, 380, .8, 20, 17, 6, 150);
    par(c, A.mid, cm, .25, 30, .55);
    mist(c, r + 10, 700, .8, 30, 19);
    cam(c, cm.x, cm.y, cm.z);
    groundLine(c, 905, -300, 2300, 55, .15);
    tree(c, 330, 915, .95, Math.sin(r * 1.1) * .008);
    grass(c, -300, 2300, () => 905, r, .25, 6, 30);
    let cx = lerp(520, 880, seg(r, .2, 1.5)), CP = r < 1.5 ? walkP(pose('stand', { lean: .25 }), (cx - 520) / (120 * STRIDE) * TAU, 1.2) : pose('stand', { head: -.2 });
    if (r > 3.1) CP = mixP(CP, pose('stand', { lean: .35, head: .35 }), bell(r, 3.1, 3.9));
    let HP = pose('stand', { hilt: 1, head: .1 });
    if (r > 1.4) HP = mixP(HP, pose('kneel', { head: .1 }), eio(seg(r, 1.4, 2.1)));
    if (r > 2.1) HP = mixP(HP, pose('kneel', { hilt: 0, head: .05, aF: 1.6, fF: 2.2 }), eio(seg(r, 2.1, 2.6)));
    if (r > 3.0) HP = mixP(HP, pose('stand', { hilt: 1, head: .3 }), eio(seg(r, 3.0, 3.8)));
    const ch = { x: cx, y: 905, s: 190, face: 1, kind: 'child', seed: 7, wind: .25, pose: CP, hairBlossom: r > 3.0 };
    const he = { x: 1080, y: 905, s: 360, face: -1, kind: 'hero', seed: 1, wind: .25, pose: HP, blossom: r < 2.2 };
    drawFigure(c, he); const Jc = drawFigure(c, ch);
    if (r >= 2.2 && r < 3.0) {
      const Jh = geo(he), a = toWorld(he, Jh, Jh.obiF), b = toWorld(ch, Jc, add(Jc.head, [-.06, -.06]));
      const p = eio(seg(r, 2.2, 3.0)), mid = [lerp(a[0], b[0], .5), Math.min(a[1], b[1]) - 60];
      const q = [lerp(lerp(a[0], mid[0], p), lerp(mid[0], b[0], p), p), lerp(lerp(a[1], mid[1], p), lerp(mid[1], b[1], p), p)];
      drawBlossom(c, q[0], q[1], 10, p * 3, 1, false);
    }
    c.restore();
    petals(c, r + 70, 14, .3, .1, 1, 6);
    caption(c, '六', '帰', bell(r, .3, 4.0));
    return;
  }
  const q = r - 4.2, cm = { x: lerp(1060, 960, eio(seg(q, 0, 3.4))), y: 540, z: lerp(1.15, .94, eio(seg(q, 0, 3.4))) };
  par(c, A.far, cm, .15, -30, .8);
  redSun(c, 640, 300, 95, .85);
  mist(c, r + 5, 470, .9, 25, 3);
  par(c, A.mid, cm, .35, 20, .8);
  mist(c, r + 7, 680, .9, 40, 9);
  cam(c, cm.x, cm.y, cm.z);
  const pts = []; for (let x = -400; x <= 2400; x += 100) pts.push([x, hillY(x)]);
  const g = c.createLinearGradient(0, 760, 0, 1100); g.addColorStop(0, 'rgba(19,17,15,.28)'); g.addColorStop(1, 'rgba(19,17,15,.06)');
  c.fillStyle = g; c.beginPath(); c.moveTo(-400, 1300); for (const p of pts) c.lineTo(p[0], p[1]); c.lineTo(2400, 1300); c.fill();
  brush(c, pts, { w: 16, seed: 41, ts: .02, te: .1, dry: .35, rough: .3, res: 80 });
  tree(c, 1530, hillY(1530) + 8, .5, Math.sin(r * 1.4) * .012);
  grass(c, -300, 2300, hillY, r, .3, 2, 34);
  drawFigure(c, { x: 1430, y: hillY(1430), s: 105, face: -1, kind: 'child', seed: 7, wind: .3, hairBlossom: true, pose: pose('stand', { aF: 2.7 + Math.sin(r * 9) * .35, fF: 3.0 + Math.sin(r * 9) * .3 }) });
  const x = lerp(1300, 420, seg(q, 0, 4.3));
  drawFigure(c, { x, y: hillY(x), s: 190, face: -1, kind: 'hero', seed: 1, wind: .5, pose: walkP(pose('stand', { hilt: 1, lean: .06 }), (1300 - x) / (190 * STRIDE) * TAU) });
  c.restore();
  petals(c, r + 90, 16, -.4, .12, 1, 8);
  mist(c, r * 1.4 + 3, 1000, .55, 60, 21, 5, 160);
  // fade to paper, then the closing seal
  const fade = eio(seg(r, 6.4, 7.3));
  if (fade > 0) { c.save(); c.globalAlpha = fade; c.drawImage(A.paper, 0, 0); c.restore(); }
  const s = seg(r, 7.0, 7.25);
  if (s > 0) { const k = lerp(1.6, 1, eo(s)); c.save(); c.globalAlpha = s; c.translate(960, 470); c.scale(k, k); c.drawImage(A.sealEnd, -110, -110, 220, 220); c.restore(); }
  const tA = seg(r, 7.4, 8.1);
  if (tA > 0) {
    c.save(); c.globalAlpha = tA; c.fillStyle = INK; c.textAlign = 'center';
    c.font = `600 54px ${JFONT}`; c.fillText('最後の花', 960, 680);
    c.globalAlpha = tA * .75; c.font = `400 28px ${EFONT}`; c.fillText('T H E    L A S T    B L O S S O M', 960, 735);
    c.restore();
  }
}
