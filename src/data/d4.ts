import type { Dungeon } from "@/lib/types";
import { T, ch, mon, need, node, r } from "./helpers";

export const D4: Dungeon = {
  id: "d4",
  n: 4,
  campaign: 1,
  lang: "js",
  name: "El Laberinto de Espejos",
  subtitle: "JavaScript II · Arrays, textos, objetos y métodos funcionales",
  blurb: "Cada espejo guarda una versión de ti. Para cruzar el laberinto debes manejar colecciones: arrays, textos, objetos y los métodos map, filter y reduce.",
  intro:
    "Mil reflejos te miran. En cada uno, tu mano escribe algo ligeramente distinto. «Los datos viajan en colecciones», dice Corvo desde un marco roto. «Arrays con corchetes [ ], objetos con llaves { }. Y recuerda: el primer elemento está en la posición 0, no en la 1». Al fondo, un trono de cristal te espera.",
  outro:
    "Maelith cae de rodillas y el cristal se vuelve ceniza. «No lo entiendes... lo sellé para salvarte», susurra, y levanta una pluma blanca. «Yo escribí tu nombre, hija del Códice. Y yo lo borré, para que el Silencio no pudiera devorarte. Ahora ya despertó... en Ferrum, bajo la montaña». Te entrega la Pluma Primigenia. Fin de la Primera Campaña. El Silencio avanza.",
  img: "/img/d4.jpg",
  sigItem: "pluma_primigenia",
  nodes: [
    node(
      "d4n1",
      "Arrays: índices desde 0",
      "normal",
      mon("Reflejo Torcido", "🪞", 40, "#c9a6ff", "«Soy tú, pero al revés. ¿Sabes cuál es mi último gesto?»", "El espejo se quiebra en mil esquirlas de luz."),
      "Un espejo alto muestra tu silueta en desorden: los elementos del reflejo están en una fila numerada desde 0.",
      [
        ch(
          "El reflejo te imita y te desafía: «Dime cuál es mi ÚLTIMO elemento.»",
          `Un array es una lista: [10, 20, 30]. Sus posiciones empiezan en 0: arr[0] es el primero. El tamaño es arr.length, así que el último está en arr[arr.length - 1].\n\nEscribe «ultimo(arr)» que devuelva el último elemento del array.`,
          r`function ultimo(arr) {
  // tu hechizo aquí
}`,
          r`function ultimo(arr) {
  return arr[arr.length - 1];
}`,
          [T("ultimo([4, 5, 6])", 6), T('ultimo(["x", "y"])', "y"), T("ultimo([9])", 9, true)],
          ["Si el array tiene 3 elementos, el último está en la posición 2.", "return arr[arr.length - 1];"],
        ),
      ],
    ),
    node(
      "d4n2",
      "Recorrer arrays con for...of",
      "normal",
      mon("Mímico de Cristal", "🎭", 40, "#ff9ad5", "«Imito todo lo que tocas... incluso tus errores.»", "El mímico se desvanece con una reverencia."),
      "Un mímico de cristal repite cada movimiento tuyo. Para pasar, debes sumar todo lo que haya guardado en su baúl.",
      [
        ch(
          "El mímico abre su baúl lleno de números: «Suma lo que ves.»",
          `for...of recorre los elementos de un array sin usar índices:\n\nfor (const x of arr) {\n  ...\n}\n\nEscribe «sumar(arr)» que devuelva la suma de todos sus números (0 si está vacío).`,
          r`function sumar(arr) {
  // tu hechizo aquí
}`,
          r`function sumar(arr) {
  let total = 0;
  for (const x of arr) {
    total += x;
  }
  return total;
}`,
          [T("sumar([1, 2, 3])", 6), T("sumar([])", 0), T("sumar([-1, 1])", 0), T("sumar([10, 20, 30, 40])", 100, true)],
          ["Empieza con let total = 0.", "for (const x of arr) { total += x; }"],
          [need("\\b(for|while)\\b|\\.reduce\\(|\\.forEach\\(", "Recorre el array con un ciclo (for, for...of, forEach o reduce)")],
        ),
      ],
    ),
    node(
      "d4n3",
      "Strings: manipular texto",
      "elite",
      mon("Arpía Susurrante", "🦅", 120, "#9ad0ff", "«Mis palabras vuelan al revés. ¿Puedes seguirlas?»", "La arpía cae en picada y sus plumas escriben una disculpa."),
      "Del techo de cristal cuelgan inscripciones escritas de derecha a izquierda. Una arpía las canta y solo quien domine los textos podrá descifrarlas.",
      [
        ch(
          "La arpía grazna: «Dame la palabra... ¡y yo la devuelvo del revés!»",
          `Los textos (strings) tienen métodos: texto.length, texto[i], texto.split(""), arr.reverse(), arr.join(""), toLowerCase()...\n\nEscribe «invertir(texto)» que devuelva el texto al revés. invertir("hola") → "aloh".`,
          r`function invertir(texto) {
  // tu hechizo aquí
}`,
          r`function invertir(texto) {
  let resultado = "";
  for (let i = texto.length - 1; i >= 0; i--) {
    resultado += texto[i];
  }
  return resultado;
}`,
          [T('invertir("hola")', "aloh"), T('invertir("")', ""), T('invertir("a")', "a", true), T('invertir("Corvo")', "ovroC", true)],
          ["Puedes recorrer el texto desde el final hacia el principio con un for.", `resultado += texto[i];`],
        ),
        ch(
          "«¡Ahora dime si la palabra es igual de ida que de vuelta!», chilla la arpía.",
          `Un palíndromo se lee igual al derecho y al revés (ignora mayúsculas y espacios): "Anita lava la tina".\n\nEscribe «esPalindromo(texto)» que devuelva true o false.\nPista: texto.toLowerCase() y texto.replaceAll(" ", "") te ayudan a limpiar.`,
          r`function esPalindromo(texto) {
  // tu hechizo aquí
}`,
          r`function esPalindromo(texto) {
  const limpio = texto.toLowerCase().replaceAll(" ", "");
  let al_reves = "";
  for (let i = limpio.length - 1; i >= 0; i--) {
    al_reves += limpio[i];
  }
  return limpio === al_reves;
}`,
          [T('esPalindromo("reconocer")', true), T('esPalindromo("Anita lava la tina")', true), T('esPalindromo("hola")', false), T('esPalindromo("A")', true, true), T('esPalindromo("Ala")', true, true)],
          ["Primero limpia el texto: minúsculas y sin espacios.", "Compara el texto limpio con su versión invertida."],
        ),
      ],
    ),
    node(
      "d4n4",
      "Objetos: propiedades y conteos",
      "miniboss",
      mon("Basilisco Especular", "🐍", 220, "#7affd0", "«Mira mis ojos... ¿qué propiedades tienes tú?»", "El basilisco se petrifica en su propia mirada."),
      "En una sala circular, un basilisco con escamas de espejo enrosca su cuerpo alrededor de un pedestal. Quiere conocer los atributos de un héroe y el nombre de cada palabra repetida.",
      [
        ch(
          "El basilisco sisea: «Crea un héroe para mí... con vida proporcional a su nivel.»",
          `Un objeto agrupa propiedades: { nombre: "Ana", nivel: 3 }. Se accede con punto: heroe.nivel.\n\nEscribe «crearHeroe(nombre, nivel)» que devuelva un objeto con las propiedades nombre, nivel y vida (vida = nivel × 10).`,
          r`function crearHeroe(nombre, nivel) {
  // tu hechizo aquí
}`,
          r`function crearHeroe(nombre, nivel) {
  return { nombre: nombre, nivel: nivel, vida: nivel * 10 };
}`,
          [T('crearHeroe("Ana", 3)', { nombre: "Ana", nivel: 3, vida: 30 }), T('crearHeroe("Bruno", 1)', { nombre: "Bruno", nivel: 1, vida: 10 }), T('crearHeroe("Lyra", 10)', { nombre: "Lyra", nivel: 10, vida: 100 }, true)],
          ["Devuelve un objeto literal con llaves { }.", "return { nombre: nombre, nivel: nivel, vida: nivel * 10 };"],
        ),
        ch(
          "«Cuenta mis palabras», sisea el basilisco. «Cada una... cuantas veces la repito.»",
          `Un objeto también sirve de diccionario: conteo["hola"] = 2.\n\nEscribe «contarPalabras(texto)» que devuelva un objeto donde cada clave es una palabra y su valor, cuántas veces aparece. Las palabras vienen separadas por un espacio.\ncontarPalabras("a b a") → { a: 2, b: 1 }`,
          r`function contarPalabras(texto) {
  // tu hechizo aquí
}`,
          r`function contarPalabras(texto) {
  const conteo = {};
  const palabras = texto.split(" ");
  for (const p of palabras) {
    if (conteo[p] === undefined) {
      conteo[p] = 1;
    } else {
      conteo[p]++;
    }
  }
  return conteo;
}`,
          [T('contarPalabras("a b a")', { a: 2, b: 1 }), T('contarPalabras("fuego")', { fuego: 1 }), T('contarPalabras("sol luna sol sol luna")', { sol: 3, luna: 2 }, true)],
          ["texto.split(\" \") convierte el texto en un array de palabras.", "Si conteo[p] aún no existe, ponlo en 1; si existe, súmale 1."],
        ),
      ],
    ),
    node(
      "d4n5",
      "Jefe: map, filter y reduce",
      "boss",
      mon("Maelith, la Reina Ceniza", "👸", 400, "#b080ff", "«Mi querida aprendiz... tu mano tiembla. ¿Recuerdas por qué escribes?»", "Maelith sonríe entre lágrimas de cristal: «Por fin... recordaste.»"),
      "El trono de cristal late con luz violeta. Maelith te espera con el Códice abierto. No lucha con espadas: escribe versos que transforman, filtran y reducen todo a su esencia. Tres hechizos funcionales para tres sellos.",
      [
        ch(
          "«Primer verso: transforma cada elemento», dice Maelith mientras gira una pluma blanca.",
          `«map» crea un array nuevo aplicando una función a cada elemento: [1,2,3].map(x => x * 2) → [2,4,6].\n\nEscribe «dobles(arr)» que devuelva un array con el doble de cada elemento. Usa .map().`,
          r`function dobles(arr) {
  // tu hechizo aquí
}`,
          r`function dobles(arr) {
  return arr.map(x => x * 2);
}`,
          [T("dobles([1, 2, 3])", [2, 4, 6]), T("dobles([])", []), T("dobles([-5, 0, 5])", [-10, 0, 10], true)],
          ["arr.map(x => ...) devuelve un array nuevo.", "return arr.map(x => x * 2);"],
          [need("\\.map\\s*\\(", "En esta ronda debes usar .map()")],
        ),
        ch(
          "«Segundo verso: conserva solo lo que importa.»",
          `«filter» crea un array con los elementos que cumplen una condición: [1,2,3,4].filter(x => x > 2) → [3,4].\n\nEscribe «pares(arr)» que devuelva solo los números pares. Usa .filter().`,
          r`function pares(arr) {
  // tu hechizo aquí
}`,
          r`function pares(arr) {
  return arr.filter(x => x % 2 === 0);
}`,
          [T("pares([1, 2, 3, 4])", [2, 4]), T("pares([1, 3])", []), T("pares([10, 11, 12, 0])", [10, 12, 0], true)],
          ["arr.filter(x => condicion)", "La condición de par es x % 2 === 0."],
          [need("\\.filter\\s*\\(", "En esta ronda debes usar .filter()")],
        ),
        ch(
          "«Último verso, mi niña: combina todo y reduce el mundo a un solo número.»",
          `«reduce» acumula un array en un solo valor: [1,2,3].reduce((acc, x) => acc + x, 0) → 6.\n\nEscribe «promedioPares(arr)» que devuelva el promedio de los números pares del array (0 si no hay pares). Usa .filter() y .reduce().\npromedioPares([1,2,3,4]) → 3`,
          r`function promedioPares(arr) {
  // tu hechizo aquí
}`,
          r`function promedioPares(arr) {
  const p = arr.filter(x => x % 2 === 0);
  if (p.length === 0) return 0;
  const suma = p.reduce((acc, x) => acc + x, 0);
  return suma / p.length;
}`,
          [T("promedioPares([1, 2, 3, 4])", 3), T("promedioPares([2, 4, 6, 8])", 5), T("promedioPares([1, 3])", 0), T("promedioPares([10])", 10, true)],
          ["Primero filtra los pares; si no queda ninguno, devuelve 0.", "Suma con reduce y divide entre la cantidad de pares."],
          [need("\\.filter\\s*\\(", "Usa .filter() para quedarte con los pares"), need("\\.reduce\\s*\\(", "Usa .reduce() para sumar")],
        ),
      ],
    ),
  ],
};
