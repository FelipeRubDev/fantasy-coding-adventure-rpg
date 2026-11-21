/* eslint-disable @typescript-eslint/no-explicit-any */
import type { TestCase, TestOutcome } from "@/lib/types";
import { judge } from "./common";

class JErr extends Error {
  ln: number;
  constructor(m: string, ln = 0) {
    super(m);
    this.ln = ln;
  }
}

/* ───────────── Lexer ───────────── */
interface T {
  k: "id" | "num" | "str" | "chr" | "op" | "eof";
  v: string;
  ln: number;
  n?: number;
  d?: boolean;
}
const ESC: Record<string, string> = { n: "\n", t: "\t", r: "\r", b: "\b", f: "\f", "0": "\0", '"': '"', "'": "'", "\\": "\\" };
function esc(src: string, j: number, ln: number): { ch: string; next: number } {
  const e = src[j + 1];
  if (e === "u") return { ch: String.fromCharCode(parseInt(src.slice(j + 2, j + 6), 16)), next: j + 6 };
  if (e in ESC) return { ch: ESC[e], next: j + 2 };
  throw new JErr(`Secuencia de escape inválida: \\${e}`, ln);
}
const OPS2 = ["++", "--", "+=", "-=", "*=", "/=", "%=", "&=", "|=", "^=", "==", "!=", "<=", ">=", "&&", "||", "->", "::"];
function lex(src: string): T[] {
  const out: T[] = [];
  let i = 0;
  let ln = 1;
  const n = src.length;
  while (i < n) {
    const c = src[i];
    if (c === "\n") {
      ln++;
      i++;
      continue;
    }
    if (/\s/.test(c)) {
      i++;
      continue;
    }
    if (c === "/" && src[i + 1] === "/") {
      while (i < n && src[i] !== "\n") i++;
      continue;
    }
    if (c === "/" && src[i + 1] === "*") {
      i += 2;
      while (i < n && !(src[i] === "*" && src[i + 1] === "/")) {
        if (src[i] === "\n") ln++;
        i++;
      }
      i += 2;
      continue;
    }
    if (c === '"') {
      let j = i + 1;
      let s = "";
      while (j < n && src[j] !== '"') {
        if (src[j] === "\n") throw new JErr("Texto sin cerrar: falta la comilla de cierre «\"»", ln);
        if (src[j] === "\\") {
          const r = esc(src, j, ln);
          s += r.ch;
          j = r.next;
        } else s += src[j++];
      }
      if (j >= n) throw new JErr("Texto sin cerrar: falta la comilla de cierre «\"»", ln);
      out.push({ k: "str", v: s, ln });
      i = j + 1;
      continue;
    }
    if (c === "'") {
      let j = i + 1;
      let ch: string;
      if (src[j] === "\\") {
        const r = esc(src, j, ln);
        ch = r.ch;
        j = r.next;
      } else ch = src[j++];
      if (src[j] !== "'") throw new JErr("Carácter inválido: char usa comillas simples y un solo símbolo, ej: 'a'", ln);
      out.push({ k: "chr", v: ch, ln });
      i = j + 1;
      continue;
    }
    if (/[0-9]/.test(c) || (c === "." && /[0-9]/.test(src[i + 1] || ""))) {
      let j = i;
      let d = false;
      let v: number;
      if (c === "0" && /[xX]/.test(src[i + 1] || "")) {
        j = i + 2;
        while (/[0-9a-fA-F_]/.test(src[j] || "")) j++;
        v = parseInt(src.slice(i + 2, j).replace(/_/g, ""), 16);
      } else {
        while (/[0-9_]/.test(src[j] || "")) j++;
        if (src[j] === "." && /[0-9]/.test(src[j + 1] || "")) {
          d = true;
          j++;
          while (/[0-9_]/.test(src[j] || "")) j++;
        }
        if (/[eE]/.test(src[j] || "") && /[0-9+-]/.test(src[j + 1] || "")) {
          d = true;
          j++;
          if (/[+-]/.test(src[j])) j++;
          while (/[0-9]/.test(src[j] || "")) j++;
        }
        v = Number(src.slice(i, j).replace(/_/g, ""));
      }
      if (/[lL]/.test(src[j] || "")) j++;
      else if (/[fFdD]/.test(src[j] || "")) {
        d = true;
        j++;
      }
      out.push({ k: "num", v: src.slice(i, j), ln, n: v, d });
      i = j;
      continue;
    }
    if (/[A-Za-z_$]/.test(c)) {
      let j = i;
      while (j < n && /[A-Za-z0-9_$]/.test(src[j])) j++;
      out.push({ k: "id", v: src.slice(i, j), ln });
      i = j;
      continue;
    }
    const two = src.slice(i, i + 2);
    if (OPS2.includes(two)) {
      out.push({ k: "op", v: two, ln });
      i += 2;
      continue;
    }
    if ("+-*/%=<>!&|^~?:;,.(){}[]@".includes(c)) {
      out.push({ k: "op", v: c, ln });
      i++;
      continue;
    }
    throw new JErr(`Símbolo no reconocido: «${c}»`, ln);
  }
  out.push({ k: "eof", v: "el final del código", ln });
  return out;
}

/* ───────────── Parser ───────────── */
const MODS = new Set(["public", "private", "protected", "static", "final", "abstract", "synchronized", "native", "transient", "volatile", "strictfp", "default"]);
const PRIMS = new Set(["int", "long", "double", "float", "boolean", "char", "byte", "short"]);
const KW = new Set(["if", "else", "for", "while", "do", "return", "break", "continue", "new", "switch", "case", "class", "throw", "try", "catch", "finally", "this", "super", "null", "true", "false", "instanceof", "import", "package", "void"]);
const ASSIGN = new Set(["=", "+=", "-=", "*=", "/=", "%=", "&=", "|=", "^="]);
const PREC: Record<string, number> = { "||": 1, "&&": 2, "|": 3, "^": 4, "&": 5, "==": 6, "!=": 6, "<": 7, ">": 7, "<=": 7, ">=": 7, instanceof: 7, "+": 8, "-": 8, "*": 9, "/": 9, "%": 9 };

interface CDecl {
  name: string;
  sup: string | null;
  ifs: string[];
  fields: any[];
  methods: any[];
  ctors: any[];
  inits: any[];
}

