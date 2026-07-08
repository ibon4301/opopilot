"use client";

import { motion } from "framer-motion";

import { DURATION, EASE_OUT } from "@/lib/motion";

export function PageTransition({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: DURATION.fast, ease: EASE_OUT }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
