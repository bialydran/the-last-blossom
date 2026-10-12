'use strict';
// ===== Characters: pose rig drawn entirely with brush strokes =====
const POSE0 = { lean: .04, head: 0, aB: -.06, fB: -.12, aF: .1, fF: .28, tB: -.05, sB: -.05, tF: .06, sF: .06, swA: -1.2, drawn: 0, hilt: 0, grip: 0 };
const PS = {
  stand: {},
  iai: { lean: .32, head: -.25, tB: -.75, sB: -1.05, tF: .95, sF: .05, hilt: 1, aB: .5, fB: 1.0 },
  kneel: { lean: .12, head: .35, tF: 1.45, sF: .05, tB: .05, sB: -1.5, hilt: 1, aB: .3, fB: 1.2 },
  seiza: { lean: .05, head: .1, tF: 1.5, sF: -1.45, tB: 1.45, sB: -1.5, aF: .5, fF: 1.1, aB: .35, fB: 1.0 },
  knocked: { lean: .3, head: .15, tF: 1.35, sF: .1, tB: .1, sB: -1.45, drawn: 1, aF: .55, fF: .5, swA: 1.25, aB: -.4, fB: -.2 },
  follow: { lean: .28, head: -.1, tF: 1.05, sF: .1, tB: -.95, sB: -1.35, drawn: 1, aF: 1.75, fF: 1.85, swA: -.15, aB: -1.3, fB: -1.1 },
  guard: { lean: .08, head: -.05, tF: .4, sF: .05, tB: -.45, sB: -.5, drawn: 1, grip: 1, aF: .55, fF: 1.3, swA: -.75 },
  upcut: { lean: -.05, head: -.25, tF: .5, sF: 0, tB: -.55, sB: -.7, drawn: 1, grip: 1, aF: 2.6, fF: 2.9, swA: -1.75 },
  raised: { lean: -.08, head: -.1, tF: .35, sF: 0, tB: -.4, sB: -.45, drawn: 1, grip: 1, aF: 2.7, fF: 3.05, swA: -2.3 },
  strike: { lean: .4, head: .05, tF: .85, sF: 0, tB: -.8, sB: -1.1, drawn: 1, grip: 1, aF: 1.4, fF: 1.6, swA: -.35 },
  block: { lean: 0, head: -.1, tF: .5, sF: 0, tB: -.55, sB: -.7, drawn: 1, grip: 1, aF: 2.2, fF: 2.6, swA: -.25 },
  duck: { lean: .75, head: -.4, tF: 1.25, sF: .15, tB: -.6, sB: -1.4, drawn: 1, grip: 1, aF: 1.0, fF: 1.2, swA: -.6 },
  lowblade: { lean: .05, drawn: 1, aF: .45, fF: .6, swA: .95 },
  spear: { lean: .3, head: -.15, aF: 1.15, fF: 1.45, aB: .5, fB: 1.5, swA: .08, drawn: 1 },
  spearUp: { lean: -.1, head: .2, aF: 2.6, fF: 2.9, aB: 2.2, fB: 2.6, swA: 1.1, drawn: 1, tF: .9, sF: -.2, tB: -.3, sB: -1.4 },
  sweep: { lean: .25, tF: .8, sF: 0, tB: -.7, sB: -1.0, drawn: 1, grip: 1, aF: 1.55, fF: 1.6, swA: .05 },
  offer: { lean: 0, head: -.2, aF: 1.35, fF: 1.7, aB: -.1, fB: -.2 },
  chiburi: { lean: .1, tF: .3, sF: 0, tB: -.35, sB: -.4, drawn: 1, aF: 1.0, fF: 1.0, swA: .9, aB: -.3, fB: -.5 },
};
const pose = (n, extra) => Object.assign({}, POSE0, PS[n], extra || {});
function mixP(a, b, k) { const o = {}; for (const key in a) o[key] = lerp(a[key], b[key] === undefined ? POSE0[key] : b[key], k); return o; }
function walkP(base, ph, amp = 1) {
  const s = Math.sin(ph), c = Math.cos(ph), A2 = .42 * amp;
  return Object.assign({}, base, { tF: A2 * s, sF: A2 * s - .7 * amp * Math.max(0, c), tB: -A2 * s, sB: -A2 * s - .7 * amp * Math.max(0, -c) });
}
const STRIDE = .78; // units travelled per walk cycle

