"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BackButton } from "@/components/BackButton";

export default function AdminSettingsPage() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    if (!newEmail.trim() && !newPassword.trim()) {
      setError("Yeni e-posta veya yeni şifre girin.");
      return;
    }
    if (newPassword.length > 0 && newPassword.length < 6) {
      setError("Yeni şifre en az 6 karakter olmalı.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          currentPassword,
          newEmail: newEmail.trim() || undefined,
          newPassword: newPassword.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (res.status === 401) {
        router.replace("/admin/login");
        return;
      }
      if (!res.ok) {
        setError(data.error ?? "Güncelleme yapılamadı.");
        return;
      }
      setSuccess(true);
      setCurrentPassword("");
      setNewEmail("");
      setNewPassword("");
      if (data.emailChanged) {
        setTimeout(() => router.replace("/admin/login"), 1500);
      }
    } catch {
      setError("Bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col px-4 py-8">
      <div className="mx-auto w-full max-w-md">
        <BackButton href="/admin" label="Panel" />
        <h1 className="mt-6 text-2xl font-bold text-white">Admin bilgileri</h1>
        <p className="mt-2 text-sm text-gray-400">
          E-posta veya şifrenizi güncellemek için mevcut şifrenizi girin ve değiştirmek istediğiniz alanları doldurun.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-300">
              Mevcut şifre
            </label>
            <input
              id="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-gray-500 focus:border-indigo-500/50 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label htmlFor="newEmail" className="block text-sm font-medium text-gray-300">
              Yeni e-posta (isteğe bağlı)
            </label>
            <input
              id="newEmail"
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-gray-500 focus:border-indigo-500/50 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
              placeholder="yeni@email.com"
            />
          </div>

          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-300">
              Yeni şifre (isteğe bağlı, en az 6 karakter)
            </label>
            <input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              minLength={6}
              className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-gray-500 focus:border-indigo-500/50 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-sm text-red-400">{error}</p>
          )}
          {success && (
            <p className="text-sm text-emerald-400">Bilgiler güncellendi.</p>
          )}

          <button
            type="submit"
            disabled={loading || !currentPassword}
            className="w-full rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Güncelleniyor…" : "Güncelle"}
          </button>
        </form>
      </div>
    </div>
  );
}
