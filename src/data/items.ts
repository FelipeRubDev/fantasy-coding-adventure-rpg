import type { Item, ItemFx, Rarity, Slot } from "@/lib/types";

import { TRINITY, ARCHIVE } from "./expansion-chapters";

const I = (id: string, name: string, icon: string, slot: Slot, rarity: Rarity, fx: ItemFx, desc: string): Item => ({ id, name, icon, slot, rarity, fx, desc });

export const ITEMS: Item[] = [
  // Plumas
  I("pluma_gris", "Pluma de Cuervo Gris", "🪶", "pluma", "comun", { score: 5 }, "Una pluma sencilla. Escribe sin quejarse."),
  I("pluma_hueso", "Pluma de Hueso Tallado", "🦴", "pluma", "poco", { score: 10 }, "Tallada por un esqueleto aburrido."),
  I("pluma_runica", "Pluma Rúnica", "✒️", "pluma", "raro", { score: 15, xp: 5 }, "Las runas brillan cuando aciertas."),
  I("pluma_sangre", "Pluma de Sangre", "🩸", "pluma", "epico", { score: 25, gold: 5 }, "Escribe con tinta que recuerda cada batalla."),
  I("pluma_ceniza", "Pluma de Ceniza Viva", "🔥", "pluma", "epico", { score: 20, xp: 10 }, "Botín de Vael. Arde sin consumirse."),
  I("martillo_ferrum", "Martillo-Pluma de Gorrim", "🔨", "pluma", "epico", { score: 25, guard: 5 }, "Forja cada línea con un golpe seco."),
  I("pluma_primigenia", "Pluma Primigenia", "🕊️", "pluma", "legendario", { score: 35, xp: 15, gold: 10 }, "La pluma blanca de Maelith. Escribió el primer nombre."),
  // Armaduras
  I("tunica_lino", "Túnica de Lino", "👘", "armadura", "comun", { guard: 3, hp: 10 }, "Ligera y remendada."),
  I("escudo_bronce", "Escudo de Bronce", "🛡️", "armadura", "comun", { guard: 5 }, "Abollado, pero fiable."),
  I("capa_viajero", "Capa de Viajero", "🧥", "armadura", "poco", { guard: 6, hp: 15 }, "Huele a caminos y a lluvia."),
  I("cota_ferrum", "Cota de Malla de Ferrum", "⛓️", "armadura", "raro", { guard: 10, hp: 25 }, "Hierro negro, remachado a mano."),
  I("escamas_dragon", "Escamas de Dragón", "🐉", "armadura", "epico", { guard: 15, hp: 30 }, "Aún tibias."),
  I("hoja_eterna", "Manto de Hojas Eternas", "🍃", "armadura", "epico", { guard: 12, hp: 30, heal: 10 }, "Botín de Hiedra Madre. Se regenera sola."),
  // Reliquias
  I("amuleto_cobre", "Amuleto de Cobre", "🪙", "reliquia", "comun", { gold: 5 }, "Atrae monedas sueltas."),
  I("pluma_cuervo", "Pluma del Cuervo Cojo", "🐦‍⬛", "reliquia", "poco", { heal: 5, xp: 3 }, "Corvo la dejó caer a propósito. Eso dice."),
  I("talisman_luna", "Talismán de Luna", "🌙", "reliquia", "poco", { xp: 8 }, "Brilla cuando aprendes algo."),
  I("runa_fortuna", "Runa de la Fortuna", "🎲", "reliquia", "raro", { gold: 15, xp: 5 }, "Un dado de piedra que siempre cae a tu favor."),
  I("ojo_vigia", "Ojo del Vigía", "👁️", "reliquia", "epico", { heal: 15, xp: 12 }, "No parpadea. Nunca."),
  I("anillo_brasa", "Anillo de Brasa Viva", "💍", "reliquia", "epico", { xp: 15, score: 10 }, "Botín de Pyrrhus. Late como un corazón."),
  I("lente_abismal", "Lente del Abismo", "🔮", "reliquia", "epico", { xp: 20, gold: 10 }, "Ve las respuestas escondidas entre líneas."),
  I("corona_silencio", "Corona del Silencio Roto", "👑", "reliquia", "legendario", { xp: 25, gold: 20, score: 20, heal: 20 }, "La corona del vacío, ahora llena de voces."),
];

for(const [kind,chapters] of [["tri",TRINITY],["arc",ARCHIVE]] as const) chapters.forEach((c,i)=>{
  ITEMS.push(I("tesoro_"+kind+(i+1),c.relic,kind==="tri"?"🔮":"🍃","reliquia",i===4?"legendario":"epico",{xp:12+i*2,gold:8+i,score:10+i*3},"Tesoro de "+c.boss+". Un recuerdo de «"+c.name+"»."));
});
export const ITEM_BY_ID: Record<string, Item> = Object.fromEntries(ITEMS.map((i) => [i.id, i]));

export const RARITY = {
  comun: { label: "Común", color: "#a8a39a", weight: 0 },
  poco: { label: "Poco común", color: "#6fcf7a", weight: 1 },
  raro: { label: "Raro", color: "#5aa9ff", weight: 2 },
  epico: { label: "Épico", color: "#b86bff", weight: 3 },
  legendario: { label: "Legendario", color: "#ffb02e", weight: 4 },
} as const;

export const SLOT_LABEL = { pluma: "Pluma", armadura: "Armadura", reliquia: "Reliquia" } as const;
export const SIG_ITEMS = new Set([...ITEMS.filter(x=>x.id.startsWith("tesoro_")).map(x=>x.id),"pluma_ceniza", "hoja_eterna", "anillo_brasa", "pluma_primigenia", "martillo_ferrum", "lente_abismal", "corona_silencio"]);

export function fxText(fx: ItemFx): string {
  const p: string[] = [];
  if (fx.score) p.push(`+${fx.score}% puntos`);
  if (fx.xp) p.push(`+${fx.xp}% XP`);
  if (fx.gold) p.push(`+${fx.gold}% oro`);
  if (fx.guard) p.push(`-${fx.guard}% daño recibido`);
  if (fx.hp) p.push(`+${fx.hp} vida máx.`);
  if (fx.heal) p.push(`+${fx.heal}% curación al ganar`);
  return p.join(" · ");
}
