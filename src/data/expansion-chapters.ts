import type { Challenge, Dungeon, Tier } from "@/lib/types";

export interface Chapter {
  name:string; theme:string; art:string; place:string; intro:string; outro:string; boss:string; relic:string;
}
export const TRINITY: Chapter[] = [
  {name:"El umbral de las tres voces",theme:"Expresiones y contratos",art:"d4",place:"Umbral",boss:"Aster, el Tríptico",relic:"Sello de los tres ecos",intro:"Corvo regresa con tres sombras. Cada una te llama por un nombre distinto. Al otro lado de la grieta, una campana empieza a sonar antes de que nadie la toque.",outro:"La primera campana calla. No eran tres mundos: eran tres versiones de la misma promesa."},
  {name:"Los relojes de Orien",theme:"Iteración y secuencias",art:"d1",place:"Orien",boss:"El Relojero sin Horas",relic:"Aguja de Orien",intro:"En Orien, ayer llueve hacia arriba. Una niña atrapada en el mismo minuto te pide que cuentes los latidos que faltan en su reloj.",outro:"La niña da un paso nuevo por primera vez en cien años. En su bolsillo, una nota de tu maestra: «Busca el puente»."},
  {name:"El puente de los errantes",theme:"Colecciones y búsqueda",art:"title",place:"Puente",boss:"El Recaudador de Recuerdos",relic:"Moneda del errante",intro:"Cien viajeros esperan cruzar un puente sin orilla. El peaje no se paga en oro: el barquero cobra un recuerdo distinto en cada lengua.",outro:"Al devolver los recuerdos, el puente toca tierra. Corvo recuerda por fin quién escribió la primera grieta."},
  {name:"El palacio invertido",theme:"Transformación de datos",art:"d6",place:"Palacio",boss:"Veyra, la Inversa",relic:"Espejo de Veyra",intro:"El palacio cuelga del cielo como un reflejo. Cada habitación intenta convencerte de que solo hay una forma correcta de contar la historia.",outro:"Veyra te entrega un espejo. No refleja tu cara: refleja las decisiones que aún puedes tomar."},
  {name:"La cámara de la convergencia",theme:"Algoritmos y composición",art:"d7",place:"Convergencia",boss:"La Voz Indivisible",relic:"Pluma de la Convergencia",intro:"Las tres sombras rodean el Códice. Una quiere olvidar; otra, repetir. La tercera no sabe acabar su frase. Solo tú puedes escribir un final que las contenga a todas.",outro:"No escoges una lengua. Escribes un mismo juramento con las tres. La grieta se cierra y, por primera vez, Corvo tiene una sola sombra."}
];
export const ARCHIVE: Chapter[] = [
  {name:"El vestíbulo de las hojas",theme:"Documentos y primeras consultas",art:"d2",place:"Vestíbulo",boss:"El Guardián del Catálogo",relic:"Hoja del primer folio",intro:"En el bosque hay un árbol que recuerda todo lo perdido. Sus hojas no contienen versos, sino documentos. Una rama seca te muestra su primera colección: reliquias.",outro:"El catálogo vuelve a tener nombres. Bajo la corteza se dibuja un pasillo de raíces."},
  {name:"Las raíces del índice",theme:"Filtros y operadores",art:"d6",place:"Raíces",boss:"El Custodio de las Raíces",relic:"Raíz de memoria",intro:"Las raíces han mezclado las memorias de los vivos con las de los ausentes. Una mala selección haría despertar al archivo entero.",outro:"Encuentras el recuerdo de la primera archivera. No desapareció: alguien la guardó en otra sala."},
  {name:"La galería de los prismas",theme:"Cursores y proyecciones",art:"d4",place:"Prismas",boss:"El Prisma de las Mil Caras",relic:"Cristal de perspectiva",intro:"Cada prisma devuelve los mismos documentos vistos desde otro ángulo. Para encontrar a la archivera tendrás que aprender qué conservar y qué dejar fuera.",outro:"El último prisma muestra una puerta. La llave no está perdida: figura con el nombre equivocado."},
  {name:"El scriptorium viviente",theme:"Escritura y actualización",art:"d3",place:"Scriptorium",boss:"El Corrector de Ámbar",relic:"Tintero de ámbar",intro:"Los guardianes permiten corregir la historia, pero nunca el original. Cada conjuro trabaja sobre una copia nueva; el árbol comprueba con cuidado cada cambio.",outro:"La llave recupera su nombre. La archivera respira tras el último muro, rodeada de miles de relatos sin ordenar."},
  {name:"El corazón esmeralda",theme:"Agregación y análisis",art:"d2",place:"Corazón",boss:"Sylva, Memoria del Bosque",relic:"Corazón del Archivo",intro:"Sylva no es un monstruo: son millones de recuerdos intentando hablar a la vez. Agrupa sus voces para que pueda decirte una última palabra.",outro:"«Gracias», dice el bosque. El Archivo Esmeralda queda a tu cuidado. Sus estantes vacíos esperan nuevas historias."}
];
const tier:Tier[]=["normal","normal","elite","miniboss","boss"];
const counts=[1,1,2,2,3];
const MIX_FOES=["Eco de tinta","Sombra del umbral","Heraldo triforme","Custodio del espejo"];
const DB_FOES=["Polilla del folio","Espectro de musgo","Centinela de jade","Dríade del archivo"];
export function buildExpedition(camp:3|4,defs:Chapter[],lessons:Challenge[]):Dungeon[] {
  if(lessons.length!==defs.length*9) throw Error(`El número de ejercicios de la campaña ${camp} no coincide con sus capítulos.`);
  let cursor=0;
  return defs.map((c,i)=>{
    const id=(camp===3?'tri':'arc')+(i+1);const group=camp===3?MIX_FOES:DB_FOES;
    const nodes=counts.map((len,j)=>{
      const rounds=lessons.slice(cursor,cursor+len);cursor+=len;
      if(rounds.length!==len) throw Error(`Faltan ejercicios en ${id}`);
      const name=j===4?c.boss:group[j]+" de "+c.place;
      const concept=rounds[0].title!;
      return {id:`${id}n${j+1}`,concept,tier:tier[j],lore:j===4?c.intro:`${name} custodia el paso. ${rounds[0].story}`,rounds,monster:{name,icon:(camp===3?["🔮","🌑","🦅","🛡️","🐉"]:["🦋","🌿","🗿","🌳","🐲"])[j],hp:[55,70,150,240,450][j],color:camp===3?"#bb9cde":"#8bce94",taunt:"La runa no responde. Comprueba los casos de prueba antes de volver a escribir.",defeat:j===4?"El sello se abre. Otro fragmento de la historia vuelve al Códice.":"La criatura inclina la cabeza y te deja pasar."}};
    });
    return {id,n:(camp===3?8:13)+i,campaign:camp,lang:camp===4?"mongo":"pseudo",name:c.name,subtitle:c.theme,blurb:c.intro,intro:c.intro,outro:c.outro,img:"/img/"+c.art+".jpg",sigItem:"tesoro_"+id,nodes};
  });
}
