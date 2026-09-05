"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Search, CalendarDays, Clock, HeartPulse, Users, FileText, Camera, X } from "lucide-react";

type WaiverOption = { id: string; title: string };

export default function GuestFilterBar({ totalCount, timeOptions, waiverOptions, offersPhotos }: { totalCount: number; timeOptions: string[]; waiverOptions: WaiverOption[]; offersPhotos: boolean }) {
  const router = useRouter();
  const params = useSearchParams();
  const q = params.get("q") ?? "";
  const date = params.get("date") ?? "";
  const time = params.get("time") ?? "";
  const waiver = params.get("waiver") ?? "";

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

  const hasFilter = q || date || time || waiver || params.get("medical") || params.get("age") || params.get("photos");

  function chip(key: string, value: string, label: string) {
    const active = params.get(key) === value;
    return (
      <button
        onClick={() => update(key, active ? "" : value)}
        className={`text-xs px-3 py-1.5 rounded-lg font-medium transition ${active ? "bg-brand text-white" : "bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-700"}`}
      >
        {label}
      </button>
    );
  }

  return (
    <div className="space-y-3 mb-6">
      {/* Search + waiver */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative max-w-sm flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            defaultValue={q}
            placeholder="Search by name…"
            onChange={(e) => update("q", e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
          />
        </div>
        {waiverOptions.length > 1 && (
          <div className="flex items-center gap-2">
            <FileText size={15} className="text-zinc-500 shrink-0" />
            <select
              value={waiver}
              onChange={(e) => update("waiver", e.target.value)}
              className="text-sm px-3 py-2.5 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-300 focus:outline-none focus:ring-2 focus:ring-brand max-w-[220px]"
            >
              <option value="">All waivers</option>
              {waiverOptions.map((w) => (
                <option key={w.id} value={w.id}>{w.title}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Date filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <CalendarDays size={15} className="text-zinc-500 shrink-0" />
        <button
          onClick={() => update("date", today)}
          className={`text-xs px-3 py-1.5 rounded-lg font-medium transition ${date === today ? "bg-brand text-white" : "bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-700"}`}
        >
          Today
        </button>
        <button
          onClick={() => update("date", tomorrow)}
          className={`text-xs px-3 py-1.5 rounded-lg font-medium transition ${date === tomorrow ? "bg-brand text-white" : "bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-700"}`}
        >
          Tomorrow
        </button>
        <input
          type="date"
          value={date}
          onChange={(e) => update("date", e.target.value)}
          className="text-xs px-3 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-300 focus:outline-none focus:ring-2 focus:ring-brand"
        />
        <span className="text-xs text-zinc-500 ml-auto">{totalCount} {totalCount === 1 ? "guest" : "guests"}</span>
      </div>

      {/* Time / medical / age filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <Clock size={15} className="text-zinc-500 shrink-0" />
        <select
          value={time}
          onChange={(e) => update("time", e.target.value)}
          className="text-xs px-3 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-300 focus:outline-none focus:ring-2 focus:ring-brand"
        >
          <option value="">All times</option>
          {timeOptions.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>

        <span className="w-px h-5 bg-zinc-700 mx-1" />
        <HeartPulse size={15} className="text-zinc-500 shrink-0" />
        {chip("medical", "yes", "Medical: yes")}
        {chip("medical", "no", "Medical: no")}

        <span className="w-px h-5 bg-zinc-700 mx-1" />
        <Users size={15} className="text-zinc-500 shrink-0" />
        {chip("age", "u18", "Under 18")}
        {chip("age", "18plus", "18+")}

        {offersPhotos && (
          <>
            <span className="w-px h-5 bg-zinc-700 mx-1" />
            <Camera size={15} className="text-zinc-500 shrink-0" />
            {chip("photos", "yes", "Wants photos")}
            {chip("photos", "no", "No photos")}
          </>
        )}

        {hasFilter && (
          <button onClick={clear} className="flex items-center gap-1 text-xs text-zinc-500 hover:text-white transition">
            <X size={13} /> Clear
          </button>
        )}
      </div>
    </div>
  );
}
