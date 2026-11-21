/* eslint-disable @typescript-eslint/no-explicit-any */
import type { TestCase, TestOutcome } from "@/lib/types";
import { judge } from "./common";

class PErr extends Error {
  ln: number;
  constructor(m: string, ln = 0) {
    super(m);
    this.ln = ln;
  }
}

const nz = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

interface Tok {
  k: "num" | "str" | "id" | "op";
  v: string;
  w: string;
}
interface Line {
  toks: Tok[];
  ln: number;
}

const OPS2 = ["<-", "<>", "<=", ">=", "==", "!=", ":=", "&&", "||"];

function tokenize(src: string, ln: number): Tok[] {
  const t: Tok[] = [];
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (/\s/.test(c)) {
      i++;
      continue;
    }
    if (c === "/" && src[i + 1] === "/") break;
    if (c === '"' || c === "'" || c === "“" || c === "”") {
      const close = c === "“" ? "”" : c;
      let j = i + 1;
      let s = "";
      while (j < src.length && src[j] !== close && !(c === "”" && src[j] === "”")) {
        s += src[j];
        j++;
      }
      if (j >= src.length) throw new PErr("Falta cerrar las comillas del texto", ln);
      t.push({ k: "str", v: s, w: "" });
      i = j + 1;
      continue;
    }
    if (/[0-9]/.test(c) || (c === "." && /[0-9]/.test(src[i + 1] || ""))) {
      let j = i;
      while (j < src.length && /[0-9]/.test(src[j])) j++;
      if (src[j] === "." && /[0-9]/.test(src[j + 1] || "")) {
        j++;
        while (j < src.length && /[0-9]/.test(src[j])) j++;
      }
      t.push({ k: "num", v: src.slice(i, j), w: "" });
      i = j;
      continue;
    }
    if (/[A-Za-zÀ-ÿ_]/.test(c)) {
      let j = i;
      while (j < src.length && /[A-Za-zÀ-ÿ0-9_]/.test(src[j])) j++;
      const v = src.slice(i, j);
      t.push({ k: "id", v, w: nz(v) });
      i = j;
      continue;
    }
    const two = src.slice(i, i + 2);
    if (OPS2.includes(two)) {
      t.push({ k: "op", v: two, w: "" });
      i += 2;
      continue;
    }
    if ("+-*/%^()[],:=<>!;".includes(c)) {
      t.push({ k: "op", v: c, w: "" });
      i++;
      continue;
    }
    throw new PErr(`No reconozco el símbolo «${c}»`, ln);
  }
  return t;
}

type E =
  | { t: "lit"; v: any }
  | { t: "ref"; name: string; idx: E[]; ln: number }
  | { t: "call"; name: string; args: E[]; ln: number }
  | { t: "bin"; op: string; a: E; b: E; ln: number }
  | { t: "un"; op: string; a: E; ln: number }
  | { t: "arr"; items: E[] };

type S =
  | { t: "def"; names: string[]; type: string; ln: number }
  | { t: "dim"; items: { name: string; dims: E[] }[]; ln: number }
  | { t: "set"; target: E; e: E; ln: number }
  | { t: "out"; args: E[]; nl: boolean; ln: number }
  | { t: "in"; targets: E[]; ln: number }
  | { t: "if"; c: E; a: S[]; b: S[]; ln: number }
  | { t: "for"; v: string; from: E; to: E; step: E | null; body: S[]; ln: number }
  | { t: "each"; v: string; arr: E; body: S[]; ln: number }
  | { t: "while"; c: E; body: S[]; ln: number }
  | { t: "rep"; c: E; body: S[]; wm: boolean; ln: number }
  | { t: "sw"; e: E; cases: { vals: E[]; body: S[] }[]; def: S[]; ln: number }
  | { t: "ret"; e: E | null; ln: number }
  | { t: "expr"; e: E; ln: number };

interface Fn {
  name: string;
  params: string[];
  ret: string | null;
  body: S[];
}
interface Prog {
  main: S[];
  fns: Map<string, Fn>;
}

const RESERVED = new Set(["entonces", "hacer", "hasta", "sino", "como", "paso", "finsi", "finpara", "finmientras", "repetir"]);

