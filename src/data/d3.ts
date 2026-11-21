import type { Dungeon } from "@/lib/types";
import { T, ch, mon, need, node, r } from "./helpers";

export const D3: Dungeon = {
  id: "d3",
  n: 3,
  campaign: 1,
  lang: "js",
  name: "La Torre de las Llamas Vivas",
  subtitle: "JavaScript I · Funciones, condiciones y ciclos",
  blurb: "Pyrrhus, Archimago de Ascuas, tradujo el Códice a un lenguaje de fuego: JavaScript. Sus llamas obedecen funciones, condiciones y ciclos.",
  intro:
    "La puerta de la Torre se abre sola. Dentro, mil llamas flotan como luciérnagas y cada una repite un verso en un idioma nuevo. «Esto ya no es pseudocódigo», advierte Corvo, «aquí las llaves { } cierran los bloques, los puntos y coma terminan las frases y los arreglos cuentan desde CERO». Escribe funciones que devuelvan (return) su resultado.",
  outro:
    "Pyrrhus se deshace en brasas... y en sus cenizas queda un espejo cubierto de hollín. Dentro, un reflejo te sonríe con tu rostro, pero con ojos de reina. «Sube, Escriba», dice, «Maelith te espera en el Laberinto de Espejos. Dijo que traerías pan... y trajiste fuego».",
  img: "/img/d3.jpg",
  sigItem: "anillo_brasa",
  nodes: [
    node(
      "d3n1",
      "Funciones: function y return",
      "normal",
      mon("Llama Danzante", "🔥", 40, "#ff9a3c", "«Salúdame... o arderás en silencio.»", "La llama se apaga con un chasquido alegre."),
      "Una llama del tamaño de un niño baila ante la puerta. Solo se calmará si le hablas con una función.",
      [
        ch(
          "La llama gira: «Salúdame por mi nombre... ¡con una función!»",
          `En JavaScript una función se declara con «function», recibe parámetros y devuelve un resultado con «return»:\n\nfunction doble(x) {\n  return x * 2;\n}\n\nEscribe «saludar(nombre)» que devuelva el texto «Hola, » + nombre + «!». Ej: saludar("Ana") → "Hola, Ana!".`,
          r`function saludar(nombre) {
  // tu hechizo aquí
}`,
          r`function saludar(nombre) {
  return "Hola, " + nombre + "!";
}`,
          [T('saludar("Ana")', "Hola, Ana!"), T('saludar("Corvo")', "Hola, Corvo!"), T('saludar("")', "Hola, !", true)],
          ["return devuelve el resultado de la función.", `return "Hola, " + nombre + "!";`],
          [need("\\breturn\\b", "La función debe devolver el resultado con return")],
        ),
      ],
    ),
    node(
      "d3n2",
      "Variables const/let y operadores",
      "normal",
      mon("Diablillo de Ascuas", "👺", 40, "#ff6a4a", "«Dame tu fuerza y tu arma... yo hago las cuentas.»", "El diablillo se escurre entre las chispas."),
      "Un diablillo con una calculadora de huesos revolotea alrededor de un yunque. Quiere saber cuánto daño harías.",
      [
        ch(
          "«¿Cuánto daño harías?», chilla el diablillo. «¡Fuerza doble más el arma!»",
          `«const» declara un valor que no cambia; «let» uno que sí cambia. Los operadores son + - * / %.\n\nEscribe «danoTotal(fuerza, arma)» que devuelva fuerza × 2 + arma. Usa una variable const para guardar el resultado antes de devolverlo.`,
          r`function danoTotal(fuerza, arma) {
  // tu hechizo aquí
}`,
          r`function danoTotal(fuerza, arma) {
  const total = fuerza * 2 + arma;
  return total;
}`,
          [T("danoTotal(5, 3)", 13), T("danoTotal(0, 0)", 0), T("danoTotal(10, 7)", 27, true)],
          ["const total = ...; return total;", "El cálculo es fuerza * 2 + arma."],
          [need("\\b(const|let)\\b", "Declara una variable con const o let")],
        ),
      ],
    ),
    node(
      "d3n3",
      "Condicionales: if / else if / else",
      "elite",
      mon("Salamandra Ardiente", "🦎", 120, "#ff8a2a", "«Mido el calor de todo... y tú estás tibio.»", "La salamandra se enfría y se vuelve piedra negra."),
      "Una salamandra de lava reposa sobre el pasamanos. Sus escamas cambian de color según la temperatura que mide.",
      [
        ch(
          "La salamandra abre un ojo: «Dime qué tan caliente es... con una función.»",
          `if / else if / else se escribe así:\n\nif (condicion) {\n  ...\n} else if (otra) {\n  ...\n} else {\n  ...\n}\n\nEscribe «clasificarFuego(temp)»:\n• temp >= 1000 → "Infernal"\n• temp >= 500 → "Ardiente"\n• en otro caso → "Tibio"`,
          r`function clasificarFuego(temp) {
  // tu hechizo aquí
}`,
          r`function clasificarFuego(temp) {
  if (temp >= 1000) {
    return "Infernal";
  } else if (temp >= 500) {
    return "Ardiente";
  } else {
    return "Tibio";
  }
}`,
          [T("clasificarFuego(1200)", "Infernal"), T("clasificarFuego(1000)", "Infernal"), T("clasificarFuego(700)", "Ardiente"), T("clasificarFuego(500)", "Ardiente", true), T("clasificarFuego(20)", "Tibio")],
          ["Empieza por la condición más alta (>= 1000).", "Usa if, else if y else, con return en cada rama."],
          [need("\\bif\\b", "Usa if / else if / else")],
        ),
        ch(
          "La salamandra bufa: «Ahora el calendario de las llamas... ¿es bisiesto este año?»",
          `Una función puede devolver un booleano (true / false).\nUn año es bisiesto si es divisible entre 4 y (no lo es entre 100 o sí lo es entre 400).\n\nEscribe «esBisiesto(anio)». Operadores: && (y), || (o), ! (no), === (igual).`,
          r`function esBisiesto(anio) {
  // tu hechizo aquí
}`,
          r`function esBisiesto(anio) {
  return anio % 4 === 0 && (anio % 100 !== 0 || anio % 400 === 0);
}`,
          [T("esBisiesto(2024)", true), T("esBisiesto(1900)", false), T("esBisiesto(2000)", true), T("esBisiesto(2023)", false, true), T("esBisiesto(2100)", false, true)],
          ["Usa && y || con paréntesis.", "return anio % 4 === 0 && (anio % 100 !== 0 || anio % 400 === 0);"],
        ),
      ],
    ),
    node(
      "d3n4",
      "Ciclos: for y while",
      "miniboss",
      mon("Gólem de Magma", "🌋", 220, "#ff5a1a", "«Cada vuelta me hace más fuerte. ¿Cuántas darás tú?»", "El gólem se enfría en mitad de un paso y se desploma."),
      "Los escalones de la Torre se mueven como engranajes. Un gólem de magma custodia la rueda y solo te dejará pasar si dominas la repetición.",
      [
        ch(
          "«Suma mis chispas, una por una», retumba el gólem.",
          `El ciclo for tiene tres partes: inicio; condición; avance.\n\nfor (let i = 1; i <= n; i++) {\n  ...\n}\n\nEscribe «sumaHasta(n)» que devuelva 1 + 2 + ... + n usando un ciclo for. sumaHasta(5) → 15.`,
          r`function sumaHasta(n) {
  // tu hechizo aquí
}`,
          r`function sumaHasta(n) {
  let total = 0;
  for (let i = 1; i <= n; i++) {
    total += i;
  }
  return total;
}`,
          [T("sumaHasta(5)", 15), T("sumaHasta(10)", 55), T("sumaHasta(0)", 0), T("sumaHasta(100)", 5050, true)],
          ["Crea let total = 0 antes del ciclo y súmale i en cada vuelta.", "total += i es lo mismo que total = total + i."],
          [need("\\bfor\\s*\\(", "En esta ronda debes usar un ciclo for")],
        ),
        ch(
          "El gólem aprieta los puños: «Cuenta mis dígitos... sin convertirme en texto.»",
          `while repite mientras la condición sea verdadera. Para quitar el último dígito de un número: n = Math.floor(n / 10).\n\nEscribe «contarDigitos(n)» (n ≥ 0) usando while. contarDigitos(1234) → 4, contarDigitos(0) → 1.`,
          r`function contarDigitos(n) {
  // tu hechizo aquí
}`,
          r`function contarDigitos(n) {
  let cuenta = 1;
  while (n >= 10) {
    n = Math.floor(n / 10);
    cuenta++;
  }
  return cuenta;
}`,
          [T("contarDigitos(7)", 1), T("contarDigitos(1234)", 4), T("contarDigitos(0)", 1), T("contarDigitos(99999)", 5, true), T("contarDigitos(10)", 2, true)],
          ["Parte de cuenta = 1 (todo número tiene al menos un dígito).", "Mientras n >= 10: divide n entre 10 (redondeando hacia abajo) y suma 1 a cuenta."],
          [need("\\bwhile\\s*\\(", "En esta ronda debes usar un ciclo while")],
        ),
      ],
    ),
    node(
      "d3n5",
      "Jefe: funciones, ciclos y condiciones juntos",
      "boss",
      mon("Pyrrhus, Archimago de Ascuas", "🧙", 400, "#ff7a2a", "«Yo escribí el Códice en fuego. ¡Tú lo reescribirás en ceniza!»", "Pyrrhus se consume en una llamarada blanca. «Ella... lo planeó todo...»"),
      "En la cima, Pyrrhus flota rodeado de anillos de fuego. Cada anillo es un acertijo; romperlos todos acabará con él. Es la prueba final de la Torre.",
      [
        ch(
          "«Primer anillo: el clásico», sonríe Pyrrhus. «Fizz... Buzz...»",
          `Escribe «fizzBuzz(n)» que devuelva un TEXTO:\n• "FizzBuzz" si n es múltiplo de 3 y de 5\n• "Fizz" si solo es múltiplo de 3\n• "Buzz" si solo es múltiplo de 5\n• en otro caso, el número convertido a texto (String(n))`,
          r`function fizzBuzz(n) {
  // tu hechizo aquí
}`,
          r`function fizzBuzz(n) {
  if (n % 15 === 0) return "FizzBuzz";
  if (n % 3 === 0) return "Fizz";
  if (n % 5 === 0) return "Buzz";
  return String(n);
}`,
          [T("fizzBuzz(3)", "Fizz"), T("fizzBuzz(5)", "Buzz"), T("fizzBuzz(15)", "FizzBuzz"), T("fizzBuzz(7)", "7"), T("fizzBuzz(30)", "FizzBuzz", true), T("fizzBuzz(1)", "1", true)],
          ["Comprueba primero el caso más específico: múltiplo de 15 (o de 3 y 5).", "Al final return String(n);"],
        ),
        ch(
          "El segundo anillo cruje: «Los primos son las brasas puras. ¡Reconócelas!»",
          `Escribe «esPrimo(n)» que devuelva true si n es primo y false si no (1 NO es primo).\nPista: prueba los divisores desde 2 hasta n - 1 (o hasta la raíz de n).`,
          r`function esPrimo(n) {
  // tu hechizo aquí
}`,
          r`function esPrimo(n) {
  if (n < 2) return false;
  for (let i = 2; i * i <= n; i++) {
    if (n % i === 0) return false;
  }
  return true;
}`,
          [T("esPrimo(1)", false), T("esPrimo(2)", true), T("esPrimo(9)", false), T("esPrimo(17)", true), T("esPrimo(97)", true, true), T("esPrimo(100)", false, true), T("esPrimo(0)", false, true)],
          ["Los números menores que 2 no son primos: devuelve false enseguida.", "Si encuentras un divisor (n % i === 0) devuelve false; si el ciclo termina, true."],
          [need("\\b(for|while)\\b", "Usa un ciclo para probar divisores")],
        ),
        ch(
          "Pyrrhus se tambalea. «El último anillo... el factorial. ¡Multiplica hasta que el mundo arda!»",
          `El factorial de n (n!) es 1 × 2 × ... × n. Por definición 0! = 1.\n\nEscribe «factorial(n)». Ej: factorial(5) → 120.`,
          r`function factorial(n) {
  // tu hechizo aquí
}`,
          r`function factorial(n) {
  let resultado = 1;
  for (let i = 2; i <= n; i++) {
    resultado *= i;
  }
  return resultado;
}`,
          [T("factorial(0)", 1), T("factorial(1)", 1), T("factorial(5)", 120), T("factorial(10)", 3628800, true), T("factorial(3)", 6, true)],
          ["Parte de resultado = 1 y multiplica por cada i.", "resultado *= i dentro de un for de 2 a n."],
        ),
      ],
    ),
  ],
};
