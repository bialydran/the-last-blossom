'use strict';
// ===== Scenes I: title, journey, the blossom, the shadow =====
function tree(c, x, y, sc, sway = 0, alpha = 1) {
  c.save(); c.globalAlpha *= alpha; c.translate(x, y); c.rotate(sway); c.scale(sc, sc); c.drawImage(A.tree, -700, -1150); c.restore();
}

// --- 0: Title (0–5s)
function sceneTitle(c, lt) {
  petals(c, lt + 3, 22, .5, 0, seg(lt, .2, 1.5));
  const cx = 960, cy = 470;
  enso(c, cx, cy, 250, 46, eo(seg(lt, .3, 2.0)), 11);
  const a = seg(lt, 1.2, 2.6);
  if (a > 0) {
    c.save(); c.fillStyle = INK; c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = `600 128px ${JFONT}`;
    if (HASFILTER) { c.filter = `blur(${(1 - a) * 14 + 2}px)`; c.globalAlpha = a * .45; c.fillText('最後の花', cx, cy); c.filter = 'none'; }
    c.globalAlpha = a; c.fillText('最後の花', cx, cy); c.restore();
  }
  const b = seg(lt, 2.2, 3.4);
  if (b > 0) {
    c.save(); c.globalAlpha = b; c.fillStyle = '#2b2724'; c.textAlign = 'center'; c.font = `400 36px ${EFONT}`;
    c.fillText('T H E    L A S T    B L O S S O M', cx, 800);
    c.globalAlpha = b * .6; c.font = `italic 400 24px ${EFONT}`; c.fillText('a tale in ink', cx, 850); c.restore();
  }
  const s = seg(lt, 3.0, 3.25);
  if (s > 0) { const k = lerp(1.7, 1, eo(s)); c.save(); c.globalAlpha = s; c.translate(1245, 590); c.scale(k, k); c.drawImage(A.seal, -40, -40, 80, 80); c.restore(); }
  drawBlossom(c, cx + 205, cy - 150, 18, lt * .3, seg(lt, 2.0, 2.8), false);
}

// --- 1: Journey (5–12s)
const hillY = x => 905 - 150 * Math.exp(-Math.pow((x - 1500) / 620, 2));
function sceneJourney(c, lt) {
  const e = eio(seg(lt, 0, 7)), cm = { x: lerp(880, 1080, e), y: 540, z: lerp(1, 1.08, e) };
  const fin = k => eo(seg(lt, k, k + 1.3));
  par(c, A.far, cm, .15, -30, fin(0));
  mist(c, lt, 470, fin(0) * .9, 25, 3);
  par(c, A.mid, cm, .35, 20, fin(.3));
  for (let i = 0; i < 3; i++) { const bx = 1500 - lt * (95 + i * 12) - i * 70, by = 230 + i * 28 + Math.sin(lt * 2 + i) * 8; bird(c, bx, by, 16 - i * 3, lt * 9 + i * 2); }
  mist(c, lt + 7, 680, fin(.3), 40, 9);
  cam(c, cm.x, cm.y, cm.z);
  c.save(); c.globalAlpha = fin(.7);
  const pts = []; for (let x = -400; x <= 2400; x += 100) pts.push([x, hillY(x)]);
  const g = c.createLinearGradient(0, 760, 0, 1100); g.addColorStop(0, 'rgba(19,17,15,.28)'); g.addColorStop(1, 'rgba(19,17,15,.06)');
  c.fillStyle = g; c.beginPath(); c.moveTo(-400, 1300); for (const p of pts) c.lineTo(p[0], p[1]); c.lineTo(2400, 1300); c.fill();
  brush(c, pts, { w: 16, seed: 41, ts: .02, te: .1, dry: .35, rough: .3, res: 80 });
  tree(c, 1530, hillY(1530) + 8, .5, Math.sin(lt * 1.4) * .012);
  grass(c, -300, 2300, hillY, lt, -.5, 2, 34);
  c.restore();
  const x = lerp(260, 1020, lt / 7), s = 190;
  const f = { x, y: hillY(x), s, face: 1, kind: 'hero', hat: true, wind: -.85, seed: 1, pose: walkP(pose('stand', { hilt: 1, lean: .1, aB: -.1 }), x / (s * STRIDE) * TAU) };
  f.alpha = fin(1.0); drawFigure(c, f);
  c.restore();
  petals(c, lt + 20, 18, -.7, 0, fin(1));
  mist(c, lt * 1.4 + 3, 1000, .55, 60, 21, 5, 160);
  caption(c, '一', '旅', bell(lt, 1.4, 6.4));
}

