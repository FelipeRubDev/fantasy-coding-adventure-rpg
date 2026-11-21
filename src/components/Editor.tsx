"use client";
import { useLayoutEffect, useRef } from "react";
import { sfx } from "@/game/audio";
import type { Lang } from "@/lib/types";

const nz = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const KW: Record<Lang, Set<string>> = {
  mongo: new Set("db find findOne sort skip limit countDocuments distinct aggregate insertOne insertMany updateOne updateMany deleteMany $match $group $project $sort $count $set $inc $sum $multiply $unwind".split(" ")),
  pseudo: new Set("algoritmo finalgoritmo proceso finproceso funcion finfuncion subproceso finsubproceso definir como dimension escribir mostrar imprimir leer si entonces sino finsi segun hacer caso de otro modo finsegun para hasta con paso cada finpara mientras finmientras repetir que retornar devolver y o no mod verdadero falso sin saltar".split(" ")),
  js: new Set("function return const let var if else for while do break continue switch case default new this typeof of in true false null undefined class extends try catch throw async await".split(" ")),
  java: new Set("public private protected static final abstract class interface extends implements void int long double float boolean char byte short if else for while do break continue switch case default new this super return true false null try catch finally throw throws instanceof import package".split(" ")),
};

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function highlight(code: string, lang: Lang): string {
  const re =
    lang === "pseudo"
      ? /(\/\/[^\n]*)|("[^"\n]*"?|'[^'\n]*'?)|(\b\d+(?:\.\d+)?\b)|([A-Za-zÀ-ÿ_][A-Za-zÀ-ÿ0-9_]*)|(<-|<>|<=|>=|[+\-*/%^=<>])/g
      : /(\/\/[^\n]*|\/\*[\s\S]*?(?:\*\/|$))|("(?:\\.|[^"\\\n])*"?|'(?:\\.|[^'\\\n])*'?|`[^`]*`?)|(\b\d+(?:\.\d+)?\b)|([A-Za-z_$][\w$]*)|([+\-*/%=<>!&|^?:]+)/g;
  let out = "";
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(code))) {
    out += esc(code.slice(last, m.index));
    last = m.index + m[0].length;
    const t = m[0];
    if (m[1]) out += `<span class="tk-c">${esc(t)}</span>`;
    else if (m[2]) out += `<span class="tk-s">${esc(t)}</span>`;
    else if (m[3]) out += `<span class="tk-n">${esc(t)}</span>`;
    else if (m[4]) {
      const key = lang === "pseudo" ? nz(t) : t;
      if (KW[lang].has(key)) out += `<span class="tk-k">${esc(t)}</span>`;
      else if (code[last] === "(") out += `<span class="tk-f">${esc(t)}</span>`;
      else if (lang !== "pseudo" && /^[A-Z]/.test(t)) out += `<span class="tk-t">${esc(t)}</span>`;
      else out += esc(t);
    } else if (m[5]) out += `<span class="tk-o">${esc(t)}</span>`;
  }
  return out + esc(code.slice(last)) + "\n";
}

const SYMBOLS: Record<Lang, string[]> = {
  mongo: ["{ }", "[ ]", "( )", "$", ":", ",", ".", '"', "-"],
  pseudo: ["<-", '"', "( )", "[ ]", "<>", "<=", ">=", ",", ":", "+", "-", "*", "/", "%"],
  js: ["{ }", "( )", "[ ]", ";", '"', "=", "===", "!==", "=>", "<", ">", "&&", "||", "!", ".", "+", "-", "*", "/", "%"],
  java: ["{ }", "( )", "[ ]", ";", '"', "'", "=", "==", "!=", "<", ">", "&&", "||", "!", ".", "+", "-", "*", "/", "%"],
};

const OPENERS_PSEUDO = /(\b(entonces|hacer|sino|repetir)\s*$)|(^\s*(funcion|subproceso|algoritmo|proceso)\b)|(:\s*$)/i;

