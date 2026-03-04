"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { BackButton } from "@/components/BackButton";

export default function LobbyChoicePage() {
  return (
    <div className="page-bg min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <div className="absolute left-4 top-4">
        <BackButton href="/" label="Ana sayfa" />
      </div>
      <div className="mx-auto w-full max-w-md">
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="text-center text-2xl font-bold text-white"
        >
          Lobi oluştur veya katıl
        </motion.h1>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="mt-10 card-glass rounded-3xl p-6"
        >
          <div className="flex flex-col gap-3">
            <Link href="/lobby/create" className="block">
              <motion.span
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 py-4 text-lg font-semibold text-white shadow-lg transition hover:from-indigo-500 hover:to-purple-500"
              >
                Lobi Oluştur
              </motion.span>
            </Link>
            <Link href="/lobby/join" className="block">
              <motion.span
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex w-full items-center justify-center rounded-2xl border border-white/15 bg-white/5 py-4 text-lg font-semibold text-white transition hover:bg-white/10"
              >
                Kodla Katıl
              </motion.span>
            </Link>
          </div>
        </motion.div>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-8 text-center"
        >
          <Link href="/lobby/feedback" className="text-sm text-gray-400 underline decoration-white/20 transition hover:text-white">
            Öneri veya şikayet bildir
          </Link>
        </motion.p>
      </div>
    </div>
  );
}
