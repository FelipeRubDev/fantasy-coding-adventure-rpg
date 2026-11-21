"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ACHS } from "@/data/achievements";
import type { Save, CampaignId } from "@/lib/types";
import { setMusic, setSfx, sfx } from "./audio";
import { toast } from "./bus";
import { fx } from "./fx";
import { nextNode } from "./progress";
import { DUNGEONS } from "@/data/dungeons";
import { maxHp, newSave } from "./rewards";

export interface BattleRef {
  kind: "node" | "quest";
  id: string;
}
export type View = { name: "title" } | { name: "intro" } | { name: "hub"; campaign?: CampaignId } | {name: "quiz"} | { name: "dungeon"; id: string } | { name: "battle"; ref: BattleRef; back: View } | { name: "tavern" };
export type Modal = null | "inv" | "codex" | "rank" | "menu";

interface Ctx {
  save: Save | null;
  getSave: () => Save | null;
  ready: boolean;
  view: View;
  go: (v: View) => void;
  modal: Modal;
  setModal: (m: Modal) => void;
  update: (fn: (d: Save) => void) => void;
  newGame: (name: string, destination?: View) => void;
  visit: (destination: View) => void;
  continueGame: () => void;
  toggleSfx: () => void;
  toggleMusic: () => void;
}

const GameCtx = createContext<Ctx | null>(null);
export const useGame = () => {
  const c = useContext(GameCtx);
  if (!c) throw new Error("GameProvider ausente");
  return c;
};

const LS_SAVE = "escriba:save:v1";
const LS_PID = "escriba:pid";

