import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { bots } from "@/lib/db/schema";
import { verifySession, unauthorized } from "@/lib/auth";
import { logOperatorAction } from "@/lib/ops-log";

export async function GET() {
  const result = await db
    .select({
      id: bots.id,
      name: bots.name,
      symbol: bots.symbol,
      role: bots.role,
      color: bots.color,
      status: bots.status,
      currentTask: bots.currentTask,
      lastSeen: bots.lastSeen,
      specialization: bots.specialization,
      memoryUsage: bots.memoryUsage,
      tokenVelocity: bots.tokenVelocity,
      successRate: bots.successRate,
      uptime: bots.uptime,
      createdAt: bots.createdAt,
    })
    .from(bots)
    .orderBy(desc(bots.createdAt));

  return NextResponse.json(result);
}

function normalizeHexColor(value: unknown): string {
  if (typeof value !== "string") return "#C4A496";
  const v = value.trim();
  if (/^#[0-9A-Fa-f]{6}$/.test(v)) return v;
  return "#C4A496";
}

export async function POST(request: NextRequest) {
  const session = await verifySession();
  if (!session) return unauthorized();

  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const symbolInput = typeof body.symbol === "string" ? body.symbol.trim() : "";
  const symbol = (symbolInput || name.charAt(0) || "●").slice(0, 2).toUpperCase();
  const role = typeof body.role === "string" && body.role.trim() ? body.role.trim() : null;
  const color = normalizeHexColor(body.color);
  const apiToken =
    typeof body.apiToken === "string" && body.apiToken.trim()
      ? body.apiToken.trim()
      : `bot_${randomUUID().replace(/-/g, "")}`;

  try {
    const [bot] = await db
      .insert(bots)
      .values({
        name,
        symbol,
        role,
        color,
        apiToken,
        status: "offline",
        model: typeof body.model === "string" ? body.model : undefined,
        specialization:
          typeof body.specialization === "string" ? body.specialization : undefined,
        basePersona:
          typeof body.basePersona === "string" ? body.basePersona : undefined,
      })
      .returning({
        id: bots.id,
        name: bots.name,
        symbol: bots.symbol,
        role: bots.role,
        color: bots.color,
        status: bots.status,
        currentTask: bots.currentTask,
        lastSeen: bots.lastSeen,
        specialization: bots.specialization,
        memoryUsage: bots.memoryUsage,
        tokenVelocity: bots.tokenVelocity,
        successRate: bots.successRate,
        uptime: bots.uptime,
        createdAt: bots.createdAt,
      });

    await logOperatorAction({
      actorId: session.userId,
      action: "create_agent",
      resourceType: "bot",
      resourceId: bot.id,
      after: {
        name: bot.name,
        role: bot.role,
        status: bot.status,
      },
      description: `Created agent ${bot.name}`,
      status: "success",
    });

    return NextResponse.json(bot, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message.toLowerCase() : "";
    if (message.includes("unique") || message.includes("duplicate")) {
      return NextResponse.json({ error: "Agent name already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to create agent" }, { status: 500 });
  }
}
