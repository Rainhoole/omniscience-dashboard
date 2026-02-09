import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { taskResources } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const result = await db
    .select()
    .from(taskResources)
    .where(eq(taskResources.taskId, id));
  return NextResponse.json(result);
}
