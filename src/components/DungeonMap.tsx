"use client";
import { useEffect, useState } from "react";
import { DUNGEONS, LANG_ICON, LANG_LABEL, TIER_LABEL } from "@/data/dungeons";
import { sfx } from "@/game/audio";
import { fx } from "@/game/fx";
import { nodeAvailable } from "@/game/progress";
import { useGame } from "@/game/store";
import { LANG_CLASS } from "./ui";

const XS = [50, 25, 73, 30, 64, 38, 68];
const STEP = 150;

export default function DungeonMap({ id }: { id: string }) {
  const { save, go } = useGame();
  const d = DUNGEONS.find((x) => x.id === id)!;
  const states = d.nodes.map((n, i) => ({ cleared: !!save?.cleared[n.id], avail: save ? nodeAvailable(save, d, i) : false, prog: save?.prog[n.id] ?? 0 }));
  const cur = states.findIndex((s) => !s.cleared && s.avail);
  const [sel, setSel] = useState(cur >= 0 ? cur : d.nodes.length - 1);
  const [open, setOpen] = useState(states.every((s) => !s.cleared));
  const node = d.nodes[sel];
  const st = states[sel];
  const pos = d.nodes.map((_, i) => ({ x: XS[i % XS.length], y: 100 + i * STEP }));
  const H = 100 + (d.nodes.length - 1) * STEP + 120;
  const pts = [{ x: 50, y: 30 }, ...pos];

  const enter = (i: number) => {
    const s = states[i];
    if (!s.avail) {
      sfx.fail();
      fx.shake(5, 220);
      return;
    }
    sfx.click();
    go({ name: "battle", ref: { kind: "node", id: d.nodes[i].id }, back: { name: "dungeon", id: d.id } });
  };

  useEffect(() => {
    document.getElementById("node-" + sel)?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [sel]);

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key === "ArrowRight") {
        e.preventDefault();
        setSel((s) => Math.min(d.nodes.length - 1, s + 1));
        sfx.click();
      } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
        e.preventDefault();
        setSel((s) => Math.max(0, s - 1));
        sfx.click();
      } else if (e.key === "Enter" && (e.target as HTMLElement).tagName !== "BUTTON") {
        e.preventDefault();
        enter(sel);
      } else if (e.key === "Escape") go({ name: "hub", campaign:d.campaign });
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  });

  const done = states.filter((s) => s.cleared).length;

  return (
    <div className="screen dungeon screen-in" style={{ ["--bg-img" as string]: `url(${d.img})` }}>
      <div className="dungeon-bg" />
      <div className="wrap dungeon-wrap">
        <div className="dungeon-head">
          <button className="btn btn-ghost btn-sm" onClick={() => (sfx.click(), go({ name: "hub", campaign:d.campaign }))}>
            ← Salir de la mazmorra
          </button>
          <div className="dungeon-title">
            <span className={`chip ${LANG_CLASS[d.lang]}`}>
              {d.campaign===3 ? "Pseudocódigo · JavaScript · Java" : LANG_LABEL[d.lang]}
            </span>
            <h1 className="font-display">{d.name}</h1>
            <p>{d.subtitle}</p>
          </div>
          <div className="dungeon-prog">
            <b>
              {done}/{d.nodes.length}
            </b>
            <span>puntos</span>
          </div>
        </div>

        <div className="panel chronicle">
          <button className="chron-toggle font-display" onClick={() => setOpen(!open)}>
            📜 Crónica de la mazmorra {open ? "▾" : "▸"}
          </button>
          {open && <p>{d.intro}</p>}
          {done === d.nodes.length && <p className="outro">{d.outro}</p>}
        </div>

        <div className="map-grid">
          <div className="map" style={{ height: H }}>
            <svg className="map-svg" viewBox={`0 0 100 ${H}`} preserveAspectRatio="none" aria-hidden>
              {pts.slice(1).map((p, i) => {
                const a = pts[i];
                const ym = (a.y + p.y) / 2;
                const lit = states[i].avail;
                return <path key={i} d={`M ${a.x} ${a.y} C ${a.x} ${ym}, ${p.x} ${ym}, ${p.x} ${p.y}`} className={lit ? "seg lit" : "seg"} />;
              })}
            </svg>
            <div className="door" style={{ left: "50%", top: 6 }}>
              🚪<span>Entrada</span>
            </div>
            {d.nodes.map((n, i) => {
              const s = states[i];
              const p = pos[i];
              const boss = n.tier === "boss";
              return (
                <button
                  key={n.id}
                  id={"node-" + i}
                  className={`mnode ${n.tier} ${s.cleared ? "cleared" : ""} ${!s.avail ? "locked" : ""} ${i === cur ? "current" : ""} ${i === sel ? "selected" : ""}`}
                  style={{ left: `${p.x}%`, top: p.y, ["--mc" as string]: n.monster.color }}
                  onClick={() => {
                    sfx.click();
                    setSel(i);
                  }}
                  onDoubleClick={() => enter(i)}
                  aria-label={`${n.concept} — ${TIER_LABEL[n.tier]}`}
                >
                  {i === cur && <span className="hero-marker">🕯️</span>}
                  <span className={`mn-icon ${boss ? "boss" : ""}`}>{s.avail || s.cleared ? n.monster.icon : "❔"}</span>
                  {s.cleared && <span className="mn-check">✔</span>}
                  {!s.cleared && s.prog > 0 && (
                    <span className="mn-prog">
                      {s.prog}/{n.rounds.length}
                    </span>
                  )}
                  <span className="mn-label">
                    <b>{n.concept}</b>
                    <small>
                      {TIER_LABEL[n.tier]} · {n.rounds.length} {n.rounds.length > 1 ? "hechizos" : "hechizo"}
                    </small>
                  </span>
                </button>
              );
            })}
          </div>

          <aside className="panel node-card">
            <p className="kicker">
              Punto {sel + 1} de {d.nodes.length} · {TIER_LABEL[node.tier]}
            </p>
            <h2 className="font-display">{node.concept}</h2>
            <div className="nc-monster" style={{ ["--mc" as string]: node.monster.color }}>
              <span>{st.avail || st.cleared ? node.monster.icon : "❔"}</span>
              <div>
                <b>{st.avail || st.cleared ? node.monster.name : "Criatura desconocida"}</b>
                <small>
                  {node.rounds.length > 1 ? `${node.rounds.length} turnos para derrotarlo` : "Cae de un solo hechizo"} · {node.monster.hp} PV
                </small>
              </div>
            </div>
            {d.campaign >= 3 && <ol className="node-lessons">{node.rounds.map((c,i)=><li key={i}><span>{LANG_LABEL[c.lang ?? d.lang]}</span> {c.title}</li>)}</ol>}
            <p className="nc-lore">{st.avail || st.cleared ? node.lore : "Derrota a la criatura anterior para descubrir qué aguarda aquí."}</p>
            {st.prog > 0 && !st.cleared && (
              <p className="nc-prog">
                Progreso guardado: {st.prog}/{node.rounds.length} hechizos lanzados. El monstruo sigue herido.
              </p>
            )}
            <button className="btn btn-lg" disabled={!st.avail} onClick={() => enter(sel)}>
              {st.cleared ? "↻ Practicar de nuevo" : st.prog > 0 ? "⚔ Reanudar combate" : "⚔ Entrar al combate"}
            </button>
            {st.cleared && <p className="muted small">Repetir da ¼ de XP y oro, sin botín.</p>}
            <p className="keys">↑ ↓ elegir · Enter entrar · Esc salir</p>
          </aside>
        </div>
      </div>
    </div>
  );
}
