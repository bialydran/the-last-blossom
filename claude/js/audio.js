'use strict';
// ===== Procedural score & foley (Web Audio, no samples) =====
const N = { D4: 293.66, Eb4: 311.13, G4: 392, A4: 440, Bb4: 466.16, D5: 587.33, Eb5: 622.25, G3: 196, A3: 220, D3: 146.83 };
const CUES = [
  [.3, 'pluck', N.D4], [.7, 'pluck', N.A4], [1.1, 'pluck', N.Bb4], [1.6, 'pluck', N.A4], [2.2, 'pluck', N.D5], [3.0, 'taiko', .5],
  [5.5, 'flute', N.A4, 2.5], [8.2, 'flute', N.Bb4, 1.1], [9.4, 'flute', N.A4, 1], [10.4, 'flute', N.G4, 1.6],
  [12.6, 'pluck', N.D5], [13.2, 'pluck', N.Bb4], [14.0, 'pluck', N.A4], [16.0, 'pluck', N.Eb5], [16.4, 'pluck', N.D5], [17.0, 'pluck', N.A4],
  [18.3, 'taiko', .7], [19.3, 'taiko', .6], [19.6, 'thunder', .5], [20.3, 'taiko', .9], [20.3, 'shing', .35],
  [21.6, 'taiko', .6], [22.4, 'taiko', .6], [23.0, 'taiko', .7], [23.4, 'taiko', .7], [23.7, 'taiko', .8], [24.0, 'taiko', 1],
  [25.3, 'shing', .6], [25.3, 'slash', 1], [25.3, 'taiko', 1], [26.45, 'clash', .5], [26.72, 'slash', 1], [26.72, 'taiko', .9],
  [27.92, 'slash', 1], [27.98, 'taiko', 1], [25.7, 'whoosh', .6], [27.0, 'whoosh', .6], [28.3, 'whoosh', .6],
  [30.5, 'thunder', .8], [32.9, 'clash', 1.2], [32.9, 'taiko', 1.1], [33.8, 'slash', .9], [34.3, 'taiko', 1.1], [34.3, 'whoosh', .7],
  [37.7, 'thunder', 1], [38.5, 'taiko', .5], [39.2, 'taiko', .6], [39.7, 'taiko', .7],
  [41.2, 'bowl', 1], [42.0, 'flute', N.D5, 2.2], [44.6, 'shing', .5],
  [45.62, 'slash', 1.4], [45.62, 'taiko', 1.3], [47.0, 'click', .7], [47.6, 'whoosh', 1], [48.9, 'click', 1],
  [50.0, 'flute', N.D5, 1.6], [51.6, 'pluck', N.A4], [52.0, 'pluck', N.Bb4], [52.6, 'pluck', N.D5], [53.8, 'flute', N.A4, 2.6],
  [56.6, 'pluck', N.D4], [56.6, 'taiko', .4], [57.0, 'pluck', N.A3],
];
const Audio = {
  ac: null, master: null, on: true, unlocked: false, last: 0, noise: null,
  init() {
    if (this.ac) return;
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    const ac = this.ac = new AC();
    this.master = ac.createGain(); this.master.gain.value = this.on ? .8 : 0;
    const comp = ac.createDynamicsCompressor(); this.master.connect(comp); comp.connect(ac.destination);
    const len = ac.sampleRate * 2, buf = ac.createBuffer(1, len, ac.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    this.noise = buf;
    const bed = (type, f, q) => { const s = ac.createBufferSource(); s.buffer = buf; s.loop = true; const fl = ac.createBiquadFilter(); fl.type = type; fl.frequency.value = f; fl.Q.value = q; const g = ac.createGain(); g.gain.value = 0; s.connect(fl); fl.connect(g); g.connect(this.master); s.start(); return { g, fl }; };
    this.wind = bed('bandpass', 420, .8); this.rain = bed('highpass', 2500, .5);
  },
  unlock() { this.init(); if (this.ac && this.ac.state !== 'running') this.ac.resume(); this.unlocked = true; },
  setOn(v) { this.on = v; if (this.master) this.master.gain.setTargetAtTime(v ? .8 : 0, this.ac.currentTime, .05); },
  env(g, t, a, peak, dec) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + dec); },
  nz(t, dur) { const s = this.ac.createBufferSource(); s.buffer = this.noise; s.start(t, Math.random()); s.stop(t + dur); return s; },
  play(kind, a, b) {
    const ac = this.ac, t = ac.currentTime + .01, M = this.master;
    if (kind === 'pluck') {
      [1, 2, 3.01].forEach((h, i) => { const o = ac.createOscillator(), g = ac.createGain(), f = ac.createBiquadFilter(); o.type = i ? 'sine' : 'triangle'; o.frequency.value = a * h; f.type = 'lowpass'; f.frequency.value = 2500; o.connect(f); f.connect(g); g.connect(M); this.env(g, t, .005, .22 / (i + 1), 1.8 - i * .4); o.start(t); o.stop(t + 2.2); });
    } else if (kind === 'flute') {
      const o = ac.createOscillator(), g = ac.createGain(), lfo = ac.createOscillator(), lg = ac.createGain();
      o.type = 'sine'; o.frequency.value = a; lfo.frequency.value = 5; lg.gain.value = a * .012; lfo.connect(lg); lg.connect(o.frequency);
      o.connect(g); g.connect(M); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.16, t + .25); g.gain.setValueAtTime(.16, t + b - .3); g.gain.linearRampToValueAtTime(0, t + b + .4);
      const n = this.nz(t, b + .5), bf = ac.createBiquadFilter(), ng = ac.createGain(); bf.type = 'bandpass'; bf.frequency.value = a * 2; bf.Q.value = 3; n.connect(bf); bf.connect(ng); ng.connect(M);
      ng.gain.setValueAtTime(0, t); ng.gain.linearRampToValueAtTime(.05, t + .15); ng.gain.linearRampToValueAtTime(0, t + b + .3);
      o.start(t); lfo.start(t); o.stop(t + b + .5); lfo.stop(t + b + .5);
    } else if (kind === 'taiko') {
      const o = ac.createOscillator(), g = ac.createGain(); o.frequency.setValueAtTime(120, t); o.frequency.exponentialRampToValueAtTime(48, t + .35);
      o.connect(g); g.connect(M); this.env(g, t, .004, .9 * a, .9); o.start(t); o.stop(t + 1.1);
      const n = this.nz(t, .2), f = ac.createBiquadFilter(), ng = ac.createGain(); f.type = 'lowpass'; f.frequency.value = 400; n.connect(f); f.connect(ng); ng.connect(M); this.env(ng, t, .002, .5 * a, .15);
    } else if (kind === 'slash' || kind === 'whoosh') {
      const d = kind === 'slash' ? .3 : .7, n = this.nz(t, d + .1), f = ac.createBiquadFilter(), g = ac.createGain();
      f.type = 'bandpass'; f.Q.value = kind === 'slash' ? 2 : .8; f.frequency.setValueAtTime(kind === 'slash' ? 7000 : 300, t); f.frequency.exponentialRampToValueAtTime(kind === 'slash' ? 900 : 1600, t + d);
      n.connect(f); f.connect(g); g.connect(M); this.env(g, t, kind === 'slash' ? .01 : .2, .6 * a, d);
    } else if (kind === 'clash' || kind === 'shing' || kind === 'bowl') {
      const fr = kind === 'clash' ? [1250, 1870, 2650, 3420, 4810] : kind === 'shing' ? [2400, 3610, 5020] : [220, 554, 880, 1320];
      const dec = kind === 'bowl' ? 4 : kind === 'clash' ? 1.4 : .9;
      fr.forEach((f, i) => { const o = ac.createOscillator(), g = ac.createGain(); o.frequency.value = f; o.connect(g); g.connect(M); this.env(g, t, kind === 'shing' ? .04 : .003, .12 * a / (1 + i * .4), dec); o.start(t); o.stop(t + dec + .2); });
      if (kind === 'clash') { const n = this.nz(t, .1), g = ac.createGain(); n.connect(g); g.connect(M); this.env(g, t, .001, .5 * a, .08); }
    } else if (kind === 'thunder') {
      const n = this.nz(t, 3), f = ac.createBiquadFilter(), g = ac.createGain(); f.type = 'lowpass'; f.frequency.value = 180; n.connect(f); f.connect(g); g.connect(M); this.env(g, t, .08, 1.0 * a, 2.6);
    } else if (kind === 'click') {
      const o = ac.createOscillator(), g = ac.createGain(); o.frequency.value = 1800; o.connect(g); g.connect(M); this.env(g, t, .001, .3 * a, .06); o.start(t); o.stop(t + .1);
    }
  },
  update(t, playing) {
    if (!this.ac || !this.unlocked) { this.last = t; return; }
    const now = this.ac.currentTime;
    const silent = t > 41.6 && t < 44.5;
    const windLvl = silent ? 0 : t < 18 ? .12 : t < 40 ? .28 : t < 49.5 ? .2 : .1;
    this.wind.g.gain.setTargetAtTime(playing ? windLvl : 0, now, .2);
    this.wind.fl.frequency.setTargetAtTime(300 + 300 * Math.sin(t * .7) ** 2, now, .3);
    this.rain.g.gain.setTargetAtTime(playing && !silent ? rainAt(t) * .18 : 0, now, .15);
    if (playing && t > this.last && t - this.last < .25) for (const q of CUES) if (q[0] > this.last && q[0] <= t) this.play(q[1], q[2], q[3]);
    this.last = t;
  },
};
