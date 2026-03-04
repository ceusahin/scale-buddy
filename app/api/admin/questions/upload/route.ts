import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const ok = await requireAdmin();
  if (!ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const categoryId = formData.get("categoryId") as string | null;
    if (!file || !categoryId) {
      return NextResponse.json({ error: "file and categoryId required" }, { status: 400 });
    }
    const text = await file.text();
    const lines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    const created = await prisma.$transaction(
      lines.map((line) =>
        prisma.question.create({
          data: { text: line.slice(0, 500), categoryId },
        })
      )
    );
    return NextResponse.json({ count: created.length });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