class JP {
  i = 0;
  constructor(public t: T[]) {}
  get cur() {
    return this.t[this.i];
  }
  atEof() {
    return this.t[this.i].k === "eof";
  }
  isOp(v: string, o = 0) {
    const t = this.t[this.i + o];
    return !!t && t.k === "op" && t.v === v;
  }
  isId(v: string, o = 0) {
    const t = this.t[this.i + o];
    return !!t && t.k === "id" && t.v === v;
  }
  eat(v: string) {
    if (this.isOp(v)) {
      this.i++;
      return true;
    }
    return false;
  }
  expect(v: string) {
    if (!this.eat(v)) {
      const prev = this.t[this.i - 1];
      const bad = this.cur;
      const hint = v === ";" ? " (¿olvidaste el punto y coma al final de la instrucción?)" : v === ")" ? " (¿falta cerrar un paréntesis?)" : v === "}" ? " (¿falta cerrar una llave?)" : "";
      throw new JErr(`Se esperaba «${v}» pero se encontró «${bad.v}»${hint}`, v === ";" && prev ? prev.ln : bad.ln);
    }
  }
  id(): string {
    const t = this.cur;
    if (t.k !== "id") throw new JErr(`Se esperaba un nombre pero se encontró «${t.v}»`, t.ln);
    this.i++;
    return t.v;
  }
  skipBalanced(open: string, close: string) {
    let d = 0;
    do {
      const x = this.cur;
      if (x.k === "eof") throw new JErr(`Falta cerrar «${close}»`, x.ln);
      if (x.k === "op" && x.v === open) d++;
      else if (x.k === "op" && x.v === close) d--;
      this.i++;
    } while (d > 0);
  }
  mods(): Set<string> {
    const m = new Set<string>();
    for (;;) {
      if (this.isOp("@") && this.t[this.i + 1]?.k === "id" && this.t[this.i + 1].v !== "interface") {
        this.i += 2;
        if (this.isOp("(")) this.skipBalanced("(", ")");
        continue;
      }
      const t = this.cur;
      if (t.k === "id" && MODS.has(t.v) && !(t.v === "default" && (this.isOp(":", 1) || this.isOp("->", 1)))) {
        m.add(t.v);
        this.i++;
      } else return m;
    }
  }
  type(): string {
    const t = this.cur;
    if (t.k !== "id") throw new JErr(`Se esperaba un tipo pero se encontró «${t.v}»`, t.ln);
    this.i++;
    let s = t.v;
    while (this.isOp(".") && this.t[this.i + 1]?.k === "id") {
      this.i++;
      s = this.id();
    }
    if (this.isOp("<")) this.skipBalanced("<", ">");
    while (this.isOp("[") && this.isOp("]", 1)) {
      this.i += 2;
      s += "[]";
    }
    return s;
  }
  unit(): CDecl[] {
    const out: CDecl[] = [];
    const loose: CDecl = { name: "Main", sup: null, ifs: [], fields: [], methods: [], ctors: [], inits: [] };
    while (!this.atEof()) {
      if (this.isId("import") || this.isId("package")) {
        while (!this.isOp(";") && !this.atEof()) this.i++;
        this.i++;
        continue;
      }
      if (this.eat(";")) continue;
      const m = this.mods();
      if (this.isId("class") || this.isId("interface") || this.isId("enum") || this.isId("record")) {
        this.classDecl(out, m);
      } else this.member(loose, m);
    }
    if (loose.methods.length || loose.fields.length) out.push(loose);
    return out;
  }
  classDecl(out: CDecl[], _m: Set<string>) {
    const kind = this.id();
    if (kind === "enum" || kind === "record") throw new JErr(`«${kind}» no está soportado en este entorno de práctica`, this.cur.ln);
    const name = this.id();
    const c: CDecl = { name, sup: null, ifs: [], fields: [], methods: [], ctors: [], inits: [] };
    if (this.isOp("<")) this.skipBalanced("<", ">");
    if (this.isId("extends")) {
      this.i++;
      if (kind === "interface") {
        do c.ifs.push(this.type());
        while (this.eat(","));
      } else c.sup = this.type();
    }
    if (this.isId("implements")) {
      this.i++;
      do c.ifs.push(this.type());
      while (this.eat(","));
    }
    this.expect("{");
    while (!this.isOp("}")) {
      if (this.cur.k === "eof") throw new JErr(`Falta cerrar la llave «}» de la clase ${name}`, this.cur.ln);
      if (this.eat(";")) continue;
      const m = this.mods();
      if (this.isId("class") || this.isId("interface")) this.classDecl(out, m);
      else this.member(c, m, kind === "interface");
    }
    this.expect("}");
    out.push(c);
  }
  params(): { type: string; name: string }[] {
    const ps: { type: string; name: string }[] = [];
    this.expect("(");
    if (!this.isOp(")")) {
      do {
        this.mods();
        const type = this.type();
        const name = this.id();
        ps.push({ type, name });
      } while (this.eat(","));
    }
    this.expect(")");
    return ps;
  }
  member(c: CDecl, m: Set<string>, iface = false) {
    const ln = this.cur.ln;
    if (this.isOp("{")) {
      c.inits.push({ static: m.has("static"), body: this.block() });
      return;
    }
    if (this.isOp("<")) this.skipBalanced("<", ">");
    if (this.cur.k === "id" && this.cur.v === c.name && this.isOp("(", 1)) {
      this.i++;
      const params = this.params();
      if (this.isId("throws")) {
        this.i++;
        do this.type();
        while (this.eat(","));
      }
      c.ctors.push({ name: c.name, params, body: this.block(), ln });
      return;
    }
    const type = this.type();
    const name = this.id();
    if (this.isOp("(")) {
      const params = this.params();
      while (this.isOp("[")) this.i += 2;
      if (this.isId("throws")) {
        this.i++;
        do this.type();
        while (this.eat(","));
      }
      let body: any[] | null = null;
      if (this.isOp("{")) body = this.block();
      else this.expect(";");
      c.methods.push({ name, params, ret: type, body, static: m.has("static"), ln });
      return;
    }
    let nm = name;
    for (;;) {
      let t = type;
      while (this.isOp("[")) {
        this.i += 2;
        t += "[]";
      }
      let init = null;
      if (this.eat("=")) init = this.varInit();
      c.fields.push({ name: nm, type: t, init, static: m.has("static") || iface });
      if (this.eat(",")) {
        nm = this.id();
        continue;
      }
      break;
    }
    this.expect(";");
  }
  varInit(): any {
    if (this.isOp("{")) {
      const ln = this.cur.ln;
      this.i++;
      const items: any[] = [];
      while (!this.isOp("}")) {
        items.push(this.varInit());
        if (!this.eat(",")) break;
      }
      this.expect("}");
      return { t: "arrlit", items, ln };
    }
    return this.expr();
  }
  block(): any[] {
    this.expect("{");
    const out: any[] = [];
    while (!this.isOp("}")) {
      if (this.cur.k === "eof") throw new JErr("Falta cerrar una llave «}»: el bloque nunca termina", this.cur.ln);
      out.push(this.stmt());
    }
    this.i++;
    return out;
  }
  isLocal(): boolean {
    const save = this.i;
    try {
      if (this.isId("final")) this.i++;
      const t = this.cur;
      if (t.k !== "id" || (KW.has(t.v) && !PRIMS.has(t.v))) return false;
      this.type();
      const n = this.cur;
      if (n.k !== "id" || KW.has(n.v)) return false;
      const a = this.t[this.i + 1];
      return !!a && a.k === "op" && ["=", ";", ",", ":", "["].includes(a.v);
    } catch {
      return false;
    } finally {
      this.i = save;
    }
  }
  local(semi: boolean): any {
    const ln = this.cur.ln;
    if (this.isId("final")) this.i++;
    const type = this.type();
    const vars: any[] = [];
    do {
      const name = this.id();
      let t = type;
      while (this.isOp("[")) {
        this.i += 2;
        t += "[]";
      }
      let init = null;
      if (this.eat("=")) init = this.varInit();
      vars.push({ name, type: t, init });
    } while (this.eat(","));
    if (semi) this.expect(";");
    return { t: "local", vars, ln };
  }
  stmt(): any {
    const t = this.cur;
    const ln = t.ln;
    if (t.k === "op") {
      if (t.v === "{") return { t: "block", body: this.block(), ln };
      if (t.v === ";") {
        this.i++;
        return { t: "empty", ln };
      }
    }
    if (t.k === "id") {
      switch (t.v) {
        case "if": {
          this.i++;
          this.expect("(");
          const c = this.expr();
          this.expect(")");
          const a = this.stmt();
          let b = null;
          if (this.isId("else")) {
            this.i++;
            b = this.stmt();
          }
          return { t: "if", c, a, b, ln };
        }
        case "while": {
          this.i++;
          this.expect("(");
          const c = this.expr();
          this.expect(")");
          return { t: "while", c, body: this.stmt(), ln };
        }
        case "do": {
          this.i++;
          const body = this.stmt();
          if (!this.isId("while")) throw new JErr("Falta el «while» del bloque do { ... } while (condición);", this.cur.ln);
          this.i++;
          this.expect("(");
          const c = this.expr();
          this.expect(")");
          this.expect(";");
          return { t: "do", c, body, ln };
        }
        case "for": {
          this.i++;
          this.expect("(");
          const init: any[] = [];
          if (!this.isOp(";")) {
            if (this.isLocal()) {
              const save = this.i;
              if (this.isId("final")) this.i++;
              const type = this.type();
              const name = this.id();
              if (this.eat(":")) {
                const iter = this.expr();
                this.expect(")");
                return { t: "foreach", type, name, iter, body: this.stmt(), ln };
              }
              this.i = save;
              init.push(this.local(false));
            } else {
              do init.push({ t: "expr", e: this.expr(), ln });
              while (this.eat(","));
            }
          }
          this.expect(";");
          const c = this.isOp(";") ? null : this.expr();
          this.expect(";");
          const upd: any[] = [];
          if (!this.isOp(")")) {
            do upd.push(this.expr());
            while (this.eat(","));
          }
          this.expect(")");
          return { t: "for", init, c, upd, body: this.stmt(), ln };
        }
        case "return": {
          this.i++;
          const e = this.isOp(";") ? null : this.expr();
          this.expect(";");
          return { t: "return", e, ln };
        }
        case "break":
        case "continue":
          this.i++;
          this.expect(";");
          return { t: t.v, ln };
        case "throw": {
          this.i++;
          const e = this.expr();
          this.expect(";");
          return { t: "throw", e, ln };
        }
        case "yield":
          if (!this.isOp("=", 1) && !this.isOp(".", 1)) {
            this.i++;
            const e = this.expr();
            this.expect(";");
            return { t: "yield", e, ln };
          }
          break;
        case "try": {
          this.i++;
          if (this.isOp("(")) this.skipBalanced("(", ")");
          const body = this.block();
          const catches: any[] = [];
          let fin = null;
          while (this.isId("catch")) {
            this.i++;
            this.expect("(");
            this.mods();
            const types = [this.type()];
            while (this.eat("|")) types.push(this.type());
            const name = this.id();
            this.expect(")");
            catches.push({ types, name, body: this.block() });
          }
          if (this.isId("finally")) {
            this.i++;
            fin = this.block();
          }
          if (!catches.length && !fin) throw new JErr("Un try necesita al menos un catch o un finally", ln);
          return { t: "try", body, catches, fin, ln };
        }
        case "switch":
          return this.switchNode("switch");
        case "super":
        case "this":
          if (this.isOp("(", 1)) {
            this.i++;
            const args = this.args();
            this.expect(";");
            return { t: "ctorcall", kind: t.v, args, ln };
          }
          break;
        case "else":
          throw new JErr("Hay un «else» sin su «if» (revisa las llaves y el punto y coma anterior)", ln);
      }
    }
    if (this.isLocal()) return this.local(true);
    const e = this.expr();
    this.expect(";");
    return { t: "expr", e, ln };
  }
  switchNode(kind: "switch" | "switchx"): any {
    const ln = this.cur.ln;
    this.i++;
    this.expect("(");
    const e = this.expr();
    this.expect(")");
    this.expect("{");
    const cases: any[] = [];
    while (!this.isOp("}")) {
      let labels: any[] | null = null;
      if (this.isId("case")) {
        this.i++;
        labels = [];
        do labels.push(this.ternary());
        while (this.eat(","));
      } else if (this.isId("default")) this.i++;
      else throw new JErr(`Dentro de switch se esperaba «case» o «default», pero hay «${this.cur.v}»`, this.cur.ln);
      if (this.eat("->")) {
        let body: any;
        if (this.isOp("{")) body = { t: "block", body: this.block(), ln };
        else if (this.isId("throw")) body = this.stmt();
        else {
          const ex = this.expr();
          this.expect(";");
          body = { t: "arrowexpr", e: ex, ln };
        }
        cases.push({ labels, body, arrow: true });
      } else {
        this.expect(":");
        const body: any[] = [];
        while (!this.isOp("}") && !this.isId("case") && !(this.isId("default") && (this.isOp(":", 1) || this.isOp("->", 1)))) body.push(this.stmt());
        cases.push({ labels, body, arrow: false });
      }
    }
    this.i++;
    return { t: kind, e, cases, ln };
  }
  args(): any[] {
    this.expect("(");
    const a: any[] = [];
    if (!this.isOp(")")) {
      do a.push(this.expr());
      while (this.eat(","));
    }
    this.expect(")");
    return a;
  }
  expr(): any {
    const lhs = this.ternary();
    const t = this.cur;
    if (t.k === "op" && ASSIGN.has(t.v)) {
      if (!["name", "field", "index"].includes(lhs.t)) throw new JErr("A la izquierda del «=» debe ir una variable", t.ln);
      this.i++;
      return { t: "assign", op: t.v, target: lhs, value: this.expr(), ln: t.ln };
    }
    return lhs;
  }
  ternary(): any {
    const c = this.bin(1);
    if (this.isOp("?")) {
      const ln = this.cur.ln;
      this.i++;
      const a = this.expr();
      this.expect(":");
      return { t: "cond", c, a, b: this.ternary(), ln };
    }
    return c;
  }
  bin(min: number): any {
    let a = this.unary();
    for (;;) {
      const t = this.cur;
      if (t.k !== "op" && !(t.k === "id" && t.v === "instanceof")) return a;
      const p = PREC[t.v];
      if (!p || p < min) return a;
      this.i++;
      if (t.v === "instanceof") {
        const type = this.type();
        let bind: string | null = null;
        if (this.cur.k === "id" && !KW.has(this.cur.v)) bind = this.id();
        a = { t: "instanceof", e: a, type, bind, ln: t.ln };
        continue;
      }
      a = { t: "bin", op: t.v, a, b: this.bin(p + 1), ln: t.ln };
    }
  }
  unary(): any {
    const t = this.cur;
    const ln = t.ln;
    if (t.k === "op") {
      if (t.v === "-" || t.v === "+" || t.v === "!" || t.v === "~") {
        this.i++;
        return { t: "un", op: t.v, e: this.unary(), ln };
      }
      if (t.v === "++" || t.v === "--") {
        this.i++;
        return { t: "inc", op: t.v, pre: true, target: this.unary(), ln };
      }
      if (t.v === "(" && this.t[this.i + 1]?.k === "id" && PRIMS.has(this.t[this.i + 1].v) && (this.isOp(")", 2) || this.isOp("[", 2))) {
        this.i++;
        const type = this.type();
        this.expect(")");
        return { t: "cast", type, e: this.unary(), ln };
      }
      if (t.v === "(" && this.isId("String", 1) && this.isOp(")", 2)) {
        this.i += 3;
        return this.unary();
      }
    }
    return this.postfix();
  }
  postfix(): any {
    let e = this.primary();
    for (;;) {
      const t = this.cur;
      if (t.k !== "op") return e;
      if (t.v === ".") {
        this.i++;
        const name = this.id();
        if (this.isOp("(")) e = { t: "call", target: e, name, args: this.args(), ln: t.ln };
        else e = { t: "field", target: e, name, ln: t.ln };
      } else if (t.v === "[") {
        this.i++;
        const idx = this.expr();
        this.expect("]");
        e = { t: "index", target: e, idx, ln: t.ln };
      } else if (t.v === "++" || t.v === "--") {
        this.i++;
        e = { t: "inc", op: t.v, pre: false, target: e, ln: t.ln };
      } else return e;
    }
  }
  primary(): any {
    const t = this.cur;
    const ln = t.ln;
    if (t.k === "num") {
      this.i++;
      return { t: "lit", v: t.d ? new JD(t.n!) : t.n, ln };
    }
    if (t.k === "str") {
      this.i++;
      return { t: "lit", v: t.v, ln };
    }
    if (t.k === "chr") {
      this.i++;
      return { t: "lit", v: new JC(t.v.charCodeAt(0)), ln };
    }
    if (t.k === "op" && t.v === "(") {
      this.i++;
      const e = this.expr();
      this.expect(")");
      return e;
    }
    if (t.k === "id") {
      switch (t.v) {
        case "true":
          this.i++;
          return { t: "lit", v: true, ln };
        case "false":
          this.i++;
          return { t: "lit", v: false, ln };
        case "null":
          this.i++;
          return { t: "lit", v: null, ln };
        case "this":
          this.i++;
          return { t: "this", ln };
        case "super":
          this.i++;
          return { t: "super", ln };
        case "switch":
          return this.switchNode("switchx");
        case "new":
          return this.newExpr();
      }
      if (KW.has(t.v)) throw new JErr(`No esperaba «${t.v}» en esta posición`, ln);
      this.i++;
      if (this.isOp("->")) throw new JErr("Las expresiones lambda no están disponibles en este entorno de práctica", ln);
      if (this.isOp("(")) return { t: "call", target: null, name: t.v, args: this.args(), ln };
      return { t: "name", name: t.v, ln };
    }
    throw new JErr(`Se esperaba una expresión pero se encontró «${t.v}»`, ln);
  }
  newExpr(): any {
    const ln = this.cur.ln;
    this.i++;
    let name = this.id();
    while (this.isOp(".") && this.t[this.i + 1]?.k === "id") {
      this.i++;
      name = this.id();
    }
    if (this.isOp("<")) this.skipBalanced("<", ">");
    if (this.isOp("[")) {
      const dims: any[] = [];
      let extra = 0;
      while (this.isOp("[")) {
        this.i++;
        if (this.eat("]")) extra++;
        else {
          dims.push(this.expr());
          this.expect("]");
        }
      }
      let init = null;
      if (this.isOp("{")) init = this.varInit();
      else if (!dims.length) throw new JErr("Al crear un arreglo falta su tamaño: new int[5]", ln);
      return { t: "newarr", base: name, dims, extra, init, ln };
    }
    if (!this.isOp("(")) throw new JErr(`Después de new ${name} faltan los paréntesis (): new ${name}()`, ln);
    const args = this.args();
    if (this.isOp("{")) throw new JErr("Las clases anónimas no están disponibles en este entorno de práctica", ln);
    return { t: "new", cls: name, args, ln };
  }
}

