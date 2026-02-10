import { db } from "@/lib/db";
import { activities, auditLogs, timelineEvents } from "@/lib/db/schema";

type LogParams = {
  actorId?: string | null;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  before?: unknown;
  after?: unknown;
  description: string;
  status?: "info" | "success" | "warn" | "error";
  runId?: string;
  taskId?: string;
};

export async function logOperatorAction(params: LogParams) {
  const actor = params.actorId || "system";
  const metadata = {
    runId: params.runId,
    taskId: params.taskId || params.resourceId || undefined,
    action: params.action,
  };

  await db.insert(auditLogs).values({
    actorId: actor,
    action: params.action,
    resourceType: params.resourceType,
    resourceId: params.resourceId || null,
    before: params.before as never,
    after: params.after as never,
  });

  await db.insert(activities).values({
    type: `operator.${params.action}`,
    description: params.description,
    status: params.status || "info",
    source: actor,
    metadata,
  });

  await db.insert(timelineEvents).values({
    agentId: actor,
    type: `operator.${params.action}`,
    title: params.action,
    description: params.description,
    metadata,
  });
}
