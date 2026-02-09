import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { bots, auditLogs } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { verifySession, unauthorized } from "@/lib/auth";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const [bot] = await db.select().from(bots).where(eq(bots.id, id));

  if (!bot) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  const { apiToken: _, ...safe } = bot;
  return NextResponse.json(safe);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await verifySession();
  if (!session) return unauthorized();

  const { id } = await params;
  const body = await request.json();

  const [existing] = await db.select().from(bots).where(eq(bots.id, id));
  if (!existing) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  const updates: Record<string, unknown> = {};
  if (body.model !== undefined) updates.model = body.model;
  if (body.temperature !== undefined) updates.temperature = body.temperature;
  if (body.memoryStrategy !== undefined) updates.memoryStrategy = body.memoryStrategy;
  if (body.basePersona !== undefined) updates.basePersona = body.basePersona;

  const [updated] = await db
    .update(bots)
    .set(updates)
    .where(eq(bots.id, id))
    .returning();

  await db.insert(auditLogs).values({
    actorId: (session as { userId?: string }).userId ?? "system",
    action: "update_config",
    resourceType: "bot",
    resourceId: id,
    before: { model: existing.model, temperature: existing.temperature, memoryStrategy: existing.memoryStrategy, basePersona: existing.basePersona },
    after: updates,
  });

  const { apiToken: _, ...safe } = updated;
  return NextResponse.json(safe);
}