/* ───────────── Valores ───────────── */
class JD {
  constructor(public v: number) {}
}
class JC {
  constructor(public c: number) {}
}
class JArr {
  constructor(
    public t: string,
    public a: any[],
  ) {}
}
class JList {
  a: any[] = [];
  constructor(public kind: string) {}
}
class JMap {
  m = new Map<string, [any, any]>();
  constructor(
    public set: boolean,
    public sorted: boolean,
  ) {}
}
class JSB {
  s = "";
}
class JEntry {
  constructor(
    public k: any,
    public v: any,
  ) {}
}
class JSys {}
class JClassInfo {
  constructor(public name: string) {}
}
class BiRef {
  constructor(public name: string) {}
}
class JObj {
  f = new Map<string, Cell>();
  constructor(public cls: JClass) {}
}
interface Cell {
  v: any;
  t: string;
}
class JClass {
  sup: JClass | null = null;
  ifs: JClass[] = [];
  methods = new Map<string, any[]>();
  statics = new Map<string, Cell>();
  constructor(public d: CDecl) {
    for (const m of d.methods) {
      if (!this.methods.has(m.name)) this.methods.set(m.name, []);
      this.methods.get(m.name)!.push(m);
    }
  }
  get name() {
    return this.d.name;
  }
}
class JThrow {
  constructor(public ex: JObj) {}
}
class RetSig {
  constructor(public v: any) {}
}
class YieldSig {
  constructor(public v: any) {}
}
const BRK = { k: "break" };
const CNT = { k: "continue" };

class Env {
  vars = new Map<string, Cell>();
  constructor(
    public parent: Env | null,
    public self: JObj | null,
    public cls: JClass | null,
  ) {}
}

const BUILTIN = new Set(["Math", "System", "Integer", "Double", "Long", "Boolean", "Character", "String", "Arrays", "Collections", "List", "Set", "Map", "Objects", "Float", "Short", "Byte", "Thread"]);

const numOf = (v: any): number | undefined => (typeof v === "number" ? v : v instanceof JD ? v.v : v instanceof JC ? v.c : undefined);

function dStr(v: number): string {
  if (Number.isNaN(v)) return "NaN";
  if (!Number.isFinite(v)) return v > 0 ? "Infinity" : "-Infinity";
  const a = Math.abs(v);
  if (Number.isInteger(v) && a < 1e7) return v.toFixed(1);
  if (a >= 1e7 || (a < 1e-3 && a > 0)) {
    const [m, e] = v.toExponential().split("e");
    return (m.includes(".") ? m : m + ".0") + "E" + (e[0] === "+" ? e.slice(1) : e);
  }
  return String(v);
}

function cmpStr(a: string, b: string): number {
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) if (a[i] !== b[i]) return a.charCodeAt(i) - b.charCodeAt(i);
  return a.length - b.length;
}

const EXC: [string, string][] = [
  ["Exception", "Throwable"],
  ["Error", "Throwable"],
  ["RuntimeException", "Exception"],
  ["IllegalArgumentException", "RuntimeException"],
  ["IllegalStateException", "RuntimeException"],
  ["ArithmeticException", "RuntimeException"],
  ["NullPointerException", "RuntimeException"],
  ["IndexOutOfBoundsException", "RuntimeException"],
  ["ArrayIndexOutOfBoundsException", "IndexOutOfBoundsException"],
  ["StringIndexOutOfBoundsException", "IndexOutOfBoundsException"],
  ["NumberFormatException", "IllegalArgumentException"],
  ["UnsupportedOperationException", "RuntimeException"],
  ["ClassCastException", "RuntimeException"],
  ["NegativeArraySizeException", "RuntimeException"],
  ["NoSuchElementException", "RuntimeException"],
  ["StackOverflowError", "Error"],
  ["IOException", "Exception"],
  ["InterruptedException", "Exception"],
  ["CloneNotSupportedException", "Exception"],
];
const PRELUDE_SRC =
  "class Object {} class Throwable { String message; Throwable() {} Throwable(String message) { this.message = message; } String getMessage() { return message; } void printStackTrace() {} } " +
  EXC.map(([n, p]) => `class ${n} extends ${p} { ${n}() { super(); } ${n}(String m) { super(m); } }`).join(" ");

/* ───────────── Intérprete ───────────── */
class Interp {
  classes = new Map<string, JClass>();
  order: JClass[] = [];
  out = "";
  steps = 0;
  depth = 0;
  ids = new WeakMap<object, number>();
  nid = 1;

  constructor(decls: CDecl[]) {
    for (const d of decls) {
      const c = new JClass(d);
      this.classes.set(d.name, c);
      this.order.push(c);
    }
    for (const c of this.order) {
      if (c.d.sup) {
        const s = this.classes.get(c.d.sup);
        if (!s) throw new JErr(`No encuentro la clase padre «${c.d.sup}» de ${c.name}`);
        c.sup = s;
      }
      c.ifs = c.d.ifs.map((n) => this.classes.get(n)).filter((x): x is JClass => !!x);
    }
    for (const c of this.order) {
      const env = new Env(null, null, c);
      for (const f of c.d.fields) {
        if (f.static) c.statics.set(f.name, { v: f.init ? this.coerce(f.type, this.initVal(f.init, f.type, env), 0) : this.defOf(f.type), t: f.type });
      }
      for (const ib of c.d.inits) if (ib.static) this.execList(ib.body, new Env(env, null, c));
    }
  }

  tick(ln = 0) {
    if (++this.steps > 600000) throw new JErr("El hechizo se descontroló: ¿bucle infinito o recursión sin fin? Revisa la condición de salida", ln);
  }

