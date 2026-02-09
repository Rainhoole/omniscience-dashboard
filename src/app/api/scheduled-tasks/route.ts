import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { scheduledTasks } from "@/lib/db/schema";
import { desc, eq, SQL } from "drizzle-orm";
import { verifySession, unauthorized } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") as
    | "active"
    | "paused"
    | "completed"
    | null;

  const conditions: SQL[] = [];
  if (status) conditions.push(eq(scheduledTasks.status, status));

  const result = await db
    .select()
    .from(scheduledTasks)
    .where(conditions.length > 0 ? conditions[0] : undefined)
    .orderBy(desc(scheduledTasks.createdAt));

  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const session = await verifySession();
  if (!session) return unauthorized();

  const body = await request.json();
  const [task] = await db
    .insert(scheduledTasks)
    .values({
      title: body.title,
      type: body.type,
      cronExpression: body.cronExpression,
      scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : null,
      status: body.status || "active",
      assignee: body.assignee,
      nextRun: body.nextRun ? new Date(body.nextRun) : null,
    })
    .returning();

  return NextResponse.json(task, { status: 201 });
}
