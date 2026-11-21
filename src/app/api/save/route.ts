import { ready } from "@/db";
import { players } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return Response.json({ save: null });
  try {
    const db = await ready();
    if (!db) return Response.json({ save: null });
    const rows = await db.select().from(players).where(eq(players.id, id)).limit(1);
    return Response.json({ save: rows[0]?.save ?? null });
  } catch {
    return Response.json({ save: null }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = (await req.json()) as { id?: string; save?: { name?: string; score?: number; level?: number } };
    const id = typeof body.id === "string" ? body.id.slice(0, 64) : "";
    const save = body.save;
    if (!id || !save || typeof save !== "object") {
      return Response.json({ ok: false }, { status: 400 });
    }
    const name = String(save.name ?? "Escriba").slice(0, 24) || "Escriba";
    const score = Math.max(0, Math.floor(Number(save.score) || 0));
    const level = Math.max(1, Math.floor(Number(save.level) || 1));
    const db = await ready();
    if (!db) return Response.json({ ok: true });
    await db
      .insert(players)
      .values({ id, name, score, level, save, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: players.id,
        set: { name, score, level, save, updatedAt: new Date() },
      });
    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false }, { status: 500 });
  }
}
