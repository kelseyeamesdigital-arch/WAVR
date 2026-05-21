"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteWaiver } from "@/app/actions/delete";

export default function DeleteWaiverButton({ waiverId, waiverTitle }: { waiverId: string; waiverTitle: string }) {
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-zinc-400">Delete waiver + all its guests?</span>
        <button
          onClick={() => startTransition(() => deleteWaiver(waiverId))}
          disabled={pending}
          className="text-xs px-2 py-1 rounded bg-red-600 hover:bg-red-500 text-white font-semibold disabled:opacity-50 transition"
        >
          {pending ? "Deleting…" : "Yes, delete"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="text-xs px-2 py-1 rounded bg-zinc-700 hover:bg-zinc-600 text-white transition"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-red-400 transition"
      title={`Delete "${waiverTitle}"`}
    >
      <Trash2 size={14} />
      Delete
    </button>
  );
}