const DIMS = {
  adult: { th: .24, sh: .24, to: .3, ua: .17, fa: .16, hd: .064, leg: .13 },
  child: { th: .17, sh: .17, to: .24, ua: .13, fa: .12, hd: .085, leg: .11 },
};
function ik(S, T, a, b, bend) {
  const dx = T[0] - S[0], dy = T[1] - S[1];
  let d = Math.hypot(dx, dy); d = clamp(d, Math.abs(a - b) + 1e-4, a + b - 1e-4);
  const base = Math.atan2(dy, dx), ang = Math.acos(clamp((a * a + d * d - b * b) / (2 * a * d), -1, 1));
  const q = base + ang * bend; return [S[0] + Math.cos(q) * a, S[1] + Math.sin(q) * a];
}
function geo(f) {
  const p = Object.assign({}, POSE0, f.pose), D = f.kind === 'child' ? DIMS.child : DIMS.adult, J = { p, D };
  const hip = [0, 0]; J.hip = hip;
  J.td = [Math.sin(p.lean), -Math.cos(p.lean)]; J.nrm = [Math.cos(p.lean), Math.sin(p.lean)];
  J.neck = add(hip, J.td, D.to); J.sho = add(hip, J.td, D.to - .035);
  J.ha = p.lean + p.head;
  J.head = add(J.neck, [Math.sin(J.ha), -Math.cos(J.ha)], D.hd + .02);
  J.kB = add(hip, dirA(p.tB, D.th)); J.fB = add(J.kB, dirA(p.sB, D.sh));
  J.kF = add(hip, dirA(p.tF, D.th)); J.fF = add(J.kF, dirA(p.sF, D.sh));
  J.obi = add(hip, J.td, .1); J.obiF = add(J.obi, J.nrm, .075);
  J.hilt = add(J.obiF, [.12, -.065]);
  J.sd = [Math.cos(p.swA), Math.sin(p.swA)];
  if (p.hilt > .5 && p.drawn < .5) { J.hF = add(J.hilt, [.015, .005]); J.eF = ik(J.sho, J.hF, D.ua, D.fa, 1); }
  else { J.eF = add(J.sho, dirA(p.aF, D.ua)); J.hF = add(J.eF, dirA(p.fF, D.fa)); }
  if (p.grip > .5 && p.drawn > .5) { J.hB = add(J.hF, J.sd, -.075); J.eB = ik(J.sho, J.hB, D.ua, D.fa, 1); }
  else { J.eB = add(J.sho, dirA(p.aB, D.ua)); J.hB = add(J.eB, dirA(p.fB, D.fa)); }
  J.oy = -Math.max(J.fB[1], J.fF[1], J.kB[1] + .03, J.kF[1] + .03);
  J.tip = add(J.hF, J.sd, f.kind === 'lord' ? .62 : .44);
  return J;
}
function toWorld(f, J, pt) { const face = f.face || 1; return [f.x + face * f.s * pt[0], f.y - (f.lift || 0) + f.s * (pt[1] + J.oy)]; }

