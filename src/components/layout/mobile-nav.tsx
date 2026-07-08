"use client";

import { useState } from "react";
import { Menu } from "lucide-react";

import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { siteConfig } from "@/config/site";

import { SidebarNav } from "./sidebar-nav";

export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden">
          <Menu aria-hidden />
          <span className="sr-only">Abrir menú de navegación</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 gap-0 p-0">
        <SheetHeader className="h-16 justify-center border-b px-6 py-0">
          <SheetTitle className="flex items-center gap-2.5">
            <Logo className="size-8 rounded-lg shadow-none" />
            <span className="text-body font-semibold">{siteConfig.name}</span>
          </SheetTitle>
        </SheetHeader>
        <ScrollArea className="flex-1">
          <SidebarNav onNavigate={() => setOpen(false)} />
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
