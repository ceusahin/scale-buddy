"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Giriş başarısız");
        return;
      }
      router.replace("/admin");
    } catch {
      setError("Bir şeyler yanlış gitti");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm rounded-2xl border border-white/10 bg-surface-card p-8 shadow-xl"
      >
        <h1 className="text-xl font-bold text-white">Yönetici girişi</h1>
        <form onSubmit={handleSubmit} className="mt-6">
          <label className="block text-sm font-medium text-gray-400">E-posta</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-2 w-full rounded-xl border border-white/20 bg-surface px-4 py-3 text-white focus:border-indigo-500 focus:outline-none"
          />
          <label className="mt-4 block text-sm font-medium text-gray-400">Şifre</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-2 w-full rounded-xl border border-white/20 bg-surface px-4 py-3 text-white focus:border-indigo-500 focus:outline-none"
          />
          {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full rounded-xl bg-indigo-600 py-3 font-semibold text-white disabled:opacity-50"
          >
            {loading ? "Giriş yapılıyor…" : "Giriş yap"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
