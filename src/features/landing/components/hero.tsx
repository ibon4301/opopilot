"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import { fadeInUp, staggerContainer } from "@/lib/motion";

export function Hero() {
  return (
    <section className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-6">
      <HeroBackdrop />
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="relative flex max-w-3xl flex-col items-center text-center"
      >
        <motion.div variants={fadeInUp}>
          <Logo />
        </motion.div>
        <motion.h1
          variants={fadeInUp}
          className="mt-10 text-h1 text-balance sm:text-display"
        >
          <span className="text-gradient-brand">{siteConfig.name}</span>
        </motion.h1>
        <motion.p
          variants={fadeInUp}
          className="mt-6 max-w-xl text-h4 font-normal text-pretty text-muted-foreground"
        >
          Tu copiloto de IA para preparar oposiciones. Estudia mejor, avanza más
          rápido.
        </motion.p>
        <motion.div variants={fadeInUp} className="mt-10">
          <Button
            size="lg"
            onClick={() =>
              toast("Muy pronto", {
                description: "Estamos construyendo OpoPilot. Vuelve en breve.",
              })
            }
          >
            <Sparkles aria-hidden />
            Próximamente
          </Button>
        </motion.div>
      </motion.div>
    </section>
  );
}

function HeroBackdrop() {
  return (
    <div aria-hidden className="absolute inset-0">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_45%,black,transparent)] bg-[size:56px_56px]" />
      <div className="absolute top-[40%] left-1/2 h-[30rem] w-[50rem] max-w-full -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/15 blur-[140px]" />
    </div>
  );
}
