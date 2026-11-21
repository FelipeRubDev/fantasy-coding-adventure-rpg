# El Códice Borrado · fantasy-coding

Juego para aprender pseudocódigo, JavaScript, Java y MongoDB.

## Cómo jugar en tu PC

Solo necesitas una cosa instalada: **Node.js 20 o superior** → https://nodejs.org (botón LTS, "siguiente, siguiente, instalar").

1. Descomprime la carpeta.
2. Abre el lanzador:
   - **Windows:** doble clic en `Jugar - Windows.bat` (si Windows pregunta, "Más información → Ejecutar de todas formas"; es solo un script de texto).
   - **macOS / Linux:** doble clic en `Jugar.command`. Si macOS dice que no se puede abrir: clic derecho → Abrir. En Linux: clic derecho → Propiedades → permitir ejecutar; o en terminal `./Jugar.command`.
3. La primera vez tarda un par de minutos (instala dependencias). Luego abre solo en el navegador: http://localhost:3000

Para cerrarlo: cierra esa ventana negra (o Ctrl+C). Tus partidas quedan guardadas en el navegador y se recuperan al volver.

### ¿Salón de la fama con tus amigos?

Opcional, solo si tienes **Docker Desktop** instalado: el lanzador crea la base de datos automáticamente y las partidas y clasificaciones se comparten en ese PC. Sin Docker el juego funciona igual, con partidas solo locales.

## Ponerlo en línea (Vercel, gratis)

1. Entra a https://vercel.com con tu cuenta de GitHub → **Add New → Project** → elige `fantasy-coding-adventure-rpg` → **Deploy**. No hay que configurar nada más.
2. Cada `git push` a la rama principal vuelve a desplegar solo.
3. Opcional, para que las partidas y el salón de la fama sobrevivan al cerrar el navegador: crea un Postgres gratis en https://neon.tech, copia su `DATABASE_URL` y pégala en Vercel → **Settings → Environment Variables**. Las tablas se crean solas en el primer uso.

**GitHub Pages no sirve para este proyecto:** el juego tiene rutas de servidor (`src/app/api/*`) y Next.js no genera HTML estático para ellas. En Vercel funciona tal cual.

## Requisitos

- Node.js 20+
- Opcional: Docker (solo para clasificación compartida)

## Comandos manuales

```sh
npm install
npm run dev        # http://localhost:3000
npm run typecheck
```

La base de datos se crea sola al arrancar (tablas `players` y `tavern_boards`). Si quieres usar tu propio Postgres, define `DATABASE_URL`.