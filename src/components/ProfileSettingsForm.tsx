"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Upload, Save, CheckCircle } from "lucide-react";

type Props = {
  userId: string;
  initial: { business_name: string; logo_url: string | null; website: string | null };
};

export default function ProfileSettingsForm({ userId, initial }: Props) {
  const [businessName, setBusinessName] = useState(initial.business_name);
  const [website, setWebsite] = useState(initial.website ?? "");
  const [logoUrl, setLogoUrl] = useState(initial.logo_url ?? "");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { setError("Logo must be under 2MB."); return; }

    setUploading(true);
    setError("");
    const supabase = createClient();
    const ext = file.name.split(".").pop();
    const path = `${userId}/logo.${ext}`;

    const { error: upErr } = await supabase.storage
      .from("logos")
      .upload(path, file, { upsert: true });

    if (upErr) { setError(upErr.message); setUploading(false); return; }

    const { data } = supabase.storage.from("logos").getPublicUrl(path);
    // Bust cache so updated logo shows immediately
    setLogoUrl(`${data.publicUrl}?t=${Date.now()}`);
    setUploading(false);
  }

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    setError("");
    const supabase = createClient();

    const { error: err } = await supabase.from("profiles").upsert({
      id: userId,
      business_name: businessName,
      logo_url: logoUrl || null,
      website: website || null,
      updated_at: new Date().toISOString(),
    });

    if (err) { setError(err.message); } else { setSaved(true); setTimeout(() => setSaved(false), 3000); }
    setSaving(false);
  }

  const inputCls = "w-full px-4 py-2.5 rounded-lg bg-zinc-900 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-wavr-blue focus:border-transparent text-sm";

  return (
    <div className="space-y-6">
      {/* Business name */}
      <div className="bg-zinc-800 rounded-xl border border-zinc-700 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wide">Organisation</h2>
        <div>
          <label className="block text-sm text-zinc-400 mb-1.5">Business name</label>
          <input
            type="text"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            placeholder="Adventure Rafting Bled"
            className={inputCls}
          />
        </div>
        <div>
          <label className="block text-sm text-zinc-400 mb-1.5">Website</label>
          <input
            type="text"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder="adventure-rafting.com"
            className={inputCls}
          />
        </div>
      </div>

      {/* Logo */}
      <div className="bg-zinc-800 rounded-xl border border-zinc-700 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wide">Logo</h2>
        <p className="text-xs text-zinc-500">Shown on the guest-facing sign page. PNG or SVG, under 2MB.</p>

        {logoUrl && (
          <div className="bg-white rounded-xl p-3 inline-block">
            <img src={logoUrl} alt="Logo preview" className="h-16 w-auto object-contain" />
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-white text-sm font-medium transition disabled:opacity-50"
          >
            <Upload size={14} />
            {uploading ? "Uploading…" : logoUrl ? "Replace logo" : "Upload logo"}
          </button>
          {logoUrl && (
            <button onClick={() => setLogoUrl("")} className="text-xs text-zinc-500 hover:text-red-400 transition">
              Remove
            </button>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />

        <div>
          <label className="block text-sm text-zinc-400 mb-1.5">Or paste a logo URL</label>
          <input
            type="text"
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
            placeholder="https://..."
            className={inputCls}
          />
        </div>
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <button
        onClick={handleSave}
        disabled={saving || !businessName.trim()}
        className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-wavr-blue hover:bg-wavr-blue-light text-white font-semibold text-sm transition disabled:opacity-50"
      >
        {saved ? <CheckCircle size={15} /> : <Save size={15} />}
        {saved ? "Saved!" : saving ? "Saving…" : "Save settings"}
      </button>
    </div>
  );
}
