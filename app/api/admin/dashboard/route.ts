import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import { getLiveStatsForApi } from "@/server/socket";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const SEVEN_DAYS_MS = 7 * ONE_DAY_MS;

export async function GET() {
  const ok = await requireAdmin();
  if (!ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const now = new Date();
    const since24h = new Date(now.getTime() - ONE_DAY_MS);
    const since7d = new Date(now.getTime() - SEVEN_DAYS_MS);

    const live = getLiveStatsForApi();

    const [
      totalGames,
      totalUsers,
      totalLobbies,
      totalVotes,
      feedbackTotal,
      feedbackUnread,
      gamesLast24h,
      gamesLast7d,
      categoriesCount,
      questionsCount,
      modesCount,
      lastGame,
      gamesByMode,
      voteCountByQuestion,
      voteCountByPlayer,
    ] = await Promise.all([
      prisma.game.count(),
      prisma.user.count(),
      prisma.lobby.count(),
      prisma.vote.count(),
      prisma.feedback.count(),
      prisma.feedback.count({ where: { readAt: null } }),
      prisma.game.count({ where: { createdAt: { gte: since24h } } }),
      prisma.game.count({ where: { createdAt: { gte: since7d } } }),
      prisma.category.count(),
      prisma.question.count(),
      prisma.mode.count(),
      prisma.game.findFirst({ orderBy: { createdAt: "desc" }, select: { createdAt: true } }),
      prisma.game.groupBy({ by: ["modeId"], _count: true }),
      prisma.vote.groupBy({ by: ["questionId"], _count: true }),
      prisma.vote.groupBy({ by: ["votedForId"], _count: true }),
    ]);

    const sortedByCount = [...gamesByMode].sort((a, b) => b._count - a._count);
    const modeIds = sortedByCount.map((g) => g.modeId);
    const modes = modeIds.length
      ? await prisma.mode.findMany({
          where: { id: { in: modeIds } },
          select: { id: true, name: true },
        })
      : [];
    const mostPopularMode =
      sortedByCount.length > 0
        ? modes.find((m) => m.id === sortedByCount[0]!.modeId)?.name ?? "—"
        : "—";

    const topQuestionsSorted = [...voteCountByQuestion].sort((a, b) => b._count - a._count).slice(0, 5);
    const questionIds = topQuestionsSorted.map((v) => v.questionId);
    const questions = questionIds.length
      ? await prisma.question.findMany({
          where: { id: { in: questionIds } },
          select: { id: true, text: true },
        })
      : [];
    const questionMap = Object.fromEntries(questions.map((q) => [q.id, q.text]));

    const topPlayersSorted = [...voteCountByPlayer].sort((a, b) => b._count - a._count).slice(0, 5);
    const playerIds = topPlayersSorted.map((v) => v.votedForId);
    const users = playerIds.length
      ? await prisma.user.findMany({
          where: { id: { in: playerIds } },
          select: { id: true, nickname: true },
        })
      : [];
    const userMap = Object.fromEntries(users.map((u) => [u.id, u.nickname]));

    return NextResponse.json({
      totalGames,
      mostPopularMode,
      topQuestions: topQuestionsSorted.map((v) => ({
        questionId: v.questionId,
        text: questionMap[v.questionId] ?? "",
        count: v._count,
      })),
      topVotedPlayers: topPlayersSorted.map((v) => ({
        userId: v.votedForId,
        nickname: userMap[v.votedForId] ?? "",
        count: v._count,
      })),
      stats: {
        totalUsers,
        totalLobbies,
        totalVotes,
        feedbackTotal,
        feedbackUnread,
        gamesLast24h,
        gamesLast7d,
        categoriesCount,
        questionsCount,
        modesCount,
        lastGameAt: lastGame?.createdAt ?? null,
        liveActiveLobbies: live.activeLobbies,
        liveConnectedUsers: live.connectedUsers,
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
