"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { BackButton } from "@/components/BackButton";

type FeedbackItem = {
  id: string;
  type: string;
  text: string;
  readAt: string | null;
  createdAt: string;
};

type Filter = "all" | "unread" | "suggestion" | "complaint";

function formatRelative(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return "Az önce";
  if (diffMins < 60) return `${diffMins} dk önce`;
  if (diffHours < 24) return `${diffHours} saat önce`;
  if (diffDays < 7) return `${diffDays} gün önce`;
  return d.toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: d.getFullYear() !== now.getFullYear() ? "numeric" : undefined });
}

export default function AdminFeedbackPage() {
  const router = useRouter();
  const [list, setList] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");
  const [markingId, setMarkingId] = useState<string | null>(null);

  const load = () => {
    fetch("/api/admin/feedback", { credentials: "include" })
      .then((res) => {
        if (res.status === 401) router.replace("/admin/login");
        return res.json();
      })
      .then((data) => setList(data.feedback ?? []))
      .finally(() => setLoading(false));
  };

  useEffect(() => load(), [router]);

  const filtered = useMemo(() => {
    if (filter === "all") return list;
    if (filter === "unread") return list.filter((i) => !i.readAt);
    if (filter === "suggestion") return list.filter((i) => i.type === "suggestion");
    if (filter === "complaint") return list.filter((i) => i.type === "complaint");
    return list;
  }, [list, filter]);

  const unreadCount = list.filter((i) => !i.readAt).length;

  async function markRead(id: string) {
    setMarkingId(id);
    await fetch(`/api/admin/feedback/${id}`, {
      method: "PATCH",
      credentials: "include",
    });
    load();
    setMarkingId(null);
  }

  const filters: { key: Filter; label: string; count?: number }[] = [
    { key: "all", label: "Tümü", count: list.length },
    { key: "unread", label: "Okunmamış", count: unreadCount },
    { key: "suggestion", label: "Öneri", count: list.filter((i) => i.type === "suggestion").length },
    { key: "complaint", label: "Şikayet", count: list.filter((i) => i.type === "complaint").length },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center px-4 py-8">
        <div className="absolute left-4 top-4">
          <BackButton href="/admin" label="Panel" />
        </div>
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
          <p className="text-gray-400">Yükleniyor…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center px-4 py-8">
      <div className="absolute left-4 top-4">
        <BackButton href="/admin" label="Panel" />
      </div>

      <div className="mx-auto w-full max-w-2xl">
        <motion.header
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="text-2xl font-bold text-white">Öneri & Şikayet</h1>
          <p className="mt-1 text-sm text-gray-400">
            Kullanıcılardan gelen geri bildirimler
            {unreadCount > 0 && (
              <span className="ml-2 rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-medium text-amber-400">
                {unreadCount} okunmamış
              </span>
            )}
          </p>
        </motion.header>

        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mb-6 flex flex-wrap gap-2"
        >
          {filters.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                filter === f.key
                  ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/25"
                  : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
              }`}
            >
              {f.label}
              {f.count !== undefined && f.count > 0 && (
                <span className="ml-1.5 tabular-nums opacity-80">({f.count})</span>
              )}
            </button>
          ))}
        </motion.div>

        {filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/5 py-16 text-center"
          >
            <div className="text-5xl opacity-40">💬</div>
            <p className="mt-4 text-gray-400">
              {filter === "all"
                ? "Henüz geri bildirim yok."
                : filter === "unread"
                  ? "Okunmamış bildirim yok."
                  : "Bu filtrede kayıt yok."}
            </p>
          </motion.div>
        ) : (
          <ul className="space-y-3">
            <AnimatePresence mode="popLayout">
              {filtered.map((item, i) => (
                <motion.li
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ delay: i * 0.03, duration: 0.2 }}
                  className={`rounded-2xl border bg-white/[0.03] p-5 transition ${
                    item.readAt ? "border-white/5 opacity-75" : "border-white/10 shadow-lg shadow-black/10"
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex min-w-0 flex-1 items-center gap-2">
                      <span
                        className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider ${
                          item.type === "complaint"
                            ? "bg-amber-500/15 text-amber-400"
                            : "bg-emerald-500/15 text-emerald-400"
                        }`}
                      >
                        {item.type === "complaint" ? "Şikayet" : "Öneri"}
                      </span>
                      <span className="text-xs text-gray-500" title={new Date(item.createdAt).toLocaleString("tr-TR")}>
                        {formatRelative(item.createdAt)}
                      </span>
                    </div>
                    {!item.readAt ? (
                      <button
                        type="button"
                        onClick={() => markRead(item.id)}
                        disabled={markingId === item.id}
                        className="shrink-0 rounded-xl bg-indigo-500/20 px-3 py-1.5 text-xs font-medium text-indigo-300 transition hover:bg-indigo-500/30 disabled:opacity-50"
                      >
                        {markingId === item.id ? "…" : "Okundu işaretle"}
                      </button>
                    ) : (
                      <span className="shrink-0 text-xs text-gray-500">
                        Okundu · {formatRelative(item.readAt)}
                      </span>
                    )}
                  </div>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-gray-300">
                    {item.text}
                  </p>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
      </div>
    </div>
  );
}
