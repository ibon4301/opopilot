import Link from "next/link";

import { Logo } from "@/components/shared/logo";
import { siteConfig } from "@/config/site";
import { ROUTES } from "@/constants/routes";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-4 py-10">
      <AuthBackdrop />
      <div className="relative flex w-full max-w-sm flex-col items-center">
        <Link
          href={ROUTES.home}
          className="mb-8 flex items-center gap-2.5 rounded-lg"
          aria-label={`Volver al inicio de ${siteConfig.name}`}
        >
          <Logo className="size-10 rounded-xl" />
          <span className="text-h4 font-semibold">{siteConfig.name}</span>
        </Link>
        {children}
      </div>
    </div>
  );
}

function AuthBackdrop() {
  return (
    <div aria-hidden className="absolute inset-0">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_55%_45%_at_50%_40%,black,transparent)] bg-[size:56px_56px]" />
      <div className="absolute top-[35%] left-1/2 h-[24rem] w-[40rem] max-w-full -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-[120px]" />
    </div>
  );
}