  /* ── helpers de valores ── */
  defOf(t: string): any {
    switch (t) {
      case "int":
      case "long":
      case "short":
      case "byte":
        return 0;
      case "double":
      case "float":
        return new JD(0);
      case "char":
        return new JC(0);
      case "boolean":
        return false;
      default:
        return null;
    }
  }
  tname(v: any): string {
    if (typeof v === "number") return "int";
    if (v instanceof JD) return "double";
    if (v instanceof JC) return "char";
    if (typeof v === "string") return "String";
    if (typeof v === "boolean") return "boolean";
    if (v === null || v === undefined) return "null";
    if (v instanceof JObj) return v.cls.name;
    if (v instanceof JArr) return v.t + "[]";
    return "Object";
  }
  coerce(t: string, v: any, ln: number, strict = true): any {
    switch (t) {
      case "int":
      case "short":
      case "byte":
      case "long": {
        const wrap = (x: number) => (t === "long" ? x : t === "int" ? x | 0 : t === "short" ? (x << 16) >> 16 : (x << 24) >> 24);
        if (typeof v === "number") return wrap(v);
        if (v instanceof JC) return v.c;
        if (v instanceof JD) {
          if (strict) throw new JErr(`Tipos incompatibles: no se puede convertir double a ${t} sin perder precisión (usa un cast: (${t}) valor)`, ln);
          return wrap(Math.trunc(v.v));
        }
        throw new JErr(`Tipos incompatibles: ${this.tname(v)} no se puede convertir a ${t}`, ln);
      }
      case "double":
      case "float":
        if (v instanceof JD) return v;
        if (typeof v === "number") return new JD(v);
        if (v instanceof JC) return new JD(v.c);
        throw new JErr(`Tipos incompatibles: ${this.tname(v)} no se puede convertir a ${t}`, ln);
      case "char":
        if (v instanceof JC) return v;
        if (typeof v === "number") return new JC(v & 0xffff);
        if (v instanceof JD && !strict) return new JC(Math.trunc(v.v) & 0xffff);
        throw new JErr(`Tipos incompatibles: ${this.tname(v)} no se puede convertir a char`, ln);
      case "boolean":
        if (typeof v === "boolean") return v;
        throw new JErr(`Tipos incompatibles: ${this.tname(v)} no se puede convertir a boolean`, ln);
      case "String":
        if (typeof v === "string" || v === null) return v;
        throw new JErr(`Tipos incompatibles: ${this.tname(v)} no se puede convertir a String`, ln);
      case "Integer":
      case "Long":
        if (typeof v === "number" || v === null) return v;
        throw new JErr(`Tipos incompatibles: ${this.tname(v)} no se puede convertir a ${t}`, ln);
      case "Double":
        if (v === null || v instanceof JD) return v;
        if (typeof v === "number") return new JD(v);
        throw new JErr(`Tipos incompatibles: ${this.tname(v)} no se puede convertir a Double`, ln);
      case "Character":
        if (v === null || v instanceof JC) return v;
        throw new JErr(`Tipos incompatibles: ${this.tname(v)} no se puede convertir a Character`, ln);
      case "Boolean":
        if (v === null || typeof v === "boolean") return v;
        throw new JErr(`Tipos incompatibles: ${this.tname(v)} no se puede convertir a Boolean`, ln);
      default:
        return v;
    }
  }
  initVal(init: any, type: string, env: Env): any {
    if (init.t === "arrlit") return this.arrLit(init, type, env);
    return this.ev(init, env);
  }
  arrLit(n: any, type: string, env: Env): JArr {
    const et = type.endsWith("[]") ? type.slice(0, -2) : "Object";
    return new JArr(
      et,
      n.items.map((it: any) => this.coerce(et, it.t === "arrlit" ? this.arrLit(it, et, env) : this.ev(it, env), n.ln)),
    );
  }
  mkArr(base: string, dims: number[], total: number): JArr {
    const et = base + "[]".repeat(total - 1);
    const n = dims[0];
    if (n < 0) this.thr("NegativeArraySizeException", String(n));
    const a = new Array(n);
    for (let i = 0; i < n; i++) a[i] = dims.length > 1 ? this.mkArr(base, dims.slice(1), total - 1) : total - 1 > 0 ? null : this.defOf(base);
    return new JArr(et, a);
  }
  hk(v: any): string {
    if (typeof v === "string") return "s:" + v;
    if (typeof v === "number") return "n:" + v;
    if (v instanceof JD) return "d:" + v.v;
    if (v instanceof JC) return "c:" + v.c;
    if (typeof v === "boolean") return "b:" + v;
    if (v === null) return "null";
    if (typeof v === "object") {
      if (!this.ids.has(v)) this.ids.set(v, this.nid++);
      return "o:" + this.ids.get(v);
    }
    return String(v);
  }
  jeq(a: any, b: any): boolean {
    const x = numOf(a);
    const y = numOf(b);
    if (x !== undefined && y !== undefined) return x === y;
    return a === b;
  }
  equalsJ(a: any, b: any): boolean {
    if (a instanceof JObj) {
      const f = this.findM(a.cls, "equals", [b]);
      if (f) return this.invoke(f.m, f.c, a, [b]) === true;
      return a === b;
    }
    if (a instanceof JD || b instanceof JD || a instanceof JC || b instanceof JC) {
      return a instanceof JD === b instanceof JD && a instanceof JC === b instanceof JC && numOf(a) === numOf(b);
    }
    return a === b;
  }
  cmpJ(a: any, b: any): number {
    if (a instanceof JObj) {
      const f = this.findM(a.cls, "compareTo", [b]);
      if (f) return this.invoke(f.m, f.c, a, [b]);
      return 0;
    }
    if (typeof a === "string" && typeof b === "string") return cmpStr(a, b);
    return (numOf(a) ?? 0) - (numOf(b) ?? 0);
  }
  entries(m: JMap): [any, any][] {
    const es = Array.from(m.m.values());
    return m.sorted ? es.sort((x, y) => this.cmpJ(x[0], y[0])) : es;
  }
  toStr(v: any): string {
    if (typeof v === "string") return v;
    if (typeof v === "number") return String(v);
    if (v === null || v === undefined) return "null";
    if (typeof v === "boolean") return String(v);
    if (v instanceof JD) return dStr(v.v);
    if (v instanceof JC) return String.fromCharCode(v.c);
    if (v instanceof JSB) return v.s;
    if (v instanceof JList) return "[" + v.a.map((x) => this.toStr(x)).join(", ") + "]";
    if (v instanceof JMap) {
      const es = this.entries(v);
      return v.set ? "[" + es.map((e) => this.toStr(e[0])).join(", ") + "]" : "{" + es.map((e) => this.toStr(e[0]) + "=" + this.toStr(e[1])).join(", ") + "}";
    }
    if (v instanceof JEntry) return this.toStr(v.k) + "=" + this.toStr(v.v);
    if (v instanceof JArr) return "[" + (v.t === "int" ? "I" : v.t === "double" ? "D" : v.t === "char" ? "C" : "L" + v.t + ";") + "@1b6d3586";
    if (v instanceof JObj) {
      const f = this.findM(v.cls, "toString", []);
      if (f) return this.toStr(this.invoke(f.m, f.c, v, []));
      if (this.isA(v.cls, "Throwable")) {
        const msg = v.f.get("message")?.v;
        return v.cls.name + (msg !== null && msg !== undefined ? ": " + msg : "");
      }
      return v.cls.name + "@15db9742";
    }
    return String(v);
  }
  isA(c: JClass | null, name: string): boolean {
    for (let k = c; k; k = k.sup) {
      if (k.name === name) return true;
      if (k.ifs.some((i) => this.isA(i, name))) return true;
    }
    return false;
  }
  toJS(v: any): any {
    if (v instanceof JD) return v.v;
    if (v instanceof JC) return String.fromCharCode(v.c);
    if (v instanceof JArr || v instanceof JList) return v.a.map((x) => this.toJS(x));
    if (v instanceof JMap) {
      if (v.set) return this.entries(v).map((e) => this.toJS(e[0]));
      const o: Record<string, any> = {};
      for (const [k, val] of this.entries(v)) o[this.toStr(k)] = this.toJS(val);
      return o;
    }
    if (v instanceof JSB) return v.s;
    if (v instanceof JObj) return this.toStr(v);
    return v;
  }
  thr(name: string, msg?: string): never {
    throw new JThrow(this.mkEx(name, msg));
  }
  mkEx(name: string, msg?: string): JObj {
    const c = this.classes.get(name)!;
    const o = new JObj(c);
    this.initFields(c, o);
    if (msg !== undefined) o.f.get("message")!.v = msg;
    return o;
  }

  /* ── clases y objetos ── */
  findM(cls: JClass | null, name: string, args: any[]): { m: any; c: JClass } | null {
    for (let c = cls; c; c = c.sup) {
      const cands = (c.methods.get(name) || []).filter((m) => m.body && m.params.length === args.length);
      if (cands.length) return { m: this.pick(cands, args), c };
      for (const i of c.ifs) {
        const r = this.findM(i, name, args);
        if (r) return r;
      }
    }
    return null;
  }
  pick(cands: any[], args: any[]): any {
    if (cands.length === 1) return cands[0];
    let best = cands[0];
    let bs = -1e9;
    for (const m of cands) {
      let s = 0;
      m.params.forEach((p: any, i: number) => {
        const a = args[i];
        const t = p.type;
        if (t === "int" || t === "long" || t === "short" || t === "byte") s += typeof a === "number" ? 3 : a instanceof JC ? 1 : -100;
        else if (t === "double" || t === "float") s += a instanceof JD ? 3 : typeof a === "number" || a instanceof JC ? 1 : -100;
        else if (t === "char") s += a instanceof JC ? 3 : -100;
        else if (t === "boolean") s += typeof a === "boolean" ? 3 : -100;
        else if (t === "String") s += typeof a === "string" || a === null ? 3 : -100;
        else if (a instanceof JObj) s += this.isA(a.cls, t) ? 3 : t === "Object" ? 1 : -50;
        else s += 0;
      });
      if (s > bs) {
        bs = s;
        best = m;
      }
    }
    return best;
  }
  invoke(m: any, c: JClass, self: JObj | null, args: any[]): any {
    this.tick(m.ln);
    if (++this.depth > 220) {
      this.depth--;
      this.thr("StackOverflowError");
    }
    try {
      const env = new Env(null, self, c);
      m.params.forEach((p: any, i: number) => env.vars.set(p.name, { v: this.coerce(p.type, args[i], m.ln), t: p.type }));
      const r = this.execList(m.body, env);
      if (m.ret === "void") return undefined;
      const v = r instanceof RetSig ? r.v : undefined;
      if (v === undefined) throw new JErr(`El método ${m.name} debe devolver un valor ${m.ret} (falta un return)`, m.ln);
      return this.coerce(m.ret, v, m.ln);
    } finally {
      this.depth--;
    }
  }
  initFields(c: JClass, o: JObj) {
    if (c.sup) this.initFields(c.sup, o);
    const env = new Env(null, o, c);
    for (const f of c.d.fields) {
      if (!f.static) o.f.set(f.name, { v: f.init ? this.coerce(f.type, this.initVal(f.init, f.type, env), 0) : this.defOf(f.type), t: f.type });
    }
    for (const ib of c.d.inits) if (!ib.static) this.execList(ib.body, new Env(env, o, c));
  }
  construct(c: JClass, o: JObj, args: any[], ln: number) {
    const cands = c.d.ctors.filter((k) => k.params.length === args.length);
    if (!cands.length && (c.d.ctors.length || args.length)) {
      throw new JErr(`El constructor de ${c.name} no acepta ${args.length} argumento(s)${c.d.ctors.length ? ": " + c.d.ctors.map((k) => `${c.name}(${k.params.map((p: any) => p.type).join(", ")})`).join(" o ") : ""}`, ln);
    }
    const ctor = cands.length ? this.pick(cands, args) : null;
    const body: any[] = ctor ? ctor.body : [];
    const env = new Env(null, o, c);
    if (ctor) ctor.params.forEach((p: any, i: number) => env.vars.set(p.name, { v: this.coerce(p.type, args[i], ln), t: p.type }));
    let rest = body;
    const first = body[0];
    if (first && first.t === "ctorcall") {
      rest = body.slice(1);
      const a2 = first.args.map((x: any) => this.ev(x, env));
      if (first.kind === "this") {
        this.construct(c, o, a2, first.ln);
        this.runBody(rest, env);
        return;
      }
      if (c.sup) this.construct(c.sup, o, a2, first.ln);
    } else if (c.sup) this.construct(c.sup, o, [], ln);
    this.ownInit(c, o);
    this.runBody(rest, env);
  }
  ownInit(c: JClass, o: JObj) {
    const env = new Env(null, o, c);
    for (const f of c.d.fields) {
      if (!f.static) o.f.set(f.name, { v: f.init ? this.coerce(f.type, this.initVal(f.init, f.type, env), 0) : this.defOf(f.type), t: f.type });
    }
    for (const ib of c.d.inits) if (!ib.static) this.execList(ib.body, new Env(env, o, c));
  }
  runBody(list: any[], env: Env) {
    this.tick();
    this.execList(list, env);
  }
  newObj(name: string, args: any[], ln: number): any {
    const c = this.classes.get(name);
    if (c) {
      const o = new JObj(c);
      this.construct(c, o, args, ln);
      return o;
    }
    switch (name) {
      case "ArrayList":
      case "LinkedList":
      case "Stack":
      case "ArrayDeque":
      case "Vector":
      case "PriorityQueue": {
        const l = new JList(name);
        if (args[0] instanceof JList || args[0] instanceof JArr) l.a = args[0].a.slice();
        return l;
      }
      case "HashMap":
      case "LinkedHashMap":
      case "TreeMap":
        return new JMap(false, name === "TreeMap");
      case "HashSet":
      case "LinkedHashSet":
      case "TreeSet": {
        const s = new JMap(true, name === "TreeSet");
        if (args[0] instanceof JList) for (const x of args[0].a) s.m.set(this.hk(x), [x, true]);
        return s;
      }
      case "StringBuilder":
      case "StringBuffer": {
        const sb = new JSB();
        if (typeof args[0] === "string") sb.s = args[0];
        return sb;
      }
      case "String":
        return args.length ? (args[0] instanceof JArr ? args[0].a.map((x: any) => this.toStr(x)).join("") : this.toStr(args[0])) : "";
    }
    throw new JErr(`No encuentro la clase «${name}» (¿está bien escrita? Java distingue mayúsculas)`, ln);
  }

