# Crónicas del Escriba · ampliar el contenido

## Recorridos actuales

| Campaña | Mazmorras | Ejercicios | Acceso |
| --- | ---: | ---: | --- |
| I · Las cenizas de Valdrath | 4 | 36 | Inicio de la historia |
| II · El silencio de hierro | 3 | 27 | Después del jefe de la campaña I |
| III · La convergencia | 5 | 45 | Ruta avanzada con entrada independiente; se recomienda experiencia en los tres lenguajes |
| IV · El archivo esmeralda | 5 | 45 | Opcional, independiente de la ruta principal |

En la campaña III hay 15 ejercicios de pseudocódigo, 15 de JavaScript y 15 de Java. La propiedad `lang` de cada desafío determina el intérprete, el resaltado y el teclado de símbolos, incluso entre dos turnos del mismo combate. Los identificadores de las dos campañas originales se conservan.

## Añadir una mazmorra al Archivo Esmeralda

1. Añade un capítulo a `ARCHIVE` en `src/data/expansion-chapters.ts`. Define su título, tema, ilustración, entrada, desenlace, jefe y reliquia. Añade capítulos **al final**: el orden existente identifica las mazmorras guardadas.
2. Añade nueve entradas a `specs` en `src/data/emerald.ts`. El repartidor de encuentros reserva 1, 1, 2, 2 y 3 turnos. Cada entrada contiene un concepto distinto, el objetivo, un comando de referencia, una función independiente que calcula el resultado esperado y una pista.
3. Los casos públicos y ocultos usan `relics()` de `archive-fixtures.ts`. Incluye límites, empates y registros que NO deban coincidir. Los cambios se hacen en copias: una solución nunca modifica el punto de partida de otro intento.
4. Usa modo `ordered` cuando el orden sea parte del contrato y `write` cuando se compare la colección completa después de una escritura. En modo de lectura sin orden se comparan los documentos por contenido. Incluye requisitos de operadores cuando la técnica forme parte del objetivo.
5. Si necesitas un método nuevo, extiende la lista explícita y su ejecución en `src/engine/mongo.ts`. El laboratorio lee sintaxis de mongosh y objetos JSON5, no código JavaScript arbitrario. Las consultas, proyecciones, actualizaciones y agregaciones operan con Mingo en memoria; **no hay una instancia de MongoDB remota**. PostgreSQL solo guarda partidas, clasificaciones y los tableros de taberna.
6. Revisa el cierre narrativo y los logros de final de campaña. Los contadores del atlas y las fichas de campaña se calculan a partir del catálogo, no a partir de texto fijo. Actualiza las expectativas de cantidad en las pruebas cuando crezca el catálogo.

## Añadir tarjetas a la taberna

`src/data/flashcards.ts` agrupa las tarjetas por tema. Cada una lleva una descripción, una respuesta correcta, dos distractores distintos, una explicación y opcionalmente un fragmento de código. El orden de las alternativas se baraja al empezar cada partida. Una sesión mixta toma una tarjeta de cada tema. Un mazo temático elige cinco tarjetas distintas del mismo tema.

El plazo es de 15 segundos de tiempo transcurrido por tarjeta. No hay bonificación por tocar repetidamente; cada tarjeta solo acepta una respuesta. Se puede responder tocando o con las teclas 1, 2 y 3. La explicación aparece tras responder o agotar el tiempo y la sesión continúa automáticamente o con «Siguiente carta». Las recompensas y el récord se guardan una vez por duelo completo; repasar los errores no concede premios adicionales.

## Verificación

Desde la raíz, empaqueta `scripts/verify.ts` con esbuild para Node y ejecútalo. El verificador prueba todas las soluciones, rechaza los editores sin completar, contrasta consultas genéricas de MongoDB y comprueba los recuentos por lenguaje. Un fallo termina con código de salida distinto de cero. Después, ejecuta `npx next typegen`, `npm exec tsc -- --noEmit --pretty false` y `npm run build`.
