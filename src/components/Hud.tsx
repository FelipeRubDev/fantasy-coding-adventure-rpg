"use client";
import { useEffect, useRef, useState } from "react";
import { sfx } from "@/game/audio";
import { maxHp, rankOf, xpNeeded } from "@/game/rewards";
import { useGame } from "@/game/store";
import { Bar } from "./ui";

function useCountUp(target: number) {
  const [v, setV] = useState(target);
  const from = useRef(target);
  useEffect(() => {
    const start = performance.now();
    const a = from.current;
    let raf = 0;
    const tick = (t: number) => {
      const k = Math.min(1, (t - start) / 700);
      const e = 1 - Math.pow(1 - k, 3);
      const cur = Math.round(a + (target - a) * e);
      setV(cur);
      from.current = cur;
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target]);
  return v;
}

export default function Hud() {
  const { save, setModal } = useGame();
  const score = useCountUp(save?.score ?? 0);
  const gold = useCountUp(save?.gold ?? 0);
  if (!save) return null;
  const mh = maxHp(save);
  const open = (m: "inv" | "codex" | "rank" | "menu") => {
    sfx.click();
    setModal(m);
  };
  return (
    <header className="hud">
      <div className="hud-hero">
        <div className="hud-avatar" aria-hidden>
          🪶<span>{save.level}</span>
        </div>
        <div className="hud-id">
          <div className="hud-name font-display">
            {save.name} <small>· {rankOf(save.level)}</small>
          </div>
          <Bar value={save.xp} max={xpNeeded(save.level)} kind="xp" trail={false} label={`${save.xp}/${xpNeeded(save.level)} XP`} />
        </div>
      </div>
      <div className="hud-hp">
        <Bar id="hud-hp" value={save.hp} max={mh} kind="hp" label={`❤ ${save.hp} / ${mh}`} />
      </div>
      <div className="hud-res">
        <span className="chip" title="Oro">
          🪙 {gold}
        </span>
        <span className="chip" title="Pergaminos de pista">
          📜 {save.scrolls}
        </span>
        <span className="chip" title="Pociones">
          🧪 {save.potions}
        </span>
        <span className="chip chip-score" title="Puntuación total">
          ★ {score.toLocaleString("es")}
        </span>
        {save.streak >= 2 && (
          <span className="chip chip-combo" title="Racha de hechizos sin fallar">
            🔥 ×{save.streak}
          </span>
        )}
        {save.buff > 0 && (
          <span className="chip" title="Hidromiel de Valor: +50% XP y puntos">
            🍯 {save.buff}
          </span>
        )}
      </div>
      <div className="hud-btns">
        <button className="icon-btn" onClick={() => open("inv")} title="Inventario" aria-label="Inventario">
          🎒
        </button>
        <button className="icon-btn" onClick={() => open("codex")} title="Grimorio y logros" aria-label="Grimorio">
          📖
        </button>
        <button className="icon-btn" onClick={() => open("rank")} title="Salón de la fama" aria-label="Salón de la fama">
          🏆
        </button>
        <button className="icon-btn" onClick={() => open("menu")} title="Menú" aria-label="Menú">
          ☰
        </button>
      </div>
    </header>
  );
}
