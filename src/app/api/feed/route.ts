import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { activities } from "@/lib/db/schema";
import { desc, eq, SQL } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const scope = searchParams.get("scope") || "global";
  const limit = parseInt(searchParams.get("limit") || "50");

  const conditions: SQL[] = [];

  if (scope !== "global" && scope.startsWith("agent:")) {
    const agentName = scope.slice("agent:".length);
    conditions.push(eq(activities.source, agentName));
  }

  const result = await db
    .select()
    .from(activities)
    .where(conditions.length > 0 ? conditions[0] : undefined)
    .orderBy(desc(activities.timestamp))
    .limit(limit);

  return NextResponse.json(result);
}
