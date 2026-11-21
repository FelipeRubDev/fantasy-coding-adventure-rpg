import { TIER_DMG, TIER_MULT } from "@/data/dungeons";
import { ITEMS, ITEM_BY_ID, SIG_ITEMS } from "@/data/items";
import type { Item, ItemFx, Rarity, Save, Tier } from "@/lib/types";

export const xpNeeded = (lvl: number) => 90 + lvl * 40;

export function fxSum(s: Save): Required<ItemFx> {
  const t: Required<ItemFx> = { score: 0, xp: 0, gold: 0, guard: 0, hp: 0, heal: 0 };
  for (const id of Object.values(s.equip)) {
    const it = id ? ITEM_BY_ID[id] : undefined;
    if (!it) continue;
    t.score += it.fx.score ?? 0;
    t.xp += it.fx.xp ?? 0;
    t.gold += it.fx.gold ?? 0;
    t.guard += it.fx.guard ?? 0;
    t.hp += it.fx.hp ?? 0;
    t.heal += it.fx.heal ?? 0;
  }
  return t;
}

export const maxHp = (s: Save) => 100 + (s.level - 1) * 8 + fxSum(s).hp;

const RANKS: [number, string][] = [
  [1, "Tintero Vacío"],
  [3, "Aprendiz de Tinta"],
  [5, "Escriba de Ceniza"],
  [8, "Pluma Ardiente"],
  [11, "Maestro del Códice"],
  [15, "Archiescriba"],
  [20, "Voz del Silencio"],
];
export const rankOf = (lvl: number) => RANKS.filter((r) => lvl >= r[0]).pop()![1];

/** Suma XP y sube niveles. Devuelve cuántos niveles subió. */
export function addXp(s: Save, amount: number): number {
  s.xp += amount;
  let gained = 0;
  while (s.xp >= xpNeeded(s.level)) {
    s.xp -= xpNeeded(s.level);
    s.level++;
    gained++;
    s.gold += 10 * s.level;
  }
  if (gained) s.hp = maxHp(s);
  return gained;
}

export interface RoundCtx {
  tier: Tier;
  firstTry: boolean;
  hints: number;
  secs: number;
  streak: number;
  replay: boolean;
}

export function roundReward(s: Save, c: RoundCtx) {
  const m = TIER_MULT[c.tier];
  const fx = fxSum(s);
  const buff = s.buff > 0 ? 1.5 : 1;
  let bonus = 0;
  const parts: string[] = [];
  if (c.firstTry) {
    bonus += 0.5;
    parts.push("A la primera +50%");
  }
  if (c.hints === 0) {
    bonus += 0.2;
    parts.push("Sin pistas +20%");
  }
  if (c.secs < 45) {
    bonus += 0.3;
    parts.push("Relámpago +30%");
  } else if (c.secs < 90) {
    bonus += 0.15;
    parts.push("Veloz +15%");
  }
  const combo = 1 + Math.min(c.streak, 10) * 0.1;
  if (c.streak >= 2) parts.push(`Racha ×${combo.toFixed(1)}`);
  if (buff > 1) parts.push("Hidromiel ×1.5");
  let score = 100 * m * (1 + bonus) * combo * (1 + fx.score / 100) * buff;
  let xp = 20 * m * (c.firstTry ? 1.25 : 1) * (1 + fx.xp / 100) * buff;
  let gold = (6 * m + (c.firstTry ? 2 : 0)) * (1 + fx.gold / 100);
  if (c.replay) {
    score *= 0.5;
    xp *= 0.25;
    gold *= 0.25;
    parts.push("Repetición (×¼ XP/oro)");
  }
  return { score: Math.round(score), xp: Math.round(xp), gold: Math.round(gold), parts };
}

export function clearReward(s: Save, tier: Tier, replay: boolean) {
  const m = TIER_MULT[tier];
  const fx = fxSum(s);
  const k = replay ? 0.25 : 1;
  return { xp: Math.round(40 * m * (1 + fx.xp / 100) * k), gold: Math.round(20 * m * (1 + fx.gold / 100) * k) };
}

export function damageTaken(s: Save, tier: Tier): number {
  return Math.max(2, Math.round(TIER_DMG[tier] * (1 - Math.min(0.6, fxSum(s).guard / 100)) * (0.9 + Math.random() * 0.2)));
}

export function healOnWin(s: Save): number {
  return Math.round(maxHp(s) * (0.35 + fxSum(s).heal / 100));
}

const LOOT: Record<Tier, { chance: number; w: [Rarity, number][] }> = {
  normal: { chance: 0.3, w: [["comun", 70], ["poco", 30]] },
  elite: { chance: 0.65, w: [["comun", 20], ["poco", 50], ["raro", 30]] },
  miniboss: { chance: 1, w: [["poco", 20], ["raro", 60], ["epico", 20]] },
  boss: { chance: 1, w: [["raro", 30], ["epico", 70]] },
};
const DUP_GOLD: Record<Rarity, number> = { comun: 15, poco: 30, raro: 60, epico: 120, legendario: 250 };

export interface Loot {
  item?: Item;
  dupGold?: number;
}

export function rollLoot(tier: Tier, owned: string[]): Loot | null {
  const t = LOOT[tier];
  if (Math.random() > t.chance) return null;
  const total = t.w.reduce((a, b) => a + b[1], 0);
  let x = Math.random() * total;
  let rarity: Rarity = t.w[0][0];
  for (const [r, w] of t.w) {
    if ((x -= w) <= 0) {
      rarity = r;
      break;
    }
  }
  const cands = ITEMS.filter((i) => i.rarity === rarity && !SIG_ITEMS.has(i.id));
  const fresh = cands.filter((i) => !owned.includes(i.id));
  if (fresh.length) return { item: fresh[Math.floor(Math.random() * fresh.length)] };
  return { dupGold: DUP_GOLD[rarity] };
}

export function giveItem(s: Save, id: string): boolean {
  if (s.items.includes(id)) return false;
  s.items.push(id);
  const it = ITEM_BY_ID[id];
  if (it && !s.equip[it.slot]) s.equip[it.slot] = id;
  return true;
}

export const newSave = (name: string): Save => ({
  v: 1,
  name,
  xp: 0,
  level: 1,
  gold: 20,
  hp: 100,
  score: 0,
  potions: 1,
  scrolls: 3,
  buff: 0,
  cleared: {},
  prog: {},
  used: {},
  codex: {},
  items: [],
  equip: {},
  ach: [],
  streak: 0,
  bestStreak: 0,
  quests: { slot: 0, done: [] },
  quiz: { games: 0, correct: 0, best: 0, perfect: 0 },
  stats: { rounds: 0, monsters: 0, firstTry: 0, hints: 0, deaths: 0, questsDone: 0, fails: 0 },
  daily: { day: "", streak: 0 },
  introSeen: false,
  sfx: true,
  music: false,
});
