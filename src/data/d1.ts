import type { Dungeon } from "@/lib/types";
import { IO, OUT, ch, mon, need, node, r } from "./helpers";

export const D1: Dungeon = {
  id: "d1",
  n: 1,
  campaign: 1,
  lang: "pseudo",
  name: "Las Catacumbas del Susurro",
  subtitle: "Pseudocódigo I · Entrada, salida y decisiones",
  blurb: "Bajo la capital muerta duermen los reyes que olvidaron su propio nombre. Aquí aprenderás el lenguaje de las ideas: el pseudocódigo.",
  intro:
    "Las escaleras descienden en espiral. Cada peldaño tiene un verso grabado y borrado a medias. «Aquí empieza todo programa», susurra Corvo, «con una idea escrita en palabras simples». Los arreglos del pseudocódigo empiezan en 1, las palabras van entre comillas y cada bloque se cierra con su Fin. Escribe a mano: la pluma recuerda lo que los dedos practican.",
  outro:
    "Vael cae convertido en polvo y de su corona rota brota una palabra: TU NOMBRE... pero está tachado. Corvo traga saliva. «Alguien lo borró a propósito. Y ese alguien vive en el bosque que huele a hojas viejas y venganza».",
  img: "/img/d1.jpg",
  sigItem: "pluma_ceniza",
  nodes: [
    node(
      "d1n1",
      "Escribir: dar voz al hechizo",
      "normal",
      mon("Susurro sin Nombre", "👻", 40, "#8fb8ff", "«Shhh... los nombres se borran... los tuyos también...»", "El susurro se deshace en un suspiro de luz."),
      "Despiertas sobre piedra fría. Una voz sin cuerpo te rodea y crece. Solo hay una forma de callarla: ¡decir algo con poder!",
      [
        ch(
          "Una voz sin cuerpo se enrosca en tu cuello. Corvo grazna: «¡Escribe, Escriba! ¡Tu primera palabra de poder!»",
          `En pseudocódigo, la instrucción «Escribir» hace que el mundo te escuche. El texto va entre comillas dobles.\n\nConjura la palabra de poder: escribe «Escribir "Despierto"».`,
          r`// Tu primera palabra de poder
`,
          r`Escribir "Despierto"`,
          [OUT("Despierto")],
          ["La instrucción se llama Escribir y el texto debe ir entre comillas dobles.", `Así: Escribir "Despierto"`],
          [need("\\bescribir\\b", "Usa la instrucción Escribir")],
        ),
      ],
    ),
    node(
      "d1n2",
      "Leer, variables y operaciones",
      "normal",
      mon("Ghoul Sepulturero", "🧟", 40, "#9bd16a", "«Tributo... oro... suma... o te sumo a mi colección.»", "El ghoul se desmorona entre huesos y monedas."),
      "Un ghoul custodia un cofre sellado. Exige un tributo calculado: dos cifras que debes leer y sumar.",
      [
        ch(
          "El ghoul extiende una mano podrida: «Dame dos cantidades de oro... y dime cuánto suman.»",
          `Un programa tiene tres pasos: ENTRADA → PROCESO → SALIDA.\n\n«Leer a, b» recibe dos datos y los guarda en las variables a y b. Luego «Escribir a + b» muestra el resultado.\n\nLee dos números y escribe su suma. Ejemplo: entrada 12 y 30 → salida 42.`,
          r`// Lee dos números y escribe su suma
`,
          r`Leer a, b
Escribir a + b`,
          [IO([12, 30], "42"), IO([5, 7], "12"), IO([-4, 10], "6", true)],
          ["Primero Leer a, b para recibir los datos.", "Después Escribir a + b. No hace falta nada más."],
          [need("\\bleer\\b", "Debes usar Leer para recibir los datos")],
        ),
      ],
    ),
    node(
      "d1n3",
      "Condicional: Si / Entonces / Sino",
      "elite",
      mon("Guardián Esquelético", "💀", 120, "#e8dcc0", "«Solo pasa quien demuestre fuerza. Yo decido... y mi decisión es una condición.»", "El guardián se arrodilla y su armadura cae al suelo con un eco."),
      "Un esqueleto con armadura de bronce bloquea el pasillo. Sus ojos vacíos arden: cada paso tuyo será juzgado por una condición.",
      [
        ch(
          "«Dime tu fuerza», ruge el guardián. «Si es mayor que 10... pasarás.»",
          `Un «Si» ejecuta código solo cuando una condición es verdadera:\n\nSi condición Entonces\n   instrucciones\nFinSi\n\nLee un número «fuerza». Si es MAYOR que 10 escribe «Pasas». Si no lo es, no escribas nada.`,
          r`// Lee la fuerza y decide
`,
          r`Leer fuerza
Si fuerza > 10 Entonces
  Escribir "Pasas"
FinSi`,
          [IO([15], "Pasas"), IO([3], ""), IO([11], "Pasas"), IO([10], "", true)],
          ["Primero Leer fuerza. Luego un Si fuerza > 10 Entonces ... FinSi.", "No olvides cerrar con FinSi."],
          [need("\\bsi\\b[\\s\\S]*\\bentonces\\b[\\s\\S]*\\bfinsi\\b", "Usa Si ... Entonces ... FinSi")],
        ),
        ch(
          "El esqueleto ríe: «Ahora la segunda prueba: ¿eres de los que se parten en dos... o de los que quedan enteros?»",
          `«Sino» define qué hacer cuando la condición es falsa.\n\nLee un número «n». Si es par escribe «Par»; si no, escribe «Impar».\nPista: n es par cuando el resto de dividirlo entre 2 (n % 2) es 0.`,
          r`// Par o impar
`,
          r`Leer n
Si n % 2 = 0 Entonces
  Escribir "Par"
Sino
  Escribir "Impar"
FinSi`,
          [IO([4], "Par"), IO([7], "Impar"), IO([0], "Par"), IO([-3], "Impar", true)],
          ["El operador % da el resto de la división: 7 % 2 vale 1.", "Si n % 2 = 0 Entonces Escribir \"Par\" Sino Escribir \"Impar\" FinSi"],
          [need("\\bsino\\b", "Usa Sino para el caso contrario")],
        ),
      ],
    ),
    node(
      "d1n4",
      "Operadores lógicos: Y / O",
      "miniboss",
      mon("Gárgola de las Runas", "🗿", 220, "#b0a0ff", "«Dos cerraduras, dos runas... ¡combínalas bien o la piedra te aplastará!»", "La gárgola se resquebraja y las runas se apagan."),
      "Una reja de hierro negro cierra la cripta real. Una gárgola viva, cubierta de runas, ríe en el dintel: las cerraduras exigen combinar condiciones.",
      [
        ch(
          "«Para abrir necesitas la llave correcta Y la runa suficiente», retumba la gárgola.",
          `Con «Y» ambas condiciones deben cumplirse a la vez.\n\nLee «llave» y «runa». Si llave = 7 Y runa > 3 escribe «Abierta»; en otro caso escribe «Cerrada».`,
          r`// La reja de las runas
`,
          r`Leer llave, runa
Si llave = 7 Y runa > 3 Entonces
  Escribir "Abierta"
Sino
  Escribir "Cerrada"
FinSi`,
          [IO([7, 5], "Abierta"), IO([7, 2], "Cerrada"), IO([6, 9], "Cerrada"), IO([7, 4], "Abierta", true)],
          ["Combina las dos condiciones en una sola línea con Y.", "Si llave = 7 Y runa > 3 Entonces ..."],
          [need("\\by\\b", "Usa el operador Y para unir las dos condiciones")],
        ),
        ch(
          "La gárgola cambia el acertijo: «Ahora la tarifa del peaje: ¡los niños y los ancianos pagan menos!»",
          `Con «O» basta que UNA condición sea verdadera.\n\nLee «edad». Si es menor que 12 O mayor que 65 escribe «Descuento»; si no, escribe «Normal».`,
          r`// Tarifa del peaje
`,
          r`Leer edad
Si edad < 12 O edad > 65 Entonces
  Escribir "Descuento"
Sino
  Escribir "Normal"
FinSi`,
          [IO([10], "Descuento"), IO([70], "Descuento"), IO([30], "Normal"), IO([12], "Normal", true), IO([65], "Normal", true)],
          ["Usa O entre las dos condiciones: edad < 12 O edad > 65.", "Los límites exactos (12 y 65) NO tienen descuento."],
          [need("\\bo\\b", "Usa el operador O")],
        ),
      ],
    ),
    node(
      "d1n5",
      "Jefe: Segun y decisiones múltiples",
      "boss",
      mon("Vael, el Rey Sin Voz", "👹", 400, "#ff5a4a", "«Yo fui rey. Ahora soy silencio. ¡Y tú serás mi próximo súbdito!»", "Vael exhala su último aliento y por fin... pronuncia una palabra."),
      "El trono de Vael se alza sobre una montaña de coronas. Su boca está cosida con hilo negro, pero su voz resuena dentro de tu cabeza. Esta es la primera gran batalla: tres hechizos para romper sus sellos.",
      [
        ch(
          "Vael alza su cetro: «¡Cuatro runas de poder! ¡Elige bien!»",
          `«Segun» elige entre muchos casos de una variable:\n\nSegun x Hacer\n   "a": instrucciones\n   "b": instrucciones\n   De Otro Modo: instrucciones\nFinSegun\n\nLee dos números «a» y «b» y luego un texto «op». Si op es "+" escribe a + b; "-" → a - b; "*" → a * b; "/" → a / b; cualquier otro → «Hechizo desconocido».`,
          r`// Calculadora de runas
`,
          r`Leer a, b, op
Segun op Hacer
  "+": Escribir a + b
  "-": Escribir a - b
  "*": Escribir a * b
  "/": Escribir a / b
  De Otro Modo: Escribir "Hechizo desconocido"
FinSegun`,
          [IO([3, 4, "+"], "7"), IO([5, 2, "-"], "3"), IO([6, 7, "*"], "42"), IO([9, 3, "/"], "3", true), IO([1, 1, "x"], "Hechizo desconocido")],
          ["Lee los tres datos en orden: Leer a, b, op.", "Dentro de Segun cada caso se escribe así:  \"+\": Escribir a + b"],
          [need("\\bsegun\\b", "Para esta ronda usa Segun (selección múltiple)")],
        ),
        ch(
          "El Rey Sin Voz inclina la cabeza: «Mide el valor de tu alma... por rangos.»",
          `Lee una «nota» y clasifícala:\n• nota ≥ 90 → «S»\n• nota ≥ 70 → «A»\n• nota ≥ 50 → «B»\n• menor → «C»\n\nPuedes anidar un Si dentro del Sino de otro Si (cada uno con su FinSi).`,
          r`// Clasificar el alma
`,
          r`Leer nota
Si nota >= 90 Entonces
  Escribir "S"
Sino
  Si nota >= 70 Entonces
    Escribir "A"
  Sino
    Si nota >= 50 Entonces
      Escribir "B"
    Sino
      Escribir "C"
    FinSi
  FinSi
FinSi`,
          [IO([95], "S"), IO([90], "S"), IO([75], "A"), IO([70], "A", true), IO([50], "B"), IO([49], "C"), IO([0], "C", true)],
          ["Empieza por el rango más alto (≥ 90) y baja.", "Cada Sino puede contener otro Si ... FinSi."],
          [need("\\bsino\\b", "Usa Sino para encadenar los rangos")],
        ),
        ch(
          "Vael tiembla. Queda un sello: «El tiempo... ¡el año que se repite!»",
          `Un año es bisiesto si es divisible entre 4 y (no es divisible entre 100 o sí lo es entre 400).\n\nLee «anio» y escribe «Bisiesto» o «Normal».\nEjemplos: 2024 → Bisiesto, 1900 → Normal, 2000 → Bisiesto.`,
          r`// El año bisiesto
`,
          r`Leer anio
Si anio % 4 = 0 Y (anio % 100 <> 0 O anio % 400 = 0) Entonces
  Escribir "Bisiesto"
Sino
  Escribir "Normal"
FinSi`,
          [IO([2024], "Bisiesto"), IO([1900], "Normal"), IO([2000], "Bisiesto"), IO([2023], "Normal", true), IO([2100], "Normal", true)],
          ["Combina Y, O y paréntesis: anio % 4 = 0 Y ( ... O ... ).", "Dentro del paréntesis: anio % 100 <> 0 O anio % 400 = 0"],
          [need("\\by\\b", "Combina condiciones con Y"), need("\\bo\\b", "Combina condiciones con O")],
        ),
      ],
    ),
  ],
};
