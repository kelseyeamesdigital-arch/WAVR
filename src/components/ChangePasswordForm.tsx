"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { KeyRound, CheckCircle } from "lucide-react";

const inputCls = "w-full px-4 py-2.5 rounded-lg bg-zinc-900 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-wavr-blue focus:border-transparent text-sm";

export default function ChangePasswordForm() {
  const [password, setPassword]   = useState("");
  const [confirm, setConfirm]     = useState("");
  const [saving, setSaving]       = useState(false);
  const [saved, setSaved]         = useState(false);
  const [error, setError]         = useState("");

  async function handleSave() {
    setError("");
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (password !== confirm) { setError("Passwords don't match."); return; }

    setSaving(true);
    setSaved(false);
    const supabase = createClient();
    const { error: err } = await supabase.auth.updateUser({ password });
    if (err) {
      setError(err.message);
    } else {
      setSaved(true);
      setPassword("");
      setConfirm("");
      setTimeout(() => setSaved(false), 4000);
    }
    setSaving(false);
  }

  return (
    <div className="bg-zinc-800 rounded-xl border border-zinc-700 p-5 space-y-4">
      <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Account</h2>

      <div>
        <label className="block text-sm text-zinc-300 mb-1.5">New password</label>
        <input type="password" value={password} onChange={e => setPassword(e.target.value)}
          placeholder="At least 8 characters" autoComplete="new-password" className={inputCls} />
      </div>
      <div>
        <label className="block text-sm text-zinc-300 mb-1.5">Confirm new password</label>
        <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
          placeholder="Re-enter new password" autoComplete="new-password" className={inputCls} />
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <button onClick={handleSave} disabled={saving || !password || !confirm}
        className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-white font-semibold text-sm transition disabled:opacity-50">
        {saved ? <CheckCircle size={15} /> : <KeyRound size={15} />}
        {saved ? "Password updated!" : saving ? "Updating…" : "Change password"}
      </button>
    </div>
  );
}
