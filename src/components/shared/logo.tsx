import { Compass } from "lucide-react";

import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex size-16 items-center justify-center rounded-2xl bg-gradient-brand shadow-glow",
        className,
      )}
    >
      <Compass className="size-1/2 text-white" strokeWidth={1.75} aria-hidden />
      <span className="sr-only">OpoPilot</span>
    </div>
  );
}
