import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { bots, activities, auditLogs } from "@/lib/db/schema";
import { gte, desc, sql, and, eq } from "drizzle-orm";

export async function GET() {
  const now = new Date();
  const since15m = new Date(now.getTime() - 15 * 60 * 1000);

  const allBots = await db.select().from(bots);
  const recentErrors = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(activities)
    .where(and(gte(activities.timestamp, since15m), eq(activities.status, "error")));
  const recentErrorCount = Number(recentErrors[0]?.c || 0);

  const onlineLike = allBots.filter((b) => b.status === "online" || b.status === "busy").length;
  const memoryAvg =
    allBots.length > 0
      ? Math.round(
          allBots.reduce((acc, b) => acc + (b.memoryUsage || 0), 0) / allBots.length
        )
      : 0;

  const successAvg =
    allBots.length > 0
      ? Math.round(
          allBots.reduce((acc, b) => acc + (b.successRate || 0), 0) / allBots.length
        )
      : 0;

  let apiStatus: "Stable" | "Degraded" | "Critical" = "Stable";
  if (recentErrorCount >= 10) apiStatus = "Critical";
  else if (recentErrorCount >= 3) apiStatus = "Degraded";

  const recentOps = await db
    .select({
      id: auditLogs.id,
      action: auditLogs.action,
      resourceType: auditLogs.resourceType,
      resourceId: auditLogs.resourceId,
      actorId: auditLogs.actorId,
      createdAt: auditLogs.createdAt,
    })
    .from(auditLogs)
    .orderBy(desc(auditLogs.createdAt))
    .limit(5);

  return NextResponse.json({
    memoryPercent: Math.max(0, Math.min(100, memoryAvg)),
    apiStatus,
    onlineAgents: onlineLike,
    totalAgents: allBots.length,
    successRate: successAvg,
    recentErrorCount,
    recentOps,
  });
}
