"use client";
import { useEffect, useState, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { sfx } from "@/game/audio";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const inline = (s: string) => esc(s).replace(/«([^»]+)»/g, '<code class="ic">$1</code>');

/** Renderiza enunciados: párrafos, listas y bloques de código (heurística simple). */
export function Rich({ text }: { text: string }) {
  const blocks = text.split("\n\n");
  return (
    <div className="rich">
      {blocks.map((b, i) => {
        const lines = b.split("\n");
        const isCode = lines.length >= 2 && lines.every((l) => l.length <= 62) && !lines.some((l) => /[.:]$/.test(l.trim()) || l.trim().startsWith("•"));
        if (isCode) {
          return (
            <pre key={i} className="codeblock">
              {b}
            </pre>
          );
        }
        return <p key={i} dangerouslySetInnerHTML={{ __html: inline(b) }} />;
      })}
    </div>
  );
}

export function Typewriter({ text, speed = 22, onDone, className, skip }: { text: string; speed?: number; onDone?: () => void; className?: string; skip?: boolean }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (skip) {
      setN(text.length);
      onDone?.();
      return;
    }
    setN(0);
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setN(i);
      if (i >= text.length) {
        clearInterval(id);
        onDone?.();
      }
    }, speed);
    return () => clearInterval(id);
  }, [text, skip]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <span className={className}>
      {text.slice(0, n)}
      <span className="caret" />
    </span>
  );
}

export function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  const panel = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const before = document.activeElement as HTMLElement | null;
    const el = panel.current;
    const focusables = () => Array.from(el?.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), select, textarea:not([disabled]), summary, [tabindex="0"]') ?? []).filter(x=>x.offsetParent!==null);
    const frame = requestAnimationFrame(()=>{if(!el?.contains(document.activeElement))(el?.querySelector<HTMLElement>('input') ?? focusables()[0])?.focus({preventScroll:true});});
    const k = (e: KeyboardEvent) => {
      if(e.key === 'Escape'){e.preventDefault();e.stopImmediatePropagation();closeRef.current();}
      if(e.key==='Tab') {const a=focusables();if(!a.length)return;if(e.shiftKey && document.activeElement===a[0]){e.preventDefault();a[a.length-1].focus();}else if(!e.shiftKey && document.activeElement===a[a.length-1]){e.preventDefault();a[0].focus();}}
    };
    window.addEventListener('keydown',k,true);
    return ()=>{cancelAnimationFrame(frame);window.removeEventListener('keydown',k,true);if(before?.isConnected)before.focus({preventScroll:true});};
  }, []);
  if(typeof document === "undefined")return null;
  return createPortal(
    <div className="modal-back" onPointerDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={panel} className={`panel modal ${wide ? "modal-wide" : ""}`} role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-head">
          <h2 className="font-display">{title}</h2>
          <button className="icon-btn" onClick={() => (sfx.click(), onClose())} aria-label="Cerrar">
            ✕
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>, document.body
  );
}

export function Bar({ value, max, kind, trail = true, label, id, ticks }: { value: number; max: number; kind: "hp" | "mon" | "xp"; trail?: boolean; label?: string; id?: string; ticks?: number }) {
  const pct = Math.max(0, Math.min(100, (value / Math.max(1, max)) * 100));
  return (
    <div className="bar" id={id}>
      {trail && <i className="trail" style={{ width: pct + "%" }} />}
      <i className={`fill fill-${kind}`} style={{ width: pct + "%" }} />
      {ticks && ticks > 1 && Array.from({ length: ticks - 1 }, (_, i) => <b key={i} className="tick" style={{ left: `${((i + 1) / ticks) * 100}%` }} />)}
      {label && <span className="bar-label">{label}</span>}
    </div>
  );
}

export const LANG_CLASS = { pseudo: "chip-pseudo", js: "chip-js", java: "chip-java", mongo: "chip-mongo" } as const;
