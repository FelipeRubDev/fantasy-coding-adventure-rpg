import { db } from "@/db";
import { tavernBoards } from "@/db/schema";
import { eq, lt } from "drizzle-orm";
import { QUESTS } from "@/data/quests";

export const dynamic = "force-dynamic";

const HALF_DAY = 12 * 60 * 60 * 1000;

function rng(seed: number) {
  let a = (seed * 2654435761) >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(arr: T[], r: () => number) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Tablero determinista: 2 encargos por lenguaje, sin repetir los del tablero anterior. */
function boardFor(slot: number): string[] {
  const langs = ["pseudo", "js", "java"] as const;
  const prev = slot > 0 ? rawBoard(slot - 1, []) : [];
  return rawBoard(slot, prev);
}

function rawBoard(slot: number, exclude: string[]): string[] {
  const r = rng(slot + 17);
  const out: string[] = [];
  for (const lang of ["pseudo", "js", "java"] as const) {
    const pool = QUESTS.filter((q) => q.lang === lang).map((q) => q.id);
    let cand = pool.filter((id) => !exclude.includes(id));
    if (cand.length < 2) cand = pool;
    out.push(...shuffle(cand, r).slice(0, 2));
  }
  return out;
}

export async function GET() {
  const now = Date.now();
  const slot = Math.floor(now / HALF_DAY);
  let questIds = boardFor(slot);
  try {
    const rows = await db.select().from(tavernBoards).where(eq(tavernBoards.slot, slot)).limit(1);
    if (rows[0]) {
      questIds = rows[0].questIds as string[];
    } else {
      await db.insert(tavernBoards).values({ slot, questIds }).onConflictDoNothing();
      await db.delete(tavernBoards).where(lt(tavernBoards.slot, slot - 6));
    }
  } catch {
    /* si la base falla, el tablero determinista sigue funcionando */
  }
  return Response.json({ slot, questIds, now, nextAt: (slot + 1) * HALF_DAY });
}
