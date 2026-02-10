import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { activities, timelineEvents, tasks } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

type OpenClawEvent = {
  type: "task.started" | "task.updated" | "task.completed" | "task.failed" | "cron.ran" | "session.message";
  runId?: string;
  taskId?: string;
  agentId?: string;
  title?: string;
  description?: string;
  status?: "info" | "success" | "warn" | "error";
  taskStatus?: "draft" | "in_progress" | "pending_review" | "approved" | "archived" | "failed";
  metadata?: Record<string, unknown>;
  occurredAt?: string;
};

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function mapDefaultStatus(evt: OpenClawEvent) {
  if (evt.type === "task.completed") return "success";
  if (evt.type === "task.failed") return "error";
  return evt.status || "info";
}

export async function POST(request: NextRequest) {
  const token = request.headers.get("x-openclaw-token");
  const expected = process.env.OPENCLAW_ADAPTER_TOKEN;

  if (!expected) {
    return NextResponse.json(
      { error: "OPENCLAW_ADAPTER_TOKEN is not configured" },
      { status: 503 }
    );
  }

  if (!token || token !== expected) return unauthorized();

  const body = (await request.json()) as OpenClawEvent | { events: OpenClawEvent[] };
  const events = Array.isArray((body as { events?: OpenClawEvent[] }).events)
    ? (body as { events: OpenClawEvent[] }).events
    : [body as OpenClawEvent];

  if (!events.length) {
    return NextResponse.json({ error: "No events provided" }, { status: 400 });
  }

  await db.transaction(async (tx) => {
    for (const evt of events) {
      const occurredAt = evt.occurredAt ? new Date(evt.occurredAt) : new Date();
      const source = evt.agentId || "openclaw";
      const description =
        evt.description ||
        (evt.taskId
          ? `${evt.type} for task ${evt.taskId}`
          : `${evt.type}${evt.runId ? ` (${evt.runId})` : ""}`);

      const metadata = {
        ...(evt.metadata || {}),
        runId: evt.runId,
        taskId: evt.taskId,
        agentId: evt.agentId,
        ingestedBy: "openclaw-adapter",
      };

      await tx.insert(activities).values({
        type: evt.type,
        description,
        status: mapDefaultStatus(evt),
        source,
        timestamp: occurredAt,
        metadata,
      });

      await tx.insert(timelineEvents).values({
        agentId: evt.agentId || null,
        type: evt.type,
        title: evt.title || evt.type,
        description,
        occurredAt,
        metadata,
      });

      if (evt.taskId && evt.taskStatus) {
        await tx
          .update(tasks)
          .set({
            status: evt.taskStatus,
            updatedAt: occurredAt,
          })
          .where(eq(tasks.id, evt.taskId));
      }
    }
  });

  return NextResponse.json({ success: true, ingested: events.length });
}
