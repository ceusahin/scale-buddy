"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { motion } from "framer-motion";

type Props = {
  href: string;
  label: string;
};

export function BackButton({ href, label }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    startTransition(() => {
      router.push(href);
    });
  };

  return (
    <motion.button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      whileHover={isPending ? undefined : { x: -2 }}
      whileTap={isPending ? undefined : { scale: 0.98 }}
      className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-gray-400 transition hover:border-white/20 hover:bg-white/10 hover:text-white disabled:opacity-70 disabled:pointer-events-none"
    >
      {isPending ? (
        <span className="h-4 w-4 shrink-0 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
      ) : (
        <svg
          className="h-4 w-4 shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      )}
      {label}
    </motion.button>
  );
}
