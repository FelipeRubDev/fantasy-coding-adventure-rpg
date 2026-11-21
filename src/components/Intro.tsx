"use client";
import { useEffect, useState } from "react";
import { PROLOGUE } from "@/data/story";
import { sfx } from "@/game/audio";
import { useGame } from "@/game/store";
import { Typewriter } from "./ui";

export default function Intro() {
  const { go, update } = useGame();
  const [i, setI] = useState(0);
  const [done, setDone] = useState(false);
  const [fast, setFast] = useState(false);
  const last = PROLOGUE.length - 1;
  const slide = PROLOGUE[i];

  const finish = () => {
    sfx.chest();
    update((d) => void (d.introSeen = true));
    go({ name: "battle", ref: { kind: "node", id: "d1n1" }, back: { name: "dungeon", id: "d1" } });
  };

  const next = () => {
    sfx.click();
    if (!done) {
      setFast(true);
      return;
    }
    if (i < last) {
      setI(i + 1);
      setDone(false);
      setFast(false);
    } else finish();
  };

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        next();
      } else if (e.key === "Escape") finish();
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  });

  return (
    <div className="screen intro-screen" onClick={next}>
      <div className="title-bg dim" />
      <div className="intro-card" key={i}>
        {slide.who && (
          <div className="intro-who font-display">
            <span aria-hidden>🐦‍⬛</span> {slide.who}
          </div>
        )}
        <p className="intro-text">
          <Typewriter text={slide.text} speed={24} skip={fast} onDone={() => setDone(true)} />
        </p>
        <div className="intro-foot">
          <span className="pips">
            {PROLOGUE.map((_, k) => (
              <i key={k} className={k <= i ? "on" : ""} />
            ))}
          </span>
          <span className="hint-pulse">{done ? (i < last ? "Toca o pulsa Enter para continuar" : "⚔ Toca para empezar a escribir") : "…"}</span>
        </div>
      </div>
      <button
        className="btn btn-ghost btn-sm intro-skip"
        onClick={(e) => {
          e.stopPropagation();
          finish();
        }}
      >
        Saltar prólogo ⏭
      </button>
    </div>
  );
}
