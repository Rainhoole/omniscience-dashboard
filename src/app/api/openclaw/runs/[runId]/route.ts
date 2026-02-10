import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { activities, timelineEvents } from "@/lib/db/schema";
import { desc, sql } from "drizzle-orm";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ runId: string }> }
) {
  const { runId } = await params;

  if (!runId) {
    return NextResponse.json({ error: "Missing runId" }, { status: 400 });
  }

  const activityRows = await db
    .select()
    .from(activities)
    .where(sql`${activities.metadata}->>'runId' = ${runId}`)
    .orderBy(desc(activities.timestamp))
    .limit(100);

  const timelineRows = await db
    .select()
    .from(timelineEvents)
    .where(sql`${timelineEvents.metadata}->>'runId' = ${runId}`)
    .orderBy(desc(timelineEvents.occurredAt))
    .limit(100);

  return NextResponse.json({
    runId,
    activities: activityRows,
    timelineEvents: timelineRows,
  });
}
