/** Núcleo de ejecución de JavaScript. Se ejecuta dentro de un Web Worker (con timeout) o, en las pruebas de Node, localmente. */
export const JS_CORE = `
function __fmtv(v){ if (typeof v === 'string') return v; if (v === undefined) return 'undefined'; try { var j = JSON.stringify(v); return j === undefined ? String(v) : j; } catch(e){ return String(v); } }
function __ser(v){ if (v === undefined) return undefined; if (typeof v === 'number' && !isFinite(v)) return String(v); try { var j = JSON.stringify(v); return j === undefined ? String(v) : JSON.parse(j); } catch(e){ return String(v); } }
function __run(code, tests){
  var out = [];
  var con = { log: function(){ out.push([].slice.call(arguments).map(__fmtv).join(' ')); } };
  con.info = con.log; con.warn = con.log; con.error = con.log;
  var factory;
  try { factory = new Function('console', '__call', code + '\\n;return eval(__call);'); }
  catch (e) { return { syntax: String((e && e.message) || e) }; }
  var results = [];
  for (var i = 0; i < tests.length; i++) {
    out.length = 0;
    try {
      var v = factory(con, tests[i].call || 'undefined');
      results.push({ value: __ser(v), out: out.join('\\n') });
    } catch (e) {
      results.push({ err: (e && e.name ? e.name + ': ' : '') + String((e && e.message) || e), out: out.join('\\n') });
    }
  }
  return { results: results };
}
`;

export const JS_WORKER_SRC =
  "self.fetch=undefined;self.XMLHttpRequest=undefined;self.WebSocket=undefined;self.importScripts=undefined;" +
  JS_CORE +
  "onmessage=function(e){postMessage(__run(e.data.code,e.data.tests));};";

export function runJsLocal(code: string, tests: { call?: string }[]): { syntax?: string; results?: { value?: unknown; out: string; err?: string }[] } {
  const run = new Function(JS_CORE + ";return __run;")() as (c: string, t: unknown) => { syntax?: string; results?: { value?: unknown; out: string; err?: string }[] };
  return run(code, tests);
}
