import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { activities, tasks, memoryFiles } from "@/lib/db/schema";
import { desc, ilike, or } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");

  if (!q) {
    return NextResponse.json(
      { error: "Query parameter 'q' is required" },
      { status: 400 }
    );
  }

  const pattern = `%${q}%`;

  const [activityResults, taskResults, memoryResults] = await Promise.all([
    db
      .select()
      .from(activities)
      .where(ilike(activities.description, pattern))
      .orderBy(desc(activities.timestamp))
      .limit(20),
    db
      .select()
      .from(tasks)
      .where(or(ilike(tasks.title, pattern), ilike(tasks.description, pattern)))
      .orderBy(desc(tasks.createdAt))
      .limit(20),
    db
      .select()
      .from(memoryFiles)
      .where(
        or(ilike(memoryFiles.name, pattern), ilike(memoryFiles.content, pattern))
      )
      .orderBy(desc(memoryFiles.updatedAt))
      .limit(20),
  ]);

  return NextResponse.json({
    activities: activityResults,
    tasks: taskResults,
    memoryFiles: memoryResults,
  });
}
