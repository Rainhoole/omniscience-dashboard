import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { taskVersions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const result = await db
    .select()
    .from(taskVersions)
    .where(eq(taskVersions.taskId, id))
    .orderBy(taskVersions.versionNo);

  return NextResponse.json(result);
}
