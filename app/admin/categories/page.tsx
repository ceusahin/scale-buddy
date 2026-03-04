"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { BackButton } from "@/components/BackButton";

type Category = { id: string; name: string; isActive: boolean };

export default function AdminCategoriesPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    fetch("/api/admin/categories", { credentials: "include" })
      .then((res) => {
        if (res.status === 401) router.replace("/admin/login");
        return res.json();
      })
      .then((data) => setCategories(data.categories ?? []))
      .finally(() => setLoading(false));
  };

  useEffect(() => load(), [router]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: newName.trim(), isActive: true }),
      });
      if (res.ok) {
        setNewName("");
        load();
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleActive(c: Category) {
    await fetch(`/api/admin/categories/${c.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ name: c.name, isActive: !c.isActive }),
    });
    load();
  }

  async function remove(id: string) {
    if (!confirm("Bu kategori silinsin mi?")) return;
    await fetch(`/api/admin/categories/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    load();
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <p className="text-gray-400">Yükleniyor…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center px-4 py-8">
      <div className="absolute left-4 top-4">
        <BackButton href="/admin" label="Panel" />
      </div>
      <div className="mx-auto max-w-2xl">
        <h1 className="mt-14 text-2xl font-bold text-white">Kategoriler</h1>

        <form onSubmit={create} className="mt-6 flex gap-2">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Kategori adı"
            className="flex-1 rounded-xl border border-white/20 bg-surface-card px-4 py-2 text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={submitting}
            className="rounded-xl bg-indigo-600 px-4 py-2 font-medium text-white disabled:opacity-50"
          >
            Ekle
          </button>
        </form>

        <ul className="mt-6 space-y-2">
          {categories.map((c) => (
            <motion.li
              key={c.id}
              layout
              className="flex items-center justify-between rounded-xl border border-white/10 bg-surface-card px-4 py-3"
            >
              <span className={c.isActive ? "text-white" : "text-gray-500"}>{c.name}</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => toggleActive(c)}
                  className="rounded-lg bg-white/10 px-2 py-1 text-sm text-white hover:bg-white/20"
                >
                  {c.isActive ? "Devre dışı bırak" : "Etkinleştir"}
                </button>
                <button
                  type="button"
                  onClick={() => remove(c.id)}
                  className="rounded-lg bg-red-500/20 px-2 py-1 text-sm text-red-400 hover:bg-red-500/30"
                >
                  Sil
                </button>
              </div>
            </motion.li>
          ))}
        </ul>
      </div>
    </div>
  );
}
