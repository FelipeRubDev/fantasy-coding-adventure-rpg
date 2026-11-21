"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LANG_ICON, LANG_LABEL, NODE_INDEX, TIER_LABEL, lastChapter } from "@/data/dungeons";
import { ITEM_BY_ID } from "@/data/items";
import { QUEST_BY_ID } from "@/data/quests";
import { fmt } from "@/engine/common";
import { codeHash, runChallenge } from "@/engine/runner";
import { sfx } from "@/game/audio";
import { toast } from "@/game/bus";
import { centerOf, fx } from "@/game/fx";
import { nextNode } from "@/game/progress";
import { addXp, clearReward, damageTaken, giveItem, healOnWin, maxHp, rollLoot, roundReward, type Loot } from "@/game/rewards";
import { useGame, type BattleRef, type View } from "@/game/store";
import { CAMPAIGN_END } from "@/data/story";
import type { Challenge, Dungeon, Item, Lang, Monster, Quest, RunOutcome, Tier } from "@/lib/types";
import { Defeat, Pause, Victory, type VictoryData } from "./BattleOverlays";
import Editor from "./Editor";
import MongoLab from "./MongoLab";
import { Bar, LANG_CLASS, Rich, Typewriter } from "./ui";

interface Enc {
  id: string;
  kind: "node" | "quest";
  concept: string;
  tier: Tier;
  monster: Monster;
  lore: string;
  rounds: Challenge[];
  lang: Lang;
  dungeon?: Dungeon;
  quest?: Quest;
  img: string;
}

const TIER_IDX = { normal: 0, elite: 1, miniboss: 2, boss: 3 } as const;

function resolve(t: BattleRef): Enc | null {
  if (t.kind === "node") {
    const e = NODE_INDEX[t.id];
    if (!e) return null;
    return { id: t.id, kind: "node", concept: e.node.concept, tier: e.node.tier, monster: e.node.monster, lore: e.node.lore, rounds: e.node.rounds, lang: e.d.lang, dungeon: e.d, img: e.d.img };
  }
  const q = QUEST_BY_ID[t.id];
  if (!q) return null;
  return {
    id: "q:" + q.id,
    kind: "quest",
    concept: q.title,
    tier: "normal",
    monster: { name: q.name, icon: q.icon, hp: 40, color: "#ffb347", taunt: q.flavor, defeat: "El bribón huye aullando y deja caer unas monedas." },
    lore: `${q.giver} te encarga una tarea: ${q.flavor}`,
    rounds: [q.ch],
    lang: q.lang,
    quest: q,
    img: "/img/tavern.jpg",
  };
}

export default function Battle({ target, back }: { target: BattleRef; back: View }) {
  const { save } = useGame();
  const enc = useMemo(() => resolve(target), [target]);
  if (!enc || !save) return null;
  return <BattleInner key={enc.id} enc={enc} back={back} />;
}

const exLabel = (t: Challenge["tests"][number]) => {
  if (t.call) return `${t.call}  →  ${t.expect !== undefined ? fmt(t.expect) : ""}${t.out !== undefined ? ` salida «${t.out}»` : ""}`;
  if (t.input) return `Entrada: ${t.input.join(", ") || "—"}  →  Salida: ${t.out === "" ? "(nada)" : t.out}`;
  return `Salida: ${t.out}`;
};

