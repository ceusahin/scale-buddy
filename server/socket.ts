import { Server } from "socket.io";
import { prisma } from "@/lib/db";
import { getLobbyById } from "@/lib/lobby-service";
import {
  pickQuestionsForGame,
  recordVote,
  getVoteMatrix,
  getGameWithMode,
} from "@/lib/game-logic";
import { setLobbyStatus, transferLeaderIfNeeded, kickPlayer } from "@/lib/lobby-service";
import { analyze } from "@/lib/ai-analysis";

interface GameState {
  questionIds: string[];
  currentIndex: number;
  playerIds: Set<string>;
  votedSet: Set<string>;
  modeId: string;
  selfVoteAllowed: boolean;
  timerEnabled: boolean;
  timerSeconds: number;
}

const gameStates = new Map<string, GameState>();

/**
 * Lobi id → o anda o lobide bağlı kullanıcı id'leri.
 * Lobi açık (oyun başlamamış) veya oyun esnasında fark etmeksizin, lobiye girmiş her socket burada tutulur.
 * Sadece disconnect veya kick ile çıkarılır.
 */
const connectedInLobby = new Map<string, Set<string>>();

function roomId(lobbyId: string) {
  return `lobby:${lobbyId}`;
}

function ensureConnectedSet(lobbyId: string): Set<string> {
  let set = connectedInLobby.get(lobbyId);
  if (!set) {
    set = new Set();
    connectedInLobby.set(lobbyId, set);
  }
  return set;
}

/**
 * Canlı lobi ve canlı kullanıcı sayısı (admin dashboard için).
 * - Canlı lobi: En az bir bağlı kullanıcısı olan her lobi (lobi açık/beklemede veya oyun esnasında).
 * - Canlı kullanıcı: Herhangi bir lobiye girmiş (socket ile bağlı) her kullanıcı.
 */
export function getLiveStats(): { activeLobbies: number; connectedUsers: number } {
  let connectedUsers = 0;
  for (const set of connectedInLobby.values()) {
    connectedUsers += set.size;
  }
  return {
    activeLobbies: connectedInLobby.size,
    connectedUsers,
  };
}

/** API route tarafından kullanılır; socket sunucusunun bulunduğu process'teki canlı veriyi döndürür. */
export function getLiveStatsForApi(): { activeLobbies: number; connectedUsers: number } {
  const getter = globalThis.__scaleLiveStatsGetter;
  return getter ? getter() : { activeLobbies: 0, connectedUsers: 0 };
}

const ADMIN_LIVE_ROOM = "admin-live";

function isAdminFromHandshake(socket: { handshake?: { headers?: Record<string, string | string[] | undefined> } }): boolean {
  const raw = socket.handshake?.headers?.cookie;
  if (!raw || typeof raw !== "string") return false;
  const match = raw.match(/\badmin_token=([^;]+)/);
  const token = match?.[1]?.trim();
  if (!token) return false;
  try {
    const decoded = Buffer.from(token, "base64").toString();
    const [email] = decoded.split(":");
    return email === process.env.ADMIN_EMAIL;
  } catch {
    return false;
  }
}

function notifyAdminLiveChanged(io: Server) {
  io.to(ADMIN_LIVE_ROOM).emit("admin:live-changed");
}

/** API route'ları farklı modül örneğinden çalışabildiği için canlı istatistikleri global üzerinden paylaşıyoruz. */
declare global {
  // eslint-disable-next-line no-var
  var __scaleLiveStatsGetter: (() => { activeLobbies: number; connectedUsers: number }) | undefined;
}

