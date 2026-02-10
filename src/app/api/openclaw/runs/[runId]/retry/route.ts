import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { activities, timelineEvents, tasks, auditLogs } from "@/lib/db/schema";
import { eq, sql, desc } from "drizzle-orm";
import { verifySession, unauthorized } from "@/lib/auth";

const DEFAULT_RETRY_TIMEOUT_MS = 10_000;

type RetryDispatchResult =
  | { ok: true; mode: "remote-dispatch"; status: number; body: unknown }
  | { ok: true; mode: "local-fallback"; reason: string }
  | { ok: false; status?: number; error: string };

function createRetryRunId(): string {
  return `retry_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;
}

async function dispatchRetryToOpenClaw(payload: {
  previousRunId: string;
  retryRunId: string;
  taskId: string;
  actorId: string;
}): Promise<RetryDispatchResult> {
  const retryEndpoint = process.env.OPENCLAW_RETRY_DISPATCH_URL;
  const adapterToken = process.env.OPENCLAW_ADAPTER_TOKEN;
  const retryToken = process.env.OPENCLAW_RETRY_DISPATCH_TOKEN || adapterToken;

  if (!retryEndpoint) {
    return {
      ok: true,
      mode: "local-fallback",
      reason: "OPENCLAW_RETRY_DISPATCH_URL is not configured",
    };
  }

  if (!retryToken) {
    return {
      ok: false,
      error:
        "OPENCLAW_RETRY_DISPATCH_URL configured but no token available (set OPENCLAW_RETRY_DISPATCH_TOKEN or OPENCLAW_ADAPTER_TOKEN)",
    };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), DEFAULT_RETRY_TIMEOUT_MS);

    const response = await fetch(retryEndpoint, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-openclaw-token": retryToken,
      },
      body: JSON.stringify({
        type: "task.retry.dispatch",
        previousRunId: payload.previousRunId,
        runId: payload.retryRunId,
        taskId: payload.taskId,
        actorId: payload.actorId,
        occurredAt: new Date().toISOString(),
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    let body: unknown = null;
    try {
      body = await response.json();
    } catch {
      body = null;
    }

    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        error: `Retry dispatch endpoint returned ${response.status}`,
      };
    }

    return {
      ok: true,
      mode: "remote-dispatch",
      status: response.status,
      body,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown dispatch error";
    return { ok: false, error: message };
  }
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ runId: string }> }
) {
  const session = await verifySession();
  if (!session) return unauthorized();

  const { runId } = await params;
  if (!runId) {
    return NextResponse.json({ error: "Missing runId" }, { status: 400 });
  }

  const [latest] = await db
    .select()
    .from(activities)
    .where(sql`${activities.metadata}->>'runId' = ${runId}`)
    .orderBy(desc(activities.timestamp))
    .limit(1);

  const taskId = (latest?.metadata as { taskId?: string } | null)?.taskId;
  if (!taskId) {
    return NextResponse.json({ error: "No task linked to this run" }, { status: 404 });
  }

  const [existingTask] = await db.select().from(tasks).where(eq(tasks.id, taskId)).limit(1);

  if (!existingTask) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  const actorId = session.userId || "admin";
  const retryRunId = createRetryRunId();

  await db.insert(activities).values({
    type: "task.retry_requested",
    description: `Retry requested for run ${runId}`,
    status: "warn",
    source: actorId,
    metadata: {
      runId,
      taskId,
      retriedFromStatus: existingTask.status,
      retryRunId,
    },
  });

  const dispatch = await dispatchRetryToOpenClaw({
    previousRunId: runId,
    retryRunId,
    taskId,
    actorId,
  });

  if (!dispatch.ok) {
    await db.transaction(async (tx) => {
      await tx.insert(activities).values({
        type: "task.retry_dispatch_failed",
        description: `Retry dispatch failed for ${runId}: ${dispatch.error}`,
        status: "error",
        source: actorId,
        metadata: {
          runId,
          taskId,
          retryRunId,
          error: dispatch.error,
          status: dispatch.status,
        },
      });

      await tx.insert(timelineEvents).values({
        agentId: actorId,
        type: "task.retry_dispatch_failed",
        title: "Retry Dispatch Failed",
        description: `Failed to dispatch retry for run ${runId}`,
        metadata: {
          runId,
          taskId,
          retryRunId,
          error: dispatch.error,
          status: dispatch.status,
        },
      });

      await tx.insert(auditLogs).values({
        actorId,
        action: "task.retry_dispatch_failed",
        resourceType: "task",
        resourceId: taskId,
        before: { status: existingTask.status, runId },
        after: { status: existingTask.status, runId, retryRunId, error: dispatch.error },
      });
    });

    return NextResponse.json(
      {
        error: "Retry dispatch failed",
        runId,
        retryRunId,
        taskId,
        detail: dispatch.error,
      },
      { status: 502 }
    );
  }

  await db.transaction(async (tx) => {
    await tx.update(tasks).set({ status: "in_progress", updatedAt: new Date() }).where(eq(tasks.id, taskId));

    await tx.insert(activities).values([
      {
        type: "task.retry_dispatched",
        description: `Retry dispatched: ${runId} → ${retryRunId}`,
        status: "info",
        source: actorId,
        metadata: {
          runId,
          taskId,
          retryRunId,
          dispatchMode: dispatch.mode,
          dispatchStatus: dispatch.mode === "remote-dispatch" ? dispatch.status : null,
          dispatchReason: dispatch.mode === "local-fallback" ? dispatch.reason : null,
        },
      },
      {
        type: "task.started",
        description: `Retry run started from ${runId}`,
        status: "info",
        source: actorId,
        metadata: {
          runId: retryRunId,
          taskId,
          retriedFromRunId: runId,
          retryDepth: 1,
          dispatchMode: dispatch.mode,
          dispatchReason: dispatch.mode === "local-fallback" ? dispatch.reason : null,
        },
      },
    ]);

    await tx.insert(timelineEvents).values([
      {
        agentId: actorId,
        type: "task.retry_dispatched",
        title: "Retry Dispatched",
        description: `Run ${runId} retriggered as ${retryRunId}`,
        metadata: {
          runId,
          taskId,
          retryRunId,
          dispatchMode: dispatch.mode,
        },
      },
      {
        agentId: actorId,
        type: "task.started",
        title: "Retry Run Started",
        description: `Retry chain ${runId} -> ${retryRunId}`,
        metadata: {
          runId: retryRunId,
          taskId,
          retriedFromRunId: runId,
          retryDepth: 1,
          dispatchMode: dispatch.mode,
        },
      },
    ]);

    await tx.insert(auditLogs).values({
      actorId,
      action: "task.retry_requested",
      resourceType: "task",
      resourceId: taskId,
      before: { status: existingTask.status, runId },
      after: {
        status: "in_progress",
        runId: retryRunId,
        retriedFromRunId: runId,
        dispatchMode: dispatch.mode,
      },
    });
  });

  return NextResponse.json({
    success: true,
    runId,
    retryRunId,
    taskId,
    status: "in_progress",
    dispatchMode: dispatch.mode,
  });
}
