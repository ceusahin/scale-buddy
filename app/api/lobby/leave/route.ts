import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { transferLeaderIfNeeded } from "@/lib/lobby-service";

const leaveSchema = z.object({
  lobbyId: z.string().cuid(),
  userId: z.string().cuid(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = leaveSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 });
    }
    const { lobbyId, userId } = parsed.data;

    await transferLeaderIfNeeded(lobbyId, userId);
    await prisma.lobbyPlayer.deleteMany({
      where: { lobbyId, userId },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
