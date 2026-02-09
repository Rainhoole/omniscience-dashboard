import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { scheduledTasks } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { verifySession, unauthorized } from "@/lib/auth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await verifySession();
  if (!session) return unauthorized();

  const { id } = await params;
  const body = await request.json();

  const updates: Record<string, unknown> = {};
  if (body.status !== undefined) updates.status = body.status;
  if (body.lastRun !== undefined) updates.lastRun = new Date(body.lastRun);
  if (body.nextRun !== undefined) updates.nextRun = new Date(body.nextRun);
  if (body.cronExpression !== undefined) updates.cronExpression = body.cronExpression;
  if (body.assignee !== undefined) updates.assignee = body.assignee;

  const [task] = await db
    .update(scheduledTasks)
    .set(updates)
    .where(eq(scheduledTasks.id, id))
    .returning();

  if (!task) {
    return NextResponse.json(
      { error: "Scheduled task not found" },
      { status: 404 }
    );
  }

  return NextResponse.json(task);
}
