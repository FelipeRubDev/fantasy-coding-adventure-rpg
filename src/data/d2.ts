import type { Dungeon } from "@/lib/types";
import { IO, OUT, T, ch, mon, need, node, r } from "./helpers";

const tabla = (n: number) => Array.from({ length: 10 }, (_, i) => `${n} x ${i + 1} = ${n * (i + 1)}`).join("\n");

export const D2: Dungeon = {
  id: "d2",
  n: 2,
  campaign: 1,
  lang: "pseudo",
  name: "El Bosque de los Ciclos",
  subtitle: "Pseudocódigo II · Ciclos, arreglos y funciones",
  blurb: "Los árboles aquí repiten sus propias ramas sin fin. Para cruzar el bosque debes dominar el arte de repetir: Para, Mientras, Repetir, arreglos y funciones.",
  intro:
    "El bosque respira al compás de un mismo verso repetido mil veces. Corvo se posa en tu hombro: «Quien repite a mano, no repite igual: aprende. Cuenta tus pasos, Escriba, o el bosque te los contará a ti». Recuerda: los arreglos empiezan en 1 y los ciclos necesitan una forma de terminar.",
  outro:
    "Madre Hiedra se marchita y entre sus raíces aparece una puerta de ceniza con un grabado: «Para Maelith, con amor». Corvo baja el pico. «Ella... era tu maestra. Y tú, su mejor aprendiz». El suelo tiembla: el Códice de fuego reclama al siguiente Escriba.",
  img: "/img/d2.jpg",
  sigItem: "hoja_eterna",
  nodes: [
    node(
      "d2n1",
      "Para: repetir un número fijo de veces",
      "normal",
      mon("Lobo de Zarza", "🐺", 40, "#9bd16a", "«Cinco pasos... cinco mordidas. Cuenta conmigo.»", "El lobo aúlla por última vez y se vuelve hojarasca."),
      "Huellas en círculo. Algo te rodea contando en voz baja: uno, dos, tres... Para detenerlo debes contar mejor.",
      [
        ch(
          "El lobo cuenta sus pasos alrededor de ti: «Uno... dos...» ¡Cuéntalos tú más rápido!",
          `El ciclo «Para» repite un bloque un número exacto de veces:\n\nPara i <- 1 Hasta 5 Hacer\n   instrucciones\nFinPara\n\nEscribe los números del 1 al 5, uno por línea.`,
          r`// Cuenta del 1 al 5
`,
          r`Para i <- 1 Hasta 5 Hacer
  Escribir i
FinPara`,
          [OUT("1\n2\n3\n4\n5")],
          ["La variable i toma los valores 1, 2, 3, 4, 5 automáticamente.", "Para i <- 1 Hasta 5 Hacer / Escribir i / FinPara"],
          [need("\\bpara\\b[\\s\\S]*\\bfinpara\\b", "Usa un ciclo Para ... FinPara")],
        ),
      ],
    ),
    node(
      "d2n2",
      "Acumulador: sumar dentro de un ciclo",
      "normal",
      mon("Araña Tejedora", "🕷️", 40, "#c58bff", "«Cada hilo suma al siguiente... y tú sumas a mi telaraña.»", "La tejedora se enreda en su propia seda."),
      "Una telaraña gigante cuelga entre dos troncos. Cada hilo tiene un valor y el total abrirá el camino.",
      [
        ch(
          "La tejedora sonríe con ocho ojos: «Suma todos mis hilos, del 1 hasta n.»",
          `Un acumulador es una variable que va creciendo en cada vuelta:\n\ntotal <- 0\nPara ... Hacer\n   total <- total + algo\nFinPara\n\nLee «n» y escribe la suma de 1 + 2 + ... + n. Ejemplo: n = 5 → 15.`,
          r`// Suma de 1 hasta n
`,
          r`Leer n
total <- 0
Para i <- 1 Hasta n Hacer
  total <- total + i
FinPara
Escribir total`,
          [IO([5], "15"), IO([1], "1"), IO([10], "55"), IO([100], "5050", true)],
          ["Inicia total en 0 ANTES del ciclo.", "Dentro del ciclo: total <- total + i"],
          [need("\\bpara\\b", "Usa un ciclo Para para recorrer los números")],
        ),
      ],
    ),
    node(
      "d2n3",
      "Mientras y Repetir: ciclos con condición",
      "elite",
      mon("Ent Corrupto", "🌲", 120, "#5fae6a", "«Yo crezco mientras tú te cansas.»", "El Ent cae con un crujido que sacude el bosque."),
      "Un árbol enorme bloquea el sendero. Sus raíces se mueven mientras algo siga siendo verdad: la clave es saber cuándo la condición deja de serlo.",
      [
        ch(
          "El Ent ruge: «¡Mientras el tiempo siga corriendo, yo crezco!»",
          `«Mientras» repite mientras la condición sea verdadera:\n\nMientras condición Hacer\n   instrucciones\nFinMientras\n\nLee «n» y escribe la cuenta regresiva n, n-1, ..., 1 (uno por línea).`,
          r`// Cuenta regresiva
`,
          r`Leer n
Mientras n >= 1 Hacer
  Escribir n
  n <- n - 1
FinMientras`,
          [IO([3], "3\n2\n1"), IO([1], "1"), IO([5], "5\n4\n3\n2\n1", true)],
          ["La condición debe dejar de cumplirse: n baja en cada vuelta.", "No olvides n <- n - 1 dentro del ciclo."],
          [need("\\bmientras\\b[\\s\\S]*\\bfinmientras\\b", "Usa Mientras ... FinMientras")],
        ),
        ch(
          "Las raíces se enroscan: «¡Sigue leyendo ofrendas HASTA que ofrezcas la nada!»",
          `«Repetir ... Hasta Que» ejecuta el bloque al menos una vez y termina cuando la condición se cumple.\n\nRepite: lee un número; hasta que el número leído sea 0. Escribe la suma de todos los números leídos (el 0 final no suma).`,
          r`// Ofrendas hasta el cero
`,
          r`suma <- 0
Repetir
  Leer n
  suma <- suma + n
Hasta Que n = 0
Escribir suma`,
          [IO([3, 4, 5, 0], "12"), IO([0], "0"), IO([10, -2, 0], "8", true)],
          ["Repetir siempre ejecuta primero el bloque y luego revisa la condición.", "Hasta Que n = 0 va al final del bloque."],
          [need("\\brepetir\\b[\\s\\S]*\\bhasta\\s+que\\b", "Usa Repetir ... Hasta Que")],
        ),
      ],
    ),
    node(
      "d2n4",
      "Arreglos: Dimension y recorrido",
      "miniboss",
      mon("Bruja del Musgo", "🧙‍♀️", 220, "#7ad7a0", "«Guardo cada alma en su casillero... del 1 al n. ¿Sabrás ordenarlas?»", "La bruja se disuelve en esporas verdes."),
      "En un claro, una bruja guarda cientos de frascos alineados. Cada frasco tiene un número de casillero que empieza en 1. Para vencerla tendrás que recorrerlos todos.",
      [
        ch(
          "«Lee mis frascos... y dime sus contenidos al revés», cacarea la bruja.",
          `Un arreglo guarda muchos valores bajo un mismo nombre:\n\nDimension a[n]\na[1] <- 10\n\nLos índices van de 1 a n.\n\nLee «n» y luego n números en un arreglo. Escríbelos en orden INVERSO (uno por línea).`,
          r`// Frascos al revés
`,
          r`Leer n
Dimension a[n]
Para i <- 1 Hasta n Hacer
  Leer a[i]
FinPara
Para i <- n Hasta 1 Con Paso -1 Hacer
  Escribir a[i]
FinPara`,
          [IO([3, 10, 20, 30], "30\n20\n10"), IO([1, 5], "5"), IO([4, 1, 2, 3, 4], "4\n3\n2\n1", true)],
          ["Primero Dimension a[n], luego un Para que lea cada a[i].", "Para recorrer al revés: Para i <- n Hasta 1 Con Paso -1 Hacer"],
          [need("\\bdimension\\b", "Declara el arreglo con Dimension")],
        ),
        ch(
          "La bruja levanta el frasco más grande: «¡El mayor de todos es el que me alimenta! ¿Lo encuentras?»",
          `Para hallar el mayor de un arreglo: parte suponiendo que el primero es el mayor y recorre el resto; si encuentras uno más grande, actualiza.\n\nLee «n» y n números en un arreglo. Escribe el MAYOR.`,
          r`// El frasco mayor
`,
          r`Leer n
Dimension a[n]
Para i <- 1 Hasta n Hacer
  Leer a[i]
FinPara
mayor <- a[1]
Para i <- 2 Hasta n Hacer
  Si a[i] > mayor Entonces
    mayor <- a[i]
  FinSi
FinPara
Escribir mayor`,
          [IO([4, 3, 9, 2, 7], "9"), IO([1, -5], "-5"), IO([3, 8, 8, 1], "8"), IO([3, -3, -1, -2], "-1", true)],
          ["Empieza con mayor <- a[1].", "Recorre desde i <- 2 y compara con Si a[i] > mayor."],
          [need("\\bdimension\\b", "Declara el arreglo con Dimension")],
        ),
      ],
    ),
    node(
      "d2n5",
      "Jefe: bucles anidados y funciones",
      "boss",
      mon("Hiedra Madre", "🌿", 400, "#3fd17a", "«Todo vuelve. Todo se repite. Tú también volverás... como abono.»", "Hiedra Madre se marchita y su último zarcillo escribe: «Perdónala»."),
      "En el corazón del bosque, una enredadera colosal late. Sus tallos forman filas y columnas: ciclos dentro de ciclos. Cada hechizo debe romper uno de sus sellos.",
      [
        ch(
          "Los zarcillos forman escalones vivos: «¡Dibuja mi escalera!»",
          `Un ciclo dentro de otro ciclo es un bucle anidado: el interno se ejecuta completo por cada vuelta del externo.\n\n«Escribir Sin Saltar "*"» escribe sin cambiar de línea y «Escribir ""» salta de línea.\n\nLee «n» y dibuja un triángulo de n filas, donde la fila i tiene i asteriscos. Para n = 3:\n*\n**\n***`,
          r`// Escalera de hiedra
`,
          r`Leer n
Para i <- 1 Hasta n Hacer
  Para j <- 1 Hasta i Hacer
    Escribir Sin Saltar "*"
  FinPara
  Escribir ""
FinPara`,
          [IO([3], "*\n**\n***"), IO([1], "*"), IO([4], "*\n**\n***\n****", true)],
          ["La fila i necesita un ciclo interno que repita i veces.", "Al terminar el ciclo interno, Escribir \"\" baja a la siguiente línea."],
          [need("\\bpara\\b[\\s\\S]*\\bpara\\b[\\s\\S]*\\bfinpara\\b[\\s\\S]*\\bfinpara\\b", "Necesitas un Para dentro de otro Para")],
        ),
        ch(
          "Las raíces golpean el suelo en ritmo: «¡Multiplica! ¡Multiplica!»",
          `Lee «n» y escribe su tabla de multiplicar del 1 al 10 con este formato exacto:\n2 x 1 = 2\n2 x 2 = 4\n...\n2 x 10 = 20\n\nPuedes escribir varios valores en un solo Escribir separándolos con comas.`,
          r`// Tabla de multiplicar
`,
          r`Leer n
Para i <- 1 Hasta 10 Hacer
  Escribir n, " x ", i, " = ", n * i
FinPara`,
          [IO([2], tabla(2)), IO([7], tabla(7)), IO([12], tabla(12), true)],
          [`Escribir n, " x ", i, " = ", n * i  une todo sin separadores extra.`, "El ciclo Para va de 1 a 10."],
          [need("\\bpara\\b", "Usa un ciclo Para")],
        ),
        ch(
          "Hiedra Madre se enrosca por última vez: «Dime si un número es indivisible... y lo harás con una FUNCIÓN.»",
          `Una función agrupa un hechizo reutilizable:\n\nFuncion resultado <- nombre(param)\n   ...\n   resultado <- valor\nFinFuncion\n\nEscribe la función «esPrimo(n)» que devuelva Verdadero si n es primo (n ≥ 2) y Falso si no. Un primo solo se divide por 1 y por sí mismo.`,
          r`Funcion resultado <- esPrimo(n)
  // tu hechizo aquí
FinFuncion`,
          r`Funcion resultado <- esPrimo(n)
  resultado <- Verdadero
  Para i <- 2 Hasta n - 1 Hacer
    Si n % i = 0 Entonces
      resultado <- Falso
    FinSi
  FinPara
FinFuncion`,
          [T("esPrimo(2)", true), T("esPrimo(3)", true), T("esPrimo(4)", false), T("esPrimo(17)", true), T("esPrimo(21)", false), T("esPrimo(97)", true, true), T("esPrimo(100)", false, true)],
          ["Supón que es primo (resultado <- Verdadero) y busca un divisor entre 2 y n - 1.", "Si n % i = 0 para algún i, entonces resultado <- Falso."],
          [need("\\bfuncion\\b[\\s\\S]*\\bfinfuncion\\b", "Define la función con Funcion ... FinFuncion"), need("\\bpara\\b|\\bmientras\\b", "Usa un ciclo para buscar divisores")],
        ),
      ],
    ),
  ],
};
