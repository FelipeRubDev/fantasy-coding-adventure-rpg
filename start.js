const { spawnSync } = require("node:child_process");

// Un comando para el invitado: instala si falta, levanta Postgres en Docker si
// está disponible (clasificación compartida) y arranca el juego. Sin Docker el
// juego funciona igual, con partidas solo en el navegador.

const run = (cmd, args, env = {}, input) =>
  spawnSync(cmd, args, { stdio: "inherit", shell: process.platform === "win32", env: { ...process.env, ...env }, input });

if (!require("node:fs").existsSync("node_modules")) {
  console.log("→ Instalando dependencias (solo la primera vez)…");
  if (run("npm", ["install"]).status !== 0) process.exit(1);
}

let DATABASE_URL = process.env.DATABASE_URL;
const hasDocker = run("docker", ["--version"], {}, "").status === 0;
if (!DATABASE_URL && hasDocker) {
  const name = "fantasy-coding-db";
  const running = spawnSync("docker", ["inspect", "-f", "{{.State.Running}}", name], { encoding: "utf8" }).stdout?.trim();
  if (running !== "true") {
    console.log("→ Levantando base de datos en Docker (puerto 5433)…");
    spawnSync("docker", ["rm", "-f", name], { stdio: "ignore" });
    if (run("docker", ["run", "-d", "--rm", "--name", name, "-e", "POSTGRES_PASSWORD=codice", "-p", "5433:5432", "postgres:17-alpine"]).status !== 0) {
      console.log("⚠ Docker no arrancó la base; sigo sin ella.");
    } else {
      for (let i = 0; i < 30; i++) {
        if (spawnSync("docker", ["exec", name, "pg_isready", "-U", "postgres"], { stdio: "ignore" }).status === 0) break;
        spawnSync(process.platform === "win32" ? "ping" : "sleep", process.platform === "win32" ? ["-n", "2", "127.0.0.1"] : ["1"], { stdio: "ignore" });
      }
      DATABASE_URL = "postgresql://postgres:codice@127.0.0.1:5433/postgres";
    }
  } else {
    DATABASE_URL = "postgresql://postgres:codice@127.0.0.1:5433/postgres";
  }
}
if (!DATABASE_URL) console.log("→ Sin base de datos: partidas locales y salón de la fama vacío. Para tenerlos, instala Docker y vuelve a lanzar.");

const port = process.env.PORT || "3000";
console.log(`\n  El Códice Borrado → http://localhost:${port}\n  (Ctrl+C para detener)\n`);
run("npm", ["run", "dev", "--", "-p", port], { DATABASE_URL });