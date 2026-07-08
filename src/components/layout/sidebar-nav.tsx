"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { DASHBOARD_NAV } from "@/constants/navigation";
import { cn } from "@/lib/utils";

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav
      className="flex flex-col gap-6 px-3 py-4"
      aria-label="Navegación principal"
    >
      {DASHBOARD_NAV.map((section) => (
        <div key={section.label}>
          <p className="mb-1.5 px-3 text-caption font-medium tracking-wider text-muted-foreground/70 uppercase">
            {section.label}
          </p>
          <ul className="flex flex-col gap-0.5">
            {section.items.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-small font-medium transition-colors",
                      isActive
                        ? "bg-accent text-foreground"
                        : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
                    )}
                  >
                    <item.icon
                      className={cn("size-4", isActive && "text-primary")}
                      aria-hidden
                    />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
