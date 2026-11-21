import type { Challenge, MapNode, Monster, Req, TestCase, Tier } from "@/lib/types";

export const r = String.raw;

/** prueba de función: evalúa `c` y compara con `expect` */
export const T = (c: string, expect: unknown, hidden = false): TestCase => ({ call: c, expect, hidden });
/** prueba de programa con entradas (Leer) y salida esperada */
export const IO = (input: (string | number)[], out: string, hidden = false): TestCase => ({ input, out, hidden });
/** prueba de programa sin entradas */
export const OUT = (out: string): TestCase => ({ out });

export const need = (re: string, msg: string, flags = "i"): Req => ({ re, msg, flags });
export const avoid = (re: string, msg: string, flags = "i"): Req => ({ re, msg, flags, not: true });

export function ch(story: string, prompt: string, starter: string, solution: string, tests: TestCase[], hints: string[], must?: Req[]): Challenge {
  return { story, prompt, starter, solution, tests, hints, must };
}

export function mon(name: string, icon: string, hp: number, color: string, taunt: string, defeat: string): Monster {
  return { name, icon, hp, color, taunt, defeat };
}

export function node(id: string, concept: string, tier: Tier, monster: Monster, lore: string, rounds: Challenge[]): MapNode {
  return { id, concept, tier, monster, lore, rounds };
}
