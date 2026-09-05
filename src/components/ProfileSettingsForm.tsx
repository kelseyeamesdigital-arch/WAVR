"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Upload, Save, CheckCircle } from "lucide-react";

type Profile = {
  business_name: string;
  logo_url: string | null;
  website: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  primary_color: string | null;
};

type Props = { userId: string; initial: Profile };

const inputCls = "w-full px-4 py-2.5 rounded-lg bg-zinc-900 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent text-sm";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-zinc-800 rounded-xl border border-zinc-700 p-5 space-y-4">
      <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">{title}</h2>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm text-zinc-300 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

export default function ProfileSettingsForm({ userId, initial }: Props) {
  const [businessName, setBusinessName] = useState(initial.business_name);
  const [website, setWebsite]           = useState(initial.website ?? "");
  const [address, setAddress]           = useState(initial.address ?? "");
  const [phone, setPhone]               = useState(initial.phone ?? "");
  const [email, setEmail]               = useState(initial.email ?? "");
  const [primaryColor, setPrimaryColor] = useState(initial.primary_color ?? "#1E9FD4");
  const [logoUrl, setLogoUrl]           = useState(initial.logo_url ?? "");

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving]       = useState(false);
  const [saved, setSaved]         = useState(false);
  const [error, setError]         = useState("");
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
    const { error: upErr } = await supabase.storage.from("logos").upload(path, file, { upsert: true });
    if (upErr) { setError(upErr.message); setUploading(false); return; }
    const { data } = supabase.storage.from("logos").getPublicUrl(path);
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
      address: address || null,
      phone: phone || null,
      email: email || null,
      primary_color: primaryColor,
      updated_at: new Date().toISOString(),
    });
    if (err) { setError(err.message); } else { setSaved(true); setTimeout(() => setSaved(false), 3000); }
    setSaving(false);
  }

  return (
    <div className="space-y-5">

      {/* Organisation */}
      <Section title="Organisation">
        <Field label="Business name">
          <input type="text" value={businessName} onChange={e => setBusinessName(e.target.value)}
            placeholder="Adventure Rafting Bled" className={inputCls} />
        </Field>
        <Field label="Address">
          <textarea value={address} onChange={e => setAddress(e.target.value)}
            placeholder="Cankarjevo nabrežje 9, 4260 Bled, Slovenia"
            rows={2} className={`${inputCls} resize-none`} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Phone">
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
              placeholder="+386 41 123 456" className={inputCls} />
          </Field>
          <Field label="Email">
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="info@example.com" className={inputCls} />
          </Field>
        </div>
        <Field label="Website">
          <input type="text" value={website} onChange={e => setWebsite(e.target.value)}
            placeholder="adventure-rafting.com" className={inputCls} />
        </Field>
      </Section>

      {/* Branding */}
      <Section title="Branding">
        {/* Logo */}
        <Field label="Logo">
          <p className="text-xs text-zinc-500 mb-3">Shown on the guest sign page. PNG or SVG, under 2MB.</p>
          {logoUrl && (
            <div className="bg-white rounded-xl p-3 inline-block mb-3">
              <img src={logoUrl} alt="Logo preview" className="h-16 w-auto object-contain" />
            </div>
          )}
          <div className="flex items-center gap-3 mb-3">
            <button onClick={() => fileRef.current?.click()} disabled={uploading}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-white text-sm font-medium transition disabled:opacity-50">
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
          <input type="text" value={logoUrl} onChange={e => setLogoUrl(e.target.value)}
            placeholder="Or paste a logo URL…" className={inputCls} />
        </Field>

        {/* Brand colour */}
        <Field label="Brand colour">
          <div className="flex items-center gap-3">
            <input type="color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)}
              className="w-10 h-10 rounded-lg border border-zinc-700 bg-zinc-900 cursor-pointer p-1" />
            <input type="text" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)}
              placeholder="#1E9FD4" className={`${inputCls} w-36`} />
            <span className="text-xs text-zinc-500">Used on buttons and accents</span>
          </div>
        </Field>
      </Section>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <button onClick={handleSave} disabled={saving || !businessName.trim()}
        className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-brand hover:bg-brand-light text-white font-semibold text-sm transition disabled:opacity-50">
        {saved ? <CheckCircle size={15} /> : <Save size={15} />}
        {saved ? "Saved!" : saving ? "Saving…" : "Save settings"}
      </button>
    </div>
  );
}
