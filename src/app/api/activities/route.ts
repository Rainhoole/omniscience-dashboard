import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { activities } from "@/lib/db/schema";
import { desc, eq, and, SQL, sql } from "drizzle-orm";
import { verifyBotToken, unauthorized } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") || "50");
  const source = searchParams.get("source");
  const type = searchParams.get("type");
  const runId = searchParams.get("runId");

  const conditions: SQL[] = [];
  if (source) conditions.push(eq(activities.source, source));
  if (type) conditions.push(eq(activities.type, type));
  if (runId) conditions.push(sql`${activities.metadata}->>'runId' = ${runId}`);

  const result = await db
    .select()
    .from(activities)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(activities.timestamp))
    .limit(limit);

  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const bot = await verifyBotToken(request);
  if (!bot) return unauthorized();

  const body = await request.json();
  const [activity] = await db
    .insert(activities)
    .values({
      type: body.type,
      description: body.description,
      status: body.status || "info",
      source: body.source || bot.botName,
      metadata: body.metadata,
    })
    .returning();

  return NextResponse.json(activity, { status: 201 });
}
