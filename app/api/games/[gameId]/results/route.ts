import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getGameWithMode, getVoteMatrix } from "@/lib/game-logic";
import { analyze, getSelectionStats, getQuestionLevelStats } from "@/lib/ai-analysis";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  try {
    const { gameId } = await params;
    const game = await getGameWithMode(gameId);
    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }
    const voteMatrix = await getVoteMatrix(gameId);
    const playerIds = game.lobby.players.map((p) => p.user.id);
    const players = game.lobby.players.map((p) => ({
      id: p.user.id,
      nickname: p.user.nickname,
    }));
    const { selectionByPlayer, totalQuestions } = getSelectionStats(
      voteMatrix,
      playerIds
    );

    const questionIds = Array.from(new Set(voteMatrix.map((v) => v.questionId)));
    const questions = questionIds.length
      ? await prisma.question.findMany({
          where: { id: { in: questionIds } },
          select: { id: true, text: true },
        })
      : [];
    const questionStats = getQuestionLevelStats(voteMatrix, playerIds, questions);

    const analysis = await analyze({
      voteMatrix,
      players,
      modeName: game.mode.name,
      selectionByPlayer,
      totalQuestions,
      questionStats,
    });
    const playerAnalysesWithAvatar = analysis.playerAnalyses.map((pa) => ({
      ...pa,
      avatarId: game.lobby.players.find((p) => p.user.id === pa.playerId)?.user.avatarId ?? "fox",
    }));
    return NextResponse.json({ analysis: { ...analysis, playerAnalyses: playerAnalysesWithAvatar } });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
