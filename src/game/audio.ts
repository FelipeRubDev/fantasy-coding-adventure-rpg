/* Sintetizador de efectos con WebAudio: sin archivos, sin latencia. */
let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let sfxOn = true;
let musicNodes: { stop: () => void } | null = null;

function ac(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const C = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!C) return null;
    ctx = new C();
    master = ctx.createGain();
    master.gain.value = 0.55;
    master.connect(ctx.destination);
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function tone(freq: number, dur: number, type: OscillatorType = "sine", vol = 0.25, slideTo?: number, delay = 0) {
  const c = ac();
  if (!c || !master || !sfxOn) return;
  const t0 = c.currentTime + delay;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t0);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g);
  g.connect(master);
  o.start(t0);
  o.stop(t0 + dur + 0.03);
}

function noise(dur: number, vol = 0.3, cutoff = 1800, delay = 0) {
  const c = ac();
  if (!c || !master || !sfxOn) return;
  const t0 = c.currentTime + delay;
  const len = Math.floor(c.sampleRate * dur);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const s = c.createBufferSource();
  s.buffer = buf;
  const f = c.createBiquadFilter();
  f.type = "lowpass";
  f.frequency.value = cutoff;
  const g = c.createGain();
  g.gain.value = vol;
  s.connect(f);
  f.connect(g);
  g.connect(master);
  s.start(t0);
}

export const sfx = {
  unlock: () => void ac(),
  click: () => tone(520, 0.06, "triangle", 0.12, 380),
  type: () => tone(180 + Math.random() * 60, 0.025, "square", 0.025),
  hit: () => {
    noise(0.18, 0.35, 2600);
    tone(220, 0.22, "sawtooth", 0.25, 70);
    tone(660, 0.12, "triangle", 0.15, 990, 0.05);
  },
  crit: () => {
    noise(0.32, 0.45, 4200);
    tone(160, 0.4, "sawtooth", 0.3, 40);
    [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.18, "triangle", 0.16, undefined, 0.06 + i * 0.06));
  },
  fail: () => {
    tone(150, 0.3, "sawtooth", 0.28, 55);
    noise(0.22, 0.28, 700);
  },
  fizzle: () => {
    tone(420, 0.25, "square", 0.1, 120);
    noise(0.15, 0.12, 3500);
  },
  death: () => {
    tone(196, 0.9, "sawtooth", 0.28, 40);
    tone(147, 1.2, "triangle", 0.25, 30, 0.15);
    noise(0.6, 0.3, 500, 0.1);
  },
  kill: () => {
    noise(0.5, 0.4, 3000);
    tone(120, 0.7, "sawtooth", 0.3, 30);
    [392, 523, 659, 784].forEach((f, i) => tone(f, 0.3, "triangle", 0.15, undefined, 0.12 + i * 0.08));
  },
  coin: () => {
    tone(1318, 0.07, "square", 0.1);
    tone(1760, 0.14, "square", 0.1, undefined, 0.06);
  },
  level: () => [392, 494, 587, 784, 988].forEach((f, i) => tone(f, 0.32, "triangle", 0.2, undefined, i * 0.09)),
  chest: () => {
    noise(0.2, 0.2, 1200);
    [262, 330, 392, 523].forEach((f, i) => tone(f, 0.4, "sine", 0.2, undefined, 0.1 + i * 0.1));
  },
  win: () => [523, 659, 784, 659, 784, 1047].forEach((f, i) => tone(f, 0.28, "triangle", 0.2, undefined, i * 0.1)),
  ach: () => {
    tone(880, 0.12, "triangle", 0.18);
    tone(1175, 0.3, "triangle", 0.18, undefined, 0.1);
  },
  potion: () => {
    tone(300, 0.25, "sine", 0.2, 900);
    tone(600, 0.3, "sine", 0.15, 1200, 0.12);
  },
  hint: () => {
    tone(700, 0.2, "sine", 0.15, 1000);
    tone(1000, 0.3, "sine", 0.12, 1400, 0.12);
  },
};

export function setSfx(on: boolean) {
  sfxOn = on;
}

export function setMusic(on: boolean) {
  if (!on) {
    musicNodes?.stop();
    musicNodes = null;
    return;
  }
  if (musicNodes) return;
  const c = ac();
  if (!c || !master) return;
  const g = c.createGain();
  g.gain.value = 0.0001;
  g.gain.exponentialRampToValueAtTime(0.07, c.currentTime + 2.5);
  const f = c.createBiquadFilter();
  f.type = "lowpass";
  f.frequency.value = 260;
  const lfo = c.createOscillator();
  const lg = c.createGain();
  lfo.frequency.value = 0.07;
  lg.gain.value = 120;
  lfo.connect(lg);
  lg.connect(f.frequency);
  const oscs = [55, 82.41, 110.5, 164.9].map((fr, i) => {
    const o = c.createOscillator();
    o.type = i % 2 ? "triangle" : "sawtooth";
    o.frequency.value = fr;
    o.detune.value = (i - 1.5) * 7;
    o.connect(f);
    o.start();
    return o;
  });
  f.connect(g);
  g.connect(master);
  lfo.start();
  musicNodes = {
    stop: () => {
      g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.8);
      setTimeout(() => {
        oscs.forEach((o) => o.stop());
        lfo.stop();
        g.disconnect();
      }, 900);
    },
  };
}
