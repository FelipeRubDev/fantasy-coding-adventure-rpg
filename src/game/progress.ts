import { DUNGEONS } from "@/data/dungeons";
import type { CampaignId, Dungeon, Lang, MapNode, Save } from "@/lib/types";

export function bossId(d: Dungeon) {
  return d.nodes[d.nodes.length - 1].id;
}

export function dungeonUnlocked(s: Save, d: Dungeon): boolean {
  const i = DUNGEONS.indexOf(d);
  return i === 0 || d.id === "tri1" || d.id === "arc1" || !!s.cleared[bossId(DUNGEONS[i - 1])];
}

export function nodeAvailable(s: Save, d: Dungeon, idx: number): boolean {
  return dungeonUnlocked(s, d) && (idx === 0 || !!s.cleared[d.nodes[idx - 1].id]);
}

export function dungeonProgress(s: Save, d: Dungeon): number {
  return d.nodes.filter((n) => s.cleared[n.id]).length;
}

export function nextNode(s: Save, campaign?:CampaignId): { d: Dungeon; node: MapNode; idx: number } | null {
  for (const d of DUNGEONS) {
    if (campaign ? d.campaign !== campaign : d.campaign === 4) continue;
    for (let i = 0; i < d.nodes.length; i++) {
      if (!s.cleared[d.nodes[i].id] && nodeAvailable(s, d, i)) return { d, node: d.nodes[i], idx: i };
    }
  }
  return null;
}

export function langUnlocked(s: Save, lang: Lang): boolean {
  if (lang === "pseudo") return true;
  const first = DUNGEONS.find((d) => d.lang === lang)!;
  return dungeonUnlocked(s, first);
}

export function dungeonsCleared(s: Save): number {
  return DUNGEONS.filter((d) => s.cleared[bossId(d)]).length;
}
