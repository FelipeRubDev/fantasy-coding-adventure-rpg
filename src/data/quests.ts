import type { Challenge, Lang, Quest } from "@/lib/types";
import { IO, T, ch, need, r } from "./helpers";

const GIVERS = ["Brisa la Tabernera", "Ser Orlan el Cojo", "Madre Vesna", "Fennick el Buhonero", "Hermana Ilse", "El Bardo Tuerto"];
const FOES: [string, string][] = [
  ["Bandido de Camino", "🥷"],
  ["Rata Gigante", "🐀"],
  ["Espectro de Bodega", "👻"],
  ["Goblin Ladrón", "👺"],
  ["Murciélago Sediento", "🦇"],
  ["Gólem de Barro", "🗿"],
  ["Esqueleto Borracho", "💀"],
  ["Cuervo Maldito", "🐦‍⬛"],
  ["Slime Pegajoso", "🟢"],
];

let counter = 0;
function q(lang: Lang, id: string, title: string, flavor: string, gold: number, xp: number, c: Challenge): Quest {
  const k = counter++;
  const [name, icon] = FOES[k % FOES.length];
  return { id, lang, title, giver: GIVERS[k % GIVERS.length], flavor, icon, name, gold, xp, ch: c };
}

const pseudo: Quest[] = [
  q(
    "pseudo",
    "qp1",
    "Doble o nada",
    "«Mi apuesta es simple: lo que traigas, lo duplico.»",
    30,
    40,
    ch("Un bandido apuesta contigo.", `Lee un número «n» y escribe su doble (n × 2).`, "// Doble o nada\n", r`Leer n
Escribir n * 2`, [IO([4], "8"), IO([0], "0"), IO([-3], "-6", true), IO([21], "42", true)], ["Leer n y Escribir n * 2."], [need("\\bleer\\b", "Usa Leer")]),
  ),
  q(
    "pseudo",
    "qp2",
    "El mayor de tres",
    "«Tres sacos de oro. Dime cuál pesa más y es tuyo.»",
    35,
    45,
    ch(
      "Tres sacos sobre la mesa.",
      `Lee tres números «a», «b» y «c» y escribe el MAYOR de los tres.`,
      "// El saco más pesado\n",
      r`Leer a, b, c
mayor <- a
Si b > mayor Entonces
  mayor <- b
FinSi
Si c > mayor Entonces
  mayor <- c
FinSi
Escribir mayor`,
      [IO([1, 5, 3], "5"), IO([9, 2, 4], "9"), IO([-1, -5, -3], "-1"), IO([7, 7, 7], "7", true), IO([2, 3, 10], "10", true)],
      ["Parte suponiendo que a es el mayor y compáralo con b y con c."],
    ),
  ),
  q(
    "pseudo",
    "qp3",
    "Múltiplos de tres",
    "«Los goblins solo cuentan de tres en tres.»",
    35,
    50,
    ch(
      "El goblin tamborilea tres golpes.",
      `Lee «n» y escribe los múltiplos de 3 desde 3 hasta n (uno por línea). Usa Para con «Con Paso 3». Si n < 3 no escribas nada.`,
      "// De tres en tres\n",
      r`Leer n
Para i <- 3 Hasta n Con Paso 3 Hacer
  Escribir i
FinPara`,
      [IO([10], "3\n6\n9"), IO([2], ""), IO([3], "3"), IO([13], "3\n6\n9\n12", true)],
      ["Para i <- 3 Hasta n Con Paso 3 Hacer"],
      [need("\\bpara\\b[\\s\\S]*\\bpaso\\b", "Usa Para con Con Paso")],
    ),
  ),
  q(
    "pseudo",
    "qp4",
    "Promedio de la patrulla",
    "«Mis soldados son muchos... ¿cuánto miden de promedio?»",
    45,
    60,
    ch(
      "El capitán anota alturas en un pergamino.",
      `Lee «n» y luego n números. Escribe su PROMEDIO (suma ÷ n).`,
      "// Promedio de la patrulla\n",
      r`Leer n
suma <- 0
Para i <- 1 Hasta n Hacer
  Leer x
  suma <- suma + x
FinPara
Escribir suma / n`,
      [IO([3, 4, 6, 8], "6"), IO([2, 1, 2], "1.5"), IO([1, 5], "5"), IO([4, 2, 2, 2, 2], "2", true)],
      ["Acumula la suma dentro del Para y divide al final entre n."],
    ),
  ),
  q(
    "pseudo",
    "qp5",
    "Letras mudas",
    "«Un hechizo mudo esconde letras 'a'. Cuéntalas.»",
    50,
    70,
    ch(
      "Un cuervo grazna una palabra.",
      `Lee un texto «t» y escribe cuántas letras «a» (minúscula) contiene.\nTe sirven Longitud(t) y Subcadena(t, i, i), que devuelve la letra en la posición i (empieza en 1).`,
      "// Contar las 'a'\n",
      r`Leer t
cuenta <- 0
Para i <- 1 Hasta Longitud(t) Hacer
  Si Subcadena(t, i, i) = "a" Entonces
    cuenta <- cuenta + 1
  FinSi
FinPara
Escribir cuenta`,
      [IO(["banana"], "3"), IO(["xyz"], "0"), IO(["aaa"], "3"), IO(["Alabama"], "3", true)],
      ["Recorre desde 1 hasta Longitud(t) y compara Subcadena(t, i, i) con \"a\"."],
    ),
  ),
  q(
    "pseudo",
    "qp6",
    "Cubo mágico",
    "«Mi cofre solo se abre con un cubo perfecto.»",
    55,
    75,
    ch(
      "Un cofre con una runa de potencias.",
      `Escribe la función «cubo(x)» que devuelva x elevado al cubo (x × x × x).`,
      "Funcion r <- cubo(x)\n  // tu hechizo\nFinFuncion",
      r`Funcion r <- cubo(x)
  r <- x * x * x
FinFuncion`,
      [T("cubo(3)", 27), T("cubo(-2)", -8), T("cubo(0)", 0, true), T("cubo(10)", 1000, true)],
      ["Asigna el resultado a la variable r antes de FinFuncion."],
      [need("\\bfuncion\\b", "Define la función con Funcion")],
    ),
  ),
];

