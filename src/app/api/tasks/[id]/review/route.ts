import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tasks } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { verifySession, unauthorized } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await verifySession();
  if (!session) return unauthorized();

  const { id } = await params;
  const body = await request.json();
  const { action, retroNote } = body as {
    action: "approve" | "reject";
    retroNote?: string;
  };

  const [existing] = await db
    .select()
    .from(tasks)
    .where(eq(tasks.id, id))
    .limit(1);
  if (!existing) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  if (action === "approve") {
    const [task] = await db
      .update(tasks)
      .set({
        status: "approved",
        firstTrySuccess: existing.reviewCount === 1,
        retroNote: retroNote || existing.retroNote,
        updatedAt: new Date(),
      })
      .where(eq(tasks.id, id))
      .returning();

    return NextResponse.json(task);
  }

  if (action === "reject") {
    const [task] = await db
      .update(tasks)
      .set({
        status: "in_progress",
        reviewCount: existing.reviewCount + 1,
        updatedAt: new Date(),
      })
      .where(eq(tasks.id, id))
      .returning();

    return NextResponse.json(task);
  }

  return NextResponse.json(
    { error: "Invalid action. Must be 'approve' or 'reject'" },
    { status: 400 }
  );
}
