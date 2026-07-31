import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/server";
import Sidebar from "@/components/Sidebar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar user={user} />
      {/* pt-14 = mobile top bar height, pb-20 = mobile bottom tab bar height */}
      <main className="flex-1 overflow-y-auto bg-zinc-900 pt-14 md:pt-0 pb-20 md:pb-0">
        {children}
      </main>
    </div>
  );
}
