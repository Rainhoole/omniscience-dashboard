import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { activities, timelineEvents, tasks, auditLogs } from "@/lib/db/schema";
import { eq, sql, desc } from "drizzle-orm";
import { verifySession, unauthorized } from "@/lib/auth";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ runId: string }> }
) {
  const session = await verifySession();
  if (!session) return unauthorized();

  const { runId } = await params;
  if (!runId) {
    return NextResponse.json({ error: "Missing runId" }, { status: 400 });
  }

  const [latest] = await db
    .select()
    .from(activities)
    .where(sql`${activities.metadata}->>'runId' = ${runId}`)
    .orderBy(desc(activities.timestamp))
    .limit(1);

  const taskId = (latest?.metadata as { taskId?: string } | null)?.taskId;
  if (!taskId) {
    return NextResponse.json({ error: "No task linked to this run" }, { status: 404 });
  }

  const [existingTask] = await db
    .select()
    .from(tasks)
    .where(eq(tasks.id, taskId))
    .limit(1);

  if (!existingTask) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  await db.transaction(async (tx) => {
    await tx
      .update(tasks)
      .set({ status: "in_progress", updatedAt: new Date() })
      .where(eq(tasks.id, taskId));

    await tx.insert(activities).values({
      type: "task.retry_requested",
      description: `Retry requested for run ${runId}`,
      status: "warn",
      source: session.userId || "admin",
      metadata: {
        runId,
        taskId,
        retriedFromStatus: existingTask.status,
      },
    });

    await tx.insert(timelineEvents).values({
      agentId: session.userId || "admin",
      type: "task.retry_requested",
      title: "Retry Requested",
      description: `Task ${taskId} moved to in_progress from ${existingTask.status}`,
      metadata: {
        runId,
        taskId,
      },
    });

    await tx.insert(auditLogs).values({
      actorId: session.userId || "admin",
      action: "task.retry_requested",
      resourceType: "task",
      resourceId: taskId,
      before: { status: existingTask.status, runId },
      after: { status: "in_progress", runId },
    });
  });

  return NextResponse.json({ success: true, runId, taskId, status: "in_progress" });
}
