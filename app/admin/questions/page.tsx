"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { BackButton } from "@/components/BackButton";

type Category = { id: string; name: string };
type Question = { id: string; text: string; categoryId: string; category: { name: string } };

export default function AdminQuestionsPage() {
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryId, setCategoryId] = useState("");
  const [newText, setNewText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadCategoryId, setUploadCategoryId] = useState("");

  const load = () => {
    Promise.all([
      fetch("/api/admin/categories", { credentials: "include" }).then((r) => r.json()),
      fetch("/api/admin/questions", { credentials: "include" }).then((r) => r.json()),
    ])
      .then(([catData, qData]) => {
        if (catData.categories) setCategories(catData.categories);
        if (catData.categories?.length && !categoryId) setCategoryId(catData.categories[0].id);
        if (qData.questions) setQuestions(qData.questions);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetch("/api/admin/categories", { credentials: "include" })
      .then((res) => {
        if (res.status === 401) router.replace("/admin/login");
        return res.json();
      })
      .then((data) => {
        setCategories(data.categories ?? []);
        if (data.categories?.length && !uploadCategoryId) setUploadCategoryId(data.categories[0].id);
      });
    fetch("/api/admin/questions", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => setQuestions(data.questions ?? []))
      .finally(() => setLoading(false));
  }, [router, uploadCategoryId]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!newText.trim() || !categoryId) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ text: newText.trim(), categoryId }),
      });
      if (res.ok) {
        setNewText("");
        load();
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Bu soru silinsin mi?")) return;
    await fetch(`/api/admin/questions/${id}`, { method: "DELETE", credentials: "include" });
    load();
  }

  async function uploadCsv(e: React.FormEvent) {
    e.preventDefault();
    if (!uploadFile || !uploadCategoryId) return;
    const form = new FormData();
    form.set("file", uploadFile);
    form.set("categoryId", uploadCategoryId);
    const res = await fetch("/api/admin/questions/upload", {
      method: "POST",
      credentials: "include",
      body: form,
    });
    const data = await res.json();
    if (data.count != null) {
      alert(`${data.count} soru yüklendi`);
      setUploadFile(null);
      load();
    }
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
        <h1 className="mt-14 text-2xl font-bold text-white">Sorular</h1>

        <form onSubmit={create} className="mt-6 space-y-4">
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full rounded-xl border border-white/20 bg-surface-card px-4 py-2 text-white focus:border-indigo-500 focus:outline-none"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <div className="flex gap-2">
            <input
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              placeholder="Soru metni"
              className="flex-1 rounded-xl border border-white/20 bg-surface-card px-4 py-2 text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-indigo-600 px-4 py-2 font-medium text-white disabled:opacity-50"
            >
              Ekle
            </button>
          </div>
        </form>

        <div className="mt-8">
          <h2 className="text-lg font-semibold text-white">Toplu yükleme (CSV)</h2>
          <p className="mt-1 text-sm text-gray-400">Her satıra bir soru. Aşağıdan kategori seç.</p>
          <form onSubmit={uploadCsv} className="mt-2 flex flex-wrap items-end gap-2">
            <select
              value={uploadCategoryId}
              onChange={(e) => setUploadCategoryId(e.target.value)}
              className="rounded-xl border border-white/20 bg-surface-card px-4 py-2 text-white focus:border-indigo-500 focus:outline-none"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <input
              type="file"
              accept=".csv,.txt"
              onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
              className="text-sm text-gray-400"
            />
            <button
              type="submit"
              disabled={!uploadFile}
              className="rounded-xl bg-indigo-600 px-4 py-2 font-medium text-white disabled:opacity-50"
            >
              Yükle
            </button>
          </form>
        </div>

        <ul className="mt-8 space-y-2">
          {questions.slice(0, 100).map((q) => (
            <motion.li
              key={q.id}
              layout
              className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-surface-card px-4 py-3"
            >
              <span className="flex-1 truncate text-gray-300">{q.text}</span>
              <span className="text-xs text-gray-500">{q.category.name}</span>
              <button
                type="button"
                onClick={() => remove(q.id)}
                className="rounded-lg bg-red-500/20 px-2 py-1 text-sm text-red-400 hover:bg-red-500/30"
              >
                Sil
              </button>
            </motion.li>
          ))}
        </ul>
        {questions.length > 100 && (
          <p className="mt-2 text-sm text-gray-500">İlk 100 soru gösteriliyor (toplam {questions.length})</p>
        )}
      </div>
    </div>
  );
}
