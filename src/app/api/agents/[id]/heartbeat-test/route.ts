import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { bots } from "@/lib/db/schema";
import { verifySession, unauthorized } from "@/lib/auth";
import { logOperatorAction } from "@/lib/ops-log";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await verifySession();
  if (!session) return unauthorized();

  const { id } = await params;

  const [existing] = await db.select().from(bots).where(eq(bots.id, id));
  if (!existing) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  const now = new Date();
  const [updated] = await db
    .update(bots)
    .set({
      status: "online",
      currentTask: "Heartbeat test passed",
      lastSeen: now,
    })
    .where(eq(bots.id, id))
    .returning({
      id: bots.id,
      name: bots.name,
      status: bots.status,
      currentTask: bots.currentTask,
      lastSeen: bots.lastSeen,
    });

  await logOperatorAction({
    actorId: session.userId,
    action: "heartbeat_test",
    resourceType: "bot",
    resourceId: id,
    before: {
      status: existing.status,
      lastSeen: existing.lastSeen,
    },
    after: {
      status: updated.status,
      lastSeen: updated.lastSeen,
    },
    description: `Heartbeat test passed for ${existing.name}`,
    status: "success",
  });

  return NextResponse.json(updated);
}