export function attachSocketHandlers(io: Server) {
  globalThis.__scaleLiveStatsGetter = getLiveStats;

  io.on("connection", (socket) => {
    if (isAdminFromHandshake(socket)) socket.join(ADMIN_LIVE_ROOM);

    socket.on("lobby:join", async (payload: { lobbyId: string; userId: string }) => {
      const { lobbyId, userId } = payload || {};
      if (!lobbyId || !userId) return;
      const lobby = await getLobbyById(lobbyId);
      if (!lobby) return;
      const isPlayer = lobby.players.some((p) => p.userId === userId);
      if (!isPlayer) return;

      socket.data.lobbyId = lobbyId;
      socket.data.userId = userId;
      socket.join(roomId(lobbyId));
      ensureConnectedSet(lobbyId).add(userId);

      const players = lobby.players.map((p) => ({
        id: p.user.id,
        nickname: p.user.nickname,
        avatarId: p.user.avatarId ?? "fox",
        isLeader: lobby.leaderId === p.user.id,
      }));
      socket.emit("lobby:state", {
        players,
        leaderId: lobby.leaderId,
        code: lobby.code,
        status: lobby.status,
        timerEnabled: lobby.timerEnabled ?? false,
        timerSeconds: lobby.timerSeconds ?? 30,
        selfVoteAllowed: lobby.selfVoteAllowed ?? true,
      });
      io.to(roomId(lobbyId)).emit("lobby:players", players);
      notifyAdminLiveChanged(io);
    });

    socket.on("lobby:updateSettings", async (payload: { lobbyId: string; timerEnabled?: boolean; timerSeconds?: number; selfVoteAllowed?: boolean }) => {
      const { lobbyId, timerEnabled, timerSeconds, selfVoteAllowed } = payload ?? {};
      if (!lobbyId) return;
      const userId = socket.data.userId;
      if (!userId) return;
      const lobby = await getLobbyById(lobbyId);
      if (!lobby || lobby.leaderId !== userId) return;
      if (lobby.status !== "waiting" && lobby.status !== "finished") return;

      const data: { timerEnabled?: boolean; timerSeconds?: number; selfVoteAllowed?: boolean } = {};
      if (typeof timerEnabled === "boolean") data.timerEnabled = timerEnabled;
      if (typeof timerSeconds === "number" && timerSeconds >= 5 && timerSeconds <= 120) data.timerSeconds = timerSeconds;
      if (typeof selfVoteAllowed === "boolean") data.selfVoteAllowed = selfVoteAllowed;

      await prisma.lobby.update({
        where: { id: lobbyId },
        data: { ...data, updatedAt: new Date() },
      });
      const updated = await getLobbyById(lobbyId);
      if (!updated) return;
      const players = updated.players.map((p) => ({
        id: p.user.id,
        nickname: p.user.nickname,
        avatarId: p.user.avatarId ?? "fox",
        isLeader: updated.leaderId === p.user.id,
      }));
      io.to(roomId(lobbyId)).emit("lobby:state", {
        players,
        leaderId: updated.leaderId,
        code: updated.code,
        status: updated.status,
        timerEnabled: updated.timerEnabled ?? false,
        timerSeconds: updated.timerSeconds ?? 30,
        selfVoteAllowed: updated.selfVoteAllowed ?? true,
      });
    });

    socket.on("lobby:kick", async (payload: { lobbyId: string; userIdToKick: string }) => {
      const { lobbyId, userIdToKick } = payload || {};
      const leaderId = socket.data.userId;
      if (!lobbyId || !userIdToKick || !leaderId) return;
      const ok = await kickPlayer(lobbyId, userIdToKick, leaderId);
      if (!ok) return;
      connectedInLobby.get(lobbyId)?.delete(userIdToKick);
      notifyAdminLiveChanged(io);
      const lobby = await getLobbyById(lobbyId);
      if (lobby) {
        const players = lobby.players.map((p) => ({
          id: p.user.id,
          nickname: p.user.nickname,
          avatarId: p.user.avatarId ?? "fox",
          isLeader: lobby.leaderId === p.user.id,
        }));
        io.to(roomId(lobbyId)).emit("lobby:state", {
          players,
          leaderId: lobby.leaderId,
          code: lobby.code,
          status: lobby.status,
          timerEnabled: lobby.timerEnabled ?? false,
          timerSeconds: lobby.timerSeconds ?? 30,
          selfVoteAllowed: lobby.selfVoteAllowed ?? true,
        });
      }
      for (const [, s] of io.sockets.sockets) {
        if (s.data.userId === userIdToKick && s.data.lobbyId === lobbyId) {
          s.data.lobbyId = undefined;
          s.data.userId = undefined;
          s.emit("lobby:kicked");
          break;
        }
      }
    });

    socket.on("disconnect", () => {
      const lobbyId = socket.data.lobbyId as string | undefined;
      const userId = socket.data.userId as string | undefined;
      if (lobbyId && userId) {
        const set = connectedInLobby.get(lobbyId);
        set?.delete(userId);
        if (set?.size === 0) connectedInLobby.delete(lobbyId);
        notifyAdminLiveChanged(io);
        (async () => {
          await transferLeaderIfNeeded(lobbyId, userId);
          await prisma.lobbyPlayer.deleteMany({ where: { lobbyId, userId } });
          const lobby = await getLobbyById(lobbyId);
          if (lobby) {
            const players = lobby.players.map((p) => ({
              id: p.user.id,
              nickname: p.user.nickname,
              avatarId: p.user.avatarId ?? "fox",
              isLeader: lobby.leaderId === p.user.id,
            }));
            io.to(roomId(lobbyId)).emit("lobby:state", {
              players,
              leaderId: lobby.leaderId,
              code: lobby.code,
              status: lobby.status,
              timerEnabled: lobby.timerEnabled ?? false,
              timerSeconds: lobby.timerSeconds ?? 30,
              selfVoteAllowed: lobby.selfVoteAllowed ?? true,
            });
          }
        })();
      }
    });

    socket.on("game:start", async (payload: { lobbyId: string; modeId: string }) => {
      const { lobbyId, modeId } = payload || {};
      if (!lobbyId || !modeId) return;
      const lobby = await getLobbyById(lobbyId);
      if (!lobby || lobby.leaderId !== socket.data.userId) return;
      if (lobby.status !== "waiting" && lobby.status !== "finished") return;
      if (lobby.players.length < 2) return;

      const connected = connectedInLobby.get(lobbyId) ?? new Set<string>();
      const missing: string[] = [];
      for (const p of lobby.players) {
        if (!connected.has(p.userId)) missing.push(p.user.nickname);
      }
      if (missing.length > 0) {
        socket.emit("game:start:not_ready", { missing });
        return;
      }

      const mode = await prisma.mode.findUnique({
        where: { id: modeId },
        include: { categories: true },
      });
      if (!mode || !mode.isActive) return;

      const questionIds = await pickQuestionsForGame(modeId);
      if (questionIds.length < 10) return;

      const game = await prisma.game.create({
        data: {
          lobbyId,
          modeId,
          selfVoteAllowed: lobby.selfVoteAllowed ?? true,
          timerEnabled: lobby.timerEnabled ?? false,
          timerSeconds: lobby.timerSeconds ?? 30,
        },
      });
      await setLobbyStatus(lobbyId, "playing");

      const playerIds = new Set(lobby.players.map((p) => p.userId));
      const gameSelfVote = lobby.selfVoteAllowed ?? true;
      const gameTimerEnabled = lobby.timerEnabled ?? false;
      const gameTimerSeconds = lobby.timerSeconds ?? 30;
      gameStates.set(game.id, {
        questionIds,
        currentIndex: 0,
        playerIds,
        votedSet: new Set(),
        modeId,
        selfVoteAllowed: gameSelfVote,
        timerEnabled: gameTimerEnabled,
        timerSeconds: gameTimerSeconds,
      });

      io.to(roomId(lobbyId)).emit("game:started", {
        gameId: game.id,
        questionIds,
        mode: {
          name: mode.name,
          selfVoteAllowed: gameSelfVote,
          timerEnabled: lobby.timerEnabled ?? false,
          timerSeconds: lobby.timerSeconds ?? 30,
        },
        players: lobby.players.map((p) => ({ id: p.user.id, nickname: p.user.nickname, avatarId: p.user.avatarId ?? "fox" })),
      });

      const firstQuestion = await prisma.question.findUnique({
        where: { id: questionIds[0]! },
        select: { id: true, text: true },
      });
      io.to(roomId(lobbyId)).emit("game:question", {
        index: 0,
        total: questionIds.length,
        question: firstQuestion ?? { id: questionIds[0]!, text: "Soru yüklenemedi." },
        timerEnabled: gameTimerEnabled,
        timerSeconds: gameTimerSeconds,
      });
    });

    socket.on(
      "vote:submit",
      async (payload: { gameId: string; questionId: string; votedForId: string }) => {
        const { gameId, questionId, votedForId } = payload || {};
        const userId = socket.data.userId;
        const lobbyId = socket.data.lobbyId;
        if (!gameId || !questionId || !votedForId || !userId || !lobbyId) return;

        const state = gameStates.get(gameId);
        if (!state) return;
        if (state.votedSet.has(userId)) {
          socket.emit("vote:error", { message: "Already voted" });
          return;
        }

        const result = await recordVote(
          gameId,
          questionId,
          userId,
          votedForId,
          state.selfVoteAllowed
        );
        if (!result.ok) {
          socket.emit("vote:error", { message: result.error ?? "Vote failed" });
          return;
        }

        state.votedSet.add(userId);
        io.to(roomId(lobbyId)).emit("vote:recorded", {
          userId,
          votedForId,
          questionId,
          votedCount: state.votedSet.size,
          totalCount: state.playerIds.size,
        });

        if (state.votedSet.size === state.playerIds.size) {
          state.votedSet.clear();
          state.currentIndex += 1;

          if (state.currentIndex >= state.questionIds.length) {
            gameStates.delete(gameId);
            const game = await getGameWithMode(gameId);
            if (!game) return;
            await setLobbyStatus(lobbyId, "finished");

            const voteMatrix = await getVoteMatrix(gameId);
            const playerIds = game.lobby.players.map((p) => p.user.id);
            const players = game.lobby.players.map((p) => ({
              id: p.user.id,
              nickname: p.user.nickname,
            }));
            const { getSelectionStats, getQuestionLevelStats } = await import("@/lib/ai-analysis");
            const { selectionByPlayer, totalQuestions } = getSelectionStats(
              voteMatrix,
              playerIds
            );
            const questionIds = [...new Set(voteMatrix.map((v) => v.questionId))];
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

            io.to(roomId(lobbyId)).emit("game:results", {
              analysis: { ...analysis, playerAnalyses: playerAnalysesWithAvatar },
              voteMatrix,
            });
          } else {
            const nextQuestionId = state.questionIds[state.currentIndex];
            const nextQuestion = await prisma.question.findUnique({
              where: { id: nextQuestionId! },
              select: { id: true, text: true },
            });
            io.to(roomId(lobbyId)).emit("game:question", {
              index: state.currentIndex,
              total: state.questionIds.length,
              question: nextQuestion ?? { id: nextQuestionId!, text: "Soru yüklenemedi." },
              timerEnabled: state.timerEnabled,
              timerSeconds: state.timerSeconds,
            });
          }
        }
      }
    );

    socket.on("reconnect:lobby", async (payload: { lobbyId: string; userId: string }) => {
      const { lobbyId, userId } = payload || {};
      if (!lobbyId || !userId) return;
      const lobby = await getLobbyById(lobbyId);
      if (!lobby) return;
      const isPlayer = lobby.players.some((p) => p.userId === userId);
      if (!isPlayer) return;

      socket.data.lobbyId = lobbyId;
      socket.data.userId = userId;
      socket.join(roomId(lobbyId));
      ensureConnectedSet(lobbyId).add(userId);

      const players = lobby.players.map((p) => ({
        id: p.user.id,
        nickname: p.user.nickname,
        avatarId: p.user.avatarId ?? "fox",
        isLeader: lobby.leaderId === p.user.id,
      }));
      socket.emit("lobby:state", {
        players,
        leaderId: lobby.leaderId,
        code: lobby.code,
        status: lobby.status,
        timerEnabled: lobby.timerEnabled ?? false,
        timerSeconds: lobby.timerSeconds ?? 30,
        selfVoteAllowed: lobby.selfVoteAllowed ?? true,
      });
      notifyAdminLiveChanged(io);

      if (lobby.status === "playing") {
        const game = await prisma.game.findFirst({
          where: { lobbyId },
          orderBy: { createdAt: "desc" },
          include: { mode: true },
        });
        if (game) {
          const state = gameStates.get(game.id);
          if (state) {
            const currentQuestionId = state.questionIds[state.currentIndex];
            const question = currentQuestionId
              ? await prisma.question.findUnique({ where: { id: currentQuestionId } })
              : null;
            socket.emit("game:reconnect", {
              gameId: game.id,
              questionIds: state.questionIds,
              currentIndex: state.currentIndex,
              mode: {
                name: game.mode.name,
                selfVoteAllowed: game.selfVoteAllowed ?? true,
                timerEnabled: game.timerEnabled ?? false,
                timerSeconds: game.timerSeconds ?? 30,
              },
              players: lobby.players.map((p) => ({ id: p.user.id, nickname: p.user.nickname, avatarId: p.user.avatarId ?? "fox" })),
              question: question,
            });
          }
        }
      }
    });
  });
}
