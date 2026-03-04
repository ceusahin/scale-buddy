"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import Link from "next/link";
import { BackButton } from "@/components/BackButton";
import { getAvatarEmoji } from "@/lib/avatars";

type PlayerAnalysis = {
  playerId: string;
  nickname: string;
  avatarId?: string;
  comment: string;
  title: string;
  selectionStats: { timesChosen: number; totalQuestions: number };
};

type Analysis = {
  playerAnalyses: PlayerAnalysis[];
  groupSummary: string;
};

export default function ResultsPage() {
  const searchParams = useSearchParams();
  const gameId = searchParams.get("gameId");
  const userId = searchParams.get("userId");
  const lobbyId = searchParams.get("lobbyId");

  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!gameId) {
      setLoading(false);
      setError("Oyun bilgisi eksik");
      return;
    }
    let cancelled = false;
    fetch(`/api/games/${gameId}/results`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        const raw = data.analysis;
        if (raw && typeof raw === "object") {
          const groupSummary = typeof raw.groupSummary === "string" ? raw.groupSummary : "Grup dinamiği, sorular ışığında birbirlerini nasıl gördüğünüzü yansıtıyor.";
          const playerAnalyses = Array.isArray(raw.playerAnalyses) ? raw.playerAnalyses : [];
          setAnalysis({ groupSummary, playerAnalyses });
          confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
        } else {
          setError(data.error ?? "Sonuçlar yüklenemedi");
        }
      })
      .catch(() => {
        if (!cancelled) setError("Sonuçlar yüklenemedi");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [gameId]);

  if (loading) {
    return (
      <div className="page-bg min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
          <p className="text-gray-400">Sonuçlar yükleniyor…</p>
        </div>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="page-bg min-h-screen flex flex-col items-center justify-center gap-4 px-4">
        <div className="absolute left-4 top-4">
          <BackButton href="/" label="Ana sayfa" />
        </div>
        <p className="text-red-400">{error || "Sonuç yok"}</p>
      </div>
    );
  }

  return (
    <div className="page-bg min-h-screen flex flex-col items-center justify-center px-4 py-8">
      <div className="absolute left-4 top-4">
        <BackButton href="/" label="Ana sayfa" />
      </div>
      <div className="mx-auto w-full max-w-2xl">
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center text-2xl font-bold text-white"
        >
          Sonuçlar
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.08 }}
          className="mt-2 text-center text-gray-400"
        >
          {analysis.groupSummary}
        </motion.p>

        <div className="mt-8 space-y-4">
          {(analysis.playerAnalyses ?? []).map((p, i) => {
            const stats = p.selectionStats ?? { timesChosen: 0, totalQuestions: 0 };
            return (
              <motion.div
                key={p.playerId}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.06 * (i + 1), ease: [0.22, 1, 0.36, 1] }}
                className={`card-glass-elevated rounded-3xl p-6 ${p.playerId === userId ? "ring-2 ring-indigo-500/60" : ""}`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
                    <span className="text-2xl">{getAvatarEmoji(p.avatarId)}</span>
                    {p.nickname}
                  </h2>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-white/10 px-3 py-1 text-sm text-gray-300">
                      {stats.timesChosen}/{stats.totalQuestions} soruda seçildi
                    </span>
                    <span className="rounded-full bg-indigo-500/20 px-3 py-1.5 text-sm font-medium text-indigo-300">
                      {p.title ?? "Oyuncu"}
                    </span>
                  </div>
                </div>
                <p className="mt-4 text-gray-400 leading-relaxed">{p.comment ?? ""}</p>
              </motion.div>
            );
          })}
        </div>
        {analysis.playerAnalyses?.length === 0 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-6 text-center text-gray-500"
          >
            Henüz oyuncu analizi yok.
          </motion.p>
        )}

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-4"
        >
          <Link
            href="/"
            className="inline-block rounded-2xl border border-white/20 bg-white/5 px-6 py-3 font-semibold text-white transition hover:bg-white/10"
          >
            Ana sayfa
          </Link>
          {lobbyId && userId ? (
            <Link
              href={`/lobby/room?lobbyId=${lobbyId}&userId=${userId}`}
              className="inline-block rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-3 font-semibold text-white shadow-lg transition hover:from-indigo-500 hover:to-purple-500"
            >
              Lobiye dön (tekrar oyna)
            </Link>
          ) : (
            <Link
              href="/lobby"
              className="inline-block rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-3 font-semibold text-white shadow-lg transition hover:from-indigo-500 hover:to-purple-500"
            >
              Yeni oyun
            </Link>
          )}
        </motion.div>
      </div>
    </div>
  );
}
