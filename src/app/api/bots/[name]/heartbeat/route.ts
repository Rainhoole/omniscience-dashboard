import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { bots } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { verifyBotToken, unauthorized } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  const bot = await verifyBotToken(request);
  if (!bot) return unauthorized();

  const { name } = await params;
  const body = await request.json();

  const [updated] = await db
    .update(bots)
    .set({
      status: body.status,
      currentTask: body.currentTask ?? null,
      lastSeen: new Date(),
    })
    .where(eq(bots.name, name))
    .returning({
      id: bots.id,
      name: bots.name,
      status: bots.status,
      currentTask: bots.currentTask,
      lastSeen: bots.lastSeen,
    });

  if (!updated) {
    return NextResponse.json({ error: "Bot not found" }, { status: 404 });
  }

  return NextResponse.json(updated);
}
