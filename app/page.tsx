"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const ease = [0.22, 1, 0.36, 1] as const;

const howToPlay = [
  { step: 1, title: "Lobi oluştur veya katıl", desc: "Lobi oluştur veya arkadaşlarına katılmak için 5 harfli kodu gir." },
  { step: 2, title: "Sorulara oy ver", desc: "Grupta soruya en çok kimin uyduğunu seçerek soruları yanıtla." },
  { step: 3, title: "Sonuçları gör", desc: "Yapay zeka ile üretilen kişilik özetleri ve eğlenceli unvanları incele." },
];

export default function LandingPage() {
  return (
    <div className="page-bg min-h-screen flex flex-col items-center px-5 py-16 sm:py-20">
      <div className="mx-auto w-full max-w-3xl flex flex-col items-center">
        {/* PARMAK – soldan sağa mor gradient */}
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease }}
          className="text-center text-5xl font-bold sm:text-6xl md:text-7xl bg-gradient-to-r from-violet-400 via-purple-500 to-fuchsia-500 bg-clip-text text-transparent"
        >
          PARMAK
        </motion.h1>

        {/* Tek cümle oyun açıklaması */}
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05, ease }}
          className="mt-5 text-center text-base text-gray-400 max-w-lg"
        >
          Soruya en çok kimin uyduğuna oy verin, yapay zeka destekli kişilik analizi alın.
        </motion.p>

        {/* Oyuna Başla butonu */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="mt-10"
        >
          <Link href="/lobby" className="block">
            <motion.span
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 px-12 py-5 text-xl font-semibold text-white shadow-lg transition hover:from-indigo-500 hover:to-purple-500"
            >
              Oyuna Başla
            </motion.span>
          </Link>
        </motion.div>

        {/* Nasıl oynanır – 3 kart */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="mt-12 w-full grid gap-5 sm:grid-cols-3"
        >
          {howToPlay.map(({ step, title, desc }) => (
            <div
              key={step}
              className="card-glass rounded-2xl p-6 transition hover:border-indigo-500/20"
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/20 text-base font-bold text-indigo-300">
                {step}
              </span>
              <h3 className="mt-4 text-base font-semibold text-white">{title}</h3>
              <p className="mt-2 text-sm text-gray-400 leading-relaxed">{desc}</p>
            </div>
          ))}
        </motion.div>

        {/* Yapay zeka hakkında kısa bilgi */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="mt-12 w-full rounded-2xl border border-white/10 bg-white/5 px-6 py-5 backdrop-blur-sm"
        >
          <p className="text-center text-base text-gray-400 leading-relaxed">
            Oyun içinde yapay zeka, oylarınıza göre her oyuncu için kişilik özeti ve eğlenceli unvanlar üretmek için kullanılır; böylece arkadaşlarınızı eğlenceli bir dille keşfedersiniz.
          </p>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="mt-10 text-center"
        >
          <Link
            href="/lobby/feedback"
            className="text-base text-gray-400 underline decoration-white/20 transition hover:text-white"
          >
            Öneri veya şikayet bildir
          </Link>
        </motion.p>
      </div>
    </div>
  );
}