class ExprP {
  i = 0;
  constructor(
    public toks: Tok[],
    public ln: number,
  ) {}
  peek() {
    return this.toks[this.i];
  }
  isW(w: string) {
    const t = this.toks[this.i];
    return !!t && t.k === "id" && t.w === w;
  }
  isOp(o: string) {
    const t = this.toks[this.i];
    return !!t && t.k === "op" && t.v === o;
  }
  parse(): E {
    return this.or();
  }
  or(): E {
    let a = this.and();
    while (this.isW("o") || this.isOp("||")) {
      this.i++;
      a = { t: "bin", op: "or", a, b: this.and(), ln: this.ln };
    }
    return a;
  }
  and(): E {
    let a = this.not();
    while (this.isW("y") || this.isOp("&&")) {
      this.i++;
      a = { t: "bin", op: "and", a, b: this.not(), ln: this.ln };
    }
    return a;
  }
  not(): E {
    if (this.isW("no") || this.isOp("!")) {
      this.i++;
      return { t: "un", op: "not", a: this.not(), ln: this.ln };
    }
    return this.cmp();
  }
  cmp(): E {
    let a = this.add();
    for (;;) {
      const t = this.peek();
      if (t && t.k === "op" && ["=", "==", "<>", "!=", "<", ">", "<=", ">="].includes(t.v)) {
        this.i++;
        const op = t.v === "=" ? "==" : t.v === "<>" ? "!=" : t.v;
        a = { t: "bin", op, a, b: this.add(), ln: this.ln };
      } else return a;
    }
  }
  add(): E {
    let a = this.mul();
    for (;;) {
      if (this.isOp("+") || this.isOp("-")) {
        const op = this.peek().v;
        this.i++;
        a = { t: "bin", op, a, b: this.mul(), ln: this.ln };
      } else return a;
    }
  }
  mul(): E {
    let a = this.pow();
    for (;;) {
      if (this.isOp("*") || this.isOp("/") || this.isOp("%") || this.isW("mod")) {
        const op = this.peek().k === "id" ? "%" : this.peek().v;
        this.i++;
        a = { t: "bin", op, a, b: this.pow(), ln: this.ln };
      } else return a;
    }
  }
  pow(): E {
    const a = this.unary();
    if (this.isOp("^")) {
      this.i++;
      return { t: "bin", op: "^", a, b: this.pow(), ln: this.ln };
    }
    return a;
  }
  unary(): E {
    if (this.isOp("-")) {
      this.i++;
      return { t: "un", op: "neg", a: this.unary(), ln: this.ln };
    }
    if (this.isOp("+")) {
      this.i++;
      return this.unary();
    }
    return this.primary();
  }
  list(close: string): E[] {
    const out: E[] = [];
    if (this.isOp(close)) {
      this.i++;
      return out;
    }
    for (;;) {
      out.push(this.parse());
      if (this.isOp(",")) {
        this.i++;
        continue;
      }
      if (this.isOp(close)) {
        this.i++;
        return out;
      }
      throw new PErr(`Falta cerrar con «${close}»`, this.ln);
    }
  }
  primary(): E {
    const t = this.toks[this.i];
    if (!t) throw new PErr("Falta un valor o expresión al final de la línea", this.ln);
    if (t.k === "num") {
      this.i++;
      return { t: "lit", v: Number(t.v) };
    }
    if (t.k === "str") {
      this.i++;
      return { t: "lit", v: t.v };
    }
    if (t.k === "op") {
      if (t.v === "(") {
        this.i++;
        const e = this.parse();
        if (!this.isOp(")")) throw new PErr("Falta cerrar el paréntesis «)»", this.ln);
        this.i++;
        return e;
      }
      if (t.v === "[") {
        this.i++;
        return { t: "arr", items: this.list("]") };
      }
      throw new PErr(`No esperaba «${t.v}» aquí`, this.ln);
    }
    if (RESERVED.has(t.w)) throw new PErr(`No esperaba «${t.v}» aquí: falta un valor antes`, this.ln);
    if (t.w === "verdadero" || t.w === "true") {
      this.i++;
      return { t: "lit", v: true };
    }
    if (t.w === "falso" || t.w === "false") {
      this.i++;
      return { t: "lit", v: false };
    }
    this.i++;
    if (this.isOp("(")) {
      this.i++;
      return { t: "call", name: t.v, args: this.list(")"), ln: this.ln };
    }
    const idx: E[] = [];
    while (this.isOp("[")) {
      this.i++;
      idx.push(...this.list("]"));
    }
    return { t: "ref", name: t.v, idx, ln: this.ln };
  }
  done() {
    if (this.i < this.toks.length) {
      const t = this.toks[this.i];
      throw new PErr(`No entiendo «${t.v}» en esta parte de la línea`, this.ln);
    }
  }
}

