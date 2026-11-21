"use client";
import { useEffect, useRef, useState } from "react";
import { RARITY } from "@/data/items";
import { sfx } from "@/game/audio";
import { fx } from "@/game/fx";
import type { Loot } from "@/game/rewards";
import { useGame } from "@/game/store";
import type { Dungeon, Item, Monster } from "@/lib/types";
import { ItemCard } from "./Overlays";

export interface VictoryData {
  monster: Monster;
  score: number;
  xp: number;
  gold: number;
  levels: number;
  loot: Loot | null;
  sig?: Item;
  dungeon?: Dungeon;
  heal: number;
  rounds: number;
  firstTries: number;
  replay: boolean;
  quest: boolean;
  questBonus?: { gold: number; item?: Item };
  campaignEnd?: 1 | 2 | 3 | 4;
  campaignText?: string;
}

function CountUp({ to, prefix = "", delay = 0 }: { to: number; prefix?: string; delay?: number }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf = 0;
    const t0 = performance.now() + delay;
    const tick = (t: number) => {
      const k = Math.max(0, Math.min(1, (t - t0) / 900));
      setV(Math.round(to * (1 - Math.pow(1 - k, 3))));
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to, delay]);
  return (
    <>
      {prefix}
      {v.toLocaleString("es")}
    </>
  );
}

export function Victory({ v, onContinue, onMap, nextLabel }: { v: VictoryData; onContinue: () => void; onMap?: () => void; nextLabel?: string }) {
  const [stage, setStage] = useState(0);
  const btn = useRef<HTMLButtonElement>(null);
  const lootItem = v.loot?.item ?? v.sig;
  useEffect(() => {
    sfx.win();
    fx.confetti(90);
    const t1 = setTimeout(() => {
      if (lootItem || v.loot?.dupGold) {
        sfx.chest();
        setStage(1);
      }
    }, 1100);
    const t2 = setTimeout(() => {
      if (lootItem) {
        setStage(2);
        fx.flash("rgba(255,210,120,.35)", 400);
        fx.confetti(50);
        sfx.level();
      } else setStage(2);
    }, 1900);
    btn.current?.focus({ preventScroll: true });
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const { save } = useGame();
  void save;
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onContinue();
      }
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onContinue]);

  return (
    <div className="overlay victory">
      <div className="panel overlay-card vic-card">
        <p className="kicker">{v.replay ? "Práctica superada" : v.quest ? "Encargo cumplido" : "Criatura derrotada"}</p>
        <h2 className="vic-title font-display">¡VICTORIA!</h2>
        <p className="vic-quote">
          {v.monster.icon} {v.monster.defeat}
        </p>
        <div className="vic-stats">
          <div>
            <b>
              <CountUp to={v.score} prefix="★ " />
            </b>
            <span>puntos</span>
          </div>
          <div>
            <b>
              <CountUp to={v.xp} prefix="✨ " delay={150} />
            </b>
            <span>experiencia</span>
          </div>
          <div>
            <b>
              <CountUp to={v.gold} prefix="🪙 " delay={300} />
            </b>
            <span>oro</span>
          </div>
        </div>
        <p className="muted small">
          {v.rounds} {v.rounds === 1 ? "hechizo" : "hechizos"} · {v.firstTries} a la primera{v.heal > 0 ? ` · +${v.heal} de vida recuperada` : ""}
        </p>
        {v.levels > 0 && <div className="banner levelup">⬆ ¡SUBES DE NIVEL! {v.levels > 1 ? `(+${v.levels})` : ""} Vida restaurada y oro de regalo</div>}

        {(v.loot || v.sig) && (
          <div className="loot-zone">
            {stage < 2 && (
              <div className={`chest ${stage === 1 ? "open" : ""}`} aria-hidden>
                🎁
              </div>
            )}
            {stage >= 2 && lootItem && (
              <div className="loot-reveal" style={{ ["--rc" as string]: RARITY[lootItem.rarity].color }}>
                <small className="kicker">{v.sig ? "Tesoro del jefe" : "Botín"}</small>
                <ItemCard item={lootItem} big />
              </div>
            )}
            {stage >= 2 && !lootItem && v.loot?.dupGold && <p className="banner">🪙 Objeto repetido: +{v.loot.dupGold} de oro</p>}
          </div>
        )}
        {v.questBonus && (
          <div className="banner">
            📌 ¡Tablero completo! +{v.questBonus.gold} de oro {v.questBonus.item ? `y ${v.questBonus.item.icon} ${v.questBonus.item.name}` : ""}
          </div>
        )}
        {v.dungeon && !v.replay && (
          <div className="banner dungeon-done">
            🏰 ¡Mazmorra completada: {v.dungeon.name}!<small>{v.dungeon.outro}</small>
          </div>
        )}
        {v.campaignEnd && v.campaignText && <div className="banner campaign-end">{v.campaignText}</div>}
        <button ref={btn} className="btn btn-lg" onClick={onContinue}>
          {nextLabel ?? "Continuar ▸"} <small>Enter</small>
        </button>
        {nextLabel && onMap && (
          <button className="btn btn-ghost" onClick={onMap}>
            🗺 Volver al mapa
          </button>
        )}
      </div>
    </div>
  );
}

export function Defeat({ lost, onRetry, onLeave }: { lost: number; onRetry: () => void; onLeave: () => void }) {
  useEffect(() => {
    sfx.death();
    fx.shake(18, 700);
    fx.flash("rgba(160,20,20,.55)", 700);
  }, []);
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === "r" || e.key === "R") {
        e.preventDefault();
        onRetry();
      }
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onRetry]);
  return (
    <div className="overlay defeat">
      <div className="panel overlay-card">
        <h2 className="def-title font-display">HAS CAÍDO</h2>
        <p className="vic-quote">La pluma resbala de tu mano. Los carroñeros te saquean{lost > 0 ? ` (-${lost} oro)` : ""}. Pero lo escrito, escrito está: el monstruo conserva sus heridas.</p>
        <button className="btn btn-red btn-lg" onClick={onRetry} autoFocus>
          ☠ Renacer y reintentar <small>Enter</small>
        </button>
        <button className="btn btn-ghost" onClick={onLeave}>
          Huir al mapa
        </button>
      </div>
    </div>
  );
}

export function Pause({ onResume, onRestart, onLeave }: { onResume: () => void; onRestart: () => void; onLeave: () => void }) {
  const { save, toggleSfx, toggleMusic } = useGame();
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Enter") {
        e.preventDefault();
        onResume();
      }
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onResume]);
  return (
    <div className="overlay">
      <div className="panel overlay-card">
        <h2 className="font-display pause-title">PAUSA</h2>
        <p className="muted">El tiempo se detiene. El monstruo espera.</p>
        <button className="btn btn-lg" onClick={onResume} autoFocus>
          ▶ Reanudar <small>Esc</small>
        </button>
        <button className="btn btn-ghost" onClick={onRestart}>
          ↻ Reiniciar esta ronda (borra el código)
        </button>
        <div className="row">
          <button className="btn btn-ghost btn-sm" onClick={toggleSfx}>
            {save?.sfx === false ? "🔇 Efectos" : "🔊 Efectos"}
          </button>
          <button className="btn btn-ghost btn-sm" onClick={toggleMusic}>
            {save?.music ? "🎼 Música" : "🎼 Música (off)"}
          </button>
        </div>
        <button className="btn btn-ghost" onClick={onLeave}>
          Abandonar el combate
        </button>
      </div>
    </div>
  );
}
