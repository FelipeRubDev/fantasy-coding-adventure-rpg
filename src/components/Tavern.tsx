"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { LANG_ICON, LANG_LABEL } from "@/data/dungeons";
import { RARITY } from "@/data/items";
import { QUEST_BY_ID } from "@/data/quests";
import { KEEPER_LINES, RUMORS } from "@/data/story";
import { sfx } from "@/game/audio";
import { toast } from "@/game/bus";
import { fx } from "@/game/fx";
import { dungeonsCleared, langUnlocked } from "@/game/progress";
import { giveItem, maxHp, rollLoot } from "@/game/rewards";
import { useGame } from "@/game/store";
import type { Save } from "@/lib/types";
import { LANG_CLASS } from "./ui";
import { TavernInvite } from "./CampaignLibrary";

interface Board {
  slot: number;
  ids: string[];
  nextAt: number;
  off: number;
}

const pad = (n: number) => String(n).padStart(2, "0");

export default function Tavern() {
  const { save, update, go, getSave } = useGame();
  const [board, setBoard] = useState<Board | null>(null);
  const [failed, setFailed] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [line, setLine] = useState(0);
  const fetching = useRef(false);
  const slotRef = useRef<number | null>(null);

  const load = useCallback(async () => {
    if (fetching.current) return;
    fetching.current = true;
    try {
      const r = await fetch("/api/tavern", { cache: "no-store" });
      const j = (await r.json()) as { slot: number; questIds: string[]; now: number; nextAt: number };
      setBoard({ slot: j.slot, ids: j.questIds, nextAt: j.nextAt, off: j.now - Date.now() });
      setFailed(false);
      if (slotRef.current !== null && slotRef.current !== j.slot) toast({ kind: "info", title: "¡El tablero se ha renovado!", text: "Nuevos encargos clavados en la madera.", icon: "📌" });
      slotRef.current = j.slot;
      if (getSave()?.quests.slot !== j.slot) update((d) => void (d.quests = { slot: j.slot, done: [] }));
    } catch {
      setFailed(true);
    } finally {
      fetching.current = false;
    }
  }, [update, getSave]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && go({ name: "hub" });
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [go]);

  const remain = board ? Math.max(0, board.nextAt - (now + board.off)) : 0;
  useEffect(() => {
    if (board && remain <= 0) void load();
  }, [board, remain, load]);

  if (!save) return null;
  const mh = maxHp(save);
  const h = Math.floor(remain / 3600000);
  const m = Math.floor((remain % 3600000) / 60000);
  const s = Math.floor((remain % 60000) / 1000);
  const doneIds = board && save.quests.slot === board.slot ? save.quests.done : [];
  const quests = (board?.ids ?? []).map((id) => QUEST_BY_ID[id]).filter(Boolean);
  const stage = Math.min(dungeonsCleared(save), RUMORS.length - 1);

  const buy = (cost: number, fn: (d: Save) => void, ok = true) => {
    if (save.gold < cost || !ok) {
      sfx.fail();
      fx.shake(4, 200);
      return;
    }
    sfx.coin();
    update((d) => {
      d.gold -= cost;
      fn(d);
    });
  };

  const gamble = () => {
    if (save.gold < 150) {
      sfx.fail();
      return;
    }
    const loot = rollLoot("miniboss", save.items) ?? { dupGold: 40 };
    sfx.chest();
    fx.confetti(40);
    update((d) => {
      d.gold -= 150;
      if (loot.item) giveItem(d, loot.item.id);
      else d.gold += loot.dupGold ?? 0;
    });
    if (loot.item) toast({ kind: "loot", title: `¡${loot.item.name}!`, text: `${RARITY[loot.item.rarity].label} · del cofre del buhonero`, icon: loot.item.icon, color: RARITY[loot.item.rarity].color });
    else toast({ kind: "gold", title: "Cofre repetido", text: `Recuperas ${loot.dupGold} de oro`, icon: "🪙" });
  };

  const shop: { icon: string; name: string; desc: string; cost: number; ok?: boolean; fn: () => void }[] = [
    { icon: "🧪", name: "Poción de vida", desc: "Cura 50% de tu vida en combate", cost: 30, fn: () => buy(30, (d) => void d.potions++) },
    { icon: "📜", name: "Pergamino de pista", desc: "Revela una pista del hechizo", cost: 25, fn: () => buy(25, (d) => void d.scrolls++) },
    { icon: "🍯", name: "Hidromiel de valor", desc: "+50% XP y puntos en los próximos 3 hechizos", cost: 45, ok: save.buff < 6, fn: () => buy(45, (d) => void (d.buff += 3), save.buff < 6) },
    { icon: "🔥", name: "Descanso junto al fuego", desc: `Recupera toda la vida (${save.hp}/${mh})`, cost: 15, ok: save.hp < mh, fn: () => buy(15, (d) => void (d.hp = maxHp(d)), save.hp < mh) },
    { icon: "🎁", name: "Cofre del buhonero", desc: "Objeto raro o épico... o una sorpresa", cost: 150, fn: gamble },
  ];

  return (
    <div className="screen tavern screen-in">
      <div className="tavern-bg" />
      <div className="wrap">
        <div className="dungeon-head">
          <button className="btn btn-ghost btn-sm" onClick={() => (sfx.click(), go({ name: "hub" }))}>
            ← Volver al campamento
          </button>
          <div className="dungeon-title">
            <h1 className="font-display">La Taberna del Cuervo Cojo</h1>
            <p>Aquí el fuego nunca se apaga y los encargos nunca se acaban.</p>
          </div>
        </div>

        <TavernInvite inside/>
        <div className="tavern-grid">
          <section className="panel keeper">
            <div className="tavern-purse">Tu bolsa <b>{save.gold} oro</b><span>{save.hp}/{mh} PV</span></div>
            <div className="keeper-npc">
              <span aria-hidden>🧙‍♀️</span>
              <div>
                <b className="font-display">Brisa la Tuerta</b>
                <small>Tabernera</small>
              </div>
            </div>
            <p className="quote" onClick={() => setLine((l) => l + 1)}>
              {KEEPER_LINES[line % KEEPER_LINES.length]}
            </p>
            <p className="rumor">
              <b>Rumor del día:</b> {RUMORS[stage]}
            </p>
            <h3 className="font-display sec">Mostrador</h3>
            <div className="shop">
              {shop.map((it) => (
                <button key={it.name} className="shop-item" disabled={save.gold < it.cost || it.ok === false} onClick={it.fn}>
                  <span className="si-ico">{it.icon}</span>
                  <span className="si-txt">
                    <b>{it.name}</b>
                    <small>{it.desc}</small>
                  </span>
                  <span className="si-cost">🪙 {it.cost}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="board-wrap">
            <div className="board-head">
              <h2 className="font-display">📌 Tablero de encargos</h2>
              <span className="timer" title="Los encargos se renuevan cada 12 horas">
                ⏳ Se renueva en {board ? `${pad(h)}:${pad(m)}:${pad(s)}` : "--:--:--"}
              </span>
            </div>
            {failed && (
              <div className="panel pad">
                <p>No pude leer el tablero (¿sin conexión?).</p>
                <button className="btn btn-sm" onClick={() => void load()}>
                  Reintentar
                </button>
              </div>
            )}
            {!board && !failed && <p className="muted">Clavando pergaminos…</p>}
            <div className="quest-grid">
              {quests.map((q) => {
                const done = doneIds.includes(q.id);
                const open = langUnlocked(save, q.lang);
                return (
                  <article key={q.id} className={`quest ${done ? "done" : ""} ${!open ? "sealed" : ""}`}>
                    <header>
                      <span className={`chip ${LANG_CLASS[q.lang]}`}>
                        {LANG_ICON[q.lang]} {LANG_LABEL[q.lang]}
                      </span>
                      <span className="q-rw">
                        🪙 {q.gold} · ✨ {q.xp}
                      </span>
                    </header>
                    <h3 className="font-display">{open ? q.title : "Encargo sellado"}</h3>
                    <p className="q-giver">{open ? `${q.giver}: ${q.flavor}` : `Aún no dominas ${LANG_LABEL[q.lang]}. Avanza en la campaña para desbloquearlo.`}</p>
                    <footer>
                      {done ? (
                        <span className="q-done">✔ Completado</span>
                      ) : (
                        <button
                          className="btn btn-sm"
                          disabled={!open}
                          onClick={() => {
                            sfx.click();
                            go({ name: "battle", ref: { kind: "quest", id: q.id }, back: { name: "tavern" } });
                          }}
                        >
                          {open ? `Aceptar · ${q.icon} ${q.name}` : "🔒"}
                        </button>
                      )}
                    </footer>
                  </article>
                );
              })}
            </div>
            <p className="muted small board-foot">
              {doneIds.length}/{quests.length} completados · termina los 6 para un bonus de 100 de oro y un cofre. Los encargos viejos se reemplazan por nuevos al renovarse.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
