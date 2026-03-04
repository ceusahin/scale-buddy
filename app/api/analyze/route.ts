import { NextRequest, NextResponse } from "next/server";
import { analyze, getSelectionStats } from "@/lib/ai-analysis";
import { z } from "zod";

const analyzeSchema = z.object({
  voteMatrix: z.array(
    z.object({
      questionId: z.string(),
      voterId: z.string(),
      votedForId: z.string(),
    })
  ),
  players: z.array(
    z.object({
      id: z.string(),
      nickname: z.string(),
    })
  ),
  modeName: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = analyzeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const { voteMatrix, players, modeName } = parsed.data;
    const playerIds = players.map((p) => p.id);
    const { selectionByPlayer, totalQuestions } = getSelectionStats(voteMatrix, playerIds);
    const result = await analyze({
      voteMatrix,
      players,
      modeName,
      selectionByPlayer,
      totalQuestions,
    });
    return NextResponse.json(result);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
