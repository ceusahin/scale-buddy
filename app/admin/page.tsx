"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { getSocket } from "@/lib/socket-client";

type Dashboard = {
  totalGames: number;
  mostPopularMode: string;
  topQuestions: { questionId: string; text: string; count: number }[];
  topVotedPlayers: { userId: string; nickname: string; count: number }[];
  stats?: {
    totalUsers: number;
    totalLobbies: number;
    totalVotes: number;
    feedbackTotal: number;
    feedbackUnread: number;
    gamesLast24h: number;
    gamesLast7d: number;
    categoriesCount: number;
    questionsCount: number;
    modesCount: number;
    lastGameAt: string | null;
    liveActiveLobbies?: number;
    liveConnectedUsers?: number;
  };
};

export default function AdminDashboardPage() {
  const router = useRouter();
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboard = async () => {
    const res = await fetch("/api/admin/dashboard", { credentials: "include" });
    if (res.status === 401) {
      router.replace("/admin/login");
      return null;
    }
    return res.json();
  };

  useEffect(() => {
    fetchDashboard().then((data) => {
      if (data?.totalGames !== undefined) setDashboard(data);
    }).finally(() => setLoading(false));
  }, [router]);

  const refreshLive = async () => {
    setRefreshing(true);
    try {
      const data = await fetchDashboard();
      if (data?.totalGames !== undefined) setDashboard(data);
    } finally {
      setRefreshing(false);
    }
  };

  const refreshLiveRef = useRef(refreshLive);
  refreshLiveRef.current = refreshLive;
  useEffect(() => {
    const socket = getSocket();
    const onLiveChanged = () => {
      refreshLiveRef.current();
    };
    socket.on("admin:live-changed", onLiveChanged);
    return () => {
      socket.off("admin:live-changed", onLiveChanged);
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <p className="text-gray-400">Yükleniyor…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center px-4 py-8">
      <div className="mx-auto w-full max-w-4xl">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-white">Yönetici Paneli</h1>
          <button
            type="button"
            onClick={async () => {
              await fetch("/api/admin/logout", { method: "POST", credentials: "include" });
              router.replace("/admin/login");
            }}
            className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm font-medium text-red-300 transition hover:border-red-500/50 hover:bg-red-500/20"
          >
            Çıkış yap
          </button>
        </div>

        <nav className="mt-6 flex flex-wrap gap-4">
          <Link
            href="/admin/categories"
            className="rounded-xl bg-surface-card px-4 py-2 text-white hover:bg-surface-elevated"
          >
            Kategoriler
          </Link>
          <Link
            href="/admin/questions"
            className="rounded-xl bg-surface-card px-4 py-2 text-white hover:bg-surface-elevated"
          >
            Sorular
          </Link>
          <Link
            href="/admin/modes"
            className="rounded-xl bg-surface-card px-4 py-2 text-white hover:bg-surface-elevated"
          >
            Modlar
          </Link>
          <Link
            href="/admin/feedback"
            className="rounded-xl bg-surface-card px-4 py-2 text-white hover:bg-surface-elevated"
          >
            Öneri / Şikayet
          </Link>
          <Link
            href="/admin/settings"
            className="rounded-xl bg-surface-card px-4 py-2 text-white hover:bg-surface-elevated"
          >
            Admin bilgileri
          </Link>
        </nav>

        {dashboard && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-10 space-y-8"
          >
            {dashboard.stats && (
              <>
                {(dashboard.stats.liveActiveLobbies !== undefined || dashboard.stats.liveConnectedUsers !== undefined) && (
                  <section>
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
                        Canlı
                      </h2>
                      <button
                        type="button"
                        onClick={refreshLive}
                        disabled={refreshing}
                        className="rounded-lg border border-emerald-500/40 bg-emerald-500/15 px-3 py-1.5 text-sm font-medium text-emerald-300 transition hover:border-emerald-500/60 hover:bg-emerald-500/25 disabled:opacity-50"
                      >
                        {refreshing ? "Yenileniyor…" : "Yenile"}
                      </button>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
                        <p className="text-xs text-emerald-400/90">Şu an açık lobi</p>
                        <p className="mt-1 text-2xl font-bold tabular-nums text-emerald-300">
                          {dashboard.stats.liveActiveLobbies ?? 0}
                        </p>
                      </div>
                      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
                        <p className="text-xs text-emerald-400/90">Bağlı kullanıcı</p>
                        <p className="mt-1 text-2xl font-bold tabular-nums text-emerald-300">
                          {dashboard.stats.liveConnectedUsers ?? 0}
                        </p>
                      </div>
                    </div>
                  </section>
                )}
                <section>
                  <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500">
                    Özet metrikler
                  </h2>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                      <p className="text-xs text-gray-500">Toplam oyun</p>
                      <p className="mt-1 text-2xl font-bold tabular-nums text-white">{dashboard.totalGames}</p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                      <p className="text-xs text-gray-500">Son 24 saat</p>
                      <p className="mt-1 text-2xl font-bold tabular-nums text-indigo-400">{dashboard.stats.gamesLast24h}</p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                      <p className="text-xs text-gray-500">Son 7 gün</p>
                      <p className="mt-1 text-2xl font-bold tabular-nums text-indigo-400">{dashboard.stats.gamesLast7d}</p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                      <p className="text-xs text-gray-500">Toplam oy</p>
                      <p className="mt-1 text-2xl font-bold tabular-nums text-white">{dashboard.stats.totalVotes}</p>
                    </div>
                  </div>
                </section>

                <section>
                  <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500">
                    Veri / içerik
                  </h2>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                      <p className="text-xs text-gray-500">Kullanıcı (kayıt)</p>
                      <p className="mt-1 text-xl font-bold tabular-nums text-white">{dashboard.stats.totalUsers}</p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                      <p className="text-xs text-gray-500">Lobi</p>
                      <p className="mt-1 text-xl font-bold tabular-nums text-white">{dashboard.stats.totalLobbies}</p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                      <p className="text-xs text-gray-500">Kategori / Soru / Mod</p>
                      <p className="mt-1 text-xl font-bold tabular-nums text-white">
                        {dashboard.stats.categoriesCount} / {dashboard.stats.questionsCount} / {dashboard.stats.modesCount}
                      </p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                      <p className="text-xs text-gray-500">Öneri/Şikayet</p>
                      <p className="mt-1 text-xl font-bold tabular-nums text-white">
                        {dashboard.stats.feedbackTotal}
                        {dashboard.stats.feedbackUnread > 0 && (
                          <span className="ml-1.5 text-amber-400">({dashboard.stats.feedbackUnread} okunmamış)</span>
                        )}
                      </p>
                    </div>
                  </div>
                </section>

                {dashboard.stats.lastGameAt && (
                  <section>
                    <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500">
                      Son aktivite
                    </h2>
                    <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-gray-400">
                      Son oyun:{" "}
                      <span className="font-medium text-white">
                        {new Date(dashboard.stats.lastGameAt).toLocaleString("tr-TR", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </span>
                    </div>
                  </section>
                )}
              </>
            )}

            <section>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500">
                İçerik kullanımı
              </h2>
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
                  <h3 className="text-sm font-semibold text-white">En popüler mod</h3>
                  <p className="mt-1 text-lg text-gray-300">{dashboard.mostPopularMode}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
                  <h3 className="mb-2 text-sm font-semibold text-white">En çok oylanan sorular (ilk 5)</h3>
                  <ul className="space-y-1.5 text-sm text-gray-400">
                    {dashboard.topQuestions.length
                      ? dashboard.topQuestions.map((q) => (
                          <li key={q.questionId}>
                            {q.text.slice(0, 50)}… — <span className="tabular-nums text-gray-300">{q.count}</span> oy
                          </li>
                        ))
                      : "Henüz veri yok"}
                  </ul>
                </div>
              </div>
              <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-5">
                <h3 className="mb-2 text-sm font-semibold text-white">En çok oylanan oyuncular (ilk 5)</h3>
                <ul className="space-y-1.5 text-sm text-gray-400">
                  {dashboard.topVotedPlayers.length
                    ? dashboard.topVotedPlayers.map((u) => (
                        <li key={u.userId}>
                          {u.nickname} — <span className="tabular-nums text-gray-300">{u.count}</span> oy
                        </li>
                      ))
                    : "Henüz veri yok"}
                </ul>
              </div>
            </section>
          </motion.div>
        )}
      </div>
    </div>
  );
}
