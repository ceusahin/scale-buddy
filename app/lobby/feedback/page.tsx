"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { BackButton } from "@/components/BackButton";

type FeedbackType = "suggestion" | "complaint";

export default function LobbyFeedbackPage() {
  const [type, setType] = useState<FeedbackType>("suggestion");
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!text.trim()) {
      setError("Lütfen metin girin.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, text: text.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gönderilemedi");
        return;
      }
      setSent(true);
      setText("");
    } catch {
      setError("Bir şeyler yanlış gitti.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-bg min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <div className="absolute left-4 top-4">
        <BackButton href="/lobby" label="Geri" />
      </div>
      <div className="mx-auto w-full max-w-md">
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center text-2xl font-bold text-white"
        >
          Öneri / Şikayet
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.06 }}
          className="mt-2 text-center text-sm text-gray-400"
        >
          Görüşlerinizi iletin, değerlendiriyoruz.
        </motion.p>

        {sent ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-8 rounded-2xl border border-green-500/30 bg-green-500/10 p-6 text-center"
          >
            <p className="font-medium text-green-400">Gönderildi.</p>
            <p className="mt-1 text-sm text-gray-400">Teşekkür ederiz.</p>
            <button
              type="button"
              onClick={() => setSent(false)}
              className="mt-4 text-sm text-indigo-400 hover:text-white"
            >
              Yeni gönder
            </button>
          </motion.div>
        ) : (
          <motion.form
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.08 }}
            onSubmit={handleSubmit}
            className="mt-8 card-glass rounded-3xl p-6"
          >
            <label className="block text-sm font-medium text-gray-400">Tür</label>
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setType("suggestion")}
                className={`flex-1 rounded-xl border px-4 py-2.5 text-sm font-medium transition ${
                  type === "suggestion"
                    ? "border-indigo-500/60 bg-indigo-500/20 text-white"
                    : "border-white/10 bg-white/5 text-gray-400 hover:border-white/20"
                }`}
              >
                Öneri
              </button>
              <button
                type="button"
                onClick={() => setType("complaint")}
                className={`flex-1 rounded-xl border px-4 py-2.5 text-sm font-medium transition ${
                  type === "complaint"
                    ? "border-indigo-500/60 bg-indigo-500/20 text-white"
                    : "border-white/10 bg-white/5 text-gray-400 hover:border-white/20"
                }`}
              >
                Şikayet
              </button>
            </div>
            <label className="mt-4 block text-sm font-medium text-gray-400">Mesajınız</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={2000}
              rows={5}
              placeholder="Detayları yazın…"
              className="mt-2 w-full resize-y rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-gray-500 transition focus:border-indigo-500/80 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            />
            <p className="mt-1 text-right text-xs text-gray-500">{text.length}/2000</p>
            {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="mt-6 w-full rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 py-4 text-lg font-semibold text-white shadow-lg disabled:opacity-50"
            >
              {loading ? "Gönderiliyor…" : "Gönder"}
            </motion.button>
          </motion.form>
        )}
      </div>
    </div>
  );
}