function dayKey(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

function migrate(s: Save): Save {
  const base = newSave(s.name || "Escriba");
  return { ...base, ...s, quiz: { ...base.quiz, ...s.quiz }, stats: { ...base.stats, ...(s.stats ?? {}) }, quests: { ...base.quests, ...(s.quests ?? {}) }, daily: { ...base.daily, ...(s.daily ?? {}) } };
}

export function GameProvider({ children }: { children: ReactNode }) {
  const [save, setSave] = useState<Save | null>(null);
  const [ready, setReady] = useState(false);
  const [view, setView] = useState<View>({ name: "title" });
  const [modal, setModal] = useState<Modal>(null);
  const ref = useRef<Save | null>(null);
  const pid = useRef("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // carga inicial: caché local + servidor
  useEffect(() => {
    let alive = true;
    let id = localStorage.getItem(LS_PID);
    if (!id) {
      id = (crypto.randomUUID?.() ?? String(Date.now()) + Math.random().toString(16).slice(2)).slice(0, 48);
      localStorage.setItem(LS_PID, id);
    }
    pid.current = id;
    let local: Save | null = null;
    try {
      const raw = localStorage.getItem(LS_SAVE);
      if (raw) local = migrate(JSON.parse(raw) as Save);
    } catch {
      local = null;
    }
    if (local) {
      ref.current = local;
      setSave(local);
    }
    setReady(true);
    fetch(`/api/save?id=${encodeURIComponent(id)}`)
      .then((r) => r.json())
      .then((j: { save: Save | null }) => {
        if (!alive || !j.save) return;
        const remote = migrate(j.save);
        if (!ref.current || remote.score > ref.current.score) {
          ref.current = remote;
          setSave(remote);
        }
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);

  const flush = useCallback(() => {
    const s = ref.current;
    if (!s || !pid.current) return;
    fetch("/api/save", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: pid.current, save: s }), keepalive: true }).catch(() => undefined);
  }, []);

  useEffect(() => {
    const h = () => flush();
    window.addEventListener("pagehide", h);
    return () => window.removeEventListener("pagehide", h);
  }, [flush]);

  const commit = useCallback(
    (d: Save) => {
      ref.current = d;
      setSave(d);
      try {
        localStorage.setItem(LS_SAVE, JSON.stringify(d));
      } catch {
        /* sin espacio */
      }
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(flush, 1500);
    },
    [flush],
  );

  const update = useCallback(
    (fn: (d: Save) => void) => {
      if (!ref.current) return;
      const d = structuredClone(ref.current);
      fn(d);
      d.hp = Math.max(0, Math.min(d.hp, maxHp(d)));
      // logros
      const fresh = ACHS.filter((a) => !d.ach.includes(a.id) && a.test(d));
      for (const a of fresh) {
        d.ach.push(a.id);
        d.gold += a.gold;
      }
      commit(d);
      fresh.forEach((a, i) =>
        setTimeout(() => {
          toast({ kind: "ach", title: `Logro: ${a.name}`, text: `${a.desc}  +${a.gold} oro`, icon: a.icon });
          sfx.ach();
          fx.confetti(30);
        }, 500 + i * 900),
      );
    },
    [commit],
  );

  const newGame = useCallback(
    (name: string, destination: View = {name: "intro"}) => {
      const s = newSave(name);
      s.daily = { day: dayKey(), streak: 1 };
      if(destination.name==='dungeon') s.activeCampaign=DUNGEONS.find(d=>d.id===destination.id)?.campaign;
      s.introSeen = destination.name !== "intro";
      s.sfx = localStorage.getItem("codice:sfx") !== "off";
      s.music = localStorage.getItem("codice:music") === "on";
      commit(s);
      setView(destination);
    },
    [commit],
  );

  const visit = useCallback((destination: View) => {
    if (ref.current) {
      if(destination.name==='dungeon') {const c=DUNGEONS.find(d=>d.id===destination.id)?.campaign; if(c && c!==ref.current.activeCampaign)update(d=>{d.activeCampaign=c;});}
      setView(destination);
    }
    else newGame("Escriba", destination);
  }, [newGame, update]);

  const continueGame = useCallback(() => {
    if (!ref.current) return;
    const s = ref.current;
    const today = dayKey();
    if (s.daily.day !== today) {
      const y = dayKey(new Date(Date.now() - 86400000));
      update((d) => {
        d.daily.streak = d.daily.day === y ? d.daily.streak + 1 : 1;
        d.daily.day = today;
        const bonus = 15 + 10 * Math.min(d.daily.streak, 7);
        d.gold += bonus;
        d.scrolls += 1;
        if (d.daily.streak % 3 === 0) d.potions += 1;
        setTimeout(() => toast({ kind: "gold", title: `Cofre diario · racha de ${d.daily.streak} día(s)`, text: `+${bonus} oro, +1 pergamino${d.daily.streak % 3 === 0 ? ", +1 poción" : ""}`, icon: "🎁" }), 400);
      });
    }
    if (!s.introSeen) setView({name:'intro'});
    else {const n=nextNode(s,s.activeCampaign)??nextNode(s);setView(n?{name:'battle',ref:{kind:'node',id:n.node.id},back:{name:'dungeon',id:n.d.id}}:{name:'hub'});}
  }, [update]);

  const toggleSfx = useCallback(() => update((d) => void (d.sfx = !d.sfx)), [update]);
  const toggleMusic = useCallback(() => update((d) => void (d.music = !d.music)), [update]);

  useEffect(() => {
    if (!save) return;
    setSfx(save.sfx);
    setMusic(save.music);
  }, [save?.sfx, save?.music]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const unlock = () => {
      sfx.unlock();
      if (ref.current?.music) setMusic(true);
    };
    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);

  const getSave = useCallback(()=>ref.current, []);
  const value = useMemo<Ctx>(
    () => ({ save, getSave, ready, view, go: setView, modal, setModal, update, newGame, visit, continueGame, toggleSfx, toggleMusic }),
    [save, ready, view, modal, update, newGame, visit, continueGame, toggleSfx, toggleMusic],
  );
  return <GameCtx.Provider value={value}>{children}</GameCtx.Provider>;
}
