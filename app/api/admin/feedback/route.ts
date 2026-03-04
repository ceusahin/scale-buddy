import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const ok = await requireAdmin();
  if (!ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const list = await prisma.feedback.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ feedback: list });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
