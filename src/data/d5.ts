import type { Dungeon } from "@/lib/types";
import { T, ch, mon, need, node, r } from "./helpers";

export const D5: Dungeon = {
  id: "d5",
  n: 5,
  campaign: 2,
  lang: "java",
  name: "Las Fraguas de Ferrum",
  subtitle: "Java I · Tipos, métodos, decisiones y ciclos",
  blurb: "En Ferrum la realidad se forja con Leyes de Hierro: nada existe sin declarar su tipo. Bienvenido a Java, el lenguaje de las reglas estrictas.",
  intro:
    "La montaña de Ferrum respira vapor y chispas. Sus puertas tienen una inscripción: «Aquí nada se crea sin nombre ni tipo». Corvo se estremece: «Java no perdona, Escriba. Cada variable lleva su tipo (int, double, String, boolean), cada instrucción termina en punto y coma y todo vive dentro de una clase». Puedes escribir solo el método o envolverlo en «public class Forja { }».",
  outro:
    "Gorrim cae sobre su propio yunque y las runas de hierro se apagan una a una. Bajo el polvo encuentras un mapa: «El Archivo Abismal, donde se guardan todos los nombres borrados». Y, más abajo, una melodía lenta: el Silencio canta tu nombre... tachado.",
  img: "/img/d5.jpg",
  sigItem: "martillo_ferrum",
  nodes: [
    node(
      "d5n1",
      "Tipos y métodos: declarar el tipo",
      "normal",
      mon("Autómata Oxidado", "🤖", 40, "#d0a070", "«REGLA 1: TODO. TIENE. TIPO.»", "El autómata se desarma con un chirrido satisfecho."),
      "Un autómata de bronce vigila la entrada. Solo acepta órdenes escritas con tipos exactos.",
      [
        ch(
          "El autómata gira la cabeza con un chirrido: «DECLARA EL MÉTODO. SUMAR DOS LINGOTES. ENTEROS.»",
          `En Java un método declara el tipo que devuelve y el tipo de cada parámetro:\n\nstatic int doble(int x) {\n    return x * 2;\n}\n\nEscribe el método «static int sumar(int a, int b)» que devuelva la suma de los dos lingotes (enteros).`,
          r`public class Forja {
    // Escribe aquí tu método estático sumar
}`,
          r`public class Forja {
    static int sumar(int a, int b) {
        return a + b;
    }
}`,
          [T("sumar(2, 3)", 5), T("sumar(-4, 4)", 0), T("sumar(100, 250)", 350, true)],
          ["Se declara así: static int sumar(int a, int b) { ... }", "Dentro: return a + b;"],
          [need("static\\s+int\\s+sumar\\s*\\(\\s*int\\s+\\w+\\s*,\\s*int\\s+\\w+\\s*\\)", "Declara exactamente: static int sumar(int a, int b)")],
        ),
      ],
    ),
    node(
      "d5n2",
      "double y la división entera",
      "normal",
      mon("Troll Fundidor", "🧌", 40, "#8ac06a", "«Yo divido todo en partes enteras. ¡Sin decimales!»", "El troll tropieza con su cucharón y cae en el molde."),
      "Un troll fundidor reparte lingotes en moldes. Pero siempre redondea hacia abajo y se queda con los decimales.",
      [
        ch(
          "El troll rasca su cabeza: «5 dividido 2... 2. ¡Siempre 2!» Hay que enseñarle los decimales.",
          `En Java, int / int da un ENTERO (7 / 2 = 3). Si uno de los dos es double, el resultado conserva decimales (7 / 2.0 = 3.5).\n\nCompleta «static double promedio(int a, int b)» para que devuelva el promedio exacto de a y b. promedio(3, 4) → 3.5`,
          r`public class Forja {
    static double promedio(int a, int b) {
        // tu hechizo aquí
    }
}`,
          r`public class Forja {
    static double promedio(int a, int b) {
        return (a + b) / 2.0;
    }
}`,
          [T("promedio(3, 4)", 3.5), T("promedio(10, 20)", 15), T("promedio(1, 2)", 1.5), T("promedio(0, 0)", 0, true)],
          ["(a + b) / 2 es división entera: pierde los decimales.", "Divide entre 2.0 para forzar decimales."],
        ),
      ],
    ),
    node(
      "d5n3",
      "if / else y operadores lógicos",
      "elite",
      mon("Quimera de Hierro", "🦁", 120, "#c0c0d0", "«Tres cabezas, tres decisiones. ¿Cuál escoges?»", "La quimera cae y sus tres cabezas se miran, derrotadas."),
      "Una quimera de hierro con tres cabezas custodia la fragua. Cada cabeza decide con una condición distinta.",
      [
        ch(
          "La cabeza de león ruge: «¡Clasifica la fuerza de cada golpe!»",
          `En Java, if / else if / else usa llaves y paréntesis:\n\nif (x > 5) {\n    ...\n} else {\n    ...\n}\n\nEscribe «static String claseDeDanio(int dano)»:\n• dano >= 50 → "Critico"\n• dano >= 20 → "Fuerte"\n• en otro caso → "Debil"\n(sin tildes).`,
          r`public class Forja {
    // Escribe aquí claseDeDanio
}`,
          r`public class Forja {
    static String claseDeDanio(int dano) {
        if (dano >= 50) {
            return "Critico";
        } else if (dano >= 20) {
            return "Fuerte";
        } else {
            return "Debil";
        }
    }
}`,
          [T("claseDeDanio(80)", "Critico"), T("claseDeDanio(50)", "Critico"), T("claseDeDanio(35)", "Fuerte"), T("claseDeDanio(20)", "Fuerte", true), T("claseDeDanio(3)", "Debil")],
          ["Revisa de mayor a menor: primero >= 50.", "static String claseDeDanio(int dano) { if (...) { return ...; } ... }"],
          [need("static\\s+String\\s+claseDeDanio\\s*\\(\\s*int\\s+\\w+\\s*\\)", "Declara: static String claseDeDanio(int dano)")],
        ),
        ch(
          "La cabeza de cabra bala: «¡El año de la forja! ¿Es bisiesto?»",
          `En Java los operadores lógicos son && (y), || (o) y ! (no). Los textos se comparan con .equals(), pero los números con ==.\n\nEscribe «static boolean esBisiesto(int anio)»: divisible entre 4 y (no divisible entre 100 o divisible entre 400).`,
          r`public class Forja {
    // Escribe aquí esBisiesto
}`,
          r`public class Forja {
    static boolean esBisiesto(int anio) {
        return anio % 4 == 0 && (anio % 100 != 0 || anio % 400 == 0);
    }
}`,
          [T("esBisiesto(2024)", true), T("esBisiesto(1900)", false), T("esBisiesto(2000)", true), T("esBisiesto(2023)", false, true), T("esBisiesto(2100)", false, true)],
          ["El tipo de retorno es boolean.", "return anio % 4 == 0 && (anio % 100 != 0 || anio % 400 == 0);"],
          [need("static\\s+boolean\\s+esBisiesto", "Declara: static boolean esBisiesto(int anio)")],
        ),
      ],
    ),
    node(
      "d5n4",
      "Ciclos: for y while",
      "miniboss",
      mon("Forjador Titánico", "🪓", 220, "#ff9a4a", "«Golpeo el hierro mil veces... ¡y tú también golpearás!»", "El titán suelta su martillo y se arrodilla ante el yunque."),
      "Un titán de hierro golpea un yunque al ritmo de un tambor. Su martillo cuenta los golpes en voz alta y exige repetición exacta.",
      [
        ch(
          "El titán levanta el martillo: «¡Suma solo los golpes PARES, del 1 hasta n!»",
          `El for de Java: for (int i = 1; i <= n; i++) { ... }\nUn número es par si i % 2 == 0.\n\nEscribe «static int sumaPares(int n)» que devuelva la suma de los pares entre 1 y n. sumaPares(10) → 30. Usa un ciclo for.`,
          r`public class Forja {
    // Escribe aquí sumaPares
}`,
          r`public class Forja {
    static int sumaPares(int n) {
        int total = 0;
        for (int i = 1; i <= n; i++) {
            if (i % 2 == 0) {
                total += i;
            }
        }
        return total;
    }
}`,
          [T("sumaPares(10)", 30), T("sumaPares(1)", 0), T("sumaPares(7)", 12), T("sumaPares(100)", 2550, true)],
          ["Declara int total = 0 antes del ciclo.", "Dentro del for: if (i % 2 == 0) total += i;"],
          [need("\\bfor\\s*\\(", "En esta ronda debes usar un ciclo for")],
        ),
        ch(
          "El titán gira su yunque: «¡Ahora invierte las cifras de este número!»",
          `Con while puedes extraer cifras: n % 10 es la última cifra y n / 10 (entera) la quita.\n\nEscribe «static int invertirNumero(int n)» (n ≥ 0). invertirNumero(123) → 321, invertirNumero(100) → 1. Usa un ciclo while.`,
          r`public class Forja {
    // Escribe aquí invertirNumero
}`,
          r`public class Forja {
    static int invertirNumero(int n) {
        int r = 0;
        while (n > 0) {
            r = r * 10 + n % 10;
            n = n / 10;
        }
        return r;
    }
}`,
          [T("invertirNumero(123)", 321), T("invertirNumero(100)", 1), T("invertirNumero(5)", 5), T("invertirNumero(9876)", 6789, true)],
          ["En cada vuelta: r = r * 10 + n % 10; luego n = n / 10;", "El ciclo termina cuando n llega a 0."],
          [need("\\bwhile\\s*\\(", "En esta ronda debes usar un ciclo while")],
        ),
      ],
    ),
    node(
      "d5n5",
      "Jefe: Strings en Java",
      "boss",
      mon("Gorrim, Herrero de Tipos", "👿", 400, "#ff5a2a", "«Yo escribí las Leyes de Hierro. ¡Un tipo equivocado y te forjo en cadenas!»", "Gorrim cae sobre su yunque: «Los tipos... eran para protegerlos...»"),
      "En el corazón de la fragua, Gorrim forja palabras en hierro candente. Cada String es una cadena de caracteres: tres hechizos para romper sus cadenas.",
      [
        ch(
          "Gorrim levanta una cadena al rojo vivo: «¡Dame la palabra... al revés!»",
          `Un String tiene métodos: s.length(), s.charAt(i), s.substring(a, b), s.toUpperCase()... Las posiciones empiezan en 0.\nUn texto se construye con +=.\n\nEscribe «static String invertir(String s)». invertir("abc") → "cba".`,
          r`public class Forja {
    // Escribe aquí invertir
}`,
          r`public class Forja {
    static String invertir(String s) {
        String r = "";
        for (int i = s.length() - 1; i >= 0; i--) {
            r += s.charAt(i);
        }
        return r;
    }
}`,
          [T('invertir("abc")', "cba"), T('invertir("")', ""), T('invertir("Ferrum")', "murreF"), T('invertir("a")', "a", true)],
          ["Recorre desde s.length() - 1 hasta 0 con i--.", "r += s.charAt(i);"],
          [need("static\\s+String\\s+invertir\\s*\\(\\s*String\\s+\\w+\\s*\\)", "Declara: static String invertir(String s)")],
        ),
        ch(
          "«Cuenta las vocales de esta runa», gruñe Gorrim.",
          `Un char se compara con comillas simples: c == 'a'. Character.toLowerCase(c) ayuda con las mayúsculas.\n\nEscribe «static int contarVocales(String s)» (a, e, i, o, u; mayúsculas o minúsculas). contarVocales("Murcielago") → 5.`,
          r`public class Forja {
    // Escribe aquí contarVocales
}`,
          r`public class Forja {
    static int contarVocales(String s) {
        int cuenta = 0;
        String vocales = "aeiou";
        for (int i = 0; i < s.length(); i++) {
            char c = Character.toLowerCase(s.charAt(i));
            if (vocales.indexOf(c) >= 0) {
                cuenta++;
            }
        }
        return cuenta;
    }
}`,
          [T('contarVocales("Murcielago")', 5), T('contarVocales("xyz")', 0), T('contarVocales("AEIOU")', 5), T('contarVocales("")', 0, true)],
          ["Pasa cada carácter a minúscula y revisa si es una vocal.", "vocales.indexOf(c) >= 0 indica que c está dentro de \"aeiou\"."],
          [need("static\\s+int\\s+contarVocales", "Declara: static int contarVocales(String s)")],
        ),
        ch(
          "Gorrim se tambalea: «Una última cadena... ¡un espejo de letras!»",
          `Un palíndromo se lee igual de ida y vuelta: "reconocer".\n\nEscribe «static boolean esPalindromo(String s)». Compara el primer carácter con el último, el segundo con el penúltimo...\nPara comparar chars usa != o ==.`,
          r`public class Forja {
    // Escribe aquí esPalindromo
}`,
          r`public class Forja {
    static boolean esPalindromo(String s) {
        int i = 0;
        int j = s.length() - 1;
        while (i < j) {
            if (s.charAt(i) != s.charAt(j)) {
                return false;
            }
            i++;
            j--;
        }
        return true;
    }
}`,
          [T('esPalindromo("reconocer")', true), T('esPalindromo("hola")', false), T('esPalindromo("a")', true), T('esPalindromo("abba")', true, true), T('esPalindromo("abca")', false, true)],
          ["Usa dos índices: uno al inicio (i) y otro al final (j).", "Si s.charAt(i) != s.charAt(j) devuelve false; al terminar, true."],
          [need("static\\s+boolean\\s+esPalindromo", "Declara: static boolean esPalindromo(String s)")],
        ),
      ],
    ),
  ],
};
