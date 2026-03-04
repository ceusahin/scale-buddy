"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { BackButton } from "@/components/BackButton";
import { AvatarPicker } from "@/components/AvatarPicker";
import { DEFAULT_AVATAR_ID } from "@/lib/avatars";

export default function CreateLobbyPage() {
  const [nickname, setNickname] = useState("");
  const [avatarId, setAvatarId] = useState(DEFAULT_AVATAR_ID);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!nickname.trim()) {
      setError("Bir takma ad gir");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/lobby/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname: nickname.trim(), avatarId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Lobi oluşturulamadı");
        return;
      }
      const params = new URLSearchParams({
        lobbyId: data.lobbyId,
        userId: data.userId,
        code: data.code,
      });
      router.push(`/lobby/room?${params.toString()}`);
    } catch {
      setError("Bir şeyler yanlış gitti");
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
          Lobi oluştur
        </motion.h1>
        <motion.form
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.08 }}
          onSubmit={handleSubmit}
          className="mt-8 card-glass rounded-3xl p-6"
        >
          <label className="block text-sm font-medium text-gray-400">Avatar seç</label>
          <div className="mt-2">
            <AvatarPicker value={avatarId} onChange={setAvatarId} />
          </div>
          <label className="mt-4 block text-sm font-medium text-gray-400">Takma adın</label>
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            maxLength={30}
            placeholder="örn. Ayşe"
            className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 text-white placeholder-gray-500 transition focus:border-indigo-500/80 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
          />
          {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className="mt-6 w-full rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 py-4 text-lg font-semibold text-white shadow-lg disabled:opacity-50"
          >
            {loading ? "Oluşturuluyor…" : "Lobi Oluştur"}
          </motion.button>
        </motion.form>
      </div>
    </div>
  );
}