  /* ── ejecución de sentencias ── */
  execList(list: any[], env: Env): any {
    for (const s of list) {
      const r = this.exec(s, env);
      if (r) return r;
    }
    return undefined;
  }
  declare(env: Env, name: string, cell: Cell, ln: number) {
    for (let e: Env | null = env; e; e = e.parent) {
      if (e.vars.has(name) && e.parent !== null) throw new JErr(`La variable «${name}» ya está definida en este método`, ln);
    }
    env.vars.set(name, cell);
  }
  exec(n: any, env: Env): any {
    switch (n.t) {
      case "empty":
        return undefined;
      case "block":
        return this.execList(n.body, new Env(env, env.self, env.cls));
      case "local":
        for (const v of n.vars) {
          let val: any;
          let t = v.type;
          if (v.init) {
            val = this.initVal(v.init, v.type, env);
            if (t === "var") t = this.tname(val);
            else val = this.coerce(t, val, n.ln);
          } else val = this.defOf(t);
          this.declare(env, v.name, { v: val, t }, n.ln);
        }
        return undefined;
      case "expr":
        this.ev(n.e, env);
        return undefined;
      case "if": {
        const c = this.ev(n.c, env);
        if (typeof c !== "boolean") throw new JErr("La condición del if debe ser boolean (usa comparaciones como x > 3 o ==)", n.ln);
        if (c) return this.exec(n.a, new Env(env, env.self, env.cls));
        if (n.b) return this.exec(n.b, new Env(env, env.self, env.cls));
        return undefined;
      }
      case "while":
        while (this.cond(n.c, env, n.ln)) {
          this.tick(n.ln);
          const r = this.exec(n.body, new Env(env, env.self, env.cls));
          if (r === BRK) break;
          if (r && r !== CNT) return r;
        }
        return undefined;
      case "do":
        do {
          this.tick(n.ln);
          const r = this.exec(n.body, new Env(env, env.self, env.cls));
          if (r === BRK) break;
          if (r && r !== CNT) return r;
        } while (this.cond(n.c, env, n.ln));
        return undefined;
      case "for": {
        const fe = new Env(env, env.self, env.cls);
        for (const s of n.init) this.exec(s, fe);
        while (n.c === null || this.cond(n.c, fe, n.ln)) {
          this.tick(n.ln);
          const r = this.exec(n.body, new Env(fe, env.self, env.cls));
          if (r === BRK) break;
          if (r && r !== CNT) return r;
          for (const u of n.upd) this.ev(u, fe);
        }
        return undefined;
      }
      case "foreach": {
        const it = this.ev(n.iter, env);
        let items: any[];
        if (it instanceof JArr || it instanceof JList) items = it.a.slice();
        else if (it instanceof JMap && it.set) items = this.entries(it).map((e) => e[0]);
        else if (it === null) this.thr("NullPointerException", "No se puede recorrer un valor null");
        else throw new JErr("El for-each necesita un arreglo o una colección", n.ln);
        for (const x of items!) {
          this.tick(n.ln);
          const fe = new Env(env, env.self, env.cls);
          fe.vars.set(n.name, { v: n.type === "var" ? x : this.coerce(n.type, x, n.ln), t: n.type === "var" ? this.tname(x) : n.type });
          const r = this.exec(n.body, fe);
          if (r === BRK) break;
          if (r && r !== CNT) return r;
        }
        return undefined;
      }
      case "switch": {
        const v = this.ev(n.e, env);
        const idx = this.pickCase(n, v, env);
        if (idx < 0) return undefined;
        const se = new Env(env, env.self, env.cls);
        if (n.cases[idx].arrow) {
          const b = n.cases[idx].body;
          const r = b.t === "arrowexpr" ? (this.ev(b.e, se), undefined) : this.exec(b, se);
          return r === BRK ? undefined : r;
        }
        for (let i = idx; i < n.cases.length; i++) {
          const r = this.execList(n.cases[i].body, se);
          if (r === BRK) return undefined;
          if (r) return r;
        }
        return undefined;
      }
      case "return":
        return new RetSig(n.e ? this.ev(n.e, env) : undefined);
      case "yield":
        return new YieldSig(this.ev(n.e, env));
      case "break":
        return BRK;
      case "continue":
        return CNT;
      case "throw": {
        const e = this.ev(n.e, env);
        if (!(e instanceof JObj) || !this.isA(e.cls, "Throwable")) {
          if (e === null) this.thr("NullPointerException");
          throw new JErr("Solo puedes lanzar (throw) objetos que sean excepciones", n.ln);
        }
        throw new JThrow(e);
      }
      case "try": {
        let res: any;
        try {
          try {
            res = this.execList(n.body, new Env(env, env.self, env.cls));
          } catch (e0) {
            let e = e0;
            if (e instanceof RangeError) e = new JThrow(this.mkEx("StackOverflowError"));
            if (!(e instanceof JThrow)) throw e;
            const h = n.catches.find((c: any) => c.types.some((t: string) => this.isA(e.ex.cls, t)));
            if (!h) throw e;
            const ce = new Env(env, env.self, env.cls);
            ce.vars.set(h.name, { v: e.ex, t: "Throwable" });
            res = this.execList(h.body, ce);
          }
        } finally {
          if (n.fin) {
            const fr = this.execList(n.fin, new Env(env, env.self, env.cls));
            if (fr) return fr;
          }
        }
        return res;
      }
      case "ctorcall":
        throw new JErr("super(...) / this(...) solo puede ser la primera instrucción de un constructor", n.ln);
    }
    throw new JErr("Instrucción no soportada: " + n.t, n.ln);
  }
  cond(c: any, env: Env, ln: number): boolean {
    const v = this.ev(c, env);
    if (typeof v !== "boolean") throw new JErr("La condición debe ser boolean (usa comparaciones como i < 10)", ln);
    return v;
  }
  pickCase(n: any, v: any, env: Env): number {
    let def = -1;
    for (let i = 0; i < n.cases.length; i++) {
      const c = n.cases[i];
      if (!c.labels) {
        def = i;
        continue;
      }
      for (const l of c.labels) if (this.jeq(v, this.ev(l, env)) || (typeof v === "string" && v === this.ev(l, env))) return i;
    }
    return def;
  }

