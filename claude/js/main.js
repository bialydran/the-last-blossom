'use strict';
// ===== Player: timeline, transitions, controls =====
const canvas = document.getElementById('film');
const ctx = canvas.getContext('2d');
let K = 1, GRAIN = null;

const SCENES = [
  { a: 0, b: 5, f: sceneTitle },
  { a: 5, b: 12, f: sceneJourney },
  { a: 12, b: 18, f: sceneBond },
  { a: 18, b: 24, f: sceneShadow },
  { a: 24, b: 30.5, f: sceneBattle },
  { a: 30.5, b: 40, f: sceneWarlord },
  { a: 40, b: 45, f: sceneAwaken },
  { a: 45, b: 49.5, f: sceneStroke },
  { a: 49.5, b: DURATION + 1, f: sceneReturn },
];

function paperVeil(c, a) { if (a <= 0) return; c.save(); c.globalAlpha = clamp(a); c.drawImage(A.paper, 0, 0); c.restore(); }
function brushWipe(c, p, seed) {
  if (p <= 0 || p >= 2) return;
  const pts = [[-1100, 560], [300, 500], [1250, 590], [3000, 530]];
  const o = { w: 1500, wf: () => 1, rough: .07, seed, res: 60, dry: .12, bristles: 16, splat: 0 };
  if (p < 1) brush(c, pts, Object.assign(o, { prog: eio(p) }));
  else brush(c, pts, Object.assign(o, { from: eio(p - 1) }));
}
function transitions(c, t) {
  if (t < 5) paperVeil(c, seg(t, 4.3, 5.0));
  if (t > 11.5 && t < 12.6) brushWipe(c, t < 12 ? seg(t, 11.5, 12) : 1 + seg(t, 12.05, 12.6), 7);
  paperVeil(c, t < 18 ? seg(t, 17.6, 18) : 1 - seg(t, 18, 18.35));
  if (t > 30.0 && t < 31.1) brushWipe(c, t < 30.5 ? seg(t, 30.0, 30.5) : 1 + seg(t, 30.55, 31.1), 9);
  if (t > 49.1 && t < 50.3) paperVeil(c, t < 49.5 ? seg(t, 49.1, 49.5) : 1 - seg(t, 49.5, 50.3));
}

function render(t) {
  NOW = t;
  ctx.setTransform(K, 0, 0, K, 0, 0);
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  FX.shake = 0; FX.flash = 0; FX.flashCol = PAPER; FX.letter = 0;
  ctx.drawImage(A.paper, 0, 0);
  const sc = SCENES.find(s => t >= s.a && t < s.b) || SCENES[SCENES.length - 1];
  ctx.save(); sc.f(ctx, t - sc.a); ctx.restore();
  ctx.setTransform(K, 0, 0, K, 0, 0); ctx.globalAlpha = 1;
  transitions(ctx, t);
  if (FX.flash > 0) { ctx.globalAlpha = clamp(FX.flash); ctx.fillStyle = FX.flashCol; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
  ctx.fillStyle = GRAIN; ctx.save(); ctx.translate((Math.floor(t * 12) % 4) * 37, (Math.floor(t * 12) % 3) * 53); ctx.fillRect(-200, -200, W + 400, H + 400); ctx.restore();
  ctx.drawImage(A.vign, 0, 0);
  if (FX.letter > 0) { const h = 128 * eio(clamp(FX.letter)); ctx.fillStyle = INK; ctx.fillRect(0, 0, W, h); ctx.fillRect(0, H - h, W, h); }
}

// ----- playback
let T = 0, playing = true, last = performance.now();
const $ = id => document.getElementById(id);
const btnPlay = $('play'), btnReplay = $('replay'), bar = $('bar'), fill = $('fill'), time = $('time'), snd = $('snd'), controls = $('controls'), hint = $('hint');
const fmt = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
function setPlaying(p) {
  playing = p; if (p && T >= DURATION) T = 0;
  btnPlay.textContent = p ? '❚❚ Pause' : '▶ Play';
  controls.classList.toggle('show', !p);
}
function seek(t) { T = clamp(t, 0, DURATION); Audio.last = T; }
function resize() {
  const r = canvas.getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
  const w = Math.max(320, Math.min(1920, Math.round(r.width * dpr)));
  if (canvas.width !== w) { canvas.width = w; canvas.height = Math.round(w * 9 / 16); }
  K = canvas.width / W;
}
function frame(now) {
  const dt = Math.min(.1, (now - last) / 1000); last = now;
  if (playing) { T += dt; if (T >= DURATION) { T = DURATION; setPlaying(false); btnPlay.textContent = '▶ Play'; } }
  render(T);
  Audio.update(T, playing);
  fill.style.width = (T / DURATION * 100) + '%';
  time.textContent = `${fmt(T)} / ${fmt(DURATION)}`;
  requestAnimationFrame(frame);
}
function unlock() { Audio.unlock(); hint.classList.remove('on'); }
btnPlay.onclick = e => { e.stopPropagation(); unlock(); setPlaying(!playing); };
btnReplay.onclick = e => { e.stopPropagation(); unlock(); seek(0); setPlaying(true); };
snd.onclick = e => { e.stopPropagation(); unlock(); Audio.setOn(!Audio.on); snd.textContent = Audio.on ? '♪ On' : '♪ Off'; };
let dragging = false;
const scrub = e => { const r = bar.getBoundingClientRect(); seek((e.clientX - r.left) / r.width * DURATION); };
bar.onpointerdown = e => { e.stopPropagation(); dragging = true; bar.setPointerCapture(e.pointerId); scrub(e); };
bar.onpointermove = e => { if (dragging) scrub(e); };
bar.onpointerup = () => { dragging = false; };
canvas.onclick = () => { if (!Audio.unlocked) { unlock(); return; } setPlaying(!playing); };
document.addEventListener('pointerdown', () => { if (!Audio.unlocked) unlock(); }, { once: true });
document.addEventListener('keydown', e => {
  if (e.code === 'Space') { e.preventDefault(); unlock(); setPlaying(!playing); }
  else if (e.key === 'r' || e.key === 'R') { unlock(); seek(0); setPlaying(true); }
  else if (e.key === 'm' || e.key === 'M') snd.click();
  else if (e.key === 'ArrowRight') seek(T + 2);
  else if (e.key === 'ArrowLeft') seek(T - 2);
});
window.addEventListener('resize', resize);

function start() {
  initAssets();
  GRAIN = ctx.createPattern(A.grain, 'repeat');
  resize();
  const q = new URLSearchParams(location.search);
  if (q.has('t')) { seek(parseFloat(q.get('t')) || 0); setPlaying(false); }
  else setTimeout(() => { if (!Audio.unlocked) hint.classList.add('on'); }, 600);
  last = performance.now();
  requestAnimationFrame(frame);
}
// test/automation hook
window.film = { seek: t => { seek(t); render(T); }, play: () => setPlaying(true), pause: () => setPlaying(false), get time() { return T; }, duration: DURATION, render: t => render(t) };
(document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(start);
