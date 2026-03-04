import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const modes = await prisma.mode.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        categories: { include: { category: { select: { name: true } } } },
      },
      orderBy: { name: "asc" },
    });
    const payload = modes.map((m) => ({
      id: m.id,
      name: m.name,
      categoryNames: m.categories.map((c) => c.category.name),
    }));
    return NextResponse.json({ modes: payload });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