function BattleInner({ enc, back }: { enc: Enc; back: View }) {
  const { save, getSave, update, go, modal } = useGame();
  const s = save!;
  const total = enc.rounds.length;
  const replayRef = useRef(enc.kind === "node" && !!s.cleared[enc.id]);
  const replay = replayRef.current;
  const startRound = enc.kind === "node" && !replay ? Math.min(s.prog[enc.id] ?? 0, total - 1) : 0;
  const dmgPer = Math.ceil(enc.monster.hp / total);

  const [round, setRound] = useState(startRound);
  const ch = enc.rounds[round];
  const lang = ch.lang ?? enc.lang;
  const [code, setCode] = useState(ch.starter);
  const [res, setRes] = useState<RunOutcome | null>(null);
  const [busy, setBusy] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [hintN, setHintN] = useState(0);
  const [solution, setSolution] = useState(false);
  const [phase, setPhase] = useState<"fight" | "victory" | "dead">(s.hp>0?"fight":"dead");
  const [paused, setPaused] = useState(false);
  const [monHp, setMonHp] = useState(Math.max(1, enc.monster.hp - startRound * dmgPer));
  const [anim, setAnim] = useState<"idle" | "hit" | "die" | "atk">("idle");
  const [say, setSay] = useState(ch.story);
  const [vic, setVic] = useState<VictoryData | null>(null);
  const [lost, setLost] = useState(0);
  const [msg, setMsg] = useState<{ kind: "ok" | "bad" | "warn"; text: string } | null>(null);
  const [armed, setArmed] = useState(false);

  const t0 = useRef(Date.now());
  const pausedAt = useRef(0);
  const pausedMs = useRef(0);
  const lastToggle = useRef(0);
  const alive = useRef(true);
  const used = useRef<Set<string>>(new Set(enc.kind === "node" && !replay ? [...(s.used[enc.id] ?? []), ...(s.codex[enc.id] ?? []).map((source,i)=>codeHash(source,enc.rounds[i]?.lang??enc.lang))] : []));
  const sess = useRef({ score: 0, xp: 0, gold: 0, rounds: 0, firstTries: 0, levels: 0 });
  const monRef = useRef<HTMLDivElement>(null);
  const edRef = useRef<HTMLDivElement>(null);
  const fbRef = useRef<HTMLDivElement>(null);
  const tutorial = enc.id === "d1n1" && !replay && !s.cleared["d1n1"];
  const isTouch = typeof window !== "undefined" && window.matchMedia?.("(pointer: coarse)").matches;

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  useEffect(() => {
    if (msg) fbRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [msg, res]);

  useEffect(() => {
    if (!isTouch && phase === "fight" && !paused) (document.querySelector(".code-ta") as HTMLTextAreaElement | null)?.focus();
  }, [round, phase, paused, isTouch]);

  const pause = useCallback((p: boolean) => {
    if (Date.now() - lastToggle.current < 200) return;
    lastToggle.current = Date.now();
    if (p) pausedAt.current = Date.now();
    else pausedMs.current += Date.now() - pausedAt.current;
    setPaused(p);
  }, []);

  const resetRound = useCallback(
    (r: number) => {
      setRound(r);
      setCode(enc.rounds[r].starter);
      setRes(null);
      setAttempts(0);
      setHintN(0);
      setSolution(false);
      setArmed(false);
      setMsg(null);
      setSay(enc.rounds[r].story);
      t0.current = Date.now();
      pausedMs.current = 0;
    },
    [enc.rounds],
  );

  const hudPos = () => centerOf(document.getElementById("hud-hp"));

  /* ───────── éxito ───────── */
  const onWin = (h: string) => {
    const s0 = getSave()!;
    const last = round === total - 1;
    const firstTry = attempts === 0 && !solution;
    const secs = (Date.now() - t0.current - pausedMs.current) / 1000;
    const streakNew = s0.streak + 1;
    const rw = roundReward(s0, { tier: enc.tier, firstTry, hints: hintN + (solution ? 5 : 0), secs, streak: streakNew, replay });
    const dealt = last ? monHp : Math.min(dmgPer, monHp - 1);
    const holder = { levels: 0 };
    update((d) => {
      if(enc.dungeon) d.activeCampaign=enc.dungeon.campaign;
      d.streak = streakNew;
      d.bestStreak = Math.max(d.bestStreak, streakNew);
      d.score += rw.score;
      d.gold += rw.gold;
      holder.levels = addXp(d, rw.xp);
      d.stats.rounds++;
      if (firstTry) d.stats.firstTry++;
      if (d.buff > 0) d.buff--;
      if (enc.kind === "node" && !replay) {
        d.codex[enc.id] = d.codex[enc.id] ?? [];
        d.codex[enc.id][round] = code;
        d.used[enc.id] = [...(d.used[enc.id] ?? []), h];
        if (!last) d.prog[enc.id] = round + 1;
      }
    });
    used.current.add(h);
    sess.current.score += rw.score;
    sess.current.xp += rw.xp;
    sess.current.gold += rw.gold;
    sess.current.rounds++;
    sess.current.levels += holder.levels;
    if (firstTry) sess.current.firstTries++;

    // juice
    const c = centerOf(monRef.current);
    const ti = TIER_IDX[enc.tier];
    setMonHp(Math.max(last ? 0 : 1, monHp - dealt));
    setAnim(last ? "die" : "hit");
    if (last) {
      sfx.kill();
      fx.boom(c.x, c.y, enc.monster.color);
      fx.shake(24, 600);
      fx.flash("rgba(255,240,200,.6)", 420);
    } else {
      sfx.crit();
      fx.slash(c.x, c.y, "#fff2c4", 110);
      fx.burst(c.x, c.y, enc.monster.color, 40);
      fx.ring(c.x, c.y, enc.monster.color, 140);
      fx.shake(10 + ti * 3, 380);
      fx.flash("rgba(255,255,255,.28)", 200);
      setTimeout(() => alive.current && setAnim("idle"), 450);
    }
    fx.text(c.x, c.y - 60, `-${dealt}`, "#ff8a5a", 54);
    setTimeout(() => fx.text(c.x, c.y - 125, `+${rw.score} ★`, "#ffe28a", 28), 260);
    if (streakNew >= 3) setTimeout(() => fx.text(c.x, c.y - 165, `¡RACHA ×${streakNew}!`, "#ff9a3c", 30), 520);
    if (holder.levels) {
      setTimeout(() => {
        sfx.level();
        fx.confetti(60);
        toast({ kind: "level", title: `¡Nivel ${getSave()?.level}!`, text: "Vida restaurada y oro de regalo", icon: "⬆" });
      }, 700);
    }
    sfx.coin();
    setMsg({ kind: "ok", text: `¡Hechizo certero! ${rw.parts.join(" · ")}` });
    setSay(last ? enc.monster.defeat : "¡Aaargh! ¡Eso dolió!");

    if (!last) {
      setTimeout(() => {
        if (!alive.current) return;
        resetRound(round + 1);
        setBusy(false);
        sfx.hint();
        fx.text(window.innerWidth / 2, window.innerHeight * 0.3, "¡SIGUIENTE HECHIZO!", "#ffd27a", 30);
      }, 1100);
    } else {
      finishEncounter();
    }
  };

  const finishEncounter = () => {
    const s1 = getSave()!;
    const cr = clearReward(s1, enc.tier, replay);
    const out: { loot: Loot | null; sig?: Item; levels: number; heal: number; qb?: { gold: number; item?: Item }; campaignEnd?: 1 | 2 | 3 | 4 } = { loot: null, levels: 0, heal: 0 };
    update((d) => {
      out.levels += addXp(d, cr.xp);
      d.gold += cr.gold;
      if (enc.kind === "node" && !replay) {
        d.cleared[enc.id] = { score: sess.current.score, firstTry: sess.current.firstTries === total };
        delete d.prog[enc.id];
        d.stats.monsters++;
        out.loot = rollLoot(enc.tier, d.items);
        if (out.loot?.item) giveItem(d, out.loot.item.id);
        else if (out.loot?.dupGold) d.gold += out.loot.dupGold;
        if (enc.tier === "boss" && enc.dungeon) {
          const sig = ITEM_BY_ID[enc.dungeon.sigItem];
          if (sig && giveItem(d, sig.id)) out.sig = sig;
          d.gold += 100 + 25 * enc.dungeon.n;
          if (enc.dungeon.id === lastChapter(enc.dungeon.campaign).id) out.campaignEnd = enc.dungeon.campaign;
        }
      }
      if (enc.kind === "quest" && enc.quest) {
        const q = enc.quest;
        if (d.quests.done.indexOf(q.id) < 0) d.quests.done.push(q.id);
        d.stats.questsDone++;
        d.gold += q.gold;
        out.levels += addXp(d, q.xp);
        sess.current.gold += q.gold;
        sess.current.xp += q.xp;
        const l = rollLoot("normal", d.items);
        if (l?.item) {
          giveItem(d, l.item.id);
          out.loot = l;
        }
        if (d.quests.done.length >= 6) {
          const bl = rollLoot("elite", d.items);
          if (bl?.item) giveItem(d, bl.item.id);
          d.gold += 100;
          out.qb = { gold: 100, item: bl?.item };
        }
      }
      out.heal = Math.min(maxHp(d)-d.hp,healOnWin(d));
      d.hp += out.heal;
    });
    const ce = out.campaignEnd;
    setVic({
      monster: enc.monster,
      score: sess.current.score,
      xp: sess.current.xp + cr.xp,
      gold: sess.current.gold + cr.gold,
      levels: sess.current.levels + out.levels,
      loot: out.loot,
      sig: out.sig,
      dungeon: enc.tier === "boss" ? enc.dungeon : undefined,
      heal: out.heal,
      rounds: sess.current.rounds,
      firstTries: sess.current.firstTries,
      replay,
      quest: enc.kind === "quest",
      questBonus: out.qb,
      campaignEnd: ce,
      campaignText: ce ? CAMPAIGN_END[ce].text : undefined,
    });
    setTimeout(()=>alive.current && setPhase("victory"), 950);
  };

  /* ───────── lanzar hechizo ───────── */
  const cast = async () => {
    if (busy || phase !== "fight" || paused) return;
    setBusy(true);
    sfx.click();
    const h = codeHash(code, lang);
    if (used.current.has(h)) {
      sfx.fizzle();
      setMsg({ kind: "warn", text: "Ese conjuro ya fue lanzado contra este monstruo. ¡Cada hechizo solo hiere una vez! Escribe uno nuevo." });
      setBusy(false);
      return;
    }
    const r = await runChallenge(lang, code, ch, getSave()?.name ?? "Escriba");
    if (!alive.current) return;
    setRes(r);
    if (r.status === "ok") {
      onWin(h);
      return;
    }
    const e = centerOf(edRef.current);
    if (r.status === "wrong") {
      const s0 = getSave()!;
      const dmg = damageTaken(s0, enc.tier);
      const holder = { died: false, loss: 0 };
      update((d) => {
        d.hp = Math.max(0, d.hp - dmg);
        d.streak = 0;
        d.stats.fails++;
        if (d.hp === 0) {
          holder.died = true;
          d.stats.deaths++;
          holder.loss = Math.floor(d.gold * 0.1);
          d.gold -= holder.loss;
        }
      });
      setAttempts((a) => a + 1);
      setAnim("atk");
      setTimeout(() => alive.current && setAnim("idle"), 420);
      sfx.fail();
      fx.shake(9 + TIER_IDX[enc.tier] * 2, 340);
      fx.flash("rgba(190,20,20,.4)", 300);
      const hp = hudPos();
      fx.burst(hp.x, hp.y, "#ff4a4a", 16, 200, 300);
      fx.text(hp.x, hp.y + 40, `-${dmg}`, "#ff5a5a", 34);
      setSay(enc.monster.taunt);
      setMsg({ kind: "bad", text: `El hechizo falla y ${enc.monster.name} contraataca: -${dmg} de vida. Revisa los resultados.` });
      if (holder.died) {
        setLost(holder.loss);
        setPhase("dead");
      }
    } else {
      sfx.fizzle();
      fx.burst(e.x, e.y, "#9aa0a6", 16, 180, 260);
      fx.shake(4, 220);
      setMsg({ kind: "warn", text: r.message ?? (r.status === "syntax" ? "Error de sintaxis" : "El hechizo chisporrotea") + " — sin daño para ti: corrige y vuelve a lanzar." });
    }
    setBusy(false);
  };

  const useHint = () => {
    if (phase !== "fight" || paused) return;
    if (hintN >= ch.hints.length) {
      toast({ kind: "info", title: "Sin más pistas", text: "Ya revelaste todas las pistas de este hechizo.", icon: "📜" });
      return;
    }
    if ((getSave()?.scrolls ?? 0) <= 0) {
      sfx.fail();
      toast({ kind: "warn", title: "Sin pergaminos", text: "Compra más en la taberna o gana uno con el cofre diario.", icon: "📜" });
      return;
    }
    sfx.hint();
    update((d) => {
      d.scrolls--;
      d.stats.hints++;
    });
    setHintN((n) => n + 1);
  };

  const drink = () => {
    if (phase !== "fight" || paused) return;
    const s0 = getSave()!;
    if (s0.potions <= 0) {
      sfx.fail();
      toast({ kind: "warn", title: "Sin pociones", text: "Compra en la taberna.", icon: "🧪" });
      return;
    }
    if (s0.hp >= maxHp(s0)) {
      toast({ kind: "info", title: "Vida completa", icon: "❤" });
      return;
    }
    sfx.potion();
    update((d) => {
      d.potions--;
      d.hp = Math.min(maxHp(d), d.hp + Math.round(maxHp(d) * 0.5));
    });
    const p = hudPos();
    fx.burst(p.x, p.y, "#7affc8", 26, 220, -80);
    fx.text(p.x, p.y + 40, "+vida", "#7affc8", 28);
  };

  const revive = () => {
    update((d) => void (d.hp = Math.round(maxHp(d) * 0.6)));
    sfx.potion();
    setPhase("fight");
    setBusy(false);
    resetRound(round);
  };

  const leave = () => go(back);

  const nxt = enc.kind === "node" && enc.dungeon && getSave() ? nextNode(getSave()!,enc.dungeon.campaign) : null;
  const sameDungeonNext = nxt && enc.dungeon && nxt.d.id === enc.dungeon.id ? nxt : null;
  const onContinue = () => {
    sfx.click();
    if (vic && !vic.replay && sameDungeonNext) go({ name: "battle", ref: { kind: "node", id: sameDungeonNext.node.id }, back });
    else go(back);
  };

  /* teclado global del combate */
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (modal) return;
      if (e.key === "Escape" && phase === "fight" && !paused && !e.repeat) {
        e.preventDefault();
        pause(true);
      } else if (e.altKey && e.key === "1") {
        e.preventDefault();
        useHint();
      } else if (e.altKey && e.key === "2") {
        e.preventDefault();
        drink();
      }
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  });

  const showSolution = solution ? ch.solution.split("{{name}}").join(s.name) : "";
  const examples = ch.tests.filter((t) => !t.hidden).slice(0, 3);
  const mh = maxHp(s);

  return (
    <div className="screen battle">
      <section className="stage" style={{ backgroundImage: `url(${enc.img})` }}>
        <div className="stage-shade" />
        <div className="stage-top">
          <button className="btn btn-ghost btn-sm" onClick={() => (sfx.click(), pause(true))} aria-label="Pausa">
            ⏸ <span className="hide-sm">Pausa</span>
          </button>
          <div className="stage-title">
            <small>{enc.kind === "quest" ? "Encargo de la taberna" : enc.dungeon?.name}</small>
            <b className="font-display">{ch.title ?? enc.concept}</b>
          </div>
          <div className="pips" title="Turnos del combate">
            {enc.rounds.map((_, i) => (
              <i key={i} className={i < round || (phase === "victory" && i <= round) ? "done" : i === round ? "cur" : ""} />
            ))}
          </div>
        </div>

        <div className="mon-plate" style={{ ["--mc" as string]: enc.monster.color }}>
          <div className="mon-name">
            <span className={`tier tier-${enc.tier}`}>{TIER_LABEL[enc.tier]}</span>
            <b className="font-display">{enc.monster.name}</b>
          </div>
          <Bar kind="mon" value={phase === "victory" ? 0 : monHp} max={enc.monster.hp} ticks={total} label={`${phase === "victory" ? 0 : monHp} / ${enc.monster.hp}`} />
          {total > 1 && (
            <small className="turns">
              Turno {Math.min(round + 1, total)} de {total}
            </small>
          )}
        </div>

        <div className="mon-wrap" ref={monRef} style={{ ["--mc" as string]: enc.monster.color }}>
          <div className={`sigil tier-${enc.tier}`} />
          <div className={`mon-emoji tier-${enc.tier} ${anim}`}>{enc.monster.icon}</div>
          <div className="mon-shadow" />
        </div>

        <div className="speech">
          {round === startRound && enc.lore && <small className="lore">{enc.lore}</small>}
          <p>
            <Typewriter key={say} text={say} speed={14} />
          </p>
        </div>
      </section>

      <section className="work">
        <div className="work-head">
          <span className={`chip ${LANG_CLASS[lang]}`}>
            {LANG_ICON[lang]} {LANG_LABEL[lang]}
          </span>
          <h2 className="font-display">
            <small>Problema:</small> {ch.title ?? enc.concept}
          </h2>
          {total > 1 && (
            <span className="round-tag">
              Hechizo {round + 1}/{total}
            </span>
          )}
        </div>
        {total > 1 && <p className="muted small">Cada hechizo hiere una sola vez: no puedes repetir uno ya lanzado.</p>}
        {tutorial && round === 0 && <div className="tutorial">✍ Escribe el hechizo a mano en el editor y pulsa <b>Lanzar</b> (o <kbd>Ctrl</kbd>+<kbd>Enter</kbd>)</div>}

        <div className="panel prompt">
          <Rich text={ch.prompt} />
          {lang === "mongo" && <MongoLab expected={ch.tests[0].expect} write={ch.tests[0].afterWrite} />}
          {lang !== "mongo" && examples.length > 0 && (
            <div className="examples">
              <b>Ejemplos</b>
              {examples.map((t, i) => (
                <code key={i}>{exLabel(t)}</code>
              ))}
            </div>
          )}
        </div>

        <div ref={edRef}>
          <Editor value={code} onChange={setCode} lang={lang} disabled={busy || phase !== "fight" || paused} onRun={cast} onPasteBlocked={() => (sfx.fizzle(), toast({ kind: "warn", title: "El grimorio rechaza lo copiado", text: "Escribe a mano: así es como se aprende.", icon: "✋" }))} />
        </div>

        <div ref={fbRef} className="fb">
          {msg && <div className={`msg msg-${msg.kind}`}>{msg.text}</div>}
        </div>

        {res && res.outcomes.length > 0 && (
          <div className="results">
            <b>
              Pruebas: {res.passed}/{res.total}
            </b>
            {res.outcomes.map((o, i) => (
              <div key={i} className={`res ${o.pass ? "ok" : "bad"}`}>
                <span>{o.pass ? "✔" : "✖"}</span>
                <div>
                  <code>{o.hidden ? "Prueba oculta" : o.label}</code>
                  {!o.pass && !o.hidden && <small>{o.err ? `Error: ${o.err}` : `Obtuviste ${o.got} · esperado ${o.want}`}</small>}
                  {!o.pass && o.hidden && <small>{o.err ? `Error: ${o.err}` : "Tu hechizo falla en un caso que no ves: piensa en los límites."}</small>}
                </div>
              </div>
            ))}
          </div>
        )}

        {hintN > 0 && (
          <div className="hints">
            {ch.hints.slice(0, hintN).map((h, i) => (
              <p key={i}>
                📜 <b>Pista {i + 1}:</b> {h}
              </p>
            ))}
          </div>
        )}

        {attempts >= 3 && !solution && (
          <button
            className="btn btn-ghost btn-sm crow"
            onClick={() => {
              if (!armed) {
                setArmed(true);
                return;
              }
              sfx.hint();
              setSolution(true);
              update((d) => void (d.streak = 0));
            }}
          >
            {armed ? "¿Seguro? Pierdes la racha y los bonus. Pulsa de nuevo" : "🐦‍⬛ Susurro del Cuervo: ver la solución"}
          </button>
        )}
        {solution && (
          <div className="panel solution">
            <b>🐦‍⬛ Corvo susurra una solución:</b>
            <pre className="codeblock">{showSolution}</pre>
            <small>Entiéndela y escríbela tú a mano: el editor no permite pegar. Sin bonus de pista ni racha.</small>
          </div>
        )}

        <div className="actions">
          <button className="btn btn-lg cast" onClick={cast} disabled={busy || phase !== "fight" || paused}>
            {busy ? "Lanzando…" : "⚔ Lanzar hechizo"} <small className="hide-sm">Ctrl+Enter</small>
          </button>
          <button className="btn btn-ghost" onClick={useHint} disabled={phase !== "fight"} title="Alt+1">
            📜 Pista <small>({s.scrolls})</small>
          </button>
          <button className="btn btn-ghost" onClick={drink} disabled={phase !== "fight" || s.hp >= mh} title="Alt+2">
            🧪 <small>({s.potions})</small>
          </button>
        </div>
      </section>

      {paused && phase === "fight" && (
        <Pause
          onResume={() => pause(false)}
          onRestart={() => {
            pause(false);
            resetRound(round);
          }}
          onLeave={leave}
        />
      )}
      {phase === "dead" && <Defeat lost={lost} onRetry={revive} onLeave={leave} />}
      {phase === "victory" && vic && <Victory v={vic} onContinue={onContinue} onMap={leave} nextLabel={!vic.replay && sameDungeonNext ? "Siguiente combate ▸" : undefined} />}
    </div>
  );
}
