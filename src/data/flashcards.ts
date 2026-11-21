export type Topic='Fundamentos'|'Pseudocódigo'|'JavaScript'|'Java'|'MongoDB';
export interface Flashcard {id:string;topic:Topic;question:string;code?:string;choices:[string,string,string];explanation:string}
type Card=[question:string,answer:string,other1:string,other2:string,explanation:string,code?:string];
const bank:Record<Topic,Card[]>={
 Fundamentos:[
  ['Guarda un valor con un nombre para poder consultarlo o cambiarlo. ¿Qué es?','Una variable','Un operador','Un parámetro de salida','Una variable asocia un nombre con un valor. Un operador, en cambio, combina o transforma valores.'],
  ['¿Qué parte de una función recursiva impide que siga llamándose indefinidamente?','El caso base','El acumulador','El índice','El caso base devuelve un resultado sin otra llamada recursiva. Cada paso debe acercarse a él.'],
  ['¿Qué estructura devuelve primero el último elemento que entró?','Una pila','Una cola','Un conjunto','La pila sigue LIFO: último en entrar, primero en salir. Una cola sigue el orden contrario.'],
  ['Los viajeros se atienden según su orden de llegada. ¿Qué estructura representa esta regla?','Una cola','Una pila','Un árbol','La cola aplica FIFO: primero en entrar, primero en salir.'],
  ['Durante un recorrido, una variable conserva la suma de todo lo visto. ¿Cómo se llama?','Acumulador','Centinela','Índice','Un acumulador combina el valor anterior con la nueva entrada; para sumar suele empezar en cero.'],
  ['¿Qué algoritmo descarta la mitad de una lista ordenada en cada paso?','Búsqueda binaria','Búsqueda lineal','Ordenación burbuja','La búsqueda binaria compara con el elemento central. El orden de la lista permite descartar media lista.'],
  ['¿Qué significa que un recorrido de n elementos tenga coste O(n)?','El trabajo crece de forma lineal','Siempre tarda un segundo','El trabajo es constante','La cantidad de operaciones escala proporcionalmente con el tamaño de la entrada.'],
  ['Un valor especial como -1 indica el fin de una secuencia de datos. ¿Qué papel cumple?','Centinela','Índice inicial','Tipo de dato','El centinela marca una condición especial de control; no forma parte de los datos normales.'],
  ['¿Qué propiedad cumple una función pura?','Misma entrada, misma salida y sin efectos externos','Siempre devuelve un número','Nunca tiene parámetros','Una función pura depende de sus argumentos y no modifica estado externo.'],
  ['¿Qué caso de prueba comprueba mejor el límite de una regla «edad ≥ 18»?','Una persona de 18 años','Una persona de 40 años','Una persona de 60 años','El propio umbral distingue ≥ de >. Completa la prueba con un valor justo inferior.']
 ],
 Pseudocódigo:[
  ['¿Qué hace la flecha en esta instrucción?','Asigna un valor','Compara dos valores','Lee una entrada','La asignación guarda 7 en mana. No es una pregunta de igualdad.','mana <- 7'],
  ['¿Qué se muestra al ejecutar estas líneas?','8','5','3','Se evalúa el lado derecho con el valor anterior de oro; después se guarda el resultado.','oro <- 5\noro <- oro + 3\nEscribir oro'],
  ['¿Qué instrucción obtiene el siguiente dato de entrada y lo guarda en una variable?','Leer','Escribir','Dimension','Leer recibe datos; Escribir muestra resultados; Dimension reserva un arreglo.'],
  ['¿Cuántas vueltas da este ciclo, con ambos extremos incluidos?','4','3','5','La variable pasa por 2, 3, 4 y 5.','Para i <- 2 Hasta 5 Hacer\n  Escribir i\nFinPara'],
  ['¿Qué bloque se ejecuta al menos una vez antes de evaluar su condición?','Repetir … Hasta Que','Mientras … Hacer','Si … Entonces','Repetir comprueba su condición después de ejecutar el cuerpo.'],
  ['¿Qué valor produce este cálculo?','2','3','4','El operador % calcula el resto. 17 es 3 × 5 + 2.','17 % 5'],
  ['¿Cuándo resulta verdadera esta condición?','Cuando las dos comparaciones son verdaderas','Cuando al menos una es verdadera','Solo cuando ambas son falsas','Y exige que se cumplan las dos condiciones simultáneamente.','llave = 7 Y fuerza > 3'],
  ['En este grimorio los arreglos empiezan en 1. ¿Qué valor muestra el hechizo?','8','4','12','La segunda posición contiene 8. La convención de este pseudocódigo es de base 1.','a <- [4, 8, 12]\nEscribir a[2]'],
  ['¿Para qué sirve Sino?','Ejecutar la alternativa cuando Si es falso','Cerrar un ciclo','Declarar una función','Sino es la rama alternativa del condicional, no una condición independiente.'],
  ['¿Qué devuelve Longitud en este ejemplo?','4','3','5','La longitud cuenta los cuatro caracteres de la palabra, no el índice inicial.','Longitud("runa")']
 ],
 JavaScript:[
  ['¿Qué método crea un nuevo array transformando cada elemento?','map()','filter()','find()','map devuelve una transformación por elemento. filter decide qué elementos conservar.'],
  ['¿Cuál es el resultado de este código?','[2, 4]','[4, 8]','[1, 3]','filter conserva los valores cuyo resto entre 2 es cero.','[1, 2, 3, 4].filter(n => n % 2 === 0)'],
  ['¿Qué método combina los elementos de un array en un único resultado?','reduce()','slice()','includes()','reduce pasa un acumulador de una vuelta a la siguiente. Puede producir números, objetos u otros valores.'],
  ['¿Qué valor devuelve este acceso?','"Niebla"','"Alba"','undefined','JavaScript usa índices desde 0: el índice 1 es el segundo elemento.','["Alba", "Niebla"][1]'],
  ['¿Qué devuelve esta comparación?','false','true','Un error','La igualdad estricta compara sin convertir tipos. Un número y un texto son distintos.','3 === "3"'],
  ['¿Qué método añade un elemento al final del array original?','push()','pop()','shift()','push añade al final; pop retira del final; shift retira del principio.'],
  ['¿Qué obtiene esta expresión?','"Errante"','null','Un error','El operador ?? elige el valor de la derecha solo cuando el de la izquierda es null o undefined.','null ?? "Errante"'],
  ['¿Qué palabra permite reasignar una variable con alcance de bloque?','let','const','return','let permite reasignar. const impide cambiar la referencia de la variable.'],
  ['¿Cuántos valores conserva este conjunto?','2','3','1','Set almacena valores únicos. El segundo 4 no crea una entrada nueva.','new Set([4, 4, 8]).size'],
  ['¿Qué devuelve este fragmento?','[2, 3]','[1, 2]','[2, 3, 4]','slice incluye el inicio y excluye el índice final; no cambia el array original.','[1, 2, 3, 4].slice(1, 3)']
 ],
 Java:[
  ['¿Qué valor tiene n tras esta división?','3','3.5','4','Cuando ambos operandos son enteros, Java realiza división entera.','int n = 7 / 2;'],
  ['¿Qué método compara el contenido de dos String?','equals()','size()','hashCode()','equals compara los caracteres. == comprueba si las referencias son la misma.'],
  ['¿Qué colección asocia claves con valores?','HashMap','ArrayList','HashSet','HashMap guarda cada valor bajo una clave; get(clave) permite consultarlo.'],
  ['¿Qué palabra hace que una clase herede de otra?','extends','implements','static','extends establece herencia entre clases. implements declara un contrato de interfaz.'],
  ['¿Qué bloque recibe una excepción lanzada dentro de try?','catch','finally','return','catch captura excepciones de tipos compatibles; finally sirve para ejecutar limpieza.'],
  ['¿Qué devuelve este acceso al texto?','El carácter u','El carácter r','El texto completo','charAt(1) lee el segundo carácter porque el primer índice es 0.','"runa".charAt(1)'],
  ['¿Qué modificador restringe el acceso a un campo a su clase?','private','public','static','private protege los detalles internos. static indica pertenencia a la clase, no privacidad.'],
  ['¿Cómo consultas cuántos elementos contiene un ArrayList?','lista.size()','lista.length','lista.length()','Una lista usa size(), un arreglo tiene el campo length y un String usa length().'],
  ['¿Qué método se invoca al crear una instancia con new?','El constructor','El getter','El método main','El constructor inicializa la instancia y tiene el mismo nombre que la clase.'],
  ['¿Qué devuelve el método al ejecutarse con n = 3?','6','9','3','fact(3) = 3 × fact(2) = 3 × 2 × 1.','static int fact(int n) {\n  return n <= 1 ? 1 : n * fact(n - 1);\n}']
 ],
 MongoDB:[
  ['¿Cómo se llama la unidad que agrupa campos y valores en MongoDB?','Documento','Fila SQL','Cursor','MongoDB guarda documentos BSON dentro de colecciones.'],
  ['¿Qué método localiza documentos que cumplen un filtro?','find()','insertOne()','updateMany()','find devuelve un cursor sobre los documentos seleccionados.'],
  ['¿Qué significa el operador $gte?','Mayor o igual que','Mayor, sin incluir el límite','Menor o igual que','$gte incluye el límite. $gt lo excluye.'],
  ['¿Qué etapa decide qué documentos siguen por un pipeline?','$match','$group','$sort','$match filtra documentos; $group los agrupa y $sort los ordena.'],
  ['¿Qué modifica esta operación?','Suma 2 al stock actual','Fija el stock en 2','Duplica el stock','$inc aumenta el valor existente sin tener que leerlo antes.','{ $inc: { stock: 2 } }'],
  ['¿Qué hace esta proyección?','Devuelve solo el nombre','Oculta el nombre','Devuelve nombre e identificador','El valor 1 incluye nombre y _id: 0 excluye explícitamente el identificador.','{ nombre: 1, _id: 0 }'],
  ['¿Qué operador exige todos los valores indicados en un arreglo?','$all','$in','$size','$all exige todos. $in admite cualquiera de las coincidencias.'],
  ['¿Qué devuelve countDocuments({})?','El número de documentos','Un arreglo de documentos','El último documento','El filtro vacío coincide con todos los documentos y countDocuments los cuenta.'],
  ['¿Qué etapa crea un documento por cada elemento de un arreglo?','$unwind','$limit','$project','$unwind despliega el arreglo. Es útil antes de agrupar y contar sus elementos.'],
  ['¿En qué orden devuelve los resultados este cursor?','De mayor a menor precio','De menor a mayor precio','En orden de inserción','En sort, -1 indica orden descendente y 1 indica ascendente.','db.reliquias.find({}).sort({ precio: -1 })']
 ]
};
export const TOPICS=Object.keys(bank) as Topic[];
export const FLASHCARDS:Flashcard[]=TOPICS.flatMap((topic,k)=>bank[topic].map(([question,correct,b,c,explanation,code],i)=>({id:`q${k}-${i}`,topic,question,choices:[correct,b,c] as [string,string,string],explanation,code})));
export function shuffle<T>(a:readonly T[]):T[]{const b=[...a];for(let i=b.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[b[i],b[j]]=[b[j],b[i]];}return b;}
export interface DrawnCard {card:Flashcard;answers:string[];correct:number}
export function drawDeck(topic:Topic|'Mixto',retry?:Flashcard[]):DrawnCard[]{
 const group=retry?shuffle(retry):topic==='Mixto'?shuffle(TOPICS.map(t=>shuffle(FLASHCARDS.filter(c=>c.topic===t))[0])):shuffle(FLASHCARDS.filter(c=>c.topic===topic)).slice(0,5);
 return group.map(card=>{const answers=shuffle(card.choices);return {card,answers,correct:answers.indexOf(card.choices[0])};});
}
