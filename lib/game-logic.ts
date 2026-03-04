import { prisma } from "./db";

const QUESTIONS_PER_GAME = 10;

export async function pickQuestionsForGame(modeId: string): Promise<string[]> {
  const modeCategories = await prisma.modeCategory.findMany({
    where: { modeId },
    select: { categoryId: true },
  });
  const categoryIds = modeCategories.map((mc) => mc.categoryId);
  if (categoryIds.length === 0) return [];

  const questions = await prisma.question.findMany({
    where: {
      categoryId: { in: categoryIds },
      category: { isActive: true },
    },
    select: { id: true },
  });

  const shuffled = [...questions].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, QUESTIONS_PER_GAME).map((q) => q.id);
}

export async function recordVote(
  gameId: string,
  questionId: string,
  voterId: string,
  votedForId: string,
  selfVoteAllowed: boolean
): Promise<{ ok: boolean; error?: string }> {
  if (voterId === votedForId && !selfVoteAllowed) {
    return { ok: false, error: "Bu modda kendine oy vermek yasak" };
  }

  const existing = await prisma.vote.findUnique({
    where: {
      gameId_questionId_voterId: { gameId, questionId, voterId },
    },
  });
  if (existing) return { ok: false, error: "Zaten oy kullandın" };

  const game = await prisma.game.findUnique({
    where: { id: gameId },
    include: { mode: true },
  });
  if (!game) return { ok: false, error: "Oyun bulunamadı" };

  await prisma.vote.create({
    data: { gameId, questionId, voterId, votedForId },
  });
  return { ok: true };
}

export async function getVoteMatrix(
  gameId: string
): Promise<{ questionId: string; voterId: string; votedForId: string }[]> {
  const votes = await prisma.vote.findMany({
    where: { gameId },
    select: { questionId: true, voterId: true, votedForId: true },
  });
  return votes;
}

export async function getGameWithMode(gameId: string) {
  return prisma.game.findUnique({
    where: { id: gameId },
    include: { mode: true, lobby: { include: { players: { include: { user: true } } } } },
  });
}
