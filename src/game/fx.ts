/* Partículas, texto flotante, destellos y temblor de pantalla — un único canvas a 60fps. */
interface P {
  k: "dot" | "spark" | "ring" | "slash" | "text" | "confetti";
  x: number;
  y: number;
  vx: number;
  vy: number;
  g: number;
  life: number;
  max: number;
  size: number;
  color: string;
  text?: string;
  rot?: number;
  vr?: number;
}
interface Ember {
  x: number;
  y: number;
  vy: number;
  vx: number;
  s: number;
  ph: number;
  a: number;
}

class FX {
  canvas: HTMLCanvasElement | null = null;
  ctx: CanvasRenderingContext2D | null = null;
  parts: P[] = [];
  embers: Ember[] = [];
  w = 0;
  h = 0;
  dpr = 1;
  raf = 0;
  last = 0;
  quality = 1;
  slow = 0;
  frames = 0;
  running = false;
  ambient = true;

  setAmbient(on: boolean) {
    this.ambient = on;
    if(on && this.canvas && !document.hidden)this.start();
  }
  attach(c: HTMLCanvasElement) {
    this.canvas = c;
    this.ctx = c.getContext("2d");
    this.resize();
    window.addEventListener("resize", this.resize);
    document.addEventListener("visibilitychange", this.vis);
    this.start();
  }
  detach() {
    window.removeEventListener("resize", this.resize);
    document.removeEventListener("visibilitychange", this.vis);
    cancelAnimationFrame(this.raf);
    this.running = false;
  }
  vis = () => {
    if (document.hidden) {
      cancelAnimationFrame(this.raf);
      this.running = false;
    } else this.start();
  };
  resize = () => {
    if (!this.canvas) return;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.w = window.innerWidth;
    this.h = window.innerHeight;
    this.canvas.width = Math.floor(this.w * this.dpr);
    this.canvas.height = Math.floor(this.h * this.dpr);
    this.canvas.style.width = this.w + "px";
    this.canvas.style.height = this.h + "px";
    this.ctx?.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  };
  start() {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.loop);
  }
  target() {
    return Math.round((this.w < 700 ? 16 : 34) * this.quality);
  }
  loop = (t: number) => {
    if (!this.running || !this.ctx) return;
    const dt = Math.min(0.05, (t - this.last) / 1000);
    this.last = t;
    // calidad adaptativa: si el dispositivo va justo, reducimos partículas
    this.frames++;
    if (dt > 0.024) this.slow++;
    if (this.frames >= 90) {
      if (this.slow > 35 && this.quality > 0.3) this.quality *= 0.65;
      else if (this.slow < 4 && this.quality < 1) this.quality = Math.min(1, this.quality * 1.15);
      this.frames = 0;
      this.slow = 0;
    }
    const c = this.ctx;
    c.clearRect(0, 0, this.w, this.h);
    if(!this.ambient && !this.parts.length){this.running=false;return;}
    c.globalCompositeOperation = "lighter";
    if (this.ambient) this.drawEmbers(c, dt, t);
    this.drawParts(c, dt);
    c.globalCompositeOperation = "source-over";
    this.drawTexts(c, dt);
    this.raf = requestAnimationFrame(this.loop);
  };
  drawEmbers(c: CanvasRenderingContext2D, dt: number, t: number) {
    const want = this.target();
    while (this.embers.length < want) {
      this.embers.push({ x: Math.random() * this.w, y: this.h + Math.random() * 60, vy: 12 + Math.random() * 28, vx: (Math.random() - 0.5) * 14, s: 0.8 + Math.random() * 1.8, ph: Math.random() * 6, a: 0.25 + Math.random() * 0.5 });
    }
    if (this.embers.length > want + 6) this.embers.length = want;
    for (const e of this.embers) {
      e.y -= e.vy * dt;
      e.x += (e.vx + Math.sin(t / 900 + e.ph) * 10) * dt;
      if (e.y < -10) {
        e.y = this.h + 10;
        e.x = Math.random() * this.w;
      }
      const tw = 0.55 + 0.45 * Math.sin(t / 300 + e.ph);
      c.fillStyle = `rgba(255,${130 + Math.floor(e.s * 25)},50,${e.a * tw})`;
      c.beginPath();
      c.arc(e.x, e.y, e.s, 0, 6.283);
      c.fill();
    }
  }
  drawParts(c: CanvasRenderingContext2D, dt: number) {
    for (let i = this.parts.length - 1; i >= 0; i--) {
      const p = this.parts[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.parts.splice(i, 1);
        continue;
      }
      p.vy += p.g * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      const a = Math.max(0, p.life / p.max);
      if (p.k === "dot") {
        c.globalAlpha = a;
        c.fillStyle = p.color;
        c.beginPath();
        c.arc(p.x, p.y, p.size * (0.4 + 0.6 * a), 0, 6.283);
        c.fill();
      } else if (p.k === "spark") {
        c.globalAlpha = a;
        c.strokeStyle = p.color;
        c.lineWidth = p.size;
        c.beginPath();
        c.moveTo(p.x, p.y);
        c.lineTo(p.x - p.vx * 0.04, p.y - p.vy * 0.04);
        c.stroke();
      } else if (p.k === "ring") {
        c.globalAlpha = a * 0.8;
        c.strokeStyle = p.color;
        c.lineWidth = 3 * a + 0.5;
        c.beginPath();
        c.arc(p.x, p.y, p.size * (1 - a) + 8, 0, 6.283);
        c.stroke();
      } else if (p.k === "slash") {
        c.globalAlpha = a;
        c.strokeStyle = p.color;
        c.lineCap = "round";
        c.lineWidth = 7 * a + 1;
        const len = p.size * (1.2 - a * 0.4);
        const ang = p.rot ?? 0.8;
        c.beginPath();
        c.moveTo(p.x - Math.cos(ang) * len, p.y - Math.sin(ang) * len);
        c.lineTo(p.x + Math.cos(ang) * len, p.y + Math.sin(ang) * len);
        c.stroke();
      } else if (p.k === "confetti") {
        c.globalAlpha = Math.min(1, a * 1.5);
        c.fillStyle = p.color;
        p.rot = (p.rot ?? 0) + (p.vr ?? 0) * dt;
        c.save();
        c.translate(p.x, p.y);
        c.rotate(p.rot);
        c.fillRect(-p.size, -p.size * 0.4, p.size * 2, p.size * 0.8);
        c.restore();
      }
    }
    c.globalAlpha = 1;
  }
  drawTexts(c: CanvasRenderingContext2D, dt: number) {
    void dt;
    for (const p of this.parts) {
      if (p.k !== "text") continue;
      const a = Math.max(0, p.life / p.max);
      const pop = a > 0.8 ? 1 + (a - 0.8) * 3 : 1;
      c.globalAlpha = Math.min(1, a * 2);
      c.font = `800 ${Math.round(p.size * pop)}px Cinzel, Georgia, serif`;
      c.textAlign = "center";
      c.lineWidth = 5;
      c.strokeStyle = "rgba(0,0,0,.85)";
      c.strokeText(p.text ?? "", p.x, p.y);
      c.fillStyle = p.color;
      c.fillText(p.text ?? "", p.x, p.y);
    }
    c.globalAlpha = 1;
  }
  /** movimiento de texto (se actualiza junto al resto en drawParts, aquí solo se crea) */
  add(p: P) {
    if (this.parts.length > 700 * this.quality + 60) this.parts.shift();
    this.parts.push(p);
    if(this.canvas && !this.running && !document.hidden)this.start();
  }
  burst(x: number, y: number, color = "#ffb347", count = 28, speed = 320, gravity = 520) {
    const n = Math.max(4, Math.round(count * this.quality));
    for (let i = 0; i < n; i++) {
      const a = Math.random() * 6.283;
      const s = speed * (0.25 + Math.random() * 0.85);
      const life = 0.45 + Math.random() * 0.6;
      this.add({ k: Math.random() < 0.4 ? "spark" : "dot", x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 90, g: gravity, life, max: life, size: 1.5 + Math.random() * 3, color });
    }
  }
  ring(x: number, y: number, color = "#ffd27a", size = 120) {
    this.add({ k: "ring", x, y, vx: 0, vy: 0, g: 0, life: 0.55, max: 0.55, size, color });
  }
  slash(x: number, y: number, color = "#fff2c4", size = 90) {
    this.add({ k: "slash", x, y, vx: 0, vy: 0, g: 0, life: 0.28, max: 0.28, size, color, rot: -0.7 + Math.random() * 0.4 });
  }
  text(x: number, y: number, text: string, color = "#ffe28a", size = 34) {
    this.add({ k: "text", x, y, vx: 0, vy: -70, g: 40, life: 1.1, max: 1.1, size, color, text });
  }
  confetti(count = 70) {
    const cols = ["#ffd27a", "#ff8a3c", "#b986ff", "#7affc8", "#ff5a6a"];
    const n = Math.round(count * Math.max(0.4, this.quality));
    for (let i = 0; i < n; i++) {
      const life = 1.4 + Math.random() * 1.2;
      this.add({ k: "confetti", x: Math.random() * this.w, y: -10 - Math.random() * 80, vx: (Math.random() - 0.5) * 120, vy: 120 + Math.random() * 180, g: 160, life, max: life, size: 3 + Math.random() * 3, color: cols[i % cols.length], rot: Math.random() * 6, vr: (Math.random() - 0.5) * 12 });
    }
  }
  /** explosión grande para muertes de monstruos */
  boom(x: number, y: number, color: string) {
    this.burst(x, y, color, 70, 520, 420);
    this.burst(x, y, "#fff3c4", 30, 300, 300);
    this.ring(x, y, color, 220);
    this.ring(x, y, "#ffffff", 140);
  }
  shake(amp = 10, dur = 360) {
    const el = document.getElementById("shake-root");
    if (!el || typeof el.animate !== "function") return;
    const frames: Keyframe[] = [];
    const n = 9;
    for (let i = 0; i < n; i++) {
      const k = 1 - i / n;
      frames.push({ transform: `translate(${(Math.random() - 0.5) * 2 * amp * k}px, ${(Math.random() - 0.5) * 2 * amp * k}px) rotate(${(Math.random() - 0.5) * amp * 0.05 * k}deg)` });
    }
    frames.push({ transform: "translate(0,0)" });
    el.animate(frames, { duration: dur, easing: "ease-out" });
  }
  flash(color = "rgba(255,255,255,.55)", dur = 260) {
    const el = document.getElementById("fx-flash");
    if (!el || typeof el.animate !== "function") return;
    el.style.background = color;
    el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: dur, easing: "ease-out" });
  }
}

export const fx = new FX();

export function centerOf(el: Element | null): { x: number; y: number } {
  if (!el) return { x: window.innerWidth / 2, y: window.innerHeight / 3 };
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}