function drawFigure(c, f) {
  const J = geo(f), p = J.p, D = J.D, kind = f.kind || 'hero', face = f.face || 1, t = NOW;
  const wl = (f.wind === undefined ? .6 : f.wind) * face;
  const boil = Math.floor(NOW * 10) % 3, sd = (f.seed || 1) * 100 + boil * 7;
  const ink = f.ink || (kind === 'grunt' ? '#2a2623' : kind === 'child' ? '#5d5650' : INK);
  const back = f.back || (kind === 'grunt' ? '#6b655f' : kind === 'child' ? '#8a827a' : '#4a4542');
  const fl = k => Math.sin(t * 9 + k) * .6 + Math.sin(t * 15.3 + k * 1.7) * .4;
  const lord = kind === 'lord', child = kind === 'child';
  c.save();
  c.translate(f.x, f.y - (f.lift || 0)); c.scale(face * f.s, f.s); c.translate(0, J.oy);
  if (f.rot) c.rotate(f.rot);
  if (f.alpha !== undefined) c.globalAlpha *= f.alpha;

  if (lord) { // jinbaori cape billowing behind
    const tail = add(J.hip, [-.2 + wl * .22, .16 + fl(3) * .03]);
    brush(c, [add(J.sho, [-.03, -.01]), add(mix2(J.sho, J.hip, .5), [-.13 + wl * .1, fl(1) * .02]), tail], { w: .26, color: '#2e2a27', wf: u => .7 + .5 * u, seed: sd + 90, rough: .2, dry: .3, bristles: 5 });
  }
  if (kind === 'grunt' && f.banner !== false) { // sashimono banner
    const b0 = add(J.sho, [-.07, .06]), top = add(b0, [-.04, -.62]);
    brush(c, [b0, top], { w: .014, color: ink, seed: sd + 71, ts: .01, te: .05 });
    c.fillStyle = '#7d766f'; c.beginPath(); c.moveTo(top[0], top[1]);
    const dir = wl >= 0 ? 1 : -1, len = .2;
    for (let i = 1; i <= 6; i++) { const k = i / 6; c.lineTo(top[0] + dir * len * k, top[1] + Math.sin(t * 8 - i) * .025 * k); }
    for (let i = 6; i >= 0; i--) { const k = i / 6; c.lineTo(top[0] + dir * len * k + .005, top[1] + .3 + Math.sin(t * 8 - i - .6) * .03 * k); }
    c.fill();
    blob(c, top[0] + dir * .1, top[1] + .14 + Math.sin(t * 8 - 3) * .012, .045, ink, sd);
  }
  if (kind === 'hero') { // long scarf streaming in the wind
    let pt = add(J.neck, [-.05, .02]); const pts = [pt];
    for (let i = 1; i <= 9; i++) {
      const a = Math.abs(wl);
      pt = add(pt, [.05 * wl + .008 * Math.sin(t * 7 - i * .7), .022 + .03 * (1 - Math.min(1, a)) + .016 * Math.sin(t * 9.5 - i * .85) * (i / 5) * Math.max(.25, a)]);
      pts.push(pt);
    }
    brush(c, pts, { w: .05, color: '#4d4743', wf: u => 1 - .55 * u, seed: sd + 3, rough: .25, te: .2 });
  }
  const arm = (sh, el, hd, col, s2, front) => {
    const sw = wl * .07 + fl(s2) * .015 * Math.abs(wl);
    if (!child || true) brush(c, [mix2(sh, el, .15), add(el, [sw * .5, .035]), add(el, [sw, lord ? .07 : .11])], { w: lord ? .12 : .1, color: col, seed: s2 + 1, ts: .3, te: .55, rough: .2 });
    brush(c, [sh, el], { w: .07, color: col, seed: s2 + 2, ts: .05, te: .05, rough: .1, res: 6 });
    brush(c, [el, hd], { w: .045, color: col, seed: s2 + 3, ts: .05, te: .2, rough: .1, res: 6 });
    blob(c, hd[0], hd[1], .024, col, s2);
    if (lord) brush(c, [add(sh, [-.02, -.01]), add(sh, dirA((front ? p.aF : p.aB) * .5, .14))], { w: .13, color: '#1d1a18', seed: s2 + 4, wf: () => 1, rough: .1, res: 6 });
  };
  const leg = (kn, ft, col, s2) => {
    brush(c, [[0, 0], kn, ft], { w: D.leg, color: col, wf: u => .62 + .55 * u, seed: s2, rough: .14, res: 16 });
    brush(c, [mix2(kn, ft, .5), add(ft, [-wl * .1 + fl(s2) * .025 * Math.abs(wl), -.01])], { w: .07, color: col, ts: .1, te: .9, seed: s2 + 3, res: 8 });
    brush(c, [add(ft, [-.015, 0]), add(ft, [.065, .006])], { w: .035, color: col, ts: .2, te: .5, seed: s2 + 5, res: 6 });
  };
  const weapon = (layerFront) => {
    if (p.drawn < .5) return;
    const h = J.hF, d = J.sd;
    if (kind === 'grunt') {
      if (!layerFront) return;
      brush(c, [add(h, d, -.5), add(h, d, .58)], { w: .017, color: ink, seed: sd + 41, ts: .02, te: .02, rough: .05, res: 6 });
      brush(c, [add(h, d, .56), add(h, d, .7)], { w: .036, color: ink, seed: sd + 42, ts: .1, te: .9, res: 6 });
      return;
    }
    if (!layerFront) return;
    const L = lord ? .62 : .44, nrm = [-d[1], d[0]];
    brush(c, [add(h, d, -.1), add(h, d, .01)], { w: .028, color: INK, seed: sd + 43, ts: .05, te: .05, res: 4 });
    blob(c, h[0] + d[0] * .015, h[1] + d[1] * .015, .02, INK, sd);
    const bl = [add(h, d, .02), add(add(h, d, L * .55), nrm, -.012 * face), add(h, d, L)];
    brush(c, bl, { w: lord ? .028 : .02, color: '#2a2725', seed: sd + 44, ts: .02, te: .25, rough: .05, res: 12 });
    brush(c, bl, { w: .005, color: PAPER, seed: sd + 45, ts: .1, te: .3, rough: 0, alpha: .75, res: 12 });
  };

  // back layer
  arm(J.sho, J.eB, J.hB, back, sd + 10, false);
  leg(J.kB, J.fB, back, sd + 20);
  // torso
  brush(c, [add(J.hip, [-.005, .03]), add(J.hip, J.td, D.to * .5), J.sho], { w: lord ? .21 : child ? .15 : .17, color: ink, wf: u => .95 + .2 * u - .5 * Math.max(0, u - .85), seed: sd + 30, rough: .08, res: 12 });
  if (lord) for (let i = 0; i < 4; i++) { const a = add(J.hip, [-.07 + i * .05, .0]); brush(c, [a, add(a, [-.01 + i * .005, .17])], { w: .055, color: '#1d1a18', seed: sd + 60 + i, wf: () => 1, res: 4 }); }
  leg(J.kF, J.fF, ink, sd + 40);
  // obi, collar, sheath
  brush(c, [add(J.obi, J.nrm, -.085), add(J.obi, J.nrm, .09)], { w: .045, color: child ? '#8f2820' : '#3d3833', seed: sd + 50, ts: .05, te: .05, rough: .1, res: 4, alpha: child ? .8 : 1 });
  brush(c, [add(J.neck, J.nrm, .025), add(add(J.hip, J.td, .14), J.nrm, .065)], { w: .013, color: PAPER, seed: sd + 51, ts: .1, te: .4, alpha: .65, res: 6 });
  if (kind === 'hero' || lord) {
    const o = J.obiF;
    brush(c, [add(o, [.01, 0]), add(o, [-.25, .07]), add(o, [-.44, .15])], { w: .026, color: INK, seed: sd + 52, ts: .02, te: .1, rough: .05, res: 8 });
    if (p.drawn < .5) { brush(c, [o, J.hilt], { w: .032, color: INK, seed: sd + 53, ts: .02, te: .05, res: 4 }); blob(c, o[0] + .012, o[1] - .006, .022, INK, sd); }
  }
  if (f.blossom) drawBlossom(c, J.obiF[0] - .01, J.obiF[1] + .005, child ? .028 : .026, t * .2, 1, false);
  // head
  const hc = J.head;
  blob(c, hc[0], hc[1], D.hd, child ? '#1b1816' : ink, sd + 1, .05);
  c.save(); c.translate(hc[0], hc[1]); c.rotate(J.ha);
  c.fillStyle = child ? '#1b1816' : ink; c.beginPath(); c.moveTo(D.hd * .8, -.012); c.lineTo(D.hd * 1.18, .014); c.lineTo(D.hd * .8, .03); c.fill();
  if (kind === 'hero' && !f.hat) brush(c, [[-.035, -D.hd * .85], [.0, -D.hd * 1.15], [.035, -D.hd * 1.2]], { w: .026, seed: sd + 55, ts: .3, te: .5, res: 6 });
  if (child) { blob(c, -.035, -D.hd * .95, .04, '#1b1816', sd + 2); if (f.hairBlossom) drawBlossom(c, -.06, -D.hd * .75, .03, t * .3, 1, false); }
  if (f.hat && kind === 'hero') {
    c.fillStyle = INK; c.beginPath(); c.moveTo(-.2, .005); c.quadraticCurveTo(-.07, -.06, .0, -.1); c.quadraticCurveTo(.07, -.06, .21, .018); c.quadraticCurveTo(0, .03, -.2, .005); c.fill();
    c.strokeStyle = PAPER; c.lineWidth = .004; c.globalAlpha *= .3;
    for (let i = 0; i < 7; i++) { c.beginPath(); c.moveTo(0, -.095); c.lineTo(-.18 + i * .06, .01 + i * .002); c.stroke(); }
    c.globalAlpha /= .3;
  }
  if (kind === 'grunt') { c.fillStyle = ink; c.beginPath(); c.moveTo(-.16, .0); c.lineTo(0, -.065); c.lineTo(.17, .01); c.quadraticCurveTo(0, .02, -.16, 0); c.fill(); }
  if (lord) {
    const hd = D.hd;
    c.fillStyle = INK; c.beginPath(); c.arc(0, -.005, hd * 1.18, Math.PI * 1.02, Math.PI * 1.98); c.fill();
    brush(c, [[-.02, -.0], [-.11, .045], [-.15, .1]], { w: .09, color: '#1d1a18', seed: sd + 80, wf: u => .6 + .5 * u, res: 8 });
    if (!f.hornless) {
      brush(c, [[.02, -.065], [.12, -.16], [.08, -.29]], { w: .022, seed: sd + 81, ts: .1, te: .8, res: 10 });
      brush(c, [[-.0, -.065], [-.08, -.17], [-.03, -.3]], { w: .022, seed: sd + 82, ts: .1, te: .8, res: 10 });
    }
    brush(c, [[.03, -.008], [.07, -.002]], { w: .012, color: PAPER, ts: .3, te: .6, seed: sd + 83, res: 4 });
    brush(c, [[.035, .03], [.072, .035]], { w: .008, color: PAPER, ts: .2, te: .4, seed: sd + 84, res: 4, alpha: .8 });
    if (f.crack) brush(c, [[.075, -.07], [.03, .0], [.06, .07]], { w: .012 * f.crack + .002, color: PAPER, ts: .1, te: .3, seed: 9, prog: f.crack, res: 8 });
  }
  c.restore();
  // front arm + weapon
  if (kind === 'grunt') weapon(true);
  arm(J.sho, J.eF, J.hF, ink, sd + 60, true);
  if (kind !== 'grunt') weapon(true);
  if (f.handBlossom) drawBlossom(c, J.hF[0] + .01, J.hF[1] - .01, .03, t * .3, 1, false);
  c.restore();
  return J;
}
