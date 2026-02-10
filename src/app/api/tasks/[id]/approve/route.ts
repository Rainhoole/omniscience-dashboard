import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tasks } from "@/lib/db/schema";
import { logOperatorAction } from "@/lib/ops-log";
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
    .set({ status: "approved", updatedAt: new Date() })
    .where(eq(tasks.id, id))
    .returning();

  await logOperatorAction({
    actorId: (session as { userId?: string }).userId,
    action: "approve",
    resourceType: "task",
    resourceId: id,
    before: { status: task.status },
    after: { status: "approved" },
    description: `Approved task ${id.slice(0, 8)}`,
    status: "success",
    taskId: id,
  });

  return NextResponse.json(updated);
}