function hd(l: Line): string {
  const [t0, t1, t2] = l.toks;
  if (!t0) return "";
  if (t0.k === "num" || t0.k === "str") return "caso";
  if (t0.k !== "id") return "";
  const w = t0.w;
  if (w === "fin" && t1?.k === "id") return "fin" + t1.w;
  if (w === "si" && l.toks.length === 2 && t1?.w === "no") return "sino";
  if (w === "mientras" && t1?.k === "id" && t1.w === "que") return "mientrasque";
  if (w === "de" && t1?.w === "otro" && t2?.w === "modo") return "deotromodo";
  return w;
}

const TYPE_DEFAULT: Record<string, any> = { entero: 0, real: 0, numero: 0, numerico: 0, caracter: "", cadena: "", texto: "", logico: false };

class StmtP {
  pos = 0;
  constructor(public lines: Line[]) {}

  inline(rest: Tok[], ln: number) {
    if (rest.length) this.lines.splice(this.pos, 0, { toks: rest, ln });
  }
  block(ends: string[]): S[] {
    const out: S[] = [];
    while (this.pos < this.lines.length) {
      if (ends.includes(hd(this.lines[this.pos]))) return out;
      out.push(this.stmt());
    }
    return out;
  }
  end(ends: string[], what: string, ln: number) {
    if (this.pos >= this.lines.length || !ends.includes(hd(this.lines[this.pos]))) {
      throw new PErr(`Falta «${what}»: el bloque que empieza en la línea ${ln} nunca se cierra`, ln);
    }
    this.pos++;
  }
  expectW(p: ExprP, w: string, label: string) {
    if (!p.isW(w)) throw new PErr(`Falta «${label}»`, p.ln);
    p.i++;
  }

  program(): Prog {
    const main: S[] = [];
    const fns = new Map<string, Fn>();
    while (this.pos < this.lines.length) {
      const l = this.lines[this.pos];
      const h = hd(l);
      if (h === "algoritmo" || h === "proceso") {
        this.pos++;
        main.push(...this.block(["finalgoritmo", "finproceso"]));
        if (this.pos < this.lines.length) this.pos++;
      } else if (h === "funcion" || h === "subproceso") {
        const f = this.func(l);
        fns.set(nz(f.name), f);
      } else if (h === "finalgoritmo" || h === "finproceso") {
        this.pos++;
      } else {
        main.push(this.stmt());
      }
    }
    return { main, fns };
  }

  func(l: Line): Fn {
    this.pos++;
    const t = l.toks;
    let i = 1;
    let ret: string | null = null;
    if (t[i + 1] && t[i + 1].k === "op" && (t[i + 1].v === "<-" || t[i + 1].v === "=")) {
      ret = nz(t[i].v);
      i += 2;
    }
    if (!t[i] || t[i].k !== "id") throw new PErr("Falta el nombre de la función", l.ln);
    const name = t[i].v;
    i++;
    const params: string[] = [];
    if (t[i] && t[i].v === "(") {
      i++;
      while (t[i] && t[i].v !== ")") {
        if (t[i].w === "por" || t[i].w === "como") { i += 2; continue; }
        if (t[i].k === "id") params.push(nz(t[i].v));
        i++;
      }
    }
    const body = this.block(["finfuncion", "finsubproceso"]);
    this.end(["finfuncion", "finsubproceso"], "FinFuncion", l.ln);
    return { name, params, ret, body };
  }

