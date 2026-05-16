"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, FileText, Users, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/waivers", label: "Waivers", icon: FileText },
  { href: "/dashboard/guests", label: "Guests", icon: Users },
];

export default function Sidebar({ user }: { user: User }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const businessName = user.user_metadata?.business_name ?? user.email;

  return (
    <aside className="w-56 flex flex-col bg-zinc-950 border-r border-zinc-800 shrink-0">
      <div className="px-5 py-5 border-b border-zinc-800">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-7 h-7 rounded bg-arb-blue flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-xs" style={{ fontFamily: "Oswald, sans-serif" }}>ARB</span>
          </div>
          <div>
            <p className="text-xs font-bold text-white leading-tight" style={{ fontFamily: "Oswald, sans-serif" }}>ADVENTURE RAFTING</p>
            <p className="text-[10px] text-arb-teal leading-tight tracking-widest">BLED</p>
          </div>
        </div>
        <p className="text-xs text-zinc-500 mt-2 truncate">{businessName}</p>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                active
                  ? "bg-arb-blue/10 text-arb-blue-light"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800"
              }`}
            >
              <Icon size={16} />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="px-3 py-4 border-t border-zinc-800">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
        >
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
