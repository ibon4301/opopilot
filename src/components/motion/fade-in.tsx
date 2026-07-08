"use client";

import { motion, type HTMLMotionProps } from "framer-motion";

import { DURATION, EASE_OUT } from "@/lib/motion";

interface FadeInProps extends HTMLMotionProps<"div"> {
  delay?: number;
  y?: number;
}

export function FadeIn({ delay = 0, y = 16, ...props }: FadeInProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: DURATION.base, delay, ease: EASE_OUT }}
      {...props}
    />
  );
}
