"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { BackButton } from "@/components/BackButton";
import { Checkbox } from "@/components/Checkbox";

type Category = { id: string; name: string };
type Mode = {
  id: string;
  name: string;
  isActive: boolean;
  categories: { categoryId: string; category: { name: string } }[];
};

export default function AdminModesPage() {
  const router = useRouter();
  const [modes, setModes] = useState<Mode[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [newCategoryIds, setNewCategoryIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    Promise.all([
      fetch("/api/admin/categories", { credentials: "include" }).then((r) => r.json()),
      fetch("/api/admin/modes", { credentials: "include" }).then((r) => r.json()),
    ])
      .then(([catData, modeData]) => {
        if (catData.categories) setCategories(catData.categories);
        if (modeData.modes) setModes(modeData.modes);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetch("/api/admin/modes", { credentials: "include" })
      .then((res) => {
        if (res.status === 401) router.replace("/admin/login");
        return res.json();
      })
      .then((data) => setModes(data.modes ?? []));
    fetch("/api/admin/categories", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => setCategories(data.categories ?? []))
      .finally(() => setLoading(false));
  }, [router]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/modes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: newName.trim(),
          isActive: true,
          categoryIds: newCategoryIds,
        }),
      });
      if (res.ok) {
        setNewName("");
        setNewCategoryIds([]);
        load();
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleActive(m: Mode) {
    await fetch(`/api/admin/modes/${m.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        name: m.name,
        isActive: !m.isActive,
        categoryIds: m.categories.map((c) => c.categoryId),
      }),
    });
    load();
  }

  async function remove(id: string) {
    if (!confirm("Bu mod silinsin mi?")) return;
    await fetch(`/api/admin/modes/${id}`, { method: "DELETE", credentials: "include" });
    load();
  }

  function toggleCategory(id: string) {
    setNewCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
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
        <h1 className="mt-14 text-2xl font-bold text-white">Modlar</h1>

        <form onSubmit={create} className="mt-6 space-y-4">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Mod adı (örn. Karışık, Aşk, Kaos)"
            className="w-full rounded-xl border border-white/20 bg-surface-card px-4 py-2 text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none"
          />
          <div>
            <p className="text-sm text-gray-400">Soruların çekileceği kategoriler:</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {categories.map((c) => (
                <div key={c.id} className="rounded-xl border border-white/10 bg-surface-elevated px-3 py-2">
                  <Checkbox
                    checked={newCategoryIds.includes(c.id)}
                    onChange={() => toggleCategory(c.id)}
                    label={c.name}
                    className="text-sm"
                  />
                </div>
              ))}
            </div>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-xl bg-indigo-600 px-4 py-2 font-medium text-white disabled:opacity-50"
          >
            Mod ekle
          </button>
        </form>

        <ul className="mt-8 space-y-4">
          {modes.map((m) => (
            <motion.li
              key={m.id}
              layout
              className="rounded-xl border border-white/10 bg-surface-card p-4"
            >
              <div className="flex items-center justify-between">
                <span className={m.isActive ? "text-white font-medium" : "text-gray-500"}>{m.name}</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => toggleActive(m)}
                    className="rounded-lg bg-white/10 px-2 py-1 text-sm text-white hover:bg-white/20"
                  >
                    {m.isActive ? "Devre dışı bırak" : "Etkinleştir"}
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(m.id)}
                    className="rounded-lg bg-red-500/20 px-2 py-1 text-sm text-red-400 hover:bg-red-500/30"
                  >
                    Sil
                  </button>
                </div>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Kategoriler: {m.categories.map((c) => c.category.name).join(", ") || "Yok"}
              </p>
            </motion.li>
          ))}
        </ul>
      </div>
    </div>
  );
}
