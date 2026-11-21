import type { Challenge, Lang, RunOutcome, TestCase, TestOutcome } from "@/lib/types";
import { judge } from "./common";
import { javaRun } from "./java";
import { JS_WORKER_SRC, runJsLocal } from "./jscore";
import { pseudoRun } from "./pseudo";

export function stripCode(code: string, lang: Lang): string {
  let s = code.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/\/\/.*$/gm, " ");
  s = s
    .replace(/"(?:\\.|[^"\\\n])*"/g, '""')
    .replace(/'(?:\\.|[^'\\\n])*'/g, "''")
    .replace(/`[^`]*`/g, "``");
  if (lang === "pseudo") s = s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return s;
}

export function codeHash(code: string, lang: Lang): string {
  const tokens = code.match(/"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`|\/\/[^\n]*|\/\*[\s\S]*?\*\/|[\w$]+|[^\s]/g) ?? [];
  const s = lang + ':' + tokens.filter(t=> !t.startsWith('//') && !t.startsWith('/*')).map(t=>lang==='pseudo' && !/["']/.test(t)?t.toLowerCase():t).join(' ');
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return String(h >>> 0);
}

function subst(tests: TestCase[], name: string): TestCase[] {
  const safe = JSON.stringify(name).slice(1, -1);
  return JSON.parse(JSON.stringify(tests).split("{{name}}").join(safe)) as TestCase[];
}

interface JsReply {
  syntax?: string;
  timeout?: boolean;
  results?: { value?: unknown; out: string; err?: string }[];
}

function runJsWorker(code: string, tests: TestCase[]): Promise<JsReply> {
  return new Promise((resolve) => {
    if (typeof Worker === "undefined") {
      resolve(runJsLocal(code, tests));
      return;
    }
    const url = URL.createObjectURL(new Blob([JS_WORKER_SRC], { type: "text/javascript" }));
    const w = new Worker(url);
    let to: ReturnType<typeof setTimeout>;
    const done = (r: JsReply) => {
      clearTimeout(to);
      w.terminate();
      URL.revokeObjectURL(url);
      resolve(r);
    };
    to = setTimeout(() => done({ timeout: true }), 2500);
    w.onmessage = (e) => done(e.data as JsReply);
    w.onerror = (e) => done({ syntax: e.message || "Error" });
    w.postMessage({ code, tests: tests.map((t) => ({ call: t.call })) });
  });
}

function jsSyntax(msg: string): string {
  return "Error de sintaxis: " + msg.replace("Unexpected token", "Símbolo inesperado").replace("Unexpected end of input", "El código termina antes de tiempo (¿falta cerrar { } o ( )?)").replace("Unexpected identifier", "Nombre inesperado (¿falta un operador, coma o punto y coma?)");
}

export async function runLang(lang: Lang, code: string, tests: TestCase[]): Promise<{ syntax?: string; outcomes: TestOutcome[] }> {
  if (lang === "mongo") return (await import("./mongo")).mongoRun(code,tests);
  if (lang === "pseudo") return pseudoRun(code, tests);
  if (lang === "java") return javaRun(code, tests);
  const r = await runJsWorker(code, tests);
  if (r.timeout) return { syntax: "El hechizo se descontroló: ¡bucle infinito! Revisa la condición que detiene tu ciclo", outcomes: [] };
  if (r.syntax) return { syntax: jsSyntax(r.syntax), outcomes: [] };
  return { outcomes: tests.map((t, i) => judge(t, r.results![i])) };
}

export async function runChallenge(lang: Lang, code: string, ch: Challenge, heroName: string): Promise<RunOutcome> {
  const empty = (message: string): RunOutcome => ({ status: "empty", message, outcomes: [], passed: 0, total: ch.tests.length });
  if (!code.trim()) return empty("El grimorio está en blanco: escribe tu hechizo antes de lanzarlo.");
  if (code.trim() === ch.starter.trim()) return empty("Aún no has escrito nada nuevo: completa el hechizo.");
  const tests = subst(ch.tests, heroName);
  const r = await runLang(lang, code, tests);
  if (r.syntax) return { status: "syntax", message: r.syntax, outcomes: [], passed: 0, total: tests.length };
  const passed = r.outcomes.filter((o) => o.pass).length;
  const base = { outcomes: r.outcomes, passed, total: tests.length };
  if (passed < tests.length) return { status: "wrong", ...base };
  const clean = stripCode(code, lang);
  for (const q of ch.must ?? []) {
    const hit = new RegExp(q.re, q.flags ?? "i").test(clean);
    if (q.not ? hit : !hit) return { status: "req", message: q.msg, ...base };
  }
  return { status: "ok", ...base };
}