const js: Quest[] = [
  q(
    "js",
    "qj1",
    "El mayor del grupo",
    "«Mi caravana tiene muchos pesos. Dime el mayor.»",
    35,
    50,
    ch(
      "El buhonero extiende una lista de pesos.",
      `Escribe «maximo(arr)» que devuelva el mayor número del array (no vacío). Hazlo con un ciclo, sin usar Math.max.`,
      "function maximo(arr) {\n  // tu hechizo\n}",
      r`function maximo(arr) {
  let m = arr[0];
  for (const x of arr) {
    if (x > m) m = x;
  }
  return m;
}`,
      [T("maximo([3, 9, 2])", 9), T("maximo([-5, -1, -9])", -1), T("maximo([7])", 7, true)],
      ["Parte con m = arr[0] y actualízalo si encuentras uno mayor."],
      [need("\\b(for|while)\\b|\\.reduce\\(", "Recorre el array con un ciclo")],
    ),
  ),
  q(
    "js",
    "qj2",
    "Vocales perdidas",
    "«Las vocales se escaparon de mi libro. ¿Cuántas eran?»",
    40,
    60,
    ch(
      "La hermana Ilse sostiene un libro sin vocales.",
      `Escribe «contarVocales(texto)» que devuelva cuántas vocales (a e i o u, mayúsculas o minúsculas) tiene el texto.`,
      "function contarVocales(texto) {\n  // tu hechizo\n}",
      r`function contarVocales(texto) {
  let n = 0;
  for (const c of texto.toLowerCase()) {
    if ("aeiou".includes(c)) n++;
  }
  return n;
}`,
      [T('contarVocales("murcielago")', 5), T('contarVocales("xyz")', 0), T('contarVocales("AEIOU")', 5), T('contarVocales("")', 0, true)],
      ["Pasa el texto a minúsculas y revisa cada letra con \"aeiou\".includes(c)."],
    ),
  ),
  q(
    "js",
    "qj3",
    "Sin repetidos",
    "«Mi bodega tiene barriles duplicados. ¡Quita los repetidos!»",
    45,
    65,
    ch(
      "El tabernero señala una fila de barriles marcados.",
      `Escribe «sinDuplicados(arr)» que devuelva un array con los elementos sin repetir, conservando el orden de la primera aparición.\nsinDuplicados([1,2,2,3,1]) → [1,2,3]`,
      "function sinDuplicados(arr) {\n  // tu hechizo\n}",
      r`function sinDuplicados(arr) {
  const res = [];
  for (const x of arr) {
    if (!res.includes(x)) res.push(x);
  }
  return res;
}`,
      [T("sinDuplicados([1, 2, 2, 3, 1])", [1, 2, 3]), T("sinDuplicados([])", []), T("sinDuplicados([4, 4, 4])", [4], true)],
      ["Usa .includes(x) para saber si ya lo guardaste y .push(x) para guardarlo."],
    ),
  ),
  q(
    "js",
    "qj4",
    "Suma de dígitos",
    "«El código del cofre es la suma de sus dígitos.»",
    45,
    70,
    ch(
      "Un cofre con una cifra grabada.",
      `Escribe «sumaDigitos(n)» (n ≥ 0) que devuelva la suma de las cifras de n. sumaDigitos(123) → 6.`,
      "function sumaDigitos(n) {\n  // tu hechizo\n}",
      r`function sumaDigitos(n) {
  let suma = 0;
  while (n > 0) {
    suma += n % 10;
    n = Math.floor(n / 10);
  }
  return suma;
}`,
      [T("sumaDigitos(123)", 6), T("sumaDigitos(0)", 0), T("sumaDigitos(9999)", 36), T("sumaDigitos(1001)", 2, true)],
      ["n % 10 es la última cifra; Math.floor(n / 10) la elimina."],
    ),
  ),
  q(
    "js",
    "qj5",
    "Título solemne",
    "«Todo nombre noble empieza con mayúscula.»",
    55,
    80,
    ch(
      "El bardo ensaya un pregón.",
      `Escribe «capitalizar(texto)» que ponga en mayúscula la primera letra de cada palabra (separadas por un espacio). capitalizar("hola mundo") → "Hola Mundo".`,
      "function capitalizar(texto) {\n  // tu hechizo\n}",
      r`function capitalizar(texto) {
  const palabras = texto.split(" ");
  const res = [];
  for (const p of palabras) {
    if (p.length === 0) {
      res.push(p);
    } else {
      res.push(p[0].toUpperCase() + p.slice(1));
    }
  }
  return res.join(" ");
}`,
      [T('capitalizar("hola mundo")', "Hola Mundo"), T('capitalizar("a")', "A"), T('capitalizar("")', ""), T('capitalizar("el cuervo cojo")', "El Cuervo Cojo", true)],
      ["Divide con split(\" \"), cambia cada palabra y une con join(\" \").", "p[0].toUpperCase() + p.slice(1)"],
    ),
  ),
  q(
    "js",
    "qj6",
    "El segundo mejor",
    "«El campeón ya tiene su trofeo; yo quiero al subcampeón.»",
    60,
    90,
    ch(
      "Un torneo de espadachines.",
      `Escribe «segundoMayor(arr)» que devuelva el segundo valor MÁS GRANDE distinto (sin contar repetidos del mayor). Siempre habrá al menos dos valores distintos.\nsegundoMayor([5,3,9,9,7]) → 7`,
      "function segundoMayor(arr) {\n  // tu hechizo\n}",
      r`function segundoMayor(arr) {
  const unicos = [];
  for (const x of arr) {
    if (!unicos.includes(x)) unicos.push(x);
  }
  unicos.sort((a, b) => b - a);
  return unicos[1];
}`,
      [T("segundoMayor([5, 3, 9, 9, 7])", 7), T("segundoMayor([1, 2])", 1), T("segundoMayor([10, 10, 4, 4, 1])", 4, true)],
      ["Elimina repetidos, ordena de mayor a menor con sort((a, b) => b - a) y toma la posición 1."],
    ),
  ),
];