// --- 2: The blossom (12–18s)
function childS2(lt) {
  let x = 760, P = pose('seiza', { head: .25 }), hb = 0;
  if (lt >= 2.4 && lt < 3.0) P = mixP(pose('seiza'), pose('stand'), eio(seg(lt, 2.4, 3.0)));
  else if (lt >= 3.0 && lt < 3.9) { x = lerp(760, 930, seg(lt, 3.0, 3.9)); P = walkP(pose('stand'), (x - 760) / (120 * STRIDE) * TAU, .8); }
  else if (lt >= 3.9) { x = 930; P = mixP(pose('stand'), pose('offer'), eio(seg(lt, 3.9, 4.4))); if (lt > 5.1) P = mixP(pose('offer'), pose('stand', { head: .3, aF: .3, fF: .9 }), eio(seg(lt, 5.1, 5.7))); }
  return { x, y: 905, s: 190, face: 1, kind: 'child', wind: .3, seed: 7, pose: P };
}
function heroS2(lt) {
  let x = 1080, P = pose('stand', { hilt: 1, head: .05 });
  if (lt < 1.9) { x = lerp(1520, 1080, seg(lt, 0, 1.9)); P = walkP(pose('stand', { hilt: 1, lean: .08 }), (1520 - x) / (360 * STRIDE) * TAU); }
  else if (lt >= 2.6) {
    P = mixP(pose('stand', { hilt: 1 }), pose('kneel', { head: .1 }), eio(seg(lt, 2.6, 3.4)));
    if (lt > 4.2) P = mixP(P, pose('kneel', { hilt: 0, head: .15, aF: 1.25, fF: 1.45 }), eio(seg(lt, 4.2, 4.7)));
    if (lt > 5.0) P = mixP(P, pose('kneel', { head: .45 }), eio(seg(lt, 5.0, 5.6)));
  }
  return { x, y: 905, s: 360, face: -1, kind: 'hero', hat: true, wind: .35, seed: 1, pose: P };
}
function sceneBond(c, lt) {
  const e = eio(seg(lt, 0, 6)), cm = { x: lerp(940, 990, e), y: lerp(540, 600, e), z: lerp(1, 1.13, e) };
  par(c, A.far, cm, .12, -60, 1);
  mist(c, lt + 30, 420, .9, 20, 5);
  cam(c, cm.x, cm.y, cm.z);
  house(c, 1640, 905, 1, .75);
  groundLine(c, 905, -300, 2300, 12, .16);
  tree(c, 480, 915, 1.0, Math.sin(lt * 1.1) * .008);
  grass(c, -300, 2300, () => 905, lt, .3, 5, 30);
  const ch = childS2(lt), he = heroS2(lt);
  const Jh = geo(he), Jc = geo(ch);
  // the blossom changes hands
  const cHand = toWorld(ch, Jc, Jc.hF), hHand = toWorld(he, Jh, Jh.hF), obi = toWorld(he, Jh, Jh.obiF);
  let bp = null, onObi = false;
  if (lt < 4.6) bp = cHand;
  else if (lt < 5.0) bp = mix2(cHand, hHand, eio(seg(lt, 4.6, 5.0)));
  else if (lt < 5.5) bp = mix2(hHand, obi, eio(seg(lt, 5.0, 5.5)));
  else onObi = true;
  he.blossom = onObi;
  drawFigure(c, he); drawFigure(c, ch);
  if (bp) drawBlossom(c, bp[0], bp[1], 11, lt * .5, 1, false);
  c.restore();
  petals(c, lt + 40, 16, .25, 0, 1, 3);
  caption(c, '二', '花', bell(lt, .6, 5.6));
}

