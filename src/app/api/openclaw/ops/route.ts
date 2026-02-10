import { NextRequest, NextResponse } from "next/server";
import { logOperatorAction } from "@/lib/ops-log";

type OpsPayload = {
  action: "deploy" | "migrate" | "restart" | "rollback" | "git_push";
  description?: string;
  status?: "info" | "success" | "warn" | "error";
  runId?: string;
  taskId?: string;
  resourceType?: string;
  resourceId?: string;
  before?: unknown;
  after?: unknown;
};

export async function POST(request: NextRequest) {
  const token = request.headers.get("x-openclaw-token");
  const expected = process.env.OPENCLAW_ADAPTER_TOKEN;

  if (!expected) {
    return NextResponse.json(
      { error: "OPENCLAW_ADAPTER_TOKEN is not configured" },
      { status: 503 }
    );
  }

  if (!token || token !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as OpsPayload;
  if (!body?.action) {
    return NextResponse.json({ error: "Missing action" }, { status: 400 });
  }

  await logOperatorAction({
    actorId: "openclaw",
    action: body.action,
    resourceType: body.resourceType || "ops",
    resourceId: body.resourceId,
    before: body.before,
    after: body.after,
    description:
      body.description ||
      `Operator action: ${body.action}${body.resourceId ? ` (${body.resourceId})` : ""}`,
    status: body.status || "info",
    runId: body.runId,
    taskId: body.taskId,
  });

  return NextResponse.json({ success: true });
}
