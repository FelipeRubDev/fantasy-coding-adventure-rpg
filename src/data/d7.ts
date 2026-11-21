import type { Dungeon } from "@/lib/types";
import { OUT, T, ch, mon, need, node, r } from "./helpers";

const MONSTRUO = r`class Monstruo {
    protected String nombre;

    Monstruo(String nombre) {
        this.nombre = nombre;
    }

    String getNombre() {
        return nombre;
    }

    String rugir() {
        return "Grrr";
    }
}
`;

export const D7: Dungeon = {
  id: "d7",
  n: 7,
  campaign: 2,
  lang: "java",
  name: "El Trono del Silencio",
  subtitle: "Java III · Objetos, herencia, excepciones y recursión",
  blurb: "Al fin llegas al lugar donde todo se borra. Para enfrentar al Silencio necesitas el nivel más alto: clases y objetos, herencia, excepciones y recursión.",
  intro:
    "El Trono flota sobre un vacío rojo. No hay paredes: solo ceniza que cae hacia arriba y estrellas que se apagan. «Aquí ya no basta con funciones», dice Corvo con voz temblorosa. «Hay que modelar el mundo: clases con campos y métodos, objetos que nacen con new, herencia con extends. Y cuando todo falle... try y catch». Respira. Es la última batalla.",
  outro:
    "El Silencio se detiene frente a tu nombre recién escrito. Por primera vez, algo suena en el vacío: una nota, luego otra... Tu nombre. Corvo canta. Maelith aparece entre las estrellas, sonriendo. «Escribir es recordar, mi niña. Y recordar es la única forma de que nada se pierda». El Códice se reescribe, página a página. Los nombres regresan. FIN DE LA CAMPAÑA II. Pero las historias, como los programas, siempre admiten una línea más...",
  img: "/img/d7.jpg",
  sigItem: "corona_silencio",
  nodes: [
    node(
      "d7n1",
      "Clases y objetos",
      "normal",
      mon("Eco de Guerrero", "🗡️", 40, "#ff6a6a", "«Fui un héroe... ya no recuerdo mi nombre.»", "El eco se deshace en un suspiro metálico."),
      "Un guerrero translúcido repite el movimiento de su última batalla. No tiene nombre ni historia: hay que darle una forma con una clase.",
      [
        ch(
          "El eco extiende una mano vacía: «Dame forma... un nombre... una vida...»",
          `Una clase es un molde para crear objetos. Tiene campos (datos), un constructor (cómo nace) y métodos:\n\nclass Moneda {\n    private int valor;\n    Moneda(int valor) { this.valor = valor; }\n    int getValor() { return valor; }\n}\n\nEscribe la clase «Heroe» con campos PRIVADOS nombre (String) y vida (int), un constructor Heroe(String nombre, int vida) y los métodos getNombre() y getVida().`,
          r`class Heroe {
    // campos, constructor y getters
}`,
          r`class Heroe {
    private String nombre;
    private int vida;

    Heroe(String nombre, int vida) {
        this.nombre = nombre;
        this.vida = vida;
    }

    String getNombre() {
        return nombre;
    }

    int getVida() {
        return vida;
    }
}`,
          [T('new Heroe("Ana", 50).getVida()', 50), T('new Heroe("Ana", 50).getNombre()', "Ana"), T('new Heroe("Bruno", 80).getVida()', 80, true)],
          ["this.nombre = nombre; guarda el parámetro en el campo.", "Los getters solo hacen return del campo."],
          [need("class\\s+Heroe", "Declara la clase Heroe"), need("\\bprivate\\b", "Los campos deben ser private (encapsulamiento)"), need("this\\s*\\.", "Usa this para asignar los campos en el constructor")],
        ),
      ],
    ),
    node(
      "d7n2",
      "Encapsulamiento: métodos que protegen datos",
      "normal",
      mon("Sombra Reflejada", "🌑", 40, "#9090ff", "«Mi oro es secreto... solo yo decido quién lo toca.»", "La sombra se disipa y deja caer un puñado de monedas."),
      "Una sombra vigila un cofre oscuro. Solo permite depositar o retirar si sus reglas se cumplen: nadie toca el oro directamente.",
      [
        ch(
          "«Quien quiera mi oro debe pasar por mis reglas», susurra la sombra.",
          `Encapsular es ocultar los datos (private) y exponer métodos que respetan reglas.\n\nEscribe la clase «Cofre» con un campo privado int oro, un constructor Cofre(int oroInicial) y los métodos:\n• void depositar(int cantidad): suma al oro\n• boolean retirar(int cantidad): si hay suficiente oro lo descuenta y devuelve true; si no, devuelve false y no cambia nada\n• int getOro()`,
          r`class Cofre {
    // tu hechizo aquí
}`,
          r`class Cofre {
    private int oro;

    Cofre(int oroInicial) {
        this.oro = oroInicial;
    }

    void depositar(int cantidad) {
        oro += cantidad;
    }

    boolean retirar(int cantidad) {
        if (cantidad > oro) {
            return false;
        }
        oro -= cantidad;
        return true;
    }

    int getOro() {
        return oro;
    }
}`,
          [
            T("new Cofre(10).getOro()", 10),
            T("Cofre c = new Cofre(10); c.depositar(5); c.getOro()", 15),
            T("Cofre c = new Cofre(10); c.retirar(4); c.getOro()", 6),
            T("new Cofre(10).retirar(11)", false),
            T("Cofre c = new Cofre(10); c.retirar(11); c.getOro()", 10, true),
          ],
          ["retirar devuelve false (sin cambiar nada) si cantidad > oro.", "Si alcanza: oro -= cantidad; return true;"],
          [need("\\bprivate\\s+int\\s+oro", "El campo oro debe ser private int oro")],
        ),
      ],
    ),
    node(
      "d7n3",
      "Herencia y polimorfismo",
      "elite",
      mon("Caballero Caído", "🛡️", 120, "#a0a0c0", "«Sirvo a un rey que ya no existe... ¿tú a quién sirves?»", "El caballero apoya su espada en el suelo y se desvanece, en paz."),
      "Un caballero de armadura rota monta guardia ante el trono. Cada golpe tuyo debe respetar la jerarquía: padre, hijo y nietos.",
      [
        ch(
          "El caballero señala una clase base: «Todos los monstruos rugen igual... salvo uno. Crea al dragón.»",
          `La herencia permite que una clase hija reutilice a su padre: class Dragon extends Monstruo. El constructor llama al del padre con super(...). Con @Override cambias un método heredado.\n\nYa existe la clase Monstruo (rugir() devuelve "Grrr"). Escribe la clase «Dragon» que EXTIENDA a Monstruo, tenga un constructor Dragon(String nombre) y cuyo rugir() devuelva "ROOOAR".`,
          MONSTRUO + r`
// Escribe aquí la clase Dragon
`,
          MONSTRUO + r`
class Dragon extends Monstruo {
    Dragon(String nombre) {
        super(nombre);
    }

    @Override
    String rugir() {
        return "ROOOAR";
    }
}`,
          [T('new Dragon("Smaug").rugir()', "ROOOAR"), T('new Dragon("Smaug").getNombre()', "Smaug"), T('new Monstruo("Rata").rugir()', "Grrr")],
          ["Declara: class Dragon extends Monstruo { ... }", "En el constructor: super(nombre); y sobrescribe rugir()."],
          [need("class\\s+Dragon\\s+extends\\s+Monstruo", "Dragon debe extender (extends) a Monstruo"), need("\\bsuper\\s*\\(", "Llama al constructor del padre con super(...)")],
        ),
        ch(
          "«El polimorfismo es mi lema: cada criatura rugirá a su manera», dice el caballero.",
          `Polimorfismo: una variable del tipo padre puede apuntar a un objeto hijo, y se ejecuta el método del hijo real.\n\nYa existen Monstruo y Dragon. Escribe una clase «Arena» con el método «static String presentar(Monstruo m)» que devuelva el nombre, dos puntos, un espacio y su rugido. Ej: "Smaug: ROOOAR".`,
          MONSTRUO +
            r`
class Dragon extends Monstruo {
    Dragon(String nombre) { super(nombre); }

    @Override
    String rugir() { return "ROOOAR"; }
}

// Escribe aquí la clase Arena
`,
          MONSTRUO +
            r`
class Dragon extends Monstruo {
    Dragon(String nombre) { super(nombre); }

    @Override
    String rugir() { return "ROOOAR"; }
}

class Arena {
    static String presentar(Monstruo m) {
        return m.getNombre() + ": " + m.rugir();
    }
}`,
          [T('presentar(new Dragon("Smaug"))', "Smaug: ROOOAR"), T('presentar(new Monstruo("Rata"))', "Rata: Grrr"), T('presentar(new Dragon("Ignis"))', "Ignis: ROOOAR", true)],
          ["No preguntes de qué tipo es: solo llama m.rugir().", "return m.getNombre() + \": \" + m.rugir();"],
          [need("static\\s+String\\s+presentar\\s*\\(\\s*Monstruo", "Declara: static String presentar(Monstruo m)")],
        ),
      ],
    ),
    node(
      "d7n4",
      "Excepciones: try / catch / throw",
      "miniboss",
      mon("Heraldo Mudo", "📯", 220, "#ffb060", "«Anuncio lo imposible: ¡división por cero!»", "El heraldo suelta su cuerno y calla para siempre."),
      "Un heraldo sin lengua sopla un cuerno que provoca errores en el aire. Para sobrevivir debes capturar sus desastres antes de que te alcancen.",
      [
        ch(
          "El heraldo sopla: «¡DIVIDE... entre cero!» El aire se rompe.",
          `Una excepción interrumpe el programa cuando algo sale mal (por ejemplo 5 / 0 lanza ArithmeticException). Con try / catch puedes capturarla:\n\ntry {\n    ...\n} catch (ArithmeticException e) {\n    ...\n}\n\nEscribe «static int dividirSeguro(int a, int b)» que devuelva a / b, pero devuelva -1 si b es 0 (captura la excepción con try / catch).`,
          r`public class Trono {
    // Escribe aquí dividirSeguro
}`,
          r`public class Trono {
    static int dividirSeguro(int a, int b) {
        try {
            return a / b;
        } catch (ArithmeticException e) {
            return -1;
        }
    }
}`,
          [T("dividirSeguro(10, 2)", 5), T("dividirSeguro(5, 0)", -1), T("dividirSeguro(-9, 3)", -3, true), T("dividirSeguro(0, 5)", 0, true)],
          ["Pon la división dentro de try { ... }.", "catch (ArithmeticException e) { return -1; }"],
          [need("\\btry\\b[\\s\\S]*\\bcatch\\b", "Usa try / catch")],
        ),
        ch(
          "«Ahora los números que llegan como texto... ¡algunos son mentira!», ríe el heraldo sin voz.",
          `Integer.parseInt("42") convierte un texto en int, pero lanza NumberFormatException si el texto no es un número.\n\nEscribe «static int parsearOro(String s)» que devuelva el número, o 0 si el texto no es válido.`,
          r`public class Trono {
    // Escribe aquí parsearOro
}`,
          r`public class Trono {
    static int parsearOro(String s) {
        try {
            return Integer.parseInt(s);
        } catch (NumberFormatException e) {
            return 0;
        }
    }
}`,
          [T('parsearOro("42")', 42), T('parsearOro("abc")', 0), T('parsearOro("")', 0), T('parsearOro("7x")', 0, true), T('parsearOro("-15")', -15, true)],
          ["Intenta convertir dentro de try y captura NumberFormatException.", "return Integer.parseInt(s);"],
          [need("\\btry\\b[\\s\\S]*\\bcatch\\b", "Usa try / catch")],
        ),
      ],
    ),
    node(
      "d7n5",
      "Jefe final: recursión y tu nombre",
      "boss",
      mon("El Silencio", "🌑", 500, "#ff2a4a", "«No destruyo nada. Solo... dejo de nombrarlo. Y lo que no se nombra, no existió.»", "El Silencio retrocede. Una nota. Otra. Y por fin... tu voz."),
      "El Silencio no tiene forma: es un hueco que se agranda donde antes había palabras. Sabe tu nombre, pero no puede decirlo. Solo tú puedes escribirlo. Pero antes debes demostrar que dominas la recursión: un método que se llama a sí mismo.",
      [
        ch(
          "El vacío se contrae y se expande. «Un nombre... dentro de otro nombre... dentro de otro...»",
          `Un método recursivo se llama a sí mismo y siempre necesita un caso base (donde se detiene).\n\nEscribe «static int factorial(int n)» de forma RECURSIVA: factorial(0) = 1, factorial(n) = n × factorial(n - 1). factorial(5) → 120.`,
          r`public class Trono {
    // Escribe aquí factorial (recursivo)
}`,
          r`public class Trono {
    static int factorial(int n) {
        if (n <= 1) {
            return 1;
        }
        return n * factorial(n - 1);
    }
}`,
          [T("factorial(0)", 1), T("factorial(1)", 1), T("factorial(5)", 120), T("factorial(10)", 3628800, true)],
          ["Caso base: si n <= 1, devuelve 1.", "Caso recursivo: return n * factorial(n - 1);"],
          [need("factorial\\s*\\(\\s*n\\s*-\\s*1\\s*\\)", "El método debe llamarse a sí mismo: factorial(n - 1)")],
        ),
        ch(
          "El Silencio se parte en dos ecos que se persiguen: «Uno... y otro... y la suma de ambos...»",
          `Fibonacci: 0, 1, 1, 2, 3, 5, 8... cada término es la suma de los dos anteriores.\n\nEscribe «static int fibonacci(int n)» de forma RECURSIVA (fibonacci(0)=0, fibonacci(1)=1). fibonacci(10) → 55.`,
          r`public class Trono {
    // Escribe aquí fibonacci (recursivo)
}`,
          r`public class Trono {
    static int fibonacci(int n) {
        if (n < 2) {
            return n;
        }
        return fibonacci(n - 1) + fibonacci(n - 2);
    }
}`,
          [T("fibonacci(0)", 0), T("fibonacci(1)", 1), T("fibonacci(2)", 1), T("fibonacci(10)", 55), T("fibonacci(15)", 610, true)],
          ["Casos base: n = 0 → 0 y n = 1 → 1 (basta: if (n < 2) return n;).", "return fibonacci(n - 1) + fibonacci(n - 2);"],
          [need("fibonacci\\s*\\(\\s*n\\s*-\\s*1\\s*\\)[\\s\\S]*fibonacci\\s*\\(\\s*n\\s*-\\s*2\\s*\\)", "Llama a fibonacci(n - 1) y a fibonacci(n - 2)")],
        ),
        ch(
          "El Silencio retrocede. Ya no tiene fuerza. Su voz es un hilo: «Escríbelo... tu nombre... lo único que no pude borrar... porque estaba en tu mano.»",
          `Este es el último hechizo. Escribe un programa Java completo (clase «Final» con su método main) que IMPRIMA TU NOMBRE con System.out.println.\n\nTu nombre de Escriba es: {{name}}\n\nEscríbelo a mano, letra por letra: es el verso que devuelve los nombres al mundo.`,
          r`public class Final {
    public static void main(String[] args) {
        // Escribe aquí tu nombre con System.out.println
    }
}`,
          r`public class Final {
    public static void main(String[] args) {
        System.out.println("{{name}}");
    }
}`,
          [OUT("{{name}}")],
          ["Usa System.out.println(\"tu nombre\"); dentro del main.", "El texto debe ser EXACTAMENTE tu nombre de Escriba, con las mismas mayúsculas."],
          [need("System\\s*\\.\\s*out\\s*\\.\\s*println", "Usa System.out.println")],
        ),
      ],
    ),
  ],
};
