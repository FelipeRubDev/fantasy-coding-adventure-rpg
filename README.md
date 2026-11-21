# El Códice Borrado

Un juego de navegador para practicar programación. Recorres un reino en ruinas y vences a cada monstruo escribiendo el código que pide, línea por línea, sin autocompletar.

Los primeros combates se resuelven en pseudocódigo. Después cambias a JavaScript y a Java, y al final del camino hay una campaña entera de MongoDB. Cada respuesta de la taberna trae su explicación, así que también aprendes cuando te equivocas.

Es un proyecto Next.js con Postgres para guardar partidas y el salón de la fama. Lo estoy usando para repasar lo que estudio, y cualquiera puede jugarlo en línea.

## Jugar

https://fantasy-coding-adventure-rpg.vercel.app

## Correrlo en tu PC

Necesitas Node.js 20 o superior.

```sh
npm install
npm run dev
```

Luego abre http://localhost:3000. La partida se guarda en el navegador. Si defines `DATABASE_URL` con un Postgres, también se guardan en el servidor.
