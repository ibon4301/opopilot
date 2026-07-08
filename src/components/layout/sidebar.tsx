import Link from "next/link";

import { Logo } from "@/components/shared/logo";
import { ScrollArea } from "@/components/ui/scroll-area";
import { siteConfig } from "@/config/site";
import { ROUTES } from "@/constants/routes";

import { SidebarNav } from "./sidebar-nav";

export function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r bg-sidebar lg:flex">
      <div className="flex h-16 shrink-0 items-center border-b px-6">
        <Link
          href={ROUTES.dashboard}
          className="flex items-center gap-2.5 rounded-lg"
        >
          <Logo className="size-8 rounded-lg shadow-none" />
          <span className="text-body font-semibold">{siteConfig.name}</span>
        </Link>
      </div>
      <ScrollArea className="flex-1">
        <SidebarNav />
      </ScrollArea>
    </aside>
  );
}
