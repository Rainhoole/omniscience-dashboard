import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { memoryFiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const [file] = await db
    .select()
    .from(memoryFiles)
    .where(eq(memoryFiles.id, id))
    .limit(1);

  if (!file) {
    return NextResponse.json({ error: "Memory file not found" }, { status: 404 });
  }
  return NextResponse.json(file);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const [file] = await db
    .delete(memoryFiles)
    .where(eq(memoryFiles.id, id))
    .returning();

  if (!file) {
    return NextResponse.json({ error: "Memory file not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