  stmt(): S {
    const line = this.lines[this.pos];
    const { toks, ln } = line;
    const h = hd(line);
    this.pos++;
    const p = new ExprP(toks, ln);
    switch (h) {
      case "definir": {
        p.i = 1;
        const names: string[] = [];
        while (p.peek() && !p.isW("como")) {
          if (p.peek().k === "id") names.push(nz(p.peek().v));
          p.i++;
        }
        return { t: "def", names, type: toks[p.i + 1]?.w ?? "entero", ln };
      }
      case "dimension":
      case "dimensionar": {
        p.i = 1;
        const items: { name: string; dims: E[] }[] = [];
        while (p.peek()) {
          const t = p.peek();
          if (t.k !== "id") throw new PErr("Falta el nombre del arreglo", ln);
          p.i++;
          if (!p.isOp("[")) throw new PErr("Dimension necesita el tamaño entre corchetes: a[10]", ln);
          p.i++;
          items.push({ name: nz(t.v), dims: p.list("]") });
          if (p.isOp(",")) p.i++;
        }
        return { t: "dim", items, ln };
      }
      case "escribir":
      case "mostrar":
      case "imprimir":
      case "escriba": {
        p.i = 1;
        let nl = true;
        if (p.isW("sin") && toks[p.i + 1]?.w === "saltar") {
          p.i += 2;
          nl = false;
        }
        const args: E[] = [];
        if (!p.peek()) throw new PErr("Escribir necesita algo que mostrar", ln);
        for (;;) {
          args.push(p.parse());
          if (p.isOp(",")) {
            p.i++;
            continue;
          }
          break;
        }
        p.done();
        return { t: "out", args, nl, ln };
      }
      case "leer": {
        p.i = 1;
        const targets: E[] = [];
        for (;;) {
          const e = p.primary();
          if (e.t !== "ref") throw new PErr("Leer necesita una variable donde guardar el dato", ln);
          targets.push(e);
          if (p.isOp(",")) {
            p.i++;
            continue;
          }
          break;
        }
        p.done();
        return { t: "in", targets, ln };
      }
      case "si": {
        p.i = 1;
        const c = p.parse();
        this.expectW(p, "entonces", "Entonces");
        this.inline(toks.slice(p.i), ln);
        const a = this.block(["sino", "finsi"]);
        let b: S[] = [];
        if (this.pos < this.lines.length && hd(this.lines[this.pos]) === "sino") {
          const sl = this.lines[this.pos];
          this.pos++;
          this.inline(sl.toks.slice(sl.toks[0].w === "si" ? 2 : 1), sl.ln);
          b = this.block(["finsi"]);
        }
        this.end(["finsi"], "FinSi", ln);
        return { t: "if", c, a, b, ln };
      }
      case "segun": {
        p.i = 1;
        const e = p.parse();
        this.expectW(p, "hacer", "Hacer");
        const cases: { vals: E[]; body: S[] }[] = [];
        let def: S[] = [];
        while (this.pos < this.lines.length) {
          const l = this.lines[this.pos];
          const h2 = hd(l);
          if (h2 === "finsegun") break;
          const ci = l.toks.findIndex((x) => x.k === "op" && x.v === ":");
          if (h2 === "caso") {
            if (ci < 0) throw new PErr("Falta «:» después del valor del caso", l.ln);
            const hp = new ExprP(l.toks.slice(l.toks[0].k === "id" ? 1 : 0, ci), l.ln);
            const vals = [hp.parse()];
            while (hp.isOp(",")) {
              hp.i++;
              vals.push(hp.parse());
            }
            hp.done();
            this.pos++;
            this.inline(l.toks.slice(ci + 1), l.ln);
            cases.push({ vals, body: this.block(["caso", "deotromodo", "finsegun"]) });
          } else if (h2 === "deotromodo") {
            this.pos++;
            this.inline(l.toks.slice(ci + 1), l.ln);
            def = this.block(["caso", "finsegun"]);
          } else throw new PErr("Dentro de Segun solo pueden ir casos (Caso 1:) o De Otro Modo:", l.ln);
        }
        this.end(["finsegun"], "FinSegun", ln);
        return { t: "sw", e, cases, def, ln };
      }
      case "para": {
        p.i = 1;
        if (p.isW("cada")) {
          p.i++;
          const v = p.peek();
          if (!v || v.k !== "id") throw new PErr("Falta la variable de Para Cada", ln);
          p.i++;
          this.expectW(p, "de", "De");
          const arr = p.parse();
          this.expectW(p, "hacer", "Hacer");
          this.inline(toks.slice(p.i), ln);
          const body = this.block(["finpara"]);
          this.end(["finpara"], "FinPara", ln);
          return { t: "each", v: nz(v.v), arr, body, ln };
        }
        const v = p.peek();
        if (!v || v.k !== "id") throw new PErr("Falta la variable del Para (ej: Para i <- 1 Hasta 10 Hacer)", ln);
        p.i++;
        if (!(p.isOp("<-") || p.isOp(":=") || p.isOp("="))) throw new PErr("Después de la variable falta «<-» (ej: Para i <- 1 ...)", ln);
        p.i++;
        const from = p.parse();
        this.expectW(p, "hasta", "Hasta");
        const to = p.parse();
        let step: E | null = null;
        if (p.isW("con")) {
          p.i++;
          this.expectW(p, "paso", "Paso");
          step = p.parse();
        }
        this.expectW(p, "hacer", "Hacer");
        this.inline(toks.slice(p.i), ln);
        const body = this.block(["finpara"]);
        this.end(["finpara"], "FinPara", ln);
        return { t: "for", v: nz(v.v), from, to, step, body, ln };
      }
      case "mientras": {
        p.i = 1;
        const c = p.parse();
        this.expectW(p, "hacer", "Hacer");
        this.inline(toks.slice(p.i), ln);
        const body = this.block(["finmientras"]);
        this.end(["finmientras"], "FinMientras", ln);
        return { t: "while", c, body, ln };
      }
      case "repetir": {
        this.inline(toks.slice(1), ln);
        const body = this.block(["hasta", "mientrasque"]);
        if (this.pos >= this.lines.length) throw new PErr("Falta «Hasta Que condición» para cerrar el Repetir", ln);
        const el = this.lines[this.pos];
        this.pos++;
        const wm = hd(el) === "mientrasque";
        const q = new ExprP(el.toks, el.ln);
        q.i = el.toks[1]?.w === "que" ? 2 : 1;
        const c = q.parse();
        q.done();
        return { t: "rep", c, body, wm, ln };
      }
      case "retornar":
      case "devolver":
      case "retorne":
      case "devuelve":
      case "retorna": {
        p.i = 1;
        const e = p.peek() ? p.parse() : null;
        p.done();
        return { t: "ret", e, ln };
      }
      default:
        break;
    }
    // asignación
    let depth = 0;
    let ai = -1;
    for (let i = 0; i < toks.length; i++) {
      const t = toks[i];
      if (t.k === "op") {
        if (t.v === "(" || t.v === "[") depth++;
        else if (t.v === ")" || t.v === "]") depth--;
        else if (depth === 0 && (t.v === "<-" || t.v === ":=" || (t.v === "=" && toks[0].k === "id"))) {
          ai = i;
          break;
        }
      }
    }
    if (ai > 0) {
      const lp = new ExprP(toks.slice(0, ai), ln);
      const target = lp.primary();
      if (target.t !== "ref") throw new PErr("A la izquierda de «<-» debe ir una variable", ln);
      lp.done();
      const rp = new ExprP(toks.slice(ai + 1), ln);
      const e = rp.parse();
      rp.done();
      return { t: "set", target, e, ln };
    }
    if (toks[0].k === "id" && toks.length > 1 && !(toks[1].k === "op" && toks[1].v === "(")) {
      throw new PErr(`Instrucción desconocida: «${toks[0].v}». ¿Quisiste decir Escribir, Leer, Si, Para, Mientras...?`, ln);
    }
    const e = p.parse();
    p.done();
    if (e.t !== "call") throw new PErr(`Esta línea no hace nada: «${toks.map((x) => x.v).join(" ")}»`, ln);
    return { t: "expr", e, ln };
  }
}

