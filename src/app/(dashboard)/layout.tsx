import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { requireUser } from "@/lib/supabase/server";
import { toUserProfile } from "@/lib/supabase/types";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await requireUser();
  const profile = toUserProfile(user);

  return (
    <div className="min-h-dvh">
      <Sidebar />
      <div className="flex min-h-dvh flex-col lg:pl-64">
        <Topbar profile={profile} />
        <main className="flex-1 px-4 py-8 md:px-8">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
