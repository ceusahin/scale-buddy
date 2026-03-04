import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import { modeSchema } from "@/lib/validation";

export async function GET() {
  const ok = await requireAdmin();
  if (!ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const modes = await prisma.mode.findMany({
      include: { categories: { include: { category: true } } },
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ modes });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const ok = await requireAdmin();
  if (!ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await req.json();
    const parsed = modeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
    }
    const { categoryIds, ...data } = parsed.data;
    const mode = await prisma.mode.create({
      data: {
        name: data.name,
        isActive: data.isActive,
      },
    });
    if (categoryIds.length > 0) {
      await prisma.modeCategory.createMany({
        data: categoryIds.map((categoryId) => ({ modeId: mode.id, categoryId })),
      });
    }
    return NextResponse.json({ mode });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
