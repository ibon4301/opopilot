import type { Variants } from "framer-motion";

export const EASE_OUT: [number, number, number, number] = [
  0.21, 0.47, 0.32, 0.98,
];

export const DURATION = {
  fast: 0.25,
  base: 0.5,
  slow: 0.8,
} as const;

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: DURATION.base, ease: EASE_OUT },
  },
};

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: DURATION.base, ease: EASE_OUT },
  },
};

export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};
