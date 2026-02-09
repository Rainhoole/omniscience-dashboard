import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { memoryFiles } from "@/lib/db/schema";
import { desc, eq, and, SQL } from "drizzle-orm";
import { verifyBotToken, unauthorized } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const path = searchParams.get("path");

  const conditions: SQL[] = [];
  if (type) conditions.push(eq(memoryFiles.type, type));
  if (path) conditions.push(eq(memoryFiles.path, path));

  const result = await db
    .select({
      id: memoryFiles.id,
      name: memoryFiles.name,
      path: memoryFiles.path,
      type: memoryFiles.type,
      size: memoryFiles.size,
      createdAt: memoryFiles.createdAt,
      updatedAt: memoryFiles.updatedAt,
    })
    .from(memoryFiles)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(memoryFiles.updatedAt));

  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const bot = await verifyBotToken(request);
  if (!bot) return unauthorized();

  const body = await request.json();

  const existing = body.path
    ? await db
        .select()
        .from(memoryFiles)
        .where(eq(memoryFiles.path, body.path))
        .limit(1)
    : [];

  if (existing.length > 0) {
    const [file] = await db
      .update(memoryFiles)
      .set({
        name: body.name ?? existing[0].name,
        content: body.content ?? existing[0].content,
        type: body.type ?? existing[0].type,
        size: body.content ? Buffer.byteLength(body.content, "utf-8") : existing[0].size,
        updatedAt: new Date(),
      })
      .where(eq(memoryFiles.id, existing[0].id))
      .returning();

    return NextResponse.json(file);
  }

  const [file] = await db
    .insert(memoryFiles)
    .values({
      name: body.name,
      content: body.content,
      path: body.path,
      type: body.type,
      size: body.content ? Buffer.byteLength(body.content, "utf-8") : 0,
    })
    .returning();

  return NextResponse.json(file, { status: 201 });
}