  /* ── expresiones ── */
  cell(n: any, env: Env): Cell | undefined {
    for (let e: Env | null = env; e; e = e.parent) {
      const c = e.vars.get(n);
      if (c) return c;
    }
    if (env.self) {
      const c = env.self.f.get(n);
      if (c) return c;
    }
    for (let c: JClass | null = env.cls; c; c = c.sup) {
      const cell = c.statics.get(n);
      if (cell) return cell;
    }
    return undefined;
  }
  nameVal(n: any, env: Env): any {
    const c = this.cell(n.name, env);
    if (c) return c.v;
    const cls = this.classes.get(n.name);
    if (cls) return cls;
    if (BUILTIN.has(n.name)) return new BiRef(n.name);
    throw new JErr(`No encuentro el símbolo «${n.name}»: ¿declaraste la variable o está bien escrita? (Java distingue mayúsculas)`, n.ln);
  }
  lref(n: any, env: Env): { get(): any; set(v: any, strict: boolean): void; t: string } {
    if (n.t === "name") {
      const c = this.cell(n.name, env);
      if (!c) throw new JErr(`No encuentro la variable «${n.name}»: debes declararla antes (ej: int ${n.name} = 0;)`, n.ln);
      return { get: () => c.v, set: (v, s) => (c.v = this.coerce(c.t, v, n.ln, s)), t: c.t };
    }
    if (n.t === "field") {
      const tv = this.ev(n.target, env);
      let c: Cell | undefined;
      if (tv instanceof JObj) c = tv.f.get(n.name);
      else if (tv instanceof JClass) for (let k: JClass | null = tv; k && !c; k = k.sup) c = k.statics.get(n.name);
      else if (tv === null) this.thr("NullPointerException", `No se puede asignar el campo «${n.name}» de un objeto null`);
      if (!c) throw new JErr(`No existe el campo «${n.name}»`, n.ln);
      const cc = c;
      return { get: () => cc.v, set: (v, s) => (cc.v = this.coerce(cc.t, v, n.ln, s)), t: cc.t };
    }
    const arr = this.ev(n.target, env);
    const i = this.ev(n.idx, env);
    if (arr === null) this.thr("NullPointerException", "El arreglo es null (¿lo creaste con new?)");
    if (!(arr instanceof JArr)) throw new JErr("Solo se puede usar [ ] con arreglos", n.ln);
    const k = numOf(i);
    if (k === undefined || i instanceof JD) throw new JErr("El índice de un arreglo debe ser int", n.ln);
    if (k < 0 || k >= arr.a.length) this.thr("ArrayIndexOutOfBoundsException", `Index ${k} out of bounds for length ${arr.a.length}`);
    return { get: () => arr.a[k], set: (v, s) => (arr.a[k] = this.coerce(arr.t, v, n.ln, s)), t: arr.t };
  }
  arith(op: string, a: any, b: any, ln: number): any {
    if (op === "+" && (typeof a === "string" || typeof b === "string")) return this.toStr(a) + this.toStr(b);
    const x = numOf(a);
    const y = numOf(b);
    if (x === undefined || y === undefined) {
      if (a === null || b === null) this.thr("NullPointerException", "Operación con un valor null");
      throw new JErr(`El operador «${op}» no se puede aplicar a ${this.tname(a)} y ${this.tname(b)}`, ln);
    }
    const d = a instanceof JD || b instanceof JD;
    let r: number;
    switch (op) {
      case "+":
        r = x + y;
        break;
      case "-":
        r = x - y;
        break;
      case "*":
        r = x * y;
        break;
      case "/":
        if (!d) {
          if (y === 0) this.thr("ArithmeticException", "/ by zero");
          r = Math.trunc(x / y);
        } else r = x / y;
        break;
      case "%":
        if (!d && y === 0) this.thr("ArithmeticException", "/ by zero");
        r = x % y;
        break;
      default:
        throw new JErr("Operador desconocido " + op, ln);
    }
    return d ? new JD(r) : r;
  }
  ev(n: any, env: Env): any {
    switch (n.t) {
      case "lit":
        return n.v;
      case "name":
        return this.nameVal(n, env);
      case "this":
        return env.self;
      case "assign": {
        const r = this.lref(n.target, env);
        if (n.op === "=") {
          const v = n.value.t === "arrlit" ? this.arrLit(n.value, r.t, env) : this.ev(n.value, env);
          r.set(v, true);
          return r.get();
        }
        const cur = r.get();
        const v = this.ev(n.value, env);
        r.set(this.arith(n.op.slice(0, -1), cur, v, n.ln), false);
        return r.get();
      }
      case "inc": {
        const r = this.lref(n.target, env);
        const old = r.get();
        const nv = this.arith(n.op === "++" ? "+" : "-", old, 1, n.ln);
        r.set(nv, false);
        return n.pre ? r.get() : old;
      }
      case "cond": {
        const c = this.ev(n.c, env);
        if (typeof c !== "boolean") throw new JErr("La condición del operador ?: debe ser boolean", n.ln);
        return c ? this.ev(n.a, env) : this.ev(n.b, env);
      }
      case "bin": {
        const op = n.op;
        if (op === "&&" || op === "||") {
          const a = this.ev(n.a, env);
          if (typeof a !== "boolean") throw new JErr(`El operador ${op} necesita valores boolean`, n.ln);
          if (op === "&&" ? !a : a) return a;
          const b = this.ev(n.b, env);
          if (typeof b !== "boolean") throw new JErr(`El operador ${op} necesita valores boolean`, n.ln);
          return b;
        }
        const a = this.ev(n.a, env);
        const b = this.ev(n.b, env);
        switch (op) {
          case "==":
            return this.jeq(a, b);
          case "!=":
            return !this.jeq(a, b);
          case "<":
          case ">":
          case "<=":
          case ">=": {
            const x = numOf(a);
            const y = numOf(b);
            if (x === undefined || y === undefined) throw new JErr(`No se puede comparar ${this.tname(a)} con ${this.tname(b)} usando ${op}`, n.ln);
            return op === "<" ? x < y : op === ">" ? x > y : op === "<=" ? x <= y : x >= y;
          }
          case "&":
          case "|":
          case "^":
            if (typeof a === "boolean" && typeof b === "boolean") return op === "&" ? a && b : op === "|" ? a || b : a !== b;
            return op === "&" ? (numOf(a) as number) & (numOf(b) as number) : op === "|" ? (numOf(a) as number) | (numOf(b) as number) : (numOf(a) as number) ^ (numOf(b) as number);
          default:
            return this.arith(op, a, b, n.ln);
        }
      }
      case "un": {
        const v = this.ev(n.e, env);
        if (n.op === "!") {
          if (typeof v !== "boolean") throw new JErr("El operador ! necesita un boolean", n.ln);
          return !v;
        }
        if (n.op === "~") return ~(numOf(v) as number);
        const x = numOf(v);
        if (x === undefined) throw new JErr(`El operador ${n.op} no se aplica a ${this.tname(v)}`, n.ln);
        if (n.op === "+") return v instanceof JC ? v.c : v;
        return v instanceof JD ? new JD(-x) : -x;
      }
      case "cast": {
        const v = this.ev(n.e, env);
        if (numOf(v) === undefined) throw new JErr(`No se puede convertir ${this.tname(v)} a ${n.type}`, n.ln);
        if (n.type === "int" || n.type === "long" || n.type === "short" || n.type === "byte") {
          const x = v instanceof JD ? Math.trunc(v.v) : (numOf(v) as number);
          return n.type === "long" ? x : this.coerce(n.type, x, n.ln, false);
        }
        return this.coerce(n.type, v, n.ln, false);
      }
      case "instanceof": {
        const v = this.ev(n.e, env);
        let ok = false;
        if (v instanceof JObj) ok = this.isA(v.cls, n.type) || n.type === "Object";
        else if (typeof v === "string") ok = ["String", "Object", "CharSequence", "Comparable"].includes(n.type);
        else if (typeof v === "number") ok = ["Integer", "Number", "Object", "Comparable"].includes(n.type);
        else if (v instanceof JD) ok = ["Double", "Number", "Object"].includes(n.type);
        else if (v instanceof JList) ok = ["List", "ArrayList", "Collection", "Object"].includes(n.type);
        else if (v !== null) ok = n.type === "Object";
        if (ok && n.bind) env.vars.set(n.bind, { v, t: n.type });
        return ok;
      }
      case "index": {
        const arr = this.ev(n.target, env);
        const i = numOf(this.ev(n.idx, env));
        if (arr === null) this.thr("NullPointerException", "El arreglo es null (¿lo creaste con new?)");
        if (!(arr instanceof JArr)) throw new JErr("Solo se puede usar [ ] con arreglos", n.ln);
        if (i === undefined) throw new JErr("El índice debe ser un entero", n.ln);
        if (i < 0 || i >= arr.a.length) this.thr("ArrayIndexOutOfBoundsException", `Index ${i} out of bounds for length ${arr.a.length}`);
        return arr.a[i];
      }
      case "field": {
        const t = this.ev(n.target, env);
        if (t instanceof JArr && n.name === "length") return t.a.length;
        if (t instanceof JObj) {
          const c = t.f.get(n.name);
          if (c) return c.v;
          throw new JErr(`La clase ${t.cls.name} no tiene el campo «${n.name}»`, n.ln);
        }
        if (t instanceof JClass) {
          for (let k: JClass | null = t; k; k = k.sup) {
            const c = k.statics.get(n.name);
            if (c) return c.v;
          }
          throw new JErr(`${t.name} no tiene el campo estático «${n.name}»`, n.ln);
        }
        if (t instanceof BiRef) return this.biField(t.name, n.name, n.ln);
        if (t === null) this.thr("NullPointerException", `No se puede leer «${n.name}» de un valor null`);
        throw new JErr(`No existe «${n.name}» en ${this.tname(t)}`, n.ln);
      }
      case "newarr": {
        if (n.init) return this.arrLit(n.init, n.base + "[]".repeat(n.dims.length + n.extra), env);
        const dims = n.dims.map((d: any) => {
          const x = this.ev(d, env);
          if (typeof x !== "number") throw new JErr("El tamaño de un arreglo debe ser un int", n.ln);
          return x;
        });
        return this.mkArr(n.base, dims, dims.length + n.extra);
      }
      case "new":
        return this.newObj(
          n.cls,
          n.args.map((a: any) => this.ev(a, env)),
          n.ln,
        );
      case "switchx": {
        const v = this.ev(n.e, env);
        const idx = this.pickCase(n, v, env);
        if (idx < 0) this.thr("IllegalStateException", "switch sin caso para el valor");
        const c = n.cases[idx];
        const se = new Env(env, env.self, env.cls);
        if (c.arrow) {
          if (c.body.t === "arrowexpr") return this.ev(c.body.e, se);
          const r = this.exec(c.body, se);
          if (r instanceof YieldSig) return r.v;
          throw new JErr("Un bloque dentro de un switch que devuelve valor debe usar yield", n.ln);
        }
        for (let i = idx; i < n.cases.length; i++) {
          const r = this.execList(n.cases[i].body, se);
          if (r instanceof YieldSig) return r.v;
        }
        throw new JErr("Falta yield dentro del switch", n.ln);
      }
      case "call":
        return this.callExpr(n, env);
      case "super":
        return env.self;
    }
    throw new JErr("Expresión no soportada: " + n.t, n.ln);
  }

