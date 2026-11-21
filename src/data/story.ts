export const PROLOGUE: { text: string; who?: string }[] = [
  { text: "Hubo un tiempo en que el mundo se escribía a sí mismo.\nCada río, cada rey, cada canción... era una línea del Gran Códice." },
  { text: "Entonces llegó el Silencio.\nNo fue una guerra: fue un borrado.\nPrimero cayeron los nombres. Luego, los reinos que los llevaban." },
  { text: "Despiertas sobre piedra fría, con ceniza en la boca.\nNo recuerdas tu nombre.\nSolo tienes una pluma de cuervo atada a la mano... y una certeza:\nlo que escribas aquí, será verdad." },
  { who: "Corvo, el cuervo cojo", text: "«Por fin, Escriba. Cien años esperando que alguien despertara.\nAlgo se arrastra hacia ti en la oscuridad.\n¡Escribe tu primera palabra de poder... antes de que ella te escriba a ti!»" },
];

export const RUMORS: string[] = [
  "«Dicen que en las Catacumbas hay un rey que perdió la voz. Y que su silencio es contagioso.»",
  "«Un viajero contó los mismos pasos tres veces en el Bosque de los Ciclos... y volvió con tres sombras.»",
  "«Desde aquí se ve la Torre de las Llamas. Los magos que entran cambian de idioma: ahora hablan en llaves y puntos y coma.»",
  "«En el Laberinto de Espejos vive una reina que llora ceniza. Cuentan que nunca fue la villana.»",
  "«Algo se mueve bajo la montaña de Ferrum. Los herreros dejaron sus martillos. El hierro canta tu nombre.»",
  "«Un archivo sin fondo, dicen. Quien baja encuentra su propia letra... y no siempre la reconoce.»",
  "«El Trono está vacío. Siempre lo estuvo. Eso es lo que lo vuelve terrible.»",
  "«Los nombres vuelven, Escriba. Hoy el pan sabe a recuerdo. Gracias... Las bebidas corren por la casa.»",
];

export const KEEPER_LINES = [
  "Brisa limpia una jarra y te guiña el ojo. «¿Otra vez vivo? Qué manía.»",
  "«Los encargos del tablero se renuevan cada doce horas. Los viejos... se los lleva el cuervo.»",
  "«Practica a mano, Escriba. El que copia no aprende; el que escribe, recuerda.»",
  "«Corvo está en la viga, fingiendo que no escucha. Escucha todo.»",
  "«Si te falla el hechizo, respira. Léelo despacio. Casi siempre es un punto y coma.»",
];

export const CAMPAIGN_END: Record<1 | 2 | 3 | 4, { title: string; text: string }> = {
  1: {
    title: "Fin de la Campaña I",
    text: "Maelith te entrega la Pluma Primigenia y su confesión: ella borró tu nombre para salvarte del Silencio. Pero el Silencio ya despertó, bajo la montaña de Ferrum... La Campaña II te espera.",
  },
  2: {
    title: "Fin de la Campaña II",
    text: "Tu nombre resuena en el vacío. El Silencio retrocede, los nombres regresan al Códice y Valdrath vuelve a escribirse. Eres, oficialmente, una Voz del Códice. Sigue practicando en la Taberna: siempre hay un encargo nuevo cada doce horas.",
  },
  3: {title:"Fin de la Campaña III",text:"Las tres voces vuelven al mismo reino. Has resuelto los 45 desafíos de la Convergencia: tres lenguajes, un solo juramento."},
  4: {title:"Archivo restaurado",text:"Todos los folios del Archivo Esmeralda están restaurados. Sylva te nombra Guardián del Archivo. Puedes volver a tus otras campañas sin perder tu progreso."},
};
