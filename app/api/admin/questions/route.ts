import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import { questionSchema } from "@/lib/validation";

export async function GET(req: NextRequest) {
  const ok = await requireAdmin();
  if (!ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get("categoryId");
    const questions = await prisma.question.findMany({
      where: categoryId ? { categoryId } : undefined,
      include: { category: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 500,
    });
    return NextResponse.json({ questions });
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
    const parsed = questionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
    }
    const question = await prisma.question.create({
      data: { text: parsed.data.text, categoryId: parsed.data.categoryId },
    });
    return NextResponse.json({ question });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