  /* ── llamadas ── */
  callExpr(n: any, env: Env): any {
    const args = n.args.map((a: any) => this.ev(a, env));
    if (n.target === null) {
      if (env.self) {
        const f = this.findM(env.self.cls, n.name, args);
        if (f) return this.invoke(f.m, f.c, f.m.static ? null : env.self, args);
      }
      for (let c: JClass | null = env.cls; c; c = c.sup) {
        const f = this.findM(c, n.name, args);
        if (f) return this.invoke(f.m, f.c, null, args);
      }
      for (const c of this.order) {
        if (c.d.methods.some((m) => m.name === n.name && m.static)) {
          const f = this.findM(c, n.name, args);
          if (f) return this.invoke(f.m, f.c, null, args);
        }
      }
      const any = this.order.some((c) => c.methods.has(n.name));
      throw new JErr(any ? `El método «${n.name}» no acepta esos argumentos (${args.length} dado(s))` : `No encuentro el método «${n.name}»: ¿está declarado y bien escrito?`, n.ln);
    }
    if (n.target.t === "super") {
      const f = this.findM(env.cls?.sup ?? null, n.name, args);
      if (f) return this.invoke(f.m, f.c, env.self, args);
      if (n.name === "toString") return (env.self?.cls.name ?? "") + "@15db9742";
      if (n.name === "equals") return env.self === args[0];
      if (n.name === "hashCode") return 1;
      throw new JErr(`La clase padre no tiene el método «${n.name}»`, n.ln);
    }
    const t = this.ev(n.target, env);
    return this.callOn(t, n.name, args, n.ln);
  }
  callOn(t: any, name: string, args: any[], ln: number): any {
    if (t === null || t === undefined) this.thr("NullPointerException", `No se puede llamar «${name}()» sobre un valor null`);
    if (typeof t === "string") return this.strM(t, name, args, ln);
    if (t instanceof JObj) return this.objM(t, name, args, ln);
    if (t instanceof JList) return this.listM(t, name, args, ln);
    if (t instanceof JMap) return this.mapM(t, name, args, ln);
    if (t instanceof JSB) return this.sbM(t, name, args, ln);
    if (t instanceof JSys) return this.sysM(name, args, ln);
    if (t instanceof JClass) {
      const f = this.findM(t, name, args);
      if (!f) throw new JErr(`${t.name} no tiene un método estático «${name}» con esos argumentos`, ln);
      return this.invoke(f.m, f.c, null, args);
    }
    if (t instanceof BiRef) return this.biStatic(t.name, name, args, ln);
    if (t instanceof JEntry) {
      if (name === "getKey") return t.k;
      if (name === "getValue") return t.v;
    }
    if (t instanceof JClassInfo) return name === "getSimpleName" || name === "getName" ? t.name : undefined;
    if (t instanceof JArr) {
      if (name === "clone") return new JArr(t.t, t.a.slice());
      if (name === "equals") return t === args[0];
    }
    // boxed
    switch (name) {
      case "equals":
        return this.equalsJ(t, args[0]);
      case "toString":
        return this.toStr(t);
      case "hashCode":
        return typeof t === "number" ? t : 0;
      case "compareTo":
      case "compare":
        return this.cmpJ(t, args[0]);
      case "intValue":
        return Math.trunc(numOf(t) as number);
      case "doubleValue":
        return new JD(numOf(t) as number);
      case "charValue":
      case "booleanValue":
        return t;
    }
    throw new JErr(`${this.tname(t)} no tiene el método «${name}»`, ln);
  }
  objM(o: JObj, name: string, args: any[], ln: number): any {
    const f = this.findM(o.cls, name, args);
    if (f) return this.invoke(f.m, f.c, f.m.static ? null : o, args);
    switch (name) {
      case "equals":
        return o === args[0];
      case "hashCode":
        return this.hk(o).length;
      case "toString":
        return this.toStr(o);
      case "getClass":
        return new JClassInfo(o.cls.name);
    }
    throw new JErr(`La clase ${o.cls.name} no tiene un método «${name}» con ${args.length} argumento(s)`, ln);
  }
  strM(s: string, name: string, args: any[], ln: number): any {
    const sa = (i: number) => this.toStr(args[i]);
    const na = (i: number) => numOf(args[i]) as number;
    switch (name) {
      case "length":
        return s.length;
      case "charAt": {
        const i = na(0);
        if (i < 0 || i >= s.length) this.thr("StringIndexOutOfBoundsException", `Index ${i} out of bounds for length ${s.length}`);
        return new JC(s.charCodeAt(i));
      }
      case "substring": {
        const a = na(0);
        const b = args.length > 1 ? na(1) : s.length;
        if (a < 0 || b > s.length || a > b) this.thr("StringIndexOutOfBoundsException", `begin ${a}, end ${b}, length ${s.length}`);
        return s.substring(a, b);
      }
      case "indexOf":
        return s.indexOf(sa(0), args.length > 1 ? na(1) : 0);
      case "lastIndexOf":
        return s.lastIndexOf(sa(0));
      case "equals":
        return typeof args[0] === "string" && s === args[0];
      case "equalsIgnoreCase":
        return typeof args[0] === "string" && s.toLowerCase() === args[0].toLowerCase();
      case "compareTo":
        return cmpStr(s, sa(0));
      case "compareToIgnoreCase":
        return cmpStr(s.toLowerCase(), sa(0).toLowerCase());
      case "contains":
        return s.includes(sa(0));
      case "startsWith":
        return s.startsWith(sa(0));
      case "endsWith":
        return s.endsWith(sa(0));
      case "isEmpty":
        return s.length === 0;
      case "isBlank":
        return s.trim().length === 0;
      case "trim":
      case "strip":
        return s.trim();
      case "toUpperCase":
        return s.toUpperCase();
      case "toLowerCase":
        return s.toLowerCase();
      case "replace":
        return s.split(sa(0)).join(sa(1));
      case "replaceAll":
        return s.replace(new RegExp(sa(0), "g"), sa(1));
      case "concat":
        return s + sa(0);
      case "repeat":
        return s.repeat(na(0));
      case "hashCode": {
        let h = 0;
        for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
        return h;
      }
      case "toString":
      case "intern":
        return s;
      case "matches":
        return new RegExp("^(?:" + sa(0) + ")$").test(s);
      case "toCharArray":
        return new JArr(
          "char",
          Array.from(s).map((ch) => new JC(ch.charCodeAt(0))),
        );
      case "split": {
        const re = sa(0);
        let parts = re === "" ? s.split("") : s.split(new RegExp(re));
        while (parts.length > 1 && parts[parts.length - 1] === "") parts = parts.slice(0, -1);
        return new JArr("String", parts);
      }
      case "formatted":
        return this.fmtJ(s, args);
    }
    throw new JErr(`String no tiene el método «${name}»`, ln);
  }
  listM(l: JList, name: string, args: any[], ln: number): any {
    const a = l.a;
    const idx = (i: any) => {
      const k = numOf(i) as number;
      if (k < 0 || k >= a.length) this.thr("IndexOutOfBoundsException", `Index ${k} out of bounds for length ${a.length}`);
      return k;
    };
    const stack = l.kind === "Stack";
    switch (name) {
      case "add":
      case "addLast":
      case "offer":
      case "offerLast":
        if (args.length === 2) {
          a.splice(numOf(args[0]) as number, 0, args[1]);
          return undefined;
        }
        a.push(args[0]);
        return true;
      case "addFirst":
      case "offerFirst":
        a.unshift(args[0]);
        return undefined;
      case "push":
        if (stack) a.push(args[0]);
        else a.unshift(args[0]);
        return args[0];
      case "pop":
        if (!a.length) this.thr(stack ? "NoSuchElementException" : "NoSuchElementException");
        return stack ? a.pop() : a.shift();
      case "peek":
        return a.length ? (stack ? a[a.length - 1] : a[0]) : null;
      case "peekFirst":
        return a.length ? a[0] : null;
      case "peekLast":
        return a.length ? a[a.length - 1] : null;
      case "poll":
      case "pollFirst":
        return a.length ? a.shift() : null;
      case "pollLast":
        return a.length ? a.pop() : null;
      case "get":
        return a[idx(args[0])];
      case "getFirst":
      case "element":
        if (!a.length) this.thr("NoSuchElementException");
        return a[0];
      case "getLast":
        if (!a.length) this.thr("NoSuchElementException");
        return a[a.length - 1];
      case "removeFirst":
        if (!a.length) this.thr("NoSuchElementException");
        return a.shift();
      case "removeLast":
        if (!a.length) this.thr("NoSuchElementException");
        return a.pop();
      case "set": {
        const k = idx(args[0]);
        const old = a[k];
        a[k] = args[1];
        return old;
      }
      case "size":
        return a.length;
      case "isEmpty":
      case "empty":
        return a.length === 0;
      case "clear":
        a.length = 0;
        return undefined;
      case "contains":
        return a.some((x) => this.equalsJ(args[0], x) || this.jeq(x, args[0]));
      case "indexOf":
        return a.findIndex((x) => this.equalsJ(args[0], x));
      case "remove":
        if (typeof args[0] === "number" && l.kind !== "ArrayDeque") return a.splice(idx(args[0]), 1)[0];
        if (!args.length) return a.length ? a.shift() : this.thr("NoSuchElementException");
        {
          const k = a.findIndex((x) => this.equalsJ(args[0], x));
          if (k >= 0) a.splice(k, 1);
          return k >= 0;
        }
      case "addAll":
        a.push(...(args[0] as JList).a);
        return true;
      case "sort":
        a.sort((x, y) => this.cmpJ(x, y));
        return undefined;
      case "toString":
        return this.toStr(l);
      case "equals":
        return args[0] instanceof JList && args[0].a.length === a.length && a.every((x, i) => this.equalsJ(x, args[0].a[i]));
    }
    throw new JErr(`La lista no tiene el método «${name}»`, ln);
  }
  mapM(m: JMap, name: string, args: any[], ln: number): any {
    const key = () => this.hk(args[0]);
    if (m.set) {
      switch (name) {
        case "add": {
          const had = m.m.has(key());
          if (!had) m.m.set(key(), [args[0], true]);
          return !had;
        }
        case "contains":
          return m.m.has(key());
        case "remove":
          return m.m.delete(key());
        case "size":
          return m.m.size;
        case "isEmpty":
          return m.m.size === 0;
        case "clear":
          m.m.clear();
          return undefined;
        case "toString":
          return this.toStr(m);
      }
      throw new JErr(`El conjunto no tiene el método «${name}»`, ln);
    }
    switch (name) {
      case "put": {
        const old = m.m.get(key());
        m.m.set(key(), [args[0], args[1]]);
        return old ? old[1] : null;
      }
      case "get":
        return m.m.get(key())?.[1] ?? null;
      case "getOrDefault":
        return m.m.has(key()) ? m.m.get(key())![1] : args[1];
      case "containsKey":
        return m.m.has(key());
      case "containsValue":
        return Array.from(m.m.values()).some((e) => this.equalsJ(args[0], e[1]));
      case "putIfAbsent":
        if (!m.m.has(key())) m.m.set(key(), [args[0], args[1]]);
        return m.m.get(key())![1];
      case "remove": {
        const old = m.m.get(key());
        m.m.delete(key());
        return old ? old[1] : null;
      }
      case "size":
        return m.m.size;
      case "isEmpty":
        return m.m.size === 0;
      case "clear":
        m.m.clear();
        return undefined;
      case "keySet": {
        const s = new JMap(true, false);
        for (const e of this.entries(m)) s.m.set(this.hk(e[0]), [e[0], true]);
        s.sorted = m.sorted;
        return s;
      }
      case "values": {
        const l = new JList("ArrayList");
        l.a = this.entries(m).map((e) => e[1]);
        return l;
      }
      case "entrySet": {
        const l = new JList("ArrayList");
        l.a = this.entries(m).map((e) => new JEntry(e[0], e[1]));
        return l;
      }
      case "toString":
        return this.toStr(m);
    }
    throw new JErr(`El mapa no tiene el método «${name}»`, ln);
  }
  sbM(sb: JSB, name: string, args: any[], ln: number): any {
    switch (name) {
      case "append":
        sb.s += this.toStr(args[0]);
        return sb;
      case "toString":
        return sb.s;
      case "length":
        return sb.s.length;
      case "reverse":
        sb.s = Array.from(sb.s).reverse().join("");
        return sb;
      case "charAt":
        return new JC(sb.s.charCodeAt(numOf(args[0]) as number));
      case "insert": {
        const i = numOf(args[0]) as number;
        sb.s = sb.s.slice(0, i) + this.toStr(args[1]) + sb.s.slice(i);
        return sb;
      }
      case "deleteCharAt": {
        const i = numOf(args[0]) as number;
        sb.s = sb.s.slice(0, i) + sb.s.slice(i + 1);
        return sb;
      }
      case "setLength":
        sb.s = sb.s.slice(0, numOf(args[0]) as number);
        return undefined;
      case "isEmpty":
        return sb.s.length === 0;
      case "indexOf":
        return sb.s.indexOf(this.toStr(args[0]));
    }
    throw new JErr(`StringBuilder no tiene el método «${name}»`, ln);
  }
  sysM(name: string, args: any[], ln: number): any {
    switch (name) {
      case "println":
        this.out += (args.length ? (args[0] instanceof JArr && args[0].t === "char" ? args[0].a.map((x: any) => this.toStr(x)).join("") : this.toStr(args[0])) : "") + "\n";
        return undefined;
      case "print":
        this.out += this.toStr(args[0]);
        return undefined;
      case "printf":
      case "format":
        this.out += this.fmtJ(this.toStr(args[0]), args.slice(1));
        return undefined;
    }
    throw new JErr(`System.out no tiene el método «${name}» (usa println, print o printf)`, ln);
  }
  fmtJ(f: string, args: any[]): string {
    let ai = 0;
    return f.replace(/%([-+0, #]*)(\d+)?(?:\.(\d+))?([a-zA-Z%])/g, (_m, flags: string, w: string, p: string, c: string) => {
      if (c === "n") return "\n";
      if (c === "%") return "%";
      const a = args[ai++];
      if (a === undefined) this.thr("IllegalArgumentException", "Format specifier '%" + c + "' sin argumento");
      let s: string;
      const comma = (x: string) => (flags.includes(",") ? x.replace(/\B(?=(\d{3})+(?!\d))/g, ",") : x);
      switch (c) {
        case "d":
          if (typeof a !== "number") this.thr("IllegalArgumentException", `%d necesita un entero, pero recibió ${this.tname(a)}`);
          s = comma(String(Math.trunc(a)));
          if (flags.includes("+") && a >= 0) s = "+" + s;
          break;
        case "f": {
          const x = numOf(a);
          if (x === undefined || typeof a === "number") this.thr("IllegalArgumentException", `%f necesita un double, pero recibió ${this.tname(a)}`);
          const fixed = (x as number).toFixed(p === undefined ? 6 : +p);
          const [ip, fp] = fixed.split(".");
          s = comma(ip) + (fp !== undefined ? "." + fp : "");
          if (flags.includes("+") && (x as number) >= 0) s = "+" + s;
          break;
        }
        case "x":
          s = ((numOf(a) as number) >>> 0).toString(16);
          break;
        case "S":
          s = this.toStr(a).toUpperCase();
          break;
        default:
          s = this.toStr(a);
          if (c === "s" && p !== undefined) s = s.slice(0, +p);
      }
      if (w && s.length < +w) {
        if (flags.includes("-")) s = s.padEnd(+w);
        else if (flags.includes("0") && "dfx".includes(c)) s = (s[0] === "-" || s[0] === "+" ? s[0] : "") + s.replace(/^[-+]/, "").padStart(+w - (/^[-+]/.test(s) ? 1 : 0), "0");
        else s = s.padStart(+w);
      }
      return s;
    });
  }
  biField(cls: string, name: string, ln: number): any {
    switch (cls + "." + name) {
      case "System.out":
        return new JSys();
      case "System.err":
        return new JSys();
      case "Math.PI":
        return new JD(Math.PI);
      case "Math.E":
        return new JD(Math.E);
      case "Integer.MAX_VALUE":
        return 2147483647;
      case "Integer.MIN_VALUE":
        return -2147483648;
      case "Long.MAX_VALUE":
        return 9223372036854775807;
      case "Long.MIN_VALUE":
        return -9223372036854775808;
      case "Double.MAX_VALUE":
        return new JD(Number.MAX_VALUE);
      case "Double.MIN_VALUE":
        return new JD(Number.MIN_VALUE);
    }
    throw new JErr(`No existe ${cls}.${name}`, ln);
  }
  biStatic(cls: string, name: string, args: any[], ln: number): any {
    const n = (i: number) => numOf(args[i]) as number;
    const anyD = args.some((a) => a instanceof JD);
    const wrap = (x: number) => (anyD ? new JD(x) : x);
    const D = (x: number) => new JD(x);
    switch (cls) {
      case "Math":
        switch (name) {
          case "abs":
            return args[0] instanceof JD ? D(Math.abs(n(0))) : Math.abs(n(0));
          case "max":
            return wrap(Math.max(n(0), n(1)));
          case "min":
            return wrap(Math.min(n(0), n(1)));
          case "pow":
            return D(Math.pow(n(0), n(1)));
          case "sqrt":
            return D(Math.sqrt(n(0)));
          case "cbrt":
            return D(Math.cbrt(n(0)));
          case "floor":
            return D(Math.floor(n(0)));
          case "ceil":
            return D(Math.ceil(n(0)));
          case "round":
            return Math.round(n(0));
          case "random":
            return D(Math.random());
          case "floorMod":
            return ((n(0) % n(1)) + n(1)) % n(1);
          case "floorDiv":
            return Math.floor(n(0) / n(1));
          case "hypot":
            return D(Math.hypot(n(0), n(1)));
          case "log":
            return D(Math.log(n(0)));
          case "log10":
            return D(Math.log10(n(0)));
          case "exp":
            return D(Math.exp(n(0)));
          case "sin":
            return D(Math.sin(n(0)));
          case "cos":
            return D(Math.cos(n(0)));
          case "signum":
            return D(Math.sign(n(0)));
        }
        break;
      case "Integer":
      case "Long":
      case "Short":
      case "Byte":
        switch (name) {
          case "parseInt":
          case "parseLong":
          case "valueOf": {
            if (typeof args[0] !== "string") return n(0);
            const s = args[0].trim() === args[0] ? args[0] : "x";
            if (!/^[-+]?\d+$/.test(s)) this.thr("NumberFormatException", `For input string: "${args[0]}"`);
            return Number(s);
          }
          case "toString":
            return this.toStr(args[0]);
          case "compare":
            return Math.sign(n(0) - n(1));
          case "sum":
            return n(0) + n(1);
          case "max":
            return Math.max(n(0), n(1));
          case "min":
            return Math.min(n(0), n(1));
          case "toBinaryString":
            return (n(0) >>> 0).toString(2);
        }
        break;
      case "Double":
      case "Float":
        switch (name) {
          case "parseDouble":
          case "valueOf":
          case "parseFloat": {
            if (typeof args[0] !== "string") return D(n(0));
            const x = Number(args[0]);
            if (args[0].trim() === "" || Number.isNaN(x)) this.thr("NumberFormatException", `For input string: "${args[0]}"`);
            return D(x);
          }
          case "compare":
            return Math.sign(n(0) - n(1));
          case "toString":
            return this.toStr(args[0]);
          case "isNaN":
            return Number.isNaN(n(0));
        }
        break;
      case "Boolean":
        if (name === "parseBoolean" || name === "valueOf") return typeof args[0] === "boolean" ? args[0] : String(args[0]).toLowerCase() === "true";
        if (name === "toString") return this.toStr(args[0]);
        break;
      case "Character": {
        const c = args[0] instanceof JC ? String.fromCharCode(args[0].c) : "";
        switch (name) {
          case "isDigit":
            return /[0-9]/.test(c);
          case "isLetter":
            return /[A-Za-zÀ-ÿ]/.test(c);
          case "isLetterOrDigit":
            return /[A-Za-zÀ-ÿ0-9]/.test(c);
          case "isUpperCase":
            return c !== "" && c === c.toUpperCase() && c !== c.toLowerCase();
          case "isLowerCase":
            return c !== "" && c === c.toLowerCase() && c !== c.toUpperCase();
          case "isWhitespace":
            return /\s/.test(c);
          case "toUpperCase":
            return new JC(c.toUpperCase().charCodeAt(0));
          case "toLowerCase":
            return new JC(c.toLowerCase().charCodeAt(0));
          case "getNumericValue":
            return /[0-9]/.test(c) ? Number(c) : /[a-zA-Z]/.test(c) ? c.toLowerCase().charCodeAt(0) - 87 : -1;
          case "valueOf":
            return args[0];
          case "toString":
            return c;
        }
        break;
      }
      case "String":
        switch (name) {
          case "valueOf":
          case "copyValueOf":
            return args[0] instanceof JArr ? args[0].a.map((x: any) => this.toStr(x)).join("") : this.toStr(args[0]);
          case "format":
            return this.fmtJ(this.toStr(args[0]), args.slice(1));
          case "join": {
            const items = args[1] instanceof JList || args[1] instanceof JArr ? args[1].a : args.slice(1);
            return items.map((x: any) => this.toStr(x)).join(this.toStr(args[0]));
          }
        }
        break;
      case "Arrays":
        switch (name) {
          case "toString":
            return args[0] === null ? "null" : "[" + (args[0] as JArr).a.map((x) => this.toStr(x)).join(", ") + "]";
          case "deepToString": {
            const f = (v: any): string => (v instanceof JArr ? "[" + v.a.map(f).join(", ") + "]" : this.toStr(v));
            return f(args[0]);
          }
          case "sort":
            (args[0] as JArr).a.sort((x, y) => this.cmpJ(x, y));
            return undefined;
          case "fill":
            (args[0] as JArr).a.fill(this.coerce((args[0] as JArr).t, args[1], ln));
            return undefined;
          case "copyOf": {
            const src = args[0] as JArr;
            const len = n(1);
            const a = src.a.slice(0, len);
            while (a.length < len) a.push(this.defOf(src.t));
            return new JArr(src.t, a);
          }
          case "copyOfRange": {
            const src = args[0] as JArr;
            return new JArr(src.t, src.a.slice(n(1), n(2)));
          }
          case "equals":
            return args[0] instanceof JArr && args[1] instanceof JArr && args[0].a.length === args[1].a.length && args[0].a.every((x: any, i: number) => this.equalsJ(x, args[1].a[i]));
          case "asList": {
            const l = new JList("ArrayList");
            l.a = args.length === 1 && args[0] instanceof JArr ? args[0].a.slice() : args.slice();
            return l;
          }
        }
        break;
      case "List":
      case "Set":
        if (name === "of") {
          if (cls === "Set") {
            const s = new JMap(true, false);
            for (const x of args) s.m.set(this.hk(x), [x, true]);
            return s;
          }
          const l = new JList("ArrayList");
          l.a = args.length === 1 && args[0] instanceof JArr ? args[0].a.slice() : args.slice();
          return l;
        }
        break;
      case "Collections":
        switch (name) {
          case "sort":
            (args[0] as JList).a.sort((x, y) => this.cmpJ(x, y));
            return undefined;
          case "reverse":
            (args[0] as JList).a.reverse();
            return undefined;
          case "max":
            return (args[0] as JList).a.reduce((m, x) => (this.cmpJ(x, m) > 0 ? x : m));
          case "min":
            return (args[0] as JList).a.reduce((m, x) => (this.cmpJ(x, m) < 0 ? x : m));
          case "swap": {
            const a = (args[0] as JList).a;
            [a[n(1)], a[n(2)]] = [a[n(2)], a[n(1)]];
            return undefined;
          }
        }
        break;
      case "Objects":
        switch (name) {
          case "equals":
            return args[0] === null ? args[1] === null : this.equalsJ(args[0], args[1]);
          case "isNull":
            return args[0] === null;
          case "nonNull":
            return args[0] !== null;
          case "requireNonNull":
            if (args[0] === null) this.thr("NullPointerException", args[1] !== undefined ? this.toStr(args[1]) : undefined);
            return args[0];
        }
        break;
      case "System":
        switch (name) {
          case "currentTimeMillis":
            return Date.now();
          case "nanoTime":
            return Date.now() * 1000000;
          case "exit":
            return undefined;
          case "lineSeparator":
            return "\n";
          case "arraycopy": {
            const src = args[0] as JArr;
            const dst = args[2] as JArr;
            const sp = n(1);
            const dp = n(3);
            const len = n(4);
            if (sp < 0 || dp < 0 || sp + len > src.a.length || dp + len > dst.a.length) this.thr("ArrayIndexOutOfBoundsException", "arraycopy: fuera de rango");
            const tmp = src.a.slice(sp, sp + len);
            for (let i = 0; i < len; i++) dst.a[dp + i] = tmp[i];
            return undefined;
          }
        }
        break;
      case "Thread":
        return undefined;
    }
    throw new JErr(`No existe el método ${cls}.${name}(...) en este entorno de práctica`, ln);
  }

  /* ── entrada de pruebas ── */
  evalCall(src: string): any {
    const p = new JP(lex(src));
    const env = new Env(null, null, null);
    for (;;) {
      if (p.atEof()) return undefined;
      if (p.isLocal()) {
        this.exec(p.local(true), env);
        continue;
      }
      const e = p.expr();
      if (p.eat(";")) {
        this.ev(e, env);
        continue;
      }
      if (!p.atEof()) throw new JErr("Llamada de prueba inválida");
      return this.ev(e, env);
    }
  }
  runMain() {
    for (const c of this.order) {
      const m = c.d.methods.find((x) => x.name === "main" && x.static);
      if (m) {
        this.invoke(m, c, null, [new JArr("String", [])]);
        return;
      }
    }
    throw new JErr("No encontré «public static void main(String[] args)»");
  }
}

const errMsg = (e: unknown, it?: Interp): string => {
  if (e instanceof JErr) return e.ln ? `Línea ${e.ln}: ${e.message}` : e.message;
  if (e instanceof JThrow) return `Excepción sin capturar → ${it ? it.toStr(e.ex) : "error"}`;
  if (e instanceof RangeError) return "Recursión demasiado profunda (StackOverflowError): ¿falta el caso base?";
  return "Error inesperado: " + (e as Error).message;
};

export function javaRun(code: string, tests: TestCase[]): { syntax?: string; outcomes: TestOutcome[] } {
  let decls: CDecl[];
  try {
    const pre = new JP(lex(PRELUDE_SRC)).unit();
    const usr = new JP(lex(code)).unit();
    if (!usr.length) return { syntax: "No encuentro ninguna clase ni método: escribe tu código Java", outcomes: [] };
    decls = [...usr, ...pre];
  } catch (e) {
    return { syntax: errMsg(e), outcomes: [] };
  }
  const outcomes = tests.map((t) => {
    let it: Interp | undefined;
    try {
      it = new Interp(decls);
      let value: unknown;
      if (t.call) value = it.toJS(it.evalCall(t.call));
      else it.runMain();
      return judge(t, { value, out: it.out });
    } catch (e) {
      return judge(t, { out: it?.out ?? "", err: errMsg(e, it) });
    }
  });
  return { outcomes };
}
