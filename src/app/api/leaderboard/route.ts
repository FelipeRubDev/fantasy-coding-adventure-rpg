import { ready } from "@/db";
import { players } from "@/db/schema";
import { desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = await ready();
    if (!db) return Response.json({ rows: [] });
    const rows = await db
      .select({ name: players.name, score: players.score, level: players.level })
      .from(players)
      .orderBy(desc(players.score))
      .limit(10);
    return Response.json({ rows });
  } catch {
    return Response.json({ rows: [] });
  }
}
