"use client";

import { useState, useTransition } from "react";
import { ChevronDown, ChevronUp, MapPin, Mail, Calendar, FileText, Trash2, AlertTriangle, Clock } from "lucide-react";
import { deleteGuest } from "@/app/actions/delete";

type WaiverField = {
  id: string;
  label: string;
  type: string;
  followUpLabel?: string;
};

type Guest = {
  id: string;
  guest_name: string;
  guest_email: string | null;
  guest_age: number | null;
  guest_country: string | null;
  created_at: string;
  signature_url: string | null;
  form_data: Record<string, string> | null;
  trip_date: string | null;
  trip_time: string | null;
  waiver: { title: string; fields: WaiverField[] } | { title: string; fields: WaiverField[] }[] | null;
};

function getWaiver(w: Guest["waiver"]) {
  if (!w) return null;
  if (Array.isArray(w)) return w[0] ?? null;
  return w;
}

function hasMedicalFlag(guest: Guest): boolean {
  if (!guest.form_data) return false;
  return Object.values(guest.form_data).includes("Yes");
}

function getMedicalDetails(guest: Guest): { question: string; answer: string }[] {
  if (!guest.form_data) return [];
  const waiver = getWaiver(guest.waiver);
  const fields = waiver?.fields ?? [];
  const details: { question: string; answer: string }[] = [];

  for (const field of fields) {
    if (field.type === "conditional" && guest.form_data[field.id] === "Yes") {
      details.push({ question: field.label, answer: "Yes" });
      const followUp = guest.form_data[`${field.id}_followup`];
      if (followUp) details.push({ question: field.followUpLabel ?? "Details", answer: followUp });
    }
  }
  return details;
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
    <div className="space-y-2">
      {guests.map((g) => {
        const isExpanded = expanded === g.id;
        const flagged = hasMedicalFlag(g);
        const medicalDetails = getMedicalDetails(g);
        const waiver = getWaiver(g.waiver);

        return (
          <div key={g.id} className={`bg-zinc-800 rounded-xl border overflow-hidden transition-colors ${flagged ? "border-amber-500/40" : "border-zinc-700"}`}>
            {/* Row */}
            <button
              onClick={() => setExpanded(isExpanded ? null : g.id)}
              className="w-full px-4 py-3.5 text-left flex items-center gap-3 hover:bg-zinc-700/30 transition"
            >
              {/* Name + waiver */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-white truncate">{g.guest_name}</span>
                  {flagged && (
                    <span className="shrink-0 text-[10px] font-bold bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded-full uppercase tracking-wide">
                      Medical
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-500 truncate mt-0.5">{waiver?.title ?? "—"}</p>
              </div>

              {/* Date + chevron */}
              <div className="shrink-0 flex flex-col items-end gap-0.5">
                <div className="flex items-center gap-1 text-xs text-zinc-400">
                  {g.trip_date
                    ? new Date(g.trip_date + "T12:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" })
                    : new Date(g.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                  {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </div>
                {g.trip_time && <span className="text-[10px] text-arb-blue-light">{g.trip_time}</span>}
              </div>
            </button>

            {/* Expanded detail */}
            {isExpanded && (
              <div className="px-4 pb-4 border-t border-zinc-700/50 pt-3 space-y-3">

                {/* Medical warning banner */}
                {flagged && medicalDetails.length > 0 && (
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle size={14} className="text-amber-400 shrink-0" />
                      <span className="text-xs font-bold text-amber-400 uppercase tracking-wide">Medical / Health Note</span>
                    </div>
                    {medicalDetails.map((d, i) => (
                      <p key={i} className="text-xs text-amber-200/80">
                        <span className="font-semibold">{d.question}:</span> {d.answer}
                      </p>
                    ))}
                  </div>
                )}

                {/* Trip info */}
                {(g.trip_date || g.trip_time) && (
                  <div className="flex items-center gap-3 bg-zinc-700/30 rounded-lg px-3 py-2">
                    {g.trip_date && (
                      <div className="flex items-center gap-1.5 text-xs text-zinc-300">
                        <Calendar size={12} className="text-arb-blue-light" />
                        {new Date(g.trip_date + "T12:00:00").toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
                      </div>
                    )}
                    {g.trip_time && (
                      <div className="flex items-center gap-1.5 text-xs text-zinc-300">
                        <Clock size={12} className="text-arb-blue-light" />
                        {g.trip_time}
                      </div>
                    )}
                  </div>
                )}

                {/* Guest details */}
                <div className="grid grid-cols-2 gap-2">
                  {g.guest_email && (
                    <div className="col-span-2 flex items-center gap-2 text-sm text-zinc-300">
                      <Mail size={13} className="text-zinc-500 shrink-0" />
                      <span className="truncate">{g.guest_email}</span>
                    </div>
                  )}
                  {g.guest_age && (
                    <div className="flex items-center gap-2 text-sm text-zinc-300">
                      <Calendar size={13} className="text-zinc-500 shrink-0" />
                      Age {g.guest_age}
                    </div>
                  )}
                  {g.guest_country && (
                    <div className="flex items-center gap-2 text-sm text-zinc-300">
                      <MapPin size={13} className="text-zinc-500 shrink-0" />
                      {g.guest_country}
                    </div>
                  )}
                </div>

                {/* Signature */}
                {g.signature_url && (
                  <div>
                    <div className="flex items-center gap-2 text-xs text-zinc-500 mb-1.5">
                      <FileText size={12} />
                      Signature
                    </div>
                    <img src={g.signature_url} alt="Signature" className="h-14 bg-white rounded-lg p-1" />
                  </div>
                )}

                {/* Delete */}
                <div className="pt-2 border-t border-zinc-700 flex items-center justify-end gap-2">
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
                      <button onClick={() => setConfirming(null)} className="text-xs px-2 py-1 rounded bg-zinc-700 hover:bg-zinc-600 text-white transition">
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button onClick={() => setConfirming(g.id)} className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-red-400 transition">
                      <Trash2 size={13} />
                      Delete guest
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
