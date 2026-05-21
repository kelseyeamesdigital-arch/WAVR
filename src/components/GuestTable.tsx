"use client";

import { useState, useTransition } from "react";
import { ChevronDown, ChevronUp, MapPin, Mail, Calendar, FileText, Trash2 } from "lucide-react";
import { deleteGuest } from "@/app/actions/delete";

type Guest = {
  id: string;
  guest_name: string;
  guest_email: string | null;
  guest_age: number | null;
  guest_country: string | null;
  created_at: string;
  signature_url: string | null;
  waiver: { title: string } | { title: string }[] | null;
};

function waiverTitle(w: Guest["waiver"]) {
  if (!w) return "—";
  if (Array.isArray(w)) return w[0]?.title ?? "—";
  return w.title;
}

export default function GuestTable({ guests }: { guests: Guest[] }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (guests.length === 0) {
    return (
      <div className="bg-zinc-800 rounded-xl border border-zinc-700 p-10 text-center">
        <p className="text-zinc-400 text-sm">No guests found.</p>
      </div>
    );
  }

  return (
    <div className="bg-zinc-800 rounded-xl border border-zinc-700 overflow-hidden">
      <div className="grid grid-cols-[1fr_1fr_auto] gap-4 px-5 py-3 border-b border-zinc-700 text-xs font-medium text-zinc-500 uppercase tracking-wide">
        <span>Guest</span>
        <span>Waiver</span>
        <span>Date</span>
      </div>
      <div className="divide-y divide-zinc-700/50">
        {guests.map((g) => (
          <div key={g.id}>
            <button
              onClick={() => setExpanded(expanded === g.id ? null : g.id)}
              className="w-full grid grid-cols-[1fr_1fr_auto] gap-4 px-5 py-4 text-left hover:bg-zinc-700/30 transition items-center"
            >
              <span className="text-sm font-medium text-white truncate">{g.guest_name}</span>
              <span className="text-sm text-zinc-400 truncate">{waiverTitle(g.waiver)}</span>
              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <span>{new Date(g.created_at).toLocaleDateString()}</span>
                {expanded === g.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </div>
            </button>
            {expanded === g.id && (
              <div className="px-5 pb-5 grid grid-cols-2 gap-3">
                {g.guest_email && (
                  <div className="flex items-center gap-2 text-sm text-zinc-300">
                    <Mail size={14} className="text-zinc-500 shrink-0" />
                    {g.guest_email}
                  </div>
                )}
                {g.guest_age && (
                  <div className="flex items-center gap-2 text-sm text-zinc-300">
                    <Calendar size={14} className="text-zinc-500 shrink-0" />
                    Age {g.guest_age}
                  </div>
                )}
                {g.guest_country && (
                  <div className="flex items-center gap-2 text-sm text-zinc-300">
                    <MapPin size={14} className="text-zinc-500 shrink-0" />
                    {g.guest_country}
                  </div>
                )}
                {g.signature_url && (
                  <div className="col-span-2 mt-2">
                    <div className="flex items-center gap-2 text-xs text-zinc-500 mb-1">
                      <FileText size={12} />
                      Signature
                    </div>
                    <img
                      src={g.signature_url}
                      alt="Signature"
                      className="h-16 bg-white rounded p-1"
                    />
                  </div>
                )}
                <div className="col-span-2 mt-3 pt-3 border-t border-zinc-700 flex items-center justify-end gap-2">
                  {confirming === g.id ? (
                    <>
                      <span className="text-xs text-zinc-400">Remove this guest?</span>
                      <button
                        onClick={() => startTransition(async () => { await deleteGuest(g.id); setConfirming(null); setExpanded(null); })}
                        disabled={pending}
                        className="text-xs px-2 py-1 rounded bg-red-600 hover:bg-red-500 text-white font-semibold disabled:opacity-50 transition"
                      >
                        {pending ? "Deleting…" : "Yes, delete"}
                      </button>
                      <button
                        onClick={() => setConfirming(null)}
                        className="text-xs px-2 py-1 rounded bg-zinc-700 hover:bg-zinc-600 text-white transition"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setConfirming(g.id)}
                      className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-red-400 transition"
                    >
                      <Trash2 size={13} />
                      Delete guest
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
