"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getSocket } from "@/lib/socket-client";
import { getAvatarEmoji } from "@/lib/avatars";

type Question = { id: string; text: string };
type Player = { id: string; nickname: string; avatarId?: string };

/** Soru öncesi geri sayım: 2, 1 (her biri 1 saniye) */
const COUNTDOWN_SECONDS = 2;

export default function GamePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const lobbyId = searchParams.get("lobbyId");
  const userId = searchParams.get("userId");
  const gameId = searchParams.get("gameId");

  const [question, setQuestion] = useState<Question | null>(null);
  const [index, setIndex] = useState(0);
  const [total, setTotal] = useState(10);
  const [players, setPlayers] = useState<Player[]>([]);
  const [votedFor, setVotedFor] = useState<string | null>(null);
  const [votedCount, setVotedCount] = useState(0);
  const [selfVoteAllowed, setSelfVoteAllowed] = useState(true);
  const [timerEnabled, setTimerEnabled] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(30);
  const [questionTimeLeft, setQuestionTimeLeft] = useState<number | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [pendingQuestion, setPendingQuestion] = useState<Question | null>(null);
  const [disconnected, setDisconnected] = useState(false);
  const countdownTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const questionTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const rejoinGame = () => {
    if (!lobbyId || !userId) return;
    setDisconnected(false);
    getSocket().emit("reconnect:lobby", { lobbyId, userId });
  };

  useEffect(() => {
    if (!lobbyId || !userId) return;
    const socket = getSocket();
    socket.emit("reconnect:lobby", { lobbyId, userId });
    const onConnect = () => {
      setDisconnected(false);
      socket.emit("reconnect:lobby", { lobbyId, userId });
    };
    const onDisconnect = () => setDisconnected(true);
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("lobby:state", () => {});
    socket.on("game:started", (data: { gameId: string; questionIds: string[]; mode: { selfVoteAllowed: boolean; timerEnabled?: boolean; timerSeconds?: number }; players: Player[] }) => {
      setPlayers(data.players);
      setSelfVoteAllowed(data.mode.selfVoteAllowed);
      setTimerEnabled(data.mode.timerEnabled ?? false);
      setTimerSeconds(data.mode.timerSeconds ?? 30);
      setVotedFor(null);
      setVotedCount(0);
    });
    socket.on("game:question", (data: { index: number; total: number; question: Question | null; timerEnabled?: boolean; timerSeconds?: number }) => {
      setIndex(data.index);
      setTotal(data.total);
      setVotedFor(null);
      setVotedCount(0);
      if (typeof data.timerEnabled === "boolean") setTimerEnabled(data.timerEnabled);
      if (typeof data.timerSeconds === "number" && data.timerSeconds > 0) setTimerSeconds(data.timerSeconds);
      const q = data.question && data.question.text != null
        ? { id: data.question.id, text: data.question.text }
        : { id: `q-${data.index}`, text: "Soru yüklenemedi." };
      setPendingQuestion(q);
      setCountdown(COUNTDOWN_SECONDS);
    });
    socket.on("game:reconnect", (data: { gameId: string; currentIndex: number; questionIds: string[]; question: Question | null; players: Player[]; mode: { selfVoteAllowed: boolean; timerEnabled?: boolean; timerSeconds?: number } }) => {
      setPlayers(data.players);
      setSelfVoteAllowed(data.mode.selfVoteAllowed);
      setTimerEnabled(data.mode.timerEnabled ?? false);
      setTimerSeconds(data.mode.timerSeconds ?? 30);
      setIndex(data.currentIndex);
      setTotal(data.questionIds.length);
      setQuestion(data.question ?? null);
      setPendingQuestion(null);
      setCountdown(null);
      setQuestionTimeLeft(null);
      setVotedFor(null);
    });
    socket.on("vote:recorded", (data: { votedCount: number; totalCount: number }) => {
      setVotedCount(data.votedCount);
    });
    socket.on("game:results", () => {
      router.push(`/results?lobbyId=${lobbyId}&userId=${userId}&gameId=${gameId}`);
    });
    socket.on("vote:error", (data: { message: string }) => {
      console.warn("Vote error:", data.message);
    });
    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("lobby:state");
      socket.off("game:started");
      socket.off("game:question");
      socket.off("game:reconnect");
      socket.off("vote:recorded");
      socket.off("game:results");
      socket.off("vote:error");
    };
  }, [lobbyId, userId, gameId]);

  useEffect(() => {
    if (!gameId || !lobbyId || !userId) return;
    const socket = getSocket();
    socket.emit("reconnect:lobby", { lobbyId, userId });
  }, [gameId, lobbyId, userId]);

  useEffect(() => {
    if (countdown === null) return;
    if (countdownTimerRef.current) clearTimeout(countdownTimerRef.current);
    if (countdown === 0) {
      if (pendingQuestion) {
        setQuestion(pendingQuestion);
      }
      setPendingQuestion(null);
      setCountdown(null);
      return;
    }
    countdownTimerRef.current = setTimeout(() => {
      countdownTimerRef.current = null;
      setCountdown((c) => (c === null ? null : c - 1));
    }, 1000);
    return () => {
      if (countdownTimerRef.current) {
        clearTimeout(countdownTimerRef.current);
        countdownTimerRef.current = null;
      }
    };
  }, [countdown, pendingQuestion]);

  useEffect(() => {
    if (!question || !timerEnabled || timerSeconds <= 0) {
      setQuestionTimeLeft(null);
      return;
    }
    setQuestionTimeLeft(timerSeconds);
    questionTimerRef.current = setInterval(() => {
      setQuestionTimeLeft((prev) => {
        if (prev === null || prev <= 1) {
          if (questionTimerRef.current) {
            clearInterval(questionTimerRef.current);
            questionTimerRef.current = null;
          }
          return null;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (questionTimerRef.current) {
        clearInterval(questionTimerRef.current);
        questionTimerRef.current = null;
      }
    };
  }, [question?.id, timerEnabled, timerSeconds]);

  const submitVote = (votedForId: string) => {
    if (!question || !gameId || votedFor) return;
    if (votedForId === userId && !selfVoteAllowed) return;
    setVotedFor(votedForId);
    const socket = getSocket();
    socket.emit("vote:submit", { gameId, questionId: question.id, votedForId });
  };

  if (!lobbyId || !userId) {
    return (
      <div className="page-bg min-h-screen flex items-center justify-center px-4">
        <p className="text-gray-400">Oturum bilgisi eksik. Lobige dön.</p>
      </div>
    );
  }

  const progress = total > 0 ? ((index + 1) / total) * 100 : 0;

  return (
    <div className="page-bg min-h-screen flex flex-col items-center justify-center px-4 py-6">
      {disconnected && (
        <div className="fixed left-4 right-4 top-4 z-40 rounded-2xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 backdrop-blur-sm sm:left-auto sm:right-4 sm:max-w-sm">
          <p className="text-sm text-amber-200">Bağlantı koptu. Tekrar katılmak için butona tıkla.</p>
          <button
            type="button"
            onClick={rejoinGame}
            className="mt-2 w-full rounded-xl bg-amber-500/30 px-4 py-2 text-sm font-medium text-amber-100 transition hover:bg-amber-500/50"
          >
            Tekrar bağlan
          </button>
        </div>
      )}
      <div className="mx-auto w-full max-w-lg">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/10">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 shadow-glow"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
          <p className="mt-2.5 text-center text-sm font-medium text-gray-400">
            Soru {index + 1} / {total}
          </p>
        </motion.div>

        <AnimatePresence mode="wait">
          {countdown !== null && countdown > 0 ? (
            <motion.div
              key="countdown"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.2 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="flex min-h-[200px] items-center justify-center rounded-3xl border border-white/10 bg-white/5 backdrop-blur-sm"
            >
              <motion.span
                key={countdown}
                initial={{ opacity: 0, scale: 0.3 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="text-8xl font-bold tabular-nums text-white drop-shadow-[0_0_40px_rgba(99,102,241,0.6)]"
              >
                {countdown}
              </motion.span>
            </motion.div>
          ) : question ? (
            <motion.div
              key={question.id}
              initial={{ opacity: 0, y: 32, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -24, filter: "blur(4px)" }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="card-glass-elevated rounded-3xl p-6"
            >
              {timerEnabled && questionTimeLeft !== null && timerSeconds > 0 && (
                <div className="mb-4">
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/10">
                    <motion.div
                      className="h-full rounded-full"
                      initial={false}
                      animate={{
                        width: `${(questionTimeLeft / timerSeconds) * 100}%`,
                        backgroundColor: questionTimeLeft <= 5 ? "rgb(248 113 113)" : questionTimeLeft <= 10 ? "rgb(239 68 68)" : "rgb(99 102 241)",
                        boxShadow: questionTimeLeft <= 5 ? "0 0 16px rgba(248,113,113,0.9)" : questionTimeLeft <= 10 ? "0 0 8px rgba(239,68,68,0.5)" : "none",
                        opacity: questionTimeLeft <= 5 ? [1, 0.75, 1] : 1,
                      }}
                      transition={{
                        width: { duration: 0.5, ease: "linear" },
                        backgroundColor: { duration: 0.2 },
                        boxShadow: { duration: 0.2 },
                        opacity: questionTimeLeft <= 5 ? { duration: 0.5, repeat: Infinity } : { duration: 0 },
                      }}
                    />
                  </div>
                </div>
              )}
              <p className="text-lg leading-relaxed text-white">{question.text}</p>
            </motion.div>
          ) : null}
        </AnimatePresence>

        {countdown === null && question && (
          <>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="mt-6 text-sm font-medium text-gray-400"
            >
              Soruya en çok kim uyuyor?
            </motion.p>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mt-3 flex items-center gap-3"
            >
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${players.length ? (votedCount / players.length) * 100 : 0}%` }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                />
              </div>
              <span className="w-14 shrink-0 text-right text-xs font-medium tabular-nums text-gray-400">
                {votedCount}/{players.length} oy verdi
              </span>
            </motion.div>
            <div className="mt-3 grid gap-3">
              {players.map((p) => {
                const isDisabled = !!votedFor;
                const isSelected = votedFor === p.id;
                const isSelf = p.id === userId;
                const allowSelf = selfVoteAllowed || !isSelf;
                return (
                  <motion.button
                    key={p.id}
                    type="button"
                    disabled={isDisabled || !allowSelf}
                    whileHover={!isDisabled && allowSelf ? { scale: 1.02 } : {}}
                    whileTap={!isDisabled && allowSelf ? { scale: 0.98 } : {}}
                    onClick={() => allowSelf && submitVote(p.id)}
                    className={`rounded-2xl border px-4 py-4 text-left font-medium transition ${
                      isSelected
                        ? "border-indigo-500/80 bg-indigo-500/20 text-white ring-2 ring-indigo-500/40 shadow-glow"
                        : isDisabled
                        ? "border-white/5 bg-white/5 text-gray-500"
                        : "card-glass border-white/10 text-white hover:border-indigo-500/40 hover:bg-white/5"
                    } ${!allowSelf ? "opacity-50" : ""}`}
                  >
                    <span className="mr-2 text-xl">{getAvatarEmoji(p.avatarId)}</span>
                    {p.nickname}
                    {isSelf && " (sen)"}
                  </motion.button>
                );
              })}
            </div>

            {votedFor && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-4 text-center text-sm text-gray-400"
              >
                Oy gönderildi. Diğerlerini bekliyoruz…
              </motion.p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
