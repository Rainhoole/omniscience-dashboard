import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { bots, auditLogs, activities } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { verifySession, unauthorized } from "@/lib/auth";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await verifySession();
  if (!session) return unauthorized();

  const { id } = await params;

  const [bot] = await db.select().from(bots).where(eq(bots.id, id));
  if (!bot) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  await db.update(bots).set({ status: "offline" }).where(eq(bots.id, id));
  const [restarted] = await db
    .update(bots)
    .set({ status: "online", lastSeen: new Date() })
    .where(eq(bots.id, id))
    .returning();

  await db.insert(auditLogs).values({
    actorId: (session as { userId?: string }).userId ?? "system",
    action: "restart",
    resourceType: "bot",
    resourceId: id,
    before: { status: bot.status },
    after: { status: "online" },
  });

  await db.insert(activities).values({
    type: "agent_restart",
    description: `Agent ${bot.name} was restarted`,
    status: "info",
    source: bot.name,
  });

  const { apiToken, ...safe } = restarted;
  void apiToken;
  return NextResponse.json(safe);
}
