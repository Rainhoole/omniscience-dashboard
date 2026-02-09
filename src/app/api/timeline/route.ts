import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { timelineEvents } from "@/lib/db/schema";
import { desc, eq, and, gte, SQL } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const agent = searchParams.get("agent");
  const range = searchParams.get("range");
  const limit = parseInt(searchParams.get("limit") || "100");

  const conditions: SQL[] = [];

  if (agent && agent !== "all") {
    conditions.push(eq(timelineEvents.agentId, agent));
  }

  if (range) {
    let since: Date | null = null;
    const now = new Date();

    if (range === "24h") {
      since = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    } else if (range === "7d") {
      since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (range === "30d") {
      since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    } else {
      since = new Date(range);
    }

    if (since && !isNaN(since.getTime())) {
      conditions.push(gte(timelineEvents.occurredAt, since));
    }
  }

  const result = await db
    .select()
    .from(timelineEvents)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(timelineEvents.occurredAt))
    .limit(limit);

  return NextResponse.json(result);
}
