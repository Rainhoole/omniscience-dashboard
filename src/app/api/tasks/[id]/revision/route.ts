import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tasks } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { verifySession, unauthorized } from "@/lib/auth";
import { logOperatorAction } from "@/lib/ops-log";

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
    .set({
      status: "in_progress",
      reviewCount: sql`${tasks.reviewCount} + 1`,
      updatedAt: new Date(),
    })
    .where(eq(tasks.id, id))
    .returning();

  await logOperatorAction({
    actorId: (session as { userId?: string }).userId,
    action: "request_revision",
    resourceType: "task",
    resourceId: id,
    before: { status: task.status, reviewCount: task.reviewCount },
    after: { status: "in_progress", reviewCount: task.reviewCount + 1 },
    description: `Requested revision for task ${id.slice(0, 8)}`,
    status: "warn",
    taskId: id,
  });

  return NextResponse.json(updated);
}
