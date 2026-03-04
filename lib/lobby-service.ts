import { prisma } from "./db";
import { generateLobbyCode } from "./lobby-code";
import { DEFAULT_AVATAR_ID } from "./avatars";

const LOBBY_CODE_MAX_ATTEMPTS = 10;
const INACTIVE_LOBBY_MINUTES = 30;

export async function createLobby(leaderNickname: string, avatarId?: string | null): Promise<{
  lobbyId: string;
  code: string;
  userId: string;
} | null> {
  let code: string | null = null;
  for (let i = 0; i < LOBBY_CODE_MAX_ATTEMPTS; i++) {
    const candidate = generateLobbyCode();
    const existing = await prisma.lobby.findUnique({ where: { code: candidate } });
    if (!existing) {
      code = candidate;
      break;
    }
  }
  if (!code) return null;

  const user = await prisma.user.create({
    data: { nickname: leaderNickname, avatarId: avatarId ?? DEFAULT_AVATAR_ID },
  });

  const lobby = await prisma.lobby.create({
    data: {
      code,
      leaderId: user.id,
      status: "waiting",
      timerEnabled: false,
      timerSeconds: 30,
      selfVoteAllowed: true,
    },
  });

  await prisma.lobbyPlayer.create({
    data: { lobbyId: lobby.id, userId: user.id },
  });

  return { lobbyId: lobby.id, code, userId: user.id };
}

export async function joinLobby(
  code: string,
  nickname: string,
  avatarId?: string | null
): Promise<{ lobbyId: string; userId: string } | { error: string }> {
  const lobby = await prisma.lobby.findUnique({
    where: { code: code.toUpperCase() },
    include: { players: { include: { user: true } } },
  });
  if (!lobby) return { error: "Lobi bulunamadı" };
  if (lobby.status !== "waiting") return { error: "Oyun zaten başladı veya bitti" };

  const nicknameExists = lobby.players.some(
    (p) => p.user.nickname.toLowerCase() === nickname.trim().toLowerCase()
  );
  if (nicknameExists) return { error: "Bu lobide bu takma ad zaten kullanılıyor" };

  const user = await prisma.user.create({
    data: { nickname: nickname.trim(), avatarId: avatarId ?? DEFAULT_AVATAR_ID },
  });

  await prisma.lobbyPlayer.create({
    data: { lobbyId: lobby.id, userId: user.id },
  });

  return { lobbyId: lobby.id, userId: user.id };
}

export async function getLobbyByCode(code: string) {
  return prisma.lobby.findUnique({
    where: { code: code.toUpperCase() },
    include: {
      leader: true,
      players: { include: { user: true } },
    },
  });
}

export async function getLobbyById(lobbyId: string) {
  return prisma.lobby.findUnique({
    where: { id: lobbyId },
    include: {
      leader: true,
      players: { include: { user: true } },
    },
  });
}

export async function deleteInactiveLobbies() {
  const cutoff = new Date(Date.now() - INACTIVE_LOBBY_MINUTES * 60 * 1000);
  const deleted = await prisma.lobby.deleteMany({
    where: {
      status: "waiting",
      updatedAt: { lt: cutoff },
    },
  });
  return deleted.count;
}

export async function setLobbyStatus(lobbyId: string, status: "waiting" | "playing" | "finished") {
  return prisma.lobby.update({
    where: { id: lobbyId },
    data: { status, updatedAt: new Date() },
  });
}

export async function kickPlayer(lobbyId: string, userId: string, leaderId: string) {
  const lobby = await prisma.lobby.findUnique({ where: { id: lobbyId } });
  if (!lobby || lobby.leaderId !== leaderId) return false;
  if (userId === leaderId) return false;

  await prisma.lobbyPlayer.deleteMany({
    where: { lobbyId, userId },
  });
  return true;
}

/**
 * Lider çıktığında yeni lider atar. Çıkan userId lider ise, kalan oyunculardan ilkini lider yapar.
 * @returns Yeni lider id veya null (lobi kaldırıldı / tek kişi kaldı)
 */
export async function transferLeaderIfNeeded(lobbyId: string, leavingUserId: string): Promise<string | null> {
  const lobby = await getLobbyById(lobbyId);
  if (!lobby || lobby.leaderId !== leavingUserId) return null;
  const remaining = lobby.players.filter((p) => p.userId !== leavingUserId);
  if (remaining.length === 0) return null;
  const newLeaderId = remaining[0]!.userId;
  await prisma.lobby.update({
    where: { id: lobbyId },
    data: { leaderId: newLeaderId, updatedAt: new Date() },
  });
  return newLeaderId;
}
