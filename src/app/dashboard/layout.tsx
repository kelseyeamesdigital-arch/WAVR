import { redirect } from "next/navigation";
import { createClient, getCurrentUser } from "@/lib/supabase/server";
import Sidebar from "@/components/Sidebar";

// Basic guard so a stray value from the DB can't be injected into our inline style.
function safeColor(value: string | null | undefined) {
  return value && /^#[0-9a-fA-F]{3,8}$/.test(value) ? value : null;
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("business_name, logo_url, primary_color")
    .eq("id", user.id)
    .maybeSingle();

  const brand = safeColor(profile?.primary_color);

  return (
    // --brand drives every accent in the dashboard, so the operator's chosen colour
    // is used throughout instead of WAVR's default blue.
    <div
      className="flex h-screen overflow-hidden"
      style={brand ? ({ "--brand": brand } as React.CSSProperties) : undefined}
    >
      <Sidebar
        user={user}
        businessName={profile?.business_name ?? null}
        logoUrl={profile?.logo_url ?? null}
      />
      {/* pt-14 = mobile top bar height, pb-20 = mobile bottom tab bar height */}
      <main className="flex-1 overflow-y-auto bg-zinc-900 pt-14 md:pt-0 pb-20 md:pb-0">
        {children}
      </main>
    </div>
  );
}