interface Props {
  value: string;
  onChange: (v: string) => void;
  lang: Lang;
  disabled?: boolean;
  onRun?: () => void;
  onPasteBlocked?: () => void;
}

export default function Editor({ value, onChange, lang, disabled, onRun, onPasteBlocked }: Props) {
  const ta = useRef<HTMLTextAreaElement>(null);
  const pre = useRef<HTMLPreElement>(null);
  const gut = useRef<HTMLDivElement>(null);
  const sel = useRef<number | null>(null);
  const lines = value.split("\n").length;

  useLayoutEffect(() => {
    if (sel.current !== null && ta.current) {
      ta.current.setSelectionRange(sel.current, sel.current);
      sel.current = null;
    }
  });

  const sync = () => {
    if (!ta.current) return;
    if (pre.current) {
      pre.current.scrollTop = ta.current.scrollTop;
      pre.current.scrollLeft = ta.current.scrollLeft;
    }
    if (gut.current) gut.current.scrollTop = ta.current.scrollTop;
  };

  const insert = (text: string, caretBack = 0) => {
    const el = ta.current;
    if (!el) return;
    const s = el.selectionStart;
    const e = el.selectionEnd;
    sel.current = s + text.length - caretBack;
    onChange(value.slice(0, s) + text + value.slice(e));
    el.focus();
  };

  const onKeyDown = (ev: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((ev.ctrlKey || ev.metaKey) && ev.key === "Enter") {
      ev.preventDefault();
      onRun?.();
      return;
    }
    if (ev.key === "Tab") {
      ev.preventDefault();
      insert("  ");
      return;
    }
    if (ev.key === "Enter") {
      ev.preventDefault();
      const el = ev.currentTarget;
      const s = el.selectionStart;
      const before = value.slice(0, s);
      const line = before.slice(before.lastIndexOf("\n") + 1);
      const indent = (line.match(/^\s*/) ?? [""])[0];
      const opens = lang === "pseudo" ? OPENERS_PSEUDO.test(line) : /[{(]\s*$/.test(line);
      const extra = opens ? "  " : "";
      const after = value.slice(el.selectionEnd);
      if (lang !== "pseudo" && opens && /^\s*[})]/.test(after)) {
        sel.current = s + 1 + indent.length + extra.length;
        onChange(before + "\n" + indent + extra + "\n" + indent + after);
      } else {
        sel.current = s + 1 + indent.length + extra.length;
        onChange(before + "\n" + indent + extra + after);
      }
      return;
    }
    if (ev.key.length === 1 && !ev.ctrlKey && !ev.metaKey) sfx.type();
  };

  const block = (e: React.SyntheticEvent) => {
    e.preventDefault();
    onPasteBlocked?.();
  };

  return (
    <div className={`editor ${disabled ? "editor-off" : ""}`}>
      <div className="editor-box">
        <div className="gutter" ref={gut} aria-hidden>
          {Array.from({ length: Math.max(lines, 8) }, (_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>
        <div className="code-wrap">
          <pre ref={pre} className="code-hl" aria-hidden dangerouslySetInnerHTML={{ __html: highlight(value, lang) }} />
          <textarea
            ref={ta}
            className="code-ta"
            value={value}
            disabled={disabled}
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            autoComplete="off"
            wrap="off"
            aria-label="Editor de código"
            onChange={(e) => onChange(e.target.value)}
            onScroll={sync}
            onKeyDown={onKeyDown}
            onPaste={block}
            onDrop={block}
            onBeforeInput={(e) => {
              const t = (e.nativeEvent as InputEvent).inputType;
              if (t === "insertFromPaste" || t === "insertFromDrop") block(e);
            }}
          />
        </div>
      </div>
      <div className="symbar" role="toolbar" aria-label="Símbolos">
        {SYMBOLS[lang].map((s) => (
          <button
            key={s}
            type="button"
            className="sym"
            disabled={disabled}
            onPointerDown={(e) => {
              e.preventDefault();
              sfx.click();
              insert(s.includes(" ") ? s.replace(" ", "") : s, s.includes(" ") ? 1 : 0);
            }}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
