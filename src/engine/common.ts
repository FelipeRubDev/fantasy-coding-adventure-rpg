import type { TestCase, TestOutcome } from "@/lib/types";

export function deepEq(a: unknown, b: unknown): boolean {
  if (typeof a === "number" && typeof b === "number") {
    if (Number.isNaN(a) && Number.isNaN(b)) return true;
    return Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(a), Math.abs(b));
  }
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((x, i) => deepEq(x, b[i]));
  }
  if (a && b && typeof a === "object" && typeof b === "object" && !Array.isArray(a) && !Array.isArray(b)) {
    const ka = Object.keys(a as object);
    const kb = Object.keys(b as object);
    return ka.length === kb.length && ka.every((k) => Object.prototype.hasOwnProperty.call(b,k) && deepEq((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k]));
  }
  return a === b;
}

export function fmt(v: unknown): string {
  if (v === undefined) return "undefined";
  if (typeof v === "string") return JSON.stringify(v);
  try {
    return JSON.stringify(v) ?? String(v);
  } catch {
    return String(v);
  }
}

export function normOut(s: string): string {
  return s
    .replace(/\r/g, "")
    .split("\n")
    .map((l) => l.replace(/\s+$/, ""))
    .join("\n")
    .replace(/^\n+/, "")
    .replace(/\n+$/, "");
}

export function testLabel(t: TestCase): string {
  if (t.fixture !== undefined) return t.hidden ? "Otro archivo de prueba" : "Colección de ejemplo";
  if (t.call) return t.call;
  if (t.input) return "Entrada: " + t.input.join(", ");
  return "Programa completo";
}

export function judge(t: TestCase, r: { value?: unknown; out: string; err?: string }): TestOutcome {
  const label = testLabel(t);
  const want: string[] = [];
  if (t.expect !== undefined) want.push(fmt(t.expect));
  if (t.out !== undefined) want.push("salida «" + normOut(t.out) + "»");
  const wantS = want.join(" + ");
  if (r.err) return { pass: false, label, err: r.err, want: wantS, hidden: t.hidden };
  let pass = true;
  const got: string[] = [];
  if (t.expect !== undefined) {
    pass = deepEq(r.value, t.expect);
    got.push(fmt(r.value));
  }
  if (t.out !== undefined) {
    pass = pass && normOut(r.out) === normOut(t.out);
    got.push("salida «" + normOut(r.out) + "»");
  }
  return { pass, label, got: got.join(" + "), want: wantS, hidden: t.hidden };
}
