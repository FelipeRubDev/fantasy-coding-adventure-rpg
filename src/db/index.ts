import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

// Sin DATABASE_URL el juego corre entero en el navegador (localStorage):
// partidas solo locales, sin taberna compartida ni clasificación.
const databaseUrl = process.env.DATABASE_URL;

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
};

export const pool = databaseUrl
  ? globalForDb.__arenaNextJsPostgresqlPool ??
    new Pool({
      connectionString: databaseUrl,
    })
  : null;

if (databaseUrl && process.env.NODE_ENV !== "production") {
  globalForDb.__arenaNextJsPostgresqlPool = pool!;
}

export const db = pool ? drizzle(pool) : null;

const SCHEMA = `
create table if not exists players (
  id text primary key,
  name text not null,
  score integer not null default 0,
  level integer not null default 1,
  save jsonb not null,
  updated_at timestamp default now() not null
);
create table if not exists tavern_boards (
  slot integer primary key,
  quest_ids jsonb not null,
  created_at timestamp default now() not null
);`;

// Crea las tablas al primer uso para no pedir migraciones al invitado.
export async function ready(): Promise<NonNullable<typeof db> | null> {
  if (!db) return null;
  await db.execute(SCHEMA as never);
  return db;
}
