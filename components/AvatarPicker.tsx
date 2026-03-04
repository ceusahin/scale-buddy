"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AVATARS, getAvatarEmoji } from "@/lib/avatars";

type Props = {
  value: string | null;
  onChange: (avatarId: string) => void;
};

export function AvatarPicker({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);

  const displayEmoji = getAvatarEmoji(value);

  useEffect(() => {
    if (!open) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <div className="relative flex justify-center">
        <motion.button
          type="button"
          onClick={() => setOpen(true)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-white/20 bg-white/10 text-4xl shadow-lg transition hover:border-indigo-400/50 hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-indigo-400/60"
          title="Avatar seç"
        >
          {displayEmoji}
        </motion.button>
      </div>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              role="button"
              tabIndex={-1}
              aria-label="Kapat"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-40 cursor-pointer bg-black/25 backdrop-blur-[2px]"
              onClick={(e) => {
                e.stopPropagation();
                setOpen(false);
              }}
              onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className="fixed left-1/2 top-1/2 z-50 w-[min(300px,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-white/15 bg-[var(--surface)] p-4 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <p className="mb-3 text-center text-sm font-medium text-gray-400">Avatar seç</p>
              <div className="grid grid-cols-5 gap-2">
                {AVATARS.map((a) => {
                  const selected = value === a.id;
                  return (
                    <motion.button
                      key={a.id}
                      type="button"
                      onClick={() => {
                        onChange(a.id);
                        setOpen(false);
                      }}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      className={`flex h-10 w-10 items-center justify-center rounded-xl text-xl transition ${
                        selected
                          ? "ring-2 ring-indigo-400 ring-offset-1 ring-offset-[var(--surface)] bg-indigo-500/25"
                          : "bg-white/5 hover:bg-white/15"
                      }`}
                      title={a.id}
                    >
                      {a.emoji}
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
