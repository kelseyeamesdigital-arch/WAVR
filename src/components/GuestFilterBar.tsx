"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Search, CalendarDays, X } from "lucide-react";

export default function GuestFilterBar({ totalCount }: { totalCount: number }) {
  const router = useRouter();
  const params = useSearchParams();
  const q = params.get("q") ?? "";
  const date = params.get("date") ?? "";

  const today = new Date().toISOString().slice(0, 10);
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);

  function update(key: string, value: string) {
    const p = new URLSearchParams(params.toString());
    if (value) p.set(key, value); else p.delete(key);
    router.push(`/dashboard/guests?${p.toString()}`);
  }

  function clear() {
    router.push("/dashboard/guests");
  }

  const hasFilter = q || date;

  return (
    <div className="space-y-3 mb-6">
      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
        <input
          defaultValue={q}
          placeholder="Search by name…"
          onChange={(e) => update("q", e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-arb-blue focus:border-transparent"
        />
      </div>

      {/* Date filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <CalendarDays size={15} className="text-zinc-500 shrink-0" />
        <button
          onClick={() => update("date", today)}
          className={`text-xs px-3 py-1.5 rounded-lg font-medium transition ${date === today ? "bg-arb-blue text-white" : "bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-700"}`}
        >
          Today
        </button>
        <button
          onClick={() => update("date", tomorrow)}
          className={`text-xs px-3 py-1.5 rounded-lg font-medium transition ${date === tomorrow ? "bg-arb-blue text-white" : "bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-700"}`}
        >
          Tomorrow
        </button>
        <input
          type="date"
          value={date}
          onChange={(e) => update("date", e.target.value)}
          className="text-xs px-3 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-300 focus:outline-none focus:ring-2 focus:ring-arb-blue"
        />
        {hasFilter && (
          <button onClick={clear} className="flex items-center gap-1 text-xs text-zinc-500 hover:text-white transition">
            <X size={13} /> Clear
          </button>
        )}
        <span className="text-xs text-zinc-500 ml-auto">{totalCount} {totalCount === 1 ? "guest" : "guests"}</span>
      </div>
    </div>
  );
}
