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
    <>
      {/* ── Desktop sidebar ── */}
      <aside className="hidden md:flex w-56 flex-col bg-zinc-950 border-r border-zinc-800 shrink-0">
        <div className="px-5 py-5 border-b border-zinc-800">
          <span className="text-2xl font-black text-white tracking-tight" style={{ fontFamily: "Oswald, sans-serif" }}>WAVR</span>
          <p className="text-xs text-zinc-500 truncate mt-1">{businessName}</p>
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
                    ? "bg-wavr-blue/10 text-wavr-blue-light"
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

      {/* ── Mobile top bar ── */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-3 bg-zinc-950 border-b border-zinc-800">
        <span className="text-xl font-black text-white tracking-tight" style={{ fontFamily: "Oswald, sans-serif" }}>WAVR</span>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition px-2 py-1.5 rounded-lg hover:bg-zinc-800"
        >
          <LogOut size={14} />
          Sign out
        </button>
      </div>

      {/* ── Mobile bottom tab bar ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex bg-zinc-950 border-t border-zinc-800 pb-safe">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center gap-1 py-3 text-[11px] font-medium transition ${
                active ? "text-wavr-blue-light" : "text-zinc-500"
              }`}
            >
              <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
              {label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
