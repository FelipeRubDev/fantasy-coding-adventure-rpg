import type { Save } from "@/lib/types";
import { DUNGEONS, lastChapter } from "./dungeons";
import { ITEM_BY_ID } from "./items";

export interface Ach {
  id: string;
  name: string;
  icon: string;
  desc: string;
  gold: number;
  test: (s: Save) => boolean;
}

const dungeonAchs: Ach[] = DUNGEONS.map((d) => ({
  id: `clear_${d.id}`,
  name: `Conquistador: ${d.name.replace(/^(El|La|Las|Los) /, "")}`,
  icon: "🏰",
  desc: `Derrota al jefe de «${d.name}».`,
  gold: 60 + d.n * 15,
  test: (s: Save) => !!s.cleared[d.nodes[d.nodes.length - 1].id],
}));

export const ACHS: Ach[] = [
  { id: "first_blood", name: "Primera Sangre", icon: "🗡️", desc: "Lanza tu primer hechizo con éxito.", gold: 15, test: (s) => s.stats.rounds >= 1 },
  { id: "combo5", name: "Racha de Fuego", icon: "🔥", desc: "Logra una racha de 5 hechizos sin fallar.", gold: 40, test: (s) => s.bestStreak >= 5 },
  { id: "combo10", name: "Imparable", icon: "⚡", desc: "Logra una racha de 10 hechizos sin fallar.", gold: 100, test: (s) => s.bestStreak >= 10 },
  { id: "firsttry10", name: "Pulso de Acero", icon: "🎯", desc: "Acierta 10 hechizos a la primera.", gold: 50, test: (s) => s.stats.firstTry >= 10 },
  { id: "rounds50", name: "Mano Incansable", icon: "✍️", desc: "Lanza 50 hechizos con éxito.", gold: 120, test: (s) => s.stats.rounds >= 50 },
  { id: "lvl5", name: "Aprendiz Curtido", icon: "⭐", desc: "Alcanza el nivel 5.", gold: 40, test: (s) => s.level >= 5 },
  { id: "lvl10", name: "Escriba Veterano", icon: "🌟", desc: "Alcanza el nivel 10.", gold: 120, test: (s) => s.level >= 10 },
  ...dungeonAchs,
  {id:"tri",name:"Las tres voces",icon:"🔮",desc:"Completa todos los sellos de la Convergencia.",gold:250,test:s=>{const nodes=lastChapter(3).nodes;return !!s.cleared[nodes[nodes.length-1].id];}},
  {id:"archive",name:"Guardián del Archivo",icon:"🍃",desc:"Restaura todos los folios del Archivo Esmeralda.",gold:250,test:s=>{const nodes=lastChapter(4).nodes;return !!s.cleared[nodes[nodes.length-1].id];}},
  {id:"quiz-perfect",name:"Memoria de cuervo",icon:"🪶",desc:"Acierta las cinco cartas en un duelo de ingenio.",gold:35,test:s=>(s.quiz?.perfect??0)>0},
  { id: "camp1", name: "Cenizas Reescritas", icon: "📜", desc: "Completa la Campaña I.", gold: 250, test: (s) => !!s.cleared["d4n5"] },
  { id: "camp2", name: "Voz del Silencio", icon: "👑", desc: "Completa la Campaña II.", gold: 500, test: (s) => !!s.cleared["d7n5"] },
  { id: "rich", name: "Dragón de Oro", icon: "💰", desc: "Reúne 500 monedas de oro.", gold: 50, test: (s) => s.gold >= 500 },
  { id: "quest1", name: "Mercenario", icon: "📌", desc: "Completa un encargo de la taberna.", gold: 25, test: (s) => s.stats.questsDone >= 1 },
  { id: "quest10", name: "Cazarrecompensas", icon: "🏹", desc: "Completa 10 encargos de la taberna.", gold: 150, test: (s) => s.stats.questsDone >= 10 },
  { id: "death1", name: "Primera Caída", icon: "💀", desc: "Cae en combate. Todos aprendemos así.", gold: 10, test: (s) => s.stats.deaths >= 1 },
  { id: "legend", name: "Leyenda Viva", icon: "🏆", desc: "Obtén un objeto legendario.", gold: 100, test: (s) => s.items.some((i) => ITEM_BY_ID[i]?.rarity === "legendario") },
  { id: "collector", name: "Coleccionista", icon: "🎒", desc: "Reúne 10 objetos.", gold: 80, test: (s) => s.items.length >= 10 },
];

export const ACH_BY_ID: Record<string, Ach> = Object.fromEntries(ACHS.map((a) => [a.id, a]));
