import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tasks, auditLogs } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { verifySession, unauthorized } from "@/lib/auth";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await verifySession();
  if (!session) return unauthorized();

  const { id } = await params;

  const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  const [updated] = await db
    .update(tasks)
    .set({ status: "archived", updatedAt: new Date() })
    .where(eq(tasks.id, id))
    .returning();

  await db.insert(auditLogs).values({
    actorId: (session as { userId?: string }).userId ?? "system",
    action: "archive",
    resourceType: "task",
    resourceId: id,
    before: { status: task.status },
    after: { status: "archived" },
  });

  return NextResponse.json(updated);
}
