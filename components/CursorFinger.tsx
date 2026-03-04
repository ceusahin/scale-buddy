"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export function CursorFinger() {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [pressed, setPressed] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    document.documentElement.classList.add("custom-finger-cursor");
    return () => document.documentElement.classList.remove("custom-finger-cursor");
  }, []);

  useEffect(() => {
    const move = (e: MouseEvent) => {
      setPos({ x: e.clientX, y: e.clientY });
      if (!visible) setVisible(true);
    };
    const down = () => setPressed(true);
    const up = () => setPressed(false);
    const leave = () => setVisible(false);

    window.addEventListener("mousemove", move);
    window.addEventListener("mousedown", down);
    window.addEventListener("mouseup", up);
    document.addEventListener("mouseleave", leave);
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mousedown", down);
      window.removeEventListener("mouseup", up);
      document.removeEventListener("mouseleave", leave);
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <motion.div
      className="pointer-events-none fixed left-0 top-0 z-[9999] w-8 h-8 flex items-center justify-center -translate-x-1/2 -translate-y-1/2"
      style={{ left: pos.x, top: pos.y }}
      initial={false}
      animate={{
        scale: pressed ? 0.9 : 1,
        transition: { duration: 0.08 },
      }}
    >
      {pressed ? (
        <motion.span
          className="text-xl sm:text-2xl drop-shadow-[0_1px_8px_rgba(0,0,0,0.35)] select-none"
          initial={false}
          animate={{ rotate: -6, scale: 0.95 }}
          transition={{ duration: 0.1 }}
        >
          ✊
        </motion.span>
      ) : (
        <motion.img
          src="/cursor-finger.png"
          alt=""
          className="w-full h-full object-contain drop-shadow-[0_1px_8px_rgba(0,0,0,0.35)] select-none"
          width={32}
          height={32}
          initial={false}
        />
      )}
    </motion.div>
  );
}
