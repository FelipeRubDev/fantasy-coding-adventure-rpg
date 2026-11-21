import type { Dungeon } from "@/lib/types";
import { T, ch, mon, need, node, r } from "./helpers";

export const D6: Dungeon = {
  id: "d6",
  n: 6,
  campaign: 2,
  lang: "java",
  name: "El Archivo Abismal",
  subtitle: "Java II · Arreglos, matrices, ArrayList y HashMap",
  blurb: "Millones de nombres borrados caen en un pozo sin fondo. Para recuperarlos debes dominar las estructuras que guardan datos: arreglos, listas y mapas.",
  intro:
    "Las estanterías descienden en espiral hasta donde no llega la luz. Cada libro está vacío: alguien arrancó los nombres. «Para organizar tantos datos necesitas estructuras», dice Corvo, aterrizando en un atril. «Arreglos de tamaño fijo, ArrayList que crece, HashMap que asocia claves con valores. Y recuerda importar: java.util.*». (Aquí puedes usarlas sin escribir los import.)",
  outro:
    "El Bibliotecario Hueco se vacía como un libro sin tinta. En el fondo del pozo hay un único libro con tapa negra. Lo abres: está escrito con TU letra. «Yo mismo me borré», dice una voz tuya en el papel. «El Silencio no destruye los nombres... los esconde donde nadie mira: dentro de quien los lleva». Arriba, el Trono te espera.",
  img: "/img/d6.jpg",
  sigItem: "lente_abismal",
  nodes: [
    node(
      "d6n1",
      "Arreglos: int[] y recorrido",
      "normal",
      mon("Polilla de Tinta", "🦋", 40, "#7ab8ff", "«Me alimento de letras... ¡y de arreglos desordenados!»", "La polilla se deshace en una nube de tinta."),
      "Una polilla gigante revolotea sobre una pila de números. Quiere que le digas cuánto suman.",
      [
        ch(
          "La polilla agita las alas sobre un arreglo de lingotes: «¿Cuánto suman todos?»",
          `Un arreglo guarda varios valores del mismo tipo: int[] a = {1, 2, 3}; Su tamaño es a.length y las posiciones empiezan en 0.\n\nEscribe «static int suma(int[] a)» que devuelva la suma de todos sus elementos (0 si está vacío).`,
          r`public class Archivo {
    // Escribe aquí suma
}`,
          r`public class Archivo {
    static int suma(int[] a) {
        int total = 0;
        for (int i = 0; i < a.length; i++) {
            total += a[i];
        }
        return total;
    }
}`,
          [T("suma(new int[]{1, 2, 3})", 6), T("suma(new int[]{})", 0), T("suma(new int[]{-5, 5, 10})", 10, true)],
          ["Recorre con for (int i = 0; i < a.length; i++).", "total += a[i];"],
          [need("static\\s+int\\s+suma\\s*\\(\\s*int\\s*\\[\\]\\s*\\w+\\s*\\)", "Declara: static int suma(int[] a)")],
        ),
      ],
    ),
    node(
      "d6n2",
      "Buscar dentro de un arreglo",
      "normal",
      mon("Escriba Hueco", "🧟", 40, "#c9c0a0", "«Busco un nombre perdido... ¿en qué casillero está?»", "El escriba se pliega como una hoja vieja."),
      "Un escriba sin rostro recorre una estantería murmurando posiciones. Necesita saber en qué lugar está un dato.",
      [
        ch(
          "El escriba te extiende un arreglo: «Dime la POSICIÓN de este valor... o -1 si no está.»",
          `Para buscar recorre el arreglo y compara cada elemento. Si lo encuentras, devuelve el índice i; si terminas el ciclo, devuelve -1.\n\nEscribe «static int indiceDe(int[] a, int x)». indiceDe({5,8,2}, 8) → 1.`,
          r`public class Archivo {
    // Escribe aquí indiceDe
}`,
          r`public class Archivo {
    static int indiceDe(int[] a, int x) {
        for (int i = 0; i < a.length; i++) {
            if (a[i] == x) {
                return i;
            }
        }
        return -1;
    }
}`,
          [T("indiceDe(new int[]{5, 8, 2}, 8)", 1), T("indiceDe(new int[]{5, 8, 2}, 9)", -1), T("indiceDe(new int[]{1, 1}, 1)", 0), T("indiceDe(new int[]{}, 3)", -1, true)],
          ["Si a[i] == x devuelve i inmediatamente.", "El return -1 va DESPUÉS del ciclo."],
          [need("static\\s+int\\s+indiceDe", "Declara: static int indiceDe(int[] a, int x)")],
        ),
      ],
    ),
    node(
      "d6n3",
      "Matrices: arreglos de arreglos",
      "elite",
      mon("Araña Bibliotecaria", "🕸️", 120, "#d0a8ff", "«Mi telaraña tiene filas y columnas... ¡y tú eres la mosca!»", "La araña se enreda en sus propias filas y columnas."),
      "Una araña teje una red cuadriculada entre dos estanterías: filas y columnas, como las casillas de un tablero.",
      [
        ch(
          "La araña toca un hilo y vibra la matriz: «Suma todas mis casillas.»",
          `Una matriz es un arreglo de arreglos: int[][] m = {{1, 2}, {3, 4}}; m[fila][columna]. m.length son las filas y m[0].length las columnas.\n\nEscribe «static int sumaMatriz(int[][] m)» con dos ciclos for anidados.`,
          r`public class Archivo {
    // Escribe aquí sumaMatriz
}`,
          r`public class Archivo {
    static int sumaMatriz(int[][] m) {
        int total = 0;
        for (int i = 0; i < m.length; i++) {
            for (int j = 0; j < m[i].length; j++) {
                total += m[i][j];
            }
        }
        return total;
    }
}`,
          [T("sumaMatriz(new int[][]{{1, 2}, {3, 4}})", 10), T("sumaMatriz(new int[][]{{5}})", 5), T("sumaMatriz(new int[][]{{1, 1, 1}, {2, 2, 2}})", 9, true)],
          ["El ciclo externo recorre filas (m.length); el interno, columnas (m[i].length).", "total += m[i][j];"],
          [need("\\bfor\\s*\\([\\s\\S]*\\bfor\\s*\\(", "Usa dos ciclos for anidados")],
        ),
        ch(
          "«Ahora voltea mi red: lo que era fila se vuelve columna», sisea la araña.",
          `La traspuesta de una matriz intercambia filas por columnas: t[j][i] = m[i][j].\n\nEscribe «static int[][] trasponer(int[][] m)» que devuelva la traspuesta. Una matriz de 2x3 se convierte en una de 3x2.`,
          r`public class Archivo {
    // Escribe aquí trasponer
}`,
          r`public class Archivo {
    static int[][] trasponer(int[][] m) {
        int filas = m.length;
        int cols = m[0].length;
        int[][] t = new int[cols][filas];
        for (int i = 0; i < filas; i++) {
            for (int j = 0; j < cols; j++) {
                t[j][i] = m[i][j];
            }
        }
        return t;
    }
}`,
          [T("trasponer(new int[][]{{1, 2, 3}, {4, 5, 6}})", [[1, 4], [2, 5], [3, 6]]), T("trasponer(new int[][]{{7}})", [[7]]), T("trasponer(new int[][]{{1, 2}, {3, 4}})", [[1, 3], [2, 4]], true)],
          ["Crea la nueva matriz con new int[cols][filas].", "Dentro de los dos ciclos: t[j][i] = m[i][j];"],
        ),
      ],
    ),
    node(
      "d6n4",
      "ArrayList: listas que crecen",
      "miniboss",
      mon("Gólem de Pergaminos", "📚", 220, "#e0c080", "«Soy mil páginas... ¡y todas apuntan hacia ti!»", "El gólem se desparrama en un montón de hojas sueltas."),
      "Un gólem hecho de pergaminos apilados bloquea el pasillo. Su cuerpo crece o se encoge según los datos que absorbe, como una lista dinámica.",
      [
        ch(
          "El gólem se infla con cada página: «Filtra... ¡solo los números pares!»",
          `ArrayList<Integer> es una lista que crece: lista.add(x), lista.get(i), lista.size(), lista.contains(x).\n\nEscribe «static ArrayList<Integer> pares(int[] a)» que devuelva una lista con los números pares del arreglo, en orden.`,
          r`public class Archivo {
    // Escribe aquí pares
}`,
          r`public class Archivo {
    static ArrayList<Integer> pares(int[] a) {
        ArrayList<Integer> res = new ArrayList<>();
        for (int x : a) {
            if (x % 2 == 0) {
                res.add(x);
            }
        }
        return res;
    }
}`,
          [T("pares(new int[]{1, 2, 3, 4})", [2, 4]), T("pares(new int[]{1, 3})", []), T("pares(new int[]{10, 11, 12, 0})", [10, 12, 0], true)],
          ["Crea la lista con new ArrayList<>() y agrega con .add(x).", "Puedes recorrer el arreglo con for (int x : a)."],
          [need("\\bArrayList\\b", "Usa un ArrayList")],
        ),
        ch(
          "«Una segunda prueba: ¡quita los nombres repetidos!», ruge el gólem.",
          `lista.contains(x) dice si x ya está en la lista.\n\nEscribe «static ArrayList<Integer> sinDuplicados(int[] a)» que devuelva los elementos sin repetir, conservando el orden de primera aparición. {1,2,2,3,1} → [1, 2, 3].`,
          r`public class Archivo {
    // Escribe aquí sinDuplicados
}`,
          r`public class Archivo {
    static ArrayList<Integer> sinDuplicados(int[] a) {
        ArrayList<Integer> res = new ArrayList<>();
        for (int x : a) {
            if (!res.contains(x)) {
                res.add(x);
            }
        }
        return res;
    }
}`,
          [T("sinDuplicados(new int[]{1, 2, 2, 3, 1})", [1, 2, 3]), T("sinDuplicados(new int[]{})", []), T("sinDuplicados(new int[]{4, 4, 4})", [4], true)],
          ["Agrega x solo si NO está ya en la lista: if (!res.contains(x)).", "Devuelve la lista al terminar."],
          [need("\\bArrayList\\b", "Usa un ArrayList"), need("\\.contains\\s*\\(", "Usa .contains() para evitar repetidos")],
        ),
      ],
    ),
    node(
      "d6n5",
      "Jefe: HashMap, claves y valores",
      "boss",
      mon("El Bibliotecario Hueco", "🧛", 400, "#7affc8", "«Yo catalogué los nombres... y los borré uno por uno. Tú serás el último índice.»", "El Bibliotecario se vacía: «Ya... no hay nada... que catalogar...»"),
      "En el fondo del Archivo, un bibliotecario sin rostro consulta un fichero infinito de claves y valores. Cada ficha es un HashMap. Tres hechizos para vaciar su catálogo.",
      [
        ch(
          "El Bibliotecario saca una ficha: «¿Cuántas veces aparece el nombre MÁS repetido?»",
          `HashMap<Integer, Integer> asocia claves con valores: mapa.put(clave, valor), mapa.get(clave), mapa.containsKey(clave), mapa.getOrDefault(clave, 0).\n\nEscribe «static int frecuenciaMax(int[] a)» que devuelva cuántas veces aparece el elemento más repetido. {1,2,2,3,2} → 3. Usa un HashMap para contar.`,
          r`public class Archivo {
    // Escribe aquí frecuenciaMax
}`,
          r`public class Archivo {
    static int frecuenciaMax(int[] a) {
        HashMap<Integer, Integer> conteo = new HashMap<>();
        int max = 0;
        for (int x : a) {
            int veces = conteo.getOrDefault(x, 0) + 1;
            conteo.put(x, veces);
            if (veces > max) {
                max = veces;
            }
        }
        return max;
    }
}`,
          [T("frecuenciaMax(new int[]{1, 2, 2, 3, 2})", 3), T("frecuenciaMax(new int[]{5})", 1), T("frecuenciaMax(new int[]{})", 0), T("frecuenciaMax(new int[]{7, 7, 8, 8, 8, 7, 7})", 4, true)],
          ["Cuenta con conteo.put(x, conteo.getOrDefault(x, 0) + 1).", "Lleva una variable max que se actualice con cada conteo."],
          [need("\\bHashMap\\b", "Usa un HashMap para contar")],
        ),
        ch(
          "«Dos nombres con las mismas letras... ¿son anagramas?», susurra.",
          `Dos palabras son anagramas si usan exactamente las mismas letras (amor / roma). Un truco: un arreglo int[26] cuenta cada letra: cuenta[c - 'a']++.\n\nEscribe «static boolean sonAnagramas(String a, String b)» (solo minúsculas a-z).`,
          r`public class Archivo {
    // Escribe aquí sonAnagramas
}`,
          r`public class Archivo {
    static boolean sonAnagramas(String a, String b) {
        if (a.length() != b.length()) {
            return false;
        }
        int[] cuenta = new int[26];
        for (int i = 0; i < a.length(); i++) {
            cuenta[a.charAt(i) - 'a']++;
            cuenta[b.charAt(i) - 'a']--;
        }
        for (int n : cuenta) {
            if (n != 0) {
                return false;
            }
        }
        return true;
    }
}`,
          [T('sonAnagramas("amor", "roma")', true), T('sonAnagramas("hola", "halo")', true), T('sonAnagramas("sol", "luna")', false), T('sonAnagramas("abc", "abd")', false, true), T('sonAnagramas("", "")', true, true)],
          ["Si las longitudes difieren, no pueden ser anagramas.", "Suma 1 por cada letra de a y resta 1 por cada letra de b: todo debe quedar en 0."],
          [need("static\\s+boolean\\s+sonAnagramas", "Declara: static boolean sonAnagramas(String a, String b)")],
        ),
        ch(
          "El último fichero cae al suelo. «Dos números... suman el objetivo... ¿en qué posiciones están?»",
          `Con un HashMap guardas valor → índice y buscas el complemento en una sola pasada.\n\nEscribe «static int[] dosSumas(int[] a, int objetivo)» que devuelva {i, j} con i < j tal que a[i] + a[j] == objetivo. Si no hay, {-1, -1}.\ndosSumas({2,7,11,15}, 9) → {0, 1}`,
          r`public class Archivo {
    // Escribe aquí dosSumas
}`,
          r`public class Archivo {
    static int[] dosSumas(int[] a, int objetivo) {
        HashMap<Integer, Integer> vistos = new HashMap<>();
        for (int i = 0; i < a.length; i++) {
            int falta = objetivo - a[i];
            if (vistos.containsKey(falta)) {
                return new int[]{vistos.get(falta), i};
            }
            vistos.put(a[i], i);
        }
        return new int[]{-1, -1};
    }
}`,
          [T("dosSumas(new int[]{2, 7, 11, 15}, 9)", [0, 1]), T("dosSumas(new int[]{3, 2, 4}, 6)", [1, 2]), T("dosSumas(new int[]{3, 3}, 6)", [0, 1]), T("dosSumas(new int[]{1, 2}, 10)", [-1, -1], true)],
          ["Para cada a[i], calcula falta = objetivo - a[i] y busca si ya la viste.", "Si vistos.containsKey(falta) devuelve new int[]{vistos.get(falta), i}; si no, vistos.put(a[i], i)."],
          [need("\\bHashMap\\b", "Usa un HashMap")],
        ),
      ],
    ),
  ],
};