function parseProg(code: string): Prog {
  const lines: Line[] = [];
  code.replace(/\r/g, "").split("\n").forEach((raw, i) => {
    const toks = tokenize(raw, i + 1);
    let cur: Tok[] = [];
    for (const t of toks) {
      if (t.k === "op" && t.v === ";") {
        if (cur.length) lines.push({ toks: cur, ln: i + 1 });
        cur = [];
      } else cur.push(t);
    }
    if (cur.length) lines.push({ toks: cur, ln: i + 1 });
  });
  return new StmtP(lines).program();
}

class PArr {
  constructor(public d: any[]) {}
}
class Ret {
  constructor(public v: any) {}
}

function toS(v: any, ln: number): string {
  if (typeof v === "boolean") return v ? "Verdadero" : "Falso";
  if (typeof v === "number") return Number.isInteger(v) ? String(v) : String(parseFloat(v.toFixed(10)));
  if (v instanceof PArr) throw new PErr("No puedes escribir un arreglo completo: recórrelo con un Para", ln);
  if (v === undefined) return "";
  return String(v);
}
function toJS(v: any): any {
  return v instanceof PArr ? v.d.map(toJS) : v;
}
function fromJS(v: any): any {
  return Array.isArray(v) ? new PArr(v.map(fromJS)) : v;
}

