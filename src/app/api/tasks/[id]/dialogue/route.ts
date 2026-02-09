import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { taskDialogueLogs } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const result = await db
    .select()
    .from(taskDialogueLogs)
    .where(eq(taskDialogueLogs.taskId, id))
    .orderBy(taskDialogueLogs.createdAt);

  return NextResponse.json(result);
}
