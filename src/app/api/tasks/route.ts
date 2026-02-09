import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tasks } from "@/lib/db/schema";
import { desc, eq, and, SQL } from "drizzle-orm";
import { verifySession, unauthorized } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") as
    | "todo"
    | "in_progress"
    | "review"
    | "done"
    | null;
  const assignee = searchParams.get("assignee");

  const conditions: SQL[] = [];
  if (status) conditions.push(eq(tasks.status, status));
  if (assignee) conditions.push(eq(tasks.assignee, assignee));

  const result = await db
    .select()
    .from(tasks)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(tasks.createdAt));

  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const session = await verifySession();
  if (!session) return unauthorized();

  const body = await request.json();
  const [task] = await db
    .insert(tasks)
    .values({
      title: body.title,
      description: body.description,
      status: body.status || "todo",
      priority: body.priority || "medium",
      assignee: body.assignee,
      tags: body.tags,
    })
    .returning();

  return NextResponse.json(task, { status: 201 });
}