class Run {
  steps = 0;
  out = "";
  depth = 0;
  constructor(
    public prog: Prog,
    public inq: any[],
  ) {}
  tick(ln: number) {
    if (++this.steps > 300000) throw new PErr("El hechizo se descontroló: ¿bucle infinito? (revisa la condición de salida)", ln);
  }
  num(v: any, ln: number): number {
    if (typeof v === "number") return v;
    if (typeof v === "string" && v.trim() !== "" && !isNaN(Number(v))) return Number(v);
    throw new PErr(`Se esperaba un número pero llegó ${typeof v === "boolean" ? "un valor lógico" : v instanceof PArr ? "un arreglo" : `el texto «${v}»`}`, ln);
  }
  bool(v: any, ln: number): boolean {
    if (typeof v !== "boolean") throw new PErr("La condición debe dar Verdadero o Falso (usa comparaciones como x > 3)", ln);
    return v;
  }
  eq(a: any, b: any): boolean {
    if (typeof a === "number" && typeof b === "string" && b.trim() !== "" && !isNaN(Number(b))) return a === Number(b);
    if (typeof b === "number" && typeof a === "string" && a.trim() !== "" && !isNaN(Number(a))) return b === Number(a);
    return a === b;
  }
  mk(dims: number[]): PArr {
    const n = dims[0];
    return new PArr(Array.from({ length: n }, () => (dims.length > 1 ? this.mk(dims.slice(1)) : 0)));
  }
  locate(e: Extract<E, { t: "ref" }>, env: Map<string, any>, upto: number): { arr: PArr; i: number } {
    const key = nz(e.name);
    let cur = env.get(key);
    if (!(cur instanceof PArr)) throw new PErr(`«${e.name}» no es un arreglo (decláralo con Dimension ${e.name}[n])`, e.ln);
    let idx = 0;
    for (let k = 0; k < upto; k++) {
      const i = this.num(this.ev(e.idx[k], env), e.ln);
      if (!(cur instanceof PArr)) throw new PErr(`«${e.name}» tiene menos dimensiones`, e.ln);
      if (!Number.isInteger(i) || i < 1 || i > cur.d.length) {
        throw new PErr(`Índice fuera de rango: ${e.name}[${i}]. Los arreglos van de 1 a ${cur.d.length}`, e.ln);
      }
      if (k === upto - 1) {
        idx = i - 1;
        break;
      }
      cur = cur.d[i - 1];
    }
    return { arr: cur as PArr, i: idx };
  }
  assign(e: Extract<E, { t: "ref" }>, v: any, env: Map<string, any>) {
    if (!e.idx.length) {
      env.set(nz(e.name), v);
      return;
    }
    const { arr, i } = this.locate(e, env, e.idx.length);
    arr.d[i] = v;
  }
  ev(e: E, env: Map<string, any>): any {
    switch (e.t) {
      case "lit":
        return e.v;
      case "arr":
        return new PArr(e.items.map((x) => this.ev(x, env)));
      case "ref": {
        if (!e.idx.length) {
          const k = nz(e.name);
          if (!env.has(k)) throw new PErr(`La variable «${e.name}» no tiene valor todavía (¿la creaste o leíste antes?)`, e.ln);
          return env.get(k);
        }
        const { arr, i } = this.locate(e, env, e.idx.length);
        return arr.d[i];
      }
      case "un": {
        const v = this.ev(e.a, env);
        return e.op === "not" ? !this.bool(v, e.ln) : -this.num(v, e.ln);
      }
      case "bin": {
        if (e.op === "and") return this.bool(this.ev(e.a, env), e.ln) && this.bool(this.ev(e.b, env), e.ln);
        if (e.op === "or") return this.bool(this.ev(e.a, env), e.ln) || this.bool(this.ev(e.b, env), e.ln);
        const a = this.ev(e.a, env);
        const b = this.ev(e.b, env);
        switch (e.op) {
          case "+":
            if (typeof a === "string" || typeof b === "string") return toS(a, e.ln) + toS(b, e.ln);
            return this.num(a, e.ln) + this.num(b, e.ln);
          case "-":
            return this.num(a, e.ln) - this.num(b, e.ln);
          case "*":
            return this.num(a, e.ln) * this.num(b, e.ln);
          case "/": {
            const d = this.num(b, e.ln);
            if (d === 0) throw new PErr("División por cero", e.ln);
            return this.num(a, e.ln) / d;
          }
          case "%": {
            const d = this.num(b, e.ln);
            if (d === 0) throw new PErr("Módulo por cero", e.ln);
            return this.num(a, e.ln) % d;
          }
          case "^":
            return Math.pow(this.num(a, e.ln), this.num(b, e.ln));
          case "==":
            return this.eq(a, b);
          case "!=":
            return !this.eq(a, b);
          default: {
            const x = typeof a === "string" && typeof b === "string" ? a : this.num(a, e.ln);
            const y = typeof a === "string" && typeof b === "string" ? b : this.num(b, e.ln);
            return e.op === "<" ? x < y : e.op === ">" ? x > y : e.op === "<=" ? x <= y : x >= y;
          }
        }
      }
      case "call":
        return this.call(e.name, e.args.map((a) => this.ev(a, env)), e.ln);
    }
  }
  call(name: string, args: any[], ln: number): any {
    const key = nz(name);
    const fn = this.prog.fns.get(key);
    if (fn) {
      if (args.length !== fn.params.length) throw new PErr(`La función ${fn.name} espera ${fn.params.length} dato(s) y recibió ${args.length}`, ln);
      if (++this.depth > 150) throw new PErr("Demasiadas llamadas anidadas (¿recursión sin caso base?)", ln);
      const env = new Map<string, any>();
      fn.params.forEach((p, i) => env.set(p, args[i]));
      const r = this.exec(fn.body, env);
      this.depth--;
      if (r instanceof Ret) return r.v;
      return fn.ret ? env.get(fn.ret) : undefined;
    }
    const n = (i: number) => this.num(args[i], ln);
    const s = (i: number) => toS(args[i], ln);
    switch (key) {
      case "raiz":
      case "rc":
        if (n(0) < 0) throw new PErr("No existe la raíz de un número negativo", ln);
        return Math.sqrt(n(0));
      case "abs":
        return Math.abs(n(0));
      case "trunc":
        return Math.trunc(n(0));
      case "redon":
        return Math.round(n(0));
      case "azar":
        return Math.floor(Math.random() * n(0));
      case "longitud":
        return args[0] instanceof PArr ? args[0].d.length : s(0).length;
      case "mayusculas":
        return s(0).toUpperCase();
      case "minusculas":
        return s(0).toLowerCase();
      case "subcadena":
        return s(0).slice(n(1) - 1, n(2));
      case "concatenar":
        return s(0) + s(1);
      case "convertiranumero":
        return Number(s(0));
      case "convertiratexto":
        return s(0);
      case "sen":
        return Math.sin(n(0));
      case "cos":
        return Math.cos(n(0));
      case "ln":
        return Math.log(n(0));
      case "exp":
        return Math.exp(n(0));
    }
    throw new PErr(`No existe la función «${name}»`, ln);
  }
  exec(list: S[], env: Map<string, any>): Ret | undefined {
    for (const s of list) {
      this.tick(s.ln);
      switch (s.t) {
        case "def":
          for (const n of s.names) if (!env.has(n)) env.set(n, TYPE_DEFAULT[s.type] ?? 0);
          break;
        case "dim":
          for (const it of s.items) env.set(it.name, this.mk(it.dims.map((d) => this.num(this.ev(d, env), s.ln))));
          break;
        case "set":
          this.assign(s.target as Extract<E, { t: "ref" }>, this.ev(s.e, env), env);
          break;
        case "out": {
          const txt = s.args.map((a) => toS(this.ev(a, env), s.ln)).join("");
          this.out += txt + (s.nl ? "\n" : "");
          break;
        }
        case "in":
          for (const t of s.targets) {
            if (!this.inq.length) throw new PErr("Leer no tiene más datos que recibir", s.ln);
            this.assign(t as Extract<E, { t: "ref" }>, this.inq.shift(), env);
          }
          break;
        case "if": {
          const r = this.exec(this.bool(this.ev(s.c, env), s.ln) ? s.a : s.b, env);
          if (r) return r;
          break;
        }
        case "for": {
          const from = this.num(this.ev(s.from, env), s.ln);
          const to = this.num(this.ev(s.to, env), s.ln);
          const step = s.step ? this.num(this.ev(s.step, env), s.ln) : 1;
          if (step === 0) throw new PErr("El paso del Para no puede ser 0", s.ln);
          let i = from;
          for (; step > 0 ? i <= to : i >= to; i += step) {
            this.tick(s.ln);
            env.set(s.v, i);
            const r = this.exec(s.body, env);
            if (r) return r;
          }
          env.set(s.v, i);
          break;
        }
        case "each": {
          const arr = this.ev(s.arr, env);
          if (!(arr instanceof PArr)) throw new PErr("Para Cada necesita un arreglo", s.ln);
          for (const x of arr.d.slice()) {
            this.tick(s.ln);
            env.set(s.v, x);
            const r = this.exec(s.body, env);
            if (r) return r;
          }
          break;
        }
        case "while":
          while (this.bool(this.ev(s.c, env), s.ln)) {
            this.tick(s.ln);
            const r = this.exec(s.body, env);
            if (r) return r;
          }
          break;
        case "rep":
          do {
            this.tick(s.ln);
            const r = this.exec(s.body, env);
            if (r) return r;
          } while (s.wm ? this.bool(this.ev(s.c, env), s.ln) : !this.bool(this.ev(s.c, env), s.ln));
          break;
        case "sw": {
          const v = this.ev(s.e, env);
          let body = s.def;
          for (const c of s.cases) {
            if (c.vals.some((x) => this.eq(v, this.ev(x, env)))) {
              body = c.body;
              break;
            }
          }
          const r = this.exec(body, env);
          if (r) return r;
          break;
        }
        case "ret":
          return new Ret(s.e ? this.ev(s.e, env) : undefined);
        case "expr":
          this.ev(s.e, env);
          break;
      }
    }
    return undefined;
  }
}

const errMsg = (e: unknown) => {
  if (e instanceof PErr) return e.ln ? `Línea ${e.ln}: ${e.message}` : e.message;
  if (e instanceof RangeError) return "Demasiada recursión";
  return "Error inesperado: " + (e as Error).message;
};

export function pseudoRun(code: string, tests: TestCase[]): { syntax?: string; outcomes: TestOutcome[] } {
  let prog: Prog;
  try {
    prog = parseProg(code);
  } catch (e) {
    return { syntax: errMsg(e), outcomes: [] };
  }
  const outcomes = tests.map((t) => {
    const run = new Run(prog, (t.input ?? []).slice());
    try {
      let value: unknown;
      if (t.call) {
        const p = new ExprP(tokenize(t.call, 0), 0);
        const ex = p.parse();
        value = toJS(run.ev(ex, new Map()));
      } else {
        run.exec(prog.main, new Map());
      }
      return judge(t, { value, out: run.out });
    } catch (e) {
      return judge(t, { out: run.out, err: errMsg(e) });
    }
  });
  return { outcomes };
}

export { fromJS };
