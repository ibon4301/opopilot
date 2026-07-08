import type { UserProfile } from "@/lib/supabase/types";

import { MobileNav } from "./mobile-nav";
import { UserMenu } from "./user-menu";

export function Topbar({ profile }: { profile: UserProfile }) {
  return (
    <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur-md md:px-8">
      <MobileNav />
      <div className="flex-1" />
      <UserMenu profile={profile} />
    </header>
  );
}