const java: Quest[] = [
  q(
    "java",
    "qa1",
    "El mayor de tres",
    "«Tres lingotes, un solo ganador.»",
    40,
    60,
    ch(
      "Un herrero compara lingotes.",
      `Escribe «static int maximo(int a, int b, int c)» que devuelva el mayor de los tres.`,
      "public class Taberna {\n    // tu método aquí\n}",
      r`public class Taberna {
    static int maximo(int a, int b, int c) {
        int m = a;
        if (b > m) m = b;
        if (c > m) m = c;
        return m;
    }
}`,
      [T("maximo(1, 5, 3)", 5), T("maximo(9, 2, 4)", 9), T("maximo(-1, -5, -3)", -1), T("maximo(7, 7, 7)", 7, true)],
      ["Parte con int m = a; y compáralo con b y con c."],
      [need("static\\s+int\\s+maximo\\s*\\(\\s*int\\s+\\w+\\s*,\\s*int\\s+\\w+\\s*,\\s*int", "Declara: static int maximo(int a, int b, int c)")],
    ),
  ),
  q(
    "java",
    "qa2",
    "Par o impar",
    "«Mis dados solo salen pares... ¿o impares?»",
    40,
    60,
    ch(
      "Una jugadora lanza dados trucados.",
      `Escribe «static String paridad(int n)» que devuelva "par" si n es par y "impar" si no.`,
      "public class Taberna {\n    // tu método aquí\n}",
      r`public class Taberna {
    static String paridad(int n) {
        if (n % 2 == 0) {
            return "par";
        }
        return "impar";
    }
}`,
      [T("paridad(4)", "par"), T("paridad(7)", "impar"), T("paridad(0)", "par", true), T("paridad(-3)", "impar", true)],
      ["Un número es par si n % 2 == 0."],
    ),
  ),
  q(
    "java",
    "qa3",
    "Potencia pura",
    "«Mi cofre se abre con una potencia exacta. Sin Math.pow.»",
    50,
    75,
    ch(
      "Un cofre con una runa de potencia.",
      `Escribe «static int potencia(int base, int exp)» (exp ≥ 0) que devuelva base elevado a exp usando un ciclo for. potencia(2, 10) → 1024.`,
      "public class Taberna {\n    // tu método aquí\n}",
      r`public class Taberna {
    static int potencia(int base, int exp) {
        int r = 1;
        for (int i = 0; i < exp; i++) {
            r *= base;
        }
        return r;
    }
}`,
      [T("potencia(2, 10)", 1024), T("potencia(5, 0)", 1), T("potencia(3, 3)", 27), T("potencia(-2, 3)", -8, true)],
      ["Multiplica r por base exactamente exp veces."],
      [need("\\bfor\\s*\\(|\\bwhile\\s*\\(", "Usa un ciclo (for o while)")],
    ),
  ),
  q(
    "java",
    "qa4",
    "Arreglo del revés",
    "«Mis sacos están en orden inverso. ¡Ponlos bien!»",
    55,
    80,
    ch(
      "Un carretero cargó el carro al revés.",
      `Escribe «static int[] invertir(int[] a)» que devuelva un NUEVO arreglo con los elementos en orden inverso.`,
      "public class Taberna {\n    // tu método aquí\n}",
      r`public class Taberna {
    static int[] invertir(int[] a) {
        int[] r = new int[a.length];
        for (int i = 0; i < a.length; i++) {
            r[i] = a[a.length - 1 - i];
        }
        return r;
    }
}`,
      [T("invertir(new int[]{1, 2, 3})", [3, 2, 1]), T("invertir(new int[]{})", []), T("invertir(new int[]{4, 5})", [5, 4], true)],
      ["Crea int[] r = new int[a.length]; y copia a[a.length - 1 - i] en r[i]."],
    ),
  ),
  q(
    "java",
    "qa5",
    "Cuenta palabras",
    "«El pregonero cobra por palabra. ¿Cuántas dijo?»",
    55,
    85,
    ch(
      "El pregonero grita su mensaje.",
      `Escribe «static int contarPalabras(String s)» que devuelva cuántas palabras (separadas por UN espacio) tiene el texto; 0 si está vacío.\nPista: s.split(" ") devuelve un arreglo de String.`,
      "public class Taberna {\n    // tu método aquí\n}",
      r`public class Taberna {
    static int contarPalabras(String s) {
        if (s.isEmpty()) {
            return 0;
        }
        String[] partes = s.split(" ");
        return partes.length;
    }
}`,
      [T('contarPalabras("hola mundo")', 2), T('contarPalabras("uno")', 1), T('contarPalabras("")', 0), T('contarPalabras("el cuervo cojo vuela")', 4, true)],
      ["s.split(\" \").length cuenta las partes, pero el texto vacío es un caso especial."],
    ),
  ),
  q(
    "java",
    "qa6",
    "Primo en Java",
    "«Solo los números primos pueden cruzar mi puente.»",
    65,
    95,
    ch(
      "Un troll cobra peaje en el puente.",
      `Escribe «static boolean esPrimo(int n)». Un primo es mayor que 1 y solo divisible entre 1 y sí mismo.`,
      "public class Taberna {\n    // tu método aquí\n}",
      r`public class Taberna {
    static boolean esPrimo(int n) {
        if (n < 2) {
            return false;
        }
        for (int i = 2; i * i <= n; i++) {
            if (n % i == 0) {
                return false;
            }
        }
        return true;
    }
}`,
      [T("esPrimo(1)", false), T("esPrimo(2)", true), T("esPrimo(15)", false), T("esPrimo(29)", true), T("esPrimo(0)", false, true), T("esPrimo(97)", true, true)],
      ["Descarta n < 2 y prueba divisores desde 2 hasta la raíz de n."],
    ),
  ),
];

export const QUESTS: Quest[] = [...pseudo, ...js, ...java];
export const QUEST_BY_ID: Record<string, Quest> = Object.fromEntries(QUESTS.map((x) => [x.id, x]));
