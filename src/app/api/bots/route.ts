import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { bots } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { verifySession, unauthorized } from "@/lib/auth";

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
      createdAt: bots.createdAt,
    })
    .from(bots)
    .orderBy(desc(bots.createdAt));

  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const session = await verifySession();
  if (!session) return unauthorized();

  const body = await request.json();
  const [bot] = await db
    .insert(bots)
    .values({
      name: body.name,
      symbol: body.symbol,
      role: body.role,
      color: body.color,
      apiToken: body.apiToken,
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
      createdAt: bots.createdAt,
    });

  return NextResponse.json(bot, { status: 201 });
}
