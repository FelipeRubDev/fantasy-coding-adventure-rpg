import type { CampaignId, Dungeon, Lang, MapNode } from "@/lib/types";
import { D1 } from "./d1";
import { D2 } from "./d2";
import { D3 } from "./d3";
import { D4 } from "./d4";
import { D5 } from "./d5";
import { D6 } from "./d6";
import { D7 } from "./d7";
import { CONVERGENCE } from "./convergence";
import { EMERALD } from "./emerald";

export const DUNGEONS: Dungeon[] = [D1,D2,D3,D4,D5,D6,D7,...CONVERGENCE,...EMERALD];
export const NODE_INDEX: Record<string,{d:Dungeon;node:MapNode;idx:number}> = {};
for(const d of DUNGEONS)d.nodes.forEach((node,idx)=>NODE_INDEX[node.id]={d,node,idx});
export const ALL_NODE_IDS=Object.keys(NODE_INDEX);
export const TOTAL_ROUNDS=DUNGEONS.reduce((s,d)=>s+d.nodes.reduce((n,x)=>n+x.rounds.length,0),0);
export const ROMAN=["I","II","III","IV"];
export type Campaign={n:CampaignId;name:string;sub:string;blurb:string;art:string;tint:string;tag:string;langs:Lang[];count:number;chapters:Dungeon[]};
function book(n:CampaignId,name:string,sub:string,blurb:string,art:string,tint:string,tag:string,langs:Lang[]):Campaign {
  const chapters=DUNGEONS.filter(d=>d.campaign===n);
  return {n,name,sub,blurb,art:`/img/${art}.jpg`,tint,tag,langs,chapters,count:chapters.reduce((s,d)=>s+d.nodes.reduce((k,x)=>k+x.rounds.length,0),0)};
}
export const CAMPAIGNS:Campaign[]=[
  book(1,"Las cenizas de Valdrath","Pseudocódigo y JavaScript","Una pluma de cuervo es todo lo que queda de tu nombre. Desciende a las catacumbas y escribe las primeras palabras que pueden devolver la voz al reino.","title","#d3a05c","Iniciación",["pseudo","js"]),
  book(2,"El silencio de hierro","Java","Bajo la montaña de Ferrum, el Silencio forja cadenas con los nombres olvidados. Domina los tipos, las colecciones y la herencia para liberar el Códice.","d1","#8faaC3","Intermedia",["java"]),
  book(3,"La convergencia","Lenguajes combinados","Una grieta ha dividido Valdrath en tres realidades. Cada sello habla en una lengua distinta. Alterna 15 hechizos de pseudocódigo, 15 de JavaScript y 15 de Java para reunirlas.","d4","#b191d9","Avanzada",["pseudo","js","java"]),
  book(4,"El archivo esmeralda","MongoDB","Un bosque guarda la memoria del mundo en sus hojas. Explora esta historia independiente y domina documentos, filtros, escrituras y agregaciones de MongoDB.","d2","#85b890","Opcional",["mongo"])
];
export const lastChapter=(n:CampaignId)=>CAMPAIGNS[n-1].chapters[CAMPAIGNS[n-1].chapters.length-1];
export const LANG_LABEL={pseudo:"Pseudocódigo",js:"JavaScript",java:"Java",mongo:"MongoDB"} as const;
export const LANG_ICON={pseudo:"📜",js:"🔥",java:"⚒️",mongo:"🍃"} as const;
export const TIER_LABEL={normal:"Criatura",elite:"Élite",miniboss:"Miniboss",boss:"Jefe de mazmorra"} as const;
export const TIER_MULT={normal:1,elite:1.5,miniboss:2,boss:3} as const;
export const TIER_DMG={normal:9,elite:13,miniboss:17,boss:22} as const;