// --- 3: The shadow (18–24s)
function enemiesFar(c, lt, alpha, xs, y, s) {
  const fs = [];
  xs.forEach((x, i) => fs.push({ x, y, s: s * (i === 3 ? 1.3 : 1), face: -1, kind: i === 3 ? 'lord' : 'grunt', wind: -.8, seed: 20 + i, alpha, pose: walkP(pose(i === 3 ? 'lowblade' : 'spear', { lean: .1 }), lt * 4 + i) }));
  fs.forEach(f => drawFigure(c, f));
}
function faceCloseUp(c, lt) {
  // extreme close-up: brim of the kasa, profile, the eye opens
  const z = lerp(1, 1.08, seg(lt, 0, 2)); cam(c, 960, 560, z);
  storm(c, lt + 20, .35);
  const hg = c.createLinearGradient(300, 0, 880, 0); hg.addColorStop(0, 'rgba(19,17,15,.92)'); hg.addColorStop(1, 'rgba(19,17,15,.55)');
  c.fillStyle = hg; c.beginPath(); c.moveTo(860, 300); c.lineTo(300, 320); c.lineTo(240, 1200); c.lineTo(720, 1200); c.lineTo(800, 820); c.closePath(); c.fill();
  for (let i = 0; i < 7; i++) {
    const sway = Math.sin(NOW * 2.2 + i) * 12;
    brush(c, [[880 - i * 60, 310], [820 - i * 75 + sway, 640], [790 - i * 85 + sway * 2, 1180]], { w: 150 - i * 8, seed: 60 + i, ts: .05, te: .35, dry: .55, rough: .3, bristles: 10 });
  }
  for (let i = 0; i < 7; i++) {
    const y0 = 360 + i * 55, k = Math.sin(NOW * 6 + i) * 30;
    brush(c, [[600, y0], [420 - i * 10, y0 - 30 + k], [240 - i * 20, y0 - 80 + k * 1.5]], { w: 22 - i, seed: 70 + i, ts: .1, te: .9, dry: .4 });
  }
  const sh = c.createLinearGradient(0, 330, 0, 620); sh.addColorStop(0, 'rgba(19,17,15,.62)'); sh.addColorStop(1, 'rgba(19,17,15,0)');
  c.fillStyle = sh; c.fillRect(800, 330, 400, 300);
  const prof = [[880, 330], [925, 420], [950, 468], [936, 492], [962, 522], [1012, 600], [990, 616], [986, 632], [998, 652], [980, 664], [992, 680], [974, 698], [998, 742], [968, 772], [870, 782]];
  brush(c, prof, { w: 13, seed: 77, ts: .03, te: .15, rough: .25, res: 90 });
  brush(c, [[840, 790], [850, 900], [870, 1100]], { w: 12, seed: 78, ts: .05, te: .3 });
  brush(c, [[870, 900], [1020, 1000], [1140, 1100]], { w: 34, seed: 79, ts: .1, te: .3, dry: .5 });
  brush(c, [[905, 960], [1000, 1100]], { w: 18, seed: 80, ts: .1, te: .3 });
  const open = eo(seg(lt, .7, .85));
  brush(c, [[868, 472], [915, 458], [948, 462]], { w: 15 + open * 5, seed: 81, ts: .1, te: .6, dry: .4 });
  if (open < .5) brush(c, [[892, 515], [918, 522], [944, 512]], { w: 7, seed: 82, ts: .2, te: .5 });
  else {
    brush(c, [[890, 508], [918, 498], [946, 506]], { w: 9, seed: 83, ts: .1, te: .5 });
    brush(c, [[900, 520], [925, 523], [944, 512]], { w: 4, seed: 84, ts: .3, te: .5, alpha: .7 });
    blob(c, 932, 511, 7, INK, 3);
  }
  c.fillStyle = INK; c.beginPath(); c.moveTo(0, 0); c.lineTo(1920, 0); c.lineTo(1920, 360); c.lineTo(1500, 345); c.lineTo(360, 300); c.lineTo(0, 290); c.closePath(); c.fill();
  brush(c, [[260, 300], [900, 318], [1650, 352]], { w: 46, seed: 85, ts: .02, te: .2, dry: .45, rough: .3 });
  c.restore();
  rain(c, NOW, .3, -.4);
  petals(c, NOW * 1.6, 10, -1.6, 0, .8, 9);
  FX.letter = 1;
}
function sceneShadow(c, lt) {
  const st = lerp(.0, .7, seg(lt, 0, 1.4));
  if (lt < 1.6) {
    const cm = { x: 960, y: 540, z: 1 + lt * .02 };
    par(c, A.far, cm, .12, -40); par(c, A.mid, cm, .3, 0);
    storm(c, NOW, st);
    mist(c, lt + 50, 600, .8, 30, 12);
    cam(c, cm.x, cm.y, cm.z);
    enemiesFar(c, lt, eo(seg(lt, .2, 1.3)), [1330, 1420, 1510, 1620], 712, 120);
    mist(c, lt + 80, 720, .6, 50, 4, 6, 120);
    groundLine(c, 1000, -300, 2300, 3, .25);
    drawFigure(c, { x: 360, y: 1010, s: 250, face: 1, kind: 'child', seed: 7, wind: -.7, pose: pose('stand', { lean: -.05, aF: .9, fF: 1.3, head: -.1 }) });
    drawFigure(c, { x: 560, y: 1010, s: 450, face: 1, kind: 'hero', hat: true, blossom: true, wind: -.9, seed: 1, pose: pose('stand', { hilt: 1, head: -.05 }) });
    c.restore();
    petals(c, NOW * 1.3, 18, -1.4, 0);
  } else if (lt < 3.6) {
    faceCloseUp(c, lt - 1.6);
  } else {
    const k = lt - 3.6, cm = { x: lerp(980, 1040, seg(k, 0, 2.4)), y: 560, z: lerp(1.0, 1.06, seg(k, 0, 2.4)) };
    par(c, A.far, cm, .12, -40); par(c, A.mid, cm, .3, 0);
    storm(c, NOW, .75);
    cam(c, cm.x, cm.y, cm.z);
    groundLine(c, 920, -300, 2400, 7, .26);
    const gx = lerp(1780, 1520, eio(seg(k, 0, 2.4)));
    [0, 1, 2].forEach(i => drawFigure(c, { x: gx + i * 120 - (i === 1 ? 40 : 0), y: 920 - i * 6, s: 330, face: -1, kind: 'grunt', seed: 30 + i, wind: -.9, pose: walkP(pose('spear', { lean: .15 }), (1780 - gx) / (330 * STRIDE) * TAU + i * 1.3, .7) }));
    drawFigure(c, { x: 2020, y: 914, s: 420, face: -1, kind: 'lord', seed: 40, wind: -.9, pose: pose('lowblade') });
    const hx = lerp(700, 830, eio(seg(k, 0, .9)));
    let P = k < .9 ? walkP(pose('stand', { hilt: 1 }), (hx - 700) / (380 * STRIDE) * TAU) : mixP(pose('stand', { hilt: 1 }), pose('iai'), eio(seg(k, 1.0, 1.6)));
    drawFigure(c, { x: hx, y: 920, s: 380, face: 1, kind: 'hero', hat: true, blossom: true, wind: -.9, seed: 1, pose: P });
    const cx = lerp(520, -200, eio(seg(k, 0, 1.2)));
    if (cx > -150) drawFigure(c, { x: cx, y: 920, s: 210, face: -1, kind: 'child', seed: 7, wind: -.9, pose: walkP(pose('stand', { lean: .3 }), k * 14, 1.3) });
    grass(c, -300, 2400, () => 920, NOW, -1.0, 9, 36);
    c.restore();
    petals(c, NOW * 1.5, 26, -2.2, 0, 1, 5);
    mist(c, NOW * 2, 1010, .5, 120, 8, 5, 140);
    FX.letter = 1 - seg(k, 1.8, 2.4);
  }
  caption(c, '三', '影', lt < 1.6 ? seg(lt, .2, .8) : 0);
}
